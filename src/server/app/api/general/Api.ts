import { StoreUser } from "../../store/StoreUser";
import { StoreUserSession } from "../../store/StoreUserSession";
import { Network } from "../../../elements/network/Network";
import { AppListener } from "../../main/AppListener";
import { StoreInvoice } from "../../store/StoreInvoice";
import { Mailer } from "../../../elements/mailer/Mailer";
import { StripePayment } from "../../../elements/payment/stripe/StripePayment";
import { StoreSettings } from "../../store/StoreSettings";

const passport = require("passport");
const bluebird = require("bluebird");
const crypto = bluebird.promisifyAll(require("crypto"));

export class ApiResult {
  public success: boolean;
  public message: string;

  constructor(success: boolean, message: string) {
    this.success = success;
    this.message = message;
  }
}

export class Api {
  public listener: AppListener;
  public mailer: Mailer;

  constructor(listener: AppListener) {
    this.listener = listener;
    this.mailer = Api.getMailer(this.listener.isProd());
  }

  public static getMailer(isProd: boolean) {
    let mailer = new Mailer(
      process.env.SEND_FROM_NAME,
      process.env.SEND_FROM_EMAIL,
      process.env.SEND_FROM_LOGIN,
      process.env.SEND_FROM_PASSWORD,
      process.env.SEND_FROM_HOST,
      process.env.SEND_FROM_PORT,
      isProd,
      false
    );

    return mailer;
  }

  /*
   * Authentication
   */

  public async createAccount(req, res, callback: (errors?) => void) {
    const self = this;

    req.sanitize(["email", "password", "terms"]);

    req.assert("email", "Email is not valid").isEmail();
    req.assert("password", "Password must be at least 4 characters long").len(4);

    let errors = await req.getValidationResult();
    if (errors) errors = errors.useFirstErrorOnly().array();

    if (req.err) {
      errors = { msg: req.err };
    }

    if (errors && (errors.length > 0 || errors.msg)) {
      callback(errors);
      return;
    }

    const email = req.body.email;
    const password = req.body.password;

    const existingUser = await StoreUser.findUserByEmail(email);
    if (existingUser) {
      callback("User with this email address already exists");
      return;
    }

    const user = await StoreUser.createUser(email, password);

    self.logInUser(req, user, callback);
  }

  public async logIn(req, res, next, callback: (errors?) => void) {
    req.sanitize(["email", "password"]);

    req.assert("email", "Email is not valid").isEmail();
    req.assert("password", "Password cannot be blank").notEmpty();

    const self = this;
    let errors = await req.getValidationResult();
    if (errors) errors = errors.useFirstErrorOnly().array();
    if (errors && (errors.length > 0 || errors.msg)) {
      callback(errors);
      return;
    }

    passport.authenticate("local", (err, user, info) => {
      if (err) {
        callback(err);
        return;
      }

      if (!user) {
        // Show error that user doesn't exists
        callback(info);
        return;
      }

      self.logInUser(req, user, callback);
    })(req, res, next);
  }

  logInUser(req, user, callback: (errors?) => void) {
    req.logIn(user, err => {
      if (err) {
        callback(err);
      } else {
        // Success
        StoreUserSession.createUserSession(user.id, req.sessionID, req.headers["user-agent"])
          .then(() => {
            callback();
          })
          .catch(err => {
            callback(err);
          });
      }
    });
  }

  async logout(req): Promise<any> {
    return new Promise(async (resolve, reject) => {
      if (req.user && req.user._id) {
        await StoreUserSession.removeUserSession(req.user._id, req.sessionID);
      }

      req.logout();
      resolve();
    });
  }

  async logoutSessionId(req, callback: (errors?) => void) {
    req.sanitize(["sessionId"]);

    req.assert("sessionId", "You need to specify sessionId").notEmpty();

    let errors = await req.getValidationResult();
    if (errors) errors = errors.useFirstErrorOnly().array();
    if (errors && (errors.length > 0 || errors.msg)) {
      callback(errors);
      return;
    }

    await StoreUserSession.removeSession(req.body.sessionId);
    callback();
  }

  public async remindPassword(req, res, next, callback: (errors?) => void) {
    req.sanitize(["email"]);

    req.assert("email", "Please enter a valid email address.").isEmail();

    const self = this;

    let errors = await req.getValidationResult();
    if (errors) errors = errors.useFirstErrorOnly().array();
    if (errors && (errors.length > 0 || errors.msg)) {
      callback(errors);
      return;
    }

    const createRandomToken = crypto.randomBytesAsync(16).then(buf => buf.toString("hex"));

    const setRandomToken = async token => {
      let user = await StoreUser.findUserByEmail(req.body.email);

      if (!user) {
        callback({ msg: "Account with that email address does not exist." });
        return;
      } else {
        user.passwordResetToken = token;
        user.passwordResetExpires = Date.now() + 3600000; // 1 hour
        user = user.save();
      }
      return user;
    };

    const sendForgotPasswordEmail = user => {
      if (!user) {
        return;
      }
      const token = user.passwordResetToken;

      self.mailer.sendMailAsSupport(
        "Reset Your Password to Marketplace",
        [user.email],
        [],
        [],
        null,
        `You are receiving this email because you (or someone else) have requested the reset of the password for your account.<br/><br/>
        Please click on the following link, or paste this into your browser to complete the process:<br/><br/>
        <a href="${process.env.BASE_URL}/reset/${token}" target="_blank">Reset Your Password</a><br/><br/>
        If you did not request this, please ignore this email and your password will remain unchanged.<br/><br/>
        Regards,<br/>
        Marketplace`,
        [],
        (error: any, info: any) => {
          if (error) {
            callback({ msg: error });
          } else {
            callback();
          }
        }
      );
    };

    createRandomToken
      .then(setRandomToken)
      .then(sendForgotPasswordEmail)
      .then(() => {})
      .catch(next);
  }

