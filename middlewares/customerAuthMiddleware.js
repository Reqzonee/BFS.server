const jwt = require("jsonwebtoken");
const Customer = require("../models/Customer.js");

const customerAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Not logged in",
        status: 401,
        message: "Not logged in",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, please login",
        error: "Not authorized, please login",
        status: 401,
      });
    }

    const verified = jwt.verify(token, process.env.CUSTOMER_JWT_SECRET_KEY);

    if (!verified || !verified.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
        error: "Invalid token",
        status: 401,
      });
    }

    const customer = await Customer.findById(verified.id).select("-__v");

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Customer not found",
        error: "Customer not found",
        status: 401,
      });
    }

    if (!customer.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive",
        error: "Account is inactive",
        status: 403,
      });
    }

    if (!customer.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Account is not verified",
        error: "Account is not verified",
        status: 403,
      });
    }

    req.customer = {
      id: customer._id,
      mobileNumber: customer.mobileNumber,
      email: customer.email,
      fullName: customer.fullName,
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
        error: "Invalid token",
        status: 401,
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
        error: "Token expired",
        status: 401,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
      status: 500,
    });
  }
};

module.exports = customerAuthMiddleware;
