from datetime import date

from sqlalchemy import create_engine, text
from sqlalchemy.exc import IntegrityError

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
    engine.connect()

# Create PARQE tables
def create_tables():
    with engine.connect() as conn:
        # This line is for development only
        conn.execute(text("DROP TABLE IF EXISTS staff, orders, approved_orders, denied_orders, pending_orders CASCADE"))

        # Create the staff table
        conn.execute(text("CREATE TABLE IF NOT EXISTS staff("
                            "id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,"
                            "email VARCHAR UNIQUE NOT NULL)"))
        
        # Create the orders table
        conn.execute(text("CREATE TABLE IF NOT EXISTS orders("
                            "id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,"
                            "email VARCHAR NOT NULL,"
                            "layer_height VARCHAR NOT NULL,"      
                            "nozzle_size VARCHAR NOT NULL,"      
                            "infill NUMERIC(3,2) NOT NULL,"          
                            "quantity INTEGER NOT NULL," 
                            "note VARCHAR,"
                            "gcode_path VARCHAR NOT NULL,"
                            "prusa_output VARCHAR NOT NULL,"
                            "price NUMERIC(6,2) NOT NULL,"
                            "date DATE DEFAULT CURRENT_DATE)"))

        # Create the approved_orders table with a foreign key reference to staff table
        conn.execute(text("CREATE TABLE IF NOT EXISTS approved_orders("
                            "order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,"
                            "reviewed_by INTEGER REFERENCES staff(id))"))

        # Create the denied_orders table with a foreign key reference to staff table
        conn.execute(text("CREATE TABLE IF NOT EXISTS denied_orders("
                            "order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,"
                            "reviewed_by INTEGER REFERENCES staff(id))"))

        # Create the pending_orders table with a foreign key reference to staff table
        conn.execute(text("CREATE TABLE IF NOT EXISTS pending_orders("
                            "order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE)"))
        
        # Create the filaments table
        conn.execute(text("CREATE TABLE IF NOT EXISTS filaments("
                          "id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,"
                          "type VARCHAR NOT NULL,"
                          "in_stock BOOLEAN NOT NULL)"))

        # Create the colors table
        conn.execute(text("CREATE TABLE IF NOT EXISTS colors("
                          "id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,"
                          "color VARCHAR NOT NULL)"))

        # Create the filament_colors table with a foreign key reference to the colors and filaments tables
        conn.execute(text("CREATE TABLE IF NOT EXISTS filament_colors("
                          "color_id INTEGER NOT NULL REFERENCES colors(id) ON DELETE CASCADE,"
                          "filament INTEGER NOT NULL REFERENCES filaments(id) ON DELETE CASCADE)"))

        conn.commit()


def insert_order(email, layer_height=None, nozzle_size=None, infill=None, quantity=None, note=None, prusa_output=None, gcode_path=None, price=None) -> int:
    """
    Insert a new order into the 'orders' and 'pending_orders' tables.

    Parameters:
        email (str): The email of the customer placing the order.
        layer_height (str): The layer height of the 3D print.
        nozzle_size (str): The nozzle size of the 3D print.
        infill (float): The infill percentage of the 3D print.
        quantity (int): The quantity of items ordered.
        note (str): Any additional notes or comments.
        prusa_output (str): The PrusaSlicer output file path.
        gcode_path (str): The G-code file path.
        price (float): The total price of the order.

    Returns:
        int: The ID of the inserted order.
    """
     
    with engine.begin() as conn:
        result = conn.execute(text("INSERT INTO orders(email, layer_height, nozzle_size, infill, quantity, note, prusa_output, gcode_path, price, date) "
                          "VALUES (:email, :layer_height, :nozzle_size, :infill, :quantity, :note, :prusa_output, :gcode_path, :price, :date) RETURNING id"),
                     {"email": email, "layer_height": layer_height, "nozzle_size": nozzle_size,
                      "infill": infill, "quantity": quantity, "note": note,
                      "prusa_output": prusa_output, "gcode_path": gcode_path, "price": price, "date": date.today()})
        
        order_id = result.fetchone()["id"]
        conn.execute(text("INSERT INTO pending_orders(order_id) VALUES (:order_id)"), {"order_id": order_id})
        conn.commit()

def get_orders():
    """
    Retrieve all orders from the 'orders' table.

    Returns:
        list: A list of dictionaries representing each order.
    """
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM orders ORDER BY date")).fetchall()
        return [dict(row) for row in result]

def get_pending_orders() -> list:
    """
    Retrieve all pending orders from the database.

    Returns:
        list: A list of dictionaries representing each pending order.
    """
    with engine.connect() as conn:
        result = conn.execute(text("SELECT o.* FROM orders o JOIN pending_orders p ON o.id = p.order_id ORDER BY o.date")).fetchall()
        return [dict(row) for row in result]

def get_approved_orders() -> list:
    """
    Retrieve all approved orders from the database.

    Returns:
        list: A list of dictionaries representing each approved order.
    """
    with engine.connect() as conn:
        result = conn.execute(text("SELECT o.* FROM orders o JOIN approved_orders a ON o.id = a.order_id ORDER BY o.date")).fetchall()
        return [dict(row) for row in result]

