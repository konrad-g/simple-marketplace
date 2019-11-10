import { AppListener } from "../../main/AppListener";
import { StoreUser } from "../../store/StoreUser";

export class PageReset {
  private listener: AppListener;

  constructor(listener: AppListener) {
    this.listener = listener;
  }

  getReset(req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect("/");
    }

    StoreUser.getInstance()
      .findOne({ passwordResetToken: req.params.token })
      .where("passwordResetExpires")
      .gt(Date.now())
      .exec((err, user) => {
        if (err) {
          return next(err);
        }
        if (!user) {
          req.flash("errors", {
            msg: "Password reset token is invalid or has expired."
          });
          return res.redirect("/forgot");
        }
        this.listener.renderPage(req, res, "reset", "reset", true);
      });
  }

  postReset(req, res, next) {
    this.listener.api.resetPassword(req, res, errors => {
      if (errors) {
        req.flash("errors", errors);
        return res.redirect("back");
      } else {
        req.flash("success", {
          msg: "Success! Your password has been changed."
        });
        req.session["reloadMenu"] = true;
        res.redirect("/");
      }
    });
  }
}
