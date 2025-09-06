const express = require("express");
const { authMiddleware } = require("../middlewares/authMiddleware.js");
const {
    createDepartment,
    updateDepartment,
    deleteDepartment,
    getDeparmentById,
    listDepartments,
    listDepartmentByParams,
} = require("../controllers/DepartmentController.js");

const router = express.Router();

router.post(
    "/auth/create/department",
    authMiddleware(["ADMIN","EMPLOYEE"]),
    createDepartment
);

router.put(
    "/auth/update/department/:departmentId",
    authMiddleware(["ADMIN","EMPLOYEE"]),
    updateDepartment
);

router.delete(
    "/auth/delete/department/:departmentId",
    authMiddleware(["ADMIN","EMPLOYEE"]),
    deleteDepartment
);

router.get(
    "/auth/get/department/:departmentId",
    authMiddleware(["ADMIN","EMPLOYEE"]),
    getDeparmentById
);

router.get("/auth/list/department", authMiddleware(["ADMIN","EMPLOYEE"]), listDepartments);

router.post(
    "/auth/listbyparams/department",
    authMiddleware(["ADMIN","EMPLOYEE"]),
    listDepartmentByParams
);

module.exports = router;
