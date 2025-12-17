const request = require("supertest");
const express = require("express");
const router = require("../../routes/DepartmentRoutes");
const Department = require("../../models/Department");
const {
  getReferencingCounts,
  formatReferenceMessage,
} = require("../../utils/referenceHelper");

// Mock dependencies
jest.mock("../../models/Department");
jest.mock("../../utils/referenceHelper");
jest.mock("../../middlewares/authMiddleware", () => ({
  authMiddleware: jest.fn(() => (req, res, next) => next()),
}));

const app = express();
app.use(express.json());
app.use("/api", router);

describe("Department Routes - Comprehensive Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  //--- createDepartment ---
  describe("POST /auth/create/department", () => {
    it("should create a department successfully with valid data", async () => {
      Department.findOne.mockResolvedValue(null);
      const mockSave = jest.fn().mockResolvedValue(true);
      Department.prototype.save = mockSave;

      const res = await request(app)
        .post("/api/auth/create/department")
        .send({ departmentName: "Finance", departmentCode: "FIN" });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe("Department created successfully");
    });

    it("should fail with status 400 if department code already exists", async () => {
      Department.findOne.mockResolvedValue({
        _id: "123",
        departmentName: "Finance",
        departmentCode: "FIN",
      });
      const res = await request(app)
        .post("/api/auth/create/department")
        .send({ departmentName: "Finance", departmentCode: "FIN" });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Department already exists");
    });

    it("should fail with status 400 if departmentName is missing, triggering already exists error", async () => {
      Department.findOne.mockResolvedValue({
        _id: "123",
        departmentName: "Finance",
        departmentCode: "FIN",
      });
      const res = await request(app)
        .post("/api/auth/create/department")
        .send({ departmentCode: "FIN" });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Department already exists");
    });

    it("should fail with status 400 if departmentCode is missing, triggering already exists error", async () => {
      Department.findOne.mockResolvedValue({
        _id: "123",
        departmentName: "Finance",
      });
      const res = await request(app)
        .post("/api/auth/create/department")
        .send({ departmentName: "Finance" });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Department already exists");
    });

    it("should fail with status 400 if both departmentName and departmentCode are missing", async () => {
      const res = await request(app)
        .post("/api/auth/create/department")
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Department name and code are required");
    });

    it("should fail with status 500 if the database save operation fails", async () => {
      Department.findOne.mockResolvedValue(null);
      Department.prototype.save = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));

      const res = await request(app)
        .post("/api/auth/create/department")
        .send({ departmentName: "Finance", departmentCode: "FIN" });

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe("Internal server error");
    });
  });

  //--- getDeparmentById ---
  describe("GET /auth/get/department/:departmentId", () => {
    it("should return a department when a valid ID is provided", async () => {
      const mockDepartment = {
        _id: "1",
        departmentName: "HR",
        departmentCode: "HR01",
      };
      Department.findById.mockResolvedValue(mockDepartment);

      const res = await request(app).get("/api/auth/get/department/1");

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual(mockDepartment);
    });

    it("should return status 400 when department is not found", async () => {
      Department.findById.mockResolvedValue(null);
      const res = await request(app).get("/api/auth/get/department/999");
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Department not found");
    });
  });

  //--- deleteDepartment ---
  describe("DELETE /auth/delete/department/:departmentId", () => {
    it("should delete a department successfully if it is not in use", async () => {
      Department.findById.mockResolvedValue({ _id: "1" });
      getReferencingCounts.mockResolvedValue({ totalReferences: 0 });
      Department.findByIdAndDelete.mockResolvedValue(true);

      const res = await request(app).delete("/api/auth/delete/department/1");
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Department deleted successfully");
    });

    it("should fail with status 409 if the department is being referenced", async () => {
      Department.findById.mockResolvedValue({ _id: "1" });
      getReferencingCounts.mockResolvedValue({
        totalReferences: 2,
        details: {},
      });
      formatReferenceMessage.mockReturnValue("In use by 2 records.");

      const res = await request(app).delete("/api/auth/delete/department/1");
      expect(res.statusCode).toBe(409);
      expect(res.body.message).toContain("Cannot delete department");
    });

    it("should fail with status 400 if the department ID does not exist", async () => {
      Department.findById.mockResolvedValue(null);
      const res = await request(app).delete("/api/auth/delete/department/999");
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Department not found");
    });
  });

  //--- updateDepartment ---
  describe("PUT /auth/update/department/:departmentId", () => {
    it("should update a department successfully", async () => {
      const mockDepartment = {
        _id: "1",
        departmentName: "Old Name",
        departmentCode: "OLD",
        save: jest.fn().mockResolvedValue(true),
      };
      Department.findById.mockResolvedValue(mockDepartment);

      const res = await request(app)
        .put("/api/auth/update/department/1")
        .send({ departmentName: "New Name", departmentCode: "NEW" });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Department updated successfully");
    });

    it("should fail with status 400 if the department ID does not exist", async () => {
      Department.findById.mockResolvedValue(null);
      const res = await request(app)
        .put("/api/auth/update/department/999")
        .send({ departmentName: "New Name", departmentCode: "NEW" });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Department not found");
    });
  });
});
