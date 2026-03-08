const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Register a new user
router.post('/register', authController.register);

// Login a user
router.post('/login', authController.login);

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
