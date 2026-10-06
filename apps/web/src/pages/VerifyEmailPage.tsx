import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { Button } from '../components/ui/Button.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card.js';
import { Dumbbell, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided in request');
      return;
    }

    api
      .post('/auth/verify-email', { token })
      .then((res) => {
        if (res.success) {
          setStatus('success');
          setMessage('Your email address has been verified successfully.');
        } else {
          setStatus('error');
          setMessage(res.error?.message || 'Verification token has expired or is invalid.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Failed to reach verification service.');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      <Card className="w-full max-w-md border-border/80 shadow-2xl relative z-10 bg-card text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white mb-3 shadow-lg shadow-brand-500/20">
            <Dumbbell className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
          <CardDescription>Validating your staff email credentials</CardDescription>
        </CardHeader>

        <CardContent className="py-6">
          {status === 'verifying' && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Confirming verification token with security vault...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">Email Confirmed</p>
              <p className="text-xs text-muted-foreground">{message}</p>
              <Link to="/login" className="inline-block mt-4">
                <Button variant="brand" size="sm">
                  Continue to Sign In
                </Button>
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertCircle className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-destructive">Verification Failed</p>
              <p className="text-xs text-muted-foreground">{message}</p>
              <Link to="/login" className="inline-block mt-4">
                <Button variant="outline" size="sm">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          )}
        </CardContent>

        <CardFooter className="justify-center border-t border-border py-4 text-xs text-muted-foreground">
          Techofay GymOS Identity Service
        </CardFooter>
      </Card>
    </div>
  );
};
