import { AppListener } from "../main/AppListener";
import { PageLanding } from "../pages/landing/PageLanding";
import { PageLogin } from "../pages/login/PageLogin";
import { PageForgot } from "../pages/forgot/PageForgot";
import { PageReset } from "../pages/reset/PageReset";
import { PageCreateAccount } from "../pages/create-account/PageCreateAccount";

export class PublicController {
  private listener: AppListener;

  constructor(listener: AppListener) {
    this.listener = listener;
  }

  getLandingPage(req, res) {
    const page = new PageLanding(this.listener);
    page.render(req, res);
  }

  getLogin(req, res) {
    const page = new PageLogin(this.listener);
    page.getLogin(req, res);
  }

  postLogin(req, res, next) {
    const page = new PageLogin(this.listener);
    page.postLogin(req, res, next);
  }

  getCreateAccount(req, res) {
    const page = new PageCreateAccount(this.listener);
    page.getCreateAccount(req, res);
  }

  postCreateAccount(req, res, next) {
    const page = new PageCreateAccount(this.listener);
    page.createAccount(req, res, next);
  }

  logout(req, res) {
    const page = new PageLogin(this.listener);
    page.logout(req, res);
  }

  getReset(req, res, next) {
    const page = new PageReset(this.listener);
    page.getReset(req, res, next);
  }

  postReset(req, res, next) {
    const page = new PageReset(this.listener);
    page.postReset(req, res, next);
  }

  getForgot(req, res) {
    const page = new PageForgot(this.listener);
    page.getForgot(req, res);
  }

  postForgot(req, res, next) {
    const page = new PageForgot(this.listener);
    page.postForgot(req, res, next);
  }
}
