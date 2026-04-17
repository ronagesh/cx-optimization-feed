import { AlertCircle, TrendingDown, ChevronRight, CheckCircle2 } from 'lucide-react';
import type { Issue } from '../types';

interface IssueFeedProps {
  issues: Issue[];
  onSelectIssue: (id: string) => void;
}

function priorityLabel(score: number) {
  if (score >= 80) return { label: 'High Priority', color: 'text-red-600 bg-red-50' };
  if (score >= 55) return { label: 'Medium Priority', color: 'text-amber-600 bg-amber-50' };
  return { label: 'Low Priority', color: 'text-gray-500 bg-gray-100' };
}

function StatusBadge({ status }: { status: Issue['status'] }) {
  if (status === 'fix_applied') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
        <CheckCircle2 size={11} />
        Fix Applied
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-purple bg-indigo-50 px-2 py-0.5 rounded-full">
      <AlertCircle size={11} />
      Fix Available
    </span>
  );
}

function ScoreLabel({ value }: { value: number }) {
  if (value >= 70) return <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">High</span>;
  if (value >= 40) return <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Medium</span>;
  return <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Low</span>;
}

function computeR7Lift(issue: Issue, key: 'csat' | 'deflection'): number | null {
  const data = issue.impactData;
  const fixIdx = issue.fixAppliedWeek ?? data.length;
  const before = data.slice(0, fixIdx);
  const after = data.slice(fixIdx);
  if (!before.length || !after.length) return null;
  const beforeVal = before[before.length - 1][key];
  const afterVal = after[after.length - 1][key];
  return afterVal - beforeVal;
}

export function IssueFeed({ issues, onSelectIssue }: IssueFeedProps) {
  const appliedIssues = issues.filter((i) => i.status === 'fix_applied');
  const appliedCount = appliedIssues.length;
  const sortedIssues = [...issues].sort((a, b) => b.priorityScore - a.priorityScore);

  const avgLift = (key: 'csat' | 'deflection'): string => {
    if (!appliedCount) return '—';
    const lifts = appliedIssues.map((i) => computeR7Lift(i, key)).filter((v): v is number => v !== null);
    if (!lifts.length) return '—';
    const avg = Math.round(lifts.reduce((s, v) => s + v, 0) / lifts.length);
    return avg >= 0 ? `+${avg}` : `${avg}`;
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-gray-900">Issue Tracker</h1>
        <p className="mt-1 text-sm text-gray-500">
          Issues are ranked by their expected impact on customer satisfaction and resolution rate.
          Apply suggested fixes to start improving your metrics.
        </p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Open Issues</p>
          <p className="text-2xl font-semibold text-gray-900">
            {issues.filter((i) => i.status !== 'fix_applied').length}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">awaiting action</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Fixes Applied</p>
          <p className="text-2xl font-semibold text-gray-900">{appliedCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">this week</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">CSAT Lift</p>
          <p className="text-2xl font-semibold text-emerald-600">{avgLift('csat')}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {appliedCount > 0 ? 'pts · last 7 days' : 'apply fixes to see impact'}
          </p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Deflection Lift</p>
          <p className="text-2xl font-semibold text-emerald-600">{avgLift('deflection')}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {appliedCount > 0 ? 'pts · last 7 days' : 'apply fixes to see impact'}
          </p>
        </div>
      </div>

      {/* Issue list */}
      <div className="space-y-3">
        {sortedIssues.map((issue) => {
          const priority = priorityLabel(issue.priorityScore);
          return (
            <button
              key={issue.id}
              onClick={() => onSelectIssue(issue.id)}
              className="w-full text-left bg-white border border-gray-100 rounded-xl p-5 hover:border-brand-purple/40 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priority.color}`}>
                      {priority.label}
                    </span>
                    <span className="text-xs text-gray-400">{issue.category}</span>
                    {issue.status === 'fix_applied' && <StatusBadge status={issue.status} />}
                  </div>
                  <h2 className="font-semibold text-gray-900 text-base leading-snug mb-1">
                    {issue.title}
                  </h2>
                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                    {issue.summary}
                  </p>

                  {/* Metric labels */}
                  <div className="mt-3 flex flex-wrap gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-400">Frequency</span>
                      <ScoreLabel value={issue.scoreBreakdown.frequency} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-400">CSAT Risk</span>
                      <ScoreLabel value={issue.scoreBreakdown.csatImpact} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-400">Escalation Volume</span>
                      <ScoreLabel value={issue.scoreBreakdown.deflectionImpact} />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-1 text-xs text-brand-purple font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    View <ChevronRight size={13} />
                  </div>
                </div>
              </div>

              {issue.status === 'fix_applied' && (
                <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-1.5 text-xs text-emerald-600">
                  <TrendingDown size={12} />
                  Fix applied — tracking impact in Impact Tracker
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
