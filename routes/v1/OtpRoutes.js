const express = require("express");
const { createOtp,
  verifyOtp,
  resetPassword,
} = require("../../controllers/v1/OtpController.js");

const router = express.Router();

/**
 * @swagger
 * /otp/send:
 *   post:
 *     summary: Send OTP to email for password reset
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: User not found
 *       429:
 *         description: Rate limit - wait before requesting new OTP
 *       500:
 *         description: Server error
 */
router.post("/otp/send", createOtp);

/**
 * @swagger
 * /otp/verify:
 *   post:
 *     summary: Verify OTP
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid or expired OTP
 *       500:
 *         description: Server error
 */
router.post("/otp/verify", verifyOtp);

/**
 * @swagger
 * /otp/reset-password:
 *   post:
 *     summary: Reset password using OTP
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid OTP or user not found
 *       500:
 *         description: Server error
 */
router.post("/otp/reset-password", resetPassword);

module.exports = router;
