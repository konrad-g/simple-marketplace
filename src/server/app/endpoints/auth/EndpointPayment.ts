import { AppListener } from "../../main/AppListener";
import { HttpStatus } from "../../../elements/network/HttpStatus";

export class EndpointPayment {
  private listener: AppListener;

  constructor(listener: AppListener) {
    this.listener = listener;
  }

  chargeUserWithNewCard(req, res) {
    this.listener.api.chargeUserWithNewCard(req, res, async (redirectUrl?: any, errors?: any) => {
      if (errors) {
        res.status(HttpStatus.BAD_REQUEST);
        res.send(errors);
      } else {
        if (redirectUrl) {
          res.status(HttpStatus.OK);
          res.send({ url: redirectUrl });
        } else {
          res.status(HttpStatus.OK);
          res.send({ msg: "Payment was processed" });
        }
      }
    });
  }

  processStripePaymentInfo(req, res) {
    this.listener.api.processStripePaymentInfo(req, async errors => {
      if (errors) {
        res.status(HttpStatus.BAD_REQUEST);
        res.send(errors);
      } else {
        res.status(HttpStatus.OK);
        res.send({ msg: "Information was processed" });
      }
    });
  }
}
