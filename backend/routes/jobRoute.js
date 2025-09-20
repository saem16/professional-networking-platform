import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import Job from '../models/Job.js';
import JobApplication from '../models/JobApplication.js';
import SavedJob from '../models/SavedJob.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const upload = multer({ dest: 'uploads/resumes/' });

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.accountType !== 'company') {
      return res
        .status(403)
        .json({ message: 'Only company accounts can create jobs' });
    }

    const job = new Job({ ...req.body, user: req.userId });
    await job.save();
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate('user', 'name username profilePicture')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/my-applications', authMiddleware, async (req, res) => {
  try {
    const applications = await JobApplication.find({ applicant: req.userId })
      .populate('job')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/saved/list', authMiddleware, async (req, res) => {
  try {
    const savedJobs = await SavedJob.find({ user: req.userId })
      .populate('job')
      .sort({ createdAt: -1 });

    res.json(savedJobs.map(saved => saved.job));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate(
      'user',
      'name username profilePicture'
    );
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/apply', authMiddleware, upload.single('resume'), async (req, res) => {
    try {
      const { name, coverLetter } = req.body;
      const jobId = req.params.id;
      const applicantId = req.userId;

      const existingApplication = await JobApplication.findOne({
        job: jobId,
        applicant: applicantId,
      });

      if (existingApplication) {
        return res
          .status(400)
          .json({ message: 'Already applied for this job' });
      }

      const application = new JobApplication({
        job: jobId,
        applicant: applicantId,
        name,
        coverLetter,
        resume: req.file ? req.file.filename : null,
      });

      await application.save();
      res.json({ message: 'Application submitted successfully', application });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

router.get('/:id/applications', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job || job.user.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const applications = await JobApplication.find({ job: req.params.id })
      .populate(
        'applicant',
        'name username profilePicture skills experience location bio'
      )
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/check-application', authMiddleware, async (req, res) => {
  try {
    const application = await JobApplication.findOne({
      job: req.params.id,
      applicant: req.userId,
    });
    res.json({ hasApplied: !!application });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/save', authMiddleware, async (req, res) => {
  try {
    const existingSave = await SavedJob.findOne({
      user: req.userId,
      job: req.params.id,
    });

    if (existingSave) {
      return res.status(400).json({ message: 'Job already saved' });
    }

    const savedJob = new SavedJob({
      user: req.userId,
      job: req.params.id,
    });

    await savedJob.save();
    res.json({ message: 'Job saved successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id/save', authMiddleware, async (req, res) => {
  try {
    await SavedJob.findOneAndDelete({
      user: req.userId,
      job: req.params.id,
    });
    res.json({ message: 'Job unsaved successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/check-saved', authMiddleware, async (req, res) => {
  try {
    const savedJob = await SavedJob.findOne({
      user: req.userId,
      job: req.params.id,
    });
    res.json({ isSaved: !!savedJob });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put(
  '/applications/:applicationId/status',
  authMiddleware,
  async (req, res) => {
    try {
      const { status } = req.body;
      const application = await JobApplication.findById(
        req.params.applicationId
      )
        .populate('job')
        .populate('applicant', 'name');

      if (!application || application.job.user.toString() !== req.userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      application.status = status;
      await application.save();

      try {
        const NotificationService = (
          await import('../services/notificationService.js')
        ).default;
        const notification = await NotificationService.createJobApplicationNotification(
          req.userId,
          application.applicant._id,
          application.job._id,
          application.job.title,
          status
        );
        console.log('Job application notification created:', notification?._id);
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }

      res.json({ message: 'Application status updated', application });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

router.get('/company/my-jobs', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.accountType !== 'company') {
      return res
        .status(403)
        .json({ message: 'Only company accounts can access this' });
    }

    const jobs = await Job.find({ user: req.userId }).sort({ createdAt: -1 });

    const jobsWithCounts = await Promise.all(
      jobs.map(async job => {
        const applicationCount = await JobApplication.countDocuments({
          job: job._id,
        });
        return { ...job.toObject(), applicationCount };
      })
    );

    res.json(jobsWithCounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job || job.user.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await JobApplication.deleteMany({ job: req.params.id });

    await SavedJob.deleteMany({ job: req.params.id });

    await Job.findByIdAndDelete(req.params.id);

    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/files/view/:filename', async (req, res) => {
  try {
    const token =
      req.query.token ||
      (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    try {
      jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'uploads', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/pdf';

    switch (ext) {
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.doc':
        contentType = 'application/pdf';
        break;
      case '.docx':
        contentType = 'application/pdf';
        break;
      case '.txt':
        contentType = 'text/plain; charset=utf-8';
        break;
      case '.rtf':
        contentType = 'text/plain; charset=utf-8';
        break;
      default:
        contentType = 'application/pdf';
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );

    const fileStream = fs.createReadStream(filePath);
    fileStream.on('error', err => {
      console.error('File stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error reading file' });
      }
    });

    fileStream.pipe(res);
  } catch (err) {
    console.error('File view error:', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;