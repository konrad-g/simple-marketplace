/// <reference path="AppListener.ts"/>

declare let L: any;
declare let NProgress: any;
declare let moment: any;

class App {
  private PJAX_TIMEOUT_MS = 6000;
  private MAIN_CONTAINER_NAME: any = "main";

  public linksLoader: LinksLoader;

  public pagesCtrl: PagesCtrl;
  public listener: AppListener;
  public errorHandler: ErrorHandler;

  public previousScrollTop = 0;

  public constructor() {
    this.previousScrollTop = 0;
    this.listener = new AppListener(this);
    this.pagesCtrl = new PagesCtrl();
    this.errorHandler = new ErrorHandler();
    this.initPages();
  }

  public start() {
    const self = this;

    self.setupMenuButtons();
    self.setupAccountDropdown();

    moment.updateLocale("en", {
      week: { dow: 1 } // Monday is the first day of the week
    });

    // Init loaders controller
    $.pjax.defaults.timeout = self.PJAX_TIMEOUT_MS;
    let wasNewPage = false;

    let onPageChangeStart = function(isNewPage, isReloadingPreviousPage) {
      self.listener.showLoading();
      DropdownBox.closeAllVisible();
      wasNewPage = isNewPage;

      if (!isReloadingPreviousPage) {
        let previousScrollTop = $(window).scrollTop();
        self.previousScrollTop = previousScrollTop;
      }
    };

    // Loader
    let onPageChangeFinish = function(success) {
      if (!success) {
        self.listener.hideLoading();
        return;
      }

      if (wasNewPage) {
        $(window).scrollTop(0);
      } else {
        $(window).scrollTop(self.previousScrollTop);
        self.previousScrollTop = 0;
      }

      self.pagesCtrl.setupPage();

      self.listener.hideLoading();
      self.listener.setupForms();

      self.setupAccountDropdown();
    };

    let mainLoader = MainLoader.getInstance();
    mainLoader.init(self.MAIN_CONTAINER_NAME, onPageChangeStart, onPageChangeFinish);

    // Add loaders component
    self.linksLoader = LinksLoader.getInstance();
    mainLoader.addLoader(self.linksLoader, "a.ajax");

    let formsLoader = FormsLoader.getInstance();
    formsLoader.setOnFormLoadStartedListener(function(form) {
      let ajaxForm = new AjaxForm();
      ajaxForm.disableForm(form);
    });
    mainLoader.addLoader(formsLoader, "form.ajax");

    self.listener.setupForms();
    self.pagesCtrl.setupPage();
  }

  private setupAccountDropdown() {
    setTimeout(() => {
      if ($("#dropdownAccount").length == 0) return;
      let dropdown = new DropdownBox();
      dropdown.init("#dropdownAccount");
    });
  }

  private setupMenuButtons() {
    const self = this;

    $("body")
      .off("click", "#btnAccount")
      .on("click", "#btnAccount", event => {
        let dropdown: any = $("#dropdownAccount")[0];
        if (dropdown && dropdown.display) {
          dropdown.display($("#btnAccount"));
        }
      });
  }

  public addErrorHandling() {
    window.onerror = this.errorHandler.getHandler();
  }

  private initPages() {
    this.pagesCtrl.addPage(new PageCreateAccount(this.listener));
    this.pagesCtrl.addPage(new PageInvoiceDetails(this.listener));
    this.pagesCtrl.addPage(new PageEditInvoice(this.listener));
    this.pagesCtrl.addPage(new PageEditPayout(this.listener));
  }
}
