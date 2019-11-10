export class HtmlStandard {
  public constructor() {}

  getTextBreaksToHtml(text) {
    if (!text) return text;
    return text.split("\n").join("<br/>");
  }

  renderErrors(errors: any): string {
    let results = "";

    if (typeof errors === "string") {
      results = this.renderSingleError(errors);
    } else if (errors && errors.length > 0) {
      for (let error of errors) {
        results += this.renderSingleError(error);
      }
    }

    if (!results || results.length === 0) {
      results = this.renderSingleError(errors);
    }

    return results;
  }

  renderSingleError(error: string): string {
    return '<div class="">' + error + "</div>";
  }

  renderSelect(selectProps: any, options: any, selected: any, selectedDefault: any, multiple: boolean = false, addDefaultDisabledOption: boolean = false): string {
    let selectedArray = [];

    if (multiple && selected) selectedArray = this.getArrayFromInput(selected);
    if (multiple && selectedArray.length === 0 && selectedDefault) selectedArray = this.getArrayFromInput(selectedDefault);
    if (!multiple && !selected && !!selectedDefault) selected = selectedDefault;

    let result: string = "<select";

    for (let key in selectProps) {
      let value = selectProps[key];
      result += " " + key + '="' + value + '"';
    }

    if (multiple) {
      result += " multiple";
    }
    result += ">";

    let isFirst = true;

    if (addDefaultDisabledOption && (!selected || selected === "")) {
      result += this.renderSimpleOption("Please select...", "", isFirst, "", "", selectedArray);
      isFirst = false;
    }

    for (let key in options) {
      let value = options[key];

      if (value instanceof Array || typeof value === "object") {
        result += this.renderAdvancedOption(value, selected, selectedDefault, selectedArray);
      } else {
        result += this.renderSimpleOption(value, key, isFirst, selected, selectedDefault, selectedArray);
      }

      isFirst = false;
    }

    result += "</select>";

    return result;
  }

  renderAdvancedOption(value, selected, selectedDefault, selectedArray) {
    let key = value["key"];
    let result = '<option value="' + key + '"';

    // Add first disabled option if no key
    if (!!value["disabled"]) {
      result += " disabled";
    }

    if (!!value["selected"] || (selectedArray && selectedArray.indexOf(key) >= 0)) {
      result += ' selected="selected"';
    }

    result += ">" + value["content"] + "</option>";
    return result;
  }

  renderSimpleOption(value, key, isFirst, selected, selectedDefault, selectedArray) {
    let result = '<option value="' + key + '"';

    // Add first disabled option if no key
    if (isFirst && key === "") {
      result += " disabled";
      if (!selected && (!selectedDefault || selectedDefault === key)) {
        selected = key;
      }
    }

    if (key === selected || (selectedArray && selectedArray.indexOf(key) >= 0)) {
      result += ' selected="selected"';
    }

    result += ">" + value + "</option>";
    return result;
  }

  getPath(): string {
    return __dirname;
  }

  private getArrayFromInput(input) {
    let result = [];
    if (!input) return result;

    if (input.constructor === Array) {
      let inputResult = "";
      for (let entry of input) {
        if (inputResult.length > 0) inputResult += ",";
        inputResult += entry;
      }
      input = inputResult;
    }

    if (input.indexOf(",") > 0) {
      result = input.split(",");
    }

    return result;
  }
}
