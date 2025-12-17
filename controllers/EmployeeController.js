const EmployeeModels = require("../models/Employee.js");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/generateToken.js");
const CompanyMaster = require("../models/CompanyMaster.js");

exports.createEmployee = async (req, res) => {
  try {
    const {
      employeeName,
      departmentId,
      roleId,
      emailOffice,
      mobileNumber,
      countryId,
      stateId,
      cityId,
      address,
      password,
      isActive,
    } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const existingEmployee = await EmployeeModels.findOne({
      emailOffice: emailOffice,
    });

    if (existingEmployee) {
      return res
        .status(400)
        .json({ isOk: false, message: "Employee already exists" });
    }

    const employee = new EmployeeModels({
      employeeName,
      departmentId,
      roleId,
      emailOffice,
      mobileNumber,
      countryId,
      stateId,
      cityId,
      address,
      password: hashedPassword,
      isActive,
    });

    await employee.save();

    return res.status(201).json({
      isOk: true,
      message: "Employee created successfully",
      status: 201,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const {
      employeeName,
      departmentId,
      roleId,
      emailOffice,
      mobileNumber,
      countryId,
      stateId,
      cityId,
      address,
      isActive,
    } = req.body;

    const employee = await EmployeeModels.findById(employeeId);

    if (!employee) {
      return res.status(400).json({
        isOk: false,
        message: "Employee not found",
        status: 400,
      });
    }

    const existingEmployee = await EmployeeModels.findOne({
      emailOffice: emailOffice,
      _id: { $ne: employeeId },
    });

    if (existingEmployee) {
      return res.status(400).json({
        isOk: false,
        message: "Email already exists",
        status: 400,
      });
    }

    employee.employeeName = employeeName;
    employee.departmentId = departmentId;
    employee.roleId = roleId;
    employee.emailOffice = emailOffice;
    employee.mobileNumber = mobileNumber;
    employee.countryId = countryId;
    employee.stateId = stateId;
    employee.cityId = cityId;
    employee.address = address;
    employee.isActive = isActive;

    await employee.save();

    return res.status(200).json({
      isOk: true,
      message: "Employee updated successfully",
      status: 200,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const employee = await EmployeeModels.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        isOk: false,
        message: "Employee not found",
        status: 404,
      });
    }

    await EmployeeModels.findByIdAndDelete(employeeId).exec();

    return res.status(200).json({
      isOk: true,
      message: "Employee deleted successfully",
      status: 200,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const employee = await EmployeeModels.findById(employeeId)
      .populate("departmentId")
      .populate("countryId")
      .populate("stateId")
      .populate("cityId")
      .populate("roleId");

    if (!employee) {
      return res.status(404).json({
        isOk: false,
        message: "Employee not found",
        status: 404,
      });
    }

    return res.status(200).json({
      isOk: true,
      data: employee,
      status: 200,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};

exports.listAllEmployees = async (req, res) => {
  try {
    const employees = await EmployeeModels.find({
      isActive: true,
    })
      .populate("departmentId")
      .populate("countryId")
      .populate("stateId")
      .populate("cityId")
      .populate("roleId");

    return res.status(200).json({
      isOk: true,
      data: employees,
      status: 200,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};

exports.listEmployeesByParams = async (req, res) => {
  try {
    let { skip, per_page, sorton, sortdir, match, isActive } = req.body;

    let query = [
      {
        $match: { isActive: isActive },
      },
      {
        $lookup: {
          from: "departments",
          localField: "departmentId",
          foreignField: "_id",
          as: "department",
        },
      },
      {
        $unwind: {
          path: "$department",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "rolemasters",
          localField: "roleId",
          foreignField: "_id",
          as: "role",
        },
      },
      {
        $unwind: {
          path: "$role",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $facet: {
          stage1: [
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
              },
            },
          ],
          stage2: [{ $skip: skip }, { $limit: per_page }],
        },
      },
      {
        $unwind: "$stage1",
      },
      {
        $project: {
          count: "$stage1.count",
          data: "$stage2",
        },
      },
    ];

    if (match) {
      let searchConditions = {
        $or: [
          { employeeName: { $regex: match, $options: "i" } },
          { emailOffice: { $regex: match, $options: "i" } },
          { mobileNumber: { $regex: match, $options: "i" } },
          {
            "department.departmentName": {
              $regex: match,
              $options: "i",
            },
          },
        ],
      };

      if (mongoose.Types.ObjectId.isValid(match)) {
        searchConditions.$or.push(
          { departmentId: new mongoose.Types.ObjectId(match) },
          { roleId: new mongoose.Types.ObjectId(match) },
        );
      }

      query = [{ $match: searchConditions }].concat(query);
    }

    if (sorton && sortdir) {
      let sort = {};
      sort[sorton] = sortdir === "desc" ? -1 : 1;
      query = [{ $sort: sort }].concat(query);
    } else {
      query = [{ $sort: { createdAt: -1 } }].concat(query);
    }

    const list = await EmployeeModels.aggregate(query);

    return res.status(200).json({
      data: list,
      status: 200,
    });
  } catch (error) {
    console.error("Error in listEmployeesByParams:", error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};

exports.listAllEmployeesByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;

    console.log(departmentId);

    const employees = await EmployeeModels.find({
      departmentId,
      isActive: true,
    });

    return res.status(200).json({
      isOk: true,
      data: employees,
      status: 200,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};

exports.loginEmployee = async (req, res) => {
  try {
    const { email, password } = req.body;

    const employee = await EmployeeModels.findOne({ emailOffice: email })
      .populate("departmentId")
      .populate("countryId")
      .populate("stateId")
      .populate("cityId")
      .populate("roleId")
      .exec();

    if (!employee) {
      return res.status(400).json({
        isOk: false,
        message: "Employee not found",
        status: 400,
      });
    }

    const isPasswordValid = await bcrypt.compare(password, employee.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        isOk: false,
        message: "Invalid password",
        status: 400,
      });
    }

    const token = await generateToken(employee._id, "EMPLOYEE");

    return res.status(200).json({
      isOk: true,
      message: "Login successful",
      data: employee,
      token: token,
      status: 200,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    // The user ID is available in req.user.id from the auth middleware
    const userId = req.user.id;
    let role = null;

    if (!userId) {
      return res.status(400).json({
        isOk: false,
        message: "User ID not found in request",
      });
    }

    let user = null;
    // Fetch the employee details using the correct model variable name
    user = await EmployeeModels.findById(userId);
    if (user) {
      role = "EMPLOYEE";
    }

    if (!user) {
      user = await CompanyMaster.findById(userId);
      if (user) {
        role = "ADMIN";
      }
    }

    if (!user) {
      return res.status(404).json({
        isOk: false,
        message: "User not found",
      });
    }

    const dataToSend = {
      _id: user._id,
      employeeName: user.employeeName,
      emailOffice: user.emailOffice,
      role: role,
      isActive: user.isActive,
      departmentId: user.departmentId,
      roleId: user.roleId,
    };

    const company = await CompanyMaster.findOne({ isSuperAdmin: false });

    if (role === "EMPLOYEE") {
      dataToSend.companyName = company ? company.companyName : "";
    }

    // Return essential user information
    return res.status(200).json({
      isOk: true,
      message: "User details retrieved successfully",
      data: dataToSend,
    });
  } catch (error) {
    console.error("Error fetching current user:", error);
    return res.status(500).json({
      isOk: false,
      message: error.message || "Error retrieving user details",
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { password } = req.body;

    const employee = await EmployeeModels.findById(employeeId);

    if (!employee) {
      return res.status(400).json({
        isOk: false,
        message: "Employee not found",
        status: 400,
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    employee.password = hashedPassword;

    await employee.save();

    return res.status(200).json({
      isOk: true,
      message: "Password reset successfully",
      status: 200,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};
