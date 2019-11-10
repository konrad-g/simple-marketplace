describe("App", function () {

  let vanillaToast;

  beforeEach(function () {
    // Init client
    vanillaToast = new VanillaToast(document.body);
  });

  afterEach(function () {
    vanillaToast = null;
  });

  it("Can display toast success message", function () {

    // Given toast button
    // When we show it
    vanillaToast.showSuccess("Success", "You made it.");

    // Then toast appears
    let toast = $(document.body).find(".vanilla-toast-container-fixed");
    expect(toast.length).not.toBe(0);
    expect(toast.text().indexOf("Success")).not.toBe(-1);
    expect(toast.text().indexOf("You made it.")).not.toBe(-1);
  });

  it("Can display toast info message", function () {

    // Given toast button
    // When we show it
    vanillaToast.showInfo("Info", "Now you know.");

    // Then toast appears
    let toast = $(document.body).find(".vanilla-toast-container-fixed");
    expect(toast.length).not.toBe(0);
    expect(toast.text().indexOf("Info")).not.toBe(-1);
    expect(toast.text().indexOf("Now you know.")).not.toBe(-1);
  });

  it("Can display toast error message", function () {

    // Given toast button
    // When we show it
    vanillaToast.showError("Error", "We have problem.");

    // Then toast appears
    let toast = $(document.body).find(".vanilla-toast-container-fixed");
    expect(toast.length).not.toBe(0);
    expect(toast.text().indexOf("Error")).not.toBe(-1);
    expect(toast.text().indexOf("We have problem.")).not.toBe(-1);
  });
});
