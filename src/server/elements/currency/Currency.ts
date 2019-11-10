export class Currency {
  public static addCommaAtThousands(price: any): string {
    if (!price) return null;
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  public static showPriceAsText(price: number) {
    let priceText: string = "0";
    const isNegative = price < 0;

    if (!!price) {
      price = Math.abs(price);
      priceText = parseFloat(price.toString()).toFixed(2);
      priceText = Currency.addCommaAtThousands(priceText);
    }

    priceText = "$" + priceText;
    if (isNegative) {
      priceText = "- " + priceText;
    }

    return priceText;
  }
}
