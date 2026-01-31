const jwt = require("jsonwebtoken");

const authMiddleware = (roles) => {
  return (req, res, next) => {
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

    let verified;
    let fallbackSecret = process.env.JWT_SECRET_KEY; // Backward compatibility fallback

    for (const role of roles) {
      try {
        const secretKey = process.env[`${role.toUpperCase()}_JWT_SECRET_KEY`] || fallbackSecret;
        if (!secretKey) continue;

        verified = jwt.verify(token, secretKey);
        if (verified) {
          console.log(`🔐 Auth successful for role: ${role} (User ID: ${verified.id})`);
          break;
        }
      } catch (err) {
        // Detailed log for debugging, but hidden in production
        if (process.env.NODE_ENV !== 'production') {
          // console.log(`🔍 Verification failed for role ${role}: ${err.message}`);
        }
        continue;
      }
    }

    if (!verified || !verified.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
        error: "Invalid token",
        status: 401,
      });
    }

    req.user = {
      id: verified.id,
      role: verified.role,
      companyId: verified.companyId,
      storeId: verified.storeId
    };

    next();
  };
};

const requireSuperAdmin = async (req, res, next) => {
  try {
    const CompanyMasterModels = require("../models/CompanyMaster");

    if (!req.user || req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Super admin only",
        error: "Forbidden",
        status: 403,
      });
    }

    const company = await CompanyMasterModels.findById(req.user.id);
    if (!company || !company.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Super admin only",
        error: "Forbidden",
        status: 403,
      });
    }

    next();
  } catch (error) {
    console.error("Error in requireSuperAdmin middleware", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
      status: 500,
    });
  }
};

module.exports = {
  authMiddleware,
  requireSuperAdmin
};
