import os
import subprocess
from http import HTTPStatus
from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from flask_session import Session
import database
from util import get_price, send_email, gen_file_uuid, validate_data
from loguru import logger  
from functools import wraps
import config.variables as variables
from urllib.parse import quote_plus, urlencode
from authlib.integrations.flask_client import OAuth

# Init db
database.check_db_connect()
database.create_tables()

app = Flask(__name__, static_url_path='/static', static_folder='static')
app.secret_key = variables.APP_SECRET_KEY
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
    return render_template(
        "staff/index.html",
        session=session["user"]
    )

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
@app.route('/upload_model', methods=['POST'])
def upload_model():
    try:
        data = {
            'email': request.form.get('email', None),
            'file': request.files.get('file', None),
            'layerHeight': request.form.get('layer height', None),
            'nozzleWidth': request.form.get('nozzle width', None),
            'infill': request.form.get('infill', None),
            'supports': request.form.get('supports', None),
            'pieces': request.form.get('pieces', None),
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
        data['file'].save(model_path)
        gcode_path = f'uploads/{uuid}.gcode'

        # Generate G-code
        #TODO: Apply default config file and user prefernces
        command = f'./prusa.AppImage --export-gcode {model_path}'
        prusa_output = subprocess.getoutput(command)
        # Remove the original file
        os.remove(model_path)

         # Check if G-code was generated successfully
        if not os.path.exists(gcode_path):
            return jsonify({"error": f"Failed to generate G-code. Check your file."}), HTTPStatus.BAD_REQUEST
        
        # Grab Prusa suggestions
        lines = prusa_output.split('\n')
        suggestions = [line for line in lines if uuid not in line and '=>' not in line]
        price = get_price(gcode_path)

        if(data['pieces'] == 'single'):
            data['pieces'] = False
        else:
            data['pieces'] = True
        
        # Replace the original file with the path to the gcode
        data['file'] = gcode_path

         # Store key-value pairs in the session
        for key, value in data.items():
            session[key] = value
        
        session['price'] = price

        database.insert_order(session['email'], session['file'], session['price'], session['note'], session['layerHeight'],
        session['nozzleWidth'], session['infill'], session['supports'],
        session['pieces'])

        # TODO: If supports are off, turn them on and fetch price
        response_data = {'suggestions': suggestions, 'price': price}
        return jsonify(response_data), HTTPStatus.CREATED
    
    except Exception as e:
        logger.error(f"Error in upload_model route: {e}")
        return jsonify({'error': 'Internal Server Error'}), HTTPStatus.INTERNAL_SERVER_ERROR

app.route('/upload_model/publish', methods=['POST'])
def upload_model():
    supports = request.form.get('supports', None)
    
    validation_result = validate_data({'supports' : supports})
    if validation_result:
        return jsonify({"error": "Validation failed", "errors": validation_result}), HTTPStatus.BAD_REQUEST
    
    # TODO: set final decison on supports, update price if needed

    # Send email to the user to verify its valid
    if not send_email(variables.EPL_EMAIL, variables.EPL_EMAIL_APP_PASSWORD, session['email'], "Welcome to EPL."):
        # TODO: Clear session if email is invalid
        return jsonify({'error': 'f"Failed to verify {email}"'}), HTTPStatus.BAD_REQUEST

    # Store the order
    database.insert_order(session['email'], session['file'], session['price'], session['note'], session['layerHeight'],
        session['nozzleWidth'], session['infill'], session['supports'],
        session['pieces'])

    # Email the staff that a new order has been submitted
    for staff_email in database.get_staff_emails():
        send_email(staff_email, "A new order is pending.")

    response_data = {'message': 'Order Made, please await an approval email.'}
    return jsonify(response_data), HTTPStatus.CREATED

@app.route('/staff/orders', methods=['GET'])
@requires_auth
def get_orders():
    """
    Retrieve orders based on the specified type.

    Returns:
        A JSON response containing the retrieved orders.
    """
    
    order_type = request.args.get('type', 'all')

    if order_type == 'all':
        orders = database.get_orders()
    elif order_type == 'pending':
        orders = database.get_pending_orders()
    else:
        return jsonify({'error': 'Invalid order type'}), HTTPStatus.BAD_REQUEST

    # Remove file name from return data
    for order in orders:
        del order['file_name']

    return jsonify({'orders': orders}), HTTPStatus.OK

@app.route('/staff/return_orders', methods=['PUT'])
@requires_auth
def return_orders():
    # TODO: Provide a reason for denial and update user on statusvia email
    try:
        id = request.form['id']
        status = request.form['status']

        email = session['user']['userinfo']['email']

        if(status == 'denied'):
            database.delete_order(id)
        if(status == 'approved'):
            database.approve_order(id, email)
        return jsonify({'message': 'Update received'}), HTTPStatus.OK
    
    except Exception as e:
        logger.error(f"Error in return_orders route: {e}")
        return jsonify({'error': 'Internal Server Error'}), HTTPStatus.INTERNAL_SERVER_ERROR

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)