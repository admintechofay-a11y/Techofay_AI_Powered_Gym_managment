import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card.js';
import { Dumbbell, Building2, User, Mail, Phone, Lock, AlertCircle } from 'lucide-react';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.post('/auth/register-tenant', {
        name: gymName,
        slug: slug || 'my-gym',
        ownerName,
        ownerEmail: email,
        ownerPhone: phone,
        password,
      });

      if (!res.success) {
        setErrorMessage(res.error?.message || 'Registration failed');
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
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
                onChange={(e) => setSlug(e.target.value)}
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
                placeholder="+91 98765 43210"
                leftIcon={<Phone className="w-4 h-4" />}
                required
              />
            </div>

            <Input
              label="Account Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              leftIcon={<Lock className="w-4 h-4" />}
              helperText="Must contain uppercase, lowercase, and a number"
              required
            />

            <Button type="submit" variant="brand" className="w-full mt-4" isLoading={isLoading}>
              Provision Gym & Launch Console
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center border-t border-border py-4 text-xs text-muted-foreground">
          Already have an existing account?{' '}
          <Link to="/login" className="ml-1 text-primary font-semibold hover:underline">
            Sign in here
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};
