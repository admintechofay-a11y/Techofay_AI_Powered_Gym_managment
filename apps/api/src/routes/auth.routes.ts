import { Router, Request, Response, NextFunction } from 'express';
import {
  registerTenantSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyTotpSchema,
} from '@gymos/shared';
import { AuthService } from '../services/authService.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// 1. Register Tenant
router.post('/register', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const input = registerTenantSchema.parse(req.body);
    const result = await AuthService.registerTenant(input, {
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Unknown',
    });

    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      message: 'Gym organization and owner account successfully registered',
      data: result,
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

// 2. Login
router.post('/login', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const input = loginSchema.parse(req.body);
    const subdomain = req.headers['x-tenant-subdomain'] as string | undefined;

    const result = await AuthService.login(input, {
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Unknown',
      subdomain,
    });

    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: result,
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

// 3. Refresh Session
router.post('/refresh', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;
    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Refresh token required' },
      });
      return;
    }

    const tokens = await AuthService.refreshSession(refreshToken, {
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Unknown',
    });

    res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: 'Session refreshed successfully',
      data: tokens,
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

// 4. Logout
router.post('/logout', authMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user) {
      await AuthService.logout(req.user.userId, req.user.sessionId);
    }

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    res.json({
      success: true,
      message: 'Logged out successfully',
      data: null,
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

// 5. Forgot Password
router.post('/forgot-password', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const input = forgotPasswordSchema.parse(req.body);
    await AuthService.forgotPassword(input.email);

    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been dispatched.',
      data: null,
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

// 6. Reset Password
router.post('/reset-password', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const input = resetPasswordSchema.parse(req.body);
    await AuthService.resetPassword(input.token, input.password);

    res.json({
      success: true,
      message: 'Password has been reset successfully. Please log in with your new password.',
      data: null,
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

// 7. Verify Email
router.post('/verify-email', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.body?.token;
    if (!token) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Verification token is required' },
      });
      return;
    }

    await AuthService.verifyEmail(token);

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: null,
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

// 8. Current Authenticated Profile
router.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user,
      },
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

// 9. Session List
router.get('/sessions', authMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sessions = await AuthService.listSessions(req.user!.userId, req.user!.sessionId);
    res.json({
      success: true,
      data: sessions,
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

// 10. Revoke Session
router.delete('/sessions/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const targetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await AuthService.revokeSession(req.user!.userId, targetId);
    res.json({
      success: true,
      message: 'Session revoked successfully',
      data: null,
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

// 11. TOTP Setup
router.post('/2fa/setup', authMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const setup = await AuthService.setupTotp(req.user!.userId);
    res.json({
      success: true,
      data: setup,
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

// 12. TOTP Enable
router.post('/2fa/enable', authMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const input = verifyTotpSchema.parse(req.body);
    await AuthService.enableTotp(req.user!.userId, input.code);

    res.json({
      success: true,
      message: 'Two-Factor Authentication (TOTP) successfully activated',
      data: { enabled: true },
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

// 13. TOTP Disable
router.post('/2fa/disable', authMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await AuthService.disableTotp(req.user!.userId);
    res.json({
      success: true,
      message: 'Two-Factor Authentication disabled',
      data: { enabled: false },
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
