import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { initializeSocket } from './services/socketService.js';
import authRoute from './routes/authRoute.js';
import postRoute from './routes/postRoute.js';
import jobRoute from './routes/jobRoute.js';
import sessionRoute from './routes/sessionRoute.js';
import profileRoute from './routes/profileRoute.js';
import followRoutes from './routes/followRoutes.js';
import connectionRoutes from './routes/connectionRoutes.js';
import socialStatsRoutes from './routes/socialStatsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import uploadRoutes from './routes/uploadRoute.js';
import userRoutes from './routes/userRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import universityRoutes from './routes/universityRoutes.js';
import cleanupRoutes from './routes/cleanupRoutes.js';
import FileCleanupService from './services/fileCleanupService.js';

dotenv.config();
const app = express();

const server = createServer(app);

const io = initializeSocket(server);

app.set('io', io);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

async function connectDB() {
  try {
    await mongoose.connect(`${process.env.MONGO_URI}myAppDB`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

app.get('/', (req, res) => {
  res.send('Node.js + MongoDB + Socket.IO Server is running');
});

app.use('/auth', authRoute);
app.use('/posts', postRoute);
app.use('/jobs', jobRoute);
app.use('/session', sessionRoute);
app.use('/profile', profileRoute);
app.use('/follow', followRoutes);
app.use('/connection', connectionRoutes);
app.use('/social', socialStatsRoutes);
app.use('/notifications', notificationRoutes);
app.use('/messages', messageRoutes);
app.use('/upload', uploadRoutes);
app.use('/users', userRoutes);
app.use('/companies', companyRoutes);
app.use('/universities', universityRoutes);
app.use('/cleanup', cleanupRoutes);

app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File size too large. Maximum size is 10MB.',
    });
  }

  if (error.message === 'Invalid file type') {
    return res.status(400).json({
      success: false,
      message: 'Invalid file type. Only images and documents are allowed.',
    });
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Socket.IO server initialized`);
    
    // Schedule file cleanup every 24 hours
    setInterval(async () => {
      try {
        await FileCleanupService.cleanupUnusedFiles();
      } catch (error) {
        console.error('Scheduled cleanup failed:', error);
      }
    }, 24 * 60 * 60 * 1000);
  });
});
