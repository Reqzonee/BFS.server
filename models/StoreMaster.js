const mongoose = require("mongoose");

const StoreMasterSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      required: true,
      trim: true,
    },
    storeCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CompanyMaster",
      required: true,
    },
    
    // address info
    address: {
      type: String,
      required: true,
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

    // Location for geospatial queries
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },

    // Business Info
    gstNumber: {
      type: String,
      trim: true,
    },
    contactNumber: {
      type: String,
      trim: true,
    },

    // Delivery Configuration
    deliveryRadiusKm: {
      type: Number,
      default: 5,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    isAcceptingOrders: {
      type: Boolean,
      default: true,
    },

    // Operating Hours (can be extended later)
    openingTime: {
      type: String,
      default: "09:00",
    },
    closingTime: {
      type: String,
      default: "22:00",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

StoreMasterSchema.index({ location: "2dsphere" });
StoreMasterSchema.index({ isActive: 1, isAcceptingOrders: 1 });

module.exports = mongoose.model("StoreMaster", StoreMasterSchema);
