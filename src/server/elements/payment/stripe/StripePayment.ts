import { IStripePayment } from "./IStripePayment";

export enum StripePaymentStatus {
  COMPLETED = "Completed",
  WAITING_FOR_3D_SECURE_VERIFICATION = "3DSecureWaiting",
  CANCELLED = "Cancelled",
  FAILED = "Failed"
}

export class StripePayment {
  private static DEBUG: boolean = false;
  private stripe;
  private listener: IStripePayment.Listener;

  constructor(stripeSecretKey: string, listener: IStripePayment.Listener) {
    this.stripe = require("stripe")(stripeSecretKey);
    this.listener = listener;
  }

  public chargeUserWithNewCard(stripeTokenId, amount, description, redirectBackUrl, userEmail, purchaseId, callback: (redirectUrl?: any, error?: any) => void) {
    const self = this;

    self.stripe.sources.create(
      {
        type: "card",
        usage: "reusable",
        token: stripeTokenId
      },
      async (err, source) => {
        if (err || !source) {
          return callback(null, "Error on processing card. " + err);
        }

        if (source.card.cvc_check === "fail") {
          return callback(null, "Card CVC code is incorrect.");
        }

        if (source.card.address_zip_check === "fail") {
          return callback(null, "Postal code doesn't match details on a card.");
        }

        if (!source.card) {
          return callback(null, "Couldn't receive card's details from the payment processor.");
        }

        if (!source.owner) {
          return callback(null, "Couldn't receive owner's details from the payment processor.");
        }

        if (!source.owner.address) source.owner.address = {};
        if (!source.owner.verified_address) source.owner.verified_address = {};

        self.stripe.customers.create(
          {
            email: userEmail,
            source: source.id
          },
          async function(err, customer) {
            if (err) return callback(null, "Error on adding card to customer. " + err);

            // asynchronously called
            self.handle3dSecure(source, customer.id, amount, description, purchaseId, redirectBackUrl, callback);
          }
        );
      }
    );
  }

  public removeCard(customerStripeId, cardId, callback: (error?: any, source?: any) => void) {
    this.stripe.customers.deleteSource(customerStripeId, cardId, function(err, source) {
      callback(err, source);
    });
  }

  public charge3DSecureCardAfterVerification(stripeCardId: string, paymentCustomerId: string, stripe3dSecureCardId: string, purchaseId: any): Promise<any> {
    const self = this;

    return new Promise((resolve, reject) => {
      if (!stripeCardId || !paymentCustomerId || !stripe3dSecureCardId) {
        self.listener.rejectPayment(purchaseId);
        return resolve({
          status: StripePaymentStatus.FAILED,
          msg: "Card basic details couldn't be found."
        });
      }

      this.stripe.sources.retrieve(stripe3dSecureCardId, function(err, source) {
        if (StripePayment.DEBUG) console.log("3D Secure card status: " + JSON.stringify(source));

        if (source.status === "chargeable") {
          self.chargeCard(stripeCardId, paymentCustomerId, stripe3dSecureCardId, purchaseId, (redirectUrl?: any, error?: any) => {
            if (error) {
              console.error("Couldn't charge 3D secure card: " + source.id + " for payment for product ID: " + purchaseId + ". " + error);
              return resolve({
                status: StripePaymentStatus.FAILED,
                msg: error
              });
            } else {
              return resolve({
                status: StripePaymentStatus.COMPLETED,
                msg: "Payment was successful."
              });
            }
          });
        } else if (source.status === "canceled") {
          self.listener.cancelPayment(purchaseId);
          return resolve({
            status: StripePaymentStatus.CANCELLED,
            msg: "Payment was cancelled."
          });
        } else if (source.status === "pending") {
          return resolve({
            status: StripePaymentStatus.WAITING_FOR_3D_SECURE_VERIFICATION,
            msg: "We're waiting for confirmation from card 3D Secure system."
          });
        } else if (source.status === "failed" || !source.three_d_secure.authenticated || source.three_d_secure.authenticated === "false") {
          self.listener.rejectPayment(purchaseId);
          return resolve({
            status: StripePaymentStatus.FAILED,
            msg: "Payment failed."
          });
        } else if (source.status === "consumed") {
          self.listener.rejectPayment(purchaseId);
          console.error("Source " + source.id + " was consumed before finishing transaction.");
          return resolve({
            status: StripePaymentStatus.FAILED,
            msg: "Please try again with the same payment method."
          });
        } else {
          return resolve({
            status: StripePaymentStatus.WAITING_FOR_3D_SECURE_VERIFICATION,
            msg: "We're waiting for confirmation from card 3D Secure system."
          });
        }
      });
    });
  }

