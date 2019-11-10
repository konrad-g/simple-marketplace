import { IHtmlList } from "./IHtmlList";
const url = require("url");
const hbs = require("hbs");

export class HtmlList {
  public static ITEMS_PER_PAGE = 20;

  listener: IHtmlList.Listener;

  constructor(listener: IHtmlList.Listener) {
    this.listener = listener;
  }

  public renderList(
    req,
    res: any,
    pageNumber: number,
    count: number,
    filter: any,
    itemsPerPage: number = HtmlList.ITEMS_PER_PAGE,
    find: (filter: any, fromPosition: number, max: number, callback: (err, results) => void) => void,
    result: (req, res, filter: any, results, paginatorHtml) => void
  ) {
    if (isNaN(count)) count = 0;

    const self = this;

    let totalPages: number = Math.ceil(count / itemsPerPage);

    // Get users from -> to
    pageNumber = Math.min(pageNumber, totalPages - 1);
    pageNumber = Math.max(pageNumber, 0);

    let fromPosition: number = itemsPerPage * pageNumber;
    let maxCount: number = itemsPerPage;

    let max: number = count - fromPosition;
    max = Math.min(max, maxCount);
    max = Math.max(max, 1);

    let parsedUrl = url.parse(req.originalUrl, true);
    let basePageUrl: string = process.env.BASE_URL + parsedUrl.pathname;
    let queryString: any = parsedUrl.query;

    // Get users
    find(filter, fromPosition, max, (err, results) => {
      // Generate paginator
      let paginatorHtml = self.listener.getHtmlPaginator(totalPages, pageNumber, basePageUrl, queryString);

      result(req, res, filter, results, new hbs.SafeString(paginatorHtml));
    });
  }
}
