import Notification from '../models/Notification.js';
import User from '../models/User.js';

export class NotificationService {
  static async createFollowNotification(followerId, followedId) {
    try {
      const [follower, followed] = await Promise.all([
        User.findById(followerId).select('name username profilePicture'),
        User.findById(followedId).select('name username'),
      ]);

      if (!follower || !followed) return null;

      return await Notification.createNotification({
        recipient: followedId,
        sender: followerId,
        type: 'follow',
        title: 'New Follower',
        message: `${follower.name} started following you`,
        batchKey: `follow_${followedId}`,
        metadata: {
          actionUrl: `/profile/${follower.username}`,
        },
        priority: 'medium',
      });
    } catch (error) {
      console.error('Error creating follow notification:', error);
    }
  }

  static async createConnectionRequestNotification(
    requesterId,
    recipientId,
    message = ''
  ) {
    try {
      const [requester, recipient] = await Promise.all([
        User.findById(requesterId).select('name username profilePicture'),
        User.findById(recipientId).select('name username'),
      ]);

      if (!requester || !recipient) return null;

      return await Notification.createNotification({
        recipient: recipientId,
        sender: requesterId,
        type: 'connection_request',
        title: 'Connection Request',
        message: `${requester.name} wants to connect with you`,
        metadata: {
          connectionMessage: message,
          actionUrl: `/connections/requests`,
        },
        priority: 'high',
      });
    } catch (error) {
      console.error('Error creating connection request notification:', error);
    }
  }

  static async createConnectionAcceptedNotification(accepterId, requesterId) {
    try {
      const [accepter, requester] = await Promise.all([
        User.findById(accepterId).select('name username profilePicture'),
        User.findById(requesterId).select('name username'),
      ]);

      if (!accepter || !requester) return null;

      return await Notification.createNotification({
        recipient: requesterId,
        sender: accepterId,
        type: 'connection_accepted',
        title: 'Connection Accepted',
        message: `${accepter.name} accepted your connection request`,
        metadata: {
          actionUrl: `/profile/${accepter.username}`,
        },
        priority: 'high',
      });
    } catch (error) {
      console.error('Error creating connection accepted notification:', error);
    }
  }

  static async createPostLikeNotification(
    likerId,
    postAuthorId,
    postId,
    postTitle = ''
  ) {
    try {
      if (likerId === postAuthorId) return null;

      const liker = await User.findById(likerId).select(
        'name username profilePicture'
      );
      if (!liker) return null;

      return await Notification.createNotification({
        recipient: postAuthorId,
        sender: likerId,
        type: 'post_like',
        title: 'Post Liked',
        message: `${liker.name} liked your post`,
        relatedEntity: {
          entityType: 'Post',
          entityId: postId,
        },
        batchKey: `post_like_${postId}`,
        metadata: {
          postTitle: postTitle.substring(0, 50),
          likeType: 'post',
          actionUrl: `/posts/${postId}`,
        },
        priority: 'low',
      });
    } catch (error) {
      console.error('Error creating post like notification:', error);
    }
  }

  static async createPostCommentNotification(
    commenterId,
    postAuthorId,
    postId,
    commentText,
    postTitle = ''
  ) {
    try {
      if (commenterId === postAuthorId) return null;

      const commenter = await User.findById(commenterId).select(
        'name username profilePicture'
      );
      if (!commenter) return null;

      return await Notification.createNotification({
        recipient: postAuthorId,
        sender: commenterId,
        type: 'post_comment',
        title: 'New Comment',
        message: `${commenter.name} commented on your post`,
        relatedEntity: {
          entityType: 'Post',
          entityId: postId,
        },
        batchKey: `post_comment_${postId}`,
        metadata: {
          postTitle: postTitle.substring(0, 50),
          commentText: commentText.substring(0, 100),
          actionUrl: `/posts/${postId}`,
        },
        priority: 'medium',
      });
    } catch (error) {
      console.error('Error creating post comment notification:', error);
    }
  }

  static async createCommentReplyNotification(
    replierId,
    originalCommenterId,
    commentId,
    replyText,
    postId
  ) {
    try {
      if (replierId === originalCommenterId) return null;

      const replier = await User.findById(replierId).select(
        'name username profilePicture'
      );
      if (!replier) return null;

      return await Notification.createNotification({
        recipient: originalCommenterId,
        sender: replierId,
        type: 'comment_reply',
        title: 'Comment Reply',
        message: `${replier.name} replied to your comment`,
        relatedEntity: {
          entityType: 'Comment',
          entityId: commentId,
        },
        metadata: {
          commentText: replyText.substring(0, 100),
          actionUrl: `/posts/${postId}#comment-${commentId}`,
        },
        priority: 'medium',
      });
    } catch (error) {
      console.error('Error creating comment reply notification:', error);
    }
  }

