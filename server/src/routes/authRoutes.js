const express = require('express');
const router = express.Router();
const { register, login, logout } = require('../controllers/authController');
const { validateRegisterInput, validateLoginInput } = require('../validators/authValidator');
const { authLimiter } = require('../middleware/rateLimiter');

// Protect registration and login endpoints with IP-based rate limiting
router.post('/register', authLimiter, validateRegisterInput, register);
router.post('/login', authLimiter, validateLoginInput, login);
router.post('/logout', logout);

module.exports = router;
