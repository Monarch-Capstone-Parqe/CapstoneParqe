import os
import psycopg2 as ps
import sqlalchemy as db
from sqlalchemy import Table, Column, String, MetaData, create_engine, text, insert
#from sqlalchemy.orm import sessionmaker

#Constants
#MAIL_ADDR_LEN = 40 #See --> https://stackoverflow.com/questions/1297272/how-long-should-sql-email-fields-be

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
        conn.execute(text("CREATE TABLE IF NOT EXISTS users("
                                                        "email VARCHAR PRIMARY KEY,"
                                                        "phone VARCHAR,"
                                                        "is_standard BOOLEAN NOT NULL,"
                                                        "is_staff BOOLEAN NOT NULL,"
                                                        "is_admin BOOLEAN NOT NULL)"))
        conn.execute(text("CREATE TABLE IF NOT EXISTS jobs("
                                                        "id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,"
                                                        "email VARCHAR,"
                                                        "cost NUMERIC(6,2) NOT NULL,"
                                                        "CONSTRAINT fk_user FOREIGN KEY(email) REFERENCES users(email) ON DELETE CASCADE)"))
        conn.commit()

# Performs an insert on the 'users' table
#   @email - string | PRIMARY KEY
#   @phone - string | NULLABLE
#   @standard - boolean | NOT NULLABLE
#   @staff - boolean | NOT NULLABLE
#   @admin - boolean | NOT NULLABLE
def insert_user(email="NULL", phone="NULL", standard=True, staff=False, admin=False):
    with engine.connect() as conn:
        conn.execute(text("INSERT INTO users VALUES (:email, :phone, :standard, :staff, :admin)"),
                            { "email":email, "phone":phone, "standard":standard, "staff":staff, "admin":admin })

        conn.commit()

# Performs in insert on the 'jobs' table
#   @id - integer | AUTOINCREMENT
#   @email - string | FOREIGN KEY -> 'users'
#   @cost - float | NOT NULLABLE | bounded in range $xxxx.xx
def insert_job(email="NULL", cost=-1):
    with engine.connect() as conn:
        conn.execute(text("INSERT INTO jobs(email, cost) VALUES (:email, :cost)"), 
                           { "email":email, "cost":cost })
    
        conn.commit()