import { AppListener } from "../main/AppListener";
import { PageChangePassword } from "../pages/auth/change-password/PageChangePassword";
import { PageInvoice } from "../pages/auth/invoice/PageInvoice";
import { PageDashboard } from "../pages/auth/dashboard/PageDashboard";
import { PageSettings } from "../pages/auth/settings/PageSettings";
import { PagePayout } from "../pages/auth/payout/PagePayout";

export class UserController {
  private listener: AppListener;

  constructor(listener: AppListener) {
    this.listener = listener;
  }

  // Dashboard

  getDashboard(req, res) {
    const page = new PageDashboard(this.listener);
    page.getDashboard(req, res);
  }

  getSettings(req, res) {
    const page = new PageSettings(this.listener);
    page.getSettings(req, res);
  }

  updateSettings(req, res) {
    const page = new PageSettings(this.listener);
    page.updateSettings(req, res);
  }

  getUpdatePassword(req, res, next) {
    const page = new PageChangePassword(this.listener);
    page.renderUpdatePassword(req, res, next);
  }

  updatePassword(req, res, next) {
    const page = new PageChangePassword(this.listener);
    page.postUpdatePassword(req, res, next);
  }

  // Invoices

  getInvoice(req, res) {
    const page = new PageInvoice(this.listener);
    page.getInvoice(req, res);
  }

  getAddInvoice(req, res) {
    const page = new PageInvoice(this.listener);
    page.getAddInvoice(req, res);
  }

  addInvoice(req, res) {
    const page = new PageInvoice(this.listener);
    page.addInvoice(req, res);
  }

  getEditInvoice(req, res) {
    const page = new PageInvoice(this.listener);
    page.getEditInvoice(req, res);
  }

  editInvoice(req, res) {
    const page = new PageInvoice(this.listener);
    page.editInvoice(req, res);
  }

  deleteInvoice(req, res) {
    const page = new PageInvoice(this.listener);
    page.deleteInvoice(req, res);
  }

  // Payouts

  getPayout(req, res) {
    const page = new PagePayout(this.listener);
    page.getPayout(req, res);
  }

  getAddPayout(req, res) {
    const page = new PagePayout(this.listener);
    page.getAddPayout(req, res);
  }

  addPayout(req, res) {
    const page = new PagePayout(this.listener);
    page.addPayout(req, res);
  }

  getEditPayout(req, res) {
    const page = new PagePayout(this.listener);
    page.getEditPayout(req, res);
  }

  editPayout(req, res) {
    const page = new PagePayout(this.listener);
    page.editPayout(req, res);
  }

  deletePayout(req, res) {
    const page = new PagePayout(this.listener);
    page.deletePayout(req, res);
  }

  // Redirects

  redirectToDashboard(req, res) {
    res.redirect("/dashboard");
  }

  redirectToSettings(req, res) {
    res.redirect("/settings");
  }
}
