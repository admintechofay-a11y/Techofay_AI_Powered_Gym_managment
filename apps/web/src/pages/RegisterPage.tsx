import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card.js';
import { Dumbbell, Building2, User, Mail, Phone, Lock, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [gymName, setGymName] = useState('');
  const [slug, setSlug] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGymNameChange = (name: string) => {
    setGymName(name);
    setSlug(
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
    );
  };

  // Password requirement tests
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasNumber && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    // Sanitize phone number
    let cleanPhone = phone.replace(/[\s\-()]/g, '');
    if (/^[6-9]\d{9}$/.test(cleanPhone)) {
      cleanPhone = `+91${cleanPhone}`;
    }

    if (!cleanPhone.startsWith('+')) {
      cleanPhone = `+${cleanPhone}`;
    }

    const payload = {
      gymName: gymName.trim(),
      name: gymName.trim(),
      subdomain: (slug || 'my-gym').trim().toLowerCase(),
      slug: (slug || 'my-gym').trim().toLowerCase(),
      ownerName: ownerName.trim(),
      email: email.trim().toLowerCase(),
      ownerEmail: email.trim().toLowerCase(),
      phone: cleanPhone,
      ownerPhone: cleanPhone,
      password,
      branchName: 'Main Branch',
      city: 'Mumbai',
    };

    try {
      const res = await api.post('/auth/register', payload);

      if (!res.success) {
        let msg = res.error?.message || 'Registration failed';
        if (res.error?.details && typeof res.error.details === 'object') {
          const detailMsgs = Object.entries(res.error.details)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join(' | ');
          if (detailMsgs) msg = `${msg} (${detailMsgs})`;
        }
        setErrorMessage(msg);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8 sm:py-12 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-500/10 blur-[100px] pointer-events-none rounded-full" />

      <Card className="w-full max-w-lg border-border/80 shadow-2xl relative z-10 bg-card">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white mb-3 shadow-lg shadow-brand-500/20">
            <Dumbbell className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Register Your Gym</CardTitle>
          <CardDescription>Provision your dedicated multi-tenant cloud workspace</CardDescription>
        </CardHeader>

        <CardContent>
          {errorMessage && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Gym / Brand Name"
                value={gymName}
                onChange={(e) => handleGymNameChange(e.target.value)}
                placeholder="Gold Fit Arena"
                leftIcon={<Building2 className="w-4 h-4" />}
                required
              />
              <Input
                label="Workspace Slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="gold-fit-arena"
                helperText="Subdomain identifier"
                required
              />
            </div>

            <Input
              label="Owner Full Name"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Suresh Oberoi"
              leftIcon={<User className="w-4 h-4" />}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Official Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="suresh@goldfit.in"
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />
              <Input
                label="Official Mobile"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+919876543210"
                leftIcon={<Phone className="w-4 h-4" />}
                helperText="10-digit mobile or +91 format"
                required
              />
            </div>

            <div className="space-y-2">
              <Input
                label="Account Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password@123"
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />

              {/* Password checklist */}
              {password && (
                <div className="p-2.5 rounded-lg border border-border bg-muted/30 text-[11px] grid grid-cols-2 gap-1.5">
                  <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-500 font-medium' : 'text-muted-foreground'}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${hasMinLength ? 'stroke-[2.5]' : 'opacity-40'}`} />
                    <span>8+ characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-500 font-medium' : 'text-muted-foreground'}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${hasUppercase ? 'stroke-[2.5]' : 'opacity-40'}`} />
                    <span>1 uppercase letter</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-500 font-medium' : 'text-muted-foreground'}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${hasNumber ? 'stroke-[2.5]' : 'opacity-40'}`} />
                    <span>1 number</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-500 font-medium' : 'text-muted-foreground'}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${hasSpecial ? 'stroke-[2.5]' : 'opacity-40'}`} />
                    <span>1 symbol (!@#$)</span>
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              variant="brand"
              className="w-full mt-4"
              isLoading={isLoading}
              disabled={password ? !isPasswordValid : false}
            >
              Provision Gym & Launch Console
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex-col gap-2 border-t border-border py-4 text-xs text-muted-foreground text-center">
          <div>
            Already have an existing staff account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Sign in here
            </Link>
          </div>
          <div>
            Are you a gym member looking for your pass?{' '}
            <Link to="/member-portal" className="text-brand-600 font-semibold hover:underline">
              Open Member Digital Pass
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
