const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema(
  {
    employeeName: {
      type: String,
      required: true,
      trim: true,
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StoreMaster",
      default: null,
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId, // Defines permissions (Store Admin vs Staff)
      ref: "RoleMaster",
      required: true,
    },
    emailOffice: {
      type: String,
      required: true,
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: false,
      trim: true,
    },
    countryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Country",
      required: true,
    },
    stateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "State",
      required: true,
    },
    cityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
      required: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Employee", EmployeeSchema);
