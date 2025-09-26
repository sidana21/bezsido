import nodemailer from "nodemailer";

const otpStore = {};

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const transporter = nodemailer.createTransporter({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

export async function sendOtpEmail(toEmail) {
  const otp = generateOTP();
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: "OTP Verification Code",
    text: `Your OTP code is: ${otp}`,
    html: `<p>Your OTP code is: <strong>${otp}</strong></p>`
  };
  await transporter.sendMail(mailOptions);
  otpStore[toEmail] = { otp, expires: Date.now() + 5 * 60 * 1000 };
  return otp;
}

export function verifyOtp(toEmail, code) {
  const record = otpStore[toEmail];
  if (!record) return false;
  if (Date.now() > record.expires) return false;
  if (record.otp === code) {
    delete otpStore[toEmail];
    return true;
  }
  return false;
}