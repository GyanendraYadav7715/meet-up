const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 3, // Limit each IP to 3 requests per `window` for auth specific routes
    message: 'Too many authentication attempts from this IP, please try again after a minute',
    standardHeaders: true,
    legacyHeaders: false,
});

// Register a new user
router.post('/register', authLimiter, authController.register);

// Login a user
router.post('/login', authLimiter, authController.login);

// Refresh token
router.get('/refresh', authController.refresh);

// Logout
router.post('/logout', authController.logout);

// Get current user profile (Protected Route)
router.get('/me', protect, (req, res) => {
    // req.user is set in the auth middleware
    res.status(200).json({
        id: req.user._id,
        name: req.user.name,
        email: req.user.email
    });
});

module.exports = router;
