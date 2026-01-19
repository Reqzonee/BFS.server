const mongoose = require("mongoose");

const EmailForSchema = new mongoose.Schema(
  {
    emailFor: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("EmailFor", EmailForSchema);
