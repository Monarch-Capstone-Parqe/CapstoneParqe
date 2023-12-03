
//todo create job objects
//
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

function deny(id)
{
//update status of job
//remove from view
    console.log("deny");
    const formData = new FormData();
    formData.append("id", id)
    formData.append("status", "denied")
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
    fetch("/staff/orders", {
        method: "GET",
    })
    .then((response) => response.json())
    .then((data) => {
        console.log(data)
        for(const order of data.pending_orders) {
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
    if(jobsBox.childElementCount == 2) {
        let toHide = document.getElementById("no-jobs-message");
        toHide.style.display = "none";
    }

    let dataBox = document.createElement('section')
    dataBox.id = order.id;
    dataBox.class = 'boxed-data';

    let job = document.createElement('p');
    job.class = 'data-formatting';
    job.textContent = "Email: " + order.email + ", Price: " + order.price + ", File Name: " + order.file_name;

    let approveButton = document.createElement('button');
    approveButton.classList.add('approve-button');
    approveButton.addEventListener('click', () => {
        approve(order.id);
    });
    approveButton.textContent = 'Approve Job';

    let denyButton = document.createElement('button');
    denyButton.classList.add('deny-button');
    denyButton.addEventListener('click', () => {
        deny(order.id)
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
        parent.removeChild(toRemove);    if(parent.childElementCount == 2) {
            let toDisplay = document.getElementById("no-jobs-message");
            toDisplay.style.display = 'block';
        }
    }
}

//renderJob("Matt", "$0.34", "etc etc..");
let intervalId = setInterval(refreshJobs, 10000);