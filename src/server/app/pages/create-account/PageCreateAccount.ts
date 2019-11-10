import { AppListener } from "../../main/AppListener";
import { StoreUser } from "../../store/StoreUser";

export class PageCreateAccount {
  listener: AppListener;
  hbs = require("hbs");

  public constructor(listener: AppListener) {
    this.listener = listener;
  }

  async createAccount(req, res, next) {
    const usersCount = await StoreUser.countAll();
    if (usersCount !== 0) {
      res.redirect("/login");
      return;
    }

    this.listener.api.createAccount(req, res, errors => {
      if (errors || req.err) {
        if (!errors) errors = {};
        if (req.err) errors.msg = req.err;

        req.flash("errors", errors);
        res.locals.email = req.body.email;
        res.locals.password = req.body.password;

        this.render(req, res);
      } else {
        req.flash("success", { msg: "Welcome!" });
        req.session["reloadMenu"] = true;
        res.redirect("/");
      }
    });
  }

  async getCreateAccount(req, res) {
    if (req.user) {
      return res.redirect("/");
    }

    const usersCount = await StoreUser.countAll();
    if (usersCount !== 0) {
      res.redirect("/login");
      return;
    }

    this.render(req, res);
  }

  render(req, res) {
    this.listener.renderPage(req, res, "create-account", "create-account", false);
  }

  getPath(): string {
    return __dirname;
  }
}
