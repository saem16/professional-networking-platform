import mongoose from 'mongoose';

const { Schema } = mongoose;

const followSchema = new Schema(
  {
    follower: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    following: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    followedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
  },
  { 
    timestamps: true,
    indexes: [
      { follower: 1, following: 1 },
      { follower: 1 },
      { following: 1 },
      { followedAt: -1 },
    ]
  }
);

followSchema.index({ follower: 1, following: 1 }, { unique: true });


followSchema.statics.getFollowers = function(userId, page = 1, limit = 20) {
  return this.find({ following: userId, isActive: true })
    .populate('follower', 'name username profilePicture')
    .sort({ followedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

followSchema.statics.getFollowing = function(userId, page = 1, limit = 20) {
  return this.find({ follower: userId, isActive: true })
    .populate('following', 'name username profilePicture')
    .sort({ followedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};


followSchema.post('save', async function() {
  if (this.isNew) {
    const { UserStats } = await import('./UserStats.js');
    
    await UserStats.findOneAndUpdate(
      { userId: this.following },
      { $inc: { followersCount: 1 } },
      { upsert: true }
    );
    
    await UserStats.findOneAndUpdate(
      { userId: this.follower },
      { $inc: { followingCount: 1 } },
      { upsert: true }
    );
  }
});

export default mongoose.model('Follow', followSchema);
