import { AppListener } from "../../main/AppListener";
import { StoreUser } from "../../store/StoreUser";

export class PageLanding {
  private listener: AppListener;

  constructor(listener: AppListener) {
    this.listener = listener;
  }

  public async render(req, res) {
    const usersCount = await StoreUser.countAll();
    if (usersCount === 0) {
      res.redirect("/create-account");
      return;
    }
    if (req.user) {
      res.redirect("/dashboard");
      return;
    }
    this.listener.renderPage(req, res, "landing", "landing", false);
  }
}
