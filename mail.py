import smtplib, ssl

def send_email(sender_email, sender_password, receiver_email, message):
    port = 465
    smtp_server = "smtp.gmail.com"

    context = ssl.create_default_context()
    try:
        with smtplib.SMTP_SSL(smtp_server, port, context=context) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, receiver_email, message)
        print("Email sent successfully.")
        return True
    except smtplib.SMTPException as e:
        print(f"Error sending email: {e}")
        return False


