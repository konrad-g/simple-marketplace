import { AppListener } from "../../../main/AppListener";

export class PageChangePassword {
  listener: AppListener;

  public constructor(listener: AppListener) {
    this.listener = listener;
  }

  renderUpdatePassword(req, res, next) {
    this.listener.renderPage(req, res, "change-password", "change-password", false, {
      userEdited: req.user
    });
  }

  postUpdatePassword(req, res, next) {
    this.listener.api.changePassword(req, errors => {
      if (errors) {
        req.flash("errors", errors);
        return res.redirectBack("/account");
      } else {
        req.flash("success", { msg: "Password has been changed." });
        return res.redirectBack("/account");
      }
    });
  }
}
