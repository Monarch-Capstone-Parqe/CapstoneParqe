import os
from http import HTTPStatus
from flask import Flask, render_template, request, jsonify
import database
import mail
import re

app = Flask(__name__, static_url_path='/static', static_folder='static')

@app.route("/")
def home():
    return render_template("userAPI/index.html")

ALLOWED_EXTENSIONS = {'stl', 'stp', 'step', '3mf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Find the total filament cost
def find_cost_value(file_path):
    with open(file_path, 'r') as file:
        for line in file:
            if '; total filament cost =' in line:
                cost_match = re.search(r'\d+\.\d+', line)
                if cost_match:
                    return float(cost_match.group())

    return None

@app.route('/upload_model', methods=['POST'])
def upload_model():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), HTTPStatus.BAD_REQUEST

    file = request.files['file']
    email = request.form['email']
    note = request.form['note']

    if file.filename == '' or file == None:
        return jsonify({'error': 'No selected file or no filename provided'}), HTTPStatus.BAD_REQUEST

    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type'}), HTTPStatus.UNSUPPORTED_MEDIA_TYPE

    # TODO: give the file a unique name
    # Save and Process the file
    file.save('uploaded_model.' + file.filename.rsplit('.', 1)[1].lower())

    # TODO: Estimate the cost and store the proper file name
    # Store the order
    database.insert_order(email, "uploaded_model", 5, note)

    # Email the admin(s) that a new order has been submitted
    for staff_email in database.get_staff_emails():
        mail.send_email(staff_email, "A new order is pending.")

    response_data = {'message': 'File uploaded successfully', 'filename': file.filename}
    return jsonify(response_data), HTTPStatus.CREATED


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)

# Run prusaslicer
os.system('./prusa.AppImage --export-gcode models/bali.stl')