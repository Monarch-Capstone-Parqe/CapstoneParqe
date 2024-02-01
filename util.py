import re
import smtplib
import ssl
from pathlib import Path
from uuid import uuid4
from werkzeug.datastructures import FileStorage
from loguru import logger  

form_types = {
    'email': [str, lambda value: value != ''],
    'file': [FileStorage, lambda filename: '.' in filename and filename.rsplit('.', 1)[1].lower() in {'stl', 'stp', 'step', '3mf'}],
    'layerHeight': [float, lambda value: value in {0.1, 0.2, 0.3, 0.4}],
    'nozzleWidth': [float, lambda value: value in {0.1, 0.2, 0.3, 0.4}],
    'infill': [int, lambda infill_num: 0 < infill_num <= 100],
    'count': [int, lambda infill_num: 0 < infill_num <= 10],
    'note': [lambda value: value is None or isinstance(value, str)]
}

def validate_data(data):
    validation_errors = {}

    for key, value in data.items():
        # Ignore extra data
        if key not in form_types:
            continue

        types = form_types[key]

        if not any(isinstance(value, t) if not callable(t) else t(value) for t in types):
            validation_errors[key] = f"Invalid type for {key}. Expected types: {', '.join(map(str, types))}"

    if validation_errors:
        return validation_errors
    else:
        return None  

def gen_file_uuid() -> str:
    """Generate a unique file name using UUID."""
    file_name = str(uuid4())
    while Path(file_name).exists():
        file_name = str(uuid4())
    return file_name

def send_email(sender_email: str, sender_password: str, receiver_email: str, message: str) -> bool:
    """Send an email using SMTP."""
    port = 465
    smtp_server = "smtp.gmail.com"
    context = ssl.create_default_context()
    try:
        with smtplib.SMTP_SSL(smtp_server, port, context=context) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, receiver_email, message)
        return True
    
    except smtplib.SMTPAuthenticationError as e:
        logger.info(f"Email authentication failed: {e}")
    except smtplib.SMTPException as e:
        logger.info(f"Error sending email: {e}")
    return False

def get_price(file_path: str) -> float:
    """Get the total filament cost."""
    with open(file_path, 'r') as file:
        for line in file:
            if '; total filament cost =' in line:
                cost_match = re.search(r'\d+\.\d+', line)
                if cost_match:
                    return float(cost_match.group())
    return None
