
const request = require('supertest');
const express = require('express');
const router = require('../../routes/MenuGroupRoutes');

jest.mock('../../controllers/MenuGroupController', () => ({
    createMenuGroup: jest.fn((req, res) => res.status(201).json({ message: 'MenuGroup created' })),
    getAllMenuGroups: jest.fn((req, res) => res.status(200).json({ message: 'All menu groups' })),
    updateMenuGroup: jest.fn((req, res) => res.status(200).json({ message: 'MenuGroup updated' })),
    deleteMenuGroup: jest.fn((req, res) => res.status(200).json({ message: 'MenuGroup deleted' })),
    listMenuGroupByParams: jest.fn((req, res) => res.status(200).json({ message: 'MenuGroups by params' })),
    getMenuGroupById: jest.fn((req, res) => res.status(200).json({ message: 'MenuGroup found' })),
}));

jest.mock('../../middlewares/authMiddleware', () => ({
    authMiddleware: jest.fn(() => (req, res, next) => next()),
}));

const app = express();
app.use(express.json());
app.use('/api', router);

describe('MenuGroup Routes', () => {
    it('should create a menu group', async () => {
        const res = await request(app)
            .post('/api/auth/create/menu-group')
            .send({ name: 'test' });
        expect(res.statusCode).toEqual(201);
    });

    it('should get all menu groups', async () => {
        const res = await request(app)
            .get('/api/auth/get/menu-group');
        expect(res.statusCode).toEqual(200);
    });

    it('should update a menu group', async () => {
        const res = await request(app)
            .put('/api/auth/update/menu-group/1')
            .send({ name: 'test' });
        expect(res.statusCode).toEqual(200);
    });

    it('should delete a menu group', async () => {
        const res = await request(app)
            .delete('/api/auth/delete/menu-group/1');
        expect(res.statusCode).toEqual(200);
    });

    it('should list menu groups by params', async () => {
        const res = await request(app)
            .post('/api/auth/listbyparams/menu-group')
            .send({ name: 'test' });
        expect(res.statusCode).toEqual(200);
    });

    it('should get a menu group by id', async () => {
        const res = await request(app)
            .get('/api/auth/get/menu-group/1');
        expect(res.statusCode).toEqual(200);
    });
});
