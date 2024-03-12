import * as GCodePreview from 'gcode-preview';
import * as THREE from 'three';

/**************************************** GENERAL FUNCTIONS ****************************************/

//Maximum number of orders able to render on a page
let maxRender = 10;

//Updates page content based on url hash change
window.addEventListener("hashchange", () => {
    initialLoad();
})

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
    else if (window.location.hash == '#paid') {
        openPaidPage();
    }
    else if (window.location.hash == '#print') {
        openPrintingPage();
    }
    else if (window.location.hash == '#closed') {
        openClosedPage();
    }
    else if(window.location.hash == '#inventory') {
        openInventoryPage();
    }
}
window.initialLoad = initialLoad;

//Interval refreshing orders from database continuously to keep the page up to date
let intervalId = setInterval(refreshOrdersWrapper, 10000);

/**************************************** END GENERAL FUNCTIONS ****************************************/




/**************************************** SHARED FUNCTIONS ****************************************/

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
    else if(window.location.hash == '#paid') {
        refreshOrders('staff/get_orders/paid', renderPaidOrder);
    }
    else if(window.location.hash == '#print') {
        refreshOrders('staff/get_orders/print', renderPrintOrder);
    }
    else if(window.location.hash == '#closed') {
        refreshOrders('staff/get_orders/closed', renderClosedOrder);
    }
}

//Renders load more button under the orders table
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

