import express from 'express';
import StaffAuthController from '../controllers/staff-auth.controller.js';
import { validate, staffLoginSchema, forgotPasswordSchema, resetPasswordSchema } from '../utils/validation.util.js';
import pool from '../config/database.js';
import EmailService from '../services/email.service.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/login', validate(staffLoginSchema), StaffAuthController.login);
router.post('/forgot-password', validate(forgotPasswordSchema), StaffAuthController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), StaffAuthController.resetPassword);

// ── 2FA ──────────────────────────────────────────────────────────────────────

// Send OTP for 2FA verification
router.post('/2fa/send', async (req, res) => {
  try {
    const { email, tenant_id } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const userRes = await pool.query(
      `SELECT id, full_name, email, twofa_enabled FROM users WHERE email = $1 AND (tenant_id = $2 OR $2 IS NULL) LIMIT 1`,
      [email, tenant_id || null]
    );
    const user = userRes.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await pool.query(
      `UPDATE users SET twofa_otp = $1, twofa_otp_expiry = $2 WHERE id = $3`,
      [otp, expiry, user.id]
    );

    await EmailService.send({
      to: user.email,
      subject: 'Your Login OTP — Drivebx ERP',
      html: `<p>Dear ${user.full_name},</p><p>Your OTP for login is: <strong style="font-size:24px;letter-spacing:4px">${otp}</strong></p><p>This OTP expires in 10 minutes.</p>`,
    });

    return res.json({ success: true, message: 'OTP sent to your email' });
  } catch (err) {
    console.error('2FA send error:', err);
    return res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP and return full tokens (completes login)
router.post('/2fa/verify', async (req, res) => {
  try {
    const { email, otp, tenant_id } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

    const userRes = await pool.query(
      `SELECT * FROM users WHERE email = $1 AND (tenant_id = $2 OR $2 IS NULL) LIMIT 1`,
      [email, tenant_id || null]
    );
    const user = userRes.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.twofa_otp !== otp) return res.status(401).json({ error: 'Invalid OTP' });
    if (new Date() > new Date(user.twofa_otp_expiry)) return res.status(401).json({ error: 'OTP has expired' });

    await pool.query(`UPDATE users SET twofa_otp = NULL, twofa_otp_expiry = NULL WHERE id = $1`, [user.id]);

    // Now generate full tokens
    const crypto = await import('crypto');
    const { generateToken } = await import('../middleware/auth.middleware.js');
    const accessToken = generateToken(user.id, user.tenant_id, user.role, user.email);
    const refreshTokenRaw = crypto.default.randomBytes(40).toString('hex');
    const refreshTokenHash = crypto.default.createHash('sha256').update(refreshTokenRaw).digest('hex');
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(`INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1,$2,$3)`, [user.id, refreshTokenHash, refreshExpiresAt]);

    return res.json({
      success: true,
      data: {
        access_token: accessToken,
        refresh_token: refreshTokenRaw,
        expires_in: 1800,
        user: { id: user.id, tenant_id: user.tenant_id, role: user.role, full_name: user.full_name, email: user.email },
      },
    });
  } catch (err) {
    console.error('2FA verify error:', err);
    return res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// Toggle 2FA for logged-in user
router.post('/2fa/toggle', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE users SET twofa_enabled = NOT twofa_enabled WHERE id = $1 RETURNING twofa_enabled`,
      [req.user.id]
    );
    return res.json({ success: true, twofa_enabled: result.rows[0]?.twofa_enabled });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to toggle 2FA' });
  }
});

// Get 2FA status
router.get('/2fa/status', authenticate, async (req, res) => {
  try {
    const result = await pool.query(`SELECT twofa_enabled FROM users WHERE id = $1`, [req.user.id]);
    return res.json({ success: true, twofa_enabled: result.rows[0]?.twofa_enabled ?? false });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to get 2FA status' });
  }
});

export default router;
