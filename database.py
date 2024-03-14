from datetime import date
from sqlalchemy import create_engine, text, MetaData
import config.variables as variables

# Create engine and metadata
engine = create_engine(f'postgresql://{variables.DB_USERNAME}:{variables.DB_PASSWORD}@localhost:5432/parqe')
metadata = MetaData()
metadata.reflect(bind=engine)

def check_db_connect():
    engine.connect()

# Create PARQE tables
def create_tables():
    with engine.connect() as conn:
        # Note: reviewed_by keeps track of the either who approved/denied the order or who confirmed payment, which ever is more recent.

        # Create the staff table
        conn.execute(text("CREATE TABLE IF NOT EXISTS staff("
                            "id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,"
                            "email VARCHAR UNIQUE NOT NULL)"))
        
        # Create the orders table
        conn.execute(text("CREATE TABLE IF NOT EXISTS orders("
                            "id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,"
                            "email VARCHAR NOT NULL,"
                            "filament_type VARCHAR NOT NULL,"      
                            "nozzle_size VARCHAR NOT NULL,"      
                            "layer_height VARCHAR NOT NULL,"
                            "infill NUMERIC(3,2) NOT NULL,"          
                            "quantity INTEGER NOT NULL," 
                            "note VARCHAR,"
                            "gcode_path VARCHAR NOT NULL,"
                            "prusa_output VARCHAR NOT NULL,"
                            "price NUMERIC(6,2) NOT NULL,"
                            "date DATE DEFAULT CURRENT_DATE)"))

        # Create the approved_orders table
        conn.execute(text("CREATE TABLE IF NOT EXISTS approved_orders("
                            "order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,"
                            "reviewed_by INTEGER REFERENCES staff(id))"))

        # Create the denied_orders table 
        conn.execute(text("CREATE TABLE IF NOT EXISTS denied_orders("
                            "order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,"
                            "reviewed_by INTEGER REFERENCES staff(id))"))

        # Create the pending_orders table
        conn.execute(text("CREATE TABLE IF NOT EXISTS pending_orders("
                            "order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE)"))
        
        # Create the paid_orders table
        conn.execute(text("CREATE TABLE IF NOT EXISTS paid_orders("
                            "order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,"
                            "reviewed_by INTEGER REFERENCES staff(id))"))
        
        # Create the printing_orders table
        conn.execute(text("CREATE TABLE IF NOT EXISTS printing_orders("
                            "order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE)"))
        
        # Create the closed orders table
        conn.execute(text("CREATE TABLE IF NOT EXISTS closed_orders("
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
                          "filament_id INTEGER NOT NULL REFERENCES filaments(id) ON DELETE CASCADE)"))

        # Populate colors table with default black color 
        color_exists = conn.execute(text("SELECT EXISTS(SELECT 1 FROM colors WHERE color = :color)"), {"color": "black"}).scalar()
        if not color_exists:
           conn.execute(text("INSERT INTO colors(color) VALUES (:color)"), {"color": "black"})

        conn.commit()

