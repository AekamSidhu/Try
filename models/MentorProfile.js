const mongoose = require('mongoose');

const MentorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please add a professional title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    expertise: {
      type: [String],
      required: [true, 'Please add areas of expertise'],
    },
    experience: {
      type: String,
      required: [true, 'Please add years of experience'],
    },
    hourlyRate: {
      type: Number,
      required: [true, 'Please add hourly rate'],
    },
    availability: {
      type: [
        {
          day: {
            type: String,
            enum: [
              'Monday',
              'Tuesday',
              'Wednesday',
              'Thursday',
              'Friday',
              'Saturday',
              'Sunday',
            ],
          },
          slots: [
            {
              startTime: String,
              endTime: String,
            },
          ],
        },
      ],
      required: [true, 'Please add availability'],
    },
    education: [
      {
        institution: String,
        degree: String,
        fieldOfStudy: String,
        from: Date,
        to: Date,
        current: Boolean,
        description: String,
      },
    ],
    workExperience: [
      {
        company: String,
        position: String,
        from: Date,
        to: Date,
        current: Boolean,
        description: String,
      },
    ],
    averageRating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot be more than 5'],
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model('MentorProfile', MentorProfileSchema);