const service = require('./service');
const { sendSuccess } = require('../../utils/response');
const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().optional(),
  role: z.string().optional(), // Accepted in schema but ignored server-side
  departmentId: z.string().uuid().optional(),
});

const forgotSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  id: z.string().uuid(),
  token: z.string().min(1),
  newPassword: z.string().min(6),
});

async function login(req, res, next) {
  try {
    const validated = loginSchema.parse(req.body);
    const { accessToken, refreshToken, user } = await service.login(validated);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return sendSuccess(res, { token: accessToken, user });
  } catch (err) {
    next(err);
  }
}

async function signup(req, res, next) {
  try {
    const validated = signupSchema.parse(req.body);
    const { accessToken, refreshToken, user } = await service.signup(validated);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return sendSuccess(res, { token: accessToken, user }, 201);
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const { accessToken, refreshToken: newRefreshToken, user } = await service.refresh({ refreshToken });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return sendSuccess(res, { token: accessToken, user });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    res.clearCookie('refreshToken');
    return sendSuccess(res, { message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const validated = forgotSchema.parse(req.body);
    const result = await service.forgotPassword(validated);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const validated = resetSchema.parse(req.body);
    const result = await service.resetPassword(validated);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await service.getMe(req.user.id);
    return sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  login,
  signup,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  me,
};
