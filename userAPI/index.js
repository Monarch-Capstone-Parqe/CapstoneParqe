let submitButton = document.getElementById("submit-button");
submitButton.addEventListener("click", showSubmittedFile);

function showSubmittedFile() {
  let fileInput = document.getElementById("file-input");
  if (fileInput.files.item(0) != null) {
    console.log("File Submitted");
    console.log("Name: " + fileInput.files.item(0).name);
    console.log("Size: " + fileInput.files.item(0).size + " bytes");
  } else {
    console.log("No File Selected");
  }
}
