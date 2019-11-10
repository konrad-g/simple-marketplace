import { Currency } from "../../elements/currency/Currency";
import { Store } from "../../elements/store/Store";

const mongoose = require("mongoose");
const moment = require("moment-timezone");

export class StoreInvoice {
  private static DEFAULT_SORT = { issuedDate: -1 };

  private static instance;

  public static getInstance() {
    if (!StoreInvoice.instance) {
      StoreInvoice.instance = StoreInvoice.createInstance();
    }

    return StoreInvoice.instance;
  }

  private static createInstance(): any {
    const schema = new mongoose.Schema(
      {
        number: String,
        email: String,
        title: String,
        description: String,
        totalAmount: Number,
        paid: Boolean,
        paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
        issuedDate: Date
      },
      { timestamps: true, usePushEach: true }
    );

    schema.methods.getTotalAmount = function(): number {
      return this.totalAmount / 100;
    };

    schema.methods.getTotalAmountText = function(): string {
      return Currency.showPriceAsText(this.totalAmount / 100);
    };

    schema.pre("save", async function save(next) {
      if (!this.totalAmount) this.totalAmount = 0;
      if (!this.number) {
        const invoiceCount = await StoreInvoice.countAllFrom(this.issuedDate);
        this.number = (invoiceCount + 1).toString() + moment(this.issuedDate).format("DDMMYYYY");
      }
      next();
    });

    const instance = mongoose.model("Invoice", schema);
    return instance;
  }

  public static async save(invoice: any, email: string, title: string, description: string, totalAmount: number, paid: boolean, issuedDate: Date): Promise<any> {
    if (!invoice) {
      let Invoice = StoreInvoice.getInstance();
      invoice = new Invoice();
    }

    invoice.email = email;
    invoice.title = title;
    invoice.description = description;
    invoice.totalAmount = totalAmount * 100;
    invoice.paid = paid;
    invoice.issuedDate = issuedDate;

    await invoice.save();
    return invoice;
  }

  public static async getBalance(): Promise<number> {
    let paidInvoices = await StoreInvoice.getInstance()
      .find({
        paid: true
      })
      .exec();

    let totalCompanyEarnings: number = 0;

    for (let invoice of paidInvoices) {
      totalCompanyEarnings += invoice.totalAmount;
    }

    return totalCompanyEarnings / 100;
  }

  public static async getTotalPaidInAmount(): Promise<number> {
    let invoices = await StoreInvoice.getInstance()
      .find({
        totalAmount: { $gte: 0 },
        paid: true
      })
      .exec();

    let totalPaidAmount: number = 0;

    for (let invoice of invoices) {
      totalPaidAmount += invoice.totalAmount;
    }

    return totalPaidAmount / 100;
  }

  public static async getTotalPaidOutAmount(): Promise<number> {
    let invoices = await StoreInvoice.getInstance()
      .find({
        totalAmount: { $lte: 0 },
        paid: true
      })
      .exec();

    let totalPaidOutAmount: number = 0;

    for (let invoice of invoices) {
      totalPaidOutAmount += invoice.totalAmount;
    }

    return totalPaidOutAmount / 100;
  }

  public static async countAll(filter?: string): Promise<number> {
    return StoreInvoice.getFindQuery(filter).count();
  }

  public static async countAllFrom(issuedDate: Date): Promise<number> {
    return StoreInvoice.getInstance()
      .where({ issuedDate })
      .count();
  }

  public static async find(from: number, limit: number, filter?: string): Promise<any> {
    let query = StoreInvoice.getFindQuery(filter).sort(StoreInvoice.DEFAULT_SORT);
    if (from >= 0) query = query.skip(from);
    if (limit > 0) query = query.limit(limit);
    return query.exec();
  }

  public static getFindQuery(filter?: string): any {
    let query = StoreInvoice.getInstance();

    let conditions = [];
    conditions.push(StoreInvoice.getRegexQuery(filter));

    return query.find({ $and: conditions });
  }

  public static async findById(id: any): Promise<any> {
    try {
      let invoice = await StoreInvoice.getInstance()
        .findOne({ _id: Store.getEntryId(id) })
        .populate("paymentId")
        .exec();
      return invoice;
    } catch (error) {
      return null;
    }
  }

  private static getRegexQuery(filter) {
    try {
      if (!filter || filter.length === 0) return {};

      let regex = new RegExp(filter, "i");
      return {
        $or: [{ email: regex }, { title: regex }, { description: regex }]
      };
    } catch (error) {
      return {};
    }
  }
}
