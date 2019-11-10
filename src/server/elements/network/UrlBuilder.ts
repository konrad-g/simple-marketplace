export class UrlBuilder {
  private baseUrl: string;
  private parameters: Array<any>;

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl;
    this.parameters = [];
  }

  public addParameter(key, value) {
    this.parameters[key] = value;
  }

  public build(): string {
    let url = this.baseUrl;

    let isFirst = true;

    for (let param in this.parameters) {
      if (isFirst) {
        url = url + "?" + param + "=" + this.parameters[param];
        isFirst = false;
      } else {
        url = url + "&" + param + "=" + this.parameters[param];
      }
    }

    return url;
  }
}
