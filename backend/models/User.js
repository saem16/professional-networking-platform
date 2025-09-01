import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },


    accountType: {
      type: String,
      enum: ['student', 'employee', 'company'],
      default: 'student',
    },


    status: {
      type: String,
      enum: ['student', 'employed', 'looking', 'freelancer', 'hiring'],
      default: 'student',
    },

    profilePicture: {
      type: String,
      default: function () {
        const seed = encodeURIComponent(this.username || this.name || 'user');
        return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;
      },
    },
    coverPhoto: {
      type: String,
      default: '',
    },

    headline: {
      type: String,
      default: '',
    },

    bio: {
      type: String,
      maxlength: 500,
    },

    location: {
      city: String,
      country: String,
      address: String,
    },


    education: [
      {

        degree: String,
        fieldOfStudy: String,


      },
    ],


    experience: [
      {
        title: String,
        company: String,
        logo: String,

        startDate: Date,
        endDate: Date,

        description: String,
      },
    ],


    certifications: [
      {
        name: String,
        issuer: String,
        date: Date,
        credentialId: String,
        url: String,
      },
    ],


    profession: {

    },


    skills: [
      {
        name: String,
        endorsements: [
          {
            userId: { type: Schema.Types.ObjectId, ref: 'User' },
            endorsedAt: { type: Date, default: Date.now },
          },
        ],
      },
    ],


    companyProfile: {
      companyName: String,
      website: String,
      industry: String,
      foundedYear: Number,
      description: String,
      employees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    },


    connections: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    groups: [
      {
        name: String,
        description: String,
        members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      },
    ],


    listings: [
      {
        title: String,
        company: String,
        type: { type: String, enum: ['Job', 'Internship'] },
        postedAt: { type: Date, default: Date.now },
      },
    ],


    socialLinks: {
      linkedin: String,
      github: String,
      portfolio: String,
      twitter: String,
    },

    role: {
      type: String,
      enum: ['student', 'recruiter', 'admin'],
      default: 'student',
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
