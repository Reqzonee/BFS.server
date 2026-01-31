const jwt = require("jsonwebtoken");

const generateToken = (_id, role, companyId = null, storeId = null) => {
  const payload = { id: _id, role: role };
  if (companyId) payload.companyId = companyId;
  if (storeId) payload.storeId = storeId;

  return jwt.sign(
    payload,
    process.env[`${role.toUpperCase()}_JWT_SECRET_KEY`],
    { expiresIn: process.env.JWT_EXPIRY },
  );
};


module.exports = {
  generateToken
};
