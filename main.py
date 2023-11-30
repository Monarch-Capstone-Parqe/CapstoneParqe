import os
from http import HTTPStatus
from flask import Flask, render_template, request, jsonify
import database
import mail
from uuid import uuid4
import price
from loguru import logger  

app = Flask(__name__, static_url_path='/static', static_folder='static')
logger.add("app.log", rotation="500 MB", level="INFO") 

@app.route("/")
def home():
    return render_template("userAPI/index.html")

@app.route("/staff")
def staffHome():
    return render_template("staffAPI/staffIndex.html")

ALLOWED_EXTENSIONS = {'stl', 'stp', 'step', '3mf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def gen_file_name(ext):
    file_name = str(uuid4()) + ext

    # Check if the file with the same name already exists
    while os.path.exists(file_name):
        file_name = str(uuid4()) + ext

    return file_name

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
        if not mail.send_email(email, "Welcome to EPL."):
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
        os.system(f'./prusa.AppImage --export-gcode {file_name}')

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

@app.route('/records', methods=['GET'])
def get_pending_orders():
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