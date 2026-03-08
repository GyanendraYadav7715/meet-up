const Meeting = require('../models/Meeting');
const { v4: uuidv4 } = require('uuid');

// @desc    Create a new meeting
// @route   POST /api/meetings
// @access  Private
exports.createMeeting = async (req, res) => {
    try {
        const { title } = req.body;

        const meetingId = uuidv4();

        const meeting = new Meeting({
            meetingId,
            host: req.user.id,
            title: title || 'New Meeting',
            status: 'waiting'
        });

        await meeting.save();

        res.status(201).json({
            success: true,
            data: meeting
        });
    } catch (error) {
        console.error('Create Meeting Error:', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get all meetings for a user
// @route   GET /api/meetings
// @access  Private
exports.getMeetings = async (req, res) => {
    try {
        const meetings = await Meeting.find({ host: req.user.id }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: meetings.length,
            data: meetings
        });
    } catch (error) {
        console.error('Get Meetings Error:', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get a single meeting by UUID
// @route   GET /api/meetings/:meetingId
// @access  Public/Private (depending on requirements, let's say public to view info)
exports.getMeetingById = async (req, res) => {
    try {
        const meeting = await Meeting.findOne({ meetingId: req.params.meetingId }).populate('host', 'name email');

        if (!meeting) {
            return res.status(404).json({ success: false, message: 'Meeting not found' });
        }

        res.status(200).json({
            success: true,
            data: meeting
        });
    } catch (error) {
        console.error('Get Meeting By ID Error:', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Join a meeting (adds user to participants)
// @route   POST /api/meetings/:meetingId/join
// @access  Private
exports.joinMeeting = async (req, res) => {
    try {
        const meeting = await Meeting.findOne({ meetingId: req.params.meetingId });

        if (!meeting) {
            return res.status(404).json({ success: false, message: 'Meeting not found' });
        }

        // Optional Check if meeting already ended
        if (meeting.status === 'ended') {
            return res.status(400).json({ success: false, message: 'Meeting has already ended' });
        }

        // Check if user is already in participants
        const isParticipant = meeting.participants.find(
            (p) => p.user.toString() === req.user.id
        );

        if (!isParticipant) {
            meeting.participants.push({ user: req.user.id, joinedAt: Date.now() });
            if (meeting.status === 'waiting') {
                meeting.status = 'active';
            }
            await meeting.save();
        }

        res.status(200).json({
            success: true,
            data: meeting
        });
    } catch (error) {
        console.error('Join Meeting Error:', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Leave a meeting (updates leftAt for user)
// @route   POST /api/meetings/:meetingId/leave
// @access  Private
exports.leaveMeeting = async (req, res) => {
    try {
        const meeting = await Meeting.findOne({ meetingId: req.params.meetingId });

        if (!meeting) {
            return res.status(404).json({ success: false, message: 'Meeting not found' });
        }

        // Find user in participants list
        const participantIndex = meeting.participants.findIndex(
            (p) => p.user.toString() === req.user.id && !p.leftAt
        );

        if (participantIndex !== -1) {
            meeting.participants[participantIndex].leftAt = Date.now();
            await meeting.save();
        }

        res.status(200).json({
            success: true,
            data: meeting
        });
    } catch (error) {
        console.error('Leave Meeting Error:', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
