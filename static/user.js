// toggles dark mode on an off in form
const darkModeToggle = document.querySelector("input[name=dark-mode]");
darkModeToggle.addEventListener("change", function () {
  const modeIcon = document.querySelector(".mode-icon")
  if (this.checked) {
    console.log("dark mode active");
    insertGoogleIcon(modeIcon, "dark_mode", "white");
    darkMode(".order-form");
  } else {
    console.log("light mode active");
    insertGoogleIcon(modeIcon, "light_mode", "black");
    darkMode(".order-form");
  }
});

// dark mode color scheme toggle
function darkMode(selector) {
  const element = document.querySelector(selector);
  element.classList.toggle("dark-mode");
}

let submitButton = document.querySelector("#submit-button");
submitButton.onclick = function (event) {
  event.preventDefault();
  uploadAndShowFile();
};
function uploadAndShowFile() {
  const email = document.querySelector("#email").value;
  const fileInput = document.querySelector("#file-input");
  const file = fileInput.files[0];
  const layerHeight = document.querySelector("#layer-height").value;
  const nozzleWidth = document.querySelector("#nozzle-width").value;
  const infill = document.querySelector("#infill").value;
  const supports = document.querySelector("#supports").value;
  const pieces = document.querySelector("#pieces").value;
  const note = document.querySelector("#note").value;

  if (!file) {
    console.error("No file selected.");
    window.alert("Please choose a file to upload");
    return;
  }

  const formData = new FormData();
  formData.append("email", email);
  formData.append("file", file);
  formData.append("layer height", layerHeight);
  formData.append("nozzle width", nozzleWidth);
  formData.append("infill", infill);
  formData.append("supports", supports);
  formData.append("pieces", pieces);
  formData.append("note", note);

  fetch("/upload_model", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      // Handle the response data as needed
      showFileInfo(fileInput);

      // A sample string for demo purposes. Will be updated to reflect real order details after model has been sliced
      const demoOrderDetails = "Print Cost: $2.36\nPress Ok to submit order for admin review, or Cancel to cancel";
      // Alerts user of the total cost of print. Ok sends print for admin review, Cancel cancels the print job
      if (confirm(demoOrderDetails)) {
        window.alert("Your order was successfully sent for review\nPlease monitor your email for admin approval");
        document.querySelector(".order-form").reset();
      } else {
        window.alert("Your order was cancelled");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      // alerts the user of an error while uploading order
      window.alert("There was a problem submitting your order\nPlease try again");
    });
}

// downloads the inputted file into user local directory
function downloadFile(fileInput) {
  // hidden anchor element that allows to "click" a href
  let a = document.createElement("a");
  document.body.appendChild(a);
  a.style = "display: none";

  let blob = new Blob([fileInput]);
  let url = URL.createObjectURL(blob);

  a.href = url;
  a.download = fileInput.files.item(0).name;
  a.click();
  window.URL.revokeObjectURL(url);
}

// displays file info to console for debugging purposes
function showFileInfo(fileInput) {
  if (fileInput.files.item(0) != null) {
    console.log("File Submitted");
    console.log("Name: " + fileInput.files.item(0).name);
    console.log("Size: " + fileInput.files.item(0).size + " bytes");

    // Additional logic to display or handle the file info as needed
  } else {
    console.log("No File Selected");
  }
}

// notifies the user of web api of status of their file upload in the html form
// function displayUploadStatus(status) {
//   const statusMessageContainer = document.querySelector(".status-message-container");
//   statusMessageContainer.innerHTML = '';
//   document.querySelector(".upload-form").reset();

//   if (status === "success") {
//     insertGoogleIcon(statusMessageContainer, "check", "lime");
//   } else if (status === "failure"){
//     insertGoogleIcon(statusMessageContainer, "close", "red");
//   } else {
//     insertGoogleIcon(statusMessageContainer, "question_mark", "yellow");
//   }

//   // status after a given amount of milliseconds
//   setTimeout(function() {
//     statusMessageContainer.innerHTML = '';
//   }, 2000);
// }

// inserts a google icon into an element. Input parameters for element, icon name, and desired color
function insertGoogleIcon(element, iconName, color) {
  element.style.color = color;
  element.innerHTML =
    '<span class="material-symbols-outlined">' + iconName + "</span>";
}
