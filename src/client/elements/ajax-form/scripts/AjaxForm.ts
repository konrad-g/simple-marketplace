class AjaxForm {
  private selectorForm;
  private messageContainer;
  private onSubmit: Array<(event, form) => void>;
  private onSuccess: (response, form) => void;
  private onRedirect: (response, form) => void;
  private onError: (response, form) => void;
  private customRequest: (url, method, dataArray) => void;

  private formInput;
  private formTextArea;
  private formSelect;
  private formButton;
  private formLinkAjax;
  private formLink;
  private formButtonShowLoading;

  private isLoading;
  private displayRawResponseOnSuccess: boolean = false;
  private enableFormOnSuccess: boolean = false;
  private updateUrl: boolean = false;

  constructor(selectorForm?, selectorMessageContainer?, updateUrl: boolean = false, displayRawResponseOnSuccess: boolean = false, enableFormOnSuccess: boolean = false) {
    this.selectorForm = selectorForm;
    this.messageContainer = $(selectorMessageContainer);
    this.isLoading = false;
    this.displayRawResponseOnSuccess = displayRawResponseOnSuccess;
    this.enableFormOnSuccess = enableFormOnSuccess;
    this.updateUrl = updateUrl;
    this.onSubmit = [];
  }

  init() {
    const self = this;
    let forms: any = $(this.selectorForm);
    if (forms.constructor !== Array) forms = [forms];

    for (let form of forms) {
      this.setupForm(form);
    }
  }

  setupForm(form) {
    const self = this;

    $(form)
      .off("submit")
      .on("submit", function(event) {
        event.preventDefault();

        let form: any = $(this);

        for (let submit of self.onSubmit) {
          let result = submit(event, form);
          if (!result) return false;
        }

        if (!!form.parsley) {
          if (!form.parsley().isValid || !form.parsley().isValid()) {
            form.parsley().validate();
            return false;
          }
        }

        if (self.isLoading) return true;

        let url = form.attr("action");
        let data = new FormData(<any>$(this)[0]);
        let dataArray = $(this).serializeArray();
        let method = form.attr("method");

        self.disableForm(form);
        self.isLoading = true;

        if (self.customRequest) {
          self.customRequest(url, method, dataArray);
          return false;
        }

        (<any>$).ajax({
          url: url,
          method: method,
          data: data,
          processData: false,
          contentType: false,
          enctype: "multipart/form-data",
          complete: (response, xhr, settings) => {
            let responseText = response.responseText;
            self.isLoading = false;

            if (self.updateUrl && (!method || method.toUpperCase() === "GET") && history.pushState) {
              url = self.getGetUrl(url, dataArray);
              history.pushState($.pjax.state, document.title, url);
            }

            let status = response.status;

            if (status === 200) {
              self.showMessage(responseText, "success");
              if (self.enableFormOnSuccess) self.enableForm();
              if (!!self.onSuccess) self.onSuccess(response, form);
            } else if (status === 301 || status === 302) {
              self.showMessage(responseText, "warning");
              if (self.enableFormOnSuccess) self.enableForm();
              if (!!self.onRedirect) self.onRedirect(response, form);
            } else {
              self.showMessage(responseText, "danger");
              self.enableForm();
              if (!!self.onError) self.onError(response, form);
            }

            event.preventDefault();
            return false;
          }
        });
        return false;
      });
  }

  getGetUrl(url, dataArray) {
    if (url.indexOf("?") === url.length - 1) url = url.substr(0, url.length - 1);

    let index = 0;
    for (let dataEntry of dataArray) {
      let key = dataEntry["name"];
      let value = encodeURIComponent(dataEntry["value"]);

      if (!key || key === "ajax" || key === "_csrf" || key === "pjax" || key === "_pjax") continue;
      if (index === 0) url += "?" + key + "=" + value;
      else url += "&" + key + "=" + value;
      index++;
    }

    return url;
  }

  showMessage(text, type) {
    if (this.messageContainer.length === 0 || !text || text.length === 0 || !type || type.length === 0) return;

    if (this.isTextJson(text)) {
      let textJson = JSON.parse(text);
      if (!!textJson["msg"] && textJson["msg"].length > 0) {
        text = textJson["msg"];
      }

      // Parse list of errors
      if (!!textJson[0] && !!textJson[0].msg) {
        text = "";
        for (let textEntry of textJson) {
          if (text.length > 0) text += "<br/>";
          text += textEntry.msg;
        }
      }
    }

    let html = "";

    if (this.displayRawResponseOnSuccess && type === "success") {
      html = text;
    } else {
      html = '<div class="alert alert-' + type + ' fade in">' + '<button type="button" data-dismiss="alert" class="close"><i class="fa fa-text fa-times-circle-o"></i></button>' + text + "</div>";
    }

    this.messageContainer.html(html);
  }

  setCustomRequest(customRequest: (url, method, dataArray) => void) {
    this.customRequest = customRequest;
  }

  setIsLoading(isLoading: boolean) {
    this.isLoading = isLoading;
  }

  enableForm() {
    this.formInput.each(function() {
      $(this).removeAttr("disabled");
    });

    this.formTextArea.each(function() {
      $(this).removeAttr("disabled");
    });

    this.formSelect.each(function() {
      $(this).removeAttr("disabled");
    });

    this.formButton.each(function() {
      $(this).removeAttr("disabled");
    });

    this.formLinkAjax.each(function() {
      $(this).addClass("ajax");
    });

    this.formLink.each(function() {
      $(this).removeAttr("disabled");
      $(this).attr("href", "javascript:void(0);");

      let link = $(this).attr("link");
      $(this).attr("href", link);
      $(this).removeAttr("link");
    });

    this.formButtonShowLoading.each(function() {
      $(this)
        .find(".app-loader-in-button")
        .remove();
    });
  }

  disableForm(form) {
    this.formInput = $("input:not([disabled])", form);
    this.formTextArea = $("textarea:not([disabled])", form);
    this.formSelect = $("select:not([disabled])", form);
    this.formButton = $("button:not([disabled])", form);
    this.formLinkAjax = $("a.ajax", form);
    this.formLink = $("a:not([disabled])", form);
    this.formButtonShowLoading = $("button.app-show-loading:submit", form);

    this.formInput.each(function() {
      $(this).prop("disabled", "true");
    });

    this.formTextArea.each(function() {
      $(this).prop("disabled", "true");
    });

    this.formSelect.each(function() {
      $(this).prop("disabled", "true");
    });

    this.formButton.each(function() {
      $(this).prop("disabled", "true");
    });

    this.formLinkAjax.each(function() {
      $(this).removeClass("ajax");
    });

    this.formLink.each(function() {
      $(this).attr("disabled", "true");
      let link = $(this).attr("href");
      $(this).attr("link", link);
      $(this).attr("href", "javascript:void(0);");
    });

    this.formButtonShowLoading.each(function() {
      $(this).append("<div class='app-loader-in-button'></div>");
    });
  }

  validate() {
    let form: any = $(this.selectorForm);
    let parsley = form.parsley();
    if (!!parsley) parsley.validate();
  }

  setOnSubmitListener(onSubmit: (event, form) => void) {
    this.onSubmit.push(onSubmit);
  }

  setOnSuccessListener(onSuccess: (response, form) => void) {
    this.onSuccess = onSuccess;
  }

  setOnRedirectListener(onRedirect: (response, form) => void) {
    this.onRedirect = onRedirect;
  }

  setOnErrorListener(onError: (response, form) => void) {
    this.onError = onError;
  }

  isTextJson(str) {
    try {
      JSON.parse(str);
    } catch (event) {
      return false;
    }
    return true;
  }
}