  static async createPostPublishedNotification(
    authorId,
    postId,
    postTitle,
    postImage = null
  ) {
    try {
      const author = await User.findById(authorId).select(
        'name username profilePicture'
      );
      if (!author) return null;

      const Follow = (await import('../models/Follow.js')).default;
      const followers = await Follow.find({
        following: authorId,
        isActive: true,
      }).select('follower');

      if (followers.length === 0) return null;

      const notifications = followers.map(follow => ({
        recipient: follow.follower,
        sender: authorId,
        type: 'post_published',
        title: 'New Post',
        message: `${author.name} published a new post`,
        relatedEntity: {
          entityType: 'Post',
          entityId: postId,
        },
        metadata: {
          postTitle: postTitle.substring(0, 50),
          postImage: postImage,
          actionUrl: `/posts/${postId}`,
        },
        priority: 'low',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }));

      return await Notification.insertMany(notifications);
    } catch (error) {
      console.error('Error creating post published notifications:', error);
    }
  }

  static async createMessageNotification(
    senderId,
    recipientId,
    messagePreview,
    conversationId
  ) {
    try {
      const sender = await User.findById(senderId).select(
        'name username profilePicture'
      );
      if (!sender) return null;

      return await Notification.createNotification({
        recipient: recipientId,
        sender: senderId,
        type: 'message',
        title: 'New Message',
        message: `${sender.name} sent you a message`,
        metadata: {
          messagePreview: messagePreview.substring(0, 100),
          conversationId: conversationId,
          actionUrl: `/messages/${conversationId}`,
        },
        priority: 'high',
      });
    } catch (error) {
      console.error('Error creating message notification:', error);
    }
  }

  static async createProfileViewNotification(viewerId, profileOwnerId) {
    try {
      if (viewerId === profileOwnerId) return null;

      const viewer = await User.findById(viewerId).select(
        'name username profilePicture accountType'
      );
      if (!viewer) return null;

      return await Notification.createNotification({
        recipient: profileOwnerId,
        sender: viewerId,
        type: 'profile_view',
        title: 'Profile View',
        message: `${viewer.name} viewed your profile`,
        batchKey: `profile_view_${profileOwnerId}`,
        metadata: {
          actionUrl: `/profile/${viewer.username}`,
        },
        priority: 'low',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    } catch (error) {
      console.error('Error creating profile view notification:', error);
    }
  }

  static async createJobApplicationNotification(
    companyId,
    applicantId,
    jobId,
    jobTitle,
    status
  ) {
    try {
      const company = await User.findById(companyId).select(
        'name username profilePicture'
      );
      if (!company) return null;

      const title = status === 'accepted' ? 'Application Accepted' : 'Application Update';
      const message = status === 'accepted'
        ? `Congratulations! Your application for ${jobTitle} has been accepted`
        : `Your application for ${jobTitle} has been ${status}`;

      return await Notification.createNotification({
        recipient: applicantId,
        sender: companyId,
        type: 'job_application',
        title,
        message,
        metadata: {
          jobTitle,
          applicationStatus: status,
          actionUrl: `/jobs/${jobId}`,
        },
        priority: status === 'accepted' ? 'high' : 'medium',
      });
    } catch (error) {
      console.error('Error creating job application notification:', error);
    }
  }

  static async getNotificationStats(userId) {
    try {
      const [unreadCount, totalCount, recentCount] = await Promise.all([
        Notification.countDocuments({ recipient: userId, isRead: false }),
        Notification.countDocuments({ recipient: userId }),
        Notification.countDocuments({
          recipient: userId,
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        }),
      ]);

      return { unreadCount, totalCount, recentCount };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return { unreadCount: 0, totalCount: 0, recentCount: 0 };
    }
  }

  static async cleanupOldNotifications() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      await Notification.deleteMany({
        isRead: true,
        readAt: { $lt: thirtyDaysAgo },
      });

      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      await Notification.deleteMany({
        createdAt: { $lt: ninetyDaysAgo },
      });

      console.log('Cleaned up old notifications');
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
    }
  }
}

export default NotificationService;