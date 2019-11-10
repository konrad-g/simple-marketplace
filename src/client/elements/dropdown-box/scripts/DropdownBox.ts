class DropdownBox {
  public static visibleDropdowns: Array<DropdownBox> = [];

  private static MARGIN_X: number = 10;
  private static MARGIN_Y: number = 0;

  private static ELEMENT_CLASS_MAIN: string = "app-dropdown-main";
  private static ELEMENT_CLASS_ANCHOR: string = "app-dropdown-anchor";
  private static ELEMENT_CLASS_CONTENT: string = "app-dropdown-content";
  private static ELEMENT_CLASS_BG: string = "app-dropdown-bg";

  host: any;
  dropdown: any;
  anchor: any;
  background: any;
  container: any;
  attachTo: any;
  isVisible: boolean = false;
  isBlocked: boolean = false;
  onCloseCallback: any = {};

  public static closeAllVisible() {
    DropdownBox.visibleDropdowns.forEach(function(item: DropdownBox) {
      item.close();
    });
  }

  public static closeAllVisibleOnClick(event: any) {
    DropdownBox.visibleDropdowns.forEach(function(item: DropdownBox) {
      item.closeOnTap(event);
    });
  }

  constructor() {}

  public init(selectorId) {
    const self: any = this;
    self.host = $(selectorId);

    if (!!self.host[0].isLoaded) return;

    // Initiate data
    self.isVisible = false;
    self.setOnCloseCallback(function() {});

    // Prepare all elements
    let loadedStructure: boolean = self.loadStructure();
    if (!loadedStructure) {
      self.createStructure();
    }

    window.addEventListener(
      "resize",
      function() {
        let isVisible = $(self).is(":visible");
        if (isVisible) {
          self.setPosition();
        }
      },
      true
    );

    $(self.background)
      .off("click")
      .on("click", event => {
        self.close();
      });

    self.host[0].isLoaded = true;
    self.exportMethods();
  }

  private exportMethods() {
    this.host[0].setOnCloseCallback = this.setOnCloseCallback.bind(this);
    this.host[0].display = this.display.bind(this);
    this.host[0].closeOnTap = this.closeOnTap.bind(this);
    this.host[0].close = this.close.bind(this);
    this.host[0].hide = this.hide.bind(this);
  }

  public setOnCloseCallback(onCloseCallback: any) {
    this.onCloseCallback = onCloseCallback;
  }

  public getHost() {
    return this.host;
  }

  public display(attachTo: any) {
    if (this.isBlocked) {
      return;
    }

    const self: any = this;

    if (this.isVisible) {
      this.close();
    } else {
      this.setAnchor(attachTo);
      this.setPosition();
      this.show();
    }
  }

  public closeOnTap(event: any) {
    // Close if event was outside of dialog box
    if (!this.isEventTarget(this.host, event)) {
      this.close();
    }
  }

  public close() {
    this.hide();
    this.onCloseCallback();
  }

  public hide() {
    if (this.isVisible && !this.isBlocked) {
      setTimeout(function() {
        self.isVisible = false;
      }, 100);
      const self: any = this;
      self.host.hide();
      self.removeFromVisible();
      this.blockInteractionsTemporary();
    }
  }

  private loadStructure(): boolean {
    this.dropdown = $("." + DropdownBox.ELEMENT_CLASS_MAIN, this.host);
    this.anchor = $("." + DropdownBox.ELEMENT_CLASS_ANCHOR, this.host);
    this.container = $("." + DropdownBox.ELEMENT_CLASS_CONTENT, this.host);
    this.background = $("." + DropdownBox.ELEMENT_CLASS_BG, this.host);

    let isLoaded: boolean = this.dropdown.length && this.anchor.length && this.container.length && this.background.length;
    return isLoaded;
  }

  private createStructure() {
    const self = this;
    this.dropdown = $('<div class="' + DropdownBox.ELEMENT_CLASS_MAIN + '"></div>');
    this.anchor = $('<div class="' + DropdownBox.ELEMENT_CLASS_ANCHOR + '"></div>');
    this.container = $('<div class="' + DropdownBox.ELEMENT_CLASS_CONTENT + '"></div>');
    this.background = $('<div class="' + DropdownBox.ELEMENT_CLASS_BG + '"></div>');

    // Move dropdown content to container
    let contentDropdown = $(this.host.html());
    this.host.empty();

    // Add all elements
    this.dropdown.appendTo(self.host);
    this.anchor.appendTo(self.dropdown);
    this.container.appendTo(self.dropdown);
    contentDropdown.appendTo(self.container);
    this.background.appendTo(self.host);
  }

  private setAnchor(attachTo) {
    this.attachTo = attachTo;
  }

  private setPosition() {
    const self: any = this;
    let wasVisible = $(this).is(":visible");

    if (!wasVisible) {
      self.host.show();
    }

    let contentWidth = self.container.outerWidth();
    let anchorWidth = $(self.anchor).innerWidth();

    if (!wasVisible) {
      self.host.hide();
    }

    let yMargin = DropdownBox.MARGIN_Y;
    let yPos: number = self.attachTo.offset().top - $(window).scrollTop() + self.attachTo.height() + yMargin;
    let xPosMiddle: number = self.attachTo.offset().left + self.attachTo.outerWidth() / 2 - contentWidth / 2;
    let xAnchor = contentWidth / 2 - anchorWidth / 2;

    // Check if container fits into screen
    let xPos = xPosMiddle;

    let xMargin = DropdownBox.MARGIN_X;
    let xMax =
      $(this.host)
        .parent()
        .width() -
      contentWidth -
      xMargin;

    let xMin = xMargin;

    xMax = Math.max(xMax, xMin);

    xPos = Math.max(xMin, xPos);
    xPos = Math.min(xMax, xPos);

    // Adjust anchor if we need to
    let xPosDiff = xPos - xPosMiddle;
    xAnchor -= xPosDiff;
    let xMaxAnchor = contentWidth - anchorWidth;
    let xMinAnchor = 0;

    xAnchor = Math.max(xMinAnchor, xAnchor);
    xAnchor = Math.min(xMaxAnchor, xAnchor);

    self.dropdown.css("top", yPos);
    self.dropdown.css("left", xPos);
    $(self.anchor).css("margin-left", xAnchor);
  }

  private show() {
    if (!this.isVisible && !this.isBlocked) {
      const self: any = this;
      self.host.show();
      self.isVisible = true;
      this.addToVisible();
      this.blockInteractionsTemporary();
    }
  }

  private addToVisible() {
    let index = DropdownBox.visibleDropdowns.indexOf(this, 0);
    if (index != undefined && index != null) {
      DropdownBox.visibleDropdowns.push(this);
    }
  }

  private removeFromVisible() {
    let index = DropdownBox.visibleDropdowns.indexOf(this, 0);
    if (index != undefined && index != null) {
      DropdownBox.visibleDropdowns.splice(index, 1);
    }
  }

  private blockInteractionsTemporary() {
    const self = this;
    this.isBlocked = true;
    setTimeout(function() {
      self.isBlocked = false;
    }, 100);
  }

  private isEventTarget(element, event) {
    let target = undefined;
    if (event.detail == undefined || event.detail.sourceEvent == undefined) {
      target = event.target;
    } else {
      target = event.detail.sourceEvent.target;
    }

    return element.get(0).is(target) || element.get(0).has(target).length != 0;
  }
}
