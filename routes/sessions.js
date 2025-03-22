const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Session = require('../models/Session');
const User = require('../models/User');

// @route   GET /api/sessions
// @desc    Get all sessions (Admin only)
// @access  Private (Admin)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const sessions = await Session.find().populate('mentor mentee', 'name email');
    res.json({ success: true, data: sessions });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// @route   POST /api/sessions
// @desc    Create a new session
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { mentor, topic, schedule } = req.body;

    // Validate if mentor exists
    const mentorUser = await User.findById(mentor);
    if (!mentorUser) {
      return res.status(404).json({ success: false, error: 'Mentor not found' });
    }

    // Create a new session
    const newSession = new Session({
      mentor,
      mentee: req.user.id, // The logged-in user is the mentee
      topic,
      schedule,
    });

    await newSession.save();
    res.status(201).json({ success: true, data: newSession });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// @route   GET /api/sessions/my-sessions
// @desc    Get sessions for the logged-in user
// @access  Private
router.get('/my-sessions', protect, async (req, res) => {
  try {
    const sessions = await Session.find({
      $or: [{ mentor: req.user.id }, { mentee: req.user.id }],
    }).populate('mentor mentee', 'name email');

    res.json({ success: true, data: sessions });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// @route   GET /api/sessions/:id
// @desc    Get session by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).populate('mentor mentee', 'name email');

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    // Ensure only the mentor or mentee can access this session
    if (session.mentor.toString() !== req.user.id && session.mentee.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    res.json({ success: true, data: session });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// @route   DELETE /api/sessions/:id
// @desc    Delete a session
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    // Ensure only the mentor or mentee can delete the session
    if (session.mentor.toString() !== req.user.id && session.mentee.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    await session.deleteOne();
    res.json({ success: true, message: 'Session deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

module.exports = router;
