const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const MentorProfile = require('../models/MentorProfile');
const User = require('../models/User');

// @route   GET /api/mentors
// @desc    Get all mentors
// @access  Public
router.get('/', async (req, res) => {
  try {
    const mentors = await User.find({ role: 'mentor' }).select('-password');
    res.json({
      success: true,
      count: mentors.length,
      data: mentors,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
});

// @route   GET /api/mentors/profiles
// @desc    Get all mentor profiles
// @access  Public
router.get('/profiles', async (req, res) => {
  try {
    const mentorProfiles = await MentorProfile.find().populate({
      path: 'user',
      select: 'name email profilePicture',
    });

    res.json({
      success: true,
      count: mentorProfiles.length,
      data: mentorProfiles,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
});

// @route   GET /api/mentors/profile/:id
// @desc    Get mentor profile by user ID
// @access  Public
router.get('/profile/:userId', async (req, res) => {
  try {
    const mentorProfile = await MentorProfile.findOne({
      user: req.params.userId,
    }).populate({
      path: 'user',
      select: 'name email profilePicture bio location skills interests socialLinks',
    });

    if (!mentorProfile) {
      return res.status(404).json({
        success: false,
        error: 'Mentor profile not found',
      });
    }

    res.json({
      success: true,
      data: mentorProfile,
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: 'Mentor profile not found',
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
});

// @route   POST /api/mentors/profile
// @desc    Create or update mentor profile
// @access  Private (only for mentors)
router.post(
  '/profile',
  protect,
  authorize('mentor'),
  async (req, res) => {
    const {
      title,
      expertise,
      experience,
      hourlyRate,
      availability,
      education,
      workExperience,
    } = req.body;

    // Build profile object
    const profileFields = {
      user: req.user.id,
    };
    if (title) profileFields.title = title;
    if (expertise) profileFields.expertise = expertise;
    if (experience) profileFields.experience = experience;
    if (hourlyRate) profileFields.hourlyRate = hourlyRate;
    if (availability) profileFields.availability = availability;
    if (education) profileFields.education = education;
    if (workExperience) profileFields.workExperience = workExperience;

    try {
      // Check if profile exists
      let mentorProfile = await MentorProfile.findOne({ user: req.user.id });

      if (mentorProfile) {
        // Update
        mentorProfile = await MentorProfile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true, runValidators: true }
        );

        return res.json({
          success: true,
          data: mentorProfile,
        });
      }

      // Create
      mentorProfile = await MentorProfile.create(profileFields);

      res.status(201).json({
        success: true,
        data: mentorProfile,
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({
        success: false,
        error: 'Server Error',
      });
    }
  }
);

// @route   GET /api/mentors/search
// @desc    Search mentors by expertise, skills, etc.
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { expertise, skills, location, maxRate } = req.query;
    
    let query = {};
    
    if (expertise) {
      query.expertise = { $in: expertise.split(',') };
    }

    let mentorProfiles = await MentorProfile.find(query).populate({
      path: 'user',
      select: 'name email profilePicture bio location skills',
    });

    // Filter by user skills and location if provided
    if (skills || location || maxRate) {
      mentorProfiles = mentorProfiles.filter((profile) => {
        let match = true;
        
        if (skills) {
          const skillsArray = skills.split(',');
          match = match && profile.user.skills.some(skill => 
            skillsArray.includes(skill)
          );
        }
        
        if (location && profile.user.location) {
          match = match && profile.user.location.toLowerCase().includes(
            location.toLowerCase()
          );
        }
        
        if (maxRate) {
          match = match && profile.hourlyRate <= parseFloat(maxRate);
        }
        
        return match;
      });
    }

    res.json({
      success: true,
      count: mentorProfiles.length,
      data: mentorProfiles,
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