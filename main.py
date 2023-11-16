import os
from http import HTTPStatus
from flask import Flask, render_template, request, jsonify

app = Flask(__name__, static_url_path='/static', static_folder='static')

@app.route("/")
def home():
    return render_template("userAPI/index.html")

ALLOWED_EXTENSIONS = {'stl', 'stp', 'step', '3mf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload_model', methods=['POST'])
def upload_model():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), HTTPStatus.BAD_REQUEST

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No selected file or no filename provided'}), HTTPStatus.BAD_REQUEST

    if file and allowed_file(file.filename):
        # Save and Process the file
        file.save('uploaded_model.' + file.filename.rsplit('.', 1)[1].lower())

        response_data = {'message': 'File uploaded successfully', 'filename': file.filename}
        return jsonify(response_data), HTTPStatus.CREATED  
    else:
        return jsonify({'error': 'Invalid file type'}), HTTPStatus.UNSUPPORTED_MEDIA_TYPE 


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)

# Run prusaslicer
#os.system('./prusa.AppImage --export-gcode models/bali.stl')