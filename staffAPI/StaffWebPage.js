
//todo create job objects
//
function approve(name)
{
//update status of job
//send job to printers
    console.log("approve");
    removeJob(name);
}

function deny(name)
{
//update status of job
//remove from view
    console.log("deny");
    removeJob(name);
}

function refreshJobs()
{
//get new jobs from database
//create job objects
//populate sections with new data, connected to objects
//remove jobs that have been updated already
console.log("refresh")
}

//Function to create job sections with input parameters that will be
function renderJob(name, cost, etc)
{
    let jobsBox = document.getElementById('jobs-box');
    if(jobsBox.childElementCount == 2) {
        let toHide = document.getElementById("no-jobs-message");
        toHide.style.display = "none";
    }

    let dataBox = document.createElement('section')
    dataBox.id = name;
    dataBox.class = 'boxed-data';

    let job = document.createElement('p');
    job.class = 'data-formatting';
    job.textContent = "Name: " + name + ", Cost: " + cost + ", Other: " + etc;

    let approveButton = document.createElement('button');
    approveButton.id = 'approve-button';
    approveButton.addEventListener('click', () => {
        approve(name);
    });
    approveButton.textContent = 'Approve Job';

    let denyButton = document.createElement('button');
    denyButton.id = 'deny-button';
    denyButton.addEventListener('click', () => {
        deny(name)
    });
    denyButton.textContent = 'Deny Job';

    dataBox.appendChild(job);
    dataBox.appendChild(approveButton);
    dataBox.appendChild(denyButton);
    jobsBox.appendChild(dataBox);
}

function removeJob(name) {
    let toRemove = document.getElementById(name);
    if(toRemove != null) {
        let parent = toRemove.parentNode;
        parent.removeChild(toRemove);
        if(parent.childElementCount == 2) {
            let toDisplay = document.getElementById("no-jobs-message");
            toDisplay.style.display = 'block';
        }
    }
}

renderJob("Bruh", "$0.34", "etc etc..");
renderJob("Matt", "$0.34", "etc etc..");