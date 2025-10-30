import { Router } from 'express';
import Group from '../models/Group.js';
import Message from '../models/Message.js';

const router = Router();

// Create a group under a game
router.post('/', async (req, res) => {
  try {
    const { name, gameSlug } = req.body;
    if (!name || !gameSlug) return res.status(400).json({ error: 'Missing fields' });
    const group = await Group.create({ name, gameSlug, members: [req.user.id], createdBy: req.user.id });
    res.json({ group });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// List groups current user is in
router.get('/mine', async (req, res) => {
  const groups = await Group.find({ members: req.user.id }).sort({ createdAt: -1 }).lean();
  res.json({ groups });
});

// Get group messages
router.get('/:groupId/messages', async (req, res) => {
  try {
    const before = req.query.before ? new Date(req.query.before) : new Date();
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
    const msgs = await Message.find({ roomType: 'group', roomKey: req.params.groupId, createdAt: { $lt: before } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json({ messages: msgs.reverse() });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
