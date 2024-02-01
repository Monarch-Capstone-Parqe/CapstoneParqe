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

function refreshPendingJobs()
{
//get pending jobs from database
    console.log("refresh")
    fetch("/staff/orders?type=pending", {
        method: "GET",
    })
    .then((response) => response.json())
    .then((data) => {
        console.log(data)
        for(const order of data.orders) {
            renderPendingJob(order)
        }
    })
    .catch((error) => {
        console.error("Error: ", error);
    });
}

function refreshApprovedJobs()
{
//get approved jobs from database
    console.log("refresh")
    fetch("/staff/orders?type=approved", {
        method: "GET",
    })
    .then((response) => response.json())
    .then((data) => {
        console.log(data)
        for(const order of data.orders) {
            renderApprovedJob(order)
        }
    })
    .catch((error) => {
        console.error("Error: ", error);
    });
}

function refreshDeniedJobs()
{
//get denied jobs from database
    console.log("refresh")
    fetch("/staff/orders?type=denied", {
        method: "GET",
    })
    .then((response) => response.json())
    .then((data) => {
        console.log(data)
        for(const order of data.orders) {
            renderDeniedJob(order)
        }
    })
    .catch((error) => {
        console.error("Error: ", error);
    });
}

function refreshJobsWrapper()
{
    if(window.name == '') {
        window.name = 'pending';
    }
    if(window.name == 'pending') {
        refreshPendingJobs();
    }
    else if(window.name == 'approved') {
        refreshApprovedJobs();
    }
    else if(window.name == 'denied') {
        refreshDeniedJobs();
    }
}

//Function to create job sections with input variables
//Variables will be received from database
function renderPendingJob(order)
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

function renderApprovedJob(order) {
    console.log(order);
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
                        '<span class="emphasis-text">Note: </span>' + order.note +
                        '<span class="emphasis-text">Approved by: </span>' + order.approved_by;


    let underline = document.createElement('div');
    underline.classList.add('boxed-data-underline');
    underline.id = 'underline' + order.id;

    dataBox.appendChild(job);
    jobsBox.appendChild(dataBox);
    jobsBox.appendChild(underline); 
}

function renderDeniedJob(order) {
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
                        '<span class="emphasis-text">Note: </span>' + order.note +
                        '<span class="emphasis-text">Denied by: </span>' + order.denied_by;


    let underline = document.createElement('div');
    underline.classList.add('boxed-data-underline');
    underline.id = 'underline' + order.id;

    dataBox.appendChild(job);
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

function removeAllJobs() {
    const dataBoxes = document.getElementsByClassName('boxed-data');
    const underlines = document.getElementsByClassName('boxed-data-underline');
    const parent = document.getElementById('jobs-box');

    if(dataBoxes != null) {
        while(dataBoxes.length > 0) {
            dataBoxes[0].parentNode.removeChild(dataBoxes[0]);
            underlines[0].parentNode.removeChild(underlines[0]);
        }
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

//Renders approved job content
function openApprovedPage() {
    const jobsBoxHeaderContent = document.getElementById('subheader-text');
    const noJobsMessage = document.getElementById('no-jobs-message');

    removeAllJobs();
    jobsBoxHeaderContent.innerText = 'APPROVED JOBS';
    noJobsMessage.innerText = 'No jobs have been approved.';

    window.name = 'approved';
    refreshJobsWrapper(); 
}

function openPendingPage() {
    const jobsBoxHeaderContent = document.getElementById('subheader-text');
    const noJobsMessage = document.getElementById('no-jobs-message');

    removeAllJobs();
    jobsBoxHeaderContent.innerText = 'PENDING JOBS';
    noJobsMessage.innerText = 'No jobs are currently pending.';

    window.name = 'pending';
    refreshJobsWrapper(); 
}

function openDeniedPage() {
    const jobsBoxHeaderContent = document.getElementById('subheader-text');
    const noJobsMessage = document.getElementById('no-jobs-message');

    removeAllJobs();
    jobsBoxHeaderContent.innerText = 'DENIED JOBS';
    noJobsMessage.innerText = 'No jobs have been denied.';

    window.name = 'denied';
    refreshJobsWrapper(); 
}

function initialLoad() {
    if(window.name == '') {
        window.name = 'pending';
    }
    if(window.name == 'pending') {
        openPendingPage();
    }
    if(window.name == 'approved') {
        openApprovedPage();
    }
    if(window.name == 'denied') {
        openDeniedPage();
    }
}

let intervalId = setInterval(refreshJobsWrapper, 10000);