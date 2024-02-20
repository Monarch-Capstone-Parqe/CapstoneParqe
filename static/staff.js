let maxRender = 10;

window.addEventListener("hashchange", () => {
    initialLoad();
})

function approve(id)
{
//update status of job
//send job to printers
    console.log("approve");
    const formData = new FormData();
    formData.append("id", id)
    formData.append("status", "approved")
    fetch("/staff/review_orders", {
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
    fetch("/staff/review_orders", {
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
    fetch("/staff/get_orders/pending", {
        method: "GET",
    })
    .then((response) => response.json())
    .then((data) => {
        console.log(data)
        for(let i = 0; i < maxRender && i < data.orders.length; i++) {
            renderPendingJob(data.orders[i]);
        }
        if(data.orders.length > maxRender) {
            renderLoadMoreButton();
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
    fetch("/staff/get_orders/approved", {
        method: "GET",
    })
    .then((response) => response.json())
    .then((data) => {
        console.log(data)
        for(let i = 0; i < maxRender && i < data.orders.length; i++) {
            renderApprovedJob(data.orders[i]);
        }
        if(data.orders.length > maxRender) {
            renderLoadMoreButton();
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
    fetch("/staff/get_orders/denied", {
        method: "GET",
    })
    .then((response) => response.json())
    .then((data) => {
        console.log(data)
        for(let i = 0; i < maxRender && i < data.orders.length; i++) {
            renderDeniedJob(data.orders[i]);
        }
        if(data.orders.length > maxRender) {
            renderLoadMoreButton();
        }
    })
    .catch((error) => {
        console.error("Error: ", error);
    });
}

function refreshJobsWrapper()
{
    if(window.location.hash == '#pending') {
        refreshPendingJobs();
    }
    else if(window.location.hash == '#approved') {
        refreshApprovedJobs();
    }
    else if(window.location.hash == '#denied') {
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
    
    if(document.querySelector('#jobs-table').rows.length > 0) {
        // hide the 'no jobs' message
        document.getElementById('no-jobs-message').style.display = 'none';
        // display the table
        initJobsTable();
    }
    // insert the order into the table to display on staff page
    insertPendingTableRow(order);
}

function renderApprovedJob(order) {
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
    insertApprovedTableRow(order);
}

function renderDeniedJob(order) {
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
    insertDeniedTableRow(order);
}

function renderLoadMoreButton() {
    const exists = document.getElementById('load-more-button');
    if(exists) {
        return;
    }
    const jobsBox = document.getElementById('jobs-box');
    let loadMoreButtonBox = document.createElement('section');
    loadMoreButtonBox.classList.add('load-more-button-box');

    let loadMoreButton = document.createElement('button');
    loadMoreButton.id = 'load-more-button';
    loadMoreButton.addEventListener('click', () => {
        maxRender += 10;
        loadMoreButtonBox.parentNode.removeChild(loadMoreButtonBox);
        refreshJobsWrapper();
    });
    loadMoreButton.textContent = 'LOAD MORE';

    loadMoreButtonBox.append(loadMoreButton);
    jobsBox.append(loadMoreButtonBox);
}

function removeLoadMoreButton() {
    const toRemove = document.getElementById('load-more-button');
    if(!toRemove) {
        return;
    }

    const toRemoveParent = toRemove.parentNode;
    toRemoveParent.parentNode.removeChild(toRemoveParent);
}

//Function to remove a job by id from the page
function removeJob(id) {
    document.getElementById(id).remove();

    if(jobsTable = document.querySelector('#jobs-table').rows.length === 1) {
        // hide the intialized table
        document.querySelector('#jobs-table').style.display = 'none';

        // show the no jobs in queue message
        document.getElementById('no-jobs-message').style.display = 'block';
    }
    removeLoadMoreButton();
}

function removeAllJobs() {
    document.getElementById('table-rows').innerHTML = '';
    document.getElementById('jobs-table').style.display = 'none';
    document.getElementById('no-jobs-message').style.display = 'block';
    removeLoadMoreButton();
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
    window.location.hash = 'approved';
    maxRender = 10;

    const jobsBoxHeaderContent = document.getElementById('subheader-text');
    const noJobsMessage = document.getElementById('no-jobs-message');

    removeAllJobs();
    jobsBoxHeaderContent.innerText = 'APPROVED JOBS';
    noJobsMessage.innerText = 'No jobs have been approved.';
    document.getElementById('table-approved').classList.remove('hide');
    document.getElementById('table-denied').classList.add('hide');
    document.getElementById('table-buttons').classList.add('hide');

    refreshJobsWrapper(); 
}

function openPendingPage() {
    window.location.hash = 'pending';
    maxRender = 10;

    const jobsBoxHeaderContent = document.getElementById('subheader-text');
    const noJobsMessage = document.getElementById('no-jobs-message');

    removeAllJobs();
    jobsBoxHeaderContent.innerText = 'PENDING JOBS';
    noJobsMessage.innerText = 'No jobs are currently pending.';
    document.getElementById('table-approved').classList.add('hide');
    document.getElementById('table-denied').classList.add('hide');
    document.getElementById('table-buttons').classList.remove('hide');

    refreshJobsWrapper(); 
}

function openDeniedPage() {
    window.location.hash = 'denied';
    maxRender = 10;

    const jobsBoxHeaderContent = document.getElementById('subheader-text');
    const noJobsMessage = document.getElementById('no-jobs-message');

    removeAllJobs();
    jobsBoxHeaderContent.innerText = 'DENIED JOBS';
    noJobsMessage.innerText = 'No jobs have been denied.';
    document.getElementById('table-approved').classList.add('hide');
    document.getElementById('table-denied').classList.remove('hide');
    document.getElementById('table-buttons').classList.add('hide');

    refreshJobsWrapper(); 
}

function openInventoryPage() {
    window.location.hash = 'denied';
    maxRender = 10;

    const jobsBoxHeaderContent = document.getElementById('subheader-text');
    const noJobsMessage = document.getElementById('no-jobs-message');

    removeAllJobs();
    jobsBoxHeaderContent.innerText = 'DENIED JOBS';
    noJobsMessage.innerText = 'No jobs have been denied.';

    refreshJobsWrapper(); 
}

function initialLoad() {
    console.log(window.location.hash);
    if(window.location.hash == '') {
        window.location.hash = 'pending';
    }
    if(window.location.hash == '#pending') {
        openPendingPage();
    }
    else if(window.location.hash == '#approved') {
        openApprovedPage();
    }
    else if(window.location.hash == '#denied') {
        openDeniedPage();
    }
}

// initializes the table when their are orders in the queue
function initJobsTable() {
    // hide the no jobs in queue message
    document.getElementById('no-jobs-message').style.display = 'none';

    // display the intialized table
    document.querySelector('#jobs-table').style.display = 'block';
}

// inserts an order into the jobs table
function insertPendingTableRow(order) {
    let tableRows = document.querySelector('#table-rows');
    let row = tableRows.insertRow();

    // set the id of the row to the corresponding order, for use in the removeJob() function
    row.setAttribute('id', order.id);

    let priceCell = row.insertCell(0);
    let emailCell = row.insertCell(1);
    let filamentCell = row.insertCell(2);
    let nozzleCell = row.insertCell(3);
    let layerCell = row.insertCell(4);
    let infillCell = row.insertCell(5);
    let quantityCell = row.insertCell(6);
    let noteCell = row.insertCell(7); 

    priceCell.innerHTML = order.price;
    emailCell.innerHTML = order.email;
    filamentCell.innerHTML = order.filament_type;
    nozzleCell.innerHTML = order.nozzle_size;
    layerCell.innerHTML = order.layer_height;
    infillCell.innerHTML = order.infill;
    quantityCell.innerHTML = order.quantity;
    noteCell.innerHTML = order.note;

    priceCell.classList.add('table-data');
    emailCell.classList.add('table-data');
    filamentCell.classList.add('table-data');
    nozzleCell.classList.add('table-data');
    layerCell.classList.add('table-data');
    infillCell.classList.add('table-data');
    quantityCell.classList.add('table-data');
    noteCell.classList.add('table-data');

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

function insertApprovedTableRow(order) {
    let tableRows = document.querySelector('#table-rows');
    let row = tableRows.insertRow();

    // set the id of the row to the corresponding order, for use in the removeJob() function
    row.setAttribute('id', order.id);

    let priceCell = row.insertCell(0);
    let emailCell = row.insertCell(1);
    let filamentCell = row.insertCell(2);
    let nozzleCell = row.insertCell(3);
    let layerCell = row.insertCell(4);
    let infillCell = row.insertCell(5);
    let quantityCell = row.insertCell(6);
    let noteCell = row.insertCell(7); 
    let approvedCell = row.insertCell(8);

    priceCell.innerHTML = order.price;
    emailCell.innerHTML = order.email;
    filamentCell.innerHTML = order.filament_type;
    nozzleCell.innerHTML = order.nozzle_size;
    layerCell.innerHTML = order.layer_height;
    infillCell.innerHTML = order.infill;
    quantityCell.innerHTML = order.quantity;
    noteCell.innerHTML = order.note;
    approvedCell.innerHTML = order.approved_by;

    priceCell.classList.add('table-data');
    emailCell.classList.add('table-data');
    filamentCell.classList.add('table-data');
    nozzleCell.classList.add('table-data');
    layerCell.classList.add('table-data');
    infillCell.classList.add('table-data');
    quantityCell.classList.add('table-data');
    noteCell.classList.add('table-data');
    approvedCell.classList.add('table-data');
}

function insertDeniedTableRow(order) {
    let tableRows = document.querySelector('#table-rows');
    let row = tableRows.insertRow();

    // set the id of the row to the corresponding order, for use in the removeJob() function
    row.setAttribute('id', order.id);

    let priceCell = row.insertCell(0);
    let emailCell = row.insertCell(1);
    let filamentCell = row.insertCell(2);
    let nozzleCell = row.insertCell(3);
    let layerCell = row.insertCell(4);
    let infillCell = row.insertCell(5);
    let quantityCell = row.insertCell(6);
    let noteCell = row.insertCell(7); 
    let deniedCell = row.insertCell(8);

    priceCell.innerHTML = order.price;
    emailCell.innerHTML = order.email;
    filamentCell.innerHTML = order.filament_type;
    nozzleCell.innerHTML = order.nozzle_size;
    layerCell.innerHTML = order.layer_height;
    infillCell.innerHTML = order.infill;
    quantityCell.innerHTML = order.quantity;
    noteCell.innerHTML = order.note;
    deniedCell.innerHTML = order.denied_by;

    priceCell.classList.add('table-data');
    emailCell.classList.add('table-data');
    filamentCell.classList.add('table-data');
    nozzleCell.classList.add('table-data');
    layerCell.classList.add('table-data');
    infillCell.classList.add('table-data');
    quantityCell.classList.add('table-data');
    noteCell.classList.add('table-data');
    deniedCell.classList.add('table-data');
}

let intervalId = setInterval(refreshJobsWrapper, 10000);