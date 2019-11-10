/// <reference path="BaseLoader.ts" />

interface JQueryStatic {
  pjax: any;
}

class LinksLoader extends BaseLoader {
  private isOtherLoadingCallback: any;
  private onLoadStartedCallback: (isNewPage: boolean, isReloadingPreviousPage: boolean) => void;
  private onLoadFinishCallback: any;
  private triggerOn: any;
  private mainContainerId: string;
  private cancelRequest: (xhrRequest?: any) => void;
  private _isLoading: boolean = false;

  static instance: LinksLoader;

  public static getInstance() {
    if (!LinksLoader.instance) {
      LinksLoader.instance = new LinksLoader();
    }

    return LinksLoader.instance;
  }

  public init(isOtherLoadingCallback: any, triggerOn: any, mainContainerId: string): any {
    const self = this;
    this.triggerOn = triggerOn;
    this.mainContainerId = mainContainerId;
    this.isOtherLoadingCallback = isOtherLoadingCallback;

    $("body").on("pjax:start", function() {});
    $("body").on("pjax:end", function() {});

    // Disable default behaviour
    $("body")
      .off("click", self.triggerOn)
      .on("click", self.triggerOn, function(event: any) {
        event.preventDefault();

        let url = event.currentTarget.href;
        self.openLink(url);

        return false;
      });

    this.reloadOnGoingBack();
  }

  public setCancelRequest(cancelRequest: (xhrRequest?: any) => void) {
    this.cancelRequest = cancelRequest;
  }

  public isLoading(): boolean {
    return this._isLoading;
  }

  public setOnLoadStartedListener(callback: (isNewPage: boolean, isReloadingPreviousPage: boolean) => void) {
    this.onLoadStartedCallback = (isNewPage, isReloadingPreviousPage) => {
      callback(isNewPage, isReloadingPreviousPage);
    };
  }

  public setOnLoadFinishedListener(callback: any) {
    this.onLoadFinishCallback = success => {
      callback(success);
    };
  }

  public reloadPage(isReloadingPreviousPage: boolean = false): boolean {
    if (!this.isOtherLoadingCallback()) {
      this.onLoadStartedCallback(false, isReloadingPreviousPage);
      this.addOnFinishListeners();
      $.pjax.reload(this.mainContainerId, null);
      return true;
    }

    return false;
  }

  public notifyPageChange() {}

  public openLink(url: string, skipSavingHistory: boolean = false) {
    this.addOnFinishListeners();

    const self = this;

    if (!url || url === "#") {
      // URL is not valid
      return false;
    }

    if (self.isOtherLoadingCallback()) {
      // Application is currently reloading
      return false;
    }

    if (url === window.location.href && history.pushState) {
      // URL already is loaded
      return false;
    }

    self._isLoading = true;
    self.onLoadStartedCallback(true, false);

    $.pjax({
      url: url,
      scrollTo: 0,
      container: self.mainContainerId
    });
  }

  public stopLoading() {
    if (!this._isLoading) return;
    this.cleanListeners();
    this.cancelRequest();
  }

  private cleanListeners() {
    this._isLoading = false;
    $("body").off("pjax:complete");
    $("body").off("pjax:error");
    $("body").off("pjax:timeout");
  }

  private addOnFinishListeners() {
    const self = this;

    $("body")
      .off("pjax:complete")
      .on("pjax:complete", function() {
        self.cleanListeners();
        self.onLoadFinishCallback(true);
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

        // Hard realod the URL
        const currentUrl = document.location.href;
        document.location.href = currentUrl;

        self.onLoadFinishCallback(false);
      });
  }

  private reloadOnGoingBack() {
    const self = this;

    window.onpopstate = function(event) {
      self.reloadPage(true);
    };
  }
}
