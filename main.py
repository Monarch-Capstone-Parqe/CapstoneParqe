import os
import subprocess
from http import HTTPStatus
from flask import Flask, render_template, request, jsonify, redirect, url_for, session
import database
import mail
from uuid import uuid4
from price import calc_price
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

def gen_file_name():
    file_name = str(uuid4())

    # Check if the file with the same name already exists
    while os.path.exists(file_name):
        file_name = str(uuid4())

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

      # Save file with a unique name in the 'uploads' directory
        _, ext = os.path.splitext(file.filename)
        new_name = gen_file_name()
        file_path = os.path.join('uploads', f'{new_name}{ext}')
        gcode_output_path = os.path.join('uploads', f'{new_name}.gcode')
        file.save(file_path)

        # Generate G-code
        command = f'./prusa.AppImage --export-gcode {file_path}'
        output = subprocess.getoutput(command)

        # Remove the original file
        os.remove(file_path)

        # Store the order
        price = calc_price(gcode_output_path)  # Assuming you have a price module
        database.insert_order(email, gcode_output_path, price, note)

        # Email the staff that a new order has been submitted
        for staff_email in database.get_staff_emails():
            mail.send_email(staff_email, "A new order is pending.")

        response_data = {'message': 'File uploaded successfully', 'filename': file.filename}
        return jsonify(response_data), HTTPStatus.CREATED
    
    except Exception as e:
        logger.error(f"Error in upload_model route: {e}")
        return jsonify({'error': 'Internal Server Error'}), HTTPStatus.INTERNAL_SERVER_ERROR


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