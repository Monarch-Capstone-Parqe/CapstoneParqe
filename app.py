import os
import subprocess
from http import HTTPStatus
from flask import Flask, render_template, request, jsonify, redirect, url_for, session, send_file
from flask_session import Session
import jwt
import database as db
from util import get_price, gen_file_uuid, process_order_data, send_email
from loguru import logger  
from functools import wraps
import config.variables as variables
from urllib.parse import quote_plus, urlencode
from authlib.integrations.flask_client import OAuth


# Init db
db.check_db_connect()
db.create_tables()

app = Flask(__name__, static_url_path='/static', static_folder='static')
app.config["SECRET_KEY"] = variables.APP_SECRET_KEY
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

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

logger.add("app.log", rotation="500 MB", level="INFO") 

@app.route("/")
def user_home():
    return render_template("user/index.html")

# Labels certain endpoints as privilged
def requires_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated

@app.route('/staff')
@requires_auth
def staff_home():
    return render_template("staff/index.html")

@app.route("/staff/callback", methods=["GET", "POST"])
def callback():
    token = oauth.auth0.authorize_access_token()
    session["user"] = token
    return redirect("/staff")

@app.route("/staff/login")
def login():
    return oauth.auth0.authorize_redirect(
        redirect_uri=url_for("callback", _external=True)
    )

@app.route("/staff/logout")
@requires_auth
def logout():
    session.clear()
    return redirect(
        "https://"
        + variables.AUTH0_DOMAIN
        + "/v2/logout?"
        + urlencode(
            {
                "returnTo": url_for("home", _external=True),
                "client_id": variables.AUTH0_CLIENT_ID,
            },
            quote_via=quote_plus,
        )
    )

# User uploads model and prefrences
@app.route('/order', methods=['POST'])
def order():
    try:
        errors = process_order_data(request.form, session)
        if errors:
            return jsonify({"Error": "Invalid/Incomplete input", "Log": errors}), HTTPStatus.BAD_REQUEST

        # Grab the extension and verify it
        _, ext = os.path.splitext(request.files.get('file').filename)
        if ext not in {'.stl', '.stp', '.step', '.3mf'}:
            return jsonify({"Error": "Invalid file format"}), HTTPStatus.BAD_REQUEST
        
        # Save the model with a unique name in the uploads directory
        uuid = gen_file_uuid()
        model_path = f'uploads/{uuid}{ext}'
        gcode_path = f'uploads/{uuid}.gcode'

        try:
            # Save the file to disk
            request.files.get('file').save(model_path)

            # Generate G-code
            command = f'./prusa.AppImage --export-gcode {model_path} --layer-height {session["layer_height"]} --nozzle-diameter {session["nozzle_size"]} --infill-overlap {session["infill"]} --dont-arrange --load EPL_0.20mm_SPEED.ini'
            prusa_output = subprocess.getoutput(command)
            # Remove the original file
            os.remove(model_path)

            # Check if G-code was generated successfully
            if not os.path.exists(gcode_path):
                return jsonify({"error": f"Failed to generate G-code. Check your file.", "log" : prusa_output}), HTTPStatus.BAD_REQUEST

        except Exception as e:
            print(f"Error: {e}")

        price = get_price(gcode_path)

        session['gcode_path'] = gcode_path
        session['price'] = price
        session['prusa_output'] = prusa_output

        # Send email
        token = jwt.encode(payload={"email": session['email']}, key=app.config["SECRET_KEY"], algorithm="HS256")
        verification_url = url_for('confirm_order', token=token, _external=True)
        message = f"Press here to confirm your order: {verification_url}"
        send_email(session['email'], "EPL Verify Purchase", message)

        return jsonify('Model uploaded'), HTTPStatus.CREATED
    
    except Exception as e:
        logger.error(f"Error in order route: {e}")
        return jsonify({'error': 'Internal Server Error'}), HTTPStatus.INTERNAL_SERVER_ERROR

@app.route("/confirm_order/<token>")
def confirm_order(token):
    try:
        _ = jwt.decode(token, app.config["SECRET_KEY"], algorithms="HS256")
        session['verified'] = True

        # Store the order
        db.insert_order(
            session['email'],
            session['layer_height'],  
            session['nozzle_size'], 
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
    return "Order confirmed."

@app.route('/staff/get_orders/<order_type>', methods=['GET'])
@requires_auth
def get_orders(order_type):
    """
    Retrieve orders based on the specified type.

    Returns:
        A JSON response containing the retrieved orders.
    """
    
    if order_type == 'all':
        orders = db.get_orders()
    elif order_type == 'pending':
        orders = db.get_pending_orders()
    else:
        return jsonify({'error': 'Invalid order type'}), HTTPStatus.BAD_REQUEST

    return jsonify({'orders': orders}), HTTPStatus.OK

@app.route('/staff/get_gcode/<gcode_path>', methods=['GET'])
@requires_auth
def get_gcode(gcode_path):
    """
    Retrieve orders based on the specified type.

    Returns:
        A JSON response containing the retrieved orders.
    """
    
    try:
        return send_file(gcode_path, as_attachment=True)
    except FileNotFoundError:
        return jsonify({'error': 'File not found'}), HTTPStatus.NOT_FOUND
    except Exception as e:
        logger.error(f"Error in get_gcode route: {e}")
        return jsonify({'error': 'Internal Server Error'}), HTTPStatus.INTERNAL_SERVER_ERROR


@app.route('/staff/return_orders', methods=['PUT'])
@requires_auth
def return_orders():
    try:
        # Grab order details
        order_id = request.form['id']
        order_status = request.form['status']
        order_comment = request.form['comment']
        order_email = db.get_email_by_order_id(order_id)
        staff_email = session['user']['userinfo']['email']

        if(order_status == 'denied'):
            db.delete_order(order_id)
        elif(order_status == 'approved'):
            db.approve_order(order_id, staff_email)
        else:
            return jsonify({'error': f'"{order_status}" is an invalid status.'}), HTTPStatus.BAD_REQUEST
        
        message = f"Your order has been {order_status}. {order_comment}"
        send_email(order_email, "EPL Verify Purchase", message)

        return jsonify({'message': 'Update received'}), HTTPStatus.OK
    
    except Exception as e:
        logger.error(f"Error in return_orders route: {e}")
        return jsonify({'error': 'Internal Server Error'}), HTTPStatus.INTERNAL_SERVER_ERROR

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)