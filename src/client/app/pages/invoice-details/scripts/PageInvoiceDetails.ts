declare const StripeCheckout: any;

class PageInvoiceDetails {
  private listener: AppListener;

  private stripePublishableApiKey: string;
  private invoiceId: string;
  private invoiceTitle: any;
  private invoiceDescription: any;
  private invoiceTotalAmount: any;
  private isCardPaymentPending: any;
  private stripeCheckoutHandler: any;

  constructor(listener: AppListener) {
    this.listener = listener;
  }

  public getPageId(): string {
    return "page-invoice";
  }

  /**
   * Main execution method to set up page behaviour
   */
  public execute() {
    $(".btn-copy")
      .off("click")
      .on("click", event => {
        const button = $(event.currentTarget);
        const email = button.attr("data-copy");
        CopyText.toClipboard(email);
      });

    this.loadStipeData();
    this.setupStripeCheckout();
    this.setupNewCardOption();

    if (this.isCardPaymentPending) {
      this.refreshPageInAMonent();
    }
  }

  public closePage() {}

  public onDialogClosed() {}

  private refreshPageInAMonent() {
    const refreshPageDelayMs = 3000;
    const self = this;
    setTimeout(() => {
      self.listener.reloadPage();
    }, refreshPageDelayMs);
  }

  private enableForm() {
    this.listener.hideLoading();
    $(".btn-payment").removeAttr("disabled");
  }

  private disableForm() {
    this.listener.showLoading();
    $(".btn-payment").attr("disabled", "true");
  }

  private loadStipeData() {
    this.stripePublishableApiKey = $("input[name='stripePublishableKey'").val();
    this.invoiceId = $("input[name='invoiceId'").val();
    this.invoiceTitle = $("input[name='invoiceTitle'").val();
    this.invoiceDescription = $("input[name='invoiceDescription'").val();
    this.invoiceTotalAmount = $("input[name='invoiceTotalAmount'").val();
    this.isCardPaymentPending = $("input[name='isCardPaymentPending'").val() === "true";
  }

  private pickNewCard() {
    this.stripeCheckoutHandler.open({
      name: this.invoiceTitle,
      description: this.invoiceDescription,
      zipCode: true,
      amount: parseInt(this.invoiceTotalAmount)
    });
  }

  private setupNewCardOption() {
    const self = this;

    $(".btn-pay-card")
      .off("click")
      .on("click", event => {
        let disabled = $(".btn-pay-card:first").attr("disabled");
        if (disabled) return;

        // Open Checkout with further options:
        self.pickNewCard();
        event.preventDefault();
      });
  }

  private onCardProcessedSuccessfully(url) {
    const self = this;
    if (url) {
      // Open required URL
      window.location.replace(url);
    } else {
      // Payment was processed
      this.enableForm();
      this.listener.hideFullPageLoading();
      $(".msg-error").remove();
      $(".payment-info").remove();
      $(".btn-payment").remove();
      $(".msg-payment-succeeded").removeClass("hide");

      const reloadTimeoutMs = 1500;
      setTimeout(() => {
        self.listener.reloadPage();
      }, reloadTimeoutMs);
    }
  }

  private onCardProcessedFailed(responseText) {
    this.enableForm();
    this.listener.hideFullPageLoading();
    $(".msg-error").removeClass("hide");

    try {
      responseText = JSON.parse(responseText);
    } catch (error) {
      /* Ignore */
    }

    if (responseText.msg) responseText = responseText.msg;
    $(".msg-error-custom:first").html(responseText);
    this.enableForm();
  }

  private setupStripeCheckout() {
    const self = this;

    self.stripeCheckoutHandler = StripeCheckout.configure({
      key: this.stripePublishableApiKey,
      image: window.location.protocol + "//" + window.location.host + "/src/client/app/main/assets/favicon-144.png",
      locale: "auto",
      token: function(token) {
        self.disableForm();
        self.listener.showFullPageLoading("Processing payment");

        $.ajax({
          url: "/api/v1/payment/charge",
          method: "POST",
          data: {
            stripeToken: token,
            invoiceId: self.invoiceId
          }
        })
          .done(function(properties) {
            self.onCardProcessedSuccessfully(properties.url);
          })
          .fail(function(jqXHR, textStatus) {
            self.onCardProcessedFailed(jqXHR.responseText);
          });
      }
    });

    // Close Checkout on page navigation:
    window.addEventListener("popstate", function() {
      self.stripeCheckoutHandler.close();
    });
  }
}
