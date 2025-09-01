import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const upload = multer({ dest: 'uploads/messages/' });

const getDirectConversationName = (participants, userId) => {
  const otherUser = participants.find(
    p => p._id.toString() !== userId.toString()
  );
  return otherUser ? otherUser.name : 'Unknown User';
};

const getDirectConversationAvatar = (participants, userId) => {
  const otherUser = participants.find(
    p => p._id.toString() !== userId.toString()
  );
  return otherUser ? otherUser.profilePicture : '';
};

router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20 } = req.query;

    const conversations = await Conversation.getUserConversations(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
    });

    const formattedConversations = conversations.map(conv => ({
      id: conv._id,
      name: conv.isGroup
        ? conv.name
        : getDirectConversationName(conv.participants, userId),
      description: conv.description,
      avatar: conv.isGroup
        ? conv.avatar
        : getDirectConversationAvatar(conv.participants, userId),
      isGroup: conv.isGroup,
      admin: conv.admin,
      participants: conv.participants,
      lastMessage: conv.lastMessage
        ? {
            content: conv.lastMessage.content,
            sender: conv.lastMessage.sender,
            createdAt: conv.lastMessage.createdAt,
            messageType: conv.lastMessage.messageType,
          }
        : null,
      unreadCount:
        conv.unreadCount?.find(uc => uc.user.toString() === userId)?.count || 0,
      lastActivity: conv.lastActivity,
    }));

    res.json({
      success: true,
      data: formattedConversations,
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.post('/conversations/direct', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID is required',
      });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found',
      });
    }

    const conversation = await Conversation.findOrCreateDirect(
      userId,
      recipientId
    );

    await conversation.populate('participants', 'name username profilePicture');

    const formattedConversation = {
      id: conversation._id,
      name: getDirectConversationName(conversation.participants, userId),
      avatar: getDirectConversationAvatar(conversation.participants, userId),
      isGroup: false,
      participants: conversation.participants,
      lastMessage: conversation.lastMessage,
      unreadCount: conversation.getUnreadCount(userId),
      lastActivity: conversation.lastActivity,
    };

    res.json({
      success: true,
      data: formattedConversation,
    });
  } catch (error) {
    console.error('Create direct conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.post('/conversations/group', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { name, description, participantIds } = req.body;

    if (!name || !participantIds || participantIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Group name and at least one participant are required',
      });
    }

    const allParticipants = [...new Set([userId, ...participantIds])];

    const users = await User.find({ _id: { $in: allParticipants } });
    if (users.length !== allParticipants.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more participants not found',
      });
    }

    const conversation = await Conversation.create({
      name: name.trim(),
      description: description?.trim(),
      isGroup: true,
      participants: allParticipants,
      admin: userId,
    });

    await conversation.populate('participants', 'name username profilePicture');

    const systemMessage = new Message({
      conversation: conversation._id,
      sender: userId,
      content: 'Group created',
      messageType: 'system',
    });
    await systemMessage.save();

    conversation.lastMessage = systemMessage._id;
    conversation.lastActivity = new Date();
    await conversation.save();

    const formattedConversation = {
      id: conversation._id,
      name: conversation.name,
      description: conversation.description,
      avatar: conversation.avatar,
      isGroup: true,
      admin: conversation.admin,
      participants: conversation.participants,
      lastMessage: {
        content: systemMessage.content,
        sender: systemMessage.sender,
        createdAt: systemMessage.createdAt,
        messageType: systemMessage.messageType,
      },
      unreadCount: 0,
      lastActivity: conversation.lastActivity,
    };

    allParticipants.forEach(participantId => {
      req.app.get('io').to(`user_${participantId}`).emit('newConversation', {
        conversation: formattedConversation,
      });
    });

    res.json({
      success: true,
      data: formattedConversation,
    });
  } catch (error) {
    console.error('Create group conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.get(
  '/conversations/:conversationId/messages',
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.userId;
      const { conversationId } = req.params;
      const { page = 1, limit = 50, before = null } = req.query;

      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found',
        });
      }

      const messages = await Message.getConversationMessages(conversationId, {
        page: parseInt(page),
        limit: parseInt(limit),
        before: before ? new Date(before) : null,
      });

      await Message.updateMany(
        {
          conversation: conversationId,
          sender: { $ne: userId },
          'readBy.user': { $ne: userId },
        },
        {
          $push: {
            readBy: {
              user: userId,
              readAt: new Date(),
            },
          },
        }
      );

      await Conversation.resetUnreadCount(conversationId, userId);

      res.json({
        success: true,
        data: messages.reverse(),
      });
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

