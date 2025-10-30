import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';
import { generateToken, hashToken } from '../utils/tokenUtils.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';
import { config } from '../../config.js';

const router = Router();
const JWT_SECRET = config.JWT_SECRET;
const ADMIN_EMAILS = config.ADMIN_EMAILS
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), username: user.username, role: user.role || 'user' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function createAndAttachEmailVerification(user) {
  const token = generateToken(32);
  user.emailVerificationTokenHash = hashToken(token);
  user.emailVerificationExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours
  await user.save();
  return token;
}

async function createAndAttachPasswordReset(user) {
  const token = generateToken(32);
  user.resetPasswordTokenHash = hashToken(token);
  user.resetPasswordExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  await user.save();
  return token;
}

const limiterByEmail = (max = 5) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => `${req.ip}:${(req.body && (req.body.email || req.body.token)) || ''}`,
  });

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' });
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(409).json({ error: 'User exists' });
    const passwordHash = await bcrypt.hash(password, 10);
    const role = ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : 'user';
    const user = await User.create({ username, email, passwordHash, role, emailVerified: false });
    // Send verification email but do NOT gate usage
    try {
      const vtoken = await createAndAttachEmailVerification(user);
      await sendVerificationEmail(user.email, vtoken);
    } catch (e) {
      // log and continue without failing registration
      console.error('Failed to send verification email:', e.message);
    }
    const token = signToken(user);
    res.json({ token, user: { id: user._id.toString(), username: user.username, email: user.email, role: user.role, emailVerified: user.emailVerified } });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken(user);
    res.json({ token, user: { id: user._id.toString(), username: user.username, email: user.email, role: user.role, emailVerified: user.emailVerified } });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json({ user: { id: user._id.toString(), username: user.username, email: user.email, role: user.role, emailVerified: user.emailVerified } });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Email verification: resend link (always 200)
router.post('/resend-verification', limiterByEmail(5), async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.json({ ok: true });
    const user = await User.findOne({ email });
    if (user && !user.emailVerified) {
      const vtoken = await createAndAttachEmailVerification(user);
      try { await sendVerificationEmail(user.email, vtoken); } catch (e) { console.error('Send verify failed', e.message); }
    }
    res.json({ ok: true });
  } catch (e) {
    res.json({ ok: true });
  }
});

router.post('/verify-email', limiterByEmail(20), async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ error: 'Missing token' });
    const h = hashToken(token);
    const now = new Date();
    const user = await User.findOne({ emailVerificationTokenHash: h, emailVerificationExpiresAt: { $gt: now } });
    if (!user) return res.status(400).json({ error: 'Invalid or expired token' });
    user.emailVerified = true;
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpiresAt = undefined;
    await user.save();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Password reset: request (always 200)
router.post('/forgot-password', limiterByEmail(5), async (req, res) => {
  try {
    const { email } = req.body || {};
    if (email) {
      const user = await User.findOne({ email });
      if (user) {
        const rtoken = await createAndAttachPasswordReset(user);
        try { await sendPasswordResetEmail(user.email, rtoken); } catch (e) { console.error('Send reset failed', e.message); }
      }
    }
    res.json({ ok: true });
  } catch (e) {
    res.json({ ok: true });
  }
});

router.post('/reset-password', limiterByEmail(20), async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) return res.status(400).json({ error: 'Missing fields' });
    const h = hashToken(token);
    const now = new Date();
    const user = await User.findOne({ resetPasswordTokenHash: h, resetPasswordExpiresAt: { $gt: now } });
    if (!user) return res.status(400).json({ error: 'Invalid or expired token' });
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpiresAt = undefined;
    await user.save();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
