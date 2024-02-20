import re
from pathlib import Path
from uuid import uuid4
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import config.variables as variables

def process_order_data(data, session):
    validation_errors = {}

    key = 'email'
    if key not in data:
        validation_errors[key] = f"'{key}' is not in the data."
    elif data[key] == '':
        validation_errors[key] = f"'{key}' cannot be empty."
    else:
        session[key] = data[key]

    key = 'filament_type'
    if key not in data:
        validation_errors[key] = f"'{key}' is not in the data."
    elif data[key] == '':
        validation_errors[key] = f"'{key}' cannot be empty."
    else:
        session[key] = data[key]

    key = 'nozzle_size'
    if key not in data:
        validation_errors[key] = f"'{key}' is not in the data."
    else:
        try:
            session[key] = float(data[key])
            if session[key] not in {0.4, 0.6}:
                validation_errors[key] = "Value must be one of: 0.4, 0.6"
        except (ValueError, TypeError):
            validation_errors[key] = f"Unable to cast '{key}' to the required type."

    key = 'layer_height'
    if key not in data:
        validation_errors[key] = f"'{key}' is not in the data."
    else:
        try:
            session[key] = float(data[key])
            if session[key] not in {0.1, 0.15, 0.2, 0.3}:
                validation_errors[key] = "Value must be one of: 0.1, 0.15, 0.2, 0.3"
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

def send_email(receiver_email: str, subject: str, message: str):
    """Send an email using SMTP."""
    port = 587
    smtp_server = "smtp.gmail.com"
    context = ssl.create_default_context()
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
    
    