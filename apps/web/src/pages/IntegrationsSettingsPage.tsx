import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card.js';
import { Badge } from '../components/ui/Badge.js';
import { Button } from '../components/ui/Button.js';
import { useToast } from '../components/ui/Toast.js';
import {
  CreditCard,
  MessageSquare,
  Smartphone,
  Mail,
  HardDrive,
  BellRing,
  Cpu,
  ScanFace,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCw,
} from 'lucide-react';

interface IntegrationSummary {
  id: string;
  name: string;
  status: 'REAL' | 'DEMO' | 'NOT_CONFIGURED';
  mode: string;
  provider: string;
  description: string;
}

export const IntegrationsSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { success, error: toastError } = useToast();

  const [integrationsList, setIntegrationsList] = useState<IntegrationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  const icons: Record<string, any> = {
    payments: CreditCard,
    whatsapp: MessageSquare,
    sms: Smartphone,
    email: Mail,
    storage: HardDrive,
    push: BellRing,
    ai: Cpu,
    biometric: ScanFace,
  };

  const fetchIntegrations = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<IntegrationSummary[]>('/integrations');
      if (res.success && res.data) {
        setIntegrationsList(res.data);
      } else {
        // Fallback to initial display list if offline
        setIntegrationsList([
          {
            id: 'payments',
            name: 'Payment Gateway',
            status: 'DEMO',
            mode: 'Mock Razorpay Sandbox',
            provider: 'Razorpay Orders API',
            description: 'Order generation, webhook signature validation, UPI and card checkout.',
          },
          {
            id: 'whatsapp',
            name: 'WhatsApp Business API',
            status: 'DEMO',
            mode: 'Mock WhatsApp Adapter',
            provider: 'Meta Cloud API v19.0',
            description: 'Automated renewal alerts, payment links, and biometric entry confirmations.',
          },
          {
            id: 'sms',
            name: 'Transactional SMS',
            status: 'DEMO',
            mode: 'Mock SMS Gateway',
            provider: 'Fast2SMS / Twilio',
            description: 'DLT-registered OTP and member login verification codes.',
          },
          {
            id: 'email',
            name: 'Transactional Email',
            status: 'REAL',
            mode: 'Real Mailpit SMTP',
            provider: 'Mailpit / SMTP (Port 1025)',
            description: 'Tax invoices with PDF attachments and staff password resets.',
          },
          {
            id: 'storage',
            name: 'Object Storage Vault',
            status: 'REAL',
            mode: 'Real MinIO S3',
            provider: 'MinIO S3 Compatible',
            description: 'Encrypted document vault for Aadhaar cards, profile photos, and contracts.',
          },
          {
            id: 'push',
            name: 'Browser Web Push',
            status: 'DEMO',
            mode: 'Mock Web Push',
            provider: 'VAPID Web Push',
            description: 'Instant gym floor capacity threshold alerts and class schedule updates.',
          },
          {
            id: 'ai',
            name: 'Intelligence & LLM',
            status: 'DEMO',
            mode: 'Mock AI Engine',
            provider: 'Anthropic Claude 3.5 Sonnet',
            description: 'Automated lead scoring, workout plan generator, and churn prediction.',
          },
          {
            id: 'biometric',
            name: 'Turnstile & Biometric',
            status: 'DEMO',
            mode: 'Mock Turnstile Simulator',
            provider: 'ZKTeco Push SDK / eSSL',
            description: 'Hardware bridge verifying fingerprint, face, and RFID badge check-ins.',
          },
        ]);
      }
    } catch {
      toastError('Failed to load live integration status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleRunDiagnostic = async (id: string) => {
    setTestingId(id);
    try {
      const res = await api.post(`/integrations/${id}/test`);
      if (res.success) {
        setTestResults((prev) => ({ ...prev, [id]: res.data }));
        success(`Diagnostic Passed: ${id}`, res.message || 'Adapter returned healthy handshake');
      } else {
        toastError(`Diagnostic Failed: ${id}`, res.error?.message || 'Could not verify adapter');
      }
    } catch {
      toastError(`Diagnostic Failed: ${id}`, 'Network error communicating with API');
    } finally {
      setTestingId(null);
    }
  };

  const getStatusBadge = (status: 'REAL' | 'DEMO' | 'NOT_CONFIGURED') => {
    switch (status) {
      case 'REAL':
        return <Badge variant="success">Real Mode</Badge>;
      case 'DEMO':
        return <Badge variant="warning">Demo Mode</Badge>;
      default:
        return <Badge variant="destructive">Not Configured</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('integrations.title')}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{t('integrations.subtitle')}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchIntegrations}
          leftIcon={<RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
        >
          Refresh Status
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {integrationsList.map((item) => {
          const Icon = icons[item.id] || CreditCard;
          const isTesting = testingId === item.id;
          const diagnosticOutput = testResults[item.id];

          return (
            <Card key={item.id} className="border-border/80 shadow-sm flex flex-col justify-between">
              <div>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    {getStatusBadge(item.status)}
                  </div>
                  <CardTitle className="text-base mt-3">{item.name}</CardTitle>
                  <CardDescription className="text-xs">
                    Provider: <span className="font-semibold text-foreground">{item.provider}</span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                  <div className="rounded-lg bg-muted/50 p-2 text-[11px] font-mono text-muted-foreground">
                    Runtime: <span className="text-foreground">{item.mode}</span>
                  </div>

                  {diagnosticOutput && (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Diagnostic Output:</span>
                      </div>
                      <pre className="text-[10px] text-foreground font-mono overflow-x-auto max-h-24">
                        {JSON.stringify(diagnosticOutput, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </div>

              <CardFooter className="pt-3 border-t border-border/60">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  isLoading={isTesting}
                  onClick={() => handleRunDiagnostic(item.id)}
                  leftIcon={<Play className="w-3.5 h-3.5 text-primary" />}
                >
                  {isTesting ? t('integrations.runningTest') : t('integrations.testButton')}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
