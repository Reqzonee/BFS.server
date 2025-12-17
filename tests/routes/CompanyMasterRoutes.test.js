const request = require("supertest");
const express = require("express");
const router = require("../../routes/CompanyMasterRoutes");
const CompanyMaster = require("../../models/CompanyMaster");
const Employee = require("../../models/Employee");
const { generateToken } = require("../../utils/generateToken");

// Mock dependencies
jest.mock("../../models/CompanyMaster");
jest.mock("../../models/Employee");
jest.mock("bcrypt", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));
jest.mock("../../utils/generateToken");
jest.mock("fs", () => ({
  ...jest.requireActual("fs"),
  existsSync: jest.fn(),
  unlinkSync: jest.fn(),
}));
jest.mock("../../middlewares/authMiddleware", () => ({
  authMiddleware: jest.fn(() => (req, res, next) => next()),
}));

const app = express();
app.use(express.json());
app.use("/api", router);

describe("CompanyMaster Routes - Comprehensive Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  //--- createCompanyMaster ---
  describe("POST /create/company-master", () => {
    it("should create a company master successfully", async () => {
      const bcrypt = require("bcrypt");
      bcrypt.hash.mockResolvedValue("hashedPassword");
      const mockSave = jest.fn().mockResolvedValue(true);
      CompanyMaster.prototype.save = mockSave;

      const res = await request(app).post("/api/create/company-master").send({
        companyName: "Test Corp",
        email: "test@corp.com",
        password: "password123",
        mobileNumber: "1234567890",
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe("Company Master created successfully");
      expect(mockSave).toHaveBeenCalled();
    });
  });

  //--- updateCompanyMaster ---
  describe("PUT /auth/update/company-master/:id", () => {
    it("should update a company master successfully", async () => {
      const mockSave = jest.fn().mockResolvedValue(true);
      const mockCompany = { _id: "1", save: mockSave };
      CompanyMaster.findById.mockResolvedValue(mockCompany);

      const res = await request(app)
        .put("/api/auth/update/company-master/1")
        .send({ companyName: "New Name" });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Company Master updated successfully");
      expect(mockSave).toHaveBeenCalled();
    });

    it("should return 404 if company master not found", async () => {
      CompanyMaster.findById.mockResolvedValue(null);
      const res = await request(app)
        .put("/api/auth/update/company-master/999")
        .send({ companyName: "New Name" });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Company Master not found");
    });
  });

  //--- loginCompany ---
  describe("POST /login/company-master", () => {
    it("should login a company successfully", async () => {
      const bcrypt = require("bcrypt");
      const mockCompany = {
        _id: "1",
        email: "admin@test.com",
        password: "hashedPassword",
      };

      // Create chainable mock for CompanyMaster.findOne
      const mockCompanyChain = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockCompany),
      };
      CompanyMaster.findOne.mockReturnValue(mockCompanyChain);

      // Create chainable mock for Employee.findOne
      const mockEmployeeChain = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };
      Employee.findOne.mockReturnValue(mockEmployeeChain);

      bcrypt.compare.mockResolvedValue(true);
      generateToken.mockResolvedValue("test-token");

      const res = await request(app)
        .post("/api/login/company-master")
        .send({ email: "admin@test.com", password: "password" });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Login successful");
      expect(res.body.token).toBe("test-token");
    });

    it("should return 404 if user not found", async () => {
      // Create chainable mock for CompanyMaster.findOne
      const mockCompanyChain = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };
      CompanyMaster.findOne.mockReturnValue(mockCompanyChain);

      // Create chainable mock for Employee.findOne
      const mockEmployeeChain = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };
      Employee.findOne.mockReturnValue(mockEmployeeChain);

      const res = await request(app)
        .post("/api/login/company-master")
        .send({ email: "nouser@test.com", password: "password" });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("User not found");
    });

    it("should return 400 for invalid password", async () => {
      const bcrypt = require("bcrypt");
      const mockCompany = {
        _id: "1",
        email: "admin@test.com",
        password: "hashedPassword",
      };

      // Create chainable mock for CompanyMaster.findOne
      const mockCompanyChain = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockCompany),
      };
      CompanyMaster.findOne.mockReturnValue(mockCompanyChain);

      // Create chainable mock for Employee.findOne
      const mockEmployeeChain = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };
      Employee.findOne.mockReturnValue(mockEmployeeChain);

      bcrypt.compare.mockResolvedValue(false);

      const res = await request(app)
        .post("/api/login/company-master")
        .send({ email: "admin@test.com", password: "wrongpassword" });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Invalid email or password");
    });
  });

  //--- getCompanyMasterById ---
  describe("GET /auth/get/company-master/:companyId", () => {
    it("should get a company by id successfully", async () => {
      // Create chainable mock for CompanyMaster.findById
      const mockCompanyChain = {
        populate: jest.fn().mockReturnThis(),
        exec: jest
          .fn()
          .mockResolvedValue({ _id: "1", companyName: "Test Corp" }),
      };
      CompanyMaster.findById.mockReturnValue(mockCompanyChain);

      // Create chainable mock for Employee.findById
      const mockEmployeeChain = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };
      Employee.findById.mockReturnValue(mockEmployeeChain);

      const res = await request(app).get("/api/auth/get/company-master/1");
      expect(res.statusCode).toBe(200);
      expect(res.body.role).toBe("ADMIN");
    });

    it("should return 404 if company or employee not found", async () => {
      // Create chainable mock for CompanyMaster.findById
      const mockCompanyChain = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };
      CompanyMaster.findById.mockReturnValue(mockCompanyChain);

      // Create chainable mock for Employee.findById
      const mockEmployeeChain = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };
      Employee.findById.mockReturnValue(mockEmployeeChain);

      const res = await request(app).get("/api/auth/get/company-master/999");
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Company or Employee not found");
    });
  });
});
