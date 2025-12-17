const express = require("express");
const { authMiddleware } = require("../middlewares/authMiddleware.js");
const {
  createEmailSetup,
  updateEmailSetup,
  getEmailSetupById,
  listAllEmailSetup,
  deleteEmailSetup,
  listEmailSetupByParams,
} = require("../controllers/EmailSetupController.js");

const router = express.Router();

router.post(
  "/auth/create/email-setup",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  createEmailSetup,
);

router.put(
  "/auth/update/email-setup/:emailSetupId",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  updateEmailSetup,
);

router.get(
  "/auth/get/email-setup/:emailSetupId",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  getEmailSetupById,
);

router.get(
  "/auth/list/email-setup",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  listAllEmailSetup,
);

router.delete(
  "/auth/delete/email-setup/:emailSetupId",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  deleteEmailSetup,
);

router.post(
  "/auth/listbyparams/email-setup",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  listEmailSetupByParams,
);

module.exports = router;
