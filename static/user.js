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

      // Demo price to test modal. Send actual cost from gcode parse
      let printPrice = "2.34";
      openReviewModal(printPrice);
    })
    .catch((error) => {
      console.error("Error:", error);

      // alerts the user of an error while uploading order
      window.alert("There was a problem submitting your order\nPlease try again");
    });
}

// Displays print cost to user upon form submission, requires approval or cancel before being sent for review
function openReviewModal(cost) {
  const priceModal = document.querySelector(".modal-background");
  const reviewModalApproveButton = document.querySelector("#review-modal-approve-button");
  const reviewModalCancelButton = document.querySelector("#review-modal-cancel-button");

  let priceString = document.querySelector(".print-cost");
  priceString.innerHTML += cost;
  priceModal.style.display = "block";

  reviewModalApproveButton.onclick = function() {
    priceModal.style.display = "none";

    // TODO make a new custom modal for following alert
    window.alert("Your order was successfully sent for review\nPlease monitor your email for admin approval");
  }

  reviewModalCancelButton.onclick = function() {
    priceModal.style.display = "none";
    
    // TODO make a new custom modal for following alert
    window.alert("Your order was cancelled");
  }
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

// inserts a google icon into an element. Input parameters for element, icon name, and desired color
function insertGoogleIcon(element, iconName, color) {
  element.style.color = color;
  element.innerHTML =
    '<span class="material-symbols-outlined">' + iconName + "</span>";
}
