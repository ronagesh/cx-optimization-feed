export type IssueStatus = 'new' | 'fix_available' | 'fix_applied';

export interface ConversationSample {
  id: string;
  customerMessage: string;
  agentResponse: string;
  outcome: 'unresolved' | 'escalated' | 'poor_rating';
}

export interface ScoreBreakdown {
  frequency: number;       // 0–100: % of conversations affected
  csatImpact: number;      // 0–100: relative impact on CSAT
  deflectionImpact: number;// 0–100: relative impact on deflection rate
  businessImpact: number;  // 0–100: financial/legal exposure
  modelConfidence: number; // 0–100: how confident the model is this is real
}

export interface SuggestedFix {
  type: 'knowledge_base';
  title: string;
  description: string;
  currentGap: string;
  proposedArticle: string;
}

export interface ImpactDataPoint {
  week: string;
  csat: number;
  deflection: number;
}

export interface Issue {
  id: string;
  title: string;
  summary: string;
  category: string;
  status: IssueStatus;
  priorityScore: number; // 0–100 aggregate
  scoreBreakdown: ScoreBreakdown;
  conversationSamples: ConversationSample[];
  suggestedFix: SuggestedFix;
  impactData: ImpactDataPoint[];
  fixAppliedWeek?: number; // index into impactData where fix was applied
  detectedAt: string;
}
