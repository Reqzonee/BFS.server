const StoreMaster = require("../../models/StoreMaster.js");
const City = require("../../models/City.js");
const State = require("../../models/State.js");
const Country = require("../../models/Country.js");

const getNearbyStores = async (req, res) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
        error: "Latitude and longitude are required",
        status: 400,
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const maxDistance = parseFloat(radius) * 1000;

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates",
        error: "Invalid coordinates",
        status: 400,
      });
    }

    const stores = await StoreMaster.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [lng, lat],
          },
          distanceField: "distance",
          maxDistance: maxDistance,
          spherical: true,
          query: {
            isActive: true,
            isAcceptingOrders: true,
            "location.coordinates": { $ne: [0, 0] },
          },
        },
      },
      {
        $lookup: {
          from: "cities",
          localField: "cityId",
          foreignField: "_id",
          as: "city",
        },
      },
      {
        $lookup: {
          from: "states",
          localField: "stateId",
          foreignField: "_id",
          as: "state",
        },
      },
      {
        $lookup: {
          from: "countries",
          localField: "countryId",
          foreignField: "_id",
          as: "country",
        },
      },
      {
        $project: {
          storeName: 1,
          storeCode: 1,
          address: 1,
          contactNumber: 1,
          location: 1,
          deliveryRadiusKm: 1,
          minOrderAmount: 1,
          openingTime: 1,
          closingTime: 1,
          distance: 1,
          distanceKm: { $round: [{ $divide: ["$distance", 1000] }, 2] },
          city: { $arrayElemAt: ["$city.cityName", 0] },
          state: { $arrayElemAt: ["$state.stateName", 0] },
          country: { $arrayElemAt: ["$country.countryName", 0] },
          canDeliver: {
            $cond: {
              if: { $lte: [{ $divide: ["$distance", 1000] }, "$deliveryRadiusKm"] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $sort: { distance: 1 },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Nearby stores fetched successfully",
      status: 200,
      data: {
        stores,
        totalCount: stores.length,
        searchRadius: radius,
        searchLocation: { latitude: lat, longitude: lng },
      },
    });
  } catch (error) {
    console.error("Get Nearby Stores Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch nearby stores",
      error: error.message,
      status: 500,
    });
  }
};

const getStoreById = async (req, res) => {
  try {
    const { id } = req.params;

    const store = await StoreMaster.findById(id)
      .populate("cityId", "cityName")
      .populate("stateId", "stateName")
      .populate("countryId", "countryName")
      .select("-__v");

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
        error: "Store not found",
        status: 404,
      });
    }

    if (!store.isActive) {
      return res.status(404).json({
        success: false,
        message: "Store is not available",
        error: "Store is not available",
        status: 404,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Store details fetched successfully",
      status: 200,
      data: {
        store: {
          id: store._id,
          storeName: store.storeName,
          storeCode: store.storeCode,
          address: store.address,
          city: store.cityId?.cityName,
          state: store.stateId?.stateName,
          country: store.countryId?.countryName,
          contactNumber: store.contactNumber,
          location: store.location,
          deliveryRadiusKm: store.deliveryRadiusKm,
          minOrderAmount: store.minOrderAmount,
          openingTime: store.openingTime,
          closingTime: store.closingTime,
          isAcceptingOrders: store.isAcceptingOrders,
        },
      },
    });
  } catch (error) {
    console.error("Get Store By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch store details",
      error: error.message,
      status: 500,
    });
  }
};

const checkDeliveryServiceability = async (req, res) => {
  try {
    const { storeId, latitude, longitude } = req.body;

    if (!storeId || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Store ID, latitude, and longitude are required",
        error: "Store ID, latitude, and longitude are required",
        status: 400,
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates",
        error: "Invalid coordinates",
        status: 400,
      });
    }

    const store = await StoreMaster.findById(storeId);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
        error: "Store not found",
        status: 404,
      });
    }

    if (!store.isActive || !store.isAcceptingOrders) {
      return res.status(400).json({
        success: false,
        message: "Store is not accepting orders",
        error: "Store is not accepting orders",
        status: 400,
        data: {
          serviceable: false,
          reason: "Store is currently not accepting orders",
        },
      });
    }

    const [storeLng, storeLat] = store.location.coordinates;

    if (storeLng === 0 && storeLat === 0) {
      return res.status(400).json({
        success: false,
        message: "Store location not configured",
        error: "Store location not configured",
        status: 400,
        data: {
          serviceable: false,
          reason: "Store location is not set",
        },
      });
    }

    const toRadians = (deg) => (deg * Math.PI) / 180;
    const R = 6371;
    const dLat = toRadians(lat - storeLat);
    const dLng = toRadians(lng - storeLng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(storeLat)) *
        Math.cos(toRadians(lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    const isServiceable = distance <= store.deliveryRadiusKm;

    return res.status(200).json({
      success: true,
      message: isServiceable
        ? "Delivery is available"
        : "Location is outside delivery range",
      status: 200,
      data: {
        serviceable: isServiceable,
        distance: parseFloat(distance.toFixed(2)),
        maxDeliveryRadius: store.deliveryRadiusKm,
        minOrderAmount: store.minOrderAmount,
        storeName: store.storeName,
      },
    });
  } catch (error) {
    console.error("Check Delivery Serviceability Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check delivery serviceability",
      error: error.message,
      status: 500,
    });
  }
};

module.exports = {
  getNearbyStores,
  getStoreById,
  checkDeliveryServiceability,
};