  /**
   * Webhook
   */
  public async processStripePaymentInfo(eventJson, callback: (error?: any) => void) {
    const self = this;

    if (StripePayment.DEBUG) console.log("STRIPE WEB HOOK !");
    if (StripePayment.DEBUG) console.log("BODY: " + JSON.stringify(eventJson));

    if (
      !eventJson ||
      !eventJson.data ||
      !eventJson.data.object ||
      !eventJson.data.object.id ||
      !eventJson.type ||
      !eventJson.data.object.three_d_secure ||
      !eventJson.data.object.three_d_secure.card ||
      !eventJson.data.object.metadata ||
      !eventJson.data.object.metadata.cardId ||
      !eventJson.data.object.metadata.paymentCustomerId ||
      !eventJson.data.object.metadata.purchaseId
    ) {
      if (StripePayment.DEBUG) console.log("Stripe object ID wasn't specified.");
      return callback();
    }

    let cardId = eventJson.data.object.metadata.cardId;
    let paymentCustomerId = eventJson.data.object.metadata.paymentCustomerId;
    let purchaseId = eventJson.data.object.metadata.purchaseId;

    if (eventJson.type !== "source.chargeable") {
      if (StripePayment.DEBUG) console.log("Card " + eventJson.data.object.id + " is not chargable! It is: " + eventJson.type);
      self.listener.rejectPayment(purchaseId);
      return callback();
    }

    let doesPurchaseExist: any = await self.listener.doesPurchaseExist(purchaseId);
    if (!doesPurchaseExist) {
      if (StripePayment.DEBUG) console.log("Can't process Stripe payment information. Product can't be found: " + purchaseId);
      self.listener.rejectPayment(purchaseId);
      return callback();
    }

    let payment: any = await self.listener.findPaymentByPurchaseId(purchaseId);
    if (!payment) {
      if (StripePayment.DEBUG) console.log("Can't process Stripe payment information. Payment can't be found for product: " + purchaseId);
      self.listener.rejectPayment(purchaseId);
      return callback();
    }

    self.chargeCard(cardId, paymentCustomerId, payment.card3dSecureId, purchaseId, (redirectUrl?: any, error?: any) => {
      if (error) {
        return console.error("Couldn't charge card: " + cardId + " for payment for product ID: " + purchaseId + ". " + error);
      } else {
        if (StripePayment.DEBUG) console.log("Payment is finished! " + purchaseId);
      }
    });

    callback();
  }

  private async chargeCard(cardId, paymentCustomerId, card3dSecureId, purchaseId, callback: (redirectUrl?: any, error?: any) => void) {
    const self = this;

    const fetchedData = await Promise.all([self.listener.getPurchasePrice(purchaseId), self.listener.getPurchaseDescription(purchaseId)]);

    let amount: any = fetchedData[0];
    let description: any = fetchedData[1];

    self.stripe.charges
      .create({
        amount: amount,
        currency: "usd",
        description: description,
        customer: paymentCustomerId,
        source: card3dSecureId ? card3dSecureId : cardId,
        metadata: {
          cardId: cardId,
          paymentCustomerId: paymentCustomerId,
          purchaseId: purchaseId
        }
      })
      .then(async charge => {
        if (charge.status === "succeeded") {
          await self.listener.markPaymentAsCompleted(cardId, paymentCustomerId, card3dSecureId, charge.id, description, amount, purchaseId);

          callback();
        } else {
          await self.listener.cancelPayment(purchaseId);
          return callback(null, "Payment unsuccessful. " + charge.outcome.seller_message);
        }
      })
      .catch(async err => {
        await self.listener.cancelPayment(purchaseId);
        return callback(null, "Couldn't charge card. " + err.message);
      });
  }

  private handle3dSecure(sourceCard, paymentCustomerId, amount, description, purchaseId, redirectBackUrl, callback: (redirectUrl?: any, error?: any) => void) {
    const self = this;

    if (sourceCard.card.three_d_secure === "not_supported") {
      self.chargeCard(sourceCard.id, paymentCustomerId, null, purchaseId, callback);
    } else {
      self.stripe.sources.create(
        {
          amount: amount,
          currency: "usd",
          type: "three_d_secure",
          three_d_secure: {
            card: sourceCard.id
          },
          metadata: {
            cardId: sourceCard.id,
            paymentCustomerId: paymentCustomerId,
            purchaseId: purchaseId
          },
          redirect: {
            return_url: redirectBackUrl
          }
        },
        function(err, source3dSecure) {
          if (err) return callback(null, err);

          self.listener.markPaymentAsWaitingFor3dSecureVerification(sourceCard.id, paymentCustomerId, source3dSecure.id, description, amount, purchaseId);

          callback(source3dSecure.redirect.url);
        }
      );
    }
  }
}
