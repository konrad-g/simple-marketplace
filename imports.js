exports.STYLES = [

  // Styles
  "./client-libs/node_modules/font-awesome/css/font-awesome.min.css",
  "./client-libs/node_modules/parsleyjs/src/parsley.css",
  "./client-libs/node_modules/bootstrap/dist/css/bootstrap.css",
  "./client-libs/node_modules/bootstrap/dist/css/bootstrap-theme.min.css",
  "./client-libs/node_modules/eonasdan-bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.min.css",
  "./client-libs/node_modules/@kgadzinowski/vanilla-toast/dist/vanilla-toast.min.css",

  // Elements
  "./src/client/elements/sizing/styles/main.css",
  "./src/client/elements/input/styles/form.css",
  "./src/client/elements/input/styles/input.css",
  "./src/client/elements/input/styles/checkbox.css",
  "./src/client/elements/loader/styles/loader.css",
  "./src/client/elements/paginator/styles/paginator.css",
  "./src/client/elements/card/styles/main.css",
  "./src/client/elements/card-button/styles/main.css",
  "./src/client/elements/dropdown-box/styles/main.css",

  // Pages
  "./src/client/app/pages/landing/styles/main.css",

  // General
  "./src/client/app/main/styles/layout.css",
  "./src/client/app/main/styles/header.css",
  "./src/client/app/main/styles/customization.css",
  "./src/client/app/main/styles/checkbox.css",
  "./src/client/app/main/styles/input.css",
  "./src/client/app/main/styles/nav.css",
  "./src/client/app/main/styles/nprogress.css",
  "./src/client/app/main/styles/paginator.css",
  "./src/client/app/ui/menu-top/styles/main.css",
];

exports.SCRIPTS_REMOTE = [
  "https://checkout.stripe.com/checkout.js",
];

exports.SCRIPTS_LIBRARIES = [

  // Logic libraries
  "./client-libs/node_modules/jquery/dist/jquery.min.js",
  "./client-libs/node_modules/jquery-pjax/jquery.pjax.js",
  "./client-libs/node_modules/@kgadzinowski/vanilla-toast/dist/vanilla-toast.min.js",

  // UI JavaScript libraries
  "./client-libs/node_modules/bootstrap/dist/js/bootstrap.min.js",
  "./client-libs/node_modules/bootstrap-show-password/dist/bootstrap-show-password.min.js",
  "./client-libs/node_modules/parsleyjs/dist/parsley.min.js",
  "./client-libs/node_modules/nprogress/nprogress.js",
  "./client-libs/node_modules/moment/min/moment.min.js",
  "./client-libs/node_modules/moment-timezone/builds/moment-timezone-with-data.min.js",
  "./client-libs/node_modules/eonasdan-bootstrap-datetimepicker/build/js/bootstrap-datetimepicker.min.js",
];

exports.SCRIPTS_PRODUCTION = [
];

exports.SCRIPTS_APP = [
  "./src/client/elements/error-handler/scripts/ErrorHandler.js",
  "./src/client/elements/ajax-form/scripts/AjaxForm.js",
  "./src/client/elements/dropdown-box/scripts/DropdownBox.js",
  "./src/client/elements/copy-text/scripts/CopyText.js",
  "./src/client/elements/loader/scripts/LoaderFullScreen.js",

  // Elements - AJAX loaders
  "./src/client/elements/ajax-loading/scripts/MainLoader.js",
  "./src/client/elements/ajax-loading/scripts/BaseLoader.js",
  "./src/client/elements/ajax-loading/scripts/LinksLoader.js",
  "./src/client/elements/ajax-loading/scripts/FormsLoader.js",

  // Pages
  "./src/client/elements/pages-ctrl/scripts/PagesCtrl.js",
  "./src/client/app/pages/create-account/scripts/PageCreateAccount.js",
  "./src/client/app/pages/invoice-details/scripts/PageInvoiceDetails.js",
  "./src/client/app/pages/edit-invoice/scripts/PageEditInvoice.js",
  "./src/client/app/pages/edit-payout/scripts/PageEditPayout.js",

  // Main boot
  "./src/client/app/main/scripts/App.js",
  "./src/client/app/main/scripts/AppListener.js",
  "./src/client/app/main/scripts/Boot.js",
];
