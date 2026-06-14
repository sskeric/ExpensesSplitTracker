import express from 'express';
import auth from '../middleware/auth.js';
import Expense from '../models/Expense.js';
import Group from '../models/Group.js';

const router = express.Router();

// ── Add expense ──
router.post('/', auth, async (req, res) => {
  try {
    const { groupId, description, amount } = req.body;

    if (!groupId || !description || !amount)
      return res.status(400).json({ msg: 'All fields required' });

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ msg: 'Group not found' });
    if (!group.members.map(m => m.toString()).includes(req.user.id))
      return res.status(403).json({ msg: 'Not a group member' });

    const expense = new Expense({
      group:       groupId,
      description,
      amount:      Number(amount),
      addedBy:     req.user.id,
      payments:    [],
      totalPaid:   0
    });

    await expense.save();
    res.json(expense);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── Get expenses for a group ──
router.get('/group/:groupId', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ msg: 'Group not found' });
    if (!group.members.map(m => m.toString()).includes(req.user.id))
      return res.status(403).json({ msg: 'Not a group member' });

    const expenses = await Expense.find({ group: req.params.groupId })
      .populate('addedBy', 'username')
      .sort({ createdAt: -1 });

    res.json(expenses);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── Pay toward an expense ──
router.post('/:id/pay', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || Number(amount) <= 0)
      return res.status(400).json({ msg: 'Enter a valid amount' });

    const expense = await Expense.findById(req.params.id)
      .populate('addedBy', 'username');
    if (!expense) return res.status(404).json({ msg: 'Expense not found' });

    const group = await Group.findById(expense.group);
    if (!group.members.map(m => m.toString()).includes(req.user.id))
      return res.status(403).json({ msg: 'Not a group member' });

    const remaining = Number((expense.amount - expense.totalPaid).toFixed(2));
    const paying   = Number(Number(amount).toFixed(2));

    if (paying > remaining)
      return res.status(400).json({
        msg: `Cannot pay more than remaining RM ${remaining.toFixed(2)}`
      });

    // Check if this user already paid — if so, add to their existing payment
    const existing = expense.payments.find(
      p => p.userId.toString() === req.user.id
    );
    if (existing) {
      existing.amount = Number((existing.amount + paying).toFixed(2));
    } else {
      expense.payments.push({
        userId:   req.user.id,
        username: req.user.username,
        amount:   paying
      });
    }

    expense.totalPaid = Number((expense.totalPaid + paying).toFixed(2));
    await expense.save();

    res.json(expense);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── Delete expense (only adder can delete) ──
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ msg: 'Not found' });
    if (expense.addedBy.toString() !== req.user.id)
      return res.status(403).json({ msg: 'Not allowed' });

    await expense.deleteOne();
    res.json({ msg: 'Deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;
