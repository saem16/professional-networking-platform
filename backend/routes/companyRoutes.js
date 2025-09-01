import express from 'express';
import Company from '../models/Company.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({ success: true, companies: [] });
    }

    const companies = await Company.find({
      name: { $regex: q, $options: 'i' }
    })
      .select('name industry website')
      .limit(10);

    res.json({ success: true, companies });
  } catch (error) {
    console.error('Search companies error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { name, industry, website, foundedYear, description } = req.body;
    const userId = req.userId;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Company name is required' });
    }

    const existingCompany = await Company.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
    
    if (existingCompany) {
      return res.json({ success: true, company: existingCompany, exists: true });
    }

    const company = new Company({
      name: name.trim(),
      industry,
      website,
      foundedYear,
      description,
      createdBy: userId,
    });

    await company.save();
    res.json({ success: true, company, exists: false });
  } catch (error) {
    console.error('Add company error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;