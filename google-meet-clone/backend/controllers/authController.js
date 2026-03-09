const User = require('../models/User');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// Register User
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Basic validation
        if (!name || !email || !password) {
            logger.warn('Registration failed: Missing fields', { meta: { email } });
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            logger.warn('Registration failed: User already exists', { meta: { email } });
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user (password is automatically hashed in User schema)
        user = new User({
            name,
            email,
            password
        });

        await user.save();

        const payload = { user: { id: user.id } };

        // 15 minute access token
        const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '15m' });
        // 7 days refresh token
        const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'refresh-secret', { expiresIn: '7d' });

        // Set HttpOnly Cookie
        res.cookie('jwt', refreshToken, {
            httpOnly: true, // prevents cross-site scripting
            secure: process.env.NODE_ENV === 'production', // requires HTTPS in production
            sameSite: 'strict', // prevents CSRF
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        logger.info('User registered successfully', { meta: { userId: user._id, email: user.email } });

        res.status(201).json({
            token: accessToken,
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (err) {
        logger.error('Registration Error', { meta: { error: err.message, email: req.body.email }, stack: err.stack });
        res.status(500).json({ message: 'Server error during registration' });
    }
};

// Login User
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            logger.warn('Login failed: Missing credentials', { meta: { email } });
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // Check if user exists
        let user = await User.findOne({ email });
        if (!user) {
            logger.warn('Login failed: Invalid email', { meta: { email } });
            return res.status(401).json({ message: 'Invalid Credentials' });
        }

        // Check password using the model method
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            logger.warn('Login failed: Invalid password', { meta: { email } });
            return res.status(401).json({ message: 'Invalid Credentials' });
        }

        const payload = { user: { id: user.id } };

        // 15 minute access token
        const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '15m' });
        // 7 days refresh token
        const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'refresh-secret', { expiresIn: '7d' });

        // Set HttpOnly Cookie
        res.cookie('jwt', refreshToken, {
            httpOnly: true, // prevents cross-site scripting
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        logger.info('User logged in successfully', { meta: { userId: user._id, email: user.email } });

        res.json({
            token: accessToken,
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (err) {
        logger.error('Login Error', { meta: { error: err.message, email: req.body.email }, stack: err.stack });
        res.status(500).json({ message: 'Server error during login' });
    }
};

// Refresh Token
exports.refresh = (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.status(401).json({ message: 'Unauthorized' });

    const refreshToken = cookies.jwt;

    jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || 'refresh-secret',
        async (err, decoded) => {
            if (err) return res.status(403).json({ message: 'Forbidden' });

            const user = await User.findById(decoded.user.id);
            if (!user) return res.status(401).json({ message: 'Unauthorized' });

            const payload = { user: { id: user.id } };
            const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '15m' });

            res.json({ token: accessToken });
        }
    );
};

// Logout User
exports.logout = (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204); // No content
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
    res.json({ message: 'Logged out successfully' });
};
