if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(success, error);
}

function success(position) {
  var latitude = position.coords.latitude;
  var longitude = position.coords.longitude;
}

function error() {
  console.log("Location can't be found");
}
