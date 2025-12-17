const request = require("supertest");
const express = require("express");
const router = require("../../routes/EmployeeRoutes");
const Employee = require("../../models/Employee");
const CompanyMaster = require("../../models/CompanyMaster");
const { generateToken } = require("../../utils/generateToken");

// Mock dependencies
jest.mock("../../models/Employee");
jest.mock("../../models/CompanyMaster");
jest.mock("bcrypt", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));
jest.mock("../../utils/generateToken");
jest.mock("../../middlewares/authMiddleware", () => ({
  authMiddleware: jest.fn(() => (req, res, next) => {
    // Mock a user object for getCurrentUser tests
    req.user = { id: "mockUserId" };
    next();
  }),
}));

const app = express();
app.use(express.json());
app.use("/api", router);

describe("Employee Routes - Comprehensive Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  //--- createEmployee ---
  describe("POST /auth/create/employee", () => {
    it("should create an employee successfully", async () => {
      const bcrypt = require("bcrypt");
      Employee.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashedPassword");
      Employee.prototype.save = jest.fn().mockResolvedValue(true);

      const res = await request(app).post("/api/auth/create/employee").send({
        employeeName: "John Doe",
        emailOffice: "john.doe@example.com",
        password: "password123",
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe("Employee created successfully");
    });

    it("should fail with status 400 if employee already exists", async () => {
      Employee.findOne.mockResolvedValue({
        emailOffice: "john.doe@example.com",
      });

      const res = await request(app).post("/api/auth/create/employee").send({
        employeeName: "John Doe",
        emailOffice: "john.doe@example.com",
        password: "password123",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Employee already exists");
    });

    it("should fail with status 500 if required fields are missing", async () => {
      const bcrypt = require("bcrypt");
      // This simulates a Mongoose validation error
      Employee.prototype.save = jest
        .fn()
        .mockRejectedValue(new Error("Validation failed"));
      Employee.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashedPassword");

      const res = await request(app)
        .post("/api/auth/create/employee")
        .send({ employeeName: "John Doe" }); // Missing email and password

      expect(res.statusCode).toBe(500);
    });
  });

  //--- updateEmployee ---
  describe("PUT /auth/update/employee/:employeeId", () => {
    it("should update an employee successfully", async () => {
      const mockSave = jest.fn().mockResolvedValue(true);
      const mockEmployee = { _id: "1", save: mockSave };
      Employee.findById.mockResolvedValue(mockEmployee);
      Employee.findOne.mockResolvedValue(null); // No existing employee with the new email

      const res = await request(app).put("/api/auth/update/employee/1").send({
        employeeName: "Jane Doe",
        emailOffice: "jane.doe@example.com",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Employee updated successfully");
      expect(mockSave).toHaveBeenCalled();
    });

    it("should fail with status 400 if employee is not found", async () => {
      Employee.findById.mockResolvedValue(null);
      const res = await request(app)
        .put("/api/auth/update/employee/999")
        .send({ employeeName: "Jane Doe" });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Employee not found");
    });

    it("should fail with status 400 if email already exists for another employee", async () => {
      Employee.findById.mockResolvedValue({ _id: "1" });
      Employee.findOne.mockResolvedValue({
        _id: "2",
        emailOffice: "jane.doe@example.com",
      });

      const res = await request(app)
        .put("/api/auth/update/employee/1")
        .send({ emailOffice: "jane.doe@example.com" });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Email already exists");
    });
  });

  //--- deleteEmployee ---
  describe("DELETE /auth/delete/employee/:employeeId", () => {
    it("should delete an employee successfully", async () => {
      Employee.findById.mockResolvedValue({ _id: "1" });
      const mockExec = jest.fn().mockResolvedValue(true);
      Employee.findByIdAndDelete.mockReturnValue({ exec: mockExec });

      const res = await request(app).delete("/api/auth/delete/employee/1");
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Employee deleted successfully");
    });

    it("should fail with status 404 if employee is not found", async () => {
      Employee.findById.mockResolvedValue(null);
      const res = await request(app).delete("/api/auth/delete/employee/999");
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Employee not found");
    });
  });

  //--- loginEmployee ---
  describe("POST /auth/login/employee", () => {
    it("should login successfully with correct credentials", async () => {
      const bcrypt = require("bcrypt");
      const mockEmployee = {
        _id: "1",
        emailOffice: "test@test.com",
        password: "hashedPassword",
      };

      // Create chainable mock for Employee.findOne
      const mockEmployeeChain = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockEmployee),
      };
      Employee.findOne.mockReturnValue(mockEmployeeChain);

      bcrypt.compare.mockResolvedValue(true);
      generateToken.mockResolvedValue("test-token");

      const res = await request(app)
        .post("/api/auth/login/employee")
        .send({ email: "test@test.com", password: "password" });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Login successful");
      expect(res.body.token).toBe("test-token");
    });

    it("should fail with status 400 for a non-existent employee", async () => {
      // Create chainable mock for Employee.findOne
      const mockEmployeeChain = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };
      Employee.findOne.mockReturnValue(mockEmployeeChain);

      const res = await request(app)
        .post("/api/auth/login/employee")
        .send({ email: "nouser@test.com", password: "password" });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Employee not found");
    });

    it("should fail with status 400 for an invalid password", async () => {
      const bcrypt = require("bcrypt");
      const mockEmployee = {
        _id: "1",
        emailOffice: "test@test.com",
        password: "hashedPassword",
      };

      // Create chainable mock for Employee.findOne
      const mockEmployeeChain = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockEmployee),
      };
      Employee.findOne.mockReturnValue(mockEmployeeChain);

      bcrypt.compare.mockResolvedValue(false);

      const res = await request(app)
        .post("/api/auth/login/employee")
        .send({ email: "test@test.com", password: "wrongpassword" });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Invalid password");
    });
  });

  //--- getCurrentUser ---
  describe("GET /auth/get/current-user", () => {
    it("should get the current user successfully", async () => {
      Employee.findById.mockResolvedValue({
        _id: "mockUserId",
        employeeName: "Mock User",
        emailOffice: "test@test.com",
      });
      CompanyMaster.findOne.mockResolvedValue({ companyName: "Mock Company" });

      const res = await request(app).get("/api/auth/get/current-user");
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("User details retrieved successfully");
      expect(res.body.data.employeeName).toBe("Mock User");
    });

    it("should fail with status 404 if user is not found", async () => {
      Employee.findById.mockResolvedValue(null);
      CompanyMaster.findById.mockResolvedValue(null);
      const res = await request(app).get("/api/auth/get/current-user");
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("User not found");
    });
  });
});
