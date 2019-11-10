import { AppListener } from "../../../main/AppListener";
import { StoreInvoice } from "../../../store/StoreInvoice";
import { Network } from "../../../../elements/network/Network";
import { StoreSettings } from "../../../store/StoreSettings";
import { Currency } from "../../../../elements/currency/Currency";
import { PaymentStatus } from "../../../store/StorePayment";
import { HtmlStandard } from "../../../../elements/gui/standard/HtmlStandard";

const hbs = require("hbs");
const moment = require("moment-timezone");

export class PageInvoice {
  listener: AppListener;

  public constructor(listener: AppListener) {
    this.listener = listener;
  }

  async getInvoice(req, res) {
    let invoiceId = Network.getParamFromRequest(req, "id");
    let invoice = await StoreInvoice.findById(invoiceId);

    if (!invoice) {
      req.flash("errors", "Invoice wasn't found.");
      return res.redirect("/dashboard");
    }

    const settings = await StoreSettings.get();
    const htmlStandard = new HtmlStandard();
    const bankAccountAddress = htmlStandard.getTextBreaksToHtml(settings.bankAccountDetails.address);

    this.listener.renderPage(req, res, "invoice-details", "invoice-details", false, {
      invoiceId: invoice._id,
      invoiceNumber: invoice ? invoice.number : "",
      invoiceTitle: invoice.title,
      invoiceEmail: invoice.email,
      invoiceDescription: invoice.description,
      totalAmountText: Currency.showPriceAsText(invoice.getTotalAmount()),
      invoiceTotalAmount: invoice.totalAmount,
      isPaid: invoice.paid,
      issuedDateText: moment(invoice.issuedDate).format("DD MMM YYYY"),
      stripePublishableKey: settings.stripePublishableKey,
      bankAccount: settings.bankAccountDetails,
      bankAccountAddress: new hbs.SafeString(bankAccountAddress),
      isPayment: !!invoice.paymentId && invoice.paymentId.status !== PaymentStatus.COMPLETED,
      isPaymentPending:
        invoice.paymentId &&
        (invoice.paymentId.status === PaymentStatus.WAITING_FOR_PAYMENT ||
          invoice.paymentId.status === PaymentStatus.PENDING ||
          invoice.paymentId.status === PaymentStatus.WAITING_FOR_3D_SECURE_VERIFICATION),
      isPaymentRejected: invoice.paymentId && invoice.paymentId.status === PaymentStatus.REJECTED,
      isPaymentCompleted: invoice.paymentId && invoice.paymentId.status === PaymentStatus.COMPLETED,
      paymentStatus: invoice.paymentId ? invoice.paymentId.status : "Not paid"
    });
  }

  async renderEditInvoice(req, res, invoice = null) {
    let invoiceTitle = invoice ? invoice.title : "";
    let email = invoice ? invoice.email : "";
    let invoiceDescription = invoice ? invoice.description : "";
    let totalAmount = invoice ? invoice.getTotalAmount() : "";
    let isPaid = invoice ? invoice.paid : "";
    let issuedDate = invoice ? moment(invoice.issuedDate).format("DD MMM YYYY") : "";

    this.listener.renderPage(req, res, "invoice-edit", "invoice-edit", false, {
      isInvoice: !!invoice,
      invoiceId: invoice ? invoice._id : "",
      invoiceNumber: invoice ? invoice.number : "",
      invoiceTitle: req.body.invoiceTitle || invoiceTitle,
      invoiceEmail: req.body.email || email,
      invoiceDescription: req.body.invoiceDescription || invoiceDescription,
      totalAmount: req.body.totalAmount || totalAmount,
      isPaid: req.body.isPaid ? req.body.isPaid === "on" : isPaid,
      issuedDate: req.body.issuedDate || issuedDate
    });
  }

  async getAddInvoice(req, res) {
    this.renderEditInvoice(req, res);
  }

  async addInvoice(req, res) {
    this.saveInvoice(req, res);
  }

  async getEditInvoice(req, res) {
    let invoiceId = Network.getParamFromRequest(req, "id");
    let invoice = await StoreInvoice.findById(invoiceId);

    if (!invoice) {
      req.flash("errors", "Invoice wasn't found.");
      return res.redirect("/dashboard");
    }

    this.renderEditInvoice(req, res, invoice);
  }

  async editInvoice(req, res) {
    let invoiceId = Network.getParamFromRequest(req, "id");
    let invoice = await StoreInvoice.findById(invoiceId);

    if (!invoice) {
      req.flash("errors", "Invoice wasn't found.");
      return res.redirect("/dashboard");
    }

    this.saveInvoice(req, res, invoice);
  }

  async saveInvoice(req, res, invoice = null) {
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
      this.renderEditInvoice(req, res, invoice);
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
    invoice.totalAmount = Math.abs(req.body.totalAmount) * 100;
    invoice.paid = req.body.isPaid === "on";
    invoice.issuedDate = moment(req.body.issuedDate, "DD MMM YYYY");
    invoice = await invoice.save();

    if (sendEmail) {
      let content =
        "Hi,<br/><br/>" +
        "You have a new invoice.<br/><br/>" +
        "Title: " +
        invoice.title +
        "<br/>" +
        "Description: " +
        invoice.description +
        "<br/>" +
        "Total Amount: " +
        Currency.showPriceAsText(invoice.getTotalAmount()) +
        "<br/><br/>";
      if (invoice.paid) {
        content += "It's aready paid<br/>" + "You see details here:<br/>";
      } else {
        content += "You can pay it here<br/>";
      }
      content += `<a href='${process.env.BASE_URL}/invoice/view/${invoice._id}' target='_blank'>Open Invoice</a><br/><br/>` + "Best,<br/>" + "Marketplace";

      this.listener.sendMailAsSupport("New Invoice from Marketplace", [invoice.email], [], [], null, content, null, error => {
        console.error("Couldn't send email about created invoice " + invoice.title);
      });
    }

    req.flash("success", "Saved invoice");
    return res.redirect("/invoice/view/" + invoice._id);
  }

  async deleteInvoice(req, res) {
    let invoiceId = Network.getParamFromRequest(req, "id");
    let invoice = await StoreInvoice.findById(invoiceId);

    if (!invoice) {
      req.flash("errors", "Invoice wasn't found.");
      return res.redirect("/dashboard");
    }

    await invoice.remove();

    req.flash("success", "Removed invoice");
    return res.redirect("/dashboard");
  }
}
