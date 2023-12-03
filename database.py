import psycopg2 as ps
import sqlalchemy as db
from sqlalchemy import Table, Column, String, MetaData, create_engine, text, insert
from sqlalchemy.exc import SQLAlchemyError
#from sqlalchemy.orm import sessionmaker
from datetime import date
import config.variables as variables

#Constants
#MAIL_ADDR_LEN = 40 #See --> https://stackoverflow.com/questions/1297272/how-long-should-sql-email-fields-be


#DB_USERNAME & DB_PASSWORD exist as system environment variables
# -TODO Likely will make the whole DB_URI its own env var eventually
engine = create_engine(f'postgresql://{variables.DB_USERNAME}:{variables.DB_PASSWORD}@localhost:5432/parqe')

#################################
# CURRENTLY NO ORM UTILIZIATION #
#################################
#Sets up DB connection & information pipeline 
#conn = engine.connect()
#metadata = db.MetaData()
#metadata.reflect(bind=engine)

def check_db_connect():
    try:
        engine.connect()
        print("PostgreSQL Connection Established...")
    except SQLAlchemyError as e:
        print(f"PostgreSQL Connection Failed: [{e}]")
        return 1

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
                            "note VARCHAR,"
                            "layer_height VARCHAR NOT NULL,"      
                            "nozzle_width VARCHAR NOT NULL,"      
                            "infill INTEGER NOT NULL,"            
                            "supports VARCHAR NOT NULL,"          
                            "pieces BOOLEAN NOT NULL,"            
                            "price NUMERIC(6,2) NOT NULL,"
                            "date DATE DEFAULT CURRENT_DATE,"
                            "approved_by INTEGER REFERENCES staff(id) DEFAULT NULL)"))
        
        conn.commit()

def insert_order(email, file_name, price, note=None, layer_height=None, nozzle_width=None, infill=None, supports=None, pieces=None):
    with engine.connect() as conn:
        conn.execute(text("INSERT INTO orders(email, file_name, note, layer_height, nozzle_width, infill, supports, pieces, price, date) "
                          "VALUES (:email, :file_name, :note, :layer_height, :nozzle_width, :infill, :supports, :pieces, :price, :date)"),
                     {"email": email, "file_name": file_name, "note": note, "layer_height": layer_height, 
                      "nozzle_width": nozzle_width, "infill": infill, "supports": supports, "pieces": pieces, 
                      "price": price, "date": date.today()})

        conn.commit()

def get_orders():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM orders ORDER BY date")).fetchall()
        orders = []
        for row in result:
            row_as_dict = row._mapping
            orders.append(dict(row_as_dict))

        return orders

def get_pending_orders():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM orders WHERE approved_by IS NULL ORDER BY date")).fetchall()
        orders = []
        for row in result:
            row_as_dict = row._mapping
            #if(row_as_dict.approved_by != None):
                #continue
            orders.append(dict(row_as_dict))

        return orders

def delete_order(match):
    with engine.connect() as conn: 
        conn.execute(text("DELETE FROM orders WHERE id=:match"),
                        {"match": match})
        
        conn.commit()

def approve_order(match, email):
    with engine.connect() as conn:
        staff_id_result = conn.execute(text("SELECT id FROM staff WHERE email=:email"),
                                    {"email": email})
        staff_id_dict = []
        for row in staff_id_result:
            row_as_dict = row._mapping
            staff_id_dict.append(dict(row_as_dict))
        staff_id = staff_id_dict[0]['id']
        conn.execute(text("UPDATE orders SET approved_by=:staff_id WHERE id=:match"),
                            {"staff_id": staff_id, "match": match})
        
        conn.commit()
    
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

