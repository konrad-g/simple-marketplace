/// <reference path="BaseLoader.ts" />

interface JQueryStatic {
  pjax: any;
}

class FormsLoader extends BaseLoader {
  private isOtherLoadingCallback: any;
  private onFormLoadStartedCallback: any;
  private onLoadStartedCallback: any;
  private onLoadFinishCallback: any;
  private triggerOn: any;
  private mainContainerId: any;
  private cancelRequest: (xhrRequest?: any) => void;
  private _isLoading: boolean = false;
  private focusedElementId = null;
  private windowScrollPx: number;

  static instance: FormsLoader;

  public static getInstance() {
    if (!FormsLoader.instance) {
      FormsLoader.instance = new FormsLoader();
    }

    return FormsLoader.instance;
  }

  public init(isOtherLoadingCallback: any, triggerOn: any, mainContainerId: string): any {
    const self = this;
    this.triggerOn = triggerOn;
    this.isOtherLoadingCallback = isOtherLoadingCallback;
    this.mainContainerId = mainContainerId;

    $("body").on("pjax:start", function() {});
    $("body").on("pjax:end", function() {});

    $(document).on("submit", triggerOn, function(event) {
      event.preventDefault();
      self.submitForm(event);
    });
  }

  private cleanListeners() {
    this._isLoading = false;
    $("body").off("pjax:complete");
    $("body").off("pjax:error");
    $("body").off("pjax:timeout");
  }

  public submitForm(event: any) {
    const self = this;

    $("body")
      .off("pjax:complete")
      .on("pjax:complete", function() {
        self.cleanListeners();
        self.focusOnPreviousElement();
        self.onLoadFinishCallback(true);
        $(window).scrollTop(self.windowScrollPx);
      });

    $("body")
      .off("pjax:error")
      .on("pjax:error", function(event, xhr, textStatus, errorThrown, options) {
        event.preventDefault();
        self.cleanListeners();
        options.success(xhr.responseText, textStatus, xhr);
        self.cancelRequest(xhr);
        self.onLoadFinishCallback(false);
        return false;
      });

    $("body")
      .off("pjax:timeout")
      .on("pjax:timeout", function(event, xhr, options) {
        event.preventDefault();
        self.cleanListeners();
        self.cancelRequest(xhr);
        self.onLoadFinishCallback(false);
      });

    self._isLoading = true;

    if (document.activeElement) {
      self.focusedElementId = document.activeElement.getAttribute("id");
    }

    self.windowScrollPx = $(window).scrollTop();

    const containerId = self.mainContainerId;
    $.pjax.submit(event, containerId);

    let form = $(event.currentTarget);
    self.onFormLoadStartedCallback(form);
    self.onLoadStartedCallback(true);
  }

  public setCancelRequest(cancelRequest: (xhrRequest?: any) => void) {
    this.cancelRequest = cancelRequest;
  }

  public isLoading(): boolean {
    return this._isLoading;
  }

  public stopLoading() {
    if (!this._isLoading) return;
    this.cleanListeners();
    this.cancelRequest();
  }

  public setOnLoadStartedListener(callback: (isNewPage: boolean, isReloadingPreviousPage: boolean) => void) {
    this.onLoadStartedCallback = (isNewPage: boolean = false, isReloadingPreviousPage: boolean) => {
      callback(isNewPage, isReloadingPreviousPage);
    };
  }

  public setOnLoadFinishedListener(callback: any) {
    this.onLoadFinishCallback = success => {
      callback(success);
    };
  }

  public setOnFormLoadStartedListener(callback: any) {
    this.onFormLoadStartedCallback = (form: any) => {
      callback(form);
    };
  }

  public notifyPageChange() {}

  private focusOnPreviousElement() {
    const self = this;

    if (self.focusedElementId) {
      let newFocusElement: any = document.getElementById(self.focusedElementId);
      if (!newFocusElement) return;
      newFocusElement.focus();

      if (newFocusElement.value) {
        let currentValue = newFocusElement.value;
        newFocusElement.value = "";
        newFocusElement.value = currentValue;
      }
    }
  }
}
