import nodemailer from "nodemailer";


const sendEmail = async (options) => {
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.hostinger.com",
      port: Number(process.env.SMTP_PORT || 587),
      secure: false, // upgrade later with STARTTLS
      requireTLS: true,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Define email options
    const mailOptions = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.messageId);
    return info;
  } catch (error) {
    console.error("Failed to send email:", error);
    if (error.response) {
      console.error("SMTP response:", error.response);
    }
    throw error;
  }
};

export { sendEmail };
