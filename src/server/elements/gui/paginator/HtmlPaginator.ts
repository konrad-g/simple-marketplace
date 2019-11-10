export class HtmlPaginator {
  private MAX_PAGES_NEARBY: number = 3;
  private MIN_PAGES: number = 1;
  private KEY_PAGE: string = "page";
  private KEY_PJAX: string = "_pjax";

  private PAGE_NMB_TO_REAL_OFFSET: number = -1; // &page=0 -> Shows Page 1
  private AVOID_MARGIN_POSITION: number = 1; // Extreme links don't get margin if for e.g. 100 is next to 99

  public totalPages: number;
  public currentPage: number;

  private pageUrl: string;
  private queryString: Array<string>;
  private keyPage: string;

  constructor(totalPages: number, currentPage: number, pageUrl: string, queryStringPassed: Array<string>, keyPage: string = null) {
    totalPages = Math.max(totalPages, 1);
    currentPage = Math.max(currentPage, 0);
    currentPage = Math.min(totalPages - 1, currentPage);

    if (!!keyPage) {
      this.keyPage = keyPage;
    } else {
      this.keyPage = this.KEY_PAGE;
    }

    this.totalPages = totalPages;
    if (!currentPage) currentPage = 0;
    this.currentPage = currentPage;
    this.pageUrl = pageUrl;

    this.queryString = [];
    for (let key in queryStringPassed) {
      let value = queryStringPassed[key];
      this.queryString[key] = value;
    }
  }

  public getHtmlElements(): Array<string> {
    let elements: Array<string> = [];

    let firstPage: number = 0;
    let totalPages: number = Math.max(this.totalPages, this.MIN_PAGES);

    // Show maximum few nearby pages links and fast forward / backward to maximum page
    let startPage: number = Math.max(this.currentPage - this.MAX_PAGES_NEARBY, firstPage);
    let lastPage: number = Math.min(this.currentPage + this.MAX_PAGES_NEARBY, totalPages + this.PAGE_NMB_TO_REAL_OFFSET);

    let showFastFirst: boolean = startPage !== firstPage;
    let showFastLast: boolean = lastPage !== totalPages + this.PAGE_NMB_TO_REAL_OFFSET;

    // Add first lisk
    if (showFastFirst) {
      // Check if we should add spacing
      let cssClass: string = "";
      let isNextToCorrectNumber: boolean = startPage === firstPage + this.AVOID_MARGIN_POSITION;
      if (!isNextToCorrectNumber) {
        cssClass = "app-paginator-fast-first";
      }

      let tag: string = this.getPageLink(firstPage, cssClass, this.pageUrl);
      elements.push(tag);
    }

    // Add other links
    for (let i = startPage; i <= lastPage; i++) {
      let tag: string = this.getPageLink(i, "", this.pageUrl);
      elements.push(tag);
    }

    // Add last link
    if (showFastLast) {
      // Check if we should add spacing
      let cssClass: string = "";
      let isNextToCorrectNumber: boolean = lastPage === totalPages - this.AVOID_MARGIN_POSITION + this.PAGE_NMB_TO_REAL_OFFSET;
      if (!isNextToCorrectNumber) {
        cssClass = "app-paginator-fast-last";
      }

      let tag: string = this.getPageLink(totalPages + this.PAGE_NMB_TO_REAL_OFFSET, cssClass, this.pageUrl);
      elements.push(tag);
    }

    return elements;
  }

  public getHtml(): string {
    let result: string = "";

    let elements: Array<string> = this.getHtmlElements();

    for (let element of elements) {
      result += element;
    }

    return result;
  }

  private getPageLink(pageNmb: number, cssClasses: string, pageUrl: string): string {
    let classes: string = "btn btn-default app-btn-paginator ajax " + cssClasses;

    if (pageNmb === this.currentPage) {
      classes += " btn-main selected";
    }

    // Get base url
    delete this.queryString[this.keyPage];
    this.queryString[this.keyPage] = [pageNmb.toString()];
    let url: string = this.createUrlWithGetParameters(pageUrl, this.queryString);

    let element: string = "<a " + 'href="' + url + '" ' + 'class="' + classes + '"' + ">" + (pageNmb - this.PAGE_NMB_TO_REAL_OFFSET) + "</a>";

    return element;
  }

  private createUrlWithGetParameters(baseUrl: string, queryString: Array<string>): string {
    let url = baseUrl;

    // Remove unnecessary keys
    delete queryString[this.KEY_PJAX];

    let isFirst: boolean = true;

    for (let key in queryString) {
      let value: string = queryString[key];

      if (isFirst) {
        isFirst = false;
        url += "?" + key + "=" + value;
      } else {
        url += "&" + key + "=" + value;
      }
    }

    return url;
  }
}
