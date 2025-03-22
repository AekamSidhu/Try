const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Review = require('../models/Review');
const Session = require('../models/Session');
const MentorProfile = require('../models/MentorProfile');

// @route   POST /api/reviews
// @desc    Create a review for a mentor after a session
// @access  Private
router.post('/', protect, async (req, res) => {
  const { mentor, session, rating, text } = req.body;

  try {
    // Check if session exists and is completed
    const sessionData = await Session.findById(session);
    if (!sessionData) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    if (sessionData.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot review a session that is not completed',
      });
    }

    // Check if user is the mentee of the session
    if (sessionData.mentee.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to review this session',
      });
    }

    // Check if a review already exists for this session
    const existingReview = await Review.findOne({
      session,
      reviewedBy: req.user.id,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        error: 'Review already exists for this session',
      });
    }

    // Create review
    const review = await Review.create({
      mentor,
      reviewedBy: req.user.id,
      session,
      rating,
      text,
    });

    // Update mentor profile with new rating
    const mentorProfile = await MentorProfile.findOne({ user: mentor });
    if (mentorProfile) {
      const totalRatings = mentorProfile.totalReviews * mentorProfile.averageRating;
      const newTotalReviews = mentorProfile.totalReviews + 1;
      const newAverageRating = (totalRatings + rating) / newTotalReviews;

      await MentorProfile.findOneAndUpdate(
        { user: mentor },
        {
          totalReviews: newTotalReviews,
          averageRating: newAverageRating,
        },
        { new: true }
      );
    }

    res.status(201).json({
      success: true,
      data: review,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
});

// @route   GET /api/reviews/mentor/:mentorId
// @desc    Get all reviews for a mentor
// @access  Public
router.get('/mentor/:mentorId', async (req, res) => {
  try {
    const reviews = await Review.find({ mentor: req.params.mentorId })
      .populate({
        path: 'reviewedBy',
        select: 'name profilePicture',
      })
      .populate({
        path: 'session',
        select: 'title date',
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
});

module.exports = router;