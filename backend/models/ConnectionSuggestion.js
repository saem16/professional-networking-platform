import mongoose from 'mongoose';

const { Schema } = mongoose;

const connectionSuggestionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    suggestedUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reasons: [
      {
        type: String,
        enum: [
          'mutual_connections',
          'same_company',
          'same_education',
          'same_location',
          'similar_skills',
          'same_industry',
          'imported_contacts',
        ],
      },
    ],
    score: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    dismissedAt: {
      type: Date,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    indexes: [{ userId: 1, isActive: 1 }, { score: -1 }, { generatedAt: -1 }],
  }
);

export default mongoose.model(
  'ConnectionSuggestion',
  connectionSuggestionSchema
);

