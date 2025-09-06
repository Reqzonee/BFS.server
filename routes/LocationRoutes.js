const express = require("express");
const { authMiddleware } = require("../middlewares/authMiddleware.js");
const {
    createCountry,
    listAllCountries,
    deleteCountry,
    updateCountry,
    createState,
    listAllStates,
    deleteState,
    updateState,
    listStateByCountry,
    listStateByParams,
    createCity,
    listAllCities,
    deleteCity,
    updateCity,
    listCityByState,
    listCityByParams,
    listCountryStateCity,
    getCountryById,
    listCountryByParams,
    getStateById,
    getCityById,
} = require("../controllers/LocationController.js");

const router = express.Router();

// COUNTRY ROUTES

router.post("/auth/create/country", authMiddleware(["ADMIN","EMPLOYEE"]), createCountry);

router.get("/list/country", listAllCountries);

router.delete(
    "/auth/delete/country/:countryId",
    authMiddleware(["ADMIN","EMPLOYEE"]),
    deleteCountry
);

router.put(
    "/auth/update/country/:countryId",
    authMiddleware(["ADMIN","EMPLOYEE"]),
    updateCountry
);

router.post(
    "/auth/listbyparams/country",
    authMiddleware(["ADMIN","EMPLOYEE"]),
    listCountryByParams
);

router.get(
    "/auth/get/country/:countryId",
    authMiddleware(["ADMIN", "EMPLOYEE"]),
    getCountryById
);

// STATE ROUTES

router.post("/auth/create/state", authMiddleware(["ADMIN","EMPLOYEE"]), createState);

router.get("/list/state", listAllStates);

router.get("/auth/get/state/:stateId", authMiddleware(["ADMIN","EMPLOYEE"]), getStateById);

router.delete(
    "/auth/delete/state/:stateId",
    authMiddleware(["ADMIN","EMPLOYEE"]),
    deleteState
);

router.put(
    "/auth/update/state/:stateId",
    authMiddleware(["ADMIN","EMPLOYEE"]),
    updateState
);

router.get("/auth/list-by-country/state/:countryId", listStateByCountry);

router.post(
    "/auth/listbyparams/state",
    authMiddleware(["ADMIN","EMPLOYEE"]),
    listStateByParams
);

// CITY ROUTES

router.post("/auth/create/city", authMiddleware(["ADMIN","EMPLOYEE"]), createCity);

router.get("/list/city", listAllCities);

router.get("/auth/get/city/:cityId", authMiddleware(["ADMIN","EMPLOYEE"]), getCityById);

router.delete(
    "/auth/delete/city/:cityId",
    authMiddleware(["ADMIN","EMPLOYEE"]),
    deleteCity
);

router.put("/auth/update/city/:cityId", authMiddleware(["ADMIN","EMPLOYEE"]), updateCity);

router.get("/auth/list-by-state/city/:stateId", listCityByState);

router.post(
    "/auth/listbyparams/city",
    authMiddleware(["ADMIN","EMPLOYEE"]),
    listCityByParams
);

// LOCATION ROUTES

router.get(
    "/list/location",
    authMiddleware(["ADMIN", "EMPLOYEE"]),
    listCountryStateCity
);

module.exports = router;
