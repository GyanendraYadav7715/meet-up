const express = require('express');
const router = express.Router();
const Log = require('../models/Log');

// @route   GET /api/logs
// @desc    Retrieve logs (Dev Only)
// @access  Public (in Dev)
router.get('/', async (req, res) => {
    // Security check: Only allow access in non-production environments
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: 'Log querying is disabled in production environments.' });
    }

    try {
        const { level, limit = 50, page = 1 } = req.query;
        const query = {};
        if (level) query.level = level;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const logs = await Log.find(query)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Log.countDocuments(query);

        res.json({
            logs,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error("Error fetching logs:", err);
        res.status(500).json({ message: 'Failed to retrieve logs' });
    }
});

module.exports = router;
