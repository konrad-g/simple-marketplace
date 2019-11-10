const request = require("request");

export class Network {
  private static CHECK_SERVER_IP_URL = "https://bot.whatismyipaddress.com";
  private static PARAM_PAGE_NUMBER = "page";
  private static PARAM_FILTER = "filter";

  public static async getUserIp(req): Promise<string> {
    let ip = req.headers["cf-connecting-ip"] || req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.ip;

    let lastCollonIndex = ip.lastIndexOf(":");
    if (lastCollonIndex >= 0) ip = ip.substr(lastCollonIndex + 1, ip.length);

    if (ip === "127.0.0.1" || ip === "localhost" || ip === 1 || (!!ip && ip.indexOf("192.168.1") >= 0)) {
      ip = await Network.getServerPublicIp();
    } else if (ip.length <= 6) {
      return null;
    }

    return ip;
  }

  public static async getServerPublicIp(): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
      request(
        {
          followAllRedirects: true,
          url: Network.CHECK_SERVER_IP_URL,
          headers: {
            accept: "*/*",
            "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.118 Safari/537.36"
          }
        },
        function(error, response, body) {
          if (error) {
            return reject(error.message);
          }

          body = body.trim();
          resolve(body);
        }
      );
    });
  }

  public static getParamFromRequest(req: any, param: string): any {
    if (req.body[param]) {
      return req.body[param];
    }

    if (req.query[param]) {
      return req.query[param];
    }

    if (req.params[param]) {
      return req.params[param];
    }

    return null;
  }

  public static getNumberParamFromRequest(req: any, param: string): number {
    let pageNumber = Network.getParamFromRequest(req, param);
    if (pageNumber && !isNaN(pageNumber)) {
      pageNumber = parseInt(pageNumber);
    }

    return pageNumber;
  }

  public static getFilterParamFromRequest(req) {
    let filterParam = Network.getParamFromRequest(req, Network.PARAM_FILTER);
    if (filterParam === null) filterParam = "";
    return filterParam;
  }

  public static getPageNumberParamFromRequest(req) {
    return Network.getNumberParamFromRequest(req, Network.PARAM_PAGE_NUMBER);
  }
}
