// toggles dark/light mode for entire page
const darkModeToggle = document.querySelector("button[id=dark-mode-toggle]");
darkModeToggle.onclick = function () {
  const modeIcon = document.querySelector("#dark-mode-toggle");

  // allows for toggle of psu logo image with light/dark mode and flask
  const image = document.querySelector(".psu-logo");
  const darkSrc = image.getAttribute("dark-src");
  const lightSrc = image.getAttribute("light-src");

  // check what mode is currently active
  if (modeIcon.innerHTML.includes("light_mode")) {
    console.log("dark mode active");
    insertGoogleIcon(modeIcon, "dark_mode", "white");
    // dark most psu logo
    image.src = darkSrc;
  } else {
    console.log("light mode active");
    insertGoogleIcon(modeIcon, "light_mode", "black");
    // light mode psu logo
    image.src = lightSrc;
  }
  // individual elements to toggle dark mode on by selector
  // must have an associated "dark-mode" css class to work
  toggleDarkMode(".order-form");
  toggleDarkMode("body");
  toggleDarkMode(".header-box");
  toggleDarkMode(".header-text");
  toggleDarkMode(".multi-purpose-modal-content");
  toggleDarkMode(".review-order-modal-content");
};

// dark mode color scheme toggle for individual selectors
function toggleDarkMode(selector) {
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
  }
}

let submitButton = document.querySelector("#submit-button");
submitButton.onclick = function (event) {
  const email = document.querySelector("#email").value;
  const fileInput = document.querySelector("#file-input");
  const file = fileInput.files[0];
  const filamentType = document.querySelector("#filament-type").value;
  const layerHeight = document.querySelector("#layer-height").value;
  const nozzleSize = document.querySelector("#nozzle-size").value;
  const infill = document.querySelector("#infill").value;
  const quantity = document.querySelector("#quantity").value;
  const note = document.querySelector("#note").value;

  // prevents 'normal' form submit operations so we can instead control flow through modal windows
  event.preventDefault();
  // check fields of form, returns a boolean on if checks pass or not
  let checksPass = formFieldCheck(
    email,
    file,
    fileInput,
    filamentType,
    nozzleSize,
    layerHeight,
    infill,
    quantity,
    note
  );
  // if all form checks have passed, then open the order review modal
  if (checksPass) {
    openReviewModal(
      email,
      file,
      fileInput,
      filamentType,
      nozzleSize,
      layerHeight,
      infill,
      quantity,
      note
    );
  }
};

// function that performs checks on form fields, all fields are passed as parameters
// returns true if all check pass, false otherwise
// add any checks wish to perform here
function formFieldCheck(
  email,
  file,
  fileInput,
  filamentType,
  nozzleSize,
  layerHeight,
  infill,
  quantity,
  note
) {
  // verify that email field populated
  if (email === "") {
    console.error("Email field empty");
    openEmptyEmailFieldModal();
    return false;
  }

  // verify that a file is selected for upload
  if (!file) {
    console.error("No file selected.");
    openNoFileSelectedModal();
    return false;
  }

  // verify quantity is an integer
  if (!Number.isInteger(+quantity)) {
    console.error("Quantity must be integer value");
    openQuantityIntegerModal();
    return false;
  }

  // verify quantity is greater than 0
  if (quantity < 1) {
    console.error("Quantity outside allowed range");
    openQuantityRangeModal();
    return false;
  }

  // if all checks pass, return true
  return true;
}

// Opens a modal that displays print details to the user. Allows them to review their order details and then approve if they are correct
// if user approves, the form data will be sent
function openReviewModal(
  email,
  file,
  fileInput,
  filamentType,
  nozzleSize,
  layerHeight,
  infill,
  quantity,
  note
) {
  const reviewModal = document.querySelector(".review-order-modal");
  const reviewModalApproveButton = document.querySelector(
    "#review-modal-approve-button"
  );
  const reviewModalCancelButton = document.querySelector(
    "#review-modal-cancel-button"
  );

  let orderReview = document.querySelector(".order-review");
  orderReview.innerHTML = "Email: " + email + "<br>";
  orderReview.innerHTML += "File: " + fileInput.files.item(0).name + "<br>";
  orderReview.innerHTML += "Filament Type: " + filamentType + "<br>";
  orderReview.innerHTML += "Nozzle Size: " + nozzleSize + "mm<br>";
  orderReview.innerHTML += "Layer Height: " + layerHeight + "mm<br>";
  orderReview.innerHTML += "Infill: " + infill + "%<br>";
  orderReview.innerHTML += "Quantity: " + quantity + "<br>";
  orderReview.innerHtml += "Note: " + note + "<br>";
  reviewModal.style.display = "block";

  reviewModalApproveButton.onclick = function () {
    // send the form data
    uploadAndShowFile(
      email,
      file,
      fileInput,
      filamentType,
      nozzleSize,
      layerHeight,
      infill,
      quantity,
      note
    );
    // close (hide) review modal
    reviewModal.style.display = "none";
  };

  reviewModalCancelButton.onclick = function () {
    // close (hide) review modal
    reviewModal.style.display = "none";
    // open modal window verifying order has been cancelled
    openCancelOrderModal();
  };
}

