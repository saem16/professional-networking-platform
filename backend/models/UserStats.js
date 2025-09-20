import mongoose from 'mongoose';

const { Schema } = mongoose;

const userStatsSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    followersCount: {
      type: Number,
      default: 0,
    },
    followingCount: {
      type: Number,
      default: 0,
    },
    connectionsCount: {
      type: Number,
      default: 0,
    },
    pendingConnectionsCount: {
      type: Number,
      default: 0,
    },
    profileViews: {
      type: Number,
      default: 0,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    monthlyStats: {
      newFollowers: { type: Number, default: 0 },
      newConnections: { type: Number, default: 0 },
      profileViews: { type: Number, default: 0 },
    },
  },
  { 
    timestamps: true,
    indexes: [
      { userId: 1 },
      { followersCount: -1 },
      { connectionsCount: -1 },
      { lastActiveAt: -1 },
    ]
  }
);

export default mongoose.model('UserStats', userStatsSchema);

