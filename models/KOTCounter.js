const mongoose = require('mongoose');

/**
 * KOT Counter Schema
 * Tracks daily KOT numbers that reset every day
 * Each store has its own counter that resets at midnight
 */
const KOTCounterSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StoreMaster',
    required: true,
  },
  date: {
    type: Date,
    required: true,
    // Store only date part (YYYY-MM-DD) without time
  },
  currentNumber: {
    type: Number,
    required: true,
    default: 0,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Compound index for efficient queries
KOTCounterSchema.index({ storeId: 1, date: 1 }, { unique: true });

/**
 * Get next KOT number for today
 * @param {ObjectId} storeId - Store ID
 * @returns {Promise<Number>} Next KOT number
 */
KOTCounterSchema.statics.getNextKOTNumber = async function(storeId) {
  // Get today's date at midnight (local time)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find and increment counter for today
  const counter = await this.findOneAndUpdate(
    {
      storeId: storeId,
      date: today,
    },
    {
      $inc: { currentNumber: 1 },
      $set: { lastUpdated: new Date() },
    },
    {
      new: true, // Return updated document
      upsert: true, // Create if doesn't exist
      setDefaultsOnInsert: true,
    }
  );

  return counter.currentNumber;
};

/**
 * Get current KOT number for a specific date
 * @param {ObjectId} storeId - Store ID
 * @param {Date} date - Date to check
 * @returns {Promise<Number>} Current KOT number
 */
KOTCounterSchema.statics.getCurrentKOTNumber = async function(storeId, date) {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const counter = await this.findOne({
    storeId: storeId,
    date: targetDate,
  });

  return counter ? counter.currentNumber : 0;
};

/**
 * Reset counter for a specific date (admin use)
 * @param {ObjectId} storeId - Store ID
 * @param {Date} date - Date to reset
 * @returns {Promise<void>}
 */
KOTCounterSchema.statics.resetCounter = async function(storeId, date) {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  await this.findOneAndUpdate(
    {
      storeId: storeId,
      date: targetDate,
    },
    {
      $set: { currentNumber: 0, lastUpdated: new Date() },
    },
    {
      upsert: true,
    }
  );
};

module.exports = mongoose.model('KOTCounter', KOTCounterSchema);
