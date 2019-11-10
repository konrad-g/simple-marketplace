import * as express from "express";
import { StoreView } from "../../store/StoreView";
import { AppListener } from "../../main/AppListener";
import { HtmlFlash } from "../../../elements/gui/flash/HtmlFlash";

const hbs = require("hbs");

export class PageBase {
  private static SHOW_ERROR_LOG: boolean = false;

  isProd: boolean;
  express;

  public constructor(isProd: boolean, express: any) {
    this.isProd = isProd;
    this.express = express;
  }

  addErrorsHandler() {
    const self = this;

    // Handle errors
    this.express.use(function(req, res, next) {
      let err: any = new Error("Not Found");
      err.status = 404;
      next(err);
    });

    this.express.use(function(err, req, res, next) {
      // set locals, only providing error in development
      if (!self.isProd || PageBase.SHOW_ERROR_LOG) {
        res.locals.error = err;
      } else {
        res.locals.error = {
          status: "Error " + err.status + " (" + err.message + ")"
        };
      }

      // render the error page
      res.locals.message = err.message;
      let title = err.status;

      res.status(err.status || 500);

      return self.renderPage(req, res, "error", "error", true, {
        title: title,
        description: title
      });
    });
  }

  getErrorsRouter(): express.Router {
    return this.express;
  }

  public async applyLocalValues(req, res) {
    res.locals.currentYear = new Date().getFullYear();
    res.locals.user = req.user;
    res.locals.isGuest = !!res.locals.user;
  }

  public async renderPage(req, res, viewName: string, pageKey, disableIndexing: boolean, params?: any): Promise<any> {
    const self = this;

    HtmlFlash.normalizeFlash(req, "errors");
    HtmlFlash.normalizeFlash(req, "warning");
    HtmlFlash.normalizeFlash(req, "info");
    HtmlFlash.normalizeFlash(req, "success");

    await this.applyLocalValues(req, res);

    let menuPromise: Promise<string>;
    let pagePromise = StoreView.findByKey(pageKey);

    if (req.session["reloadMenu"] || !req.header("X-PJAX")) {
      menuPromise = this.renderView("header", res.locals);
      req.session["reloadMenu"] = false;
    } else {
      menuPromise = new Promise((resolve, reject) => {
        resolve("");
      });
    }

    Promise.all([menuPromise, pagePromise]).then(
      data => {
        let [menuHtml, page] = data;

        if (!page) AppListener.onError("Couldn't find page with a key " + pageKey, "Couldn't find page with a key " + pageKey);

        let options = {
          title: page ? page.title : "--- | " + res.locals.companyName,
          description: page ? page.description : "",
          keywords: page ? page.keywords : "",
          disableIndexing: disableIndexing,
          menu: new hbs.SafeString(menuHtml),
          layout: "layout",
          companyName: res.locals.companyName
        };

        // Add custom parameters
        if (page && page.data) {
          for (let param of page.data) {
            options[param["key"]] = new hbs.SafeString(param["value"]);
          }
        }

        // Add local variables
        if (res.locals) {
          for (let key in res.locals) {
            options[key] = res.locals[key];
          }
        }

        // Load page specific keywords
        let contentJson = page ? page.getContentJson() : [];
        if (contentJson) {
          for (let key in contentJson) {
            options[key] = new hbs.SafeString(contentJson[key]);
          }
        }

        // Copy parameters
        if (params) {
          for (let key in params) {
            if (key === "title" || key === "description" || key === "keywords") {
              let value = params[key];
              if (key === "keywords") {
                value = StoreView.generateKeywords(value);
              }

              options[key] += value;
            } else {
              options[key] = params[key];
            }
          }
        }

        res.renderPjax(viewName, options);
      },
      error => {
        AppListener.onError("Couldn't render page", "Couldn't render page: " + viewName + ". " + error);
      }
    );
  }

  renderView(viewName: string, parameters: any): Promise<string> {
    const self = this;
    if (!parameters) parameters = {};
    parameters.layout = null;

    return new Promise(async (resolve, reject) => {
      // Try to get view from database
      let template = await StoreView.getTemplateCompiled(viewName);

      if (template) {
        let page = await StoreView.findByKey(viewName);

        // Load page specific keywords
        let contentJson = page.getContentJson();

        if (contentJson) {
          for (let key in contentJson) {
            parameters[key] = new hbs.SafeString(contentJson[key]);
          }
        }

        return resolve(template(parameters));
      }

      // Search for it in the app
      self.express.render(viewName, parameters, function(err: Error, html: string) {
        if (err) AppListener.onError("Couldn't render view", "Error while rendering view: " + viewName + ". " + err);
        resolve(html);
      });
    });
  }

  getPath(): string {
    return __dirname;
  }
}
