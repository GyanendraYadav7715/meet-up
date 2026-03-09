const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        default: Date.now,
        index: { expires: '7d' } // Automatically purge documents older than 7 days
    },
    level: {
        type: String,
        required: true,
        index: true
    },
    message: {
        type: String,
        required: true
    },
    meta: {
        type: mongoose.Schema.Types.Mixed, // Allows flexible structured JSON payloads
        default: {}
    }
}, { capped: { size: 10485760, max: 100000, autoIndexId: true } }); // 10MB capped collection for safety if TTL fails or under high load

module.exports = mongoose.model('Log', logSchema);
