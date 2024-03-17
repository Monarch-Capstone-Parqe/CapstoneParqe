import os
import subprocess
from urllib.parse import quote_plus, urlencode
from http import HTTPStatus
import smtplib

from flask import Flask, render_template, request, jsonify, redirect, url_for, session, send_file, abort
import logging
from flask_session import Session
import jwt
from functools import wraps
from authlib.integrations.flask_client import OAuth
from werkzeug.exceptions import HTTPException

import database as db
from util import get_price, gen_file_uuid, process_order_data, send_email
import config.variables as variables
import fuse
import json

# Init db
db.check_db_connect()
db.create_tables()
db.add_staff_member('mmahnke@pdx.edu')

# Init flask
app = Flask(__name__, static_url_path='/static', static_folder='static')
app.config["SECRET_KEY"] = variables.APP_SECRET_KEY
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

fuse.start_sending_orders()

# Init auth0
oauth = OAuth(app)
oauth.register(
    "auth0",
    client_id=variables.AUTH0_CLIENT_ID,
    client_secret=variables.AUTH0_CLIENT_SECRET,
    client_kwargs={
        "scope": "openid profile email",
    },
    server_metadata_url=f'https://{variables.AUTH0_DOMAIN}/.well-known/openid-configuration',
)

# Configure the Flask app logger
app.logger.addHandler(logging.FileHandler("app.log"))
app.logger.setLevel(logging.INFO)

@app.route("/")
def user_home():
    """Render the homepage for users."""
    return render_template("user/index.html")

