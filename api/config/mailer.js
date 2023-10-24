const nodemailer = require("nodemailer");

const EMAIL = process.env.EMAIL;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
console.log(EMAIL);

const transporter = nodemailer.createTransport({
  // service: "Outlook365",
  host: "smtp.office365.com",
  port: 587,
  secure: false,

  auth: {
    // TODO: replace `user` and `pass` values from <https://forwardemail.net>
    user: EMAIL,
    pass: EMAIL_PASSWORD,
  },
  //secureConnection: false,

  tls: {
    //ciphers: "SSLv3",
    rejectUnauthorized: false,
  },

  // debug: true,
  // logger: true,
});

transporter.verify().then(() => {
  console.log("Listo el Servidor de Correos");
});

module.exports = { transporter };
