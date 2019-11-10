import { AppListener } from "../../main/AppListener";

export class PageForgot {
  private listener: AppListener;

  constructor(listener: AppListener) {
    this.listener = listener;
  }

  getForgot(req, res) {
    if (req.isAuthenticated()) {
      return res.redirect("/");
    }
    this.renderForgot(req, res);
  }

  postForgot(req, res, next) {
    this.listener.api.remindPassword(req, res, next, errors => {
      res.locals.email = req.body.email;

      if (errors) {
        req.flash("errors", errors);
        this.renderForgot(req, res);
      } else {
        req.flash("success", {
          msg: `An e-mail has been sent to ${req.body.email} with further instructions.`
        });
        res.redirect("/login");
      }
    });
  }

  renderForgot(req, res) {
    this.listener.renderPage(req, res, "forgot", "forgot", false, {
      email: req.body.email
    });
  }
}
