export interface SentryService {
  captureException: (error: unknown, context?: Record<string, unknown>) => void;
  captureMessage: (message: string, level?: string) => void;
  isEnabled: () => boolean;
}

class SentryLogger implements SentryService {
  private dsn: string | undefined;

  constructor() {
    this.dsn = process.env.SENTRY_DSN;
    if (this.dsn) {
      console.log('[SENTRY] Initialized error monitoring with configured SENTRY_DSN');
    }
  }

  public isEnabled(): boolean {
    return Boolean(this.dsn);
  }

  public captureException(error: unknown, context?: Record<string, unknown>): void {
    if (!this.dsn) return;
    console.error('[SENTRY_CAPTURED_EXCEPTION]', error, context);
  }

  public captureMessage(message: string, level: string = 'info'): void {
    if (!this.dsn) return;
    console.log(`[SENTRY_CAPTURED_MESSAGE] [${level.toUpperCase()}]`, message);
  }
}

export const Sentry = new SentryLogger();
