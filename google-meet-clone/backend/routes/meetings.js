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

router.route('/')
    .post(protect, createMeeting)
    .get(protect, getMeetings);

router.route('/:meetingId')
    .get(getMeetingById);

router.post('/:meetingId/join', protect, joinMeeting);
router.post('/:meetingId/leave', protect, leaveMeeting);

module.exports = router;
