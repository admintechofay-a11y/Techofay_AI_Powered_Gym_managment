import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button.js';
import { AlertTriangle, RotateCw, Home } from 'lucide-react';

export const ServerErrorPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-destructive/10 text-destructive mb-6">
        <AlertTriangle className="h-8 w-8" />
      </div>

      <span className="font-mono text-sm font-semibold text-destructive uppercase tracking-widest">
        Error 500
      </span>
      <h1 className="mt-2 text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
        Internal Server Incident
      </h1>
      <p className="mt-3 text-base text-muted-foreground max-w-md">
        An unhandled platform condition occurred. Our operations monitor has captured the correlation ID for investigation.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
        <button onClick={() => window.location.reload()}>
          <Button variant="brand" leftIcon={<RotateCw className="w-4 h-4" />}>
            Reload Application
          </Button>
        </button>
        <Link to="/">
          <Button variant="outline" leftIcon={<Home className="w-4 h-4" />}>
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
};
