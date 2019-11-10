import { Currency } from "../../elements/currency/Currency";
import { StoreInvoice } from "./StoreInvoice";
const mongoose = require("mongoose");
const moment = require("moment-timezone");

export enum PaymentStatus {
  WAITING_FOR_PAYMENT = "Waiting for payment",
  COMPLETED = "Completed",
  PENDING = "Pending",
  WAITING_FOR_3D_SECURE_VERIFICATION = "Waiting for 3D secure card verification",
  REJECTED = "Rejected"
}

export class StorePayment {
  private static instance;

  public static getInstance() {
    if (!StorePayment.instance) {
      StorePayment.instance = StorePayment.createInstance();
    }

    return StorePayment.instance;
  }

  private static createInstance(): any {
    let schema = new mongoose.Schema(
      {
        invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },
        name: String,
        cardId: String,
        paymentCustomerId: String,
        card3dSecureId: String,
        chargeId: String,
        amount: Number,
        status: {
          type: String,
          enum: [PaymentStatus.COMPLETED, PaymentStatus.PENDING, PaymentStatus.WAITING_FOR_3D_SECURE_VERIFICATION, PaymentStatus.REJECTED, PaymentStatus.WAITING_FOR_PAYMENT],
          default: PaymentStatus.WAITING_FOR_PAYMENT
        }
      },
      { timestamps: true, usePushEach: true }
    );

    schema.methods.getPriceText = function() {
      if (!this.amount || this.amount == 0) return "0";
      return "$" + this.amount / 100;
    };

    schema.methods.getInvoice = async function() {
      let invoice = await StoreInvoice.findById(this.invoiceId);
      return invoice;
    };

    schema.methods.cancelPayment = async function() {
      this.status = PaymentStatus.WAITING_FOR_PAYMENT;
      await this.save();

      let invoice = await StoreInvoice.findById(this.invoiceId);
      invoice.paid = false;
      await invoice.save();
    };

    schema.methods.rejectPayment = async function() {
      this.status = PaymentStatus.REJECTED;
      await this.save();

      let invoice = await StoreInvoice.findById(this.invoiceId);
      invoice.paid = false;
      await invoice.save();
    };

    schema.methods.getUpdatedDateAgoText = function() {
      return moment(this.updatedAt).fromNow();
    };

    schema.methods.isPaymentWaitingFor3DVerification = function() {
      return this.status == PaymentStatus.WAITING_FOR_3D_SECURE_VERIFICATION;
    };

    const instance = mongoose.model("Payment", schema);
    return instance;
  }

  public static async createInitialPayment(invoiceId: any): Promise<any> {
    // Create new payment
    let Payment = StorePayment.getInstance();
    let payment = new Payment({
      invoiceId,
      status: PaymentStatus.WAITING_FOR_PAYMENT
    });

    await payment.save();
    return payment;
  }

  public static async savePayment(
    payment: any,
    invoiceId: any,
    cardId: string,
    paymentCustomerId: string,
    card3dSecureId: string,
    chargeId: string,
    name: string,
    amount: number,
    status: PaymentStatus
  ): Promise<any> {
    if (!payment) {
      // Create new payment
      let Payment = StorePayment.getInstance();
      payment = new Payment({
        invoiceId,
        name: name,
        cardId: cardId,
        paymentCustomerId: paymentCustomerId,
        card3dSecureId: card3dSecureId,
        chargeId: chargeId,
        amount: amount,
        status: status
      });
    } else {
      // Update payment
      payment.invoiceId = invoiceId;
      payment.name = name;
      payment.cardId = cardId;
      (payment.paymentCustomerId = paymentCustomerId), (payment.card3dSecureId = card3dSecureId), (payment.chargeId = chargeId), (payment.amount = amount);
      payment.status = status;
    }

    await payment.save();

    return payment;
  }

  public static async findUserPayments(invoiceId: string): Promise<any> {
    if (!invoiceId) return [];

    try {
      let result = await StorePayment.getInstance()
        .find({ invoiceId: invoiceId })
        .sort({ updatedAt: -1 })
        .exec();
      return result;
    } catch (error) {
      console.warn("Error on StorePayment.findUserPayments. " + error);
      return null;
    }
  }

  public static async findById(_id: string): Promise<any> {
    if (!_id) return null;

    try {
      let result = await StorePayment.getInstance()
        .findOne({ _id: _id })
        .sort({ createdAt: 1 })
        .exec();
      return result;
    } catch (error) {
      console.warn("Error on StorePayment.findById. " + error);
      return null;
    }
  }

  public static async findByCardIdAndStatus(cardId: string, status: PaymentStatus): Promise<Array<any>> {
    if (!cardId) return null;

    try {
      let result = await StorePayment.getInstance()
        .find({ cardId: cardId, status: status })
        .sort({ createdAt: -1 })
        .exec();
      return result;
    } catch (error) {
      console.warn("Error on StorePayment.findByCardIdAndStatus. " + error);
      return null;
    }
  }

  public static async getRevenueTotalStats(): Promise<any> {
    return new Promise((resolve, reject) => {
      let query = StorePayment.getInstance();
      query
        .aggregate([
          {
            $match: {
              status: PaymentStatus.COMPLETED
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$amount" },
              count: { $sum: 1 }
            }
          }
        ])
        .exec(StorePayment.formatRevenueStats(resolve, reject));
    });
  }

  public static formatRevenueStats(resolve: any, reject: any) {
    return async (err, result?) => {
      if (err) return reject(err);

      if (result.length == 0) {
        return resolve({
          total: "-",
          count: "-"
        });
      }

      result = result[0];
      result.total = result.total / 100;
      result.total = Currency.showPriceAsText(result.total);

      resolve(result);
    };
  }

  public static async findByInvoiceId(invoiceId: string): Promise<Array<any>> {
    if (!invoiceId) return null;
    let invoice = await StoreInvoice.findById(invoiceId);
    if (!invoice) return null;
    return invoice.paymentId;
  }

  public static cancelPaymentByInvoiceId(invoiceId: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      let payment: any = await StorePayment.findByInvoiceId(invoiceId);

      if (!payment) {
        return reject("Couldn't cancel payment, because it doesn't exist. Invoice ID: " + invoiceId);
      }

      await payment.cancelPayment();
      resolve();
    });
  }

  public static rejectPaymentByInvoiceId(invoiceId: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      let payment: any = await StorePayment.findByInvoiceId(invoiceId);

      if (!payment) {
        return reject("Couldn't cancel payment, because it doesn't exist. Purchase ID: " + invoiceId);
      }

      await payment.rejectPayment();
      resolve();
    });
  }
}
