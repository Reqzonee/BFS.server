const express = require("express");
const router = express.Router();
const otpController = require("../controllers/OtpController");

// Route to send OTP for password reset
router.post("/send-otp", otpController.createOtp);

// Route to verify OTP
router.post("/verify-otp", otpController.verifyOtp);

// Route to reset password after OTP verification
router.post("/reset-password", otpController.resetPassword);

module.exports = router;