//Removes load more button from the page
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
    let jobsTable = document.getElementById('jobs-table');

    console.log(jobsTable.rows.length);
    if(jobsTable.rows.length == 1) {
        // hide the intialized table
        jobsTable.style.display = 'none';

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

// initializes the table when their are orders in the queue, hiding the no jobs message and displaying the table
function initJobsTable() {
    document.getElementById('no-jobs-message').style.display = 'none';

    document.querySelector('#jobs-table').style.display = 'block';
}

//open the gcode preview modal dialog
function openPreview(gcode_path)
{
    //fetch the gcode from the backend
    fetch("/staff/get_gcode/"+gcode_path, {
        method: "GET",
    })
    .then((response) => response.text())
    .then((data) => {
        //console.log(data)
        
        //display the modal
        const previewModal = document.querySelector('.gcode-preview-modal');
        const closeButton = document.getElementById('preview-close-button');
        previewModal.style.display = 'block';

        //gcode preview canvas
        let gcodePrev = document.getElementById('preview-canvas');
        gcodePrev.id = "preview-canvas"

        //Process the gcode after the canvas is initialized
        const preview = GCodePreview.init({
        canvas: gcodePrev,
            buildVolume: { x: 300, y: 300, z: 0 },
            //drawBuildVolume is used to change the size of the build grid in the preview window
            drawBuildVolume: { x: 300, y: 300, z: 0 },
            initialCameraPosition: [90, 75, 150],
            renderExtrusion: false,
            renderTravel: false,
            renderTubes: false,
            //extrusionColor is used to change the color of the build in the preview window
            extrusionColor: 'hotpink',
            backgroundColor: '#eee',
            travelColor: new THREE.Color('lime')
        });
        
        //after the preview is initialized the gcode is processed
        preview.processGCode(data);


        closeButton.onclick = function() {
            previewModal.style.display = 'none';
        }
    })
    .catch((error) => {
        console.error("Error: ", error);
    });

}

//Search bar function that hides non-matching values from the table
function searchOrders(){
    var input, query, table, tr, td, txtValue;
    input = document.getElementById("search-input");
    query = input.value.toUpperCase();
    table = document.getElementById("table-rows");
    tr = table.getElementsByTagName("tr");
    
    for (var i = 0; i < tr.length; i++){
        td = tr[i].getElementsByTagName("td")[1];
        if(td){
            txtValue = td.textContent || td.innerText || td.innerHTML;
            if(txtValue.toUpperCase().indexOf(query) > -1) {
                tr[i].style.display = "";
            } else {
                tr[i].style.display = "none";
            }
        }
    }
}
window.searchOrders = searchOrders;

/**************************************** END SHARED FUNCTIONS ****************************************/




/**************************************** PENDING PAGE ****************************************/

//Renders page of pending orders
function openPendingPage() {
    window.location.hash = 'pending';
    maxRender = 10;

    const jobsBoxHeaderContent = document.getElementById('subheader-text');
    const noJobsMessage = document.getElementById('no-jobs-message');

    removeAllFilaments();
    removeAllOrders();
    jobsBoxHeaderContent.innerText = 'PENDING ORDERS';
    noJobsMessage.innerText = 'No orders are currently pending.';
    document.getElementById('table-approved').classList.add('hide');
    document.getElementById('table-denied').classList.add('hide');
    document.getElementById('table-buttons').classList.remove('hide');

    refreshOrdersWrapper(); 
}
window.openPendingPage = openPendingPage;

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

//Updates status of order to denied and sends order back to database with message stating why the order was denied
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

//Function to create pending order sections with input variables
//Variables will be received from database
function renderPendingOrder(order)
{
    const exists = document.getElementById(order.id)
    if(exists) {
        return
    }
    
    if(document.querySelector('#jobs-table').rows.length > 0) {
        // display the table
        initJobsTable();
    }
    // insert the order into the table to display on staff page
    insertPendingTableRow(order);
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

//Displays modal to input reason when an order is denied
function openRejectModal(id) {
    const rejectModal = document.getElementById('reject-order-modal');
    const rejectModalSubmitButton = document.getElementById('reject-modal-submit-button');
    const rejectModalCancelButton = document.getElementById('reject-modal-cancel-button');

    rejectModal.style.display = 'block';

    rejectModalSubmitButton.onclick = function() {
        const textInput = document.getElementById('reject-modal-input');
        const input = textInput.value;
        console.log("INPUT: " + input)
        if (input.length == 0) {
            textInput.classList.add('modal-input-error');
            textInput.placeholder = 'Please enter a reason to continue..';
        }
        else {
            
            rejectModal.style.display = 'none';
            textInput.classList.remove('modal-input-error');
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

/**************************************** END PENDING PAGE ****************************************/




/**************************************** APPROVED PAGE ****************************************/

//Renders page of approved orders
function openApprovedPage() {
    window.location.hash = 'approved';
    maxRender = 10;

    const jobsBoxHeaderContent = document.getElementById('subheader-text');
    const noJobsMessage = document.getElementById('no-jobs-message');

    removeAllFilaments();
    removeAllOrders();
    jobsBoxHeaderContent.innerText = 'APPROVED ORDERS';
    noJobsMessage.innerText = 'No orders have been approved.';
    document.getElementById('table-approved').classList.remove('hide');
    document.getElementById('table-denied').classList.add('hide');
    document.getElementById('table-buttons').classList.add('hide');

    refreshOrdersWrapper(); 
}
window.openApprovedPage = openApprovedPage;

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

//Function to create approved order sections with input variables
//Variables will be received from database
function renderApprovedOrder(order) {
    const exists = document.getElementById(order.id)
    if(exists) {
        return
    }

    if(document.querySelector('#jobs-table').rows.length > 0) {
        // display the table
        initJobsTable();
    }
    // insert the order into the table to display on staff page
    insertApprovedTableRow(order);
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

    let buttonBox = document.createElement('section');
    buttonBox.classList.add('staff-buttons');

    let approveButton = document.createElement('button');
    approveButton.id = 'approve-button'
    approveButton.addEventListener('click', () => {
        approve_payment(order.id);
    });
    approveButton.textContent = 'APPROVE PAYMENT';

    buttonBox.appendChild(approveButton);
    row.insertCell(9).append(buttonBox);
}

function approve_payment(id){
    const formData = new FormData();
    formData.append("id", id)
    formData.append("status", "confirm_payment")
    fetch("/staff/review_orders", {
        method: "PUT",
        body: formData
    })
    .catch((error) => {
        console.error("Error: ", error);
    })
    removeOrder(id);
}

/**************************************** END APPROVED PAGE ****************************************/

/**************************************** PRINT PAGE****************************************/

//Render data onto a table given an order
function insertGeneralData(row, order){

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
    approvedCell.innerHTML = order.checked_by;

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

function insertPaidTableRow(order) {
    let tableRows = document.querySelector('#table-rows');
    let row = tableRows.insertRow();
    insertGeneralData(row, order);
}

//Renders page of approved orders
function openPaidPage() {
    openPage('paid', 'PAID ORDERS/PENDING PRINT');
}

function openPage(page, headerText) {
    window.location.hash = page;
    maxRender = 10;

    const jobsBoxHeaderContent = document.getElementById('subheader-text');
    const noJobsMessage = document.getElementById('no-jobs-message');

    removeAllFilaments();
    removeAllOrders();
    jobsBoxHeaderContent.innerText = headerText;
    noJobsMessage.innerText = 'No orders to display.';
    document.getElementById('table-approved').classList.remove('hide');
    document.getElementById('table-denied').classList.add('hide');
    document.getElementById('table-buttons').classList.add('hide');

    refreshOrdersWrapper(); 
}

window.openPaidOrder = openPaidPage;

//Get orders based on an endpoint to fetch data from
//Pass in function call to render the order
function refreshOrders(fetchDataEndpoint, renderOrder)
{
    console.log("refresh")
    fetch(fetchDataEndpoint, {
        method: "GET",
    })
    .then((response) => response.json())
    .then((data) => {
        console.log(data)
        for(let i = 0; i < maxRender && i < data.orders.length; i++) {
            renderOrder(data.orders[i]);
        }
        if(data.orders.length > maxRender) {
            renderLoadMoreButton();
        }
    })
    .catch((error) => {
        console.error("Error: ", error);
    });
}

//Function to create approved order sections with input variables
//Variables will be received from database
function renderPaidOrder(order) {
    const exists = document.getElementById(order.id)
    if(exists) {
        return
    }

    if(document.querySelector('#jobs-table').rows.length > 0) {
        // display the table
        initJobsTable();
    }
    // insert the order into the table to display on staff page
    insertPaidTableRow(order);
}

/**************************************** END PAID PAGE ****************************************/

/**************************************** PRINTING PAGE ****************************************/
function openPrintingPage(){
    openPage('print', 'ORDERS PRINTING');
}

window.openPrintingPage = openPrintingPage;

//Function to create approved order sections with input variables
//Variables will be received from database
function renderPrintOrder(order) {
    const exists = document.getElementById(order.id)
    if(exists) {
        return
    }

    if(document.querySelector('#jobs-table').rows.length > 0) {
        // display the table
        initJobsTable();
    }
    // insert the order into the table to display on staff page
    let tableRows = document.querySelector('#table-rows');
    let row = tableRows.insertRow();
    insertGeneralData(row, order);
    //Can add a buttonBox here if need 
}

/**************************************** END PRINTING PAGE ****************************************/

/**************************************** CLOSED ORDERSPAGE ****************************************/
function openClosedPage(){
    openPage('closed', 'CLOSED ORDERS');
}

window.openClosedPage = openClosedPage;

//Function to create approved order sections with input variables
//Variables will be received from database
function renderClosedOrder(order) {
    const exists = document.getElementById(order.id)
    if(exists) {
        return
    }

    if(document.querySelector('#jobs-table').rows.length > 0) {
        // display the table
        initJobsTable();
    }
    // insert the order into the table to display on staff page
    let tableRows = document.querySelector('#table-rows');
    let row = tableRows.insertRow();
    insertGeneralData(row, order);
}

/**************************************** END CLOSED ORDERSPAGE ****************************************/

/**************************************** DENIED PAGE ****************************************/

//Renders page of denied orders
function openDeniedPage() {
    window.location.hash = 'denied';
    maxRender = 10;

    const jobsBoxHeaderContent = document.getElementById('subheader-text');
    const noJobsMessage = document.getElementById('no-jobs-message');

    removeAllFilaments();
    removeAllOrders();
    jobsBoxHeaderContent.innerText = 'DENIED ORDERS';
    noJobsMessage.innerText = 'No orders have been denied.';
    document.getElementById('table-approved').classList.add('hide');
    document.getElementById('table-denied').classList.remove('hide');
    document.getElementById('table-buttons').classList.add('hide');

    refreshOrdersWrapper(); 
}
window.openDeniedPage = openDeniedPage;

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

//Function to create denied order sections with input variables
//Variables will be received from database
function renderDeniedOrder(order) {
    const exists = document.getElementById(order.id)
    if(exists) {
        return
    }

    if(document.querySelector('#jobs-table').rows.length > 0) {
        // display the table
        initJobsTable();
    }
    // insert the order into the table to display on staff page
    insertDeniedTableRow(order);
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

/**************************************** END DENIED PAGE ****************************************/




/**************************************** INVENTORY PAGE ****************************************/

//Renders page of filament inventory
function openInventoryPage() {
    window.location.hash = 'inventory';

    const jobsBoxHeaderContent = document.getElementById('subheader-text');
    const noJobsMessage = document.getElementById('no-jobs-message');

    removeAllOrders();
    jobsBoxHeaderContent.innerText = 'FILAMENT INVENTORY';
    noJobsMessage.innerText = 'No filament types have been added.';

    refreshFilamentInventory();
}
window.openInventoryPage = openInventoryPage;

//Fetches filaments and colors from the database
function refreshFilamentInventory()
{
    console.log("refresh")
    fetch("/staff/get_filament_inventory", {
        method: "GET",
    })
    .then((response) => response.json())
    .then((data) => {
        console.log(data)
        removeAllFilaments();
        renderFilamentButtons();

        //Sorts incoming filaments alphabetically by type so they always appear in the same order on the webpage
        data.filaments.sort((a,b) => {
            if (a.type < b.type) {
                return  -1;
            }
            if (a.type > b.type) {
                return 1;
            }
            return 0;
        });

        for(let i = 0; i < data.filaments.length; i++) {
            renderFilamentType(data.filaments[i], data.filament_colors[data.filaments[i].id], data.colors)
        }
    })
    .catch((error) => {
        console.error("Error: ", error);
    });
}

//Sends information for a new filament to be added to the database
function addFilament(type, in_stock)
{
    const formData = new FormData();
    formData.append("filament_type", type);
    formData.append("in_stock", in_stock)
    fetch("/staff/filament/add", {
        method: "POST",
        body: formData
    })
    .then(() => {
        refreshFilamentInventory();
    })
    .catch((error) => {
        console.error("Error: ", error);
    })
}


//Updates the 'in_stock' status of a filament type in the database
function updateFilament(type, in_stock)
{
    const formData = new FormData();
    formData.append("filament_type", type);
    formData.append("in_stock", in_stock)
    fetch("/staff/filament/update", {
        method: "PUT",
        body: formData
    })
    .catch((error) => {
        console.error("Error: ", error);
    })
}

//Deletes a filament from the database 
function deleteFilament(type)
{
    const formData = new FormData();
    formData.append("filament_type", type);
    fetch("/staff/filament/remove", {
        method: "DELETE",
        body: formData
    })
    .then(() => { 
        removeFilament(type);
    })
    .catch((error) => {
        console.error("Error: ", error);
    })
}

//Adds a new association between a filament and a color to the database
function addFilamentColor(type, color_id)
{
    const formData = new FormData();
    formData.append("filament_type", type);
    formData.append("color_id", color_id);
    fetch("/staff/filament/add_color", {
        method: "POST",
        body: formData
    })
    .catch((error) => {
        console.error("Error: ", error);
    })
}

//Deletes an association between a filament and a color from the database
function removeFilamentColor(type, color_id)
{
    const formData = new FormData();
    formData.append("filament_type", type);
    formData.append("color_id", color_id);
    fetch("/staff/filament/remove_color", {
        method: "DELETE",
        body: formData
    })
    .catch((error) => {
        console.error("Error: ", error);
    })
}

//Adds a new color to the database
function addColor(color) 
{
    const formData = new FormData();
    formData.append('color', color);
    fetch("/staff/color/add", {
        method: "POST",
        body: formData
    })
    .then(() => {
        refreshFilamentInventory();
    })
    .catch((error) => {
        console.error("Error: ", error);
    })
}

//Deletes a color from the database
function deleteColor(color_id) {
    const formData = new FormData();
    formData.append('id', color_id);
    fetch("/staff/color/remove", {
        method: "DELETE",
        body: formData
    })
    .then(() => {
        refreshFilamentInventory();
    })
    .catch((error) => {
        console.error("Error: ", error);
    })
}

//Creates the 'add' button to add new filament types to the database
function renderFilamentButtons() {
    const exists = document.getElementById('inventory-buttons');
    if(exists) {
        return;
    }
    const jobsBox = document.getElementById('jobs-box');
    let inventoryButtons = document.createElement('section');
    inventoryButtons.id = 'inventory-buttons';
    inventoryButtons.classList.add('inventory-buttons');
    let addButton = document.createElement('button');
    addButton.id = 'add-button';

    addButton.addEventListener('click', () => {
        openAddFilamentModal();
    });

    addButton.textContent = 'ADD';

    inventoryButtons.append(addButton);
    jobsBox.append(inventoryButtons);
}

//Initializaes the filaments table by hiding the no jobs message and showing the table on the page
function initFilamentsTable() {
    document.getElementById('no-jobs-message').style.display = 'none';

    document.getElementById('filament-table').style.display = 'block';
}

//Initializes a colors dropdown box associated with a filament type
function initColorsDropdown(dropdown, filament_type) {
    let isOpen = false;
    let label = document.getElementById(filament_type + '-dropdown-label');
    let list = document.getElementById(filament_type + '-dropdown-list'); 
    let inputs = dropdown.querySelectorAll('input[type="checkbox"]');

    label.addEventListener('click', () => {
        console.log('clicked');
        if(!isOpen) {
            isOpen = true;
            dropdown.classList.add('on');
        }
        else {
            isOpen = false;
            dropdown.classList.remove('on');
        }
    });

    for(let i = 0; i < inputs.length; i++) {
        inputs[i].addEventListener('change', () => {
            updateDropdownLabel(label, inputs);
        })
    }
    updateDropdownLabel(label, inputs);

    let buttonBox = document.createElement('div');
    buttonBox.classList.add('dropdown-buttons');

    let addButton = document.createElement('button');
    addButton.classList.add('add-color-button');
    addButton.textContent = 'ADD';

    addButton.addEventListener('click', () => {
        openAddColorModal();
    })

    buttonBox.append(addButton);

    list.append(buttonBox);
}

//Function to create filament type sections with input variables
//Variables will be received from database
function renderFilamentType(filament, filament_colors, colors) {
    const exists = document.getElementById(filament.type)
    if(exists) {
        return
    }

    if(document.getElementById('filament-table').rows.length > 0) {
        // display the table
        initFilamentsTable();
    }
    // insert the order into the table to display on staff page
    insertFilamentTableRow(filament, filament_colors, colors);
}

//Creates the colors dropdown box that is used to select which colors a filament has in stock
function renderColorsDropdown(colors, filament_colors, parent, filament_type) {
    let dropdown = document.createElement('div');
    dropdown.classList.add('colors-dropdown');
    dropdown.id = filament_type + '-dropdown';
    let dropdownLabel = document.createElement('label');
    dropdownLabel.id = filament_type + '-dropdown-label';
    dropdownLabel.classList.add('colors-dropdown-label');

    let dropdownList = document.createElement('div');
    dropdownList.id = filament_type + '-dropdown-list';
    dropdownList.classList.add('colors-dropdown-list');

    for(let i = 0; i < colors.length; i++) {
        let colorCheck = document.createElement('input');
        colorCheck.type = 'checkbox';
        colorCheck.classList.add('color-checkbox');
        colorCheck.id = colors[i].id;
        for(let i = 0; i < filament_colors.length; i++) {
            if(colorCheck.id == filament_colors[i].color_id) {
                colorCheck.checked = true;
            }
        }

        colorCheck.addEventListener('change', () => {
            if(colorCheck.checked) {
                addFilamentColor(filament_type, colorCheck.id);
            }
            else {
                removeFilamentColor(filament_type, colorCheck.id);
            }
        })

        let colorBox = document.createElement('div');
        colorBox.classList.add('dropdown-color');

        let colorName = document.createElement('label');
        colorName.textContent = colors[i].color;
        colorName.classList.add('dropdown-color-label');

        let removeButton = document.createElement('button');
        removeButton.classList.add('remove-color-button');
        removeButton.textContent = 'REMOVE';

        removeButton.addEventListener('click', () => {
            openDeleteColorModal(colors[i].color, colorCheck.id);
        })

        colorName.append(colorCheck);
        colorBox.append(colorName);
        colorBox.append(removeButton);
        dropdownList.append(colorBox);
    }

    dropdown.append(dropdownLabel);
    dropdown.append(dropdownList);
    parent.append(dropdown);
    
    initColorsDropdown(dropdown, filament_type);
}

//Updates the dropdown label corresponding to which colors are checked as in stock
function updateDropdownLabel(label, inputs) {
    label.innerText = '';
    let checkedInputs = [];
    for(let i = 0; i < inputs.length; i++) {
        if(inputs[i].checked) {
            checkedInputs.push(inputs[i]);
        }
    }

    for(let i = 0; i < checkedInputs.length; i++) {
        if(i+1 == checkedInputs.length) {
            label.innerHTML += checkedInputs[i].parentNode.innerText;
        }
        else {
            label.innerHTML += checkedInputs[i].parentNode.innerText + ',&nbsp';
        }
    }
}

//Inserts a filament type into the filaments table
function insertFilamentTableRow(filament, filament_colors, colors) {
    let tableRows = document.getElementById('filament-table-rows');
    let row = tableRows.insertRow();
    console.log(filament);

    // Sets the table row's id to the associated filament type
    row.setAttribute('id', filament.type);

    let typeCell = row.insertCell(0);
    let inStockCell = row.insertCell(1);
    let colorsCell = row.insertCell(2);
    let removeButtonCell = row.insertCell(3);
    
    typeCell.innerHTML = filament.type;

    renderColorsDropdown(colors, filament_colors, colorsCell, filament.type);
    let dropdown = document.getElementById(filament.type + '-dropdown');

    let inStockCheckBox = document.createElement('input');
    inStockCheckBox.type = 'checkbox';
    inStockCheckBox.checked = filament.in_stock;
    if(!inStockCheckBox.checked) {
        dropdown.style.display = 'none';
    }
    inStockCheckBox.classList.add('in-stock-checkbox');

    inStockCheckBox.addEventListener('change', () => {
        updateFilament(filament.type, inStockCheckBox.checked);
        if(inStockCheckBox.checked) {
            dropdown.style.display = 'block';
        }
        else {
            dropdown.style.display = 'none';
        }
    })

    inStockCell.append(inStockCheckBox);

    let buttonBox = document.createElement('div');
    buttonBox.classList.add('filament-table-buttons');

    let removeButton = document.createElement('button');
    removeButton.id = 'remove-button';
    removeButton.addEventListener('click', () => {
        openDeleteFilamentModal(filament.type);
    });
    removeButton.textContent = 'REMOVE';

    buttonBox.append(removeButton);
    removeButtonCell.append(buttonBox);


    typeCell.classList.add('table-data');
    inStockCell.classList.add('table-data');
    colorsCell.classList.add('table-data');
}

//Opens the add filament modal to allow a new filament to be added to the database
function openAddFilamentModal() {
    const addFilamentModal = document.getElementById('add-filament-modal');
    const addFilamentModalSubmitButton = document.getElementById('add-filament-modal-submit-button');
    const addFilamentModalCancelButton = document.getElementById('add-filament-modal-cancel-button');
    const addFilamentModalCheckbox = document.getElementById('add-filament-modal-in-stock-checkbox');

    addFilamentModal.style.display = 'block';

    addFilamentModalSubmitButton.onclick = function() {
        const textInput = document.getElementById('add-filament-modal-filament-type');
        const input = textInput.value;
        console.log("INPUT: " + input)
        if (input.length == 0) {
            textInput.classList.add('modal-input-error');
        }
        else { 
            addFilamentModal.style.display = 'none';
            textInput.classList.remove('modal-input-error');
            textInput.value = '';
            addFilament(input, addFilamentModalCheckbox.checked);
            addFilamentModalCheckbox.checked = false;
        }
    }

    addFilamentModalCancelButton.onclick = function() {
        const textInput = document.getElementById('add-filament-modal-filament-type');
        addFilamentModal.style.display = 'none';
        textInput.classList.remove('modal-input-error');
        textInput.placeholder = 'Type here..';
        textInput.value = '';
        addFilamentModalCheckbox.checked = false;
    } 
}

//Opens the delete filament modal to confirm a filament to be deleted from the database
function openDeleteFilamentModal(type) {
    const deleteFilamentModal = document.getElementById('delete-filament-modal');
    const deleteFilamentModalSubmitButton = document.getElementById('delete-filament-modal-submit-button');
    const deleteFilamentModalCancelButton = document.getElementById('delete-filament-modal-cancel-button');
    const deleteFilamentModalText = document.getElementById('delete-filament-modal-text');

    deleteFilamentModalText.textContent = 'Press submit below to remove the ' + type + ' filament type.';

    deleteFilamentModal.style.display = 'block';

    deleteFilamentModalSubmitButton.onclick = function() {
        deleteFilament(type);
        deleteFilamentModal.style.display = 'none';
    }

    deleteFilamentModalCancelButton.onclick = function() {
        deleteFilamentModal.style.display = 'none';
    } 
}

//Opens the add color modal to allow a new color to be added to the database
function openAddColorModal() {
    const addColorModal = document.getElementById('add-color-modal');
    const addColorModalSubmitButton = document.getElementById('add-color-modal-submit-button');
    const addColorModalCancelButton = document.getElementById('add-color-modal-cancel-button');

    addColorModal.style.display = 'block';

    addColorModalSubmitButton.onclick = function() {
        const textInput = document.getElementById('add-color-modal-color-name');
        const input = textInput.value;
        console.log("INPUT: " + input)
        if (input.length == 0) {
            textInput.classList.add('modal-input-error');
        }
        else { 
            addColorModal.style.display = 'none';
            textInput.classList.remove('modal-input-error');
            textInput.value = '';
            addColor(input);
        }
    }

    addColorModalCancelButton.onclick = function() {
        const textInput = document.getElementById('add-color-modal-color-name');
        addColorModal.style.display = 'none';
        textInput.classList.remove('modal-input-error');
        textInput.placeholder = 'Type here..';
        textInput.value = '';
    } 
}

//Opens the delete color modal to confirm a color to be deleted from the database
function openDeleteColorModal(color, color_id) {
    const deleteColorModal = document.getElementById('delete-color-modal');
    const deleteColorModalSubmitButton = document.getElementById('delete-color-modal-submit-button'); 
    const deleteColorModalCancelButton = document.getElementById('delete-color-modal-cancel-button');
    const deleteColorModalText = document.getElementById('delete-color-modal-text');

    deleteColorModalText.textContent = 'Press submit below to delete the color ' + color + '.';

    deleteColorModal.style.display = 'block';

    deleteColorModalSubmitButton.onclick = function() {
        deleteColor(color_id);
        deleteColorModal.style.display = 'none';
    }

    deleteColorModalCancelButton.onclick = function() {
        deleteColorModal.style.display = 'none';
    }
}

//Removes all filament table buttons from the page
function removeFilamentButtons() {
    const toRemove = document.getElementById('inventory-buttons');
    if(!toRemove) {
        return;
    }

    toRemove.parentNode.removeChild(toRemove);
}

//Removes a filament from the page based on its id
function removeFilament(id) {
    document.getElementById(id).remove();
    let filamentTable = document.getElementById('filament-table');

    if(filamentTable.rows.length == 1) {
        filamentTable.style.display = 'none';
        document.getElementById('no-jobs-message').style.display = 'block';
    }
}

//Removes all filaments from the page and hides the filaments table
function removeAllFilaments() {
    document.getElementById('filament-table-rows').innerHTML = '';
    document.getElementById('filament-table').style.display = 'none';
    document.getElementById('no-jobs-message').style.display = 'block';
    removeFilamentButtons();
}

/**************************************** END INVENTORY PAGE ****************************************/


