import * as GCodePreview from 'gcode-preview';
import * as THREE from 'three';
//Maximum number of orders able to render on a page
let maxRender = 10;

//Updates page content based on url hash change
window.addEventListener("hashchange", () => {
    initialLoad();
})

//Updates status of order to approved and sends order back to database
function approve(id)
{
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
    removeOrder(id);
}

//Updates status of order to denied and sends order back to database
function deny(id, message)
{
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
    removeOrder(id);
}

//Get pending orders from database
function refreshPendingOrders()
{
    console.log("refresh")
    fetch("/staff/get_orders/pending", {
        method: "GET",
    })
    .then((response) => response.json())
    .then((data) => {
        console.log(data)
        for(let i = 0; i < maxRender && i < data.orders.length; i++) {
            renderPendingOrder(data.orders[i]);
        }
        if(data.orders.length > maxRender) {
            renderLoadMoreButton();
        }
    })
    .catch((error) => {
        console.error("Error: ", error);
    });
}

//Get approved orders from database
function refreshApprovedOrders()
{
    console.log("refresh")
    fetch("/staff/get_orders/approved", {
        method: "GET",
    })
    .then((response) => response.json())
    .then((data) => {
        console.log(data)
        for(let i = 0; i < maxRender && i < data.orders.length; i++) {
            renderApprovedOrder(data.orders[i]);
        }
        if(data.orders.length > maxRender) {
            renderLoadMoreButton();
        }
    })
    .catch((error) => {
        console.error("Error: ", error);
    });
}

//Get denied orders from database
function refreshDeniedOrders()
{
    console.log("refresh")
    fetch("/staff/get_orders/denied", {
        method: "GET",
    })
    .then((response) => response.json())
    .then((data) => {
        console.log(data)
        for(let i = 0; i < maxRender && i < data.orders.length; i++) {
            renderDeniedOrder(data.orders[i]);
        }
        if(data.orders.length > maxRender) {
            renderLoadMoreButton();
        }
    })
    .catch((error) => {
        console.error("Error: ", error);
    });
}

//Function to refresh orders from database
//Correlates with window location via url hash
function refreshOrdersWrapper()
{
    if(window.location.hash == '#pending') {
        refreshPendingOrders();
    }
    else if(window.location.hash == '#approved') {
        refreshApprovedOrders();
    }
    else if(window.location.hash == '#denied') {
        refreshDeniedOrders();
    }
}

//Function to create order sections with input variables
//Variables will be received from database
function renderPendingOrder(order)
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