// submits the form data to the staff api for approval/denial
// Success response opens a modal to inform user of success, error response opens modal informing user an error occured
function uploadAndShowFile(
  email,
  file,
  fileInput,
  filamentType,
  nozzleSize,
  layerHeight,
  infill,
  quantity,
  note
) {
  const formData = new FormData();
  formData.append("email", email);
  formData.append("file", file);
  // not currently sending filament_type field until ready for it downstream
  // format of filament type value material,color example: pla,black
  formData.append("filament_type", filamentType);
  formData.append("layer_height", layerHeight);
  formData.append("nozzle_size", nozzleSize);
  formData.append("infill", infill);
  formData.append("quantity", quantity);
  formData.append("note", note);

  fetch("/order", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      // Handle the response data as needed
      showFileInfo(fileInput);

      // notify the user of success and next steps
      openOrderSuccessModal();
    })
    .catch((error) => {
      console.error("Error:", error);

      // notify the user there was an error while uploading order
      openSubmissionErrorModal();
    });
}

// Displays a message to the user that there print was successful uploaded for review and informs next steps
function openOrderSuccessModal() {
  const successModal = document.querySelector(".multi-purpose-modal");
  const orderSuccessOkButton = document.querySelector(
    "#multi-purpose-ok-button"
  );
  const lineOne = document.querySelector("#line1");
  const lineTwo = document.querySelector("#line2");

  lineOne.innerHTML = "Your order was successfully sent for review";
  lineTwo.innerHTML =
    "Please monitor your email for admin approval and payment link";

  successModal.style.display = "block";

  orderSuccessOkButton.onclick = function () {
    // close (hide) order success modal
    successModal.style.display = "none";

    // reset the form
    document.querySelector(".order-form").reset();
  };
}

// Displays a message to the user that there order was cancelled
function openCancelOrderModal() {
  const cancelOrderModal = document.querySelector(".multi-purpose-modal");
  const orderCancelOkButton = document.querySelector(
    "#multi-purpose-ok-button"
  );
  const lineOne = document.querySelector("#line1");
  const lineTwo = document.querySelector("#line2");

  lineOne.innerHTML = "Your order was cancelled";
  lineTwo.innerHTML = "";

  cancelOrderModal.style.display = "block";

  orderCancelOkButton.onclick = function () {
    // close (hide) cancel order modal
    cancelOrderModal.style.display = "none";
  };
}

// Displays a message to the user that no file was selected for upload
function openNoFileSelectedModal() {
  const noFileModal = document.querySelector(".multi-purpose-modal");
  const noFileOkButton = document.querySelector("#multi-purpose-ok-button");
  const lineOne = document.querySelector("#line1");
  const lineTwo = document.querySelector("#line2");

  lineOne.innerHTML = "No file selected";
  lineTwo.innerHTML = "Please select a file to upload";

  noFileModal.style.display = "block";

  noFileOkButton.onclick = function () {
    // close (hide) no file modal
    noFileModal.style.display = "none";
  };
}

// Displays a message to the user if there is an issue with submission
function openSubmissionErrorModal() {
  const submissionErrorModal = document.querySelector(".multi-purpose-modal");
  const submissionErrorOkButton = document.querySelector(
    "#multi-purpose-ok-button"
  );
  const lineOne = document.querySelector("#line1");
  const lineTwo = document.querySelector("#line2");

  lineOne.innerHTML = "There was a problem submitting your order";
  lineTwo.innerHTML = "Please try again";

  submissionErrorModal.style.display = "block";

  submissionErrorOkButton.onclick = function () {
    // close (hide) submission error modal
    submissionErrorModal.style.display = "none";
  };
}

// Displays a message to the user that no file was selected for upload
function openLayerHeightErrorModal() {
  const layerErrorModal = document.querySelector(".multi-purpose-modal");
  const layerErrorOkButton = document.querySelector("#multi-purpose-ok-button");
  const lineOne = document.querySelector("#line1");
  const lineTwo = document.querySelector("#line2");

  lineOne.innerHTML =
    "The layer height value you entered is outside the allowed range";
  lineTwo.innerHTML = "Minimum layer height: 0.15 mm";

  layerErrorModal.style.display = "block";

  layerErrorOkButton.onclick = function () {
    // close (hide) modal
    layerErrorModal.style.display = "none";
  };
}