def requires_auth(f):
    """Decorator to check if the staff is authenticated."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'token' not in session:
            return redirect(url_for('staff_login'))
        return f(*args, **kwargs)
    return decorated

@app.route('/staff')
@requires_auth
def staff_home():
    """Render the homepage for staff members."""
    return render_template("staff/index.html")

@app.route("/staff/callback", methods=["GET", "POST"])
def staff_callback():
    """Callback endpoint after successful staff authentication."""
    token = oauth.auth0.authorize_access_token()
    session["token"] = token
    return redirect("/staff")

@app.route("/staff/login")
def staff_login():
    """Redirect users to Auth0 for login."""
    return oauth.auth0.authorize_redirect(
        redirect_uri=url_for("staff_callback", _external=True)
    )

@app.route("/staff/logout")
@requires_auth
def staff_logout():
    """Logout the staff member."""
    session.clear()
    return redirect(
        "https://"
        + variables.AUTH0_DOMAIN
        + "/v2/logout?"
        + urlencode(
            {
                "returnTo": url_for("staff_home", _external=True),
                "client_id": variables.AUTH0_CLIENT_ID,
            },
            quote_via=quote_plus,
        )
    )

@app.route('/staff/verify', methods=['GET'])
@requires_auth
def staff_status():
    """Determine whether staff member is valid in database"""
    try:
        staff_email = session['token']['userinfo']['email']
        result = db.staff_email_exists(staff_email) 
        return jsonify({"status": result}), HTTPStatus.OK
    
    except Exception as e:
        app.logger.error(f"Error in staff/status route: {e}")
        return jsonify({'error': 'Internal Server Error'}), HTTPStatus.INTERNAL_SERVER_ERROR

@app.route('/order', methods=['POST'])
def order():
    """
    Endpoint for users to upload model and preferences.

    Returns:
        JSON response indicating the status of the operation.
    """
    try:
        errors = process_order_data(request.form, session)
        if errors:
            return abort(HTTPStatus.BAD_REQUEST, f"Invalid/Incomplete input: {errors}") 

        # Save the model with a unique name in the uploads directory
        _, ext = os.path.splitext(request.files.get('file').filename)
        uuid = gen_file_uuid()
        model_path = f'uploads/{uuid}{ext}'
        gcode_path = f'uploads/{uuid}.gcode'
        gcode_path_raw = f'{uuid}.gcode'

        # Save the file to disk
        request.files.get('file').save(model_path)

        # Generate G-code
        command = f'./prusa.AppImage --export-gcode {model_path} --layer-height {session["layer_height"]} --nozzle-diameter {session["nozzle_size"]} --infill-overlap {session["infill"]} --dont-arrange --load config/EPL_0.20mm_SPEED.ini'
        prusa_output = subprocess.getoutput(command)
        
        # Remove the original file
        os.remove(model_path)

        # Check if G-code was generated successfully
        if not os.path.exists(gcode_path):
            abort( HTTPStatus.BAD_REQUEST, jsonify(f"Failed to slice model. Check your file: {prusa_output}"))

        price = get_price(gcode_path)
        session['gcode_path'] = gcode_path_raw
        session['price'] = price
        session['prusa_output'] = prusa_output

        # Send email
        token = jwt.encode(payload={"email": session['email']}, key=app.config["SECRET_KEY"], algorithm="HS256")
        verification_url = url_for('confirm_order', token=token, _external=True)
        message = f"Press here to confirm your order: {verification_url}"
        send_email(session['email'], "EPL Verify Order", message)

        return jsonify('Model uploaded'), HTTPStatus.CREATED
    
    # Reraise client errors
    except HTTPException:
        raise  
    # Email exceptions
    except smtplib.SMTPException as e:
        abort( HTTPStatus.BAD_REQUEST, jsonify(f"Error sending email: {e}"))
    # Unkown
    except Exception as e:
        app.logger.critical(f"Error in order route: {e}")
        abort(HTTPStatus.INTERNAL_SERVER_ERROR)

@app.route("/confirm_order/<token>")
def confirm_order(token):
    """
    If this endpoint is visited with the correct token, the order is confirmed.

    Args:
        token: JWT token.

    Returns:
        JSON response indicating the status of the operation.
    """
    try:
        _ = jwt.decode(token, app.config["SECRET_KEY"], algorithms="HS256")
        session['verified'] = True

        # Store the order
        db.insert_order(
            session['email'],
            session['filament_type'],
            session['nozzle_size'], 
            session['layer_height'],  
            session['infill'],
            session['quantity'],
            session['note'],
            session['prusa_output'],
            session['gcode_path'],
            session['price']
        )
        
        return redirect(url_for('order_confirmed'))

    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), HTTPStatus.BAD_REQUEST
    except jwt.InvalidTokenError as e:
        return jsonify({"error": "Invalid token"}), HTTPStatus.BAD_REQUEST

@app.route("/order_confirmed")
def order_confirmed():
    """Render the order confirmation page."""
    return render_template("order_confirmed.html")

@app.route('/staff/get_orders/<order_type>', methods=['GET'])
@requires_auth
def get_orders(order_type):
    """
    Retrieve orders based on the specified type.

    Args:
        order_type: Type of orders to retrieve.

    Returns:
        JSON response containing the retrieved orders.
    """
    
    if order_type == 'all':
        orders = db.get_orders()
    elif order_type == 'pending':
        orders = db.get_pending_orders()
    elif order_type == 'approved':
        orders = db.get_approved_orders()
        for order in orders:
            order['approved_by'] = db.get_staff_email_by_approved_order_id(order['id'])
    elif order_type == 'denied':
        orders = db.get_denied_orders()
        for order in orders:
            order['denied_by'] = db.get_staff_email_by_denied_order_id(order['id'])
    elif order_type == 'paid':
        orders = db.get_paid_orders()
        for order in orders:
            order['checked_by'] = db.get_staff_email_by_paid_order_id(order['id'])
    elif order_type == 'print':
        orders = db.get_printing_orders()
    elif order_type == 'closed':
        orders = db.get_closed_orders()
    else:
        return jsonify({'error': 'Invalid order type'}), HTTPStatus.BAD_REQUEST

    return jsonify({'orders': orders}), HTTPStatus.OK

@app.route('/staff/get_gcode/<gcode_path>', methods=['GET'])
@requires_auth
def get_gcode(gcode_path):
    """
    Retrieve G-code.

    Args:
        gcode_path: Path to the G-code file.

    Returns:
        The G-code file.
    """
    
    try:
        search_path = f'uploads/{gcode_path}'
        return send_file(search_path, as_attachment=True)
    except FileNotFoundError:
        return jsonify({'error': 'File not found'}), HTTPStatus.NOT_FOUND
    except Exception as e:
        app.logger.error(f"Error in get_gcode route: {e}")
        return jsonify({'error': 'Internal Server Error'}), HTTPStatus.INTERNAL_SERVER_ERROR

@app.route('/staff/review_orders', methods=['PUT'])
@requires_auth
def review_orders():
    """
    Review and update orders.

    Returns:
        JSON response indicating the status of the operation.
    """
    try:
        # Grab order details
        order_id = request.form['id']
        order_status = request.form['status']
        order_email = db.get_email_by_order_id(order_id)
        staff_email = session['token']['userinfo']['email']

        if(order_status == 'denied'):
            reason = request.form['message']
            send_email(order_email, "EPL Order Denied", f"Reason: {reason}")
            db.deny_order(order_id, staff_email)

        elif(order_status == 'approved'):
            db.approve_order(order_id, staff_email)
            send_email(order_email, "EPL Order Approved", f"To pay for your order, proceed to {variables.EPL_PAY_SITE}")
        elif(order_status == 'confirm_payment'):
            db.pay_order(order_id, staff_email)
        else:
            return abort(HTTPStatus.BAD_REQUEST, jsonify({'error': f'"{order_status}" is an invalid status.'}))
        
        return jsonify({'message': 'Update received'}), HTTPStatus.OK
    
    # Reraise client errors
    except HTTPException:
        raise  
    # Unkown
    except Exception as e:
        app.logger.critical(f"Error in order route: {e}")
        abort(HTTPStatus.INTERNAL_SERVER_ERROR)

@app.route('/staff/filament/<action>', methods=['POST', 'PUT', 'DELETE'])
@requires_auth
def filament(action):
    """
    Modify filaments based on the specified action.

    Args:
        action: Action to be carried out
    """
    try:
        filament_type = request.form['filament_type']

        if action == 'add':
            in_stock = request.form['in_stock']
            db.add_filament(filament_type, in_stock)
            black_id = db.get_color_id('black')
            filament_id = db.get_filament_id(filament_type)
            db.add_filament_color(filament_id, black_id)
        elif action == 'update':
            in_stock = request.form['in_stock']
            db.update_filament(filament_type, in_stock)
        elif action == 'remove':
            db.remove_filament(filament_type)
        elif action == 'add_color':
            color_id = request.form['color_id'] 
            filament_id = db.get_filament_id(filament_type)
            db.add_filament_color(filament_id, color_id)
        elif action == 'remove_color':
            color_id = request.form['color_id'] 
            filament_id = db.get_filament_id(filament_type)
            db.remove_filament_color(filament_id, color_id)
        else:
            return jsonify({'error': 'Invalid action type'}), HTTPStatus.BAD_REQUEST
     
        return jsonify({'message': 'Update received'}), HTTPStatus.OK
    
    # Reraise client errors
    except HTTPException:
        raise  
    # Unkown
    except Exception as e:
        app.logger.critical(f"Error in filament route: {e}")
        abort(HTTPStatus.INTERNAL_SERVER_ERROR)
   
@app.route('/staff/color/<action>', methods=['POST', 'DELETE'])
@requires_auth
def color(action):
    """
    Modify colors based on the specified action.

    Args:
        action: Action to be carried out
    """

    try:
        if action == 'add':
            color_name = request.form['color']
            db.add_color(color_name)
        elif action == 'remove':
            db.remove_color(request.form['id'])
        else:
            return jsonify({'error': 'Invalid action type'}), HTTPStatus.BAD_REQUEST
        
        return jsonify({'message': 'Update received'}), HTTPStatus.OK
    
    # Reraise client errors
    except HTTPException:
        raise  
    # Unkown
    except Exception as e:
        app.logger.critical(f"Error in color route: {e}")
        abort(HTTPStatus.INTERNAL_SERVER_ERROR)

@app.route('/staff/get_filament_inventory', methods=['GET'])
def get_filament_inventory():
    """
    Retrieve filament inventory

    Returns:
        JSON response containing the retrieved filament types and associated colors
    """
    try:
        filaments = db.get_filaments()
        filament_colors = {}

        for each in filaments:
            filament_colors.update({each['id']: db.get_filament_colors(each['id'])})

        for each in filament_colors:
            for i in filament_colors[each]:
                i.update({'color': db.get_color(i['color_id'])})

        colors = db.get_colors()

        return jsonify({'filaments': filaments, 'filament_colors': filament_colors, 'colors': colors}), HTTPStatus.OK
    # Reraise client errors
    except HTTPException:
        raise  
    # Unkown
    except Exception as e:
        app.logger.critical(f"Error in filament inventory route: {e}")


@app.route('/staff/close_order', methods=['PUT'])
@requires_auth
def close_order():
    """
    Updates order status to completed or 'closed'.

    Returns:
        JSON response indicating the status of the operation.
    """
    try:
        # Grab order details
        order_id = request.form['id']
        db.close_order(order_id)
        order_email = db.get_email_by_order_id(order_id)
        send_email(order_email, "EPL Print Ready for Pickup", "Go get it.")
        return jsonify({'message': 'Order closed'}), HTTPStatus.OK

    # Unkown
    except Exception as e:
        app.logger.critical(f"Error in order route: {e}")
        abort(HTTPStatus.INTERNAL_SERVER_ERROR)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
    fuse.stop_sending_orders()
