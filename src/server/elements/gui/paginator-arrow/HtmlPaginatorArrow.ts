export class HtmlPaginatorArrow {
  private KEY_PAGE: string = "page";
  private KEY_PJAX: string = "_pjax";

  public totalPages: number;
  public currentPage: number;

  private pageUrl: string;
  private queryString: Array<string>;

  constructor(totalPages: number, currentPage: number, pageUrl: string, queryStringPassed: Array<string>) {
    totalPages = Math.max(totalPages, 1);
    currentPage = Math.max(currentPage, 0);
    currentPage = Math.min(totalPages - 1, currentPage);

    this.totalPages = totalPages;
    if (!currentPage) currentPage = 0;
    this.currentPage = currentPage;
    this.pageUrl = pageUrl;

    this.queryString = new Array();
    for (let key in queryStringPassed) {
      let value = queryStringPassed[key];
      this.queryString[key] = value;
    }
  }

  public getHtmlElements(): Array<string> {
    let elements: Array<string> = new Array();

    // Show maximum few nearby pages links and fast forward / backward to maximum page
    let showPreviousPage = this.currentPage > 0;
    let totalPages = this.totalPages - 1;
    let showNextPage = this.currentPage < totalPages;
    let previousPage = Math.max(this.currentPage - 1, 0);
    let nextPage = Math.min(this.currentPage + 1, totalPages);

    // Add first link
    let previousCssClass = "app-paginator-fast-first";
    if (!showPreviousPage) previousCssClass += " app-paginator-hide";
    let tag: string = this.getPageLink(previousPage, previousCssClass, this.pageUrl, '<i class="fa fa-arrow-left"></i>');
    elements.push(tag);

    // Add main button
    let mainLinkText = this.currentPage + 1 + " of " + this.totalPages;
    tag = this.getPageLink(this.currentPage, "", this.pageUrl, mainLinkText);
    elements.push(tag);

    // Add last link
    let nextCssClass = "app-paginator-fast-last";
    if (!showNextPage) nextCssClass += " app-paginator-hide";
    tag = this.getPageLink(nextPage, nextCssClass, this.pageUrl, '<i class="fa fa-arrow-right"></i>');
    elements.push(tag);

    return elements;
  }

  public getHtmlElementsWithButtons(customButtonClass: string = ""): Array<string> {
    let elements: Array<string> = new Array();

    // Show maximum few nearby pages links and fast forward / backward to maximum page
    let showPreviousPage = this.currentPage > 0;
    let totalPages = this.totalPages - 1;
    let showNextPage = this.currentPage < totalPages;
    let previousPage = Math.max(this.currentPage - 1, 0);
    let nextPage = Math.min(this.currentPage + 1, totalPages);

    // Add first link
    let previousCssClass = "app-paginator-fast-first";
    if (!showPreviousPage) previousCssClass += " app-paginator-hide";
    previousCssClass += " " + customButtonClass;

    let tag: string = this.getPageLinkButton(previousPage, previousCssClass, this.pageUrl, '<i class="fa fa-arrow-left"></i>');
    elements.push(tag);

    // Add main button
    let mainLinkText = this.currentPage + 1 + " of " + this.totalPages;
    tag = this.getPageLinkButton(this.currentPage, customButtonClass, this.pageUrl, mainLinkText);
    elements.push(tag);

    // Add last link
    let nextCssClass = "app-paginator-fast-last";
    if (!showNextPage) nextCssClass += " app-paginator-hide";
    nextCssClass += " " + customButtonClass;
    tag = this.getPageLinkButton(nextPage, nextCssClass, this.pageUrl, '<i class="fa fa-arrow-right"></i>');
    elements.push(tag);

    return elements;
  }

  public getNextPageUrl(): string {
    let totalPages = this.totalPages - 1;
    let nextPage = Math.min(this.currentPage + 1, totalPages);

    delete this.queryString[this.KEY_PAGE];
    this.queryString[this.KEY_PAGE] = nextPage.toString();
    let url: string = this.createUrlWithGetParameters(this.pageUrl, this.queryString);

    return url;
  }

  public getHtmlWithButtons(customButtonClass: string = ""): string {
    let result: string = "";

    let elements: Array<string> = this.getHtmlElementsWithButtons(customButtonClass);

    for (let element of elements) {
      result += element;
    }

    return result;
  }

  public getHtml(): string {
    let result: string = "";

    let elements: Array<string> = this.getHtmlElements();

    for (let element of elements) {
      result += element;
    }

    return result;
  }

  private getPageLink(pageNmb: number, cssClasses: string, pageUrl: string, text: string): string {
    let classes: string = "btn btn-default app-btn-paginator ajax " + cssClasses;

    if (pageNmb === this.currentPage) {
      classes += " btn-main selected";
    }

    // Get base url
    delete this.queryString[this.KEY_PAGE];
    this.queryString[this.KEY_PAGE] = [pageNmb.toString()];
    let url: string = this.createUrlWithGetParameters(pageUrl, this.queryString);

    let element: string = "<a " + 'href="' + url + '" ' + 'class="' + classes + '"' + ">" + text + "</a>";

    return element;
  }

  private getPageLinkButton(pageNmb: number, cssClasses: string, pageUrl: string, text: string): string {
    let classes: string = "btn btn-default app-btn-paginator ajax " + cssClasses;

    if (pageNmb === this.currentPage) {
      classes += " btn-main selected";
    }

    // Get base url
    delete this.queryString[this.KEY_PAGE];
    this.queryString[this.KEY_PAGE] = [pageNmb.toString()];
    let url: string = this.createUrlWithGetParameters(pageUrl, this.queryString);

    let element: string = "<button " + 'data-page="' + pageNmb + '" ' + 'data-link="' + url + '" ' + 'class="' + classes + '"' + ">" + text + "</button>";

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