router.post('/conversations/:conversationId/messages', authMiddleware, async (req, res) => {
    try {
      const userId = req.userId;
      const { conversationId } = req.params;
      const { content, replyTo } = req.body;

      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found',
        });
      }

      if (
        (!content || content.trim() === '') &&
        (!attachments || attachments.length === 0)
      ) {
        return res.status(400).json({
          success: false,
          message: 'Message content or attachment is required',
        });
      }

      const attachments = req.body.attachments || [];

      let messageType = 'text';
      if (attachments.length > 0) {
        if (attachments[0].mimeType.startsWith('image/')) {
          messageType = 'image';
        } else {
          messageType = 'file';
        }
      }

      const messageData = {
        conversation: conversationId,
        sender: userId,
        content: content?.trim(),
        messageType,
        attachments,
      };

      if (replyTo) {
        messageData.replyTo = replyTo;
      }

      const message = new Message(messageData);
      await message.save();

      await message.populate('sender', 'name username profilePicture');
      if (replyTo) {
        await message.populate('replyTo', 'content sender createdAt');
        await message.populate('replyTo.sender', 'name username');
      }

      conversation.lastMessage = message._id;
      conversation.lastActivity = new Date();
      await conversation.incrementUnreadCount(userId);
      await conversation.save();

      req.app
        .get('io')
        .to(`conversation_${conversationId}`)
        .emit('newMessage', {
          message,
          conversationId,
        });

      res.json({
        success: true,
        data: message,
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

router.delete(
  '/conversations/:conversationId',
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.userId;
      const { conversationId } = req.params;

      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found',
        });
      }

      if (conversation.isGroup && conversation.admin.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Only group admin can delete the conversation',
        });
      }

      await Message.deleteMany({ conversation: conversationId });

      await Conversation.findByIdAndDelete(conversationId);

      req.app
        .get('io')
        .to(`conversation_${conversationId}`)
        .emit('conversationDeleted', {
          conversationId,
        });

      res.json({
        success: true,
        message: 'Conversation deleted successfully',
      });
    } catch (error) {
      console.error('Delete conversation error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

router.put(
  '/conversations/:conversationId',
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.userId;
      const { conversationId } = req.params;
      const { name, description } = req.body;

      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
        isGroup: true,
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Group conversation not found',
        });
      }

      if (conversation.admin.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Only admin can update group details',
        });
      }

      if (name && name.trim()) {
        conversation.name = name.trim();
      }
      if (description !== undefined) {
        conversation.description = description.trim();
      }

      await conversation.save();

      const systemMessage = new Message({
        conversation: conversationId,
        sender: userId,
        content: 'Group details updated',
        messageType: 'system',
      });
      await systemMessage.save();

      req.app
        .get('io')
        .to(`conversation_${conversationId}`)
        .emit('groupUpdated', {
          conversationId,
          name: conversation.name,
          description: conversation.description,
          message: systemMessage,
        });

      res.json({
        success: true,
        data: {
          id: conversation._id,
          name: conversation.name,
          description: conversation.description,
        },
      });
    } catch (error) {
      console.error('Update group error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

router.post(
  '/conversations/:conversationId/participants',
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.userId;
      const { conversationId } = req.params;
      const { userIds } = req.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'User IDs array is required',
        });
      }

      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
        isGroup: true,
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Group conversation not found',
        });
      }

      if (conversation.admin.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Only admin can add participants',
        });
      }

      const users = await User.find({ _id: { $in: userIds } });
      if (users.length !== userIds.length) {
        return res.status(404).json({
          success: false,
          message: 'One or more users not found',
        });
      }

      const currentParticipants = conversation.participants.map(p =>
        p.toString()
      );
      const newParticipants = userIds.filter(
        id => !currentParticipants.includes(id)
      );

      if (newParticipants.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'All users are already participants',
        });
      }

      conversation.participants = [
        ...conversation.participants,
        ...newParticipants,
      ];
      await conversation.save();

      const currentUser = await User.findById(userId).select('name');
      const addedUsers = await User.find({
        _id: { $in: newParticipants },
      }).select('name');
      const addedUserNames = addedUsers.map(u => u.name).join(', ');

      const systemMessage = new Message({
        conversation: conversationId,
        sender: userId,
        content: `${currentUser.name} added ${addedUserNames} to the group`,
        messageType: 'system',
      });
      await systemMessage.save();

      req.app
        .get('io')
        .to(`conversation_${conversationId}`)
        .emit('participantsAdded', {
          conversationId,
          addedUsers: newParticipants,
          message: systemMessage,
        });

      newParticipants.forEach(participantId => {
        req.app.get('io').to(`user_${participantId}`).emit('addedToGroup', {
          conversationId,
          conversationName: conversation.name,
        });
      });

      res.json({
        success: true,
        message: 'Participants added successfully',
      });
    } catch (error) {
      console.error('Add participants error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

router.delete(
  '/conversations/:conversationId/participants/:participantId',
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.userId;
      const { conversationId, participantId } = req.params;

      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
        isGroup: true,
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Group conversation not found',
        });
      }

      if (conversation.admin.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Only admin can remove participants',
        });
      }

      if (participantId === userId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot remove yourself as admin',
        });
      }

      if (!conversation.participants.includes(participantId)) {
        return res.status(404).json({
          success: false,
          message: 'Participant not found in conversation',
        });
      }

      conversation.participants = conversation.participants.filter(
        p => p.toString() !== participantId
      );
      await conversation.save();

      const currentUser = await User.findById(userId).select('name');
      const removedUser = await User.findById(participantId).select('name');

      const systemMessage = new Message({
        conversation: conversationId,
        sender: userId,
        content: `${currentUser.name} removed ${removedUser.name} from the group`,
        messageType: 'system',
      });
      await systemMessage.save();

      req.app
        .get('io')
        .to(`conversation_${conversationId}`)
        .emit('participantRemoved', {
          conversationId,
          removedUserId: participantId,
          message: systemMessage,
        });

      req.app.get('io').to(`user_${participantId}`).emit('removedFromGroup', {
        conversationId,
        conversationName: conversation.name,
      });

      res.json({
        success: true,
        message: 'Participant removed successfully',
      });
    } catch (error) {
      console.error('Remove participant error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

router.delete(
  '/conversations/:conversationId/leave',
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.userId;
      const { conversationId } = req.params;

      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
        isGroup: true,
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Group conversation not found',
        });
      }

      conversation.participants = conversation.participants.filter(
        p => p.toString() !== userId
      );

      if (
        conversation.admin.toString() === userId &&
        conversation.participants.length > 0
      ) {
        conversation.admin = conversation.participants[0];
      }

      if (conversation.participants.length === 0) {
        await Message.deleteMany({ conversation: conversationId });
        await Conversation.findByIdAndDelete(conversationId);
      } else {
        await conversation.save();
      }

      const user = await User.findById(userId).select('name');
      const systemMessage = new Message({
        conversation: conversationId,
        sender: userId,
        content: `${user.name} left the group`,
        messageType: 'system',
      });
      await systemMessage.save();

      req.app
        .get('io')
        .to(`conversation_${conversationId}`)
        .emit('participantLeft', {
          conversationId,
          userId,
          message: systemMessage,
          newAdmin:
            conversation.participants.length > 0 ? conversation.admin : null,
        });

      res.json({
        success: true,
        message: 'Left group successfully',
      });
    } catch (error) {
      console.error('Leave group error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

router.get('/users/search', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters',
      });
    }

    const users = await User.find({
      $and: [
        { _id: { $ne: userId } },
        {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { username: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } },
          ],
        },
      ],
    })
      .select('name username email profilePicture')
      .limit(10);

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.post(
  '/messages/:messageId/reactions',
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.userId;
      const { messageId } = req.params;
      const { emoji } = req.body;

      if (!emoji) {
        return res.status(400).json({
          success: false,
          message: 'Emoji is required',
        });
      }

      const message = await Message.findById(messageId);
      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found',
        });
      }

      const conversation = await Conversation.findOne({
        _id: message.conversation,
        participants: userId,
      });

      if (!conversation) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to react to this message',
        });
      }

      const existingReactionIndex = message.reactions.findIndex(
        r => r.user.toString() === userId && r.emoji === emoji
      );

      if (existingReactionIndex !== -1) {
        message.reactions.splice(existingReactionIndex, 1);
      } else {
        message.reactions.push({
          user: userId,
          emoji,
        });
      }

      await message.save();

      req.app
        .get('io')
        .to(`conversation_${message.conversation}`)
        .emit('reactionUpdate', {
          messageId,
          reactions: message.reactions,
        });

      res.json({
        success: true,
        data: message.reactions,
      });
    } catch (error) {
      console.error('React to message error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

router.delete('/messages/:messageId', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    if (message.sender.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message',
      });
    }

    message.isDeleted = true;
    message.content = 'This message was deleted';
    message.attachments = [];
    await message.save();

    req.app
      .get('io')
      .to(`conversation_${message.conversation}`)
      .emit('messageDeleted', {
        messageId,
        updatedMessage: message,
      });

    res.json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.put('/messages/:messageId', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message content is required',
      });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    if (message.sender.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this message',
      });
    }

    message.content = content.trim();
    message.editedAt = new Date();
    await message.save();

    req.app
      .get('io')
      .to(`conversation_${message.conversation}`)
      .emit('messageEdited', {
        messageId,
        updatedMessage: message,
      });

    res.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;