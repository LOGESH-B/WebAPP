const nodemailer = require("nodemailer");

// async..await is not allowed in global scope, must use a wrapper
async function  sendEmail(user_mail,message,link) {
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    // true for 465, false for other ports
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    service:"Gmail",
    auth: {
      user: process.env.USER, // generated ethereal user
      pass: process.env.PASS, // generated ethereal password
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
   // sender address
  
    from: "logeshbommannan@gmail.com",
    to: user_mail, // list of receivers
    subject: "Reset Password", // Subject line
    text: message, // plain text body
    html: ` <p> ${link} </p>`, // html body
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}


module.exports = { sendEmail };