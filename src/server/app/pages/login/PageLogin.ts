import { AppListener } from "../../main/AppListener";
import { StoreUser } from "../../store/StoreUser";

export class PageLogin {
  private listener: AppListener;

  constructor(listener: AppListener) {
    this.listener = listener;
  }

  async getLogin(req, res) {
    if (req.user) {
      return res.redirect("/");
    }

    const usersCount = await StoreUser.countAll();
    if (usersCount === 0) {
      res.redirect("/create-account");
      return;
    }

    this.renderLogin(req, res);
  }

  postLogin(req, res, next) {
    this.listener.api.logIn(req, res, next, errors => {
      if (errors) {
        req.flash("errors", errors);
        res.locals.email = req.body.email;
        this.renderLogin(req, res);
      } else {
        req.flash("success", { msg: "Success! You are logged in." });
        req.session["reloadMenu"] = true;
        res.redirect(req.session.returnTo || "/");
      }
    });
  }

  renderLogin(req, res) {
    this.listener.renderPage(req, res, "login", "login", false, {
      email: req.body.email,
      password: req.body.password
    });
  }

  async logout(req, res) {
    await this.listener.api.logout(req);
    req.session["reloadMenu"] = true;
    res.redirect("/");
  }
}
