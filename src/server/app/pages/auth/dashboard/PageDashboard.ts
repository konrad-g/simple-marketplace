import { AppListener } from "../../../main/AppListener";
import { HtmlList } from "../../../../elements/gui/list/HtmlList";
import { Network } from "../../../../elements/network/Network";
import { StoreInvoice } from "../../../store/StoreInvoice";
import { Currency } from "../../../../elements/currency/Currency";
import { StoreSettings } from "../../../store/StoreSettings";

const hbs = require("hbs");
const moment = require("moment-timezone");

export class PageDashboard {
  private ITEMS_PER_PAGE = 50;

  listener: AppListener;

  public constructor(listener: AppListener) {
    this.listener = listener;
  }

  async getDashboard(req, res) {
    // Force user to set settings
    const settings = await StoreSettings.get();
    if (!settings.stripePublishableKey || settings.stripePublishableKey.length === 0) {
      res.redirect("/settings");
      return;
    }

    const filter = Network.getParamFromRequest(req, "filter");
    const pageNumber: number = Network.getPageNumberParamFromRequest(req);
    const count = await StoreInvoice.countAll(filter);

    const htmlList = new HtmlList(this.listener);
    htmlList.renderList(
      req,
      res,
      pageNumber,
      count,
      filter,
      this.ITEMS_PER_PAGE,
      async (filter: string, fromPosition: number, max: number, callback: (err, users) => void) => {
        let invoices = await StoreInvoice.find(fromPosition, max, filter);
        callback(null, invoices);
      },
      async (req, res, filter: string, results, paginator) => {
        for (let invoice of results) {
          invoice.isInvoice = invoice.totalAmount >= 0;
          invoice.typeText = invoice.isInvoice ? "Invoice" : "Payout";
          invoice.totalAmountText = invoice.getTotalAmountText();
          invoice.issuedDateText = moment(invoice.issuedDate).format("DD MMM YYYY");
        }

        const balanceText = Currency.showPriceAsText(await StoreInvoice.getBalance());
        const paidInText = Currency.showPriceAsText(await StoreInvoice.getTotalPaidInAmount());
        const paidOutText = Currency.showPriceAsText(await StoreInvoice.getTotalPaidOutAmount());

        this.listener.renderPage(req, res, "dashboard", "dashboard", false, {
          balanceText: balanceText,
          paidInText: paidInText,
          paidOutText: paidOutText,
          filter,
          invoices: results,
          paginator: new hbs.SafeString(paginator),
          noInvoices: results.length === 0
        });
      }
    );
  }
}
