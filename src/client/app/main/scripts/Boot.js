var app = new App();

$(function () {
  app.start();
});

if (!window.location.hostname.includes("localhost")) {
  app.addErrorHandling();
}
