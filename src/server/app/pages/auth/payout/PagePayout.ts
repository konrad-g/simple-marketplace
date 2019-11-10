import { AppListener } from "../../../main/AppListener";
import { Network } from "../../../../elements/network/Network";
import { StoreInvoice } from "../../../store/StoreInvoice";
import { StoreSettings } from "../../../store/StoreSettings";
import { Currency } from "../../../../elements/currency/Currency";

const moment = require("moment-timezone");

export class PagePayout {
  listener: AppListener;

  public constructor(listener: AppListener) {
    this.listener = listener;
  }

  async getPayout(req, res) {
    let invoiceId = Network.getParamFromRequest(req, "id");
    let invoice = await StoreInvoice.findById(invoiceId);

    if (!invoice) {
      req.flash("errors", "Payout wasn't found.");
      return res.redirect("/dashboard");
    }

    const settings = await StoreSettings.get();

    this.listener.renderPage(req, res, "payout-details", "payout-details", false, {
      invoiceId: invoice._id,
      invoiceNumber: invoice ? invoice.number : "",
      invoiceTitle: invoice.title,
      invoiceEmail: invoice.email,
      invoiceDescription: invoice.description,
      totalAmountText: Currency.showPriceAsText(Math.abs(invoice.getTotalAmount())),
      isPaid: invoice.paid,
      issuedDateText: moment(invoice.issuedDate).format("DD MMM YYYY")
    });
  }

  async renderEditPayout(req, res, invoice = null) {
    let invoiceTitle = invoice ? invoice.title : "";
    let email = invoice ? invoice.email : "";
    let invoiceDescription = invoice ? invoice.description : "";
    let totalAmount = invoice ? invoice.getTotalAmount() : "";
    let isPaid = invoice ? invoice.paid : "";
    let issuedDate = invoice ? moment(invoice.issuedDate).format("DD MMM YYYY") : "";

    this.listener.renderPage(req, res, "payout-edit", "payout-edit", false, {
      isInvoice: !!invoice,
      invoiceId: invoice ? invoice._id : "",
      invoiceNumber: invoice ? invoice.number : "",
      invoiceTitle: req.body.invoiceTitle || invoiceTitle,
      invoiceEmail: req.body.email || email,
      invoiceDescription: req.body.invoiceDescription || invoiceDescription,
      totalAmount: req.body.totalAmount || invoice ? Math.abs(totalAmount) : "",
      isPaid: req.body.isPaid ? req.body.isPaid === "on" : isPaid,
      issuedDate: req.body.issuedDate || issuedDate
    });
  }

  async getAddPayout(req, res) {
    this.renderEditPayout(req, res);
  }

  async addPayout(req, res) {
    this.savePayout(req, res);
  }

  async getEditPayout(req, res) {
    let invoiceId = Network.getParamFromRequest(req, "id");
    let invoice = await StoreInvoice.findById(invoiceId);

    if (!invoice) {
      req.flash("errors", "Payout wasn't found.");
      return res.redirect("/dashboard");
    }

    this.renderEditPayout(req, res, invoice);
  }

  async editPayout(req, res) {
    let invoiceId = Network.getParamFromRequest(req, "id");
    let invoice = await StoreInvoice.findById(invoiceId);

    if (!invoice) {
      req.flash("errors", "Payout wasn't found.");
      return res.redirect("/dashboard");
    }

    this.savePayout(req, res, invoice);
  }

  async savePayout(req, res, invoice = null) {
    req.sanitize(["invoiceTitle", "email", "invoiceDescription", "totalAmount", "isPaid", "issuedDate"]);

    req.assert("invoiceTitle", "Title is required").notEmpty();
    req.assert("email", "Email is required").notEmpty();
    req.assert("invoiceDescription", "Description is required").notEmpty();
    req.assert("totalAmount", "Total amount is required").notEmpty();
    req.assert("issuedDate", "Issued date is required").notEmpty();

    let errors = await req.getValidationResult();
    if (errors) errors = errors.useFirstErrorOnly().array();
    if (errors && (errors.length > 0 || errors.msg)) {
      req.flash("errors", errors);
      this.renderEditPayout(req, res, invoice);
      return;
    }

    const sendEmail = !invoice;
    if (!invoice) {
      const Invoice = StoreInvoice.getInstance();
      invoice = new Invoice();
    }

    invoice.title = req.body.invoiceTitle;
    invoice.email = req.body.email;
    invoice.description = req.body.invoiceDescription;
    invoice.totalAmount = -Math.abs(req.body.totalAmount) * 100;
    invoice.paid = req.body.isPaid === "on";
    invoice.issuedDate = moment(req.body.issuedDate, "DD MMM YYYY");
    invoice = await invoice.save();

    if (sendEmail) {
      let content =
        "Hi,<br/><br/>" +
        "You have a new payout.<br/><br/>" +
        "Title: " +
        invoice.title +
        "<br/>" +
        "Description: " +
        invoice.description +
        "<br/>" +
        "Total Amount: " +
        Currency.showPriceAsText(Math.abs(invoice.getTotalAmount())) +
        "<br/><br/>";
      if (invoice.paid) {
        content += "It's aready paid out.<br/><br/>";
      } else {
        content += "We will send payment for it soon.<br/><br/>";
      }
      content += "You see details here:<br/>" + `<a href='${process.env.BASE_URL}/payout/view/${invoice._id}' target='_blank'>Open Payout</a><br/><br/>` + "Best,<br/>" + "Marketplace";

      this.listener.sendMailAsSupport("New Payout from Marketplace", [invoice.email], [], [], null, content, null, error => {
        console.error("Couldn't send email about created payout " + invoice.title);
      });
    }

    req.flash("success", "Saved payout");
    return res.redirect("/payout/view/" + invoice._id);
  }

  async deletePayout(req, res) {
    let invoiceId = Network.getParamFromRequest(req, "id");
    let invoice = await StoreInvoice.findById(invoiceId);

    if (!invoice) {
      req.flash("errors", "Payout wasn't found.");
      return res.redirect("/dashboard");
    }

    await invoice.remove();

    req.flash("success", "Removed payout");
    return res.redirect("/dashboard");
  }
}
