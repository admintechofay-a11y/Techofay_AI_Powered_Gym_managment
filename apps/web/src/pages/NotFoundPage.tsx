import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button.js';
import { Dumbbell, Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-muted text-muted-foreground mb-6">
        <Dumbbell className="h-8 w-8 text-primary" />
      </div>

      <span className="font-mono text-sm font-semibold text-primary uppercase tracking-widest">
        Error 404
      </span>
      <h1 className="mt-2 text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
        Page Not Found
      </h1>
      <p className="mt-3 text-base text-muted-foreground max-w-md">
        The destination you are looking for has been relocated, unlinked, or does not exist on this gym instance.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
        <Link to="/">
          <Button variant="brand" leftIcon={<Home className="w-4 h-4" />}>
            Back to Public Home
          </Button>
        </Link>
        <Link to="/dashboard">
          <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Staff Console
          </Button>
        </Link>
      </div>
    </div>
  );
};
