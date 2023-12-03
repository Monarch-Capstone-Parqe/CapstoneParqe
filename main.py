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
        
        # Replace the original file with the path to the gcode
        data['file'] = gcode_path

        session['data'] = data

        response_data = {'suggestions': suggestions, 'price': price}
        return jsonify(response_data), HTTPStatus.CREATED
    
    except Exception as e:
        logger.error(f"Error in upload_model route: {e}")
        return jsonify({'error': 'Internal Server Error'}), HTTPStatus.INTERNAL_SERVER_ERROR

app.route('/upload_model/publish', methods=['POST'])
def upload_model():
    revised_data = {
            'supports': request.form.get('supports', None)
    }
    
    validation_result = validate_data(revised_data)
    if validation_result:
        return jsonify({"error": "Validation failed", "errors": validation_result}), HTTPStatus.BAD_REQUEST
    
    # Send email to the user to verify its valid
    if not send_email(variables.EPL_EMAIL, variables.EPL_EMAIL_APP_PASSWORD, data['email'], "Welcome to EPL."):
        return jsonify({'error': 'f"Failed to verify {email}"'}), HTTPStatus.BAD_REQUEST

    # Store the order
    database.insert_order(data['email'], gcode_path, price, data['note'])

    # Email the staff that a new order has been submitted
    for staff_email in database.get_staff_emails():
        send_email(staff_email, "A new order is pending.")

    response_data = {'message': 'File uploaded successfully', 'filename': file.filename}
    return jsonify(response_data), HTTPStatus.CREATED

@app.route('/staff/orders', methods=['GET'])
def get_orders():
    pending_orders = database.get_pending_orders()

    for order in pending_orders:
        file_name = order['file_name']
        del order['file_name']
        file_path = os.path.join('/uploads', file_name)
        if os.path.exists(file_path):
            order['file'] = file_path
        else:
            order['file'] = None

    return jsonify({'pending_orders': pending_orders}), HTTPStatus.OK

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)