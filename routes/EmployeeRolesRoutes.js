const express = require("express");
const { authMiddleware } = require("../middlewares/authMiddleware.js");
const {
    createEmployeeRoles,
    getEmployeeRoles,
    updateEmployeeRoles,
} = require("../controllers/EmployeeRolesController.js");

const router = express.Router();

router.post(
    "/auth/create/employee-roles",
    authMiddleware(["ADMIN", "EMPLOYEE"]),
    createEmployeeRoles
);

router.get(
    "/auth/get/employee-roles/:roleId",
    authMiddleware(["ADMIN", "EMPLOYEE"]),
    getEmployeeRoles
);

router.put(
    "/auth/update/employee-roles/:roleId",
    authMiddleware(["ADMIN", "EMPLOYEE"]),
    updateEmployeeRoles
);

module.exports = router;
