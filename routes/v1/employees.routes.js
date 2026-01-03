import express from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import {
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeById,
  listAllEmployees,
  listEmployeesByParams,
  listAllEmployeesByDepartment,
  loginEmployee,
  getCurrentUser,
  resetPassword,
} from "../../controllers/v1/employee.controller.js";

const router = express.Router();

/**
 * @swagger
 * /employees:
 *   post:
 *     summary: Create a new employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEmployee'
 *     responses:
 *       200:
 *         description: Employee created successfully
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/employees",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  createEmployee,
);

/**
 * @swagger
 * /employees:
 *   get:
 *     summary: List all employees
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of employees
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isOk:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Employee'
 */
router.get(
  "/employees",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  listAllEmployees,
);

/**
 * @swagger
 * /employees/{employeeId}:
 *   get:
 *     summary: Get employee by ID
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Employee details
 *       404:
 *         description: Employee not found
 */
router.get(
  "/employees/:employeeId",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  getEmployeeById,
);

/**
 * @swagger
 * /employees/{employeeId}:
 *   put:
 *     summary: Update employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEmployee'
 *     responses:
 *       200:
 *         description: Employee updated successfully
 *       404:
 *         description: Employee not found
 */
router.put(
  "/employees/:employeeId",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  updateEmployee,
);

/**
 * @swagger
 * /employees/{employeeId}:
 *   delete:
 *     summary: Delete employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Employee deleted successfully
 *       404:
 *         description: Employee not found
 */
router.delete(
  "/employees/:employeeId",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  deleteEmployee,
);

/**
 * @swagger
 * /employees/search:
 *   post:
 *     summary: Search employees with pagination
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SearchParams'
 *     responses:
 *       200:
 *         description: Paginated list of employees
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.post(
  "/employees/search",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  listEmployeesByParams,
);

/**
 * @swagger
 * /employees/department/{departmentId}:
 *   post:
 *     summary: List all employees by department with pagination
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SearchParams'
 *     responses:
 *       200:
 *         description: Paginated list of employees by department
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get(
  "/employees/department/:departmentId",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  listAllEmployeesByDepartment,
);

/**
 * @swagger
 * /employees/{employeeId}/reset-password:
 *   post:
 *     summary: Reset employee password
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 description: New password
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       404:
 *         description: Employee not found
 */
router.post(
  "/employees/:employeeId/reset-password",
  authMiddleware(["ADMIN"]),
  resetPassword,
);

/**
 * @swagger
 * /auth/employee/login:
 *   post:
 *     summary: Employee login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 */
router.post("/auth/employee/login", loginEmployee);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current logged-in user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user details
 *       401:
 *         description: Unauthorized
 */
router.get("/auth/me", authMiddleware(["ADMIN", "EMPLOYEE"]), getCurrentUser);

export default router;
