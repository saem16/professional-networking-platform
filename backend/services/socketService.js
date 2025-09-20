import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';

const connectedUsers = new Map();
const userSockets = new Map();

export const initializeSocket = server => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async socket => {
    const userId = socket.userId;
    console.log(`User ${userId} connected with socket ${socket.id}`);

    connectedUsers.set(userId, socket.id);
    userSockets.set(socket.id, userId);

    try {
      const userConversations = await Conversation.find({
        participants: userId,
        isActive: true,
      }).select('_id');

      userConversations.forEach(conv => {
        socket.join(`conversation_${conv._id}`);
      });

      socket.broadcast.emit('userOnline', { userId });
    } catch (error) {
      console.error('Error joining conversations:', error);
    }

    socket.on('joinConversation', async data => {
      try {
        const { conversationId } = data;

        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId,
        });

        if (conversation) {
          socket.join(`conversation_${conversationId}`);
          socket.emit('joinedConversation', { conversationId });
        } else {
          socket.emit('error', {
            message: 'Not authorized to join this conversation',
          });
        }
      } catch (error) {
        console.error('Join conversation error:', error);
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    socket.on('leaveConversation', data => {
      const { conversationId } = data;
      socket.leave(`conversation_${conversationId}`);
      socket.emit('leftConversation', { conversationId });
    });

    socket.on('typing', data => {
      const { conversationId, isTyping } = data;
      socket.to(`conversation_${conversationId}`).emit('userTyping', {
        userId,
        userName: socket.user.name,
        conversationId,
        isTyping,
      });
    });

    socket.on('markMessageRead', async data => {
      try {
        const { messageId, conversationId } = data;

        socket.to(`conversation_${conversationId}`).emit('messageRead', {
          messageId,
          userId,
          userName: socket.user.name,
          readAt: new Date(),
        });
      } catch (error) {
        console.error('Mark message read error:', error);
      }
    });

    socket.on('sendMessage', async data => {
      try {
        const { conversationId, content, replyTo, attachments = [] } = data;

        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId,
        });

        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        const Message = (await import('../models/Message.js')).default;
        const messageData = {
          conversation: conversationId,
          sender: userId,
          content: content?.trim(),
          messageType: attachments.length > 0 ? 'image' : 'text',
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

        io.to(`conversation_${conversationId}`).emit('newMessage', {
          message,
          conversationId,
        });

        const offlineParticipants = conversation.participants.filter(
          participantId =>
            participantId.toString() !== userId &&
            !connectedUsers.has(participantId.toString())
        );

      } catch (error) {
        console.error('Send message via socket error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('addReaction', async data => {
      try {
        const { messageId, emoji } = data;

        const Message = (await import('../models/Message.js')).default;
        const message = await Message.findById(messageId);

        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        const existingReaction = message.reactions.find(
          r => r.user.toString() === userId && r.emoji === emoji
        );

        if (existingReaction) {
          message.reactions = message.reactions.filter(
            r => !(r.user.toString() === userId && r.emoji === emoji)
          );
        } else {
          message.reactions.push({
            user: userId,
            emoji,
          });
        }

        await message.save();

        io.to(`conversation_${message.conversation}`).emit('reactionUpdate', {
          messageId,
          reactions: message.reactions,
          userId,
          emoji,
          action: existingReaction ? 'remove' : 'add',
        });
      } catch (error) {
        console.error('Add reaction error:', error);
        socket.emit('error', { message: 'Failed to add reaction' });
      }
    });

    socket.on('updateStatus', data => {
      const { status } = data;
      socket.broadcast.emit('userStatusUpdate', {
        userId,
        status,
      });
    });

    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected`);

      connectedUsers.delete(userId);
      userSockets.delete(socket.id);

      socket.broadcast.emit('userOffline', { userId });
    });

    socket.on('error', error => {
      console.error('Socket error:', error);
    });
  });

  return io;
};

export const getConnectedUsers = () => {
  return Array.from(connectedUsers.keys());
};

export const isUserOnline = userId => {
  return connectedUsers.has(userId);
};

export const emitToUser = (io, userId, event, data) => {
  const socketId = connectedUsers.get(userId);
  if (socketId) {
    io.to(socketId).emit(event, data);
  }
};

export const emitToConversation = (io, conversationId, event, data) => {
  io.to(`conversation_${conversationId}`).emit(event, data);
};