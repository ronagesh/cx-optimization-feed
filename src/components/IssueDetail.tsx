import { useState } from 'react';
import {
  ArrowLeft,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { Issue } from '../types';

interface IssueDetailProps {
  issue: Issue;
  onBack: () => void;
  onApplyFix: (issueId: string, editedArticle: string) => void;
}

function outcomeLabel(outcome: string) {
  if (outcome === 'escalated')
    return <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Escalated to human</span>;
  if (outcome === 'poor_rating')
    return <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Poor rating</span>;
  return <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Unresolved</span>;
}

function MetricExplainer({
  label,
  value,
  description,
  color,
}: {
  label: string;
  value: number;
  description: string;
  color: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-semibold text-gray-900">{value}/100</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
}

export function IssueDetail({ issue, onBack, onApplyFix }: IssueDetailProps) {
  const [editedArticle, setEditedArticle] = useState(issue.suggestedFix.proposedArticle);
  const [isEditing, setIsEditing] = useState(false);
  const [showConversations, setShowConversations] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(issue.status === 'fix_applied');

  const handleApply = () => {
    setApplying(true);
    setTimeout(() => {
      setApplied(true);
      setApplying(false);
      onApplyFix(issue.id, editedArticle);
    }, 1200);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6"
      >
        <ArrowLeft size={15} /> Back to feed
      </button>

      <div className="grid grid-cols-3 gap-8">
        {/* Left column — issue info */}
        <div className="col-span-2 space-y-6">
          {/* Title block */}
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {issue.category}
              </span>
              <span className="text-xs text-gray-400">{issue.detectedAt}</span>
            </div>
            <h1 className="font-heading font-bold text-2xl text-gray-900 leading-snug">
              {issue.title}
            </h1>
            <p className="mt-2 text-gray-600 leading-relaxed">{issue.summary}</p>
          </div>

          {/* Conversation samples */}
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              onClick={() => setShowConversations(!showConversations)}
            >
              <div className="flex items-center gap-2">
                <MessageSquare size={15} className="text-gray-400" />
                <span className="font-medium text-gray-900 text-sm">
                  Example conversations ({issue.conversationSamples.length})
                </span>
              </div>
              {showConversations ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
            </button>

            {showConversations && (
              <div className="divide-y divide-gray-50">
                {issue.conversationSamples.map((sample) => (
                  <div key={sample.id} className="px-5 py-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0 mt-0.5">
                        C
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{sample.customerMessage}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-brand-purple flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">D</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{sample.agentResponse}</p>
                    </div>
                    <div className="flex justify-end">{outcomeLabel(sample.outcome)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Suggested fix */}
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {applied ? (
                    <CheckCircle2 size={15} className="text-emerald-500" />
                  ) : (
                    <AlertTriangle size={15} className="text-amber-500" />
                  )}
                  <span className="font-medium text-gray-900 text-sm">Suggested fix</span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    Knowledge base article
                  </span>
                </div>
                {!applied && (
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    <Edit3 size={12} />
                    {isEditing ? 'Done editing' : 'Edit'}
                  </button>
                )}
              </div>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                  What's missing
                </p>
                <p className="text-sm text-gray-600">{issue.suggestedFix.currentGap}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Proposed article — {issue.suggestedFix.title}
                </p>
                {isEditing ? (
                  <textarea
                    className="w-full text-sm font-mono text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3 h-64 resize-y focus:outline-none focus:ring-2 focus:ring-brand-purple/30 focus:border-brand-purple"
                    value={editedArticle}
                    onChange={(e) => setEditedArticle(e.target.value)}
                  />
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">
                    {editedArticle}
                  </div>
                )}
              </div>

              {!applied ? (
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="w-full mt-2 py-2.5 rounded-lg bg-brand-purple text-white text-sm font-semibold hover:bg-indigo-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {applying ? 'Deploying fix…' : 'Apply fix to production'}
                </button>
              ) : (
                <div className="flex items-center gap-2 py-2.5 text-sm text-emerald-700 font-medium">
                  <CheckCircle2 size={16} />
                  Fix applied — you can track its impact in the Impact Tracker
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column — priority breakdown */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Priority Score
              </p>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl font-bold text-gray-900">{issue.priorityScore}</span>
              <span className="text-sm text-gray-400">/ 100</span>
            </div>

            <div className="space-y-4">
              <MetricExplainer
                label="How common is this?"
                value={issue.scoreBreakdown.frequency}
                description={`Affects roughly ${issue.scoreBreakdown.frequency}% of recent conversations`}
                color="bg-brand-purple"
              />
              <MetricExplainer
                label="CSAT Impact"
                value={issue.scoreBreakdown.csatImpact}
                description="How much this issue is affecting your customer satisfaction scores"
                color="bg-red-400"
              />
              <MetricExplainer
                label="Escalation Volume"
                value={issue.scoreBreakdown.deflectionImpact}
                description="How often this issue leads to conversations being handed off to a human agent"
                color="bg-amber-400"
              />
              <MetricExplainer
                label="Business impact"
                value={issue.scoreBreakdown.businessImpact}
                description="Estimated risk to revenue, refunds, or legal exposure"
                color="bg-orange-400"
              />
              <MetricExplainer
                label="How confident are we?"
                value={issue.scoreBreakdown.modelConfidence}
                description="Confidence that this is a real, fixable issue and not noise"
                color="bg-emerald-400"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
