const jwt = require("jsonwebtoken");

const generateToken = (_id, role, companyId = null) => {
  const payload = { id: _id, role: role };
  if (companyId) payload.companyId = companyId;

  return jwt.sign(
    payload,
    process.env[`${role.toUpperCase()}_JWT_SECRET_KEY`],
    { expiresIn: process.env.JWT_EXPIRY },
  );
};


module.exports = {
  generateToken
};
