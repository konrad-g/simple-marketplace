class PageCreateAccount {
  private listener: AppListener;

  constructor(listener: AppListener) {
    this.listener = listener;
  }

  public getPageId(): string {
    return "page-create-account";
  }

  /**
   * Main execution method to set up page behaviour
   */
  public execute() {
    var self = this;
    let passwordField: any = $("#password");
    passwordField.password();
  }

  public closePage() {}

  public onDialogClosed() {}
}
