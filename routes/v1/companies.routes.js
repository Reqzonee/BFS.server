import express from "express";
import fs from "fs";
import multer from "multer";
import {
  createCompanyMaster,
  updateCompanyMaster,
  loginCompany,
  getCompanyMasterById,
} from "../../controllers/v1/company.controller.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";

const router = express.Router();

const logoUploadFolder = "uploads/companyMaster";

if (!fs.existsSync(logoUploadFolder)) {
  fs.mkdirSync(logoUploadFolder, { recursive: true });
}

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, logoUploadFolder);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload = multer({
  storage: multerStorage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "logo") {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("Only image files are allowed for logo!"), false);
      }
    } else if (file.fieldname === "favicon") {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("Only image files are allowed for favicon!"), false);
      }
    } else {
      cb(new Error("Unknown field name!"), false);
    }
  },
});

/**
 * @swagger
 * /companies:
 *   post:
 *     summary: Create a new company
 *     tags: [Companies]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               companyName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               logo:
 *                 type: string
 *                 format: binary
 *               favicon:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Company created successfully
 */
router.post(
  "/companies",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "favicon", maxCount: 1 },
  ]),
  createCompanyMaster,
);

/**
 * @swagger
 * /companies/{id}:
 *   put:
 *     summary: Update company
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               companyName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               logo:
 *                 type: string
 *                 format: binary
 *               favicon:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Company updated successfully
 *       404:
 *         description: Company not found
 */
router.put(
  "/companies/:id",
  authMiddleware(["ADMIN"]),
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "favicon", maxCount: 1 },
  ]),
  updateCompanyMaster,
);

/**
 * @swagger
 * /companies/{companyId}:
 *   get:
 *     summary: Get company by ID
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Company details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Company not found
 */
router.get(
  "/companies/:companyId",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  getCompanyMasterById,
);

/**
 * @swagger
 * /auth/company/login:
 *   post:
 *     summary: Company/Admin login
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
router.post("/auth/company/login", loginCompany);

export default router;
