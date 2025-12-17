const express = require("express");
const { authMiddleware } = require("../middlewares/authMiddleware.js");
const {
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeById,
  listAllEmployees,
  listEmployeesByParams,
  loginEmployee,
  getCurrentUser,
  resetPassword,
} = require("../controllers/EmployeeController.js");

const router = express.Router();

router.post(
  "/auth/create/employee",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  createEmployee,
);

router.put(
  "/auth/update/employee/:employeeId",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  updateEmployee,
);

router.delete(
  "/auth/delete/employee/:employeeId",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  deleteEmployee,
);

router.get(
  "/auth/get/employee/:employeeId",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  getEmployeeById,
);

router.get(
  "/auth/list/employee",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  listAllEmployees,
);

router.post(
  "/auth/listbyparams/employee",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  listEmployeesByParams,
);

router.post("/auth/login/employee", loginEmployee);

router.post(
  "/auth/reset-password/employee/:employeeId",
  authMiddleware(["ADMIN"]),
  resetPassword,
);

router.get(
  "/auth/get/current-user",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  getCurrentUser,
);

module.exports = router;
