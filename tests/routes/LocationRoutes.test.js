
const request = require('supertest');
const express = require('express');
const router = require('../../routes/LocationRoutes');

jest.mock('../../controllers/LocationController', () => ({
    createCountry: jest.fn((req, res) => res.status(201).json({ message: 'Country created' })),
    listAllCountries: jest.fn((req, res) => res.status(200).json({ message: 'All countries' })),
    deleteCountry: jest.fn((req, res) => res.status(200).json({ message: 'Country deleted' })),
    updateCountry: jest.fn((req, res) => res.status(200).json({ message: 'Country updated' })),
    createState: jest.fn((req, res) => res.status(201).json({ message: 'State created' })),
    listAllStates: jest.fn((req, res) => res.status(200).json({ message: 'All states' })),
    deleteState: jest.fn((req, res) => res.status(200).json({ message: 'State deleted' })),
    updateState: jest.fn((req, res) => res.status(200).json({ message: 'State updated' })),
    listStateByCountry: jest.fn((req, res) => res.status(200).json({ message: 'States by country' })),
    listStateByParams: jest.fn((req, res) => res.status(200).json({ message: 'States by params' })),
    createCity: jest.fn((req, res) => res.status(201).json({ message: 'City created' })),
    listAllCities: jest.fn((req, res) => res.status(200).json({ message: 'All cities' })),
    deleteCity: jest.fn((req, res) => res.status(200).json({ message: 'City deleted' })),
    updateCity: jest.fn((req, res) => res.status(200).json({ message: 'City updated' })),
    listCityByState: jest.fn((req, res) => res.status(200).json({ message: 'Cities by state' })),
    listCityByParams: jest.fn((req, res) => res.status(200).json({ message: 'Cities by params' })),
    listCountryStateCity: jest.fn((req, res) => res.status(200).json({ message: 'Country state city' })),
    getCountryById: jest.fn((req, res) => res.status(200).json({ message: 'Country found' })),
    listCountryByParams: jest.fn((req, res) => res.status(200).json({ message: 'Countries by params' })),
    getStateById: jest.fn((req, res) => res.status(200).json({ message: 'State found' })),
    getCityById: jest.fn((req, res) => res.status(200).json({ message: 'City found' })),
}));

jest.mock('../../middlewares/authMiddleware', () => ({
    authMiddleware: jest.fn(() => (req, res, next) => next()),
}));

const app = express();
app.use(express.json());
app.use('/api', router);

describe('Location Routes', () => {
    // COUNTRY ROUTES
    it('should create a country', async () => {
        const res = await request(app).post('/api/auth/create/country').send({ name: 'test' });
        expect(res.statusCode).toEqual(201);
    });
    it('should list all countries', async () => {
        const res = await request(app).get('/api/list/country');
        expect(res.statusCode).toEqual(200);
    });
    it('should delete a country', async () => {
        const res = await request(app).delete('/api/auth/delete/country/1');
        expect(res.statusCode).toEqual(200);
    });
    it('should update a country', async () => {
        const res = await request(app).put('/api/auth/update/country/1').send({ name: 'test' });
        expect(res.statusCode).toEqual(200);
    });
    it('should list countries by params', async () => {
        const res = await request(app).post('/api/auth/listbyparams/country').send({ name: 'test' });
        expect(res.statusCode).toEqual(200);
    });
    it('should get a country by id', async () => {
        const res = await request(app).get('/api/auth/get/country/1');
        expect(res.statusCode).toEqual(200);
    });

    // STATE ROUTES
    it('should create a state', async () => {
        const res = await request(app).post('/api/auth/create/state').send({ name: 'test' });
        expect(res.statusCode).toEqual(201);
    });
    it('should list all states', async () => {
        const res = await request(app).get('/api/list/state');
        expect(res.statusCode).toEqual(200);
    });
    it('should get a state by id', async () => {
        const res = await request(app).get('/api/auth/get/state/1');
        expect(res.statusCode).toEqual(200);
    });
    it('should delete a state', async () => {
        const res = await request(app).delete('/api/auth/delete/state/1');
        expect(res.statusCode).toEqual(200);
    });
    it('should update a state', async () => {
        const res = await request(app).put('/api/auth/update/state/1').send({ name: 'test' });
        expect(res.statusCode).toEqual(200);
    });
    it('should list states by country', async () => {
        const res = await request(app).get('/api/auth/list-by-country/state/1');
        expect(res.statusCode).toEqual(200);
    });
    it('should list states by params', async () => {
        const res = await request(app).post('/api/auth/listbyparams/state').send({ name: 'test' });
        expect(res.statusCode).toEqual(200);
    });

    // CITY ROUTES
    it('should create a city', async () => {
        const res = await request(app).post('/api/auth/create/city').send({ name: 'test' });
        expect(res.statusCode).toEqual(201);
    });
    it('should list all cities', async () => {
        const res = await request(app).get('/api/list/city');
        expect(res.statusCode).toEqual(200);
    });
    it('should get a city by id', async () => {
        const res = await request(app).get('/api/auth/get/city/1');
        expect(res.statusCode).toEqual(200);
    });
    it('should delete a city', async () => {
        const res = await request(app).delete('/api/auth/delete/city/1');
        expect(res.statusCode).toEqual(200);
    });
    it('should update a city', async () => {
        const res = await request(app).put('/api/auth/update/city/1').send({ name: 'test' });
        expect(res.statusCode).toEqual(200);
    });
    it('should list cities by state', async () => {
        const res = await request(app).get('/api/auth/list-by-state/city/1');
        expect(res.statusCode).toEqual(200);
    });
    it('should list cities by params', async () => {
        const res = await request(app).post('/api/auth/listbyparams/city').send({ name: 'test' });
        expect(res.statusCode).toEqual(200);
    });

    // LOCATION ROUTES
    it('should list country state city', async () => {
        const res = await request(app).get('/api/list/location');
        expect(res.statusCode).toEqual(200);
    });
});
