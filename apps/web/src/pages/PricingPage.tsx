import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card.js';
import { Check, Zap } from 'lucide-react';

export const PricingPage: React.FC = () => {
  const tiers = [
    {
      name: 'Starter Gym',
      price: '₹2,499',
      billing: '/ month billed annually',
      description: 'Ideal for independent gyms & fitness studios with up to 300 active members.',
      popular: false,
      features: [
        'Up to 300 Active Members',
        'Single Branch Location',
        'QR Code Member Check-in',
        'GST Invoice Generation',
        'Email & SMS Notifications',
        'Daily Cloud Backups',
        'Standard Email Support',
      ],
      cta: 'Start 14-Day Free Trial',
    },
    {
      name: 'Growth Studio',
      price: '₹4,999',
      billing: '/ month billed annually',
      description: 'Best for scaling fitness centers requiring biometric gates and WhatsApp automation.',
      popular: true,
      features: [
        'Up to 1,500 Active Members',
        'Up to 3 Branch Locations',
        'Biometric Device Network Bridge',
        'Official WhatsApp Business Automation',
        'AI-Powered Lead Scoring & CRM',
        'White-Label Member Web PWA',
        'Trainer Commission & Salary Payroll',
        'Priority Phone & WhatsApp Support',
      ],
      cta: 'Claim Growth Tier Trial',
    },
    {
      name: 'Franchise Enterprise',
      price: '₹9,999',
      billing: '/ month billed annually',
      description: 'Designed for fitness chains, multi-city franchise networks, and enterprise gyms.',
      popular: false,
      features: [
        'Unlimited Active Members',
        'Unlimited Branches & Franchises',
        'Central Franchise Dashboard',
        'Custom Biometric SDK Integration',
        'Full REST API & Webhook Access',
        'Dedicated Cloud Compute & Replica',
        'Custom Domain & Custom App Shell',
        'Dedicated 24/7 Account Manager',
      ],
      cta: 'Contact Enterprise Sales',
    },
  ];

  return (
    <div className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <Badge variant="outline" className="mb-4">
          Transparent Pricing
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          Predictable Pricing for High-Growth Gyms
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          No hidden onboarding fees. All plans include automated GST invoicing, member databases, and cloud security.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {tiers.map((tier, idx) => (
          <Card
            key={idx}
            className={`relative flex flex-col justify-between transition-all ${
              tier.popular
                ? 'border-brand-500 shadow-xl shadow-brand-500/10 scale-105 z-10 bg-card'
                : 'border-border/80 bg-card/60'
            }`}
          >
            {tier.popular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <Badge variant="success" className="px-3 py-1 font-bold text-xs uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5 mr-1" /> Most Popular
                </Badge>
              </div>
            )}

            <div>
              <CardHeader className="pt-8 pb-4">
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <p className="text-xs text-muted-foreground mt-2">{tier.description}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-foreground">{tier.price}</span>
                  <span className="text-xs text-muted-foreground">{tier.billing}</span>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Included Capabilities:
                </p>
                {tier.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs text-foreground/90">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </CardContent>
            </div>

            <CardFooter className="pt-6 pb-8">
              <Link to="/register" className="w-full">
                <Button
                  variant={tier.popular ? 'brand' : 'outline'}
                  className="w-full"
                  size="md"
                >
                  {tier.cta}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-16 text-center text-xs text-muted-foreground">
        * Prices shown are exclusive of 18% GST. B2B Tax invoice with your GSTIN provided automatically.
      </div>
    </div>
  );
};
