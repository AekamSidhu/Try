const express = require('express');
const router = express.Router();
const { protect} = require('../middleware/auth');
const User = require('../models/User');

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
});

// @route   PUT /api/users/update-profile
// @desc    Update user profile
// @access  Private
router.put('/update-profile', protect, async (req, res) => {
  const {
    name,
    bio,
    location,
    skills,
    interests,
    socialLinks,
    profilePicture,
  } = req.body;

  const profileFields = {};
  if (name) profileFields.name = name;
  if (bio) profileFields.bio = bio;
  if (location) profileFields.location = location;
  if (skills) profileFields.skills = skills;
  if (interests) profileFields.interests = interests;
  if (socialLinks) profileFields.socialLinks = socialLinks;
  if (profilePicture) profileFields.profilePicture = profilePicture;

  try {
    let user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: profileFields },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: user,
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