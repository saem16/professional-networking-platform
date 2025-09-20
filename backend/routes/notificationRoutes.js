import express from 'express';
import Notification from '../models/Notification.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import NotificationService from '../services/notificationService.js';
import mongoose from 'mongoose';

const router = express.Router();


router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const {
      page = 1,
      limit = 20,
      type = null,
      isRead = null,
      priority = null,
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 50),
      type: type || null,
      isRead: isRead !== null ? isRead === 'true' : null,
      priority: priority || null,
    };

    const notifications = await Notification.getUserNotifications(
      userId,
      options
    );

    const totalCount = await Notification.countDocuments({
      recipient: userId,
      ...(type && { type }),
      ...(isRead !== null && { isRead: isRead === 'true' }),
      ...(priority && { priority }),
    });

    const stats = await NotificationService.getNotificationStats(userId);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: options.page,
          limit: options.limit,
          total: totalCount,
          pages: Math.ceil(totalCount / options.limit),
          hasNext: options.page * options.limit < totalCount,
          hasPrev: options.page > 1,
        },
        stats,
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});


router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const stats = await NotificationService.getNotificationStats(userId);


    const typeBreakdown = await Notification.aggregate([
      {
        $match: {
          recipient: new mongoose.Types.ObjectId(userId),
          isRead: false,
        },
      },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        ...stats,
        typeBreakdown: typeBreakdown.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});


router.put('/mark-read', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { notificationIds } = req.body;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'notificationIds must be a non-empty array',
      });
    }

    const result = await Notification.markAsRead(notificationIds, userId);

    res.json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`,
      data: {
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error('Mark notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});


router.put('/mark-all-read', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const result = await Notification.markAllAsRead(userId);

    res.json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`,
      data: {
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});


router.delete('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { notificationIds } = req.body;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'notificationIds must be a non-empty array',
      });
    }

    const result = await Notification.deleteMany({
      _id: { $in: notificationIds },
      recipient: userId,
    });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} notifications`,
      data: {
        deletedCount: result.deletedCount,
      },
    });
  } catch (error) {
    console.error('Delete notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});


router.delete('/all', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const result = await Notification.deleteMany({ recipient: userId });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} notifications`,
      data: {
        deletedCount: result.deletedCount,
      },
    });
  } catch (error) {
    console.error('Delete all notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});


router.get('/preferences', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;


    const preferences = {
      email: {
        follow: true,
        connection_request: true,
        connection_accepted: true,
        post_like: false,
        post_comment: true,
        message: true,
      },
      push: {
        follow: true,
        connection_request: true,
        connection_accepted: true,
        post_like: false,
        post_comment: true,
        message: true,
      },
      inApp: {
        follow: true,
        connection_request: true,
        connection_accepted: true,
        post_like: true,
        post_comment: true,
        message: true,
        post_published: true,
      },
    };

    res.json({
      success: true,
      data: { preferences },
    });
  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});


router.put('/preferences', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { preferences } = req.body;


    console.log('Update preferences for user:', userId, preferences);

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: { preferences },
    });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});


router.post('/test', authMiddleware, async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Test endpoint not available in production',
      });
    }

    const userId = req.userId;
    const { type = 'follow' } = req.body;


    const testNotifications = {
      follow: {
        recipient: userId,

        type: 'follow',
        title: 'New Follower',
        message: 'Test User started following you',
        priority: 'medium',
      },
      connection_request: {
        recipient: userId,
        sender: userId,
        type: 'connection_request',
        title: 'Connection Request',
        message: 'Test User wants to connect with you',
        priority: 'high',
      },
      post_like: {
        recipient: userId,
        sender: userId,
        type: 'post_like',
        title: 'Post Liked',
        message: 'Test User liked your post',
        priority: 'low',
      },
    };

    const notificationData =
      testNotifications[type] || testNotifications.follow;
    const notification = await Notification.createNotification(
      notificationData
    );

    res.json({
      success: true,
      message: 'Test notification created',
      data: { notification },
    });
  } catch (error) {
    console.error('Create test notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;
