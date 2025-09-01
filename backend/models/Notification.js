import mongoose from 'mongoose';

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'follow',
        'unfollow',
        'connection_request',
        'connection_accepted',
        'connection_declined',
        'post_like',
        'post_comment',
        'comment_like',
        'comment_reply',
        'message',
        'post_published',
        'mention',
        'profile_view',
        'job_application',
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },

    relatedEntity: {
      entityType: {
        type: String,
        enum: ['Post', 'Comment', 'Connection', 'Message', 'User'],
      },
      entityId: {
        type: Schema.Types.ObjectId,
        refPath: 'relatedEntity.entityType',
      },
    },

    metadata: {

      postTitle: String,
      postImage: String,


      connectionType: String,
      connectionMessage: String,


      commentText: String,
      parentCommentId: Schema.Types.ObjectId,


      messagePreview: String,
      conversationId: Schema.Types.ObjectId,


      likeType: {
        type: String,
        enum: ['post', 'comment'],
      },




    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },

    batchKey: {
      type: String,
      index: true,
    },
    batchCount: {
      type: Number,
      default: 1,
    },

    expiresAt: {
      type: Date,

    },

    deviceInfo: {

      deviceId: String,
      pushSent: { type: Boolean, default: false },
      emailSent: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    indexes: [
      { recipient: 1, createdAt: -1 },
      { recipient: 1, isRead: 1 },
      { recipient: 1, type: 1 },
      { batchKey: 1 },
      { createdAt: -1 },
      { priority: 1, createdAt: -1 },
    ],
  }
);


notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1, createdAt: -1 });


notificationSchema.statics.createNotification = async function (data) {
  try {

    if (data.batchKey) {
      const existingNotification = await this.findOne({
        recipient: data.recipient,
        batchKey: data.batchKey,
        createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
      });

      if (existingNotification) {

        existingNotification.batchCount += 1;
        existingNotification.message = this.getBatchMessage(
          data.type,
          existingNotification.batchCount
        );
        existingNotification.createdAt = new Date();
        return await existingNotification.save();
      }
    }


    const notification = new this(data);
    return await notification.save();
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

notificationSchema.statics.getBatchMessage = function (type, count) {
  const messages = {
    follow:
      count > 1
        ? `${count} people started following you`
        : 'started following you',
    post_like:
      count > 1 ? `${count} people liked your post` : 'liked your post',
    post_comment:
      count > 1
        ? `${count} new comments on your post`
        : 'commented on your post',
  };

  return messages[type] || `${count} new notifications`;
};

notificationSchema.statics.markAsRead = async function (
  notificationIds,
  userId
) {
  return await this.updateMany(
    {
      _id: { $in: notificationIds },
      recipient: userId,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    }
  );
};

notificationSchema.statics.markAllAsRead = async function (userId) {
  return await this.updateMany(
    {
      recipient: userId,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    }
  );
};

notificationSchema.statics.getUnreadCount = async function (userId) {
  return await this.countDocuments({
    recipient: userId,
    isRead: false,
  });
};

notificationSchema.statics.getUserNotifications = async function (
  userId,
  options = {}
) {
  const {
    page = 1,
    limit = 20,
    type = null,
    isRead = null,
    priority = null,
  } = options;

  const query = { recipient: userId };

  if (type) query.type = type;
  if (isRead !== null) query.isRead = isRead;
  if (priority) query.priority = priority;

  return await this.find(query)
    .populate('sender', 'name username profilePicture accountType')
    .populate('relatedEntity.entityId')
    .sort({ priority: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
};


notificationSchema.virtual('timeAgo').get(function () {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return this.createdAt.toLocaleDateString();
});


notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });

export default mongoose.model('Notification', notificationSchema);
