import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import User from '../models/User.js';
import Company from '../models/Company.js';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

const generateAuthResponse = user => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      username: user.username || '',
      profilePicture: user.profilePicture || '',
      headline: user.headline || '',
      accountType: user.accountType || 'student',
      status: user.status || 'student',
      profession: user.profession || '',
      role: user.role || 'student',
    },
  };
};

const makeBaseFromEmail = (email = '') => {
  const [localPart] = email.split('@');
  return (
    localPart
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '')
      .slice(0, 20) || 'user'
  );
};

const generateUniqueUsername = async email => {
  const base = makeBaseFromEmail(email);
  let username = base;
  let exists = await User.findOne({ username });
  let attempts = 0;

  while (exists) {
    const suffix = nanoid(6).toLowerCase();
    username = `${base}-${suffix}`;
    exists = await User.findOne({ username });
    attempts += 1;
    if (attempts >= 8) {
      username = `${base}-${nanoid(10).toLowerCase()}`;
      break;
    }
  }
  return username;
};


router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, accountType, status, profession } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: 'Name, email and password are required' });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const username = await generateUniqueUsername(email);
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);


    const allowedAccountTypes = ['student', 'employee', 'company'];
    const allowedStatuses = [
      'student',
      'employed',
      'looking',
      'freelancer',
      'hiring',
    ];

    const userData = {
      name,
      email,
      username,
      password: hashedPassword,
      accountType: allowedAccountTypes.includes(accountType)
        ? accountType
        : 'student',
      status: allowedStatuses.includes(status) ? status : 'student',
    };

    if (profession) userData.profession = profession;

    const user = new User(userData);
    await user.save();

    if (accountType === 'company' && name) {
      try {
        await Company.findOneAndUpdate(
          { name: { $regex: `^${name}$`, $options: 'i' } },
          { name: name.trim(), createdBy: user._id },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.error('Error creating company record:', err);
      }
    }

    return res.status(201).json(generateAuthResponse(user));
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});


router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res
        .status(400)
        .json({ message: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: 'Invalid credentials' });

    return res.json(generateAuthResponse(user));
  } catch (err) {
    console.error('Signin error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
