require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

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
    expires: Date.now() + 5 * 60 * 1000
  };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Aura Wardrobe <onboarding@resend.dev>",
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
    });

    const data = await response.json();
    console.log("Resend response:", data);

    if (response.ok) {
      return res.json({ success: true });
    } else {
      return res.json({ success: false });
    }

  } catch (err) {
    console.error("Email API Error:", err);
    return res.json({ success: false });
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
    
