require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

/* ---------------- EMAIL SETUP ---------------- */

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.APP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 10000
});

/* ---------------- OTP STORAGE ---------------- */
// In-memory (safe for small scale)
let otpStore = {};

/* ---------------- SEND OTP ---------------- */

app.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) return res.json({ success: false });

  const otp = Math.floor(100000 + Math.random() * 900000);

  otpStore[email] = {
    otp,
    expires: Date.now() + 5 * 60 * 1000 // 5 min
  };

 try {

  transporter.sendMail({
    from: `"Aura Wardrobe" <${process.env.EMAIL}>`,
    to: email,
    subject: "Your OTP for Order Verification",
    html: `
      <div style="font-family:Arial;padding:20px">
        <h2>Verify Your Order</h2>
        <p>Your OTP is:</p>
        <h1 style="letter-spacing:3px;">${otp}</h1>
        <p>This OTP is valid for 5 minutes.</p>
      </div>
    `
  })
  .then(() => {
    res.json({ success: true });
  })
  .catch((err) => {
    console.error("Mail failed:", err.message);
    res.json({ success: false });
  });

} catch (err) {
  console.error("OTP Mail Error:", err.message);
  res.json({ success: false });
}
});

/* ---------------- VERIFY OTP ---------------- */

app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  const record = otpStore[email];

  if (!record) return res.json({ success: false });

  if (Date.now() > record.expires) {
    delete otpStore[email];
    return res.json({ success: false, message: "expired" });
  }

  if (record.otp == otp) {
    delete otpStore[email];
    return res.json({ success: true });
  }

  res.json({ success: false });
});

/* ---------------- START SERVER ---------------- */

app.listen(5000, () => console.log("Server running"));
