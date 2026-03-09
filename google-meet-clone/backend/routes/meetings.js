const express = require('express');
const router = express.Router();
const {
    createMeeting,
    getMeetings,
    getMeetingById,
    joinMeeting,
    leaveMeeting
} = require('../controllers/meetingController');
const { protect } = require('../middleware/authMiddleware');
const MeetingNote = require('../models/MeetingNote');

router.route('/')
    .post(protect, createMeeting)
    .get(protect, getMeetings);

router.route('/:meetingId')
    .get(getMeetingById);

router.post('/:meetingId/join', protect, joinMeeting);
router.post('/:meetingId/leave', protect, leaveMeeting);

// Meeting Notes Export Endpoint
router.post('/:meetingId/notes', protect, async (req, res) => {
    try {
        const notesData = req.body.notes; // Array of note objects

        if (!notesData || !Array.isArray(notesData) || notesData.length === 0) {
            return res.status(400).json({ success: false, message: 'No notes provided' });
        }

        const documents = notesData.map(n => ({
            meetingId: req.params.meetingId,
            userId: req.user.id,
            senderName: n.senderName || 'Unknown',
            transcript: n.text,
            language: n.language || 'en-US',
            timestamp: new Date(n.timestamp || Date.now())
        }));

        await MeetingNote.insertMany(documents);
        res.status(201).json({ success: true, message: 'Notes exported successfully' });
    } catch (err) {
        console.error('Notes export error', err);
        res.status(500).json({ success: false, message: 'Failed to export notes' });
    }
});

module.exports = router;
