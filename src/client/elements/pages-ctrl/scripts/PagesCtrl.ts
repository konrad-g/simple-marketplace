interface Page {
  getPageId(): String;
  execute(): void;
  closePage(): void;
}
class PagesCtrl {
  private pages: Array<Page> = new Array();
  private currentPage;

  public constructor() {
    this.pages = new Array();
  }

  public addPage(page: Page) {
    this.pages.push(page);
  }

  public getCurrentPageId() {
    if (!this.currentPage) return "";
    return this.currentPage.getPageId();
  }

  public setupPage() {
    const self = this;

    self.closePage();

    let page = self.executeCurrentPageLogic();
    if (page) self.currentPage = page;
  }

  private closePage() {
    if (this.currentPage) {
      this.currentPage.closePage();
      this.currentPage = null;
    }
  }

  private executeCurrentPageLogic() {
    if ($("#pageId").length !== 0) {
      let pageId = $("#pageId").html();
      $("#pageId").remove();

      for (let i = 0; i < this.pages.length; i++) {
        let page: Page = this.pages[i];

        if (pageId === page.getPageId()) {
          page.execute();
          return page;
        }
      }
    }

    return null;
  }

  /**
   * Method that removed language prefix from url. E.g.: /en-AU/index -> /index
   * @param pathName
   * @returns {string}
   */
  public getPathName(pathName: string): string {
    let regexLangCode: RegExp = /\/[a-z]{2}\-[A-Z]{2}/;
    let regexResults: RegExpExecArray = regexLangCode.exec(pathName);

    if (regexResults !== null && regexResults.index === 0) {
      pathName = pathName.substr(6, pathName.length);
    }

    return pathName;
  }
}
