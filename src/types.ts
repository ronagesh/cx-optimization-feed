export type IssueStatus = 'new' | 'fix_available' | 'fix_applied';

export interface ConversationSample {
  id: string;
  customerMessage: string;
  agentResponse: string;
  improvedResponse?: string; // how the bot would answer with the fix applied
  outcome: 'unresolved' | 'escalated' | 'poor_rating';
}

export interface ScoreBreakdown {
  frequency: number;        // 0–100: % of conversations affected
  csatImpact: number;       // 0–100: relative impact on CSAT
  deflectionImpact: number; // 0–100: relative impact on deflection rate
  businessImpact: number;   // 0–100: financial/legal exposure
  fixEffort: number;        // 0–100: estimated effort to implement the fix (lower = easier)
  confidenceScore: number;  // 0–100: how confident the model is this is a real, fixable issue
}

export interface FixVariable {
  key: string;       // token in article, e.g. "returnWindow"
  label: string;     // shown to user, e.g. "Return window"
  placeholder: string; // input hint, e.g. "e.g. 30 days"
}

export interface SuggestedFix {
  type: 'knowledge_base';
  title: string;
  description: string;
  currentGap: string;
  proposedArticle: string;
  variables?: FixVariable[];
}

export interface ImpactDataPoint {
  date: string; // formatted "Mar 1"
  csat: number;
  deflection: number;
}

export interface Issue {
  id: string;
  title: string;
  summary: string;
  category: string;
  productLine: string;
  status: IssueStatus;
  priorityScore: number; // 0–100 aggregate
  scoreBreakdown: ScoreBreakdown;
  conversationSamples: ConversationSample[];
  suggestedFix: SuggestedFix;
  impactData: ImpactDataPoint[];
  fixAppliedIndex?: number; // index into impactData where fix was applied
  detectedAt: string;
  detectedDate?: string;   // ISO date string, e.g. "2026-03-03"
  fixAppliedDate?: string; // ISO date string, e.g. "2026-03-31"
  sampleSize?: number;     // total conversations in the measured window
}
