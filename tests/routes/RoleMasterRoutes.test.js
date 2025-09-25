
const request = require('supertest');
const express = require('express');
const router = require('../../routes/RoleMasterRoutes');

jest.mock('../../controllers/RoleMasterController', () => ({
    createRole: jest.fn((req, res) => res.status(201).json({ message: 'Role created' })),
    listAllRoles: jest.fn((req, res) => res.status(200).json({ message: 'All roles' })),
    updateRole: jest.fn((req, res) => res.status(200).json({ message: 'Role updated' })),
    deleteRole: jest.fn((req, res) => res.status(200).json({ message: 'Role deleted' })),
    getRoleById: jest.fn((req, res) => res.status(200).json({ message: 'Role found' })),
    listRoleByParams: jest.fn((req, res) => res.status(200).json({ message: 'Roles by params' })),
}));

jest.mock('../../middlewares/authMiddleware', () => ({
    authMiddleware: jest.fn(() => (req, res, next) => next()),
}));

const app = express();
app.use(express.json());
app.use('/api', router);

describe('RoleMaster Routes', () => {
    it('should create a role', async () => {
        const res = await request(app)
            .post('/api/auth/create/roles')
            .send({ name: 'test' });
        expect(res.statusCode).toEqual(201);
    });

    it('should list all roles', async () => {
        const res = await request(app)
            .get('/api/auth/list/roles');
        expect(res.statusCode).toEqual(200);
    });

    it('should update a role', async () => {
        const res = await request(app)
            .put('/api/auth/update/role/1')
            .send({ name: 'test' });
        expect(res.statusCode).toEqual(200);
    });

    it('should delete a role', async () => {
        const res = await request(app)
            .delete('/api/auth/delete/roles/1');
        expect(res.statusCode).toEqual(200);
    });

    it('should get a role by id', async () => {
        const res = await request(app)
            .get('/api/auth/get/roles/1');
        expect(res.statusCode).toEqual(200);
    });

    it('should list roles by params', async () => {
        const res = await request(app)
            .post('/api/auth/listbyparams/roles')
            .send({ name: 'test' });
        expect(res.statusCode).toEqual(200);
    });
});
