function approve(id)
{
//update status of job
//send job to printers
    console.log("approve");
    const formData = new FormData();
    formData.append("id", id)
    formData.append("status", "approved")
    fetch("/staff/return_orders", {
        method: "PUT",
        body: formData
    })
    .catch((error) => {
        console.error("Error: ", error);
    })
    removeJob(id);
}

function deny(id, message)
{
//update status of job
//remove from view
    console.log("deny");
    const formData = new FormData();
    formData.append("id", id);
    formData.append("status", "denied");
    formData.append("message", message);
    fetch("/staff/return_orders", {
        method: "PUT",
        body: formData
    })
    .catch((error) => {
        console.error("Error: ", error);
    })
    removeJob(id);
}

function refreshJobs()
{
//get new jobs from database
//create job objects
//populate sections with new data, connected to objects
//remove jobs that have been updated already
    console.log("refresh")
    fetch("/staff/get_orders/pending", {
        method: "GET",
    })
    .then((response) => response.json())
    .then((data) => {
        console.log(data)
        for(const order of data.orders) {
            renderJob(order)
        }
    })
    .catch((error) => {
        console.error("Error: ", error);
    });
}

class OtherOrder {
    constructor(email, price, nozzle_width, layer_height, infill, supports, pieces, note) {
      this.email = email;
      this.price = price;
      this.nozzle_width = nozzle_width;
      this.layer_height = layer_height;
      this.infill = infill;
      this.supports = supports;
      this.pieces = pieces;
      this.note = note;
    }
  }
let otherOrder = new OtherOrder('test@gmail.com', '$4.33', '0.4mm', '0.2mm', 'no', '3', 'this is a test');
// renderJob(OtherOrder);

//Function to create job sections with input variables
//Variables will be received from database
function renderJob(order)
{
    const exists = document.getElementById(order.id)
    if(exists) {
        return
    }
    let jobsBox = document.getElementById('jobs-box');
    if(jobsBox.childElementCount == 3) {
        let toHide = document.getElementById('no-jobs-message');
        toHide.style.display = "none";
    }

    let dataBox = document.createElement('section');
    dataBox.id = order.id;
    dataBox.classList.add('boxed-data');

    let job = document.createElement('p');
    job.classList.add('data-formatting');

    job.innerHTML = '<span class="first-text">Email: </span>' + order.email + 
                        '<span class="emphasis-text">Price: </span>' + order.price + 
                        '<span class="emphasis-text">Layer Height: </span>'+ order.layer_height + 
                        '<span class="emphasis-text">Nozzle Width: </span>' + order.nozzle_width +
                        '<span class="emphasis-text">Infill: </span>' + order.infill +
                        '<span class="emphasis-text">Supports: </span>' + order.supports +
                        '<span class="emphasis-text">Pieces: </span>' + order.pieces + 
                        '<span class="emphasis-text">Note: </span>' + order.note;

    let buttonBox = document.createElement('section');
    buttonBox.classList.add('staff-buttons');

    let approveButton = document.createElement('button');
    approveButton.id = 'approve-button'
    approveButton.addEventListener('click', () => {
        approve(order.id);
    });
    approveButton.textContent = 'APPROVE';

    let denyButton = document.createElement('button');
    denyButton.id = 'deny-button'
    denyButton.addEventListener('click', () => {
        openRejectModal(order.id)
    });
    denyButton.textContent = 'DENY';

    let underline = document.createElement('div');
    underline.classList.add('boxed-data-underline');
    underline.id = 'underline' + order.id;

    dataBox.appendChild(job);
    dataBox.appendChild(buttonBox);
    buttonBox.appendChild(approveButton);
    buttonBox.appendChild(denyButton);
    jobsBox.appendChild(dataBox);
    jobsBox.appendChild(underline);
}

//Function to remove a job by id from the page
function removeJob(id) {
    let toRemove = document.getElementById(id);
    let removeUnderline = document.getElementById('underline' + id);
    if(toRemove != null) {
        let parent = toRemove.parentNode;
        parent.removeChild(toRemove);
        parent.removeChild(removeUnderline);    
        if(parent.childElementCount == 3) {
            let toDisplay = document.getElementById("no-jobs-message");
            toDisplay.style.display = 'block';
        }
    }
}

