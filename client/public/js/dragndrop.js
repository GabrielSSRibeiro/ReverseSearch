let dropArea = document.getElementById("drop-area");

["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
  dropArea.addEventListener(eventName, preventDefaults, false);
  document.body.addEventListener(eventName, preventDefaults, false);
});
["dragenter", "dragover"].forEach((eventName) => {
  dropArea.addEventListener(eventName, highlight, false);
});
["dragleave", "drop"].forEach((eventName) => {
  dropArea.addEventListener(eventName, unhighlight, false);
});

dropArea.addEventListener("drop", handleDrop, false);

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function highlight(e) {
  dropArea.classList.add("highlight");
}

function unhighlight(e) {
  dropArea.classList.remove("active");
}

function handleDrop(e) {
  var dt = e.dataTransfer;
  var files = dt.files;

  const currentInput = document.getElementById("file-pb");
  currentInput.files = files;

  handleFiles(files);
}

let gallery = document.getElementById("gallery");

function handleFiles(files) {
  files = [...files];
  gallery.innerHTML = "";
  files.forEach(previewFile);
}

function previewFile(file) {
  let reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onloadend = function (e) {
    console.log("fr: ", file.name);

    let newP = document.createElement("p");

    newP.className = "gal-p";
    newP.innerHTML = file.name;
    gallery.appendChild(newP);
  };
}

var loadFile = function (event) {
  var output = document.getElementById("output");
  output.src = URL.createObjectURL(event.target.files[0]);
  output.onload = function () {
    URL.revokeObjectURL(output.src); // free memory
  };
};
