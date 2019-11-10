/// <reference path="App.ts" />
/// <reference path="../../../../../client-libs/node_modules/@kgadzinowski/vanilla-toast/src/scripts/VanillaToast.ts" />

interface JQueryStatic {
  listen: any;
}

declare let Raven: any;

class AppListener {
  app: App;
  toast: VanillaToast;

  constructor(app: App) {
    this.app = app;
    this.toast = new VanillaToast(document.body);
  }

  /* UI */

  showLoading() {
    let nprogressConfig: any = { parent: "body", showSpinner: false };
    NProgress.configure(nprogressConfig);
    NProgress.start();
  }

  hideLoading() {
    NProgress.done();
  }

  /* Full page loader */

  showFullPageLoading(message: string) {
    LoaderFullScreen.show(message);
  }

  hideFullPageLoading() {
    LoaderFullScreen.hide();
  }

  /* Toast */

  showToastSuccess(title: string, msg: string) {
    this.toast.showSuccess(title, msg);
  }

  showToastInfo(title: string, msg: string) {
    this.toast.showInfo(title, msg);
  }

  showToastError(title: string, msg: string) {
    this.toast.showError(title, msg);
  }

  /* Other */

  reloadPage() {
    this.app.linksLoader.reloadPage();
  }

  public openLink(url: string) {
    this.app.linksLoader.openLink(url);
  }

  public setupForms() {
    let forms: any = $("form[data-parsley-validate]");

    if (forms.length) {
      // Setup form and reset previous state
      try {
        forms.parsley({ excluded: ":disabled" }).reset();
      } catch (err) {}

      $(".parsley-errors-list").remove();

      // Don't validate hidden fields
      $.listen("parsley:field:validated", function(fieldInstance) {
        if (fieldInstance.$element.is(":hidden") && fieldInstance.$element.attr("validate") === undefined) {
          fieldInstance._ui.$errorsWrapper.css("display", "none");
          fieldInstance.validationResult = true;
          return true;
        }
      });
    }
  }

  public getErrorMessageFromResponse(msg: string): string {
    let result = msg;

    try {
      if (msg.indexOf("msg")) {
        result = "";
        let errors = JSON.parse(msg);
        if (errors.length > 0) {
          for (let error of errors) {
            result += error.msg + " ";
          }
        } else {
          result = errors.msg;
        }
      }
    } catch (err) {
      return result;
    }

    return result;
  }

  public updateUrl(url) {
    if (history.replaceState) history.replaceState($.pjax.state, document.title, url);
  }
}
