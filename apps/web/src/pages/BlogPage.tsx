import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/Card.js';
import { Badge } from '../components/ui/Badge.js';
import { Input } from '../components/ui/Input.js';
import { Button } from '../components/ui/Button.js';
import {
  BookOpen,
  Calendar,
  Clock,
  ArrowRight,
  Search,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Receipt,
  Building2,
  Tag,
} from 'lucide-react';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: 'Billing & GST' | 'Access Control' | 'DPDP & Legal' | 'Multi-Branch' | 'AI & CRM';
  author: {
    name: string;
    role: string;
  };
  publishedAt: string;
  readTimeMin: number;
  featured?: boolean;
}

export const BlogPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const posts: BlogPost[] = [
    {
      id: 'post-1',
      slug: 'automated-gst-invoicing-gyms-india',
      title: 'How Automated GST Invoicing and UPI Autopay Reduced Payment Churn by 42%',
      summary:
        'Managing gym subscriptions manually in India leads to cash leakage, missing SAC 9997 tax splits, and awkward renewal conversations. Here is how modern gym franchises automate collections.',
      category: 'Billing & GST',
      author: {
        name: 'Rohan Deshmukh',
        role: 'Chief Revenue Architect, Techofay',
      },
      publishedAt: '02 Oct 2026',
      readTimeMin: 6,
      featured: true,
    },
    {
      id: 'post-2',
      slug: 'dpdp-act-2023-compliance-gyms-india',
      title: 'DPDP Act 2023 Compliance Blueprint for Indian Gym Owners and Fitness Studios',
      summary:
        'Biometric fingerprint records and health assessment metrics classify as sensitive personal data. Understand statutory retention rules, data principal rights, and consent notice requirements.',
      category: 'DPDP & Legal',
      author: {
        name: 'Adv. Meenakshi Sundaram',
        role: 'Data Protection & Regulatory Counsel',
      },
      publishedAt: '28 Sep 2026',
      readTimeMin: 9,
      featured: true,
    },
    {
      id: 'post-3',
      slug: 'biometrics-vs-dynamic-qr-turnstiles',
      title: 'Biometrics vs. Dynamic QR Turnstiles: Zero-Fraud Access Control in 2026',
      summary:
        'Why screenshot sharing defeats static barcode readers, and how 30-second rotating HMAC-signed QR tokens eliminate gate pass borrowing while maintaining sub-second turnstile throughput.',
      category: 'Access Control',
      author: {
        name: 'Karan Shenoy',
        role: 'Hardware Systems Lead',
      },
      publishedAt: '21 Sep 2026',
      readTimeMin: 5,
    },
    {
      id: 'post-4',
      slug: 'multi-branch-gym-scaling-architecture',
      title: 'Scaling from 1 Flagship to 50 Locations Without Operational Chaos',
      summary:
        'Consolidated P&L statements, atomic supplement inventory transfers, and cross-branch membership reciprocity without cross-tenant database leakage.',
      category: 'Multi-Branch',
      author: {
        name: 'Ananya Roy',
        role: 'VP Operations, Techofay GymOS',
      },
      publishedAt: '15 Sep 2026',
      readTimeMin: 7,
    },
    {
      id: 'post-5',
      slug: 'ai-lead-scoring-fitness-studios',
      title: 'AI Lead Scoring: Converting WhatsApp Walk-ins Before They Walk Away',
      summary:
        'How evaluating inquiry speed, channel origin, and workout preferences helps sales counsellors prioritize hot leads and convert 3.2x more trial memberships.',
      category: 'AI & CRM',
      author: {
        name: 'Vikram Joshi',
        role: 'Machine Learning Architect',
      },
      publishedAt: '08 Sep 2026',
      readTimeMin: 8,
    },
  ];

  const categories = ['ALL', 'Billing & GST', 'Access Control', 'DPDP & Legal', 'Multi-Branch', 'AI & CRM'];

  const filteredPosts = posts.filter((post) => {
    const matchesCategory = selectedCategory === 'ALL' || post.category === selectedCategory;
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredPost = posts.find((p) => p.featured) || posts[0];

  return (
    <div className="py-12 md:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-semibold uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Techofay GymOS Publications</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          Fitness Business & Technology Intelligence
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          Actionable guides on GST compliance, biometric access hardware, member retention AI, and multi-branch gym economics in India.
        </p>
      </div>

      {/* Featured Article Card */}
      {featuredPost && (
        <div className="rounded-3xl border border-brand-500/30 bg-gradient-to-br from-brand-500/10 via-card to-background p-6 md:p-10 shadow-lg relative overflow-hidden">
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-brand-500/20 text-brand-600 border-brand-500/30 text-xs">
                Featured Analysis
              </Badge>
              <Badge variant="outline" className="text-xs">
                {featuredPost.category}
              </Badge>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight hover:text-brand-600 transition-colors cursor-pointer">
              {featuredPost.title}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {featuredPost.summary}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2">
              <span className="font-semibold text-foreground">{featuredPost.author.name}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {featuredPost.publishedAt}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {featuredPost.readTimeMin} min read
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Search & Category Filter */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search articles & topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Article Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.map((post) => (
          <Card
            key={post.id}
            className="border-border hover:border-brand-500/40 transition-all hover:shadow-md flex flex-col justify-between"
          >
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[11px]">
                  {post.category}
                </Badge>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {post.readTimeMin} min
                </span>
              </div>

              <h3 className="text-base font-bold text-foreground leading-snug hover:text-brand-600 transition-colors cursor-pointer">
                {post.title}
              </h3>

              <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                {post.summary}
              </p>

              <div className="pt-4 border-t border-border flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-foreground text-[11px]">{post.author.name}</div>
                  <div className="text-[10px] text-muted-foreground">{post.publishedAt}</div>
                </div>
                <span className="text-brand-600 font-bold flex items-center gap-1 text-[11px] hover:translate-x-0.5 transition-transform cursor-pointer">
                  Read Guide <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BlogPage;
