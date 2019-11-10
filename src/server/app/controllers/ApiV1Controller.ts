import { AppListener } from "../main/AppListener";
import { EndpointPayment } from "../endpoints/auth/EndpointPayment";

export class ApiV1Controller {
  private listener: AppListener;

  constructor(listener: AppListener) {
    this.listener = listener;
  }

  chargeUser(req, res) {
    const endpoint = new EndpointPayment(this.listener);
    endpoint.chargeUserWithNewCard(req, res);
  }

  processStripePaymentInfo(req, res) {
    const endpoint = new EndpointPayment(this.listener);
    endpoint.processStripePaymentInfo(req, res);
  }
}
