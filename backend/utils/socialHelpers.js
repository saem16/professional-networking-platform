import Follow from '../models/Follow.js';
import Connection from '../models/Connection.js';
import UserStats from '../models/UserStats.js';

export const SocialHelpers = {
  async isFollowing(followerId, followingId) {
    return await Follow.findOne({
      follower: followerId,
      following: followingId,
      isActive: true,
    });
  },

  async areConnected(userId1, userId2) {
    return await Connection.findOne({
      $or: [
        { requester: userId1, recipient: userId2, status: 'accepted' },
        { requester: userId2, recipient: userId1, status: 'accepted' },
      ],
    });
  },

  async getMutualConnections(userId1, userId2) {
    const user1Connections = await Connection.find({
      $or: [
        { requester: userId1, status: 'accepted' },
        { recipient: userId1, status: 'accepted' },
      ],
    }).select('requester recipient');

    const user2Connections = await Connection.find({
      $or: [
        { requester: userId2, status: 'accepted' },
        { recipient: userId2, status: 'accepted' },
      ],
    }).select('requester recipient');

    const user1ConnIds = new Set();
    user1Connections.forEach(conn => {
      user1ConnIds.add(
        conn.requester.toString() === userId1
          ? conn.recipient.toString()
          : conn.requester.toString()
      );
    });

    const mutuals = [];
    user2Connections.forEach(conn => {
      const connId =
        conn.requester.toString() === userId2
          ? conn.recipient.toString()
          : conn.requester.toString();
      if (user1ConnIds.has(connId)) {
        mutuals.push(connId);
      }
    });

    return mutuals;
  },

  async updateUserStats(userId) {
    const [followersCount, followingCount, connectionsCount] =
      await Promise.all([
        Follow.countDocuments({ following: userId, isActive: true }),
        Follow.countDocuments({ follower: userId, isActive: true }),
        Connection.countDocuments({
          $or: [
            { requester: userId, status: 'accepted' },
            { recipient: userId, status: 'accepted' },
          ],
        }),
      ]);

    return await UserStats.findOneAndUpdate(
      { userId },
      {
        followersCount,
        followingCount,
        connectionsCount,
        lastActiveAt: new Date(),
      },
      { upsert: true, new: true }
    );
  },
};
