import User from '../models/User.js';

export function requirePermissions(...required) {
  return async function (req, res, next) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const user = await User.findById(userId).lean();
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      if (user.role === 'admin') return next();
      const perms = Array.isArray(user.permissions) ? user.permissions : [];
      const missing = required.filter((p) => !perms.includes(p));
      if (missing.length) return res.status(403).json({ error: 'Forbidden', missing });
      next();
    } catch (e) {
      return res.status(500).json({ error: 'Server error' });
    }
  };
}