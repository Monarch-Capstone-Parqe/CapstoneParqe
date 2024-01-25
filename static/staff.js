import * as GCodePreview from 'gcode-preview';

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

let response = await fetch("/static/benchy.gcode");
   let gcode = await response.text() ;
   console.log(gcode);


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

    let gcodePrev = document.createElement('canvas');
    gcodePrev.classList.add('canvas');
    gcodePrev.id = "canvas"

    dataBox.appendChild(job);
    dataBox.appendChild(gcodePrev);
    dataBox.appendChild(buttonBox);
    buttonBox.appendChild(approveButton);
    buttonBox.appendChild(denyButton);
    jobsBox.appendChild(dataBox);
    jobsBox.appendChild(underline);
      
    
    const preview = GCodePreview.init({
      canvas: gcodePrev,
      extrusionColor: 'hotpink'
    });
    preview.processGCode(gcode);
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