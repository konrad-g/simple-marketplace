class ErrorHandler {
  constructor() {}

  public getHandler(): any {
    return (errorMsg, url, lineNumber, column, error) => {
      // Show error in console
      console.error("Error! Line: " + lineNumber + ", column: " + column + ", msg:" + errorMsg);
      console.error(error.stack);
      return true;
    };
  }
}
