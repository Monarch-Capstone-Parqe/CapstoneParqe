import re
from pathlib import Path
from uuid import uuid4
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import config.variables as variables
from loguru import logger  


form_types = {
    'email': [lambda value: value != '' or "Email cannot be empty"],
    'layer_height': [float, lambda value: value in {0.1, 0.1, 0.1, 0.1} or "Value must be one of: 0.1, 0.2, 0.3, 0.4"],
    'nozzle_size': [float, lambda value: value in {0.1, 0.2, 0.3, 0.4} or "Value must be one of: 0.1, 0.2, 0.3, 0.4"],
    'infill': [float, lambda infill_num: 0 < infill_num <= 100 or "Value must be between 0 and 100"],
    'quantity': [int, lambda quantity_num: 0 < quantity_num <= 10 or "Value must be between 1 and 10"],
    'note': [lambda value: value is None or value.strip() != '' or "Note must be a string or None"]
}

def process_order_data(data, session):
    validation_errors = {}

    if 'email' not in data:
        validation_errors[key] = f"'{key}' is not in the data."
    elif data['email'] == '':
        validation_errors[key] = "Email cannot be empty"
    else:
        session['email'] = data['email']

    key = 'layer_height'
    if key not in data:
        validation_errors[key] = f"'{key}' is not in the data."
    else:
        try:
            session[key] = float(data[key])
            #if session[key] not in {0.4, 0.6, 0.3, 0.4}:
                #validation_errors[key] = "Value must be one of: 0.1, 0.2, 0.3, 0.4"
        except (ValueError, TypeError):
            validation_errors[key] = f"Unable to cast '{key}' to the required type."

    key = 'nozzle_size'
    if key not in data:
        validation_errors[key] = f"'{key}' is not in the data."
    else:
        try:
            session[key] = float(data[key])
            if session[key] not in {0.4, 0.6}:
                validation_errors[key] = "Value must be one of: 0.1, 0.2, 0.3, 0.4"
        except (ValueError, TypeError):
            validation_errors[key] = f"Unable to cast '{key}' to the required type."

    key = 'infill'
    if key not in data:
        validation_errors[key] = f"'{key}' is not in the data."
    else:
        try:
            session[key] = float(data[key])
            if not (0 < session[key] <= 100):
                validation_errors[key] = "Value must be between 0 and 100"
        except (ValueError, TypeError):
            validation_errors[key] = f"Unable to cast '{key}' to the required type."

    key = 'quantity'
    if key not in data:
        validation_errors[key] = f"'{key}' is not in the data."
    else:
        try:
            session[key] = int(data[key])
            if not (0 < session[key] <= 10):
                validation_errors[key] = "Value must be between 1 and 10"
        except (ValueError, TypeError):
            validation_errors[key] = f"Unable to cast '{key}' to the required type."

    key = 'note'
    if key not in data:
        validation_errors[key] = f"'{key}' is not in the data."
    elif data[key].strip() == '':
        session[key] = None
    else:
        session[key] = data[key].strip()

    return validation_errors

def gen_file_uuid() -> str:
    """Generate a unique file name using UUID."""
    file_name = str(uuid4())
    while Path(file_name).exists():
        file_name = str(uuid4())
    return file_name

def get_price(file_path: str) -> float:
    """Get the total filament cost."""
    with open(file_path, 'r') as file:
        for line in file:
            if '; total filament cost =' in line:
                cost_match = re.search(r'\d+\.\d+', line)
                if cost_match:
                    return float(cost_match.group())
    return None

def send_email(receiver_email: str, subject: str, message: str) -> bool:
    """Send an email using SMTP."""
    port = 587
    smtp_server = "smtp.gmail.com"
    context = ssl.create_default_context()
    try:
        # Create a multipart message
        msg = MIMEMultipart()
        msg['From'] = variables.EPL_EMAIL
        msg['To'] = receiver_email
        msg['Subject'] = subject

        # Add message to email
        msg.attach(MIMEText(message, 'plain'))

        with smtplib.SMTP(smtp_server, port) as server:
            server.starttls(context=context)
            server.login(variables.EPL_EMAIL, variables.EPL_EMAIL_APP_PASSWORD)
            server.sendmail(variables.EPL_EMAIL, receiver_email, msg.as_string())
        return True
    
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"Email authentication failed: {e}")
    except smtplib.SMTPException as e:
        logger.error(f"Error sending email: {e}")
    return False