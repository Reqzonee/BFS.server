const express = require("express");
const router = express.Router();
const { sendOtp, verifyOtp } = require("../../controllers/v1/CustomerAuthController.js");

router.post("/customer/auth/send-otp", sendOtp);
router.post("/customer/auth/verify-otp", verifyOtp);

module.exports = router;
