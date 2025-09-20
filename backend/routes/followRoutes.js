import express from 'express';
import Follow from '../models/Follow.js';
import User from '../models/User.js';
import UserStats from '../models/UserStats.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { SocialHelpers } from '../utils/socialHelpers.js';
import NotificationService from '../services/notificationService.js';

const router = express.Router();

router.post('/toggle/:userId', authMiddleware, async (req, res) => {
  try {
    const followerId = req.userId;
    const followingId = req.params.userId;

    const [follower, following] = await Promise.all([
      User.findById(followerId).select('name username accountType'),
      User.findById(followingId).select('name username accountType'),
    ]);

    if (!follower || !following) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (followerId === followingId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself',
      });
    }

    const existingFollow = await Follow.findOne({
      follower: followerId,
      following: followingId,
      isActive: true,
    });

    let isFollowing = false;
    let action = '';

    if (existingFollow) {
      existingFollow.isActive = false;
      await existingFollow.save();

      await Promise.all([
        UserStats.findOneAndUpdate(
          { userId: followingId },
          { $inc: { followersCount: -1 } },
          { upsert: true }
        ),
        UserStats.findOneAndUpdate(
          { userId: followerId },
          { $inc: { followingCount: -1 } },
          { upsert: true }
        ),
      ]);

      action = 'unfollowed';
      isFollowing = false;
    } else {
      const inactiveFollow = await Follow.findOne({
        follower: followerId,
        following: followingId,
        isActive: false,
      });

      if (inactiveFollow) {
        inactiveFollow.isActive = true;
        inactiveFollow.followedAt = new Date();
        await inactiveFollow.save();
      } else {
        await Follow.create({
          follower: followerId,
          following: followingId,
          followedAt: new Date(),
          isActive: true,
          notificationsEnabled: true,
        });
      }

      await Promise.all([
        UserStats.findOneAndUpdate(
          { userId: followingId },
          { $inc: { followersCount: 1 } },
          { upsert: true }
        ),
        UserStats.findOneAndUpdate(
          { userId: followerId },
          { $inc: { followingCount: 1 } },
          { upsert: true }
        ),
      ]);

      action = 'followed';
      isFollowing = true;

      try {
        await NotificationService.createFollowNotification(
          followerId,
          followingId
        );
      } catch (notificationError) {
        console.error(
          'Failed to create follow notification:',
          notificationError
        );
      }
    }

    const [followerStats, followingStats] = await Promise.all([
      UserStats.findOne({ userId: followerId }),
      UserStats.findOne({ userId: followingId }),
    ]);

    res.json({
      success: true,
      message: `Successfully ${action} ${following.name}`,
      data: {
        isFollowing,
        action,
        follower: {
          id: follower._id,
          name: follower.name,
          username: follower.username,
          accountType: follower.accountType,
          stats: {
            followingCount: followerStats?.followingCount || 0,
          },
        },
        following: {
          id: following._id,
          name: following.name,
          username: following.username,
          accountType: following.accountType,
          stats: {
            followersCount: followingStats?.followersCount || 0,
          },
        },
      },
    });
  } catch (error) {
    console.error('Follow toggle error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

router.get('/status/:userId', authMiddleware, async (req, res) => {
  try {
    const followerId = req.userId;
    const followingId = req.params.userId;

    const [isFollowing, isFollowedBy, targetUser] = await Promise.all([
      SocialHelpers.isFollowing(followerId, followingId),
      SocialHelpers.isFollowing(followingId, followerId),
      User.findById(followingId).select('name username accountType'),
    ]);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: {
        isFollowing: !!isFollowing,
        isFollowedBy: !!isFollowedBy,
        isMutual: !!(isFollowing && isFollowedBy),
        targetUser: {
          id: targetUser._id,
          name: targetUser.name,
          username: targetUser.username,
          accountType: targetUser.accountType,
        },
      },
    });
  } catch (error) {
    console.error('Follow status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.get('/followers/:userId', authMiddleware, async (req, res) => {
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

    const followers = await Follow.getFollowers(userId, page, limit);
    const totalFollowers = await Follow.countDocuments({
      following: userId,
      isActive: true,
    });

    const followersWithStatus = await Promise.all(
      followers.map(async follow => {
        const isFollowingBack = await SocialHelpers.isFollowing(
          userId,
          follow.follower._id
        );
        return {
          id: follow.follower._id,
          name: follow.follower.name,
          username: follow.follower.username,
          profilePicture: follow.follower.profilePicture,
          accountType: follow.follower.accountType,
          followedAt: follow.followedAt,
          isFollowingBack: !!isFollowingBack,
        };
      })
    );

    res.json({
      success: true,
      data: {
        followers: followersWithStatus,
        pagination: {
          page,
          limit,
          total: totalFollowers,
          pages: Math.ceil(totalFollowers / limit),
          hasNext: page * limit < totalFollowers,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.get('/following/:userId', authMiddleware, async (req, res) => {
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

    const following = await Follow.getFollowing(userId, page, limit);
    const totalFollowing = await Follow.countDocuments({
      follower: userId,
      isActive: true,
    });

    const followingWithStatus = await Promise.all(
      following.map(async follow => {
        const isFollowingBack = await SocialHelpers.isFollowing(
          follow.following._id,
          userId
        );
        return {
          id: follow.following._id,
          name: follow.following.name,
          username: follow.following.username,
          profilePicture: follow.following.profilePicture,
          accountType: follow.following.accountType,
          followedAt: follow.followedAt,
          isFollowingBack: !!isFollowingBack,
        };
      })
    );

    res.json({
      success: true,
      data: {
        following: followingWithStatus,
        pagination: {
          page,
          limit,
          total: totalFollowing,
          pages: Math.ceil(totalFollowing / limit),
          hasNext: page * limit < totalFollowing,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.get('/suggestions', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const limit = parseInt(req.query.limit) || 10;

    const currentFollowing = await Follow.find({
      follower: userId,
      isActive: true,
    }).select('following');

    const followingIds = currentFollowing.map(f => f.following);
    followingIds.push(userId);

    const suggestions = await User.find({
      _id: { $nin: followingIds },
    })
      .select('name username profilePicture accountType headline bio')
      .limit(limit);

    const suggestionsWithReasons = suggestions.map(user => ({
      id: user._id,
      name: user.name,
      username: user.username,
      profilePicture: user.profilePicture,
      accountType: user.accountType,
      headline: user.headline,
      bio: user.bio,
      reasons: ['suggested_for_you'],
    }));

    res.json({
      success: true,
      data: {
        suggestions: suggestionsWithReasons,
      },
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.delete(
  '/remove-follower/:followerId',
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.userId;
      const followerId = req.params.followerId;

      const follow = await Follow.findOne({
        follower: followerId,
        following: userId,
        isActive: true,
      });

      if (!follow) {
        return res.status(404).json({
          success: false,
          message: 'Follower relationship not found',
        });
      }

      follow.isActive = false;
      await follow.save();

      await Promise.all([
        UserStats.findOneAndUpdate(
          { userId: userId },
          { $inc: { followersCount: -1 } },
          { upsert: true }
        ),
        UserStats.findOneAndUpdate(
          { userId: followerId },
          { $inc: { followingCount: -1 } },
          { upsert: true }
        ),
      ]);

      res.json({
        success: true,
        message: 'Follower removed successfully',
      });
    } catch (error) {
      console.error('Remove follower error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

export default router;