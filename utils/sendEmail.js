const nodemailer = require("nodemailer");
require("dotenv").config();

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS, 
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: options.email,
    subject: options.subject,
    text: options.message, 
   
 
  };

  try {
    // Send the email
    console.log(mailOptions);
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

module.exports = sendEmail;
