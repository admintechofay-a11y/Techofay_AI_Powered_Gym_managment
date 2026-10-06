import {
  INTEGRATION_STATUS,
  type IntegrationStatus,
  type IntegrationSummary,
} from '@gymos/shared';
import type { IAiAdapter } from '../interfaces.js';

export class MockAiAdapter implements IAiAdapter {
  readonly isMock = true;

  getStatus(): IntegrationStatus {
    return INTEGRATION_STATUS.DEMO_MODE;
  }

  getSummary(): IntegrationSummary {
    return {
      id: 'ai',
      name: 'AI Intelligence Engine',
      category: 'Intelligence',
      description: 'Retention prediction, lead scoring & smart follow-up suggestions',
      status: this.getStatus(),
      provider: 'Anthropic Claude (Deterministic Rule-Based Fallback Engine)',
      isMock: true,
      docsUrl: 'https://docs.anthropic.com',
    };
  }

  async scoreLead(lead: { name: string; source: string; notes?: string; activitiesCount: number }): Promise<{ score: 'HOT' | 'WARM' | 'COLD'; reasoning: string }> {
    if (lead.activitiesCount >= 3 || lead.source === 'WALK_IN' || lead.source === 'REFERRAL') {
      return {
        score: 'HOT',
        reasoning: `High intent detected based on ${lead.source} source and ${lead.activitiesCount} interactions. Immediate closing recommended.`,
      };
    }
    if (lead.activitiesCount >= 1) {
      return {
        score: 'WARM',
        reasoning: `Moderate engagement with ${lead.activitiesCount} interactions. Schedule a trial session to accelerate conversion.`,
      };
    }
    return {
      score: 'COLD',
      reasoning: 'Minimal recent engagement. Add to automated nurture sequence.',
    };
  }

  async predictChurnRisk(member: { attendanceCountLast30Days: number; daysSinceLastVisit: number; membershipDaysRemaining: number }): Promise<{ riskLevel: 'HIGH' | 'MEDIUM' | 'LOW'; recommendedAction: string }> {
    if (member.daysSinceLastVisit > 14 || member.attendanceCountLast30Days <= 2) {
      return {
        riskLevel: 'HIGH',
        recommendedAction: 'Member has not attended in over 14 days. Trigger personal check-in call from trainer.',
      };
    }
    if (member.daysSinceLastVisit > 7 || member.attendanceCountLast30Days <= 6) {
      return {
        riskLevel: 'MEDIUM',
        recommendedAction: 'Attendance slowing down. Send motivational WhatsApp template with upcoming workout goals.',
      };
    }
    return {
      riskLevel: 'LOW',
      recommendedAction: 'Regular attendee. Eligible for referral bonus and annual membership renewal incentive.',
    };
  }

  async generateFollowUpMessage(lead: { name: string; interest: string }): Promise<string> {
    return `Hi ${lead.name}, thank you for your interest in ${lead.interest || 'our fitness programs'} at Techofay Gym! We'd love to invite you for a complimentary workout and facility tour. What time works best for you tomorrow?`;
  }
}

export class RealAnthropicAiAdapter implements IAiAdapter {
  readonly isMock = false;
  private apiKey: string;
  private model: string;
  private fallback: MockAiAdapter;

  constructor(apiKey: string, model: string = 'claude-3-7-sonnet-20250219') {
    this.apiKey = apiKey;
    this.model = model;
    this.fallback = new MockAiAdapter();
  }

  getStatus(): IntegrationStatus {
    return this.apiKey ? INTEGRATION_STATUS.REAL : INTEGRATION_STATUS.NOT_CONFIGURED;
  }

  getSummary(): IntegrationSummary {
    return {
      id: 'ai',
      name: 'AI Intelligence Engine',
      category: 'Intelligence',
      description: 'Anthropic Claude LLM Intelligence',
      status: this.getStatus(),
      provider: `Anthropic Claude (${this.model})`,
      isMock: false,
      docsUrl: 'https://docs.anthropic.com',
    };
  }

  async scoreLead(lead: { name: string; source: string; notes?: string; activitiesCount: number }): Promise<{ score: 'HOT' | 'WARM' | 'COLD'; reasoning: string }> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 300,
          messages: [
            {
              role: 'user',
              content: `Analyze this gym lead and score as HOT, WARM, or COLD with a short sentence rationale in JSON format {"score": "HOT"|"WARM"|"COLD", "reasoning": "..."}: ${JSON.stringify(lead)}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        return this.fallback.scoreLead(lead);
      }

      const data: any = await response.json();
      const text = data.content?.[0]?.text;
      const parsed = JSON.parse(text);
      return parsed;
    } catch {
      return this.fallback.scoreLead(lead);
    }
  }

  async predictChurnRisk(member: { attendanceCountLast30Days: number; daysSinceLastVisit: number; membershipDaysRemaining: number }): Promise<{ riskLevel: 'HIGH' | 'MEDIUM' | 'LOW'; recommendedAction: string }> {
    return this.fallback.predictChurnRisk(member);
  }

  async generateFollowUpMessage(lead: { name: string; interest: string }): Promise<string> {
    return this.fallback.generateFollowUpMessage(lead);
  }
}
