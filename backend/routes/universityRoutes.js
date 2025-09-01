import express from 'express';
import University from '../models/University.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({ success: true, universities: [] });
    }

    const universities = await University.find({
      name: { $regex: q, $options: 'i' }
    })
      .select('name country city website')
      .limit(10);

    res.json({ success: true, universities });
  } catch (error) {
    console.error('Search universities error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { name, country, city, website } = req.body;
    const userId = req.userId;

    if (!name) {
      return res.status(400).json({ success: false, message: 'University name is required' });
    }

    const existingUniversity = await University.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
    
    if (existingUniversity) {
      return res.json({ success: true, university: existingUniversity, exists: true });
    }

    const university = new University({
      name: name.trim(),
      country,
      city,
      website,
      createdBy: userId,
    });

    await university.save();
    res.json({ success: true, university, exists: false });
  } catch (error) {
    console.error('Add university error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;