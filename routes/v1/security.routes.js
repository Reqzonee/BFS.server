/**
 * Security Routes
 * Provides endpoints for testing security features
 */
import express from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { uploadRateLimiter, authRateLimiter } from "../../middlewares/rateLimiter.js";
import { createSecureImageUpload, createSecureDocumentUpload } from "../../middlewares/secureUpload.js";
import fs from "fs";

const router = express.Router();

// ============ UPLOAD DIRECTORIES ============
const imageUploadDir = "uploads/security-test/images";
const documentUploadDir = "uploads/security-test/documents";

// Ensure directories exist
[imageUploadDir, documentUploadDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// ============ SECURE UPLOAD MIDDLEWARE ============
const secureImageUpload = createSecureImageUpload({
    destination: imageUploadDir,
    fieldName: 'image',
    maxSize: 5 * 1024 * 1024, // 5MB
    compress: true,
    quality: 85,
});

const secureDocumentUpload = createSecureDocumentUpload({
    destination: documentUploadDir,
    fieldName: 'document',
    maxSize: 10 * 1024 * 1024, // 10MB
});

// ============ ROUTES ============

/**
 * @swagger
 * /security/upload-image:
 *   post:
 *     summary: Test secure image upload
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *       400:
 *         description: Validation failed
 *       429:
 *         description: Rate limit exceeded
 */
router.post(
    "/security/upload-image",
    authMiddleware(["ADMIN", "EMPLOYEE"]),
    uploadRateLimiter,
    secureImageUpload,
    (req, res) => {
        if (!req.file) {
            return res.status(400).json({
                isOk: false,
                status: 400,
                error: "No File",
                message: "No image file uploaded",
            });
        }

        return res.status(200).json({
            isOk: true,
            status: 200,
            message: "Image uploaded and validated successfully",
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size,
            mimetype: req.file.mimetype,
            originalSize: req.file.originalSize,
            compressionRatio: req.file.compressionRatio,
        });
    }
);

/**
 * @swagger
 * /security/upload-document:
 *   post:
 *     summary: Test secure document upload (PDF)
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Document uploaded successfully
 *       400:
 *         description: Validation failed
 *       429:
 *         description: Rate limit exceeded
 */
router.post(
    "/security/upload-document",
    authMiddleware(["ADMIN", "EMPLOYEE"]),
    uploadRateLimiter,
    secureDocumentUpload,
    (req, res) => {
        if (!req.file) {
            return res.status(400).json({
                isOk: false,
                status: 400,
                error: "No File",
                message: "No document file uploaded",
            });
        }

        return res.status(200).json({
            isOk: true,
            status: 200,
            message: "Document uploaded and validated successfully",
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size,
            mimetype: req.file.mimetype,
        });
    }
);

/**
 * @swagger
 * /security/rate-limit-test:
 *   get:
 *     summary: Test rate limiting
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Request successful
 *       429:
 *         description: Rate limit exceeded
 */


router.get(
    "/security/rate-limit-test",
    authMiddleware(["ADMIN", "EMPLOYEE"]),
    authRateLimiter,
    (req, res) => {
        return res.status(200).json({
            isOk: true,
            status: 200,
            message: "Rate limit check passed",
            timestamp: new Date().toISOString(),
        });
    }
);

/**
 * @swagger
 * /security/features:
 *   get:
 *     summary: Get list of implemented security features
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of security features
 */
router.get(
    "/security/features",
    authMiddleware(["ADMIN", "EMPLOYEE"]),
    (req, res) => {
        return res.status(200).json({
            isOk: true,
            status: 200,
            features: [
                {
                    name: "Rate Limiting",
                    description: "IP and user-based rate limiting on all endpoints",
                    package: "express-rate-limit",
                },
                {
                    name: "Input Validation",
                    description: "Schema-based validation and sanitization",
                    package: "express-validator",
                },
                {
                    name: "Security Headers",
                    description: "OWASP-compliant security headers",
                    package: "helmet",
                },
                {
                    name: "NoSQL Injection Protection",
                    description: "MongoDB query sanitization",
                    package: "express-mongo-sanitize",
                },
                {
                    name: "HPP Protection",
                    description: "HTTP Parameter Pollution prevention",
                    package: "hpp",
                },
                {
                    name: "Secure File Uploads",
                    description: "Magic byte validation, WebP compression, UUID filenames",
                    package: "file-type, sharp, uuid",
                },
                {
                    name: "CORS Configuration",
                    description: "Strict origin whitelisting",
                    package: "cors",
                },
                {
                    name: "JWT Authentication",
                    description: "Role-based access control with strong secrets",
                    package: "jsonwebtoken",
                },
            ],
        });
    }
);

export default router;
