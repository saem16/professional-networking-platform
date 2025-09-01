import express from 'express';
import Connection from '../models/Connection.js';
import User from '../models/User.js';
import UserStats from '../models/UserStats.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { SocialHelpers } from '../utils/socialHelpers.js';
import NotificationService from '../services/notificationService.js';

const router = express.Router();

router.post('/request/:userId', authMiddleware, async (req, res) => {
  try {
    const requesterId = req.userId;
    const recipientId = req.params.userId;
    const { message, connectionType = 'professional' } = req.body;

    const [requester, recipient] = await Promise.all([
      User.findById(requesterId).select('name username accountType'),
      User.findById(recipientId).select('name username accountType'),
    ]);

    if (!requester || !recipient) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (requesterId === recipientId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot connect with yourself',
      });
    }

    const existingConnection = await Connection.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId },
      ],
    });

    if (existingConnection) {
      let message = '';
      switch (existingConnection.status) {
        case 'accepted':
          message = 'You are already connected with this user';
          break;
        case 'pending':
          message =
            existingConnection.requester.toString() === requesterId
              ? 'Connection request already sent'
              : 'This user has already sent you a connection request';
          break;
        case 'declined':
          message = 'Connection request was previously declined';
          break;
      }

      return res.status(400).json({
        success: false,
        message,
        data: { existingConnection: existingConnection.status },
      });
    }

    const connectionRequest = await Connection.create({
      requester: requesterId,
      recipient: recipientId,
      message: message || '',
      connectionType,
      requestedAt: new Date(),
      status: 'pending',
    });

    await UserStats.findOneAndUpdate(
      { userId: recipientId },
      { $inc: { pendingConnectionsCount: 1 } },
      { upsert: true }
    );

    const populatedRequest = await Connection.findById(connectionRequest._id)
      .populate('requester', 'name username profilePicture accountType')
      .populate('recipient', 'name username profilePicture accountType');
    
    await NotificationService.createConnectionRequestNotification(
      requesterId,
      recipientId,
      message
    );

    res.status(201).json({
      success: true,
      message: `Connection request sent to ${recipient.name}`,
      data: {
        request: populatedRequest,
      },
    });

  } catch (error) {
    console.error('Send connection request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

router.put('/respond/:requestId', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const requestId = req.params.requestId;
    const { action } = req.body;

    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "accept" or "decline"',
      });
    }

    const connectionRequest = await Connection.findById(requestId)
      .populate('requester', 'name username profilePicture')
      .populate('recipient', 'name username profilePicture');

    if (!connectionRequest) {
      return res.status(404).json({
        success: false,
        message: 'Connection request not found',
      });
    }

    if (connectionRequest.recipient._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only respond to requests sent to you',
      });
    }

    if (connectionRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been responded to',
      });
    }

    connectionRequest.status = action === 'accept' ? 'accepted' : 'declined';
    connectionRequest.respondedAt = new Date();
    await connectionRequest.save();

    if (action === 'accept') {
      await Promise.all([
        UserStats.findOneAndUpdate(
          { userId: connectionRequest.requester._id },
          { $inc: { connectionsCount: 1 } },
          { upsert: true }
        ),
        UserStats.findOneAndUpdate(
          { userId: connectionRequest.recipient._id },
          { $inc: { connectionsCount: 1, pendingConnectionsCount: -1 } },
          { upsert: true }
        ),
      ]);
    } else {
      await UserStats.findOneAndUpdate(
        { userId: connectionRequest.recipient._id },
        { $inc: { pendingConnectionsCount: -1 } },
        { upsert: true }
      );
    }

    if (action === 'accept') {
      await NotificationService.createConnectionAcceptedNotification(
        connectionRequest.recipient._id,
        connectionRequest.requester._id
      );
    }

    res.json({
      success: true,
      message: `Connection request ${action}ed`,
      data: {
        request: connectionRequest,
        action,
      },
    });

  } catch (error) {
    console.error('Respond to connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.get('/status/:userId', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.userId;
    const targetUserId = req.params.userId;

    const [connection, targetUser] = await Promise.all([
      Connection.findOne({
        $or: [
          { requester: currentUserId, recipient: targetUserId },
          { requester: targetUserId, recipient: currentUserId },
        ],
      }),
      User.findById(targetUserId).select('name username accountType'),
    ]);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    let status = 'none';
    let canRequest = true;
    let connectionData = null;

    if (connection) {
      status = connection.status;
      canRequest = false;
      connectionData = {
        id: connection._id,
        requester: connection.requester.toString(),
        recipient: connection.recipient.toString(),
        status: connection.status,
        requestedAt: connection.requestedAt,
        respondedAt: connection.respondedAt,
        isRequester: connection.requester.toString() === currentUserId,
      };
    }

    res.json({
      success: true,
      data: {
        status,
        canRequest,
        connection: connectionData,
        targetUser: {
          id: targetUser._id,
          name: targetUser.name,
          username: targetUser.username,
          accountType: targetUser.accountType,
        },
      },
    });
  } catch (error) {
    console.error('Get connection status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.delete('/withdraw/:requestId', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const requestId = req.params.requestId;

    const connectionRequest = await Connection.findById(requestId);

    if (!connectionRequest) {
      return res.status(404).json({
        success: false,
        message: 'Connection request not found',
      });
    }

    if (connectionRequest.requester.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only withdraw requests you sent',
      });
    }

    if (connectionRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been responded to',
      });
    }

    await Connection.findByIdAndDelete(requestId);

    await UserStats.findOneAndUpdate(
      { userId: connectionRequest.recipient },
      { $inc: { pendingConnectionsCount: -1 } },
      { upsert: true }
    );

    res.json({
      success: true,
      message: 'Connection request withdrawn',
    });
  } catch (error) {
    console.error('Withdraw connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.delete('/remove/:connectionId', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const connectionId = req.params.connectionId;

    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection not found',
      });
    }

    const isRequester = connection.requester.toString() === userId;
    const isRecipient = connection.recipient.toString() === userId;

    if (!isRequester && !isRecipient) {
      return res.status(403).json({
        success: false,
        message: 'You can only remove your own connections',
      });
    }

    if (connection.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Connection is not active',
      });
    }

    await Connection.findByIdAndDelete(connectionId);

    await Promise.all([
      UserStats.findOneAndUpdate(
        { userId: connection.requester },
        { $inc: { connectionsCount: -1 } },
        { upsert: true }
      ),
      UserStats.findOneAndUpdate(
        { userId: connection.recipient },
        { $inc: { connectionsCount: -1 } },
        { upsert: true }
      ),
    ]);

    res.json({
      success: true,
      message: 'Connection removed successfully',
    });
  } catch (error) {
    console.error('Remove connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;