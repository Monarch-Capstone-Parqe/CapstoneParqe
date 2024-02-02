import os
import subprocess
from http import HTTPStatus
from flask import Flask, render_template, request, jsonify, redirect, url_for, session, send_file
from flask_session import Session
from flask_redmail import RedMail
import jwt
import database
from util import get_price, gen_file_uuid, validate_data
from loguru import logger  
from functools import wraps
import config.variables as variables
from urllib.parse import quote_plus, urlencode
from authlib.integrations.flask_client import OAuth

# Init db
database.check_db_connect()
database.create_tables()

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

app.config["EMAIL_HOST"] = "smtp.gmail.com"
app.config["EMAIL_PORT"] = 587
app.config["EMAIL_SENDER"] = variables.EPL_EMAIL
app.config["EMAIL_USERNAME"] = variables.EPL_EMAIL
app.config["EMAIL_PASSWORD"] = variables.EPL_EMAIL_APP_PASSWORD
email = RedMail(app)

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

# User uploads model and prefernces
# Parse, store, and return the results to the user
@app.route('/order', methods=['POST'])
def order():
    try:
        data = {
            'email': request.form.get('email', None),
            'file': request.files.get('file', None),
            'layer_height': request.form.get('layer height', None),
            'nozzle_width': request.form.get('nozzle width', None),
            'infill': request.form.get('infill', None),
            'quantity': request.form.get('quantity', None),
            'note': request.form.get('note', None)
        }

        validation_result = validate_data(data)
        if validation_result:
            return jsonify({"error": "Validation failed", "errors": validation_result}), HTTPStatus.BAD_REQUEST

        # Check if note is empty string
        if data['note'] == '':
            data['note'] = None
        
      # Save the model with a unique name in the uploads directory
        _, ext = os.path.splitext(data['file'].filename)
        uuid = gen_file_uuid()
        model_path = f'uploads/{uuid}{ext}'
        gcode_path = f'uploads/{uuid}.gcode'

        try:
            # Attempt to save the file
            data['file'].save(model_path)

            # Generate G-code
            command = f'./prusa.AppImage --export-gcode {model_path} --layer-height {data["layer_height"]} --nozzle-diameter {data["nozzle_width"]} --infill-overlap {data["infill"]} --dont-arrange --load config.ini'
            prusa_output = subprocess.getoutput(command)
            # Remove the original file
            os.remove(model_path)

            # Check if G-code was generated successfully
            if not os.path.exists(gcode_path):
                return jsonify({"error": f"Failed to generate G-code. Check your file.", "log" : prusa_output}), HTTPStatus.BAD_REQUEST

        except Exception as e:
            print(f"Error: {e}")
        
        price = get_price(gcode_path)
        
        # Store key-value pairs in the session
        session['email'] = data['email']
        session['gcode_path'] = gcode_path
        session['layer_height'] = data['layer_height']
        session['nozzle_width'] = data['nozzle_width']
        session['infill'] = data['infill']
        session['quantity'] = data['quantity']
        session['note'] = data['note']
        session['price'] = price
        session['prusa_output'] = prusa_output

        # Send email
        token = jwt.encode(payload={"email": data['email']}, key=app.config["SECRET_KEY"], algorithm="HS256")
        verification_url = url_for('confirm_order', token=token, _external=True)
        html_template = render_template('confirm_order.html', verification_url=verification_url)

        try:
            email.send(
            subject="Verify email",
            receivers=data['email'],
            html=html_template,
            body_params={
                "token": token
            }
        )
        except Exception as e:
            print(f"Email sending failed. Error: {e}")
            return jsonify({"error": "Invalid email"}), HTTPStatus.BAD_REQUEST

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
        database.insert_order(
            session['email'],
            session['layerHeight'],  
            session['nozzleWidth'], 
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
        orders = database.get_orders()
    elif order_type == 'pending':
        orders = database.get_pending_orders()
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
    # TODO: Provide a reason for denial and update user on statusvia email
    try:
        id = request.form['id']
        status = request.form['status']
        message = request.form['message']

        email = session['user']['userinfo']['email']

        if(status == 'denied'):
            database.delete_order(id)
            if not send_email(variables.EPL_EMAIL, variables.EPL_EMAIL_APP_PASSWORD, session['email'], "Your 3D design submission to the EPL has been denied for the following reason(s): " + message):
                return jsonify({'error': 'f"Failed to verify {email}"'}), HTTPStatus.BAD_REQUEST
        if(status == 'approved'):
            database.approve_order(id, email)
        return jsonify({'message': 'Update received'}), HTTPStatus.OK
    
    except Exception as e:
        logger.error(f"Error in return_orders route: {e}")
        return jsonify({'error': 'Internal Server Error'}), HTTPStatus.INTERNAL_SERVER_ERROR

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)