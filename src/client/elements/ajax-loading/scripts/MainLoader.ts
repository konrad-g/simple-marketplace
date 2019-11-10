/// <reference path="BaseLoader.ts" />

class MainLoader {
  static instance: MainLoader;
  static loaders: Array<any> = new Array();

  private mainContainerId: string;
  private onPageChangeStart: (isNewPage: boolean, isReloadingPreviousPage: boolean) => void;
  private onPageChangeFinish: any;
  private onUpdatePageMeta: () => void;

  private _isLoading: boolean = false;

  public static getInstance() {
    if (!MainLoader.instance) {
      MainLoader.instance = new MainLoader();
    }

    return MainLoader.instance;
  }

  constructor() {
    this._isLoading = false;
  }

  public init(mainContainerId: string, onPageChangeStart: (isNewPage: boolean, isReloadingPreviousPage: boolean) => void, onPageChangeFinish: any, onUpdatePageMeta: () => void = null) {
    this.mainContainerId = mainContainerId;
    this.onPageChangeStart = onPageChangeStart;
    this.onPageChangeFinish = onPageChangeFinish;
    this.onUpdatePageMeta = onUpdatePageMeta;
    if (!this.onUpdatePageMeta) this.onUpdatePageMeta = this.defaultOnUpdatePageMeta;

    this.scrollToAnchorLink();
  }

  public addLoader(loader: BaseLoader, triggerOn: any) {
    const self = this;

    loader.init(self.isLoading, triggerOn, self.mainContainerId);
    MainLoader.loaders.push(loader);
    loader.setOnLoadStartedListener((isNewPage: boolean, isReloadingPreviousPage: boolean) => {
      self.onLoadStarted(isNewPage, isReloadingPreviousPage);
    });
    loader.setOnLoadFinishedListener(success => {
      self.onLoadFinish(success);
    });
    loader.setCancelRequest(self.cancelXhrRequest);
  }

  cancelXhrRequest(xhrRequest?: any) {
    if (!xhrRequest) xhrRequest = $.pjax.xhr;
    if (!xhrRequest) return;
    xhrRequest.onreadystatechange = $.noop;
    xhrRequest.abort();
  }

  isLoading(): boolean {
    return this._isLoading;
  }

  stopLoading() {
    if (!this._isLoading) return;
    this._isLoading = false;

    for (const loader of MainLoader.loaders) {
      loader.stopLoading();
    }
  }

  private onLoadStarted(isNewPage: boolean, isReloadingPreviousPage: boolean = false) {
    this._isLoading = true;
    this.onPageChangeStart(isNewPage, isReloadingPreviousPage);
  }

  private onLoadFinish(success: boolean) {
    this._isLoading = false;
    this.onPageChangeFinish(success);
    this.scrollToAnchorLink();

    for (let i = 0; i < MainLoader.loaders.length; i++) {
      let loader = MainLoader.loaders[i];
      loader.notifyPageChange();
    }

    this.onUpdatePageMeta();
  }

  public defaultOnUpdatePageMeta() {
    this.updateTitleMeta();
    this.updateKeywordsMeta();
    this.updateDescriptionMeta();
    this.updateContent("#loadedMenu", "header");
  }

  public updateTitleMeta(selectorTitle = "#loadedTitle") {
    if ($(selectorTitle).length > 0) {
      document.title = $(selectorTitle).html();
      $(selectorTitle).remove();
    }
  }

  public updateKeywordsMeta(selectorKeywords = "#loadedKeywords") {
    if ($(selectorKeywords).length > 0) {
      $("meta[name=Keywords]").remove();
      $("head").append('<meta name="Keywords" content="' + $(selectorKeywords).html() + '">');
      $(selectorKeywords).remove();
    }
  }

  public updateDescriptionMeta(selectorDescription = "#loadedDescription") {
    if ($(selectorDescription).length > 0) {
      $("meta[name=Description]").remove();
      $("head").append('<meta name="Description" content="' + $(selectorDescription).html() + '">');
      $(selectorDescription).remove();
    }
  }

  public updateContent(loadedSelector: string, contentSelector: string) {
    let isLoaded =
      $(loadedSelector)
        .eq(0)
        .text()
        .trim().length > 0;

    if (isLoaded) {
      let newContent = $(loadedSelector).html();
      $(loadedSelector).remove();

      let contentSelectors = $(contentSelector);
      let removeCount = contentSelectors.length - 1;
      for (let i = 0; i < removeCount; i++) {
        contentSelectors[i].remove();
      }

      $(contentSelector).replaceWith($(newContent));
    }
  }

  // It's a hack on Chrome browser to scroll to anchor links
  private scrollToAnchorLink() {
    if (window.location.hash) {
      let isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
      if (isChrome) {
        setTimeout(function() {
          let hash = window.location.hash;
          window.location.hash = "";
          window.location.hash = hash;
        }, 300);
      }
    }
  }
}
