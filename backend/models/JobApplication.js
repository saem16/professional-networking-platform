import mongoose from 'mongoose';

const { Schema } = mongoose;

const jobApplicationSchema = new Schema(
  {
    job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    applicant: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'rejected', 'accepted'],
      default: 'pending',
    },
    coverLetter: { type: String, maxlength: 1000 },
    resume: { type: String },
  },
  { timestamps: true }
);


jobApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

export default mongoose.model('JobApplication', jobApplicationSchema);