def insert_order(email, filament_type=None, nozzle_size=None, layer_height=None, infill=None, quantity=None, note=None, prusa_output=None, gcode_path=None, price=None) -> int:
    """
    Insert a new order into the 'orders' and 'pending_orders' tables.

    Parameters:
        email (str): The email of the customer placing the order.
        filament_type (str): The material and color of the filament.
        nozzle_size (str): The nozzle size of the 3D print.
        layer_height (str): The layer height of the 3D print.
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
        result = conn.execute(text("INSERT INTO orders(email, filament_type, nozzle_size, layer_height, infill, quantity, note, prusa_output, gcode_path, price, date) "
                          "VALUES (:email, :filament_type, :nozzle_size, :layer_height, :infill, :quantity, :note, :prusa_output, :gcode_path, :price, :date) RETURNING id"),
                     {"email": email, "filament_type": filament_type, "nozzle_size": nozzle_size, "layer_height": layer_height, 
                      "infill": infill, "quantity": quantity, "note": note,
                      "prusa_output": prusa_output, "gcode_path": gcode_path, "price": price, "date": date.today()})
        
        order_id = result.fetchone()[0]
        conn.execute(text("INSERT INTO pending_orders(order_id) VALUES (:order_id)"), {"order_id": order_id})
        conn.commit()

def fetch_orders(query) -> list:
    """
    Retrieve orders from the database based on the given query.

    Parameters:
        query (str): The SQL query to retrieve orders.

    Returns:
        list: A list of dictionaries representing each order.
    """
    orders_table = metadata.tables['orders']
    column_names = orders_table.columns.keys()

    with engine.connect() as conn:
        result = conn.execute(text(query)).fetchall()
        if not result:
            return []  # Return an empty list if no orders are found
        orders = []
        for row in result:
            row_dict = dict(zip(column_names, row))  # Create dictionary using column names
            orders.append(row_dict)
        return orders

def get_orders() -> list:
    """
    Retrieve all orders from the 'orders' table.

    Returns:
        list: A list of dictionaries representing each order.
    """
    return fetch_orders("SELECT * FROM orders ORDER BY date")

def get_pending_orders() -> list:
    """
    Retrieve all pending orders from the database.

    Returns:
        list: A list of dictionaries representing each pending order.
    """
    return fetch_orders("SELECT o.* FROM orders o JOIN pending_orders p ON o.id = p.order_id ORDER BY o.date")

def get_approved_orders() -> list:
    """
    Retrieve all approved orders from the database.

    Returns:
        list: A list of dictionaries representing each approved order.
    """
    return fetch_orders("SELECT o.* FROM orders o JOIN approved_orders a ON o.id = a.order_id ORDER BY o.date")

def get_paid_orders() -> list:
    """
    Retrieve all paid orders from the database.

    Returns:
        list: A list of dictionaries representing each paid order.
    """
    return fetch_orders("SELECT o.* FROM orders o JOIN paid_orders a ON o.id = a.order_id ORDER BY o.date")

def get_printing_orders() -> list:
    """
    Retrieve all printing orders from the database.

    Returns:
        list: A list of dictionaries representing each printing order.
    """
    return fetch_orders("SELECT o.* FROM orders o JOIN printing_orders a ON o.id = a.order_id ORDER BY o.date")

def get_closed_orders() -> list:
    """
    Retrieve all closed orders from the database.

    Returns:
        list: A list of dictionaries representing each closed order.
    """
    return fetch_orders("SELECT o.* FROM orders o JOIN closed_orders a ON o.id = a.order_id ORDER BY o.date")

def get_denied_orders() -> list:
    """
    Retrieve all denied orders from the database.

    Returns:
        list: A list of dictionaries representing each denied order.
    """
    return fetch_orders("SELECT o.* FROM orders o JOIN denied_orders d ON o.id = d.order_id ORDER BY o.date")

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

def pay_order(order_id, email):
    """
    Add an order to the 'paid_orders' table and remove it from the 'approved_orders' table.

    Parameters:
        order_id (int): The ID of the order.
        email (str): The email of the staff member confirming the payment.
    """
    with engine.connect() as conn:
        # Fetch the staff ID using the provided email
        staff_id_result = conn.execute(text("SELECT id FROM staff WHERE email=:email"), {"email": email})
        staff_id = staff_id_result.fetchone()[0]  # Fetch the staff ID from the result
        
        # Add the order to the 'paid_orders' table
        add_query = text("""
            INSERT INTO paid_orders (order_id, reviewed_by)
            VALUES (:order_id, :staff_id)
        """)
        conn.execute(add_query, {'order_id': order_id, 'staff_id': staff_id})

        # Remove the order from the 'approved_orders' table
        remove_query = text("""
            DELETE FROM approved_orders
            WHERE order_id = :order_id
        """)
        conn.execute(remove_query, {'order_id': order_id})
        conn.commit()

def print_order(order_id):
    """
    Add an order to the 'printing_orders' table and remove it from the 'paid_orders' table.

    Parameters:
        order_id (int): The ID of the order.
    """
    with engine.connect() as conn:
        # Add the order to the 'printing_orders' table
        add_query = text("""
            INSERT INTO printing_orders (order_id)
            VALUES (:order_id)
        """)
        conn.execute(add_query, {'order_id': order_id})

        # Remove the order from the 'paid_orders' table
        remove_query = text("""
            DELETE FROM paid_orders
            WHERE order_id = :order_id
        """)
        conn.execute(remove_query, {'order_id': order_id})
        conn.commit()

def close_order(order_id):
    """
    Add an order to the 'closed_orders' table and remove it from the 'printing_orders' table.

    Parameters:
        order_id (int): The ID of the order.
    """
    with engine.connect() as conn:
        # Add the order to the 'closed_orders' table
        add_query = text("""
            INSERT INTO closed_orders (order_id)
            VALUES (:order_id)
        """)
        conn.execute(add_query, {'order_id': order_id})

        # Remove the order from the 'printing_orders' table
        remove_query = text("""
            DELETE FROM printing_orders
            WHERE order_id = :order_id
        """)
        conn.execute(remove_query, {'order_id': order_id})
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
        return staff_email

def staff_email_exists(email):
    """
    Check whether the email of a staff member exists in the database.

    Parameters:
        email (str): The email of the staff member being checked.

    Returns:
        bool: Whether the email exists or not
    """
    with engine.connect() as conn:
        staff_exists = conn.execute(text("SELECT EXISTS(SELECT 1 FROM staff WHERE email=:email)"),
                                    {"email": email}).scalar()
        if not staff_exists:
            return False
        return True

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
    
def get_staff_email_by_approved_order_id(order_id) -> str:
    """
    Retrieve the staff email associated with the given approved order ID.

    Parameters:
        order_id (int): The primary key of the order.

    Returns:
        str: The staff email associated with the given approved order ID.
    """
    with engine.connect() as conn:
        result = conn.execute(text("SELECT reviewed_by FROM approved_orders WHERE order_id = :order_id"), {"order_id": order_id}).scalar()
        return get_staff_email(result)
    
def get_staff_email_by_paid_order_id(order_id) -> str:
    """
    Retrieve the staff email associated with the given paid order ID.

    Parameters:
        order_id (int): The primary key of the order.

    Returns:
        str: The staff email associated with the given paid order ID.
    """
    with engine.connect() as conn:
        result = conn.execute(text("SELECT reviewed_by FROM paid_orders WHERE order_id = :order_id"), {"order_id": order_id}).scalar()
        return get_staff_email(result)

def get_staff_email_by_denied_order_id(order_id) -> str:
    """
    Retrieve the staff email associated with the given denied order ID.

    Parameters:
        order_id (int): The primary key of the order.

    Returns:
        str: The staff email associated with the given denied order ID.
    """
    with engine.connect() as conn:
        result = conn.execute(text("SELECT reviewed_by FROM denied_orders WHERE order_id = :order_id"), {"order_id": order_id}).scalar()
        return get_staff_email(result)

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
        
def add_filament(type, in_stock):
    """
    Add a new type of filament to the 'filaments' table if not already exists.

    Parameters: 
        type (str): The type of the filament to be added.
    """
    with engine.connect() as conn:
        filament_exists = conn.execute(text("SELECT EXISTS(SELECT 1 FROM filaments WHERE type = :type)"), {"type": type}).scalar()
        if not filament_exists:
            conn.execute(text("INSERT INTO filaments(type, in_stock) VALUES (:type, :in_stock)"), {"type": type, "in_stock": in_stock})

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
        
        conn.commit()

def remove_filament(type):
    """
    Remove a type of filament from the 'filaments' table.

    Parameters: 
        type (str): The type of the filament to be removed.
    """
    with engine.connect() as conn:
        conn.execute(text("DELETE FROM filaments WHERE type=:type"), {"type": type})

        conn.commit()

def get_filament_id(type):
    """
    Retrieve a filament id by its type

    Parameters:
        type (str): The type of the filament

    Returns:
        int: The filament id
    """
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id FROM filaments WHERE type=:type"), {"type": type}).scalar()

        return result

def get_filaments():
    """
    Retrieve all filaments from the 'filaments' table

    Returns:
        list: A list of all filaments 
    """
    filaments_table = metadata.tables['filaments']
    column_names = filaments_table.columns.keys()

    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM filaments")).fetchall()
        if not result:
            return []  # Return an empty list if no orders are found
        filaments = []
        for row in result:
            row_dict = dict(zip(column_names, row))  # Create dictionary using column names
            filaments.append(row_dict)
        return filaments
    
def add_color(color):
    """
    Add a color to the 'colors' table 

    Parameters:
        color (str): The color to be added
    """
    with engine.connect() as conn:
        color_exists = conn.execute(text("SELECT EXISTS(SELECT 1 FROM colors WHERE color = :color)"), {"color": color}).scalar()
        if not color_exists:
           conn.execute(text("INSERT INTO colors(color) VALUES (:color)"), {"color": color})

        conn.commit()

def remove_color(color_id):
    """
    Remove a color from the 'colors' table 

    Parameters:
        color_id (int): The id of the color to be removed
    """
    with engine.connect() as conn:
        conn.execute(text("DELETE FROM colors WHERE id=:id"), {"id": color_id})

        conn.commit()

def get_color(color_id):
    """
    Retrieve a color by its id

    Parameters:
        color_id (int): The id of the color

    Returns:
        str: The color
    """
    with engine.connect() as conn:
        result = conn.execute(text("SELECT color FROM colors WHERE id=:color_id"), {"color_id": color_id})
        result_dict = []
        for row in result:
            row_as_dict = row._mapping
            result_dict.append(dict(row_as_dict))
        color = result_dict[0]['color']
        return color
    
def get_color_id(color):
    """
    Retrieve a color by its name

    Parameters:
        color (str): The name of the color

    Returns:
        str: The id of the color
    """
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id FROM colors WHERE color=:color"), {"color": color}).scalar()
        return result
    
def get_colors():
    """
    Retrieve all colors from the 'colors' table

    Returns:
        list: A list of all colors 
    """
    colors_table = metadata.tables['colors']
    column_names = colors_table.columns.keys()

    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM colors")).fetchall()
        if not result:
            return []  # Return an empty list if no orders are found
        colors = []
        for row in result:
            row_dict = dict(zip(column_names, row))  # Create dictionary using column names
            colors.append(row_dict)
        return colors

def add_filament_color(filament_id, color_id):
    """
    Add a color to a filament type by adding it to the 'filament_colors' table

    Parameters:
        filament_id (int): The id of the filament type
        color_id (int): The id of the color
    """
    with engine.connect() as conn:
        conn.execute(text("INSERT INTO filament_colors(filament_id, color_id) VALUES (:filament_id, :color_id)"),
                     {"filament_id": filament_id, "color_id": color_id})
        
        conn.commit()

def remove_filament_color(filament_id, color_id):
    """
    Remove a color from a filament type by removing it from the 'filament_colors' table

    Parameters:
        filament_id (int): The id of the filament type
        color_id (int): The id of the color
    """
    with engine.connect() as conn:
        conn.execute(text("DELETE FROM filament_colors WHERE filament_id=:filament_id AND color_id=:color_id"),
                     {"filament_id": filament_id, "color_id": color_id})
        
        conn.commit()

def get_filament_colors(filament_id):
    """
    Retrieve colors associated with a filament id

    Parameters:
        filament_id (int): The id of the filament type 

    Returns:
        list: A list of all color ids associated with a filament type
    """
    filament_colors_table = metadata.tables['filament_colors']
    column_names = filament_colors_table.columns.keys()

    with engine.connect() as conn:
        result = conn.execute(text("SELECT color_id FROM filament_colors WHERE filament_id=:filament_id"),
                     {"filament_id": filament_id}).fetchall()
        if not result:
            return []  # Return an empty list if no orders are found
        filament_colors = []
        for row in result:
            row_dict = dict(zip(column_names, row))  # Create dictionary using column names
            filament_colors.append(row_dict)
        return filament_colors
 
   
