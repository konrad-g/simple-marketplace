import { AppListener } from "../../../main/AppListener";
import { StoreSettings } from "../../../store/StoreSettings";

const hbs = require("hbs");

export class PageSettings {
  listener: AppListener;

  public static ACCOUNT_TYPE_SELECT = {
    Checking: "Checking",
    Savings: "Savings"
  };

  public constructor(listener: AppListener) {
    this.listener = listener;
  }

  async getSettings(req, res) {
    const settings = await StoreSettings.get();

    const accountType = req.body.bankAccountType || settings.bankAccountDetails.accountType;
    const selectAccountType = this.listener.renderSelect(
      {
        id: "bankAccountType",
        name: "bankAccountType",
        class: "app-select"
      },
      PageSettings.ACCOUNT_TYPE_SELECT,
      accountType,
      ""
    );

    this.listener.renderPage(req, res, "settings", "settings", false, {
      selectAccountType: new hbs.SafeString(selectAccountType),
      stripePublishableKey: req.body.stripePublishableKey || settings.stripePublishableKey,
      stripeSecretKey: req.body.stripeSecretKey || settings.stripeSecretKey,
      bankAccountHolder: req.body.bankAccountHolder || settings.bankAccountDetails.accountHolder,
      bankAccountNumber: req.body.bankAccountNumber || settings.bankAccountDetails.accountNumber,
      bankWireTransferNumber: req.body.bankWireTransferNumber || settings.bankAccountDetails.wireTransferNumber,
      bankRoutingNumber: req.body.bankRoutingNumber || settings.bankAccountDetails.routingNumber,
      bankSwift: req.body.bankSwift || settings.bankAccountDetails.swift,
      bankAccountType: req.body.bankAccountType || settings.bankAccountDetails.accountType,
      bankAddress: req.body.bankAddress || settings.bankAccountDetails.address
    });
  }

  async updateSettings(req, res) {
    req.sanitize(["stripePublishableKey", "stripeSecretKey", "bankAccountHolder", "bankAccountNumber", "bankWireTransferNumber", "bankRoutingNumber", "bankSwift", "bankAccountType", "bankAddress"]);

    req.assert("stripePublishableKey", "Stripe publishable key is required").notEmpty();
    req.assert("stripeSecretKey", "Stripe secret key is required").notEmpty();
    req.assert("bankAccountHolder", "Account holder name is required").notEmpty();
    req.assert("bankAccountNumber", "Account number is required").notEmpty();
    req.assert("bankWireTransferNumber", "Wire transfer number is required").notEmpty();
    req.assert("bankRoutingNumber", "Routing number is required").notEmpty();
    req.assert("bankSwift", "Swift code is required").notEmpty();
    req.assert("bankAccountType", "Account type is required").notEmpty();
    req.assert("bankAddress", "Address is required").notEmpty();

    let errors = await req.getValidationResult();
    if (errors) errors = errors.useFirstErrorOnly().array();
    if (errors && (errors.length > 0 || errors.msg)) {
      req.flash("errors", errors);
      this.getSettings(req, res);
      return;
    }

    const settings = await StoreSettings.get();
    const firstTimeSettings = !settings.stripePublishableKey || settings.stripePublishableKey.length === 0;
    settings.stripePublishableKey = req.body.stripePublishableKey;
    settings.stripeSecretKey = req.body.stripeSecretKey;
    settings.bankAccountDetails.accountHolder = req.body.bankAccountHolder;
    settings.bankAccountDetails.accountNumber = req.body.bankAccountNumber;
    settings.bankAccountDetails.wireTransferNumber = req.body.bankWireTransferNumber;
    settings.bankAccountDetails.routingNumber = req.body.bankRoutingNumber;
    settings.bankAccountDetails.swift = req.body.bankSwift;
    settings.bankAccountDetails.accountType = req.body.bankAccountType;
    settings.bankAccountDetails.address = req.body.bankAddress;
    await settings.save();

    req.flash("success", "Updated settings");
    if (firstTimeSettings) {
      res.redirect("/dashboard");
    } else {
      this.getSettings(req, res);
    }
  }
}
