/**
 * Cancellation window in milliseconds (30 seconds)
 */
const CANCELLATION_WINDOW = 30 * 1000;

/**
 * Check if order can be cancelled based on status and time window
 * @param {Object} order - Order document
 * @returns {Object} Cancellation eligibility details
 */
function canCancelOrder(order) {
  // Check if order exists
  if (!order) {
    return {
      canCancel: false,
      reason: "Order not found",
    };
  }

  // Check if already cancelled
  if (order.status === "cancelled") {
    return {
      canCancel: false,
      reason: "Order is already cancelled",
    };
  }

  // Check if order is still pending
  if (order.status !== "pending") {
    return {
      canCancel: false,
      reason: "Order already processed by store. Cannot cancel.",
    };
  }

  // Check time window
  const now = new Date();
  const placedAt = new Date(order.placedAt);
  const timeSincePlaced = now - placedAt;

  if (timeSincePlaced > CANCELLATION_WINDOW) {
    return {
      canCancel: false,
      reason: "Cancellation window expired. Order can only be cancelled within 30 seconds.",
      timeSincePlaced,
      windowExpired: true,
    };
  }

  // Calculate remaining time
  const remainingTime = CANCELLATION_WINDOW - timeSincePlaced;
  const deadline = new Date(placedAt.getTime() + CANCELLATION_WINDOW);

  return {
    canCancel: true,
    remainingTime, // milliseconds remaining
    deadline, // absolute deadline timestamp
  };
}

/**
 * Calculate distance between two GeoJSON points
 * @param {Array} coords1 - [longitude, latitude]
 * @param {Array} coords2 - [longitude, latitude]
 * @returns {number} Distance in kilometers
 */
function calculateDistance(coords1, coords2) {
  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;

  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Check if delivery address is within store's delivery radius
 * @param {Object} storeLocation - Store GeoJSON location
 * @param {Object} deliveryLocation - Delivery address GeoJSON location
 * @param {number} deliveryRadius - Store's delivery radius in km
 * @returns {Object} Serviceability details
 */
function isAddressServiceable(storeLocation, deliveryLocation, deliveryRadius) {
  if (!storeLocation || !deliveryLocation) {
    return {
      serviceable: false,
      reason: "Location data missing",
    };
  }

  const distance = calculateDistance(
    storeLocation.coordinates,
    deliveryLocation.coordinates
  );

  if (distance > deliveryRadius) {
    return {
      serviceable: false,
      reason: "Address outside delivery radius",
      distance,
      maxRadius: deliveryRadius,
    };
  }

  return {
    serviceable: true,
    distance,
    maxRadius: deliveryRadius,
  };
}

module.exports = {
  canCancelOrder,
  calculateDistance,
  isAddressServiceable,
  CANCELLATION_WINDOW,
};
