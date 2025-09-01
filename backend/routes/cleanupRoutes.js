import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import FileCleanupService from '../services/fileCleanupService.js';

const router = express.Router();

router.post('/files', authMiddleware, async (req, res) => {
  try {
    const deletedCount = await FileCleanupService.cleanupUnusedFiles();
    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} unused files`,
      deletedCount
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup files'
    });
  }
});

export default router;