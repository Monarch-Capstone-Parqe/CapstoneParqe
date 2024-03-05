import threading
import time
import requests
from http import HTTPStatus

import database as db

stop_event = threading.Event()

# Function that will run in a separate thread
def background_task():
    while not stop_event.is_set():
        orders = db.get_approved_orders()
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
    # Octoprint Automation URL
    url = 'http://192.168.1.100/api/endpoint'

    with open(f"uploads/{order['gcode_path']}", 'rb') as f:
        files = {'file': f}

        del order['gcode_path']
        del order['price']
        del order['prusa_output']
        del order['date']

        # Send the POST request with the file
        response = requests.post(url, files=files, data=order)

        # Check the response
        if response.status_code == HTTPStatus.CREATED:
            return True  
        else:
            return False