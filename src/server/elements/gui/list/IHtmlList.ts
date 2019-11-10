export module IHtmlList {
  export interface Listener {
    getHtmlPaginator(totalPages: number, currentPage: number, pageUrl: string, queryStringPassed: Array<string>);
  }
}