  async resetPassword(req, res, callback: (errors?) => void) {
    req.sanitize(["password", "confirm"]);

    req.assert("password", "Password must be at least 4 characters long.").len(4);
    req.assert("confirm", "Passwords must match.").equals(req.body.password);

    let User = StoreUser.getInstance();
    const self = this;

    let errors = await req.getValidationResult();
    if (errors) errors = errors.useFirstErrorOnly().array();
    if (errors && (errors.length > 0 || errors.msg)) {
      callback(errors);
      return;
    }

    let token = req.params.token || req.body.token;

    const resetPassword = () =>
      User.findOne({ passwordResetToken: token })
        .where("passwordResetExpires")
        .gt(Date.now())
        .then(user => {
          if (!user) {
            callback({
              msg: "Password reset token is invalid or has expired."
            });
            return;
          }
          user.password = req.body.password;
          user.passwordResetToken = undefined;
          user.passwordResetExpires = undefined;

          return user.save().then(
            () =>
              new Promise((resolve, reject) => {
                self.logInUser(req, user, err => {
                  if (err) {
                    return reject(err);
                  }
                  resolve(user);
                });
              })
          );
        });

    const sendResetPasswordEmail = user => {
      if (!user) {
        return;
      }

      self.mailer.sendMailAsSupport(
        "Your Marketplace Password Has Been Changed",
        [user.email],
        [],
        [],
        null,
        `Hello,<br/><br/>
        This is a confirmation that the password for your account ${user.email} has just been changed.<br/><br/>
        Regards,<br/>
        Marketplace`,
        [],
        (error: any, info: any) => {
          if (error) {
            let errorMsg = "Couldn't send email about changed password.";
            AppListener.onError("Couldn't send email", errorMsg);
          }
        }
      );

      callback();
    };

    resetPassword()
      .then(sendResetPasswordEmail)
      .then(() => {})
      .catch(err => {
        callback(err);
      });
  }

  async changePassword(req, callback: (errors?) => void) {
    req.sanitize(["password", "confirmPassword"]);

    req.assert("password", "Password must be at least 4 characters long").len(4);
    req.assert("confirmPassword", "Passwords do not match").equals(req.body.password);

    let errors = await req.getValidationResult();
    if (errors) errors = errors.useFirstErrorOnly().array();
    if (errors && (errors.length > 0 || errors.msg)) {
      callback(errors);
      return;
    }

    let user = await StoreUser.findUserById(req.user._id);
    if (!user) {
      callback("User wan't found.");
      return;
    }

    user.password = req.body.password;
    user.save(err => {
      if (err) {
        callback(errors);
        return;
      }
      callback();
    });
  }

  async chargeUserWithNewCard(req, res, callback: (redirectUrl?: any, error?: any) => void) {
    req.sanitize(["invoiceId", "stripeToken"]);

    req.assert("invoiceId", "You need to specify invoice ID").notEmpty();
    req.assert("stripeToken", "You need to specify Stripe token").notEmpty();

    let errors = await req.getValidationResult();
    if (errors) errors = errors.useFirstErrorOnly().array();
    if (errors && errors.length > 0) {
      return callback(null, errors);
    }

    let invoiceId: string = Network.getParamFromRequest(req, "invoiceId");
    let stripeToken: any = Network.getParamFromRequest(req, "stripeToken");

    if (!stripeToken || stripeToken.length == 0) {
      return callback(null, "We need to get payment token.");
    }

    let invoice = await StoreInvoice.findById(invoiceId);

    if (!invoice) {
      let message = "Invoice for specified key doesn't exist.";
      return callback(null, message);
    }

    if (invoice.paid) {
      return callback(null, "Invoice is already paid");
    }

    const redirectBackUrl = process.env.BASE_URL + "/invoice/view/" + invoice._id.toString();

    const settings = await StoreSettings.get();
    const stripePayment = new StripePayment(settings.stripeSecretKey, this.listener);
    stripePayment.chargeUserWithNewCard(stripeToken.id, invoice.totalAmount, invoice.description, redirectBackUrl, invoice.email, invoice._id.toString(), callback);
  }

  async processStripePaymentInfo(req, callback: (error?: any) => void) {
    const settings = await StoreSettings.get();
    const stripePayment = new StripePayment(settings.stripeSecretKey, this.listener);
    stripePayment.processStripePaymentInfo(req.body, callback);
  }
}
