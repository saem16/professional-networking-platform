import mongoose from 'mongoose';
const { Schema } = mongoose;

const jobSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true },
    location: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    type: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Internship', 'Contract'],
      required: true,
    },
    description: { type: String },
    salary: { type: String },
    skillsRequired: [String],
    perks: { type: String },
    whatYouDo: { type: String, required: true },
    whatYouGoodAt: { type: String, required: true },
    aboutYou: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Job', jobSchema);
