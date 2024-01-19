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
    fetch("/staff/orders?type=pending", {
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
    let jobsBox = document.getElementById('jobs-box');
    if(jobsBox.childElementCount == 3) {
        let toHide = document.getElementById('no-jobs-message');
        toHide.style.display = "none";
    }

    let dataBox = document.createElement('section')
    dataBox.id = order.id;
    dataBox.class = 'boxed-data';

    let job = document.createElement('p');
    job.class = 'data-formatting';
    job.textContent = "Email: " + order.email + 
                        ", Price: " + order.price + 
                        ", Layer Height: " + order.layer_height + 
                        ", Nozzle Width: " + order.nozzle_width +
                        ", Infill: " + order.infill +
                        ", Supports: " + order.supports +
                        ", Pieces: " + order.pieces + 
                        ", Note: " + order.note;

    let approveButton = document.createElement('button');
    approveButton.classList.add('approve-button');
    approveButton.addEventListener('click', () => {
        approve(order.id);
    });
    approveButton.textContent = 'Approve Job';

    let denyButton = document.createElement('button');
    denyButton.classList.add('deny-button');
    denyButton.addEventListener('click', () => {
        openRejectModal(order.id)
    });
    denyButton.textContent = 'Deny Job';

    dataBox.appendChild(job);
    dataBox.appendChild(approveButton);
    dataBox.appendChild(denyButton);
    jobsBox.appendChild(dataBox);
}

//Function to remove a job by id from the page
function removeJob(id) {
    let toRemove = document.getElementById(id);
    if(toRemove != null) {
        let parent = toRemove.parentNode;
        parent.removeChild(toRemove);    
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

//renderJob("Matt", "$0.34", "etc etc..");
let intervalId = setInterval(refreshJobs, 10000);