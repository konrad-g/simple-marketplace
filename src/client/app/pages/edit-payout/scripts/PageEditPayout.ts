class PageEditPayout {
  private listener: AppListener;

  constructor(listener: AppListener) {
    this.listener = listener;
  }

  public getPageId(): string {
    return "page-edit-payout";
  }

  /**
   * Main execution method to set up page behaviour
   */
  public execute() {
    (<any>$("#issuedDate")).datetimepicker({
      format: "DD MMM YYYY",
      allowInputToggle: true
    });
  }

  public closePage() {}

  public onDialogClosed() {}
}
