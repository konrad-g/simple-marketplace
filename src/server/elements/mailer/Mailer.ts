export class Mailer {
  private static DEBUG = false;
  private static SEND_EMAILS_IF_NOT_PROD = false;

  nodemailer = require("nodemailer");

  name: string;
  email: string;
  login: string;
  password: string;
  host: string;
  port: string;
  isProd: boolean;
  checkIfEmailExists: boolean;
  onMailSentListener: (subject: string, toEmails: string[], ccEmails: string[], bccEmails: string[], fromEmail: string, replyTo: string, contentHtml: string) => Promise<any>;

  constructor(name: string, email: string, login: string, password: string, host: string, port: string, isProd: boolean, checkIfEmailExists: boolean = false) {
    this.name = name;
    this.email = email;
    this.login = login;
    this.password = password;
    this.host = host;
    this.port = port;
    this.isProd = isProd;
    this.checkIfEmailExists = checkIfEmailExists;
  }

  public setOnMailSentListener(
    onMailSentListener: (subject: string, toEmails: string[], ccEmails: string[], bccEmails: string[], fromEmail: string, replyTo: string, contentHtml: string) => Promise<any>
  ) {
    this.onMailSentListener = onMailSentListener;
  }

  public async sendMail(
    subject: string,
    toEmails: string[],
    ccEmails: string[],
    bccEmails: string[],
    fromEmail: string,
    replyTo: string,
    contentHtml: string,
    attachments: any[],
    onFinish: (error, info) => void
  ) {
    const self = this;

    if (toEmails.length === 0 && ccEmails.length === 0 && bccEmails.length === 0) {
      return onFinish("You need to specify recipient email addresses.", null);
    }

    let toEmailsText = self.formatToEmails(toEmails);
    let ccEmailsText = self.formatToEmails(ccEmails);
    let bccEmailsText = self.formatToEmails(bccEmails);

    // create reusable transporter object using the default SMTP transport
    let transporter = self.nodemailer.createTransport({
      pool: true,
      host: self.host,
      port: self.port,
      secure: true,
      auth: {
        user: self.login,
        pass: self.password
      },
      tls: {
        // do not fail on invalid certs
        rejectUnauthorized: false
      }
    });

    // Attach all files
    let attachmentsEmail = [];

    for (let attachmentName in attachments) {
      let attachmentValue = attachments[attachmentName];

      attachmentsEmail.push({
        // utf-8 string as an attachment
        filename: attachmentName,
        path: attachmentValue
      });
    }

    // Setup email data with unicode symbols
    let mailOptions: any = {
      from: fromEmail,
      to: toEmailsText,
      cc: ccEmailsText,
      bcc: bccEmailsText,
      subject: subject,
      html: contentHtml,
      attachments: attachmentsEmail
    };

    if (!!replyTo && replyTo.length > 0) {
      mailOptions.replyTo = replyTo;
    }

    if (Mailer.DEBUG) {
      console.log("Sent message to: " + toEmailsText + ". Subject: " + subject + ". Content: " + contentHtml);
      if (onFinish) onFinish(null, null);
      return;
    }

    if (!!self.onMailSentListener) await self.onMailSentListener(subject, toEmails, ccEmails, bccEmails, fromEmail, replyTo, contentHtml);

    // send mail with defined transport object
    if (this.isProd || Mailer.SEND_EMAILS_IF_NOT_PROD) {
      transporter.sendMail(mailOptions, (error, info) => {
        let errorMessage = null;
        if (error) {
          errorMessage = error.message;
          console.error("Can't send message. " + error);
        }

        if (onFinish) onFinish(errorMessage, info);
      });
    } else {
      console.log("-- Didn't really send email since we are not in production --");
      console.log("From: " + fromEmail);
      console.log("To: " + toEmailsText);
      console.log("Cc: " + ccEmailsText);
      console.log("Bcc: " + bccEmailsText);
      console.log("Reply To: " + replyTo);
      console.log("Subject: " + subject);
      console.log("Content: " + contentHtml);

      if (onFinish) onFinish(null, null);
    }
  }

  public sendMailAsSupport(subject: string, toEmails: string[], ccEmails: string[], bccEmails: string[], replyTo: string, contentHtml: string, attachments: any[], onFinish: (error, info) => void) {
    let fromEmail = '"' + this.name + '" <' + this.email + ">";
    this.sendMail(subject, toEmails, ccEmails, bccEmails, fromEmail, replyTo, contentHtml, attachments, onFinish);
  }

  public sendMailAsSupportAsPromise(subject: string, toEmails: string[], ccEmails: string[], bccEmails: string[], replyTo: string, contentHtml: string, attachments: any[]): Promise<any> {
    const self = this;

    return new Promise(async (resolve, reject) => {
      self.sendMailAsSupport(subject, toEmails, ccEmails, bccEmails, replyTo, contentHtml, attachments, (error, info) => {
        if (!!error) return reject(error);
        resolve(info);
      });
    });
  }

  formatToEmails(toEmails: string[]): string {
    let toEmailsText = "";
    for (let i = 0; i < toEmails.length; i++) {
      let email = toEmails[i];
      if (i === 0) {
        toEmailsText = email;
      } else {
        toEmailsText += ", " + email;
      }
    }

    return toEmailsText;
  }
}
