import express from 'express';
import auth from '../middleware/auth.js';
import Group from '../models/Group.js';
import User from '../models/User.js';
import Expense from '../models/Expense.js';

const router = express.Router();

// ── Create group ──
router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ msg: 'Group name required' });

    const group = new Group({
      name,
      creator: req.user.id,
      members: [req.user.id]
    });
    await group.save();
    res.json(group);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── Get all groups for logged-in user ──
router.get('/', auth, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.id })
      .populate('members', 'username email')
      .populate('creator', 'username');
    res.json(groups);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── Add member ──
router.post('/:id/members', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ msg: 'Group not found' });
    if (group.creator.toString() !== req.user.id)
      return res.status(403).json({ msg: 'Only creator can add members' });

    const user = await User.findOne({ username: req.body.username });
    if (!user) return res.status(404).json({ msg: 'User not found' });
    if (group.members.map(m => m.toString()).includes(user._id.toString()))
      return res.status(400).json({ msg: 'Already a member' });

    group.members.push(user._id);
    await group.save();
    await group.populate('members', 'username email');
    res.json(group);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── Remove member ──
router.delete('/:id/members/:userId', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ msg: 'Group not found' });
    if (group.creator.toString() !== req.user.id)
      return res.status(403).json({ msg: 'Only creator can remove members' });
    if (req.params.userId === req.user.id)
      return res.status(400).json({ msg: "Can't remove yourself" });

    group.members = group.members.filter(
      m => m.toString() !== req.params.userId
    );
    await group.save();
    await group.populate('members', 'username email');
    res.json(group);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── Delete group ──
router.delete('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ msg: 'Group not found' });
    if (group.creator.toString() !== req.user.id)
      return res.status(403).json({ msg: 'Only creator can delete group' });

    await Expense.deleteMany({ group: req.params.id });
    await group.deleteOne();
    res.json({ msg: 'Group deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;
