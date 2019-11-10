import { StoreUser } from "../store/StoreUser";
import { StoreSettings } from "../store/StoreSettings";
import { StoreUserSession } from "../store/StoreUserSession";
import { StoreView, ViewType } from "../store/StoreView";
import { StoreInvoice } from "../store/StoreInvoice";
import { StorePayment } from "../store/StorePayment";
import { AppMode } from "../../elements/server/AppServer";
import { Store } from "../../elements/store/Store";
import { EvolutionTestData } from "./EvolutionTestData";

export class AppEvolutions {
  isMasterProcess: boolean;
  store: Store;
  appMode: AppMode;

  constructor(isMasterProcess: boolean, store, appMode: AppMode) {
    this.isMasterProcess = isMasterProcess;
    this.store = store;
    this.appMode = appMode;
  }

  public async initDatabaseContent() {
    const self = this;

    // Init schemas
    StoreInvoice.getInstance();
    StoreSettings.getInstance();
    StorePayment.getInstance();
    StoreUser.getInstance();
    StoreUserSession.getInstance();
    StoreView.getInstance();

    // Clear cache
    self.store.onClearCache(() => {
      StoreSettings.clearCache();
      StoreView.clearCache();
    });

    if (!self.isMasterProcess) return;

    await this.store.updateDbVersion(1, "Initial database version", async (currentVersion: number) => {
      // Add pages
      await StoreView.createWithNextOrder("error", ViewType.PAGE, "Error | ", "Error - ");
      await StoreView.createWithNextOrder("landing", ViewType.PAGE, "Two-sided Marketplace | Marketplace", "Two-sided marketplace that allows payments and payouts.");
      await StoreView.createWithNextOrder("forgot", ViewType.PAGE, "I Forgot Password | Marketplace", "Forgot your password? We can help you reset it.");
      await StoreView.createWithNextOrder("create-account", ViewType.PAGE, "Create Account | Marketplace", "Create account");
      await StoreView.createWithNextOrder("login", ViewType.PAGE, "Login | Marketplace", "Log in to marketplace");
      await StoreView.createWithNextOrder("reset", ViewType.PAGE, "Reset Password | Marketplace", "Reset your password");
      await StoreView.createWithNextOrder("change-password", ViewType.PAGE, "Change Password | Marketplace", "Change your password");
      await StoreView.createWithNextOrder("settings", ViewType.PAGE, "Settings | Marketplace", "Settings");
      await StoreView.createWithNextOrder("dashboard", ViewType.PAGE, "Dashboard | Marketplace", "Manage orders");
      await StoreView.createWithNextOrder("invoice-details", ViewType.PAGE, "Invoice Details | Marketplace", "Invoice Details");
      await StoreView.createWithNextOrder("invoice-edit", ViewType.PAGE, "Edit Invoice | Marketplace", "Edit Invoice");
      await StoreView.createWithNextOrder("payout-details", ViewType.PAGE, "Payout | Marketplace", "Payout Details");
      await StoreView.createWithNextOrder("payout-edit", ViewType.PAGE, "Edit Payout | Marketplace", "Edit Payout");

      await StoreView.createWithNextOrder("header", ViewType.VIEW);

      const ADD_TEST_DATA = false;
      if (ADD_TEST_DATA && self.appMode != AppMode.PROD) {
        let evolutionTestData = new EvolutionTestData();
        await evolutionTestData.addTestInvoices();
      }
    });
  }
}
