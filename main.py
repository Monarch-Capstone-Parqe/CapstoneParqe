import os
from http import HTTPStatus
from flask import Flask, render_template, request, jsonify, redirect, url_for, session
import database
import mail
from uuid import uuid4
import price
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

ALLOWED_EXTENSIONS = {'stl', 'stp', 'step', '3mf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def gen_file_name(ext):
    file_name = str(uuid4()) + '.' + ext

    # Check if the file with the same name already exists
    while os.path.exists(file_name):
        file_name = str(uuid4()) + ext

    return file_name

# User uploads model and prefernces
# Parse, store, and return the results to the user
@app.route('/upload_model', methods=['POST'])
def upload_model():
    try:
        email = request.form['email']
        file = request.files['file']
        layerHeight = request.form['layer height']
        nozzleWidth = request.form['nozzle width']
        infill = request.form['infill']
        supports = request.form['supports']
        pieces = request.form['pieces']
        note = request.form['note']

        if not email:
            logger.info(f"Error in upload_model route: {e}")
            return jsonify({'error': 'Email is a required field'}), HTTPStatus.BAD_REQUEST
        
        # Send email to the user to verify its valid
        if not mail.send_email(variables.EPL_EMAIL, variables.EPL_EMAIL_APP_PASSWORD, email, "Welcome to EPL."):
            return jsonify({'error': 'f"Failed to verify {email}"'}), HTTPStatus.BAD_REQUEST

        if not note or note == '':
            note = None
        if file == None:
            return jsonify({'error': 'An stl, stp, step, or 3mf file is required'}), HTTPStatus.BAD_REQUEST

        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type'}), HTTPStatus.UNSUPPORTED_MEDIA_TYPE

        # Save file with a unique name
        file_name = gen_file_name(file.filename.rsplit('.', 1)[1].lower())
        file.save(file_name)

        # Generate G-code
        os.system(f'./prusa.AppImage --export-gcode /uploads/{file_name}')

        # Remove the original file
        os.remove(file_name)

        # Store the order
        database.insert_order(email, file_name, price.calc_price(file_name), note)

        # Email the staff that a new order has been submitted
        for staff_email in database.get_staff_emails():
            mail.send_email(staff_email, "A new order is pending.")

        response_data = {'message': 'File uploaded successfully', 'filename': file.filename}
        return jsonify(response_data), HTTPStatus.CREATED
    
    except Exception as e:
        logger.error(f"Error in upload_model route: {e}")
        return jsonify({'error': 'Internal Server Error'}), HTTPStatus.INTERNAL_SERVER_ERROR

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