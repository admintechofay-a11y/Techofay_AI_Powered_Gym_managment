import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card.js';
import { Badge } from '../components/ui/Badge.js';
import { Dumbbell, Lock, Mail, AlertCircle, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.post('/auth/login', {
        email,
        password,
        totpCode: requires2FA ? totpCode : undefined,
      });

      if (!res.success) {
        const errCode = res.error?.code;
        const errMsg = res.error?.message || '';
        if (
          errCode === 'MFA_REQUIRED' ||
          errCode === 'TOTP_REQUIRED' ||
          errMsg.toLowerCase().includes('2fa') ||
          errMsg.toLowerCase().includes('totp')
        ) {
          setRequires2FA(true);
          setErrorMessage('Two-Factor Authentication is enabled. Please enter your 6-digit TOTP code below.');
        } else {
          let msg = errMsg || 'Invalid credentials';
          if (res.error?.details && typeof res.error.details === 'object') {
            const detailMsgs = Object.entries(res.error.details)
              .map(([f, errs]) => `${f}: ${Array.isArray(errs) ? errs.join(', ') : errs}`)
              .join(' | ');
            if (detailMsgs) msg = `${msg} (${detailMsgs})`;
          }
          setErrorMessage(msg);
        }
        setIsLoading(false);
        return;
      }

      const { accessToken, refreshToken, user } = res.data;
      login(accessToken, refreshToken, user);
      navigate('/dashboard');
    } catch {
      setErrorMessage('Network connection error. Please verify the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (role: 'OWNER' | 'RECEPTIONIST' | 'TRAINER' | 'SUPER_ADMIN') => {
    if (role === 'OWNER') {
      setEmail('owner@ironpulse.com');
      setPassword('Password@123');
    } else if (role === 'RECEPTIONIST') {
      setEmail('reception@ironpulse.com');
      setPassword('Password@123');
    } else if (role === 'TRAINER') {
      setEmail('trainer@ironpulse.com');
      setPassword('Password@123');
    } else {
      setEmail('admin@techofay.com');
      setPassword('Password@123');
    }
    setRequires2FA(false);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8 sm:py-12 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-500/10 blur-[100px] pointer-events-none rounded-full" />

      <Card className="w-full max-w-md border-border/80 shadow-2xl relative z-10 bg-card">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white mb-3 shadow-lg shadow-brand-500/20">
            <Dumbbell className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Techofay GymOS</CardTitle>
          <CardDescription>Sign in to access your gym operations console</CardDescription>
        </CardHeader>

        <CardContent>
          {errorMessage && (
            <div className={`mb-5 flex items-start gap-2.5 rounded-xl border p-3 text-xs ${
              requires2FA
                ? 'border-brand-500/30 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                : 'border-destructive/30 bg-destructive/10 text-destructive'
            }`}>
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Staff Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@ironpulse.com"
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Password</label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />
            </div>

            {requires2FA && (
              <Input
                label="Authenticator 6-Digit Code (2FA)"
                type="text"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                placeholder="123456"
                autoFocus
                required
              />
            )}

            <Button type="submit" variant="brand" className="w-full mt-2" isLoading={isLoading}>
              {requires2FA ? 'Verify 2FA & Enter' : 'Sign In to Console'}
            </Button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-6 pt-5 border-t border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium mb-2.5">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                <span>Quick Demo Credentials:</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Password@123</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickFill('OWNER')}
                className="rounded-lg border border-border bg-muted/40 p-2 text-center text-[11px] font-semibold hover:bg-muted transition-colors text-foreground"
              >
                Owner
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('RECEPTIONIST')}
                className="rounded-lg border border-border bg-muted/40 p-2 text-center text-[11px] font-semibold hover:bg-muted transition-colors text-foreground"
              >
                Reception
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('TRAINER')}
                className="rounded-lg border border-border bg-muted/40 p-2 text-center text-[11px] font-semibold hover:bg-muted transition-colors text-foreground"
              >
                Trainer
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('SUPER_ADMIN')}
                className="rounded-lg border border-border bg-muted/40 p-2 text-center text-[11px] font-semibold hover:bg-muted transition-colors text-foreground"
              >
                Super Admin
              </button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex-col gap-2.5 border-t border-border py-4 text-xs text-muted-foreground text-center">
          <div>
            Need a new gym workspace?{' '}
            <Link to="/register" className="ml-1 text-primary font-semibold hover:underline">
              Register your gym
            </Link>
          </div>
          <div>
            Looking for member QR pass & workouts?{' '}
            <Link to="/member-portal" className="text-brand-600 font-semibold hover:underline">
              Open Member Digital Pass
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
