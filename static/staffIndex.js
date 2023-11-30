
import * as GCodePreview from './node_modules/gcode-preview/dist/gcode-preview.js';
  
  const preview = window.preview(new GCodePreview.init(
  {
      canvas: document.querySelector('canvas'),
      extrusionColor: 'hotpink'
  }
  ));
  
  // draw a diagonal line
  const gcode = 'G0 X0 Y0 Z0.2\nG1 X42 Y42 E10';
  preview.processGCode(gcode);
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

//Function to create job sections with input variables
//Variables will be received from database
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
    approveButton.classList.add('approve-button');
    approveButton.addEventListener('click', () => {
        approve(name);
    });
    approveButton.textContent = 'Approve Job';

    let denyButton = document.createElement('button');
    denyButton.classList.add('deny-button');
    denyButton.addEventListener('click', () => {
        deny(name)
    });
    denyButton.textContent = 'Deny Job';

    dataBox.appendChild(job);
    dataBox.appendChild(approveButton);
    dataBox.appendChild(denyButton);
    dataBox.appendChild(preview);
    jobsBox.appendChild(dataBox);


}

//Function to remove a job by id from the page
function removeJob(name) {
    let toRemove = document.getElementById(name);
    if(toRemove != null) {
        let parent = toRemove.parentNode;
        parent.removeChild(toRemove);    if(parent.childElementCount == 2) {
            let toDisplay = document.getElementById("no-jobs-message");
            toDisplay.style.display = 'block';
        }
    }
}

renderJob("Bruh", "$0.34", "etc etc..");
renderJob("Matt", "$0.34", "etc etc..");