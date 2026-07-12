const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const env = require('../../config/env');
const { query } = require('../../config/db');
const { UnauthorizedError, BadRequestError, NotFoundError } = require('../../utils/errors');

function generateTokens(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    departmentId: user.department_id || null,
  };

  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '15m', // Short-lived access token (15m) per spec
  });

  const refreshToken = jwt.sign(
    { id: user.id, type: 'refresh' },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken, user: payload };
}

async function login({ email, password }) {
  const res = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
  if (res.rows.length === 0) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const user = res.rows[0];

  if (user.status === 'Inactive') {
    throw new UnauthorizedError('Account is inactive. Please contact your system administrator.');
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  return generateTokens(user);
}

async function signup({ email, password, fullName, departmentId }) {
  // Global Constraint 1: Sign up creates an Employee account ONLY.
  // Role parameter is ignored even if client sent it.
  const role = 'Employee';

  // Check existing email
  const existing = await query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
  if (existing.rows.length > 0) {
    throw new BadRequestError('An account with this email already exists.');
  }

  // Hash password with bcrypt (12 rounds as specified in Phase 1)
  const hashed = await bcrypt.hash(password, 12);

  const res = await query(
    `INSERT INTO users (name, email, password_hash, role, department_id, status)
     VALUES ($1, $2, $3, $4, $5, 'Active')
     RETURNING id, name, email, role, department_id`,
    [fullName || email.split('@')[0], email.toLowerCase(), hashed, role, departmentId || null]
  );

  const user = res.rows[0];
  return generateTokens(user);
}

async function refresh({ refreshToken }) {
  if (!refreshToken) {
    throw new UnauthorizedError('Refresh token missing');
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  const res = await query('SELECT * FROM users WHERE id = $1', [decoded.id]);
  if (res.rows.length === 0) {
    throw new UnauthorizedError('User no longer exists');
  }

  const user = res.rows[0];
  if (user.status === 'Inactive') {
    throw new UnauthorizedError('Account is inactive');
  }

  return generateTokens(user);
}

async function forgotPassword({ email }) {
  const res = await query('SELECT id, name FROM users WHERE LOWER(email) = LOWER($1)', [email]);
  if (res.rows.length === 0) {
    // Return silently to prevent email enumeration
    return { success: true, message: 'If an account exists, password reset instructions have been dispatched.' };
  }

  const user = res.rows[0];
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await query(
    'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3',
    [hashedToken, expiresAt, user.id]
  );

  const resetLink = `${env.FRONTEND_ORIGIN}/reset-password?token=${resetToken}&id=${user.id}`;
  console.log('========================================================');
  console.log('[MAILER SIMULATION] Password Reset Requested');
  console.log(`User  : ${email}`);
  console.log(`Link  : ${resetLink}`);
  console.log('========================================================');

  return { success: true, message: 'Password reset instructions dispatched.' };
}

async function resetPassword({ id, token, newPassword }) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const res = await query(
    'SELECT id FROM users WHERE id = $1 AND reset_password_token = $2 AND reset_password_expires > NOW()',
    [id, hashedToken]
  );

  if (res.rows.length === 0) {
    throw new BadRequestError('Invalid or expired password reset token');
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await query(
    'UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2',
    [hashed, id]
  );

  return { success: true, message: 'Password updated successfully.' };
}

async function getMe(userId) {
  const res = await query(
    `SELECT u.id, u.name, u.email, u.role, u.status, u.department_id, d.name AS department_name
     FROM users u
     LEFT JOIN departments d ON u.department_id = d.id
     WHERE u.id = $1`,
    [userId]
  );
  if (res.rows.length === 0) {
    throw new NotFoundError('User not found');
  }
  return res.rows[0];
}

module.exports = {
  login,
  signup,
  refresh,
  forgotPassword,
  resetPassword,
  getMe,
};
