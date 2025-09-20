import express from 'express';
import User from '../models/User.js';
import Follow from '../models/Follow.js';
import Connection from '../models/Connection.js';
import UserStats from '../models/UserStats.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { SocialHelpers } from '../utils/socialHelpers.js';

const router = express.Router();


router.get('/stats/:userId', authMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId;
    const currentUserId = req.userId;


    const user = await User.findById(userId).select(
      'name username accountType'
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }


    const [followersCount, followingCount, connectionsCount, postsCount] =
      await Promise.all([
        Follow.countDocuments({ following: userId, isActive: true }),
        Follow.countDocuments({ follower: userId, isActive: true }),
        Connection.countDocuments({
          $or: [
            { requester: userId, status: 'accepted' },
            { recipient: userId, status: 'accepted' },
          ],
        }),


        0,
      ]);


    let relationshipStatus = null;
    if (currentUserId !== userId) {
      const [isFollowing, isFollowedBy, areConnected, pendingConnection] =
        await Promise.all([
          SocialHelpers.isFollowing(currentUserId, userId),
          SocialHelpers.isFollowing(userId, currentUserId),
          SocialHelpers.areConnected(currentUserId, userId),
          Connection.findOne({
            $or: [
              {
                requester: currentUserId,
                recipient: userId,
                status: 'pending',
              },
              {
                requester: userId,
                recipient: currentUserId,
                status: 'pending',
              },
            ],
          }),
        ]);

      relationshipStatus = {
        isFollowing: !!isFollowing,
        isFollowedBy: !!isFollowedBy,
        isMutual: !!(isFollowing && isFollowedBy),
        areConnected: !!areConnected,
        pendingConnection: pendingConnection
          ? {
              id: pendingConnection._id,
              requester: pendingConnection.requester.toString(),
              recipient: pendingConnection.recipient.toString(),
              isRequester:
                pendingConnection.requester.toString() === currentUserId,
            }
          : null,
      };
    }


    await UserStats.findOneAndUpdate(
      { userId },
      {
        followersCount,
        followingCount,
        connectionsCount,
        lastActiveAt: new Date(),
      },
      { upsert: true }
    );

    res.json({
      success: true,
      data: {
        userId,
        user: {
          id: user._id,
          name: user.name,
          username: user.username,
          accountType: user.accountType,
        },
        stats: {
          followersCount,
          followingCount,
          connectionsCount,
          postsCount,
        },
        relationshipStatus,
      },
    });
  } catch (error) {
    console.error('Get social stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});


router.get('/connections/:userId', authMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const user = await User.findById(userId).select(
      'name username accountType'
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const connections = await Connection.getConnections(userId, page, limit);
    const totalConnections = await Connection.countDocuments({
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' },
      ],
    });


    const connectionsData = connections.map(connection => {
      const isRequester = connection.requester._id.toString() === userId;
      const connectedUser = isRequester
        ? connection.recipient
        : connection.requester;

      return {
        id: connection._id,
        user: {
          id: connectedUser._id,
          name: connectedUser.name,
          username: connectedUser.username,
          profilePicture: connectedUser.profilePicture,
        },
        connectedAt: connection.respondedAt || connection.requestedAt,
        connectionType: connection.connectionType,
      };
    });

    res.json({
      success: true,
      data: {
        connections: connectionsData,
        pagination: {
          page,
          limit,
          total: totalConnections,
          pages: Math.ceil(totalConnections / limit),
          hasNext: page * limit < totalConnections,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});


router.get('/mutual-connections/:userId', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.userId;
    const targetUserId = req.params.userId;

    if (currentUserId === targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot get mutual connections with yourself',
      });
    }

    const mutualConnectionIds = await SocialHelpers.getMutualConnections(
      currentUserId,
      targetUserId
    );

    const mutualConnections = await User.find({
      _id: { $in: mutualConnectionIds },
    }).select('name username profilePicture headline');

    res.json({
      success: true,
      data: {
        count: mutualConnections.length,
        connections: mutualConnections,
      },
    });
  } catch (error) {
    console.error('Get mutual connections error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});


router.get('/pending-requests', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    const pendingRequests = await Connection.getPendingRequests(userId);

    const requestsData = pendingRequests.map(request => ({
      id: request._id,
      requester: {
        id: request.requester._id,
        name: request.requester.name,
        username: request.requester.username,
        profilePicture: request.requester.profilePicture,
        headline: request.requester.headline,
      },
      message: request.message,
      requestedAt: request.requestedAt,
      connectionType: request.connectionType,
    }));

    res.json({
      success: true,
      data: {
        requests: requestsData,
        count: requestsData.length,
      },
    });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});


router.post('/update-all-stats', authMiddleware, async (req, res) => {
  try {

    const users = await User.find({}).select('_id');

    const updatePromises = users.map(user =>
      SocialHelpers.updateUserStats(user._id.toString())
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: `Updated stats for ${users.length} users`,
      data: {
        updatedCount: users.length,
      },
    });
  } catch (error) {
    console.error('Bulk update stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;
