import mongoose from 'mongoose';
const { Schema } = mongoose;


const commentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },

    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);


commentSchema.add({
  replies: [commentSchema],
});

const postSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    banner: { type: String },
    publishedAt: { type: Date },
    tags: [String],
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    comments: [commentSchema],
  },
  { timestamps: true }
);


postSchema.methods.extractBannerFromContent = function () {
  if (!this.content) return null;

  const imgRegex = /<img[^>]+src="([^">]+)"/i;
  const match = this.content.match(imgRegex);
  return match ? match[1] : null;
};


postSchema.pre('save', function (next) {
  if (!this.banner && this.content) {
    this.banner = this.extractBannerFromContent();
  }


  if (!this.isDraft && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  next();
});

export default mongoose.model('Post', postSchema);
