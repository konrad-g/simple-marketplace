class Network {
  public static getGetQuery(params: any): string {
    let result: string = "";

    for (let key in params) {
      let value = params[key];
      if (!value || value.length === 0) continue;

      if (result.length === 0) result += "?";
      else result += "&";

      result += key + "=" + value;
    }

    return result;
  }

  public static loadScript(url) {
    let script = document.createElement("script");
    script.src = url;
    document.head.appendChild(script);
  }

  public static loadStyle(url) {
    let link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = url;
    link.media = "all";
    document.head.appendChild(link);
  }
}
