const express = require("express");
const { authMiddleware } = require("../middlewares/authMiddleware.js");
const {
  createEmailFor,
  updateEmailFor,
  getEmailForById,
  listAllEmailFor,
  deleteEmailFor,
  listEmailForByParams,
} = require("../controllers/EmailForController.js");

const router = express.Router();

router.post(
  "/auth/create/email-for",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  createEmailFor,
);

router.put(
  "/auth/update/email-for/:emailForId",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  updateEmailFor,
);

router.get(
  "/auth/get/email-for/:emailForId",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  getEmailForById,
);

router.get(
  "/auth/list/email-for",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  listAllEmailFor,
);

router.delete(
  "/auth/delete/email-for/:emailForId",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  deleteEmailFor,
);

router.post(
  "/auth/listbyparams/email-for",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  listEmailForByParams,
);

module.exports = router;