function renderApprovedOrder(order) {
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


function renderDeniedOrder(order) {
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
        refreshOrdersWrapper();
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

//Function to remove an order by id from the page
function removeOrder(id) {
    document.getElementById(id).remove();

    if(jobsTable = document.querySelector('#jobs-table').rows.length === 1) {
        // hide the intialized table
        document.querySelector('#jobs-table').style.display = 'none';

        // show the no jobs in queue message
        document.getElementById('no-jobs-message').style.display = 'block';
    }
    removeLoadMoreButton();
}

//Removes all orders from the page
function removeAllOrders() {
    document.getElementById('table-rows').innerHTML = '';
    document.getElementById('jobs-table').style.display = 'none';
    document.getElementById('no-jobs-message').style.display = 'block';
    removeLoadMoreButton();
}

//Displays modal to input reason when an order is denied
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

//Renders page of approved orders
function openApprovedPage() {
    window.location.hash = 'approved';
    maxRender = 10;

    const jobsBoxHeaderContent = document.getElementById('subheader-text');
    const noJobsMessage = document.getElementById('no-jobs-message');

    removeAllOrders();
    jobsBoxHeaderContent.innerText = 'APPROVED ORDERS';
    noJobsMessage.innerText = 'No orders have been approved.';
    document.getElementById('table-approved').classList.remove('hide');
    document.getElementById('table-denied').classList.add('hide');
    document.getElementById('table-buttons').classList.add('hide');

    refreshOrdersWrapper(); 
}
window.openApprovedPage = openApprovedPage;

//Renders page of pending orders
function openPendingPage() {
    window.location.hash = 'pending';
    maxRender = 10;

    const jobsBoxHeaderContent = document.getElementById('subheader-text');
    const noJobsMessage = document.getElementById('no-jobs-message');

    removeAllOrders();
    jobsBoxHeaderContent.innerText = 'PENDING ORDERS';
    noJobsMessage.innerText = 'No orders are currently pending.';
    document.getElementById('table-approved').classList.add('hide');
    document.getElementById('table-denied').classList.add('hide');
    document.getElementById('table-buttons').classList.remove('hide');

    refreshOrdersWrapper(); 
}
window.openPendingPage = openPendingPage;

//Renders page of denied orders
function openDeniedPage() {
    window.location.hash = 'denied';
    maxRender = 10;

    const jobsBoxHeaderContent = document.getElementById('subheader-text');
    const noJobsMessage = document.getElementById('no-jobs-message');

    removeAllOrders();
    jobsBoxHeaderContent.innerText = 'DENIED ORDERS';
    noJobsMessage.innerText = 'No orders have been denied.';
    document.getElementById('table-approved').classList.add('hide');
    document.getElementById('table-denied').classList.remove('hide');
    document.getElementById('table-buttons').classList.add('hide');

    refreshOrdersWrapper(); 
}
window.openDeniedPage = openDeniedPage;

//Renders page of filament inventory
function openInventoryPage() {
    window.location.hash = 'denied';
    maxRender = 10;

    const jobsBoxHeaderContent = document.getElementById('subheader-text');
    const noJobsMessage = document.getElementById('no-jobs-message');

    removeAllOrders();
    jobsBoxHeaderContent.innerText = 'DENIED JOBS';
    noJobsMessage.innerText = 'No jobs have been denied.';

    refreshOrdersWrapper(); 
}

//Determines which page to display based on current url hash
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
window.initialLoad = initialLoad;

// initializes the table when their are orders in the queue
// and sets width of table columns
function initJobsTable() {
    // hide the no jobs in queue message
    document.getElementById('no-jobs-message').style.display = 'none';

    // display the intialized table
    document.querySelector('#jobs-table').style.display = 'block';
}

// inserts a pending order into the jobs table
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

    let previewButton = document.createElement('button');
    previewButton.id = 'preview-button'
    previewButton.addEventListener('click', () => {
        openPreview(order.gcode_path)
    });
    previewButton.textContent = 'PREVIEW';

    buttonBox.appendChild(previewButton);
    buttonBox.appendChild(approveButton);
    buttonBox.appendChild(denyButton);
    row.insertCell(8).append(buttonBox);
}

// inserts an approved order into the jobs table
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

// inserts a denied order into the jobs table
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



function openPreview(gcode_path)
{
    fetch("/staff/get_gcode/"+gcode_path, {
        method: "GET",
    })
    .then((response) => response.text())
    .then((data) => {
        console.log(data)
        const previewModal = document.querySelector('.gcode-preview-modal');
        const closeButton = document.getElementById('preview-close-button');
        previewModal.style.display = 'block';
        //gcode-preview canvas
        let gcodePrev = document.getElementById('preview-canvas');
        gcodePrev.id = "preview-canvas"
        //Process the gcode after the canvas is initialized
        const preview = GCodePreview.init({
        canvas: gcodePrev,
            buildVolume: { x: 300, y: 300, z: 0 },
            drawBuildVolume: { x: 300, y: 300, z: 0 },
            initialCameraPosition: [90, 75, 150],
            renderExtrusion: false,
            renderTravel: false,
            renderTubes: false,
            extrusionColor: 'hotpink',
            backgroundColor: '#eee',
            travelColor: new THREE.Color('lime')
        });

        preview.processGCode(data);
        closeButton.onclick = function() {
            previewModal.style.display = 'none';
        }
    })
    .catch((error) => {
        console.error("Error: ", error);
    });

}

//Interval refreshing orders from database continuously to keep the page up to date
let intervalId = setInterval(refreshOrdersWrapper, 10000);