def get_denied_orders() -> list:
    """
    Retrieve all denied orders from the database.

    Returns:
        list: A list of dictionaries representing each denied order.
    """
    with engine.connect() as conn:
        result = conn.execute(text("SELECT o.* FROM orders o JOIN denied_orders d ON o.id = d.order_id ORDER BY o.date")).fetchall()
        return [dict(row) for row in result]

def delete_order(order_id):
    """
    Delete an order from the database based on its ID.

    Parameters:
        order_id (int): The ID of the order to be deleted.
    """
    with engine.connect() as conn: 
        conn.execute(text("DELETE FROM orders WHERE id=:order_id"), {"order_id": order_id})
        conn.commit()

def approve_order(order_id, email):
    """
    Approve an order by adding it to the approved_orders table and removing it from the pending_orders table.

    Parameters:
        order_id (int): The ID of the order to be approved.
        email (str): The email of the staff member approving the order.
    """
    with engine.connect() as conn:
        staff_id_result = conn.execute(text("SELECT id FROM staff WHERE email=:email"), {"email": email})
        staff_id = staff_id_result.fetchone()[0]  # Fetch the staff ID from the result

        conn.execute(text("INSERT INTO approved_orders(order_id, reviewed_by) VALUES (:order_id, :staff_id)"),
                     {"order_id": order_id, "staff_id": staff_id})

        conn.execute(text("DELETE FROM pending_orders WHERE order_id=:order_id"), {"order_id": order_id})
        conn.commit()

def deny_order(order_id, email):
    """
    Deny an order by adding it to the denied_orders table and removing it from the pending_orders table.

    Parameters:
        order_id (int): The ID of the order to be denied.
        email (str): The email of the staff member denying the order.
    """
    with engine.connect() as conn:
        staff_id_result = conn.execute(text("SELECT id FROM staff WHERE email=:email"), {"email": email})
        staff_id = staff_id_result.fetchone()[0]  # Fetch the staff ID from the result

        conn.execute(text("INSERT INTO denied_orders(order_id, reviewed_by) VALUES (:order_id, :staff_id)"),
                     {"order_id": order_id, "staff_id": staff_id})

        conn.execute(text("DELETE FROM pending_orders WHERE order_id=:order_id"), {"order_id": order_id})
        conn.commit()

def get_staff_emails() -> list:
    """
    Retrieve the emails of all staff members from the database.

    Returns:
        list: A list of email addresses of staff members.
    """
    with engine.connect() as conn:
        result = conn.execute(text("SELECT email FROM staff")).fetchall()
        staff_emails = [row[0] for row in result]
        return staff_emails
    
def get_staff_email(id):
    """
    Retrieve the email of a staff member from the database.

    Returns:
        str: The email associated with the given staff ID.
    """
    with engine.connect() as conn:
        staff_email_result = conn.execute(text("SELECT email FROM staff WHERE id=:id"),
                                    {"id": id})
        staff_email_dict = []
        for row in staff_email_result:
            row_as_dict = row._mapping
            staff_email_dict.append(dict(row_as_dict))
        staff_email = staff_email_dict[0]['email']
        return staff_email;

def get_email_by_order_id(order_id) -> str:
    """
    Retrieve the email associated with the given order ID.

    Parameters:
        order_id (int): The primary key of the order.

    Returns:
        str: The email associated with the given order ID.
    """
    with engine.connect() as conn:
        result = conn.execute(text("SELECT email FROM orders WHERE id = :order_id"), {"order_id": order_id}).scalar()
        return result if result else None
    
def add_staff_member(email) -> bool:
    """
    Add a new staff member to the 'staff' table if not already exists.

    Parameters:
        email (str): The email of the staff member to be added.

    Returns:
        bool: True if the staff member was added successfully, False if the email already exists.
    """
    with engine.connect() as conn:
        result = conn.execute(text("SELECT COUNT(*) FROM staff WHERE email = :email"), {"email": email})
        count = result.fetchone()[0]

        if count == 0:
            conn.execute(text("INSERT INTO staff(email) VALUES (:email)"), {"email": email})
            conn.commit()
            return True
        else:
            return False
        
def add_filament(type):
    """
    Add a new type of filament to the 'filaments' table if not already exists.

    Parameters: 
        type (str): The type of the filament to be added.
    """
    with engine.connect() as conn:
        filament_exists = conn.execute(text("SELECT EXISTS(SELECT 1 FROM filaments WHERE type = :type)"), {"type": type}).scalar()
        if not filament_exists:
            conn.execute(text("INSERT INTO filaments(type, in_stock) VALUES (:type, FALSE)"), {"type": type})

        conn.commit()

def update_filament(type, in_stock):
    """
    Update the availability status of a type of filament in the 'filaments' table.

    Parameters: 
        type (str): The type of the filament to be updated.
        in_stock (bool): True if the filament is in stock, false if not.
    """
    with engine.connect() as conn:
        conn.execute(text("UPDATE filaments SET in_stock=:in_stock WHERE type=:type"),
                     {"in_stock": in_stock, "type": type})

def remove_filament(type):
    """
    Remove a type of filament from the 'filaments' table.

    Parameters: 
        type (str): The type of the filament to be removed.
    """
    with engine.connect() as conn:
        conn.execute(text("DELETE FROM filaments WHERE type=:type"), {"type": type})

        conn.commit()
   
