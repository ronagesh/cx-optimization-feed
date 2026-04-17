import { useState } from 'react';
import {
  ArrowLeft,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  ChevronDown,
  ChevronUp,
  Rocket,
  FlaskConical,
} from 'lucide-react';
import type { Issue } from '../types';

interface IssueDetailProps {
  issue: Issue;
  onBack: () => void;
  onApplyFix: (issueId: string, editedArticle: string) => void;
}

type FixStage = 'idle' | 'staged' | 'deployed';

function outcomeLabel(outcome: string) {
  if (outcome === 'escalated')
    return <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Escalated to human</span>;
  if (outcome === 'poor_rating')
    return <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Poor rating</span>;
  return <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Unresolved</span>;
}

function levelLabel(value: number) {
  if (value >= 70) return <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">High</span>;
  if (value >= 40) return <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Medium</span>;
  return <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Low</span>;
}

function effortLabel(value: number) {
  // fixEffort: lower = easier
  if (value <= 30) return <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Easy</span>;
  if (value <= 60) return <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Moderate</span>;
  return <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Complex</span>;
}

function MetricExplainer({
  label,
  badge,
  description,
}: {
  label: string;
  badge: React.ReactNode;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {badge}
      </div>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
}

function resolveArticle(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (text, [key, value]) =>
      text.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || `{{${key}}}`),
    template
  );
}