// Displays a message to the user if the email field is blank on the order form
function openEmptyEmailFieldModal() {
  const emptyEmailFieldModal = document.querySelector(".multi-purpose-modal");
  const emptyEmailFieldOkButton = document.querySelector(
    "#multi-purpose-ok-button"
  );
  const lineOne = document.querySelector("#line1");
  const lineTwo = document.querySelector("#line2");

  lineOne.innerHTML = "The email field cannot be empty";
  lineTwo.innerHTML = "Please enter a valid email";

  emptyEmailFieldModal.style.display = "block";

  emptyEmailFieldOkButton.onclick = function () {
    // close (hide) modal
    emptyEmailFieldModal.style.display = "none";
  };
}

// Displays a message to the user if the quantity entered is not an integer value
function openQuantityIntegerModal() {
  const quantityIntegerModal = document.querySelector(".multi-purpose-modal");
  const quantityOkButton = document.querySelector("#multi-purpose-ok-button");
  const lineOne = document.querySelector("#line1");
  const lineTwo = document.querySelector("#line2");

  lineOne.innerHTML = "Quantity must be entered as an integer value";
  lineTwo.innerHTML = "Please enter an integer of 1 or greater";

  quantityIntegerModal.style.display = "block";

  quantityOkButton.onclick = function () {
    // close (hide) modal
    quantityIntegerModal.style.display = "none";
  };
}

// Displays a message to the user if the quantity is outside allowed range
function openQuantityRangeModal() {
  const quantityRangeModal = document.querySelector(".multi-purpose-modal");
  const quantityOkButton = document.querySelector("#multi-purpose-ok-button");
  const lineOne = document.querySelector("#line1");
  const lineTwo = document.querySelector("#line2");

  lineOne.innerHTML = "The quantity entered is outside the allowed range";
  lineTwo.innerHTML = "Please enter a quantity of 1 or greater";

  quantityRangeModal.style.display = "block";

  quantityOkButton.onclick = function () {
    // close (hide) modal
    quantityRangeModal.style.display = "none";
  };
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

// dyamically updates the options presented for "Layer Height" depending on the user selection
// for "Nozzle Size" (0.6: 0.3, 0.15) and (0.4: 0.2, 0.1)
document.addEventListener("DOMContentLoaded", function () {
  const nozzleSelect = document.querySelector("#nozzle-size");
  const layerHeightSelect = document.querySelector("#layer-height");

  function updateLayerHeightOptions() {
    const nozzleSize = nozzleSelect.value;
    let options = [];

    if (nozzleSize === "0.4") {
      options = [
        { text: "0.2", value: "0.2" },
        { text: "0.1", value: "0.1" },
      ];
    } else if (nozzleSize === "0.6") {
      options = [
        { text: "0.3", value: "0.3" },
        { text: "0.15", value: "0.15" },
      ];
    }

    // Clear existing options
    layerHeightSelect.innerHTML = "";

    // Add new options
    options.forEach(function (option) {
      const optionElement = document.createElement("option");
      optionElement.value = option.value;
      optionElement.textContent = option.text;
      layerHeightSelect.appendChild(optionElement);
    });
  }

  // Initialize with the default nozzle size
  updateLayerHeightOptions();

  // Event listener for nozzle size change
  nozzleSelect.addEventListener("change", updateLayerHeightOptions);
});

// populates the 'filament type' field on the form with current invetory of filaments and colors
// as specified from the staff filament inventory page
document.addEventListener("DOMContentLoaded", function () {
  function populateFilamentInventory() {
    console.log("populate filament inventory");
    fetch("/staff/get_filament_inventory", {
      method: "GET",
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);

        const filamentType = document.querySelector("#filament-type");
        let options = [];

        for (let i = 0; i < data.filaments.length; i++) {
          if (data.filaments[i].in_stock) {
            let filamentColors = data.filament_colors[data.filaments[i].id];
            for (let j = 0; j < filamentColors.length; j++) {
              options.push(
                `${data.filaments[i].type}, ${filamentColors[j].color}`
              );
            }
          }
        }
        console.log(`filament options: ${options}`);

        // Clear existing options
        filamentType.innerHTML = "";

        // Add new options for filament type and color
        options.forEach(function (option) {
          const optionElement = document.createElement("option");
          optionElement.value = option;
          optionElement.textContent = option;
          filamentType.appendChild(optionElement);
        });
      })
      .catch((error) => {
        console.error("Error: ", error);
      });
  }
  populateFilamentInventory();
});
