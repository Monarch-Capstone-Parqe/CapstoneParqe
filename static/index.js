let submitButton = document.querySelector("#submit-button");
submitButton.onclick = function (event) {
  event.preventDefault();
  uploadAndShowFile();
};
function uploadAndShowFile() {
  const fileInput = document.querySelector("#file-input");
  const file = fileInput.files[0];

  if (!file) {
    console.error("No file selected.");
    displayUploadStatus("noFile");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  fetch("/upload_model", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      // Handle the response data as needed
      showFileInfo(fileInput);
      displayUploadStatus("success");
    })
    .catch((error) => {
      console.error("Error:", error);
      displayUploadStatus("failure");
    });
}

function displayUploadStatus(status) {
  const statusMessageContainer = document.querySelector("#status-message-container");
  statusMessageContainer.innerHTML = '';
  document.querySelector("#upload-form").reset();

  if (status === "success") {
    statusMessageContainer.style.color = "lime";
    statusMessageContainer.innerHTML = '<span class="material-symbols-outlined">check</span>';
  } else if (status === "failure"){
    statusMessageContainer.style.color = "red";
    statusMessageContainer.innerHTML = '<span class="material-symbols-outlined">close</span>';
  } else {
    statusMessageContainer.style.color = "yellow";
    statusMessageContainer.innerHTML = '<span class="material-symbols-outlined">question_mark</span>';
  }
}

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
