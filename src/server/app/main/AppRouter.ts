import { PublicController } from "../controllers/PublicController";
import { UserController } from "../controllers/UserController";
import { ApiV1Controller } from "../controllers/ApiV1Controller";
import { PassportConfig } from "../config/PassportConfig";
import { AppListener } from "./AppListener";
import { PageBase } from "../pages/base/PageBase";

const express = require("express");
const compression = require("compression");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const logger = require("morgan");
const lusca = require("lusca");
const MongoStore = require("connect-mongo")(session);
const flash = require("express-flash");
const path = require("path");
const passport = require("passport");
const expressValidator = require("express-validator");
const expressStatusMonitor = require("express-status-monitor");
const sass = require("node-sass-middleware");
const swag = require("swag");
const hbs = require("hbs");
const mongoose = require("mongoose");
import { AppMode } from "../../elements/server/AppServer";
import { StoreView } from "../store/StoreView";
import { Upload } from "../../elements/upload/Upload";

export class AppRouter {
  YEAR_MS = 31557600000;
  MAX_FILE_SIZE_KB = 5120;
  MAX_FILES = 5;

  expressApp;
  isProd: boolean;
  appMode: AppMode;
  listener: AppListener;
  expressViews: Array<string>;
  pageBase: PageBase;

  constructor(expressApp, appMode: AppMode) {
    this.expressApp = expressApp;
    this.appMode = appMode;
    this.expressViews = new Array();

    this.isProd = this.appMode === AppMode.PROD;
    this.pageBase = new PageBase(this.isProd, this.expressApp);

    // Views
    this.expressViews.push(path.join(__dirname, ".." + path.sep + "imports" + path.sep + "views"));

    this.expressViews.push(path.join(__dirname, ".." + path.sep + "pages" + path.sep + "base" + path.sep + "views"));
    this.expressViews.push(path.join(__dirname, ".." + path.sep + "pages" + path.sep + "base" + path.sep + "views-partial"));
    this.expressViews.push(path.join(__dirname, ".." + path.sep + "pages" + path.sep + "forgot" + path.sep + "views"));
    this.expressViews.push(path.join(__dirname, ".." + path.sep + "pages" + path.sep + "landing" + path.sep + "views"));
    this.expressViews.push(path.join(__dirname, ".." + path.sep + "pages" + path.sep + "login" + path.sep + "views"));
    this.expressViews.push(path.join(__dirname, ".." + path.sep + "pages" + path.sep + "create-account" + path.sep + "views"));
    this.expressViews.push(path.join(__dirname, ".." + path.sep + "pages" + path.sep + "reset" + path.sep + "views"));

    this.expressViews.push(path.join(__dirname, ".." + path.sep + "pages" + path.sep + "auth" + path.sep + "change-password" + path.sep + "views"));
    this.expressViews.push(path.join(__dirname, ".." + path.sep + "pages" + path.sep + "auth" + path.sep + "dashboard" + path.sep + "views"));
    this.expressViews.push(path.join(__dirname, ".." + path.sep + "pages" + path.sep + "auth" + path.sep + "invoice" + path.sep + "views"));
    this.expressViews.push(path.join(__dirname, ".." + path.sep + "pages" + path.sep + "auth" + path.sep + "payment" + path.sep + "views"));
    this.expressViews.push(path.join(__dirname, ".." + path.sep + "pages" + path.sep + "auth" + path.sep + "payout" + path.sep + "views"));
    this.expressViews.push(path.join(__dirname, ".." + path.sep + "pages" + path.sep + "auth" + path.sep + "settings" + path.sep + "views"));

    StoreView.getInstance(this.expressViews);
  }

