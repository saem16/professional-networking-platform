import mongoose from 'mongoose';

const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: function () {
        return !this.attachments || this.attachments.length === 0;
      },
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'system'],
      default: 'text',
    },
    attachments: [
      {
        fileName: String,
        originalName: String,
        filePath: String,
        fileSize: Number,
        mimeType: String,
      },
    ],
    readBy: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    editedAt: Date,
    isDeleted: {
      type: Boolean,
      default: false,
    },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    reactions: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        emoji: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    indexes: [
      { conversation: 1, createdAt: -1 },
      { sender: 1, createdAt: -1 },
    ],
  }
);


messageSchema.virtual('isReadBy').get(function () {
  return userId => {
    return this.readBy.some(read => read.user.toString() === userId.toString());
  };
});


messageSchema.methods.markAsRead = function (userId) {
  const alreadyRead = this.readBy.some(
    read => read.user.toString() === userId.toString()
  );

  if (!alreadyRead) {
    this.readBy.push({ user: userId });
  }

  return this.save();
};


messageSchema.statics.getConversationMessages = async function (
  conversationId,
  options = {}
) {
  const { page = 1, limit = 50, before = null } = options;

  const query = {
    conversation: conversationId,
    isDeleted: false,
  };

  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }

  return await this.find(query)
    .populate('sender', 'name username profilePicture')
    .populate('replyTo', 'content sender createdAt')
    .populate('replyTo.sender', 'name username')
    .sort({ createdAt: -1 })
    .limit(limit * page)
    .lean();
};

export default mongoose.model('Message', messageSchema);
