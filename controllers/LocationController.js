const CityModels = require("../models/City.js");
const CountryModels = require("../models/Country.js");
const StateModels = require("../models/State.js");
const {
  getReferencingCounts,
  formatReferenceMessage,
} = require("../utils/referenceHelper.js");

// COUNTRY

exports.createCountry = async (req, res) => {
  try {
    const { countryName, countryCode, isActive } = req.body;

    const existingCountry = await CountryModels.findOne({ countryName });

    if (existingCountry) {
      return res.status(400).json({
        isOk: false,
        message: "Country already exists",
        status: 400,
      });
    }

    const country = new CountryModels({
      countryName,
      countryCode,
      isActive,
    });
    await country.save();

    return res.status(201).json({
      isOk: true,
      message: "Country created successfully",
      status: 201,
    });
  } catch (error) {
    console.log("Error in createCountry", error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};

exports.listAllCountries = async (req, res) => {
  try {
    const countries = await CountryModels.find({ isActive: true });

    return res.status(200).json({
      isOk: true,
      data: countries,
      status: 200,
    });
  } catch (error) {
    console.log("Error in listAllCountries", error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};

exports.deleteCountry = async (req, res) => {
  try {
    const { countryId } = req.params;

    const country = await CountryModels.findById(countryId);

    if (!country) {
      return res.status(404).json({
        isOk: false,
        message: "Country not found",
        status: 404,
      });
    }

    const referenceInfo = await getReferencingCounts("Country", countryId);

    if (referenceInfo.totalReferences > 0) {
      return res.status(409).json({
        message: "Cannot delete country. It is being used by other records.",
        isOk: false,
        status: 409,
        totalReferences: referenceInfo.totalReferences,
        references: referenceInfo.details,
        formattedMessage: formatReferenceMessage(referenceInfo.details),
      });
    }

    await CountryModels.findByIdAndDelete({ _id: countryId });

    return res.status(200).json({
      isOk: true,
      message: "Country deleted successfully",
      status: 200,
    });
  } catch (error) {
    console.log("Error in deleteCountry", error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};

exports.updateCountry = async (req, res) => {
  try {
    const { countryId } = req.params;
    const { countryName, countryCode, isActive } = req.body;

    const country = await CountryModels.findById(countryId);

    if (!country) {
      return res.status(404).json({
        isOk: false,
        message: "Country not found",
        status: 404,
      });
    }

    country.countryName = countryName;
    country.countryCode = countryCode;
    country.isActive = isActive;

    await country.save();

    return res.status(200).json({
      isOk: true,
      message: "Country updated successfully",
      status: 200,
    });
  } catch (error) {
    console.log("Error in updateCountry", error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};

exports.listCountryByParams = async (req, res) => {
  try {
    let { skip, per_page, sorton, sortdir, match, IsActive } = req.body;

    let query = [
      {
        $match: { isActive: IsActive },
      },
      {
        $facet: {
          stage1: [
            {
              $group: {
                _id: null,
                count: {
                  $sum: 1,
                },
              },
            },
          ],
          stage2: [
            {
              $skip: skip,
            },
            {
              $limit: per_page,
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$stage1",
        },
      },
      {
        $project: {
          count: "$stage1.count",
          data: "$stage2",
        },
      },
    ];
    if (match) {
      query = [
        {
          $match: {
            $or: [
              {
                countryName: {
                  $regex: match,
                  $options: "i",
                },
              },
              {
                countryCode: {
                  $regex: match,
                  $options: "i",
                },
              },
            ],
          },
        },
      ].concat(query);
    }

    if (sorton && sortdir) {
      let sort = {};
      sort[sorton] = sortdir == "desc" ? -1 : 1;
      query = [
        {
          $sort: sort,
        },
      ].concat(query);
    } else {
      let sort = {};
      sort["createdAt"] = -1;
      query = [
        {
          $sort: sort,
        },
      ].concat(query);
    }

    const list = await CountryModels.aggregate(query);

    return res.status(200).json({
      data: list,
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

exports.getCountryById = async (req, res) => {
  try {
    const { countryId } = req.params;

    const country = await CountryModels.findById(countryId);

    if (!country) {
      return res.status(404).json({
        isOk: false,
        message: "Country not found",
        status: 404,
      });
    }

    return res.status(200).json({
      isOk: true,
      data: country,
      status: 200,
    });
  } catch (error) {
    console.log("Error in getCountryById", error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};

// STATE

exports.createState = async (req, res) => {
  try {
    const { stateName, stateCode, countryId, isActive } = req.body;
    console.log(req.body);

    const existingState = await StateModels.findOne({ stateName });

    if (existingState) {
      return res.status(400).json({
        isOk: false,
        message: "State already exists",
        status: 400,
      });
    }

    const state = new StateModels({
      stateName,
      stateCode,
      countryId,
      isActive,
    });

    await state.save();

    return res.status(201).json({
      isOk: true,
      message: "State created successfully",
      status: 201,
    });
  } catch (error) {
    console.log("Error in createState", error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};

exports.listAllStates = async (req, res) => {
  try {
    const states = await StateModels.find({ isActive: true }).populate(
      "countryId",
    );

    return res.status(200).json({
      isOk: true,
      data: states,
      status: 200,
    });
  } catch (error) {
    console.log("Error in listAllStates", error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};

exports.getStateById = async (req, res) => {
  try {
    const { stateId } = req.params;

    const state = await StateModels.findById(stateId);

    if (!state) {
      return res.status(404).json({
        isOk: false,
        message: "State not found",
        status: 404,
      });
    }

    return res.status(200).json({
      isOk: true,
      data: state,
      status: 200,
    });
  } catch (error) {
    console.log("Error in getStateById", error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};

exports.deleteState = async (req, res) => {
  try {
    const { stateId } = req.params;

    const state = await StateModels.findById(stateId);

    if (!state) {
      return res.status(404).json({
        isOk: false,
        message: "State not found",
        status: 404,
      });
    }

    await StateModels.deleteOne({ _id: stateId });

    return res.status(200).json({
      isOk: true,
      message: "State deleted successfully",
      status: 200,
    });
  } catch (error) {
    console.log("Error in deleteState", error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};

exports.updateState = async (req, res) => {
  try {
    const { stateId } = req.params;
    const { stateName, stateCode, countryId, isActive } = req.body;

    const state = await StateModels.findById(stateId);

    if (!state) {
      return res.status(404).json({
        isOk: false,
        message: "State not found",
        status: 404,
      });
    }

    state.stateName = stateName;
    state.stateCode = stateCode;
    state.countryId = countryId;
    state.isActive = isActive;

    await state.save();

    return res.status(200).json({
      isOk: true,
      message: "State updated successfully",
      status: 200,
    });
  } catch (error) {
    console.log("Error in updateState", error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};

exports.listStateByCountry = async (req, res) => {
  try {
    const { countryId } = req.params;

    const states = await StateModels.find({ countryId, isActive: true });

    return res.status(200).json({
      isOk: true,
      data: states,
      status: 200,
    });
  } catch (error) {
    console.log("Error in listStateByCountry", error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};

exports.listStateByParams = async (req, res) => {
  try {
    let { skip, per_page, sorton, sortdir, match, IsActive } = req.body;

    let query = [
      {
        $match: { isActive: IsActive },
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
        $unwind: "$country",
      },
      {
        $addFields: {
          countryName: "$country.countryName",
        },
      },
      {
        $facet: {
          stage1: [
            {
              $group: {
                _id: null,
                count: {
                  $sum: 1,
                },
              },
            },
          ],
          stage2: [
            {
              $skip: skip,
            },
            {
              $limit: per_page,
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$stage1",
        },
      },
      {
        $project: {
          count: "$stage1.count",
          data: "$stage2",
        },
      },
    ];
    if (match) {
      query = [
        {
          $match: {
            $or: [
              {
                stateName: {
                  $regex: match,
                  $options: "i",
                },
              },
              {
                stateCode: {
                  $regex: match,
                  $options: "i",
                },
              },
              {
                countryName: {
                  $regex: match,
                  $options: "i",
                },
              },
            ],
          },
        },
      ].concat(query);
    }

    if (sorton && sortdir) {
      let sort = {};
      sort[sorton] = sortdir == "desc" ? -1 : 1;
      query = [
        {
          $sort: sort,
        },
      ].concat(query);
    } else {
      let sort = {};
      sort["createdAt"] = -1;
      query = [
        {
          $sort: sort,
        },
      ].concat(query);
    }

    const list = await StateModels.aggregate(query);

    return res.status(200).json({
      status: 200,
      data: list,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).status({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};

// CITY

exports.createCity = async (req, res) => {
  const { cityName, cityCode, stateId, countryId, isActive } = req.body;

  try {
    const existingCity = await CityModels.findOne({ cityName });

    if (existingCity) {
      return res.status(400).json({
        isOk: false,
        message: "City already exists",
        status: 400,
      });
    }

    const city = new CityModels({
      cityName,
      cityCode,
      stateId,
      countryId,
      isActive,
    });

    await city.save();

    return res.status(201).json({
      isOk: true,
      message: "City created successfully",
      status: 201,
    });
  } catch (error) {
    console.log("Error in createCity", error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};

exports.listAllCities = async (req, res) => {
  try {
    const cities = await CityModels.find({ isActive: true }).populate(
      "stateId countryId",
    );

    return res.status(200).json({
      isOk: true,
      data: cities,
      status: 200,
    });
  } catch (error) {
    console.log("Error in listAllCities", error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};

exports.getCityById = async (req, res) => {
  try {
    const { cityId } = req.params;

    const city = await CityModels.findById(cityId);

    if (!city) {
      return res.status(404).json({
        isOk: false,
        message: "City not found",
        status: 404,
      });
    }

    return res.status(200).json({
      isOk: true,
      data: city,
      status: 200,
    });
  } catch (error) {
    console.log("Error in getCityById", error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};

exports.deleteCity = async (req, res) => {
  try {
    const { cityId } = req.params;

    const city = await CityModels.findById(cityId);

    if (!city) {
      return res.status(404).json({
        isOk: false,
        message: "City not found",
        status: 404,
      });
    }

    await CityModels.deleteOne({ _id: cityId });

    return res.status(200).json({
      isOk: true,
      message: "City deleted successfully",
      status: 200,
    });
  } catch (error) {
    console.log("Error in deleteCity", error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};

exports.updateCity = async (req, res) => {
  try {
    const { cityId } = req.params;
    const { cityName, cityCode, stateId, countryId, isActive } = req.body;

    const city = await CityModels.findById(cityId);

    if (!city) {
      return res.status(404).json({
        isOk: false,
        message: "City not found",
        status: 404,
      });
    }

    city.cityName = cityName;
    city.cityCode = cityCode;
    city.stateId = stateId;
    city.countryId = countryId;
    city.isActive = isActive;

    await city.save();

    return res.status(200).json({
      isOk: true,
      message: "City updated successfully",
      status: 200,
    });
  } catch (error) {
    console.log("Error in updateCity", error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};

exports.listCityByState = async (req, res) => {
  try {
    const { stateId } = req.params;

    const cities = await CityModels.find({ stateId, isActive: true });

    return res.status(200).json({
      isOk: true,
      data: cities,
      status: 200,
    });
  } catch (error) {
    console.log("Error in listCityByState", error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};

exports.listCityByParams = async (req, res) => {
  try {
    let { skip, per_page, sorton, sortdir, match, IsActive } = req.body;

    let query = [
      {
        $match: { isActive: IsActive },
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
        $unwind: "$country",
      },
      {
        $addFields: {
          countryName: "$country.countryName",
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
        $unwind: "$state",
      },
      {
        $addFields: {
          stateName: "$state.stateName",
        },
      },
      {
        $facet: {
          stage1: [
            {
              $group: {
                _id: null,
                count: {
                  $sum: 1,
                },
              },
            },
          ],
          stage2: [
            {
              $skip: skip,
            },
            {
              $limit: per_page,
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$stage1",
        },
      },
      {
        $project: {
          count: "$stage1.count",
          data: "$stage2",
        },
      },
    ];
    if (match) {
      query = [
        {
          $match: {
            $or: [
              {
                stateName: {
                  $regex: match,
                  $options: "i",
                },
              },
              {
                countryName: {
                  $regex: match,
                  $options: "i",
                },
              },
              {
                cityName: {
                  $regex: match,
                  $options: "i",
                },
              },
            ],
          },
        },
      ].concat(query);
    }

    if (sorton && sortdir) {
      let sort = {};
      sort[sorton] = sortdir == "desc" ? -1 : 1;
      query = [
        {
          $sort: sort,
        },
      ].concat(query);
    } else {
      let sort = {};
      sort["createdAt"] = -1;
      query = [
        {
          $sort: sort,
        },
      ].concat(query);
    }

    const list = await CityModels.aggregate(query);

    return res.status(200).json({
      data: list,
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

// LOCATION

exports.listCountryStateCity = async (req, res) => {
  try {
    const countries = await CountryModels.find({ isActive: true });

    const result = await Promise.all(
      countries.map(async (country) => {
        const states = await StateModels.find({
          countryId: country._id,
          isActive: true,
        });

        const statesWithCities = await Promise.all(
          states.map(async (state) => {
            const cities = await CityModels.find({
              stateId: state._id,
              isActive: true,
            });

            return {
              _id: state._id,
              stateName: state.stateName,
              stateCode: state.stateCode,
              cities: cities.map((city) => ({
                _id: city._id,
                cityName: city.cityName,
                cityCode: city.cityCode,
              })),
            };
          }),
        );

        return {
          _id: country._id,
          countryName: country.countryName,
          countryCode: country.countryCode,
          states: statesWithCities,
        };
      }),
    );

    return res.status(200).json({
      isOk: true,
      data: result,
      status: 200,
    });
  } catch (error) {
    console.log("Error in listCountryStateCity", error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};