//Function to display modal to input reason when an order is denied
function openRejectModal(id) {
    const rejectModal = document.querySelector('.reject-order-modal');
    const rejectModalSubmitButton = document.getElementById('reject-modal-submit-button');
    const rejectModalCancelButton = document.getElementById('reject-modal-cancel-button');

    rejectModal.style.display = 'block';

    rejectModalSubmitButton.onclick = function() {
        const textInput = document.getElementById('reject-modal-input');
        const input = textInput.value;
        console.log("INPUT: " + input)
        if (input.length == 0) {
            textInput.classList.add('reject-modal-input-error');
            textInput.placeholder = 'Please enter a reason to continue..';
        }
        else {
            
            rejectModal.style.display = 'none';
            textInput.classList.remove('reject-modal-input-error');
            textInput.placeholder = 'Type here..';
            textInput.value = '';
            deny(id, input);
        }
    }

    rejectModalCancelButton.onclick = function() {
        const textInput = document.getElementById('reject-modal-input');
        rejectModal.style.display = 'none';
        textInput.classList.remove('reject-modal-input-error');
        textInput.placeholder = 'Type here..';
        textInput.value = '';
    } 
}

let intervalId = setInterval(refreshJobs, 10000);

// hardcoded order for testing purposes
class Order {
    constructor(price, email, filament_type, nozzle_size, layer_height, infill, quantity, note) {
      this.price = price;
      this.email = email;
      this.filament_type = filament_type;
      this.nozzle_size = nozzle_size;
      this.layer_height = layer_height;
      this.infill = infill;
      this.quantity = quantity;
      this.note = note;
    }
  }

let order1 = new Order('$2.34', 'test-test@pdx.edu', 'pla,black', '0.4mm', '0.2mm', '20%', '10', 'This a test note. This a test note. This a test note.');
// testing 180 characters for note
let order2 = new Order('$22.80', 'this-is-a-longer-email@pdx.edu', 'petg,purple', '0.6mm', '0.15mm', '100%', '100', 'THIS IS 180 CHARACTERS LONG.  Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis p');
let order3 = new Order('$45.67', 'no-note-test@pdx.edu', 'abs,white', '0.6mm', '0.3mm', '15%', '5', '');
let order4 = new Order('$11.11', 'test-again@pdx.edu', 'pla,orange', '0.4mm', '0.1mm', '80%', '1', 'Testing another note here to see how it shows up in the table!!!!!!!');

// initializes the table when their are orders in the queue
// and sets width of table columns
function initJobsTable() {
    // set the width of each column in the table
    document.querySelector('#table-email').style.width = '300px';
    document.querySelector('#table-filament').style.width = '90px';
    document.querySelector('#table-nozzle').style.width = '75px';
    document.querySelector('#table-layer').style.width = '60px';
    document.querySelector('#table-infill').style.width = '55px';
    document.querySelector('#table-quantity').style.width = '50px';
    document.querySelector('#table-note').style.width = '500px';
    document.querySelector('#table-buttons').style.width = '200px';


    // hide the no jobs in queue message
    let toHide = document.getElementById('no-jobs-message');
    toHide.style.display = "none";

    // display the intialized table
    let jobsTable = document.querySelector('#jobs-table');
    jobsTable.style.display = 'block';
}

// inserts an order into the jobs table
function insertTableRow(orderToAdd) {
    let jobsTable = document.querySelector('#jobs-table');
    let row = jobsTable.insertRow(jobsTable.rows.length);

    let priceCell = row.insertCell(0);
    let emailCell = row.insertCell(1);
    let filamentCell = row.insertCell(2);
    let nozzleCell = row.insertCell(3);
    let layerCell = row.insertCell(4);
    let infillCell = row.insertCell(5);
    let quantityCell = row.insertCell(6);
    let noteCell = row.insertCell(7); 
    
    priceCell.innerHTML = orderToAdd.price;
    emailCell.innerHTML = orderToAdd.email;
    filamentCell.innerHTML = orderToAdd.filament_type;
    nozzleCell.innerHTML = orderToAdd.nozzle_size;
    layerCell.innerHTML = orderToAdd.layer_height;
    infillCell.innerHTML = orderToAdd.infill;
    quantityCell.innerHTML = orderToAdd.quantity;
    noteCell.innerHTML = orderToAdd.note;

    let buttonBox = document.createElement('section');
    buttonBox.classList.add('staff-buttons');

    let approveButton = document.createElement('button');
    approveButton.id = 'approve-button'
    approveButton.addEventListener('click', () => {
        approve(order.id);
    });
    approveButton.textContent = 'APPROVE';

    let denyButton = document.createElement('button');
    denyButton.id = 'deny-button'
    denyButton.addEventListener('click', () => {
        openRejectModal(order.id)
    });
    denyButton.textContent = 'DENY';

    buttonBox.appendChild(approveButton);
    buttonBox.appendChild(denyButton);
    row.insertCell(8).append(buttonBox);
}

initJobsTable();
insertTableRow(order1);
insertTableRow(order2);
insertTableRow(order3);
insertTableRow(order4);