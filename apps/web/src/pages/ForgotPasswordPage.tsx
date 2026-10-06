import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card.js';
import { Dumbbell, Mail, CheckCircle2, ArrowLeft } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
    } catch {
      // Intentionally do not leak email existence
    } finally {
      setIsLoading(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      <Card className="w-full max-w-md border-border/80 shadow-2xl relative z-10 bg-card">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white mb-3 shadow-lg shadow-brand-500/20">
            <Dumbbell className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription>
            Enter your registered staff email address to receive recovery instructions
          </CardDescription>
        </CardHeader>

        <CardContent>
          {submitted ? (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-sm text-foreground font-medium">Recovery Instructions Sent</p>
              <p className="text-xs text-muted-foreground">
                If an active account exists for <span className="font-semibold text-foreground">{email}</span>, a secure password reset link has been dispatched.
              </p>
              <Link to="/login" className="inline-block mt-4">
                <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Registered Staff Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@powerfit.in"
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <Button type="submit" variant="brand" className="w-full mt-2" isLoading={isLoading}>
                Send Password Reset Email
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="justify-center border-t border-border py-4 text-xs text-muted-foreground">
          Remembered your password?{' '}
          <Link to="/login" className="ml-1 text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};
