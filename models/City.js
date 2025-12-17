const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const CitySchema = new mongoose.Schema(
  {
    cityName: {
      type: String,
      required: true,
    },
    cityCode: {
      type: String,
      // required: true,
    },
    stateId: {
      type: Schema.Types.ObjectId,
      ref: "State",
      required: true,
    },
    countryId: {
      type: Schema.Types.ObjectId,
      ref: "Country",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("City", CitySchema);
