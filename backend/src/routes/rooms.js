import { Router } from 'express';
import slugify from 'slugify';
import Message from '../models/Message.js';
import Room from '../models/Room.js';

const router = Router();

function normalizeGameName(name) {
  return slugify(name, { lower: true, strict: true });
}

// Get recent messages for a game room
router.get('/:game/messages', async (req, res) => {
  try {
    const slug = normalizeGameName(req.params.game);
    const before = req.query.before ? new Date(req.query.before) : new Date();
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
    const msgs = await Message.find({ roomType: 'game', roomKey: slug, createdAt: { $lt: before } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    // Ensure room exists for visibility
    await Room.findOneAndUpdate(
      { slug },
      { $setOnInsert: { slug, name: req.params.game, type: 'game' } },
      { upsert: true }
    );
    res.json({ messages: msgs.reverse() });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
