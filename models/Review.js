const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'Please add a rating between 1 and 5'],
    },
    text: {
      type: String,
      required: [true, 'Please add review text'],
      maxlength: [500, 'Review cannot be more than 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Prevent user from submitting more than one review per session
ReviewSchema.index({ reviewedBy: 1, session: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);