import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import crypto from 'node:crypto';
import { Types } from 'mongoose';
import {
  USER_ROLES,
  TENANT_STATUS,
  type RegisterTenantInput,
  type LoginInput,
  type JwtTokenPayload,
  type AuthResponse,
  type ActiveSession,
  type TotpSetupResponse,
} from '@gymos/shared';
import { env } from '../config/env.js';
import { Tenant } from '../models/Tenant.js';
import { Branch } from '../models/Branch.js';
import { User, type IUser } from '../models/User.js';
import { LoginHistory } from '../models/LoginHistory.js';
import { AuditLogService } from './auditLogService.js';
import { integrations } from '../integrations/index.js';

export class AuthService {
  public static async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
    });
  }

  public static async verifyPassword(hash: string, plain: string): Promise<boolean> {
    return argon2.verify(hash, plain);
  }

  public static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  public static generateTokens(payload: JwtTokenPayload): { accessToken: string; refreshToken: string } {
    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
    });

    const refreshToken = jwt.sign(
      { userId: payload.userId, sessionId: payload.sessionId },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN as any },
    );

    return { accessToken, refreshToken };
  }

  public static async registerTenant(
    input: RegisterTenantInput,
    meta: { ipAddress: string; userAgent: string },
  ): Promise<AuthResponse> {
    // 1. Check if subdomain is already taken
    const existingTenant = await Tenant.findOne({ subdomain: input.subdomain.toLowerCase() });
    if (existingTenant) {
      const err: any = new Error('Subdomain is already taken by another gym');
      err.statusCode = 409;
      throw err;
    }

    // 2. Create Tenant
    const tenant = await Tenant.create({
      name: input.gymName,
      subdomain: input.subdomain.toLowerCase(),
      status: TENANT_STATUS.ACTIVE,
      contactEmail: input.email.toLowerCase(),
      contactPhone: input.phone,
      settings: {
        currency: 'INR',
        timezone: 'Asia/Kolkata',
      },
    });

    // 3. Create Main Branch
    const branch = await Branch.create({
      tenantId: tenant._id,
      name: input.branchName || 'Main Branch',
      code: 'MAIN',
      address: `${input.city || 'Downtown'}, Main Road`,
      city: input.city || 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      phone: input.phone,
      email: input.email.toLowerCase(),
      operatingHours: { openingTime: '06:00', closingTime: '22:00' },
      facilities: ['Cardio', 'Strength', 'Locker Room'],
    });

    // 4. Create Owner User
    const passwordHash = await this.hashPassword(input.password);
    const sessionId = crypto.randomUUID();
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      tenantId: tenant._id,
      branchIds: [branch._id],
      name: input.ownerName,
      email: input.email.toLowerCase(),
      phone: input.phone,
      passwordHash,
      role: USER_ROLES.GYM_OWNER,
      isEmailVerified: false,
      emailVerificationToken: this.hashToken(verificationToken),
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      sessions: [],
    });

    // 5. Generate tokens and session
    const tokenPayload: JwtTokenPayload = {
      userId: user._id.toString(),
      tenantId: tenant._id.toString(),
      branchId: branch._id.toString(),
      role: USER_ROLES.GYM_OWNER,
      email: user.email,
      sessionId,
    };

    const { accessToken, refreshToken } = this.generateTokens(tokenPayload);
    const refreshTokenHash = this.hashToken(refreshToken);

    user.sessions.push({
      sessionId,
      refreshTokenHash,
      device: meta.userAgent,
      browser: 'Web App',
      ipAddress: meta.ipAddress,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    user.lastLoginAt = new Date();
    await user.save();

    // 6. Record audit log & email
    await AuditLogService.record({
      tenantId: tenant._id,
      userId: user._id,
      userEmail: user.email,
      userRole: USER_ROLES.GYM_OWNER,
      action: 'TENANT_REGISTERED',
      entity: 'Tenant',
      entityId: tenant._id,
      afterSnapshot: { tenantName: tenant.name, subdomain: tenant.subdomain },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    // Send verification email via integration adapter
    await integrations.email.sendEmail(
      user.email,
      'Welcome to Techofay GymOS - Verify Your Email',
      `<p>Hi ${user.name}, welcome to Techofay GymOS! Please verify your email with token: <b>${verificationToken}</b></p>`,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        tenantId: tenant._id.toString(),
        branchId: branch._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        totpEnabled: user.totpEnabled,
      },
      tenant: {
        id: tenant._id.toString(),
        name: tenant.name,
        subdomain: tenant.subdomain,
        currency: tenant.settings?.currency || 'INR',
      },
    };
  }

  public static async login(
    input: LoginInput,
    meta: { ipAddress: string; userAgent: string; subdomain?: string },
  ): Promise<AuthResponse> {
    const email = input.email.toLowerCase().trim();

    // Lookup user bypassing tenant isolation since we are establishing tenant context
    const userQuery: any = { email };
    if (meta.subdomain) {
      const tenant = await Tenant.findOne({ subdomain: meta.subdomain.toLowerCase() });
      if (tenant) {
        userQuery.tenantId = tenant._id;
      }
    }

    const user = await User.findOne(userQuery, null, {
      bypassTenantIsolation: true,
      sort: { _id: -1 },
    });

    if (!user) {
      const err: any = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    // Check account lockout
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / (60 * 1000));
      await LoginHistory.create({
        tenantId: user.tenantId,
        userId: user._id,
        email: user.email,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        status: 'LOCKED_OUT',
        failureReason: `Account temporarily locked due to repeated failed attempts. Retry in ${remainingMinutes}m`,
      });
      const err: any = new Error(
        `Account locked due to consecutive failed attempts. Please retry after ${remainingMinutes} minute(s).`,
      );
      err.statusCode = 429;
      throw err;
    }

    // Verify Password
    const isPasswordValid = await this.verifyPassword(user.passwordHash, input.password);
    if (!isPasswordValid) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      let status: 'FAILURE' | 'LOCKED_OUT' = 'FAILURE';

      if (user.failedLoginAttempts >= 5) {
        user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
        status = 'LOCKED_OUT';
      }
      await user.save({ validateBeforeSave: false });

      await LoginHistory.create({
        tenantId: user.tenantId,
        userId: user._id,
        email: user.email,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        status,
        failureReason: 'Invalid password credential',
      });

      const err: any = new Error(
        status === 'LOCKED_OUT'
          ? 'Too many failed login attempts. Your account has been temporarily locked for 15 minutes.'
          : 'Invalid email or password',
      );
      err.statusCode = status === 'LOCKED_OUT' ? 429 : 401;
      throw err;
    }

    // Check TOTP 2FA if enabled
    if (user.totpEnabled) {
      if (!input.totpCode) {
        const err: any = new Error('TOTP 2FA verification code required');
        err.statusCode = 403;
        err.code = 'TOTP_REQUIRED';
        throw err;
      }
      const isTotpValid = authenticator.check(input.totpCode, user.totpSecret || '');
      if (!isTotpValid) {
        const err: any = new Error('Invalid 2FA verification code');
        err.statusCode = 401;
        throw err;
      }
    }

    // Reset failed login counter on success
    user.failedLoginAttempts = 0;
    user.lockoutUntil = undefined;
    user.lastLoginAt = new Date();

    const tenant = await Tenant.findById(user.tenantId);
    if (!tenant || tenant.status === 'SUSPENDED') {
      const err: any = new Error('Your gym organization account is suspended. Contact support.');
      err.statusCode = 403;
      throw err;
    }

    // Generate tokens and session
    const sessionId = crypto.randomUUID();
    const tokenPayload: JwtTokenPayload = {
      userId: user._id.toString(),
      tenantId: tenant._id.toString(),
      branchId: user.branchIds?.[0]?.toString(),
      role: user.role,
      email: user.email,
      sessionId,
    };

    const { accessToken, refreshToken } = this.generateTokens(tokenPayload);
    const refreshTokenHash = this.hashToken(refreshToken);

    user.sessions.push({
      sessionId,
      refreshTokenHash,
      device: meta.userAgent || 'Web App',
      browser: 'Web App',
      ipAddress: meta.ipAddress,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Prune expired sessions (keep at most 10 active)
    user.sessions = user.sessions.filter((s) => s.expiresAt > new Date()).slice(-10);
    await user.save({ validateBeforeSave: false });

    // Record success in LoginHistory
    await LoginHistory.create({
      tenantId: tenant._id,
      userId: user._id,
      email: user.email,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      status: 'SUCCESS',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        tenantId: tenant._id.toString(),
        branchId: user.branchIds?.[0]?.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        totpEnabled: user.totpEnabled,
      },
      tenant: {
        id: tenant._id.toString(),
        name: tenant.name,
        subdomain: tenant.subdomain,
        currency: tenant.settings?.currency || 'INR',
      },
    };
  }

  public static async refreshSession(
    refreshTokenString: string,
    meta: { ipAddress: string; userAgent: string },
  ): Promise<{ accessToken: string; refreshToken: string }> {
    let decoded: any;
    try {
      decoded = jwt.verify(refreshTokenString, env.JWT_REFRESH_SECRET);
    } catch {
      const err: any = new Error('Invalid or expired refresh token');
      err.statusCode = 401;
      throw err;
    }

    const user = await User.findById(decoded.userId, null, { bypassTenantIsolation: true });
    if (!user) {
      const err: any = new Error('User not found');
      err.statusCode = 401;
      throw err;
    }

    const incomingHash = this.hashToken(refreshTokenString);
    const sessionIndex = user.sessions.findIndex(
      (s) => s.sessionId === decoded.sessionId && s.refreshTokenHash === incomingHash,
    );

    if (sessionIndex === -1) {
      // Possible token reuse attack: revoke all user sessions
      user.sessions = [];
      await user.save({ validateBeforeSave: false });
      const err: any = new Error('Invalid refresh token detected. All sessions terminated for security.');
      err.statusCode = 401;
      throw err;
    }

    // Refresh Rotation: issue new pair and update session hash
    const newSessionId = crypto.randomUUID();
    const tokenPayload: JwtTokenPayload = {
      userId: user._id.toString(),
      tenantId: user.tenantId.toString(),
      branchId: user.branchIds?.[0]?.toString(),
      role: user.role,
      email: user.email,
      sessionId: newSessionId,
    };

    const tokens = this.generateTokens(tokenPayload);
    const newHash = this.hashToken(tokens.refreshToken);

    user.sessions[sessionIndex] = {
      sessionId: newSessionId,
      refreshTokenHash: newHash,
      device: meta.userAgent,
      browser: 'Web App',
      ipAddress: meta.ipAddress,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    await user.save({ validateBeforeSave: false });

    return tokens;
  }

  public static async logout(userId: string, sessionId?: string): Promise<void> {
    const user = await User.findById(userId, null, { bypassTenantIsolation: true });
    if (!user) return;

    if (sessionId) {
      user.sessions = user.sessions.filter((s) => s.sessionId !== sessionId);
    } else {
      user.sessions = [];
    }
    await user.save({ validateBeforeSave: false });
  }

  public static async forgotPassword(email: string): Promise<void> {
    const user = await User.findOne({ email: email.toLowerCase().trim() }, null, {
      bypassTenantIsolation: true,
    });
    if (!user) return; // Silent return to prevent email enumeration

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = this.hashToken(resetToken);
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    await integrations.email.sendEmail(
      user.email,
      'Reset Your Techofay GymOS Password',
      `<p>Hi ${user.name}, you requested a password reset. Use this token: <b>${resetToken}</b> to reset your password.</p>`,
    );
  }

  public static async resetPassword(token: string, newPass: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    const user = await User.findOne(
      {
        passwordResetToken: tokenHash,
        passwordResetExpires: { $gt: new Date() },
      },
      null,
      { bypassTenantIsolation: true },
    );

    if (!user) {
      const err: any = new Error('Invalid or expired password reset token');
      err.statusCode = 400;
      throw err;
    }

    user.passwordHash = await this.hashPassword(newPass);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.sessions = []; // Revoke all active sessions on password reset
    await user.save({ validateBeforeSave: false });
  }

  public static async verifyEmail(token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    const user = await User.findOne(
      {
        emailVerificationToken: tokenHash,
        emailVerificationExpires: { $gt: new Date() },
      },
      null,
      { bypassTenantIsolation: true },
    );

    if (!user) {
      const err: any = new Error('Invalid or expired email verification token');
      err.statusCode = 400;
      throw err;
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });
  }

  public static async setupTotp(userId: string): Promise<TotpSetupResponse> {
    const user = await User.findById(userId, null, { bypassTenantIsolation: true });
    if (!user) {
      const err: any = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    const secret = authenticator.generateSecret();
    user.totpSecret = secret;
    await user.save({ validateBeforeSave: false });

    const otpauth = authenticator.keyuri(user.email, 'Techofay GymOS', secret);
    const qrCodeUrl = await qrcode.toDataURL(otpauth);

    const recoveryCodes = Array.from({ length: 6 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase(),
    );
    user.totpRecoveryCodes = recoveryCodes.map((code) => this.hashToken(code));
    await user.save({ validateBeforeSave: false });

    return { secret, qrCodeUrl, recoveryCodes };
  }

  public static async enableTotp(userId: string, code: string): Promise<boolean> {
    const user = await User.findById(userId, null, { bypassTenantIsolation: true });
    if (!user || !user.totpSecret) {
      const err: any = new Error('2FA setup not initiated');
      err.statusCode = 400;
      throw err;
    }

    const isValid = authenticator.check(code, user.totpSecret);
    if (!isValid) {
      const err: any = new Error('Invalid verification code');
      err.statusCode = 400;
      throw err;
    }

    user.totpEnabled = true;
    await user.save({ validateBeforeSave: false });
    return true;
  }

  public static async disableTotp(userId: string): Promise<void> {
    const user = await User.findById(userId, null, { bypassTenantIsolation: true });
    if (!user) return;
    user.totpEnabled = false;
    user.totpSecret = undefined;
    user.totpRecoveryCodes = [];
    await user.save({ validateBeforeSave: false });
  }

  public static async listSessions(userId: string, currentSessionId?: string): Promise<ActiveSession[]> {
    const user = await User.findById(userId, null, { bypassTenantIsolation: true });
    if (!user) return [];

    return user.sessions.map((s) => ({
      id: s.sessionId,
      device: s.device || 'Desktop',
      browser: s.browser || 'Web App',
      ipAddress: s.ipAddress,
      lastActive: s.createdAt.toISOString(),
      isCurrent: s.sessionId === currentSessionId,
      createdAt: s.createdAt.toISOString(),
    }));
  }

  public static async revokeSession(userId: string, sessionIdToRevoke: string): Promise<void> {
    const user = await User.findById(userId, null, { bypassTenantIsolation: true });
    if (!user) return;
    user.sessions = user.sessions.filter((s) => s.sessionId !== sessionIdToRevoke);
    await user.save({ validateBeforeSave: false });
  }
}
