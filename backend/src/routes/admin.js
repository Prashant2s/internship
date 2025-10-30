import { Router } from 'express';
import User from '../models/User.js';

const router = Router();

// List users (basic fields)
router.get('/users', async (req, res) => {
  const users = await User.find({}, { username: 1, email: 1, role: 1, createdAt: 1, permissions: 1, emailVerified: 1 }).sort({ createdAt: -1 }).lean();
  res.json({ users: users.map(u => ({ id: u._id.toString(), username: u.username, email: u.email, role: u.role, emailVerified: u.emailVerified, permissions: u.permissions || [], createdAt: u.createdAt })) });
});

// Update role/permissions for a user
router.patch('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { role, permissions } = req.body || {};
    const update = {};
    if (role) {
      if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
      update.role = role;
    }
    if (permissions) {
      if (!Array.isArray(permissions)) return res.status(400).json({ error: 'permissions must be an array' });
      update.permissions = permissions;
    }
    if (!Object.keys(update).length) return res.status(400).json({ error: 'No changes' });
    const user = await User.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: { id: user._id.toString(), username: user.username, email: user.email, role: user.role, permissions: user.permissions || [], emailVerified: user.emailVerified, createdAt: user.createdAt } });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
