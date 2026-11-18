const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated } = require('../middleware/auth');

// Antarmuka Login Web
router.get('/login', authController.showLogin);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

// Kontrak API Bagian 11.1 — Autentikasi
router.post('/auth/login', authController.login);
router.post('/auth/logout', isAuthenticated, authController.logout);
router.get('/auth/me', isAuthenticated, authController.me);

module.exports = router;
