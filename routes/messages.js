const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

// @route   POST /api/messages
// @desc    Send a message
// @access  Private
router.post('/', protect, async (req, res) => {
  const { recipientId, text } = req.body;

  try {
    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        error: 'Recipient not found',
      });
    }

    // Find if conversation exists, otherwise create a new one
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, recipientId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, recipientId],
      });
    }

    // Create and save the message
    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user.id,
      recipient: recipientId,
      text,
    });

    // Update conversation with last message
    await Conversation.findByIdAndUpdate(conversation._id, {
      lastMessage: message._id,
    });

    // Populate sender info before sending response
    const populatedMessage = await Message.findById(message._id).populate({
      path: 'sender',
      select: 'name profilePicture',
    });

    res.status(201).json({
      success: true,
      data: populatedMessage,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
});

// @route   GET /api/messages/conversations
// @desc    Get all conversations for the current user
// @access  Private
router.get('/conversations', protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id,
    })
      .populate({
        path: 'participants',
        select: 'name profilePicture',
        match: { _id: { $ne: req.user.id } },
      })
      .populate({
        path: 'lastMessage',
        select: 'text createdAt',
      })
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      count: conversations.length,
      data: conversations,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
});

// @route   GET /api/messages/:conversationId
// @desc    Get messages in a conversation
// @access  Private
router.get('/:conversationId', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
    }

    // Check if user is part of this conversation
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this conversation',
      });
    }

    const messages = await Message.find({
      conversation: req.params.conversationId,
    })
      .populate({
        path: 'sender',
        select: 'name profilePicture',
      })
      .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      {
        conversation: req.params.conversationId,
        recipient: req.user.id,
        read: false,
      },
      { read: true }
    );

    res.json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
});

// @route   GET /api/messages/unread
// @desc    Get count of unread messages
// @access  Private
router.get('/unread/count', protect, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      recipient: req.user.id,
      read: false,
    });

    res.json({
      success: true,
      data: count,
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