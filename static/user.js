// toggles dark/light mode (switch)
// const darkModeToggle = document.querySelector("input[name=dark-mode]");
// darkModeToggle.addEventListener("change", function () {
//   const modeIcon = document.querySelector(".mode-icon")
//   if (this.checked) {
//     console.log("dark mode active");
//     insertGoogleIcon(modeIcon, "dark_mode", "white");
//     darkMode(".order-form");
//   } else {
//     console.log("light mode active");
//     insertGoogleIcon(modeIcon, "light_mode", "black");
//     darkMode(".order-form");
//   }
// });

// toggles dark/light mode (no switch)
const darkModeToggle = document.querySelector("button[id=dark-mode-toggle]");
darkModeToggle.onclick = function () {
  const modeIcon = document.querySelector("#dark-mode-toggle");

  // allows for toggle of psu logo image with light/dark mode and flask
  const image = document.querySelector(".psu-logo");
  const darkSrc = image.getAttribute("dark-src");
  const lightSrc = image.getAttribute("light-src");

  if (modeIcon.innerHTML.includes("light_mode")) {
    console.log("dark mode active");
    insertGoogleIcon(modeIcon, "dark_mode", "white");
    darkMode(".order-form");
    darkMode("body");
    darkMode(".header-box");
    darkMode(".header-text");
    darkMode(".multi-purpose-modal-content");
    darkMode(".review-order-modal-content");
    darkMode(".support-recommended-modal-content");
    // dark most psu logo
    image.src = darkSrc;
  } else {
    console.log("light mode active");
    insertGoogleIcon(modeIcon, "light_mode", "black");
    darkMode(".order-form");
    darkMode("body");
    darkMode(".header-box");
    darkMode(".header-text");
    darkMode(".multi-purpose-modal-content");
    darkMode(".review-order-modal-content");
    darkMode(".support-recommended-modal-content");
    // light mode psu logo
    image.src = lightSrc;
  }
};

// dark mode color scheme toggle
function darkMode(selector) {
  const element = document.querySelector(selector);
  if (selector === ".order-form") {
    element.classList.toggle("dark-mode-form");
  } else if (selector === "body") {
    element.classList.toggle("dark-mode-body");
  } else if (selector === ".header-box") {
    element.classList.toggle("dark-mode-header-box");
  } else if (selector === ".header-text") {
    element.classList.toggle("dark-mode-header-text");
  } else if (selector === ".multi-purpose-modal-content") {
    element.classList.toggle("dark-mode-multi-purpose-modal");
  } else if (selector === ".review-order-modal-content") {
    element.classList.toggle("dark-mode-review-order-modal");
  } else if (selector === ".support-recommended-modal-content") {
    element.classList.toggle("dark-mode-support-recommended-modal");
  } 
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
    openNoFileSelectedModal();
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


      // Demo variables to test modal. Parse g code and send actual values
      let originalPrice = "2.34"; // the cost as configured
      let supportsPrice = "3.85"; // cost if prusa recommends adding supports
      let supportsRecommened = true; // flag to catch descripenscy

      if (supportsRecommened) {
        openSupportRecommendedModal(originalPrice, supportsPrice);
      } else {
        openReviewModal(originalPrice);
      }
    })
    .catch((error) => {
      console.error("Error:", error);

      // alerts the user of an error while uploading order
      openSubmissionErrorModal();
    });
}

// Displays print cost to user upon form submission, requires approval or cancel before being sent for review
function openReviewModal(cost) {
  const priceModal = document.querySelector(".review-order-modal");
  const reviewModalApproveButton = document.querySelector("#review-modal-approve-button");
  const reviewModalCancelButton = document.querySelector("#review-modal-cancel-button");

  let priceString = document.querySelector(".print-cost");
  priceString.innerHTML = "Print Cost: $" + cost;
  priceModal.style.display = "block";

  reviewModalApproveButton.onclick = function() {
    // close (hide) review modal
    priceModal.style.display = "none";
    openOrderSuccessModal();
  }

  reviewModalCancelButton.onclick = function() {
    // close (hide) review modal
    priceModal.style.display = "none";
    openCancelOrderModal();
  }
}

// Displays a message to the user that there print was successful uploaded for review and informs next steps
function openOrderSuccessModal() {
  const successModal = document.querySelector(".multi-purpose-modal");
  const orderSuccessOkButton = document.querySelector("#multi-purpose-ok-button");
  const lineOne = document.querySelector('#line1');
  const lineTwo = document.querySelector('#line2');

  lineOne.innerHTML = "Your order was successfully sent for review";
  lineTwo.innerHTML = "Please monitor your email for admin approval";

  successModal.style.display = "block";

  orderSuccessOkButton.onclick = function() {
    // close (hide) order success modal
    successModal.style.display = "none";

    // reset the form
    document.querySelector(".order-form").reset()
  }
}

// Displays a message to the user that there order was cancelled
function openCancelOrderModal() {
  const cancelOrderModal = document.querySelector(".multi-purpose-modal");
  const orderCancelOkButton = document.querySelector("#multi-purpose-ok-button");
  const lineOne = document.querySelector('#line1');
  const lineTwo = document.querySelector('#line2');

  lineOne.innerHTML = "Your order was cancelled";
  lineTwo.innerHTML = "";

  cancelOrderModal.style.display = "block";

  orderCancelOkButton.onclick = function() {
    // close (hide) cancel order modal
    cancelOrderModal.style.display = "none";
  }
}

// Displays a message to the user when prusaslicer recommends supports and allows them to chose to add
function openSupportRecommendedModal(costOriginal, costSupport) {
  const supportRecommendedModal = document.querySelector(".support-recommended-modal");
  const addSupportButton = document.querySelector("#support-recommended-support-button");
  const noSupportButton = document.querySelector("#support-recommended-no-support-button");
  const cancelButton = document.querySelector("#support-recommended-cancel-button");

  const costSupportString = document.querySelector("#support-modal-string");
  const costNoSupportString = document.querySelector("#no-support-modal-string");
  costSupportString.innerHTML = "Cost with added supports: $" + costSupport + " (recommended!)";
  costNoSupportString.innerHTML = "Cost without supports: $" + costOriginal;
  
  supportRecommendedModal.style.display = "block";

  addSupportButton.onclick = function() {
    // close (hide) modal
    supportRecommendedModal.style.display = "none";
    openReviewModal(costSupport);
  }

  noSupportButton.onclick = function() {
    // close (hide) modal
    supportRecommendedModal.style.display = "none";
    openReviewModal(costOriginal);
  }

  cancelButton.onclick = function() {
    // close (hide) modal
    supportRecommendedModal.style.display = "none";
    openCancelOrderModal();
  }
}

// Displays a message to the user that no file was selected for upload
function openNoFileSelectedModal() {
  const noFileModal = document.querySelector(".multi-purpose-modal");
  const noFileOkButton = document.querySelector("#multi-purpose-ok-button");
  const lineOne = document.querySelector('#line1');
  const lineTwo = document.querySelector('#line2');

  lineOne.innerHTML = "No file selected";
  lineTwo.innerHTML = "Please select a file to upload";

  noFileModal.style.display = "block";

  noFileOkButton.onclick = function() {
    // close (hide) no file modal
    noFileModal.style.display = "none";
  }
}

// Displays a message to the user if there is an issue with submission
function openSubmissionErrorModal() {
  const submissionErrorModal = document.querySelector(".multi-purpose-modal");
  const submissionErrorOkButton = document.querySelector("#multi-purpose-ok-button");
  const lineOne = document.querySelector('#line1');
  const lineTwo = document.querySelector('#line2');

  lineOne.innerHTML = "There was a problem submitting your order";
  lineTwo.innerHTML = "Please try again";

  submissionErrorModal.style.display = "block";

  submissionErrorOkButton.onclick = function() {
    // close (hide) submission error modal
    submissionErrorModal.style.display = "none";
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