  start() {
    const self = this;
    this.listener = new AppListener(self.expressApp, this.appMode);

    /**
     * Controllers (route handlers).
     */
    const publicController = new PublicController(this.listener);
    const userController = new UserController(this.listener);
    const apiV1Controller = new ApiV1Controller(this.listener);

    /**
     * API keys and Passport configuration.
     */
    const passportConfig = new PassportConfig();

    // Setup views
    swag.registerHelpers(hbs.handlebars);

    self.expressApp.set("views", this.expressViews);
    for (let viewPath of this.expressViews) {
      hbs.registerPartials(viewPath);
    }

    self.expressApp.set("view engine", "hbs");

    self.expressApp.disable("x-powered-by");
    self.expressApp.use(cookieParser());
    self.expressApp.use(expressStatusMonitor());
    self.expressApp.use(compression());
    self.expressApp.use(
      sass({
        src: path.join(__dirname, ".." + path.sep + "client"),
        dest: path.join(__dirname, ".." + path.sep + "client")
      })
    );
    self.expressApp.use(logger("dev"));
    self.expressApp.use(bodyParser.json());
    self.expressApp.use(bodyParser.urlencoded({ extended: true }));
    self.expressApp.use(expressValidator());

    let sessionOptions: any = {
      resave: true,
      saveUninitialized: true,
      secret: process.env.SESSION_SECRET
    };

    if (this.appMode !== AppMode.TEST) {
      sessionOptions.store = new MongoStore({
        mongooseConnection: mongoose.connection
      });
    }

    self.expressApp.use(async (req, res, next) => {
      res.redirectBack = redirectToAlternatively => {
        let redirectTo = req.header("Referer") || redirectToAlternatively;
        res.redirect(redirectTo);
      };
      next();
    });
    self.expressApp.use(session(sessionOptions));
    self.expressApp.use(passport.initialize());
    self.expressApp.use(passport.session());
    self.expressApp.use(flash());
    self.expressApp.use(lusca.xframe("SAMEORIGIN"));
    self.expressApp.use(lusca.xssProtection(true));
    self.expressApp.use(this.listener.pjaxMiddleware);
    self.expressApp.use(async (req, res, next) => {
      await self.pageBase.applyLocalValues(req, res);
      next();
    });
    self.expressApp.use((req, res, next) => {
      // After successful login, redirect back to the intended page
      if (!req.user && req.path !== "/login" && !req.path.match(/^\/auth/) && !req.path.match(/^\/api/) && !req.path.match(/\./)) {
        req.session.returnTo = req.path;
      }
      next();
    });

    let upload = new Upload().build("uploads", this.MAX_FILE_SIZE_KB * 1024, this.MAX_FILES);
    let logUploadError = (err, req, res, next) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          err = "Uploaded file is too big. It can be maximum " + self.MAX_FILE_SIZE_KB / 1024 + "Mb";
        }
        req.err = err;
      }

      next();
    };
    self.expressApp.use("/src/client", express.static(path.join(__dirname, ".." + path.sep + ".." + path.sep + ".." + path.sep + "client"), { maxAge: this.YEAR_MS }));
    self.expressApp.use(
      "/client-libs/node_modules",
      express.static(path.join(__dirname, ".." + path.sep + ".." + path.sep + ".." + path.sep + ".." + path.sep + "client-libs/node_modules"), { maxAge: this.YEAR_MS })
    );
    self.expressApp.use(
      "/dist",
      express.static(path.join(__dirname, ".." + path.sep + ".." + path.sep + ".." + path.sep + ".." + path.sep + "dist"), {
        maxAge: this.YEAR_MS
      })
    );

    // Primary app routes
    self.expressApp.get("/", lusca({ csrf: true }), publicController.getLandingPage.bind(publicController));

    self.expressApp.get("/login", lusca({ csrf: true }), publicController.getLogin.bind(publicController));
    self.expressApp.post("/login", upload.array(), logUploadError, lusca({ csrf: true }), publicController.postLogin.bind(publicController));
    self.expressApp.get("/create-account", lusca({ csrf: true }), publicController.getCreateAccount.bind(publicController));
    self.expressApp.post("/create-account", upload.array(), logUploadError, lusca({ csrf: true }), publicController.postCreateAccount.bind(publicController));
    self.expressApp.get("/logout", lusca({ csrf: true }), publicController.logout.bind(publicController));
    self.expressApp.get("/forgot", lusca({ csrf: true }), publicController.getForgot.bind(publicController));
    self.expressApp.post("/forgot", upload.array(), logUploadError, lusca({ csrf: true }), publicController.postForgot.bind(publicController));
    self.expressApp.get("/reset/:token", lusca({ csrf: true }), publicController.getReset.bind(publicController));
    self.expressApp.post("/reset/:token", upload.array(), logUploadError, lusca({ csrf: true }), publicController.postReset.bind(publicController));

    // Account
    self.expressApp.get("/dashboard", lusca({ csrf: true }), self.listener.isAuthenticated.bind(self.listener), userController.getDashboard.bind(userController));
    self.expressApp.get("/settings", lusca({ csrf: true }), self.listener.isAuthenticated.bind(self.listener), userController.getSettings.bind(userController));

    self.expressApp.post("/settings", upload.array(), logUploadError, lusca({ csrf: true }), self.listener.isAuthenticated.bind(self.listener), userController.updateSettings.bind(userController));

    self.expressApp.get("/settings/change-password", lusca({ csrf: true }), self.listener.isAuthenticated.bind(self.listener), userController.redirectToSettings.bind(userController));
    self.expressApp.post(
      "/settings/change-password",
      upload.array(),
      logUploadError,
      lusca({ csrf: true }),
      self.listener.isAuthenticated.bind(self.listener),
      userController.updatePassword.bind(userController)
    );

    // Invoices
    self.expressApp.get("/invoice/view/:id", lusca({ csrf: true }), userController.getInvoice.bind(userController));

    self.expressApp.get("/invoice/add", lusca({ csrf: true }), self.listener.isAuthenticated.bind(self.listener), userController.getAddInvoice.bind(userController));
    self.expressApp.post("/invoice/add", upload.array(), logUploadError, lusca({ csrf: true }), self.listener.isAuthenticated.bind(self.listener), userController.addInvoice.bind(userController));

    self.expressApp.get("/invoice/edit/:id", lusca({ csrf: true }), self.listener.isAuthenticated.bind(self.listener), userController.getEditInvoice.bind(userController));
    self.expressApp.post(
      "/invoice/edit/:id",
      upload.array(),
      logUploadError,
      lusca({ csrf: true }),
      self.listener.isAuthenticated.bind(self.listener),
      userController.editInvoice.bind(userController)
    );
    self.expressApp.post(
      "/invoice/delete",
      upload.array(),
      logUploadError,
      lusca({ csrf: true }),
      self.listener.isAuthenticated.bind(self.listener),
      userController.deleteInvoice.bind(userController)
    );

    // Payouts
    self.expressApp.get("/payout/view/:id", lusca({ csrf: true }), userController.getPayout.bind(userController));

    self.expressApp.get("/payout/add", lusca({ csrf: true }), self.listener.isAuthenticated.bind(self.listener), userController.getAddPayout.bind(userController));
    self.expressApp.post("/payout/add", upload.array(), logUploadError, lusca({ csrf: true }), self.listener.isAuthenticated.bind(self.listener), userController.addPayout.bind(userController));

    self.expressApp.get("/payout/edit/:id", lusca({ csrf: true }), self.listener.isAuthenticated.bind(self.listener), userController.getEditPayout.bind(userController));
    self.expressApp.post("/payout/edit/:id", upload.array(), logUploadError, lusca({ csrf: true }), self.listener.isAuthenticated.bind(self.listener), userController.editPayout.bind(userController));
    self.expressApp.post("/payout/delete", upload.array(), logUploadError, lusca({ csrf: true }), self.listener.isAuthenticated.bind(self.listener), userController.deletePayout.bind(userController));

    // API - Payments
    self.expressApp.post("/api/v1/payment/charge", upload.array(), logUploadError, apiV1Controller.chargeUser.bind(apiV1Controller));
    self.expressApp.post("/api/v1/payment/stripe", upload.array(), logUploadError, apiV1Controller.processStripePaymentInfo.bind(apiV1Controller));

    // Error handler
    self.pageBase.addErrorsHandler();
  }

  public getExpress() {
    return this.expressApp;
  }
}
