import { Api } from "../api/general/Api";
import { StoreUserSession } from "../store/StoreUserSession";
import { HtmlPaginator } from "../../elements/gui/paginator/HtmlPaginator";
import { HtmlStandard } from "../../elements/gui/standard/HtmlStandard";
import { PageBase } from "../pages/base/PageBase";
import { AppMode } from "../../elements/server/AppServer";
import { StoreView } from "../store/StoreView";
import { StoreInvoice } from "../store/StoreInvoice";
import { StorePayment, PaymentStatus } from "../store/StorePayment";

export class AppListener {
  private static YOU_NEED_TO_LOGIN: string = "You need to log in.";
  private static YOU_NEED_TO_LOGIN_SESSION_EXPIRED: string = "You need to log in. Session has expired.";
  private static NOT_AUTHORIZED_TO_VIEW_THIS_PAGE: string = "You're not authorized to view this page.";

  public app;
  public appMode;
  public api;
  public apiPhoto;
  private pageBase: PageBase;

  constructor(app, appMode: AppMode) {
    this.app = app;
    this.appMode = appMode;
    this.api = new Api(this);
    this.pageBase = new PageBase(this.appMode === AppMode.PROD, this.app);
  }

  public static onError(title: string, message: string) {
    console.error("Error! " + title + ", " + message);
  }

  renderPage(req, res, viewName: string, pageKey, disableIndexing: boolean, params?: any): Promise<any> {
    return this.pageBase.renderPage(req, res, viewName, pageKey, disableIndexing, params);
  }

  renderView(viewName: string, parameters: any): Promise<string> {
    return this.pageBase.renderView(viewName, parameters);
  }

  pjaxMiddleware(req, res, next) {
    const self = this;

    if (req.header("X-PJAX")) {
      req.pjax = true;
    }

    res.renderPjax = async function(view, options, fn) {
      options.layout = "layout";

      if (req.pjax) {
        options.layout = "layout-ajax";
        res.set("X-PJAX-URL", req.originalUrl);
      }

      let template = await StoreView.getTemplateCompiled(view);
      options.viewContent = template(options);

      res.set("Content-Language", "en");
      res.render("empty", options, fn);
    };

    next();
  }

  async isUserAuthenticated(req, callback: (err?) => void) {
    const self = this;

    if (!req.isAuthenticated()) {
      callback({ msg: AppListener.YOU_NEED_TO_LOGIN });
      return;
    }

    let session = await StoreUserSession.findUserSession(req.user._id, req.sessionID);

    if (!session || !session.isValid()) {
      self.api.logout(req);
      req.session["reloadMenu"] = true;
      callback({ msg: AppListener.YOU_NEED_TO_LOGIN_SESSION_EXPIRED });
      return;
    }

    callback();
    return;
  }

  isProd(): boolean {
    return this.appMode === AppMode.PROD;
  }

  /* HTML render */

  renderErrors(errors: any): string {
    let renderer = new HtmlStandard();
    return renderer.renderErrors(errors);
  }

  renderSelect(selectProps: any, options: any, selected: string, selectedDefault: string, multiple: boolean = false, addDefaultDisabledOption: boolean = false): string {
    let renderer = new HtmlStandard();
    return renderer.renderSelect(selectProps, options, selected, selectedDefault, multiple, addDefaultDisabledOption);
  }

  /*
   * Database
   */

  public getHtmlPaginator(totalPages: number, currentPage: number, pageUrl: string, queryStringPassed: Array<string>, keyPage: string = null) {
    let paginator = new HtmlPaginator(totalPages, currentPage, pageUrl, queryStringPassed, keyPage);
    return paginator.getHtml();
  }

  /*
   * Login Required middleware.
   */

  isAuthenticated(req, res, next) {
    return this.checkUserAuthorization(req, res, next, () => {
      return true;
    });
  }

  checkUserAuthorization(req, res, next, condition: () => Boolean) {
    const self = this;

    this.isUserAuthenticated(req, async err => {
      if (err) {
        await self.api.logout(req);
        req.flash("errors", err);
        return res.redirect("/login");
      }

      if (condition()) {
        return next();
      } else {
        req.flash("errors", {
          msg: AppListener.NOT_AUTHORIZED_TO_VIEW_THIS_PAGE
        });
        res.redirect("/");
      }
    });
  }

  async getSessionsIdFromRequest(req, callback: (err, sessions) => void) {
    // User not logged in
    if (req.user === null) {
      callback(null, [req.sessionID]);
      return;
    }

    // User logged in
    let sessions = await StoreUserSession.findSessions(req.user._id);
    callback(null, sessions);
  }

  /* Stripe */
  async cancelPayment(purchaseId): Promise<any> {
    return await StorePayment.cancelPaymentByInvoiceId(purchaseId);
  }

  async rejectPayment(purchaseId): Promise<any> {
    return await StorePayment.rejectPaymentByInvoiceId(purchaseId);
  }

  async doesPurchaseExist(purchaseId): Promise<boolean> {
    try {
      let listing = await StoreInvoice.findById(purchaseId);
      return listing != null;
    } catch (err) {
      console.error("Error on getting invoice.", err);
      return false;
    }
  }

  async findPaymentByPurchaseId(purchaseId): Promise<any> {
    return await StorePayment.findByInvoiceId(purchaseId);
  }

  async getPurchasePrice(purchaseId): Promise<number> {
    const invoice: any = await StoreInvoice.findById(purchaseId);
    return invoice.totalAmount;
  }

  async getPurchaseDescription(purchaseId): Promise<string> {
    const invoice: any = await StoreInvoice.findById(purchaseId);
    return invoice.description;
  }

  async markPaymentAsWaitingFor3dSecureVerification(
    cardStripeId: string,
    stripeCustomerId: string,
    card3dSecureStripeId: string,
    description: string,
    amount: number,
    purchaseId: string
  ): Promise<boolean> {
    const payment = await StorePayment.savePayment(null, purchaseId, cardStripeId, stripeCustomerId, card3dSecureStripeId, null, description, amount, PaymentStatus.WAITING_FOR_3D_SECURE_VERIFICATION);

    let invoice: any = await StoreInvoice.findById(purchaseId);
    invoice.paymentId = payment;
    await invoice.save();

    return true;
  }

  markPaymentAsCompleted(cardStripeId: string, stripeCustomerId: string, card3dSecureStripeId: string, chargeId: string, description: string, amount: number, purchaseId: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      let invoice: any = await StoreInvoice.findById(purchaseId);
      if (!invoice) return resolve(false);

      let payment = await StorePayment.findByInvoiceId(purchaseId);
      payment = await StorePayment.savePayment(payment, purchaseId, cardStripeId, stripeCustomerId, card3dSecureStripeId, chargeId, description, amount, PaymentStatus.COMPLETED);

      // Mark property as paid
      invoice.paid = true;
      invoice.paymentId = payment;
      await invoice.save();

      resolve(true);
    });
  }

  /* Mailer */
  sendMailAsSupport(subject: string, toEmails: string[], ccEmails: string[], bccEmails: string[], replyTo: string, contentHtml: string, attachments: any[], onFinish: (error, info) => void) {
    this.api.mailer.sendMailAsSupport(subject, toEmails, ccEmails, bccEmails, replyTo, contentHtml, attachments, onFinish);
  }
}
