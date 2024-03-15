import os
from dotenv import find_dotenv, load_dotenv

# Load environment variables
ENV_FILE = find_dotenv()
if ENV_FILE:
    load_dotenv(ENV_FILE)

AUTH0_CLIENT_ID = os.environ.get("AUTH0_CLIENT_ID")
AUTH0_CLIENT_SECRET = os.environ.get("AUTH0_CLIENT_SECRET")
AUTH0_DOMAIN = os.environ.get("AUTH0_DOMAIN")
APP_SECRET_KEY = os.environ.get("APP_SECRET_KEY")

DB_USERNAME = os.environ.get("DB_USERNAME")
DB_PASSWORD = os.environ.get("DB_PASSWORD")

EPL_EMAIL = os.environ.get("EPL_EMAIL")
EPL_EMAIL_PASSWORD = os.environ.get("EPL_EMAIL_PASSWORD")
EPL_EMAIL_APP_PASSWORD = os.environ.get("EPL_EMAIL_APP_PASSWORD")

FUSE_UPLOAD_ENDPOINT = os.environ.get("FUSE_UPLOAD_ENDPOINT")
EPL_PAY_SITE = os.environ.get("EPL_PAY_SITE")