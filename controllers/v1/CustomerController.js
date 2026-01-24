const Customer = require("../../models/Customer.js");

const getCustomer = async (req, res) => {
  try {
    const customerId = req.customer.id;

    const customer = await Customer.findById(customerId)
      .populate("linkedLoyaltyCards")
      .select("-__v");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
        error: "Customer not found",
        status: 404,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer data fetched successfully",
      status: 200,
      data: {
        id: customer._id,
        fullName: customer.fullName,
        email: customer.email,
        mobileNumber: customer.mobileNumber,
        isVerified: customer.isVerified,
        currentLocation: customer.currentLocation,
        addresses: customer.addresses,
        walletPoints: customer.walletPoints,
        linkedLoyaltyCards: customer.linkedLoyaltyCards,
        isActive: customer.isActive,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get Customer Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer data",
      error: error.message,
      status: 500,
    });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { fullName, email, currentLocation, addresses } = req.body;

    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
        error: "Customer not found",
        status: 404,
      });
    }

    if (fullName) {
      customer.fullName = fullName.trim();
    }

    if (email !== undefined) {
      customer.email = email ? email.trim() : null;
    }

    if (currentLocation) {
      if (currentLocation.latitude !== undefined && currentLocation.longitude !== undefined) {
        const lat = parseFloat(currentLocation.latitude);
        const lng = parseFloat(currentLocation.longitude);

        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          customer.currentLocation = { latitude: lat, longitude: lng };
        }
      }
    }

    if (addresses && Array.isArray(addresses)) {
      customer.addresses = addresses;
    }

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      status: 200,
      data: {
        id: customer._id,
        fullName: customer.fullName,
        email: customer.email,
        mobileNumber: customer.mobileNumber,
        currentLocation: customer.currentLocation,
        addresses: customer.addresses,
        walletPoints: customer.walletPoints,
      },
    });
  } catch (error) {
    console.error("Update Customer Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update customer",
      error: error.message,
      status: 500,
    });
  }
};

const addAddress = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const {
      addressType,
      houseNumber,
      street,
      area,
      landmark,
      city,
      state,
      country,
      pincode,
      latitude,
      longitude,
      isDefault,
    } = req.body;

    if (!addressType || !city || !state || !country || !pincode || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Missing required address fields",
        error: "addressType, city, state, country, pincode, latitude, and longitude are required",
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

    // Validate coordinate ranges
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: "Coordinates out of valid range",
        error: "Latitude must be between -90 and 90, Longitude must be between -180 and 180",
        status: 400,
      });
    }

    const customer = await Customer.findById(customerId);

    // Check for duplicate address by coordinates (within 10 meters tolerance)
    const COORDINATE_TOLERANCE = 0.0001; // ~11 meters
    const duplicateAddress = customer.addresses.find((addr) => {
      const existingLat = addr.location.coordinates[1];
      const existingLng = addr.location.coordinates[0];
      const latDiff = Math.abs(existingLat - lat);
      const lngDiff = Math.abs(existingLng - lng);
      return latDiff < COORDINATE_TOLERANCE && lngDiff < COORDINATE_TOLERANCE;
    });

    if (duplicateAddress) {
      return res.status(409).json({
        success: false,
        message: "Address with same location already exists",
        error: "Duplicate address detected",
        status: 409,
        data: {
          existingAddress: duplicateAddress,
        },
      });
    }

    const newAddress = {
      addressType: addressType.trim(),
      houseNumber: houseNumber?.trim(),
      street: street?.trim(),
      area: area?.trim(),
      landmark: landmark?.trim(),
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      pincode: pincode.trim(),
      location: {
        type: "Point",
        coordinates: [lng, lat],
      },
      isDefault: isDefault === true,
    };

    if (newAddress.isDefault) {
      customer.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    if (customer.addresses.length === 0) {
      newAddress.isDefault = true;
    }

    customer.addresses.push(newAddress);
    await customer.save();

    const addedAddress = customer.addresses[customer.addresses.length - 1];

    return res.status(201).json({
      success: true,
      message: "Address added successfully",
      status: 201,
      data: {
        address: addedAddress,
        totalAddresses: customer.addresses.length,
      },
    });
  } catch (error) {
    console.error("Add Address Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add address",
      error: error.message,
      status: 500,
    });
  }
};

const updateAddress = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { addressId } = req.params;
    const {
      addressType,
      houseNumber,
      street,
      area,
      landmark,
      city,
      state,
      country,
      pincode,
      latitude,
      longitude,
      isDefault,
    } = req.body;

    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
        error: "Customer not found",
        status: 404,
      });
    }

    const address = customer.addresses.id(addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
        error: "Address not found",
        status: 404,
      });
    }

    if (addressType) address.addressType = addressType.trim();
    if (houseNumber !== undefined) address.houseNumber = houseNumber?.trim();
    if (street !== undefined) address.street = street?.trim();
    if (area !== undefined) address.area = area?.trim();
    if (landmark !== undefined) address.landmark = landmark?.trim();
    if (city) address.city = city.trim();
    if (state) address.state = state.trim();
    if (country) address.country = country.trim();
    if (pincode) address.pincode = pincode.trim();

    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      if (!isNaN(lat) && !isNaN(lng)) {
        address.location.coordinates = [lng, lat];
      }
    }

    if (isDefault === true) {
      customer.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
      address.isDefault = true;
    } else if (isDefault === false) {
      address.isDefault = false;
    }

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Address updated successfully",
      status: 200,
      data: {
        address,
      },
    });
  } catch (error) {
    console.error("Update Address Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update address",
      error: error.message,
      status: 500,
    });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { addressId } = req.params;

    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
        error: "Customer not found",
        status: 404,
      });
    }

    const address = customer.addresses.id(addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
        error: "Address not found",
        status: 404,
      });
    }

    const wasDefault = address.isDefault;
    address.deleteOne();

    if (wasDefault && customer.addresses.length > 0) {
      customer.addresses[0].isDefault = true;
    }

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully",
      status: 200,
      data: {
        remainingAddresses: customer.addresses.length,
      },
    });
  } catch (error) {
    console.error("Delete Address Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete address",
      error: error.message,
      status: 500,
    });
  }
};

module.exports = {
  getCustomer,
  updateCustomer,
  addAddress,
  updateAddress,
  deleteAddress,
};