export function IssueDetail({ issue, onBack, onApplyFix }: IssueDetailProps) {
  const variables = issue.suggestedFix.variables ?? [];
  const [varValues, setVarValues] = useState<Record<string, string>>(
    Object.fromEntries(variables.map((v) => [
      v.key,
      issue.status === 'fix_applied' ? (v.defaultValue ?? '') : '',
    ]))
  );
  const [isEditing, setIsEditing] = useState(false);
  const [showConversations, setShowConversations] = useState(true);
  const [previewMode, setPreviewMode] = useState<'original' | 'with_fix'>('original');
  const [fixStage, setFixStage] = useState<FixStage>(
    issue.status === 'fix_applied' ? 'deployed' : 'idle'
  );
  const [deploying, setDeploying] = useState(false);

  const resolvedArticle = issue.deployedArticle ?? resolveArticle(issue.suggestedFix.proposedArticle, varValues);
  const [editedArticle, setEditedArticle] = useState(resolvedArticle);

  const articleToShow = isEditing ? editedArticle : resolveArticle(issue.suggestedFix.proposedArticle, varValues);

  const hasUnfilledVars = variables.some((v) => !varValues[v.key]?.trim());
  const hasImprovedResponses = issue.conversationSamples.some((s) => s.improvedResponse);

  const handleStage = () => {
    setEditedArticle(articleToShow);
    setFixStage('staged');
  };

  const handleDeploy = () => {
    const finalArticle = resolveArticle(editedArticle, varValues);
    setEditedArticle(finalArticle);
    setDeploying(true);
    setTimeout(() => {
      setFixStage('deployed');
      setDeploying(false);
      onApplyFix(issue.id, finalArticle);
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
              <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {issue.productLine}
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
              <>
                {/* Preview toggle — only show if any sample has an improved response */}
                {hasImprovedResponses && (
                  <div className="px-5 pb-3 flex items-center gap-1">
                    <button
                      onClick={() => setPreviewMode('original')}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        previewMode === 'original'
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Original
                    </button>
                    <button
                      onClick={() => setPreviewMode('with_fix')}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        previewMode === 'with_fix'
                          ? 'bg-emerald-600 text-white'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      With fix applied
                    </button>
                  </div>
                )}

                <div className="divide-y divide-gray-50">
                  {issue.conversationSamples.map((sample) => {
                    const showImproved = previewMode === 'with_fix' && !!sample.improvedResponse;
                    return (
                      <div key={sample.id} className="px-5 py-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0 mt-0.5">
                            C
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">{sample.customerMessage}</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${showImproved ? 'bg-emerald-500' : 'bg-brand-purple'}`}>
                            <span className="text-white text-xs font-bold">D</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {showImproved ? resolveArticle(sample.improvedResponse!, varValues) : sample.agentResponse}
                            </p>
                            {showImproved && (
                              <p className="text-xs text-emerald-600 mt-1 font-medium">Simulated response with fix applied</p>
                            )}
                          </div>
                        </div>
                        {previewMode === 'original' && (
                          <div className="flex justify-end">{outcomeLabel(sample.outcome)}</div>
                        )}
                        {showImproved && (
                          <div className="flex justify-end">
                            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Resolved</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Suggested fix */}
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {fixStage === 'deployed' ? (
                    <CheckCircle2 size={15} className="text-emerald-500" />
                  ) : fixStage === 'staged' ? (
                    <FlaskConical size={15} className="text-brand-purple" />
                  ) : (
                    <AlertTriangle size={15} className="text-amber-500" />
                  )}
                  <span className="font-medium text-gray-900 text-sm">Suggested fix</span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    Knowledge base article
                  </span>
                </div>
                {fixStage !== 'deployed' && (
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

            <div className="px-5 py-4 space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                  What's missing
                </p>
                <p className="text-sm text-gray-600">{issue.suggestedFix.currentGap}</p>
              </div>

              {/* Variable inputs */}
              {fixStage === 'idle' && variables.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 space-y-3">
                  <p className="text-xs font-medium text-amber-800">
                    Fill in the details below before applying — the article will update automatically.
                  </p>
                  {variables.map((v) => (
                    <div key={v.key} className="flex items-center gap-3">
                      <label className="text-sm font-medium text-gray-700 w-36 shrink-0">
                        {v.label}
                      </label>
                      <input
                        type="text"
                        placeholder={v.placeholder}
                        value={varValues[v.key] ?? ''}
                        onChange={(e) =>
                          setVarValues((prev) => ({ ...prev, [v.key]: e.target.value }))
                        }
                        className="flex-1 text-sm border border-gray-200 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-purple/30 focus:border-brand-purple"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Proposed article — {issue.suggestedFix.title}
                </p>
                {isEditing && fixStage !== 'deployed' ? (
                  <textarea
                    className="w-full text-sm font-mono text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3 h-64 resize-y focus:outline-none focus:ring-2 focus:ring-brand-purple/30 focus:border-brand-purple"
                    value={editedArticle}
                    onChange={(e) => setEditedArticle(e.target.value)}
                  />
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">
                    {fixStage === 'deployed' ? editedArticle : articleToShow}
                  </div>
                )}
              </div>

              {/* Action area */}
              {fixStage === 'idle' && (
                <div className="space-y-1.5">
                  <button
                    onClick={handleStage}
                    disabled={hasUnfilledVars}
                    className="w-full py-2.5 rounded-lg border border-brand-purple text-brand-purple text-sm font-semibold hover:bg-indigo-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <FlaskConical size={14} />
                    Stage fix for review
                  </button>
                  {hasUnfilledVars && (
                    <p className="text-xs text-center text-amber-600">
                      Fill in all required fields above to stage this fix.
                    </p>
                  )}
                </div>
              )}

              {fixStage === 'staged' && (
                <div className="space-y-3">
                  <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3">
                    <p className="text-xs font-medium text-brand-purple mb-0.5">Fix staged</p>
                    <p className="text-xs text-gray-600">
                      Review the article above, then deploy when ready. Staged fixes are not live yet.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFixStage('idle')}
                      className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Unstage
                    </button>
                    <button
                      onClick={handleDeploy}
                      disabled={deploying}
                      className="flex-1 py-2.5 rounded-lg bg-brand-purple text-white text-sm font-semibold hover:bg-indigo-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Rocket size={14} />
                      {deploying ? 'Deploying…' : 'Deploy to production'}
                    </button>
                  </div>
                </div>
              )}

              {fixStage === 'deployed' && (
                <div className="flex items-center gap-2 py-2.5 text-sm text-emerald-700 font-medium">
                  <CheckCircle2 size={16} />
                  Fix deployed — track its impact in the Impact Tracker
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column — priority breakdown */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Priority
              </p>
              {levelLabel(issue.priorityScore)}
            </div>

            <div className="space-y-4">
              <MetricExplainer
                label="Frequency"
                badge={levelLabel(issue.scoreBreakdown.frequency)}
                description={`Affects roughly ${issue.scoreBreakdown.frequency}% of recent conversations`}
              />
              <MetricExplainer
                label="CSAT Risk"
                badge={levelLabel(issue.scoreBreakdown.csatImpact)}
                description="How much this issue is affecting your customer satisfaction scores"
              />
              <MetricExplainer
                label="Escalation Volume"
                badge={levelLabel(issue.scoreBreakdown.deflectionImpact)}
                description="How often this issue leads to conversations being handed off to a human agent"
              />
              <MetricExplainer
                label="Business Impact"
                badge={levelLabel(issue.scoreBreakdown.businessImpact)}
                description="Estimated risk to revenue, refunds, or legal exposure"
              />
              <MetricExplainer
                label="Fix Effort"
                badge={effortLabel(issue.scoreBreakdown.fixEffort)}
                description="How much effort is needed to implement this fix"
              />
              <MetricExplainer
                label="Confidence"
                badge={levelLabel(issue.scoreBreakdown.confidenceScore)}
                description="How confident we are that this is a real, fixable issue and not noise"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
