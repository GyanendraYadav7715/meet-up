const mongoose = require('mongoose');

const meetingNoteSchema = new mongoose.Schema({
    meetingId: {
        type: String,
        required: true,
        index: true
    },
    userId: {
        type: String, // Or ObjectId if linking to User explicitly in future
        required: true
    },
    senderName: {
        type: String,
        required: true
    },
    transcript: {
        type: String,
        required: true
    },
    language: {
        type: String,
        default: 'en-US'
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

module.exports = mongoose.model('MeetingNote', meetingNoteSchema);
