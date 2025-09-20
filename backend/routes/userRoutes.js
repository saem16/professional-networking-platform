import express from 'express';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/search', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({ success: true, users: [] });
    }

    const users = await User.find({
      $and: [
        { _id: { $ne: userId } },
        {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { username: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } },
          ],
        },
      ],
    })
      .select('name username email profilePicture headline accountType')
      .limit(20);

    res.json({ success: true, users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/company-employees', authMiddleware, async (req, res) => {
  try {
    const { company } = req.query;

    if (!company) {
      return res.json({ success: true, employees: [] });
    }

    const employees = await User.find({
      $or: [
        { 'experience.company': { $regex: company, $options: 'i' } },
        { 
          $and: [
            { accountType: 'employee' },
            { 'companyProfile.companyName': { $regex: company, $options: 'i' } }
          ]
        }
      ]
    })
      .select('name username profilePicture headline profession')
      .limit(50);

    res.json({ success: true, employees });
  } catch (error) {
    console.error('Get company employees error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;