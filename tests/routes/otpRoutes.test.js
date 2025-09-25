
const request = require('supertest');
const express = require('express');
const router = require('../../routes/otpRoutes');

jest.mock('../../controllers/OtpController', () => ({
    createOtp: jest.fn((req, res) => res.status(200).json({ message: 'OTP sent' })),
    verifyOtp: jest.fn((req, res) => res.status(200).json({ message: 'OTP verified' })),
    resetPassword: jest.fn((req, res) => res.status(200).json({ message: 'Password reset' })),
}));

const app = express();
app.use(express.json());
app.use('/api', router);

describe('OTP Routes', () => {
    it('should send an OTP', async () => {
        const res = await request(app)
            .post('/api/send-otp')
            .send({ email: 'test@test.com' });
        expect(res.statusCode).toEqual(200);
    });

    it('should verify an OTP', async () => {
        const res = await request(app)
            .post('/api/verify-otp')
            .send({ email: 'test@test.com', otp: '123456' });
        expect(res.statusCode).toEqual(200);
    });

    it('should reset the password', async () => {
        const res = await request(app)
            .post('/api/reset-password')
            .send({ email: 'test@test.com', otp: '123456', password: 'newpassword' });
        expect(res.statusCode).toEqual(200);
    });
});
