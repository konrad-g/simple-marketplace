import { StoreInvoice } from "../store/StoreInvoice";
import { Probability } from "../../elements/probability/Probability";
import { Currency } from "../../elements/currency/Currency";

export class EvolutionTestData {
  constructor() {}

  public async addTestInvoices() {
    const count = Probability.getRandom(150, 20000);
    const testEmails = [
      "adam@example.com",
      "luke@example.com",
      "noah@example.com",
      "james@example.com",
      "leon@example.com",
      "oliver@example.com",
      "oscar@example.com",
      "emma@example.com",
      "ava@example.com",
      "owen@example.com",
      "liam@example.com",
      "lily@example.com",
      "sophia@example.com",
      "darek@example.com",
      "ben@example.com",
      "lucy@example.com",
      "bart@example.com",
      "john@example.com",
      "amy@example.com",
      "camila@example.com",
      "andrew@example.com",
      "chloe@example.com",
      "will@example.com",
      "emily@example.com",
      "matt@example.com"
    ];

    for (let index = 0; index < count; index++) {
      let totalAmount = Probability.getRandom(100, 10000);
      const isInvoice = Probability.getRandomElement([true, false]);
      if (!isInvoice) totalAmount = -totalAmount;
      const totalAmountText = Currency.showPriceAsText(totalAmount);
      const title = isInvoice ? "Invoice " + index : "Payout " + index;
      const description = isInvoice ? "Invoice for " + totalAmountText : "Payout for " + totalAmountText;
      await StoreInvoice.save(null, Probability.getRandomElement(testEmails), title, description, totalAmount, Probability.getRandomElement([true, false]), Probability.getRandomDateInPast());
    }
  }
}
