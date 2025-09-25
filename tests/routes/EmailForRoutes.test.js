
const request = require('supertest');
const express = require('express');
const router = require('../../routes/EmailForRoutes');

jest.mock('../../controllers/EmailForController', () => ({
    createEmailFor: jest.fn((req, res) => res.status(201).json({ message: 'EmailFor created' })),
    updateEmailFor: jest.fn((req, res) => res.status(200).json({ message: 'EmailFor updated' })),
    getEmailForById: jest.fn((req, res) => res.status(200).json({ message: 'EmailFor found' })),
    listAllEmailFor: jest.fn((req, res) => res.status(200).json({ message: 'All email fors' })),
    deleteEmailFor: jest.fn((req, res) => res.status(200).json({ message: 'EmailFor deleted' })),
    listEmailForByParams: jest.fn((req, res) => res.status(200).json({ message: 'EmailFors by params' })),
}));

jest.mock('../../middlewares/authMiddleware', () => ({
    authMiddleware: jest.fn(() => (req, res, next) => next()),
}));

const app = express();
app.use(express.json());
app.use('/api', router);

describe('EmailFor Routes', () => {
    it('should create an email for', async () => {
        const res = await request(app)
            .post('/api/auth/create/email-for')
            .send({ name: 'test' });
        expect(res.statusCode).toEqual(201);
    });

    it('should update an email for', async () => {
        const res = await request(app)
            .put('/api/auth/update/email-for/1')
            .send({ name: 'test' });
        expect(res.statusCode).toEqual(200);
    });

    it('should get an email for by id', async () => {
        const res = await request(app)
            .get('/api/auth/get/email-for/1');
        expect(res.statusCode).toEqual(200);
    });

    it('should list all email fors', async () => {
        const res = await request(app)
            .get('/api/auth/list/email-for');
        expect(res.statusCode).toEqual(200);
    });

    it('should delete an email for', async () => {
        const res = await request(app)
            .delete('/api/auth/delete/email-for/1');
        expect(res.statusCode).toEqual(200);
    });

    it('should list email fors by params', async () => {
        const res = await request(app)
            .post('/api/auth/listbyparams/email-for')
            .send({ name: 'test' });
        expect(res.statusCode).toEqual(200);
    });
});
