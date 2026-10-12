import React, { useState } from 'react';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { Card, CardContent } from '../components/ui/Card.js';
import { useToast } from '../components/ui/Toast.js';
import { Building2, Mail, Phone, MapPin, Send } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const { success } = useToast();
  const [name, setName] = useState('');
  const [gymName, setGymName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      success('Enquiry Submitted Successfully', 'Our solutions consultant will contact you within 2 business hours.');
      setName('');
      setGymName('');
      setPhone('');
      setEmail('');
      setMessage('');
    }, 600);
  };

  return (
    <div className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Info Column */}
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
              Talk to Our Enterprise Team
            </h1>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              Looking to deploy Techofay GymOS across your gym chain or connect existing biometric turnstiles? We provide full onboarding assistance and legacy data migration.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Mumbai Headquarters</h3>
                <p className="text-sm text-muted-foreground">
                  Level 8, Platina Tower, Bandra Kurla Complex (BKC), Mumbai, Maharashtra 400051
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Bengaluru Tech Hub</h3>
                <p className="text-sm text-muted-foreground">
                  42 100ft Road, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Direct Sales Hotline</h3>
                <p className="text-sm text-muted-foreground">
                  <a href="tel:+912269824400" className="hover:text-primary transition-colors">
                    +91 (022) 6982-4400
                  </a>{' '}
                  (Mon - Sat, 9am - 7pm IST)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Sales & Support Email</h3>
                <p className="text-sm text-muted-foreground">
                  <a href="mailto:contact@techofay.com" className="hover:text-primary transition-colors">
                    contact@techofay.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form Column */}
        <div>
          <Card className="border-border/80 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-xl font-bold text-foreground mb-6">Schedule a Consultation & Architecture Walkthrough</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Your Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Vikram Malhotra"
                  required
                />
                <Input
                  label="Gym / Brand Name"
                  value={gymName}
                  onChange={(e) => setGymName(e.target.value)}
                  placeholder="e.g. IronFit Wellness"
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Mobile Number"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    required
                  />
                  <Input
                    label="Work Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vikram@ironfit.in"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">
                    Number of Branches & Special Requirements
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us about your setup, current member count, and biometric hardware..."
                    className="block w-full rounded-lg border border-input bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="brand"
                  className="w-full mt-4"
                  isLoading={isSubmitting}
                  rightIcon={<Send className="w-4 h-4" />}
                >
                  Submit Consultation Request
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
