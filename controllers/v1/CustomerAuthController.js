const Otp = require("../../models/Otp.js");
const Customer = require("../../models/Customer.js");
const { generateToken } = require("../../utils/generateToken.js");

const MOCK_OTP_ENABLED = process.env.MOCK_OTP_ENABLED === "true";
const MOCK_OTP_NUMBERS = process.env.MOCK_OTP_NUMBERS
  ? process.env.MOCK_OTP_NUMBERS.split(",")
  : ["9999999999"];
const MOCK_OTP_CODE = process.env.MOCK_OTP_CODE || "1234";

const sendOtp = async (req, res) => {
  try {
    const { mobileNumber } = req.body;

    if (!mobileNumber) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required",
        error: "Mobile number is required",
        status: 400,
      });
    }

    const cleanedNumber = mobileNumber.trim();

    const existingOtp = await Otp.findOne({ mobileNumber: cleanedNumber });
    if (existingOtp) {
      const timeDiff = Date.now() - existingOtp.createdAt.getTime();
      const cooldownPeriod = 60 * 1000;

      if (timeDiff < cooldownPeriod) {
        const remainingTime = Math.ceil((cooldownPeriod - timeDiff) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${remainingTime} seconds before requesting a new OTP`,
          error: `Please wait ${remainingTime} seconds before requesting a new OTP`,
          status: 429,
          remainingTime: remainingTime,
        });
      }

      await Otp.deleteOne({ mobileNumber: cleanedNumber });
    }

    let otp;
    let isMockMode = false;

    if (MOCK_OTP_ENABLED && MOCK_OTP_NUMBERS.includes(cleanedNumber)) {
      otp = MOCK_OTP_CODE;
      isMockMode = true;
      console.log(`[MOCK OTP] Generated OTP for ${cleanedNumber}: ${otp}`);
    } else {
      otp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(`[REAL OTP] Generated OTP for ${cleanedNumber}: ${otp}`);
    }

    await Otp.create({
      mobileNumber: cleanedNumber,
      otp,
      channel: "SMS",
      createdAt: new Date(),
    });

    const customer = await Customer.findOne({ mobileNumber: cleanedNumber });
    const isNewUser = !customer;

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      status: 200,
      data: {
        isNewUser,
        mockMode: isMockMode,
        expiresIn: 600,
      },
    });
  } catch (error) {
    console.error("Send OTP Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: error.message,
      status: 500,
    });
  }
};

const verifyOtp = async (req, res) => {
  let createdCustomer = null;

  try {
    const { mobileNumber, otp, fullName, email } = req.body;

    if (!mobileNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: "Mobile number and OTP are required",
        error: "Mobile number and OTP are required",
        status: 400,
      });
    }

    const cleanedNumber = mobileNumber.trim();
    const cleanedOtp = otp.trim();

    const otpRecord = await Otp.findOne({ mobileNumber: cleanedNumber });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "OTP not found or expired",
        error: "OTP not found or expired",
        status: 400,
      });
    }

    if (otpRecord.attempts >= 3) {
      await Otp.deleteOne({ mobileNumber: cleanedNumber });
      return res.status(400).json({
        success: false,
        message: "Maximum OTP attempts exceeded",
        error: "Maximum OTP attempts exceeded",
        status: 400,
      });
    }

    if (otpRecord.otp !== cleanedOtp) {
      await Otp.updateOne(
        { mobileNumber: cleanedNumber },
        { $inc: { attempts: 1 } }
      );

      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
        error: "Invalid OTP",
        status: 400,
      });
    }

    let customer = await Customer.findOne({ mobileNumber: cleanedNumber });
    let isNewUser = false;

    if (!customer) {
      if (!fullName || fullName.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Full name is required for new users",
          error: "Full name is required for new users",
          status: 400,
        });
      }

      if (email && email.trim().length > 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          return res.status(400).json({
            success: false,
            message: "Invalid email format",
            error: "Invalid email format",
            status: 400,
          });
        }

        const emailExists = await Customer.findOne({ email: email.trim() });
        if (emailExists) {
          return res.status(400).json({
            success: false,
            message: "Email already registered with another account",
            error: "Email already registered with another account",
            status: 400,
          });
        }
      }

      const customerData = {
        fullName: fullName.trim(),
        mobileNumber: cleanedNumber,
        isVerified: true,
        isActive: true,
        currentLocation: { latitude: 0, longitude: 0 },
      };

      if (email && email.trim().length > 0) {
        customerData.email = email.trim();
      }

      customer = await Customer.create(customerData);
      createdCustomer = customer;
      isNewUser = true;
    } else {
      if (!customer.isVerified) {
        customer.isVerified = true;
      }
      
      customer.currentLocation = { latitude: 0, longitude: 0 };
      await customer.save();
    }

    const token = generateToken(customer._id, "customer");

    await Otp.deleteOne({ mobileNumber: cleanedNumber });

    return res.status(200).json({
      success: true,
      message: isNewUser ? "Account created successfully" : "Login successful",
      status: 200,
      data: {
        token,
        customer: {
          id: customer._id,
          fullName: customer.fullName,
          mobileNumber: customer.mobileNumber,
          email: customer.email,
          isVerified: customer.isVerified,
          walletPoints: customer.walletPoints,
        },
        isNewUser,
        expiresIn: "7d",
      },
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);

    if (createdCustomer) {
      try {
        await Customer.deleteOne({ _id: createdCustomer._id });
        console.log(`Rolled back customer creation for: ${createdCustomer.mobileNumber}`);
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError);
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to verify OTP",
      error: error.message,
      status: 500,
    });
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
};
