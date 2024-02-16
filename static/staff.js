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

//Function to create job sections with input variables
//Variables will be received from database
function renderJob(order)
{
    const exists = document.getElementById(order.id)
    if(exists) {
        return
    }
    
    if(document.querySelector('#jobs-table').rows.length > 0) {
        // hide the 'no jobs' message
        document.getElementById('no-jobs-message').style.display = 'none';
        // display the table
        initJobsTable();
    }

    // insert the order into the table to display on staff page
    insertTableRow(order);
}

//Function to remove a job by id from the page
function removeJob(id) {
    let toRemove = document.getElementById(id);
    toRemove.remove();

    if(jobsTable = document.querySelector('#jobs-table').rows.length === 1) {
        // hide the intialized table
        document.querySelector('#jobs-table').style.display = 'none';

        // show the no jobs in queue message
        document.getElementById('no-jobs-message').style.display = 'block';
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
    document.getElementById('no-jobs-message').style.display = 'none';

    // display the intialized table
    document.querySelector('#jobs-table').style.display = 'block';
}

// inserts an order into the jobs table
function insertTableRow(orderToAdd) {
    let jobsTable = document.querySelector('#jobs-table');
    let row = jobsTable.insertRow(jobsTable.rows.length);

    // set the id of the row to the corresponding order, for use in the removeJob() function
    row.setAttribute('id', orderToAdd.id);

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