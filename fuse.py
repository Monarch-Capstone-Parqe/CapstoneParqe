import threading
import time
import requests
from http import HTTPStatus
import json
from requests.exceptions import Timeout, ConnectionError

import config.variables as variables
import database as db

stop_event = threading.Event()

# Function that will run in a separate thread
def background_task():
    while not stop_event.is_set():
        orders = db.get_paid_orders()
        for order in orders:
            result = enqueue_print(order)
            if result:
                db.print_order(order['id']) 

        time.sleep(5)

background_thread = threading.Thread(target=background_task)

# Start the background thread before the first request
def start_sending_orders():
    global background_thread
    background_thread = threading.Thread(target=background_task)
    background_thread.start()

# Stop the background thread when the application is shutting down
def stop_sending_orders():
    stop_event.set()
    background_thread.join()

def enqueue_print(order) -> bool:

    with open(f"uploads/{order['gcode_path']}", 'rb') as f:

        # Remove unnecessary keys from order dict
        keys_to_remove = ['gcode_path', 'price', 'prusa_output', 'date']
        for key in keys_to_remove:
            order.pop(key, None)

        json_data = json.dumps(order, default=str)  # Serialize Decimal to string


        files = {
            'json': json_data,
            'file': f
        }

        try:
            # Send the POST request with the file and JSON data
            response = requests.post(variables.FUSE_UPLOAD_ENDPOINT, files=files, timeout=10)  # Timeout set to 10 seconds
            
            if response.status_code == HTTPStatus.CREATED:
                return True  
            else:
                return False
            
        except Timeout:
            return False
        # Multiple failures indicate that the server is not reachable
        except ConnectionError:
            return False
