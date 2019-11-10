import { Store } from "../../elements/store/Store";

const mongoose = require("mongoose");

export class StoreSettings {
  private static instance;
  private static cache;

  public static getInstance() {
    if (!StoreSettings.instance) {
      StoreSettings.instance = StoreSettings.createInstance();
    }

    return StoreSettings.instance;
  }

  private static createInstance(): any {
    const BankAccountDetails = new mongoose.Schema({
      accountHolder: String,
      accountNumber: String,
      wireTransferNumber: String,
      routingNumber: String,
      swift: String,
      accountType: String,
      address: String
    });

    const schema = new mongoose.Schema(
      {
        stripePublishableKey: String,
        stripeSecretKey: String,
        bankAccountDetails: BankAccountDetails
      },
      { timestamps: true, usePushEach: true }
    );

    schema.pre("save", function save(next) {
      StoreSettings.clearCache();
      Store.clearCache();
      return next();
    });

    const instance = mongoose.model("Settings", schema);
    return instance;
  }

  public static clearCache() {
    StoreSettings.cache = null;
  }

  public static get(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      if (StoreSettings.cache) return resolve(StoreSettings.cache);

      StoreSettings.getInstance()
        .findOne()
        .exec(async (err, settings) => {
          if (err) return reject(err);

          if (!settings) {
            const Settings = StoreSettings.getInstance();
            settings = new Settings();
            settings = await settings.save();
          }
          if (!settings.bankAccountDetails) {
            settings.bankAccountDetails = {};
          }
          StoreSettings.cache = settings;
          resolve(settings);
        });
    });
  }
}
