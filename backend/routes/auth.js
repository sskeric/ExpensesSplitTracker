import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// ── SIGNUP ──
router.post('/signup', async (req, res) => {
  const { username, email, password, secretCode } = req.body;

  if (!username || !email || !password || !secretCode)
    return res.status(400).json({ msg: 'All fields required' });

  if (secretCode !== process.env.SIGNUP_SECRET_CODE)
    return res.status(403).json({ msg: 'Invalid secret code' });

  try {
    // ✅ check username and email separately for precise error messages
    const existingUsername = await User.findOne({ username });
    if (existingUsername)
      return res.status(400).json({ msg: 'Username already exist' });

    const existingEmail = await User.findOne({ email });
    if (existingEmail)
      return res.status(400).json({ msg: 'Email already exist' });

    const salt   = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = new User({ username, email, password: hashed });
    await user.save();

    // signup does NOT return a token — user must log in
    res.json({ msg: 'Account created successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── LOGIN ──
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ msg: 'All fields required' });

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ msg: 'Invalid credentials' });

    const token = jwt.sign(
      { user: { id: user._id, username: user.username } },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;
