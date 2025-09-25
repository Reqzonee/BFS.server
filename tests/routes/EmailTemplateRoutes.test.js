
const request = require('supertest');
const express = require('express');
const router = require('../../routes/EmailTemplateRoutes');

jest.mock('../../controllers/EmailTemplateController', () => ({
    createEmailTemplate: jest.fn((req, res) => res.status(201).json({ message: 'EmailTemplate created' })),
    updateEmailTemplate: jest.fn((req, res) => res.status(200).json({ message: 'EmailTemplate updated' })),
    getEmailTemplateById: jest.fn((req, res) => res.status(200).json({ message: 'EmailTemplate found' })),
    deleteEmailTemplate: jest.fn((req, res) => res.status(200).json({ message: 'EmailTemplate deleted' })),
    listEmailTemplateByParams: jest.fn((req, res) => res.status(200).json({ message: 'EmailTemplates by params' })),
    listAllEmailTemplates: jest.fn((req, res) => res.status(200).json({ message: 'All email templates' })),
}));

jest.mock('../../middlewares/authMiddleware', () => ({
    authMiddleware: jest.fn(() => (req, res, next) => next()),
}));

const app = express();
app.use(express.json());
app.use('/api', router);

describe('EmailTemplate Routes', () => {
    it('should create an email template', async () => {
        const res = await request(app)
            .post('/api/auth/create/email-template')
            .send({ name: 'test' });
        expect(res.statusCode).toEqual(201);
    });

    it('should update an email template', async () => {
        const res = await request(app)
            .put('/api/auth/update/email-template/1')
            .send({ name: 'test' });
        expect(res.statusCode).toEqual(200);
    });

    it('should get an email template by id', async () => {
        const res = await request(app)
            .get('/api/auth/get/email-template/1');
        expect(res.statusCode).toEqual(200);
    });

    it('should delete an email template', async () => {
        const res = await request(app)
            .delete('/api/auth/delete/email-template/1');
        expect(res.statusCode).toEqual(200);
    });

    it('should list email templates by params', async () => {
        const res = await request(app)
            .post('/api/auth/listbyparams/email-template')
            .send({ name: 'test' });
        expect(res.statusCode).toEqual(200);
    });

    it('should list all email templates', async () => {
        const res = await request(app)
            .get('/api/auth/list/email-templates');
        expect(res.statusCode).toEqual(200);
    });
});
