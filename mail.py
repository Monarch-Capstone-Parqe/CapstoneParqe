import smtplib, ssl

# Note: Sender email must allow less secure apps:
# https://myaccount.google.com/u/1/lesssecureapps?pli=1&pageId=none

# Reads the email and password stored in creds.txt
def read_credentials(file_path):
    with open(file_path, 'r') as file:
        lines = file.readlines()
        sender_email = lines[0].strip()
        password = lines[1].strip()
    return sender_email, password

def send_email(receiver_email, message):
    port = 465
    smtp_server = "smtp.gmail.com"
    sender_email, password = read_credentials("creds.txt")

    context = ssl.create_default_context()
    with smtplib.SMTP_SSL(smtp_server, port, context=context) as server:
        server.login(sender_email, password)
        server.sendmail(sender_email, receiver_email, message)

