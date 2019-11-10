export class ProbabilityEntry<T> {
  public value: T;
  public probability: number;

  constructor(value: T, probability: number) {
    this.value = value;
    this.probability = probability;
  }
}

export class Probability {
  public static getRandom(min: number, max: number, precision: number = -1) {
    let random = Math.random() * (max - min) + min;
    if (precision < 0) return random;
    return parseFloat(random.toFixed(precision));
  }

  public static getRandomInt(min: number, max: number) {
    let random = Probability.getRandom(min, max);
    return Math.round(random);
  }

  public static getRandomElement<T>(elements: Array<T>): T {
    if (!elements || elements.length == 0) return null;
    let maxIndex = elements.length - 1;
    let selectedIndex = maxIndex * Math.random();
    selectedIndex = Math.round(selectedIndex);
    return elements[selectedIndex];
  }

  public static getRandomElementOrNull<T>(elements: Array<T>): T {
    if (!elements || elements.length == 0) return null;
    elements.push(null);
    return Probability.getRandomElement(elements);
  }

  public static getRandomDateInPast(minTime: number = 0) {
    let now = new Date().getTime();
    let random = Math.max(now - minTime, 0) * Math.random() + minTime;
    return new Date(random);
  }

  public static getRandomDateInFuture(minTime: number = 0) {
    let now = new Date().getTime();
    let random = Math.max(now - minTime, 0) * Math.random() + minTime;
    return new Date(random + new Date().getTime());
  }

  public static getRandomDate(minTime: number = 0) {
    let now = new Date().getTime() * 2;
    let random = Math.max(now - minTime, 0) * Math.random() + minTime;
    return new Date(random);
  }

  public static getItemWithProbability<T>(probabilities: Array<ProbabilityEntry<T>>): T {
    let totalWeight = 0;
    for (let i = 0; i < probabilities.length; i++) {
      totalWeight += probabilities[i].probability;
    }

    let randomNumber = Probability.getRandom(0, totalWeight);
    let weightSum = 0;

    for (let i = 0; i < probabilities.length; i++) {
      weightSum += probabilities[i].probability;

      if (randomNumber <= weightSum) {
        return probabilities[i].value;
      }
    }
  }
}
