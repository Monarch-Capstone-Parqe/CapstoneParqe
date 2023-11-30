import os
import psycopg2 as ps
import sqlalchemy as db
from sqlalchemy import Table, Column, String, MetaData, create_engine, text, insert
#from sqlalchemy.orm import sessionmaker
from datetime import date
import os

#Constants
#MAIL_ADDR_LEN = 40 #See --> https://stackoverflow.com/questions/1297272/how-long-should-sql-email-fields-be


# Set environment variables
os.environ["DB_USERNAME"] = "your_username"
os.environ["DB_PASSWORD"] = "your_password"

#DB_USERNAME & DB_PASSWORD exist as system environment variables
# -TODO Likely will make the whole DB_URI its own env var eventually
engine = db.create_engine(f'postgresql://{os.environ["DB_USERNAME"]}:{os.environ["DB_PASSWORD"]}@localhost:5432/parqe')

#################################
# CURRENTLY NO ORM UTILIZIATION #
#################################
#Sets up DB connection & information pipeline 
#conn = engine.connect()
#metadata = db.MetaData()
#metadata.reflect(bind=engine)

# Create PARQE tables
def create_tables():
    with engine.connect() as conn:
        conn.execute(text("CREATE TABLE IF NOT EXISTS staff("
                            "id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,"
                            "email VARCHAR UNIQUE NOT NULL)"))
        
        conn.execute(text("CREATE TABLE IF NOT EXISTS orders("
                            "id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,"
                            "email VARCHAR NOT NULL,"
                            "file_name VARCHAR NOT NULL,"
                            "price NUMERIC(6,2) NOT NULL,"
                            "note VARCHAR,"
                            "date DATE DEFAULT CURRENT_DATE,"
                            "approved_by INTEGER REFERENCES staff(id) DEFAULT NULL)"))
        conn.commit()

def insert_order(email, file, price, note=None):
    with engine.connect() as conn:
        conn.execute(text("INSERT INTO orders(email, file_name, price, note, date) "
                          "VALUES (:email, :file, :price, :note, :date)"),
                     {"email": email, "file": file, "price": price, "note": note, "date": date.today()})

        conn.commit()

def get_orders():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM orders ORDER BY date")).fetchall()
        orders = [dict(row) for row in result]
        return orders
    
def add_staff(email):
    with engine.connect() as conn:
        # Check if the admin exists, if not, add to the staff table
        admin_exists = conn.execute(text("SELECT EXISTS(SELECT 1 FROM staff WHERE email = :email)"), {"email": email}).scalar()
        if not admin_exists:
            conn.execute(text("INSERT INTO staff(email) VALUES (:email)"), {"email": email})

        conn.commit()

def get_staff_emails():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT email FROM staff")).fetchall()
        staff_emails = [row[0] for row in result]
        return staff_emails

