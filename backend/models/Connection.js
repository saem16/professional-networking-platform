import mongoose from 'mongoose';

const { Schema } = mongoose;

const connectionSchema = new Schema(
  {
    requester: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    respondedAt: {
      type: Date,
    },
    message: {
      type: String,
      maxlength: 200,
    },
    connectionType: {
      type: String,
      enum: ['colleague', 'classmate', 'friend', 'professional', 'other'],
      default: 'professional',
    },
  },
  { 
    timestamps: true,
    indexes: [
      { requester: 1, recipient: 1 },
      { requester: 1 },
      { recipient: 1 },
      { status: 1 },
      { requestedAt: -1 },
    ]
  }
);

connectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });

connectionSchema.statics.getConnections = function(userId, page = 1, limit = 20) {
  return this.find({
    $or: [
      { requester: userId, status: 'accepted' },
      { recipient: userId, status: 'accepted' }
    ]
  })
  .populate('requester recipient', 'name username profilePicture')
  .sort({ respondedAt: -1 })
  .skip((page - 1) * limit)
  .limit(limit);
};

connectionSchema.statics.getPendingRequests = function(userId) {
  return this.find({ recipient: userId, status: 'pending' })
    .populate('requester', 'name username profilePicture headline')
    .sort({ requestedAt: -1 });
};

connectionSchema.virtual('isMutual').get(function() {
  return this.status === 'accepted';
});

connectionSchema.post('save', async function() {
  if (this.status === 'accepted' && this.isModified('status')) {
    const { UserStats } = await import('./UserStats.js');
    
    await Promise.all([
      UserStats.findOneAndUpdate(
        { userId: this.requester },
        { $inc: { connectionsCount: 1 } },
        { upsert: true }
      ),
      UserStats.findOneAndUpdate(
        { userId: this.recipient },
        { $inc: { connectionsCount: 1 } },
        { upsert: true }
      )
    ]);
  }
});

export default mongoose.model('Connection', connectionSchema);

