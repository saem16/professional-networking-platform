import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authMiddleware } from '../middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadType = req.params.type || 'general';
    let uploadPath;
    
    switch (uploadType) {
      case 'messages':
        uploadPath = path.join(__dirname, '../uploads/messages');
        break;
      case 'profiles':
        uploadPath = path.join(__dirname, '../uploads/profiles');
        break;
      case 'posts':
        uploadPath = path.join(__dirname, '../uploads/posts');
        break;
      case 'resumes':
        uploadPath = path.join(__dirname, '../uploads/resumes');
        break;
      default:
        uploadPath = path.join(__dirname, '../uploads');
    }
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const uploadType = req.params.type;
    let allowedMimes = [];
    
    switch (uploadType) {
      case 'messages':
        allowedMimes = [
          'image/jpeg', 'image/png', 'image/gif', 'image/webp',
          'application/pdf', 'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        break;
      case 'profiles':
      case 'posts':
        allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        break;
      case 'resumes':
        allowedMimes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        break;
      default:
        allowedMimes = [
          'image/jpeg', 'image/png', 'image/gif', 'image/webp',
          'application/pdf'
        ];
    }
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  },
});

router.post('/:type/single', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const baseURL = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  const uploadType = req.params.type;
  const fileUrl = `${baseURL}/uploads/${uploadType === 'general' ? '' : uploadType + '/'}${req.file.filename}`;

  res.json({
    success: true,
    file: { 
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype
    }
  });
});

router.post('/:type/multiple', authMiddleware, upload.array('files', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files uploaded' });
  }

  const baseURL = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  const uploadType = req.params.type;
  
  const files = req.files.map(file => ({
    url: `${baseURL}/uploads/${uploadType === 'general' ? '' : uploadType + '/'}${file.filename}`,
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
    mimeType: file.mimetype
  }));

  res.json({
    success: true,
    files
  });
});

export default router;