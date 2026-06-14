const nodemailer = require("nodemailer");

let transporter;

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_FROM
  } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_FROM) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth:
      SMTP_USER && SMTP_PASS
        ? {
            user: SMTP_USER,
            pass: SMTP_PASS
          }
        : undefined
  });

  return transporter;
};

const sendEmailNotification = async ({
  to,
  subject,
  text
}) => {
  const mailer = getTransporter();

  if (!mailer || !to) {
    return;
  }

  await mailer.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    text
  });
};

module.exports = {
  sendEmailNotification
};
