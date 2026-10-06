import type { UserRole } from '../constants/roles.js';

export interface JwtTokenPayload {
  userId: string;
  tenantId: string;
  role: UserRole;
  branchId?: string;
  email: string;
  sessionId: string;
}

export interface AuthUser {
  id: string;
  tenantId: string;
  branchId?: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  isEmailVerified: boolean;
  totpEnabled: boolean;
  permissions?: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
  tenant: {
    id: string;
    name: string;
    subdomain: string;
    currency: string;
  };
}

export interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  ipAddress: string;
  lastActive: string;
  isCurrent: boolean;
  createdAt: string;
}

export interface TotpSetupResponse {
  secret: string;
  qrCodeUrl: string;
  recoveryCodes: string[];
}
