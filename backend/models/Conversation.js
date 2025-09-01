import mongoose from 'mongoose';

const { Schema } = mongoose;

const conversationSchema = new Schema(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    isGroup: {
      type: Boolean,
      default: false,
    },
    name: {
      type: String,
      required: function () {
        return this.isGroup;
      },
    },
    description: {
      type: String,
      maxlength: 500,
    },
    avatar: {
      type: String,
      default: function () {
        if (this.isGroup && this.name) {
          const seed = encodeURIComponent(this.name);
          return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;
        }
        return null;
      },
    },
    admin: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: function () {
        return this.isGroup;
      },
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    unreadCount: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        count: {
          type: Number,
          default: 0,
        },
      },
    ],
    settings: {
      allowMemberAdd: {
        type: Boolean,
        default: true,
      },
      muteUntil: [
        {
          user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
          },
          until: Date,
        },
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      { participants: 1, isGroup: 1 },
      { lastActivity: -1 },
      { participants: 1, isGroup: 1, unique: true, partialFilterExpression: { isGroup: false } }
    ],
  }
);


conversationSchema.statics.findOrCreateDirect = async function (
  user1Id,
  user2Id
) {

  const sortedIds = [user1Id, user2Id].sort();
  
  let conversation = await this.findOne({
    isGroup: false,
    participants: { $all: sortedIds, $size: 2 },
  })
    .populate('participants', 'name username profilePicture')
    .populate('lastMessage');

  if (!conversation) {

    conversation = await this.findOneAndUpdate(
      {
        isGroup: false,
        participants: { $all: sortedIds, $size: 2 },
      },
      {
        participants: sortedIds,
        isGroup: false,
        lastActivity: new Date(),
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );
    await conversation.populate('participants', 'name username profilePicture');
  }

  return conversation;
};


conversationSchema.statics.createGroup = async function (
  name,
  description,
  adminId,
  participantIds
) {

  const allParticipants = [...new Set([adminId, ...participantIds])];

  const conversation = new this({
    name,
    description,
    isGroup: true,
    admin: adminId,
    participants: allParticipants,
  });

  await conversation.save();
  await conversation.populate('participants', 'name username profilePicture');
  await conversation.populate('admin', 'name username profilePicture');

  return conversation;
};


conversationSchema.methods.addParticipants = async function (userIds) {
  const newParticipants = userIds.filter(id => !this.participants.includes(id));

  this.participants.push(...newParticipants);
  this.lastActivity = new Date();

  return await this.save();
};


conversationSchema.methods.removeParticipant = async function (userId) {
  this.participants = this.participants.filter(
    id => id.toString() !== userId.toString()
  );
  this.lastActivity = new Date();

  return await this.save();
};


conversationSchema.methods.getUnreadCount = function (userId) {
  const userUnread = this.unreadCount.find(
    uc => uc.user.toString() === userId.toString()
  );
  return userUnread ? userUnread.count : 0;
};


conversationSchema.methods.incrementUnreadCount = async function (
  excludeUserId
) {
  this.participants.forEach(participantId => {
    if (participantId.toString() !== excludeUserId.toString()) {
      const userUnread = this.unreadCount.find(
        uc => uc.user.toString() === participantId.toString()
      );

      if (userUnread) {
        userUnread.count += 1;
      } else {
        this.unreadCount.push({ user: participantId, count: 1 });
      }
    }
  });

  return await this.save();
};


conversationSchema.methods.resetUnreadCount = async function (userId) {
  const userUnread = this.unreadCount.find(
    uc => uc.user.toString() === userId.toString()
  );

  if (userUnread) {
    userUnread.count = 0;
  }

  return await this.save();
};


conversationSchema.statics.resetUnreadCount = async function (
  conversationId,
  userId
) {
  const conversation = await this.findById(conversationId);
  if (conversation) {
    return await conversation.resetUnreadCount(userId);
  }
};


conversationSchema.statics.getUserConversations = async function (
  userId,
  options = {}
) {
  const { page = 1, limit = 20 } = options;

  return await this.find({
    participants: userId,
    isActive: true,
  })
    .populate('participants', 'name username profilePicture')
    .populate('admin', 'name username profilePicture')
    .populate({
      path: 'lastMessage',
      populate: {
        path: 'sender',
        select: 'name username',
      },
    })
    .sort({ lastActivity: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
};

export default mongoose.model('Conversation', conversationSchema);
