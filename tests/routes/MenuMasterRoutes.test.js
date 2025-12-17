const request = require("supertest");
const express = require("express");
const router = require("../../routes/MenuMasterRoutes");

jest.mock("../../controllers/MenuMasterController", () => ({
  createMenuMaster: jest.fn((req, res) =>
    res.status(201).json({ message: "MenuMaster created" }),
  ),
  getAllMenuMasters: jest.fn((req, res) =>
    res.status(200).json({ message: "All menu masters" }),
  ),
  updateMenuMaster: jest.fn((req, res) =>
    res.status(200).json({ message: "MenuMaster updated" }),
  ),
  deleteMenuMaster: jest.fn((req, res) =>
    res.status(200).json({ message: "MenuMaster deleted" }),
  ),
  listMenuMasterByParams: jest.fn((req, res) =>
    res.status(200).json({ message: "MenuMasters by params" }),
  ),
  getMenuMasterById: jest.fn((req, res) =>
    res.status(200).json({ message: "MenuMaster found" }),
  ),
  getMenuByGroups: jest.fn((req, res) =>
    res.status(200).json({ message: "Menu by groups" }),
  ),
  getMenuTest: jest.fn((req, res) =>
    res.status(200).json({ message: "Menu test" }),
  ),
}));

jest.mock("../../middlewares/authMiddleware", () => ({
  authMiddleware: jest.fn(() => (req, res, next) => next()),
}));

const app = express();
app.use(express.json());
app.use("/api", router);

describe("MenuMaster Routes", () => {
  it("should create a menu master", async () => {
    const res = await request(app)
      .post("/api/auth/create/menu-master")
      .send({ name: "test" });
    expect(res.statusCode).toEqual(201);
  });

  it("should get all menu masters", async () => {
    const res = await request(app).get("/api/auth/get/menu-master");
    expect(res.statusCode).toEqual(200);
  });

  it("should update a menu master", async () => {
    const res = await request(app)
      .put("/api/auth/update/menu-master/1")
      .send({ name: "test" });
    expect(res.statusCode).toEqual(200);
  });

  it("should delete a menu master", async () => {
    const res = await request(app).delete("/api/auth/delete/menu-master/1");
    expect(res.statusCode).toEqual(200);
  });

  it("should list menu masters by params", async () => {
    const res = await request(app)
      .post("/api/auth/listbyparams/menu-master")
      .send({ name: "test" });
    expect(res.statusCode).toEqual(200);
  });

  it("should get a menu master by id", async () => {
    const res = await request(app).get("/api/auth/get/menu-master/1");
    expect(res.statusCode).toEqual(200);
  });

  it("should get menu by groups", async () => {
    const res = await request(app).get("/api/auth/get/menus-by-groups");
    expect(res.statusCode).toEqual(200);
  });

  it("should get menu test", async () => {
    const res = await request(app).get("/api/auth/get/menus-test");
    expect(res.statusCode).toEqual(200);
  });
});
