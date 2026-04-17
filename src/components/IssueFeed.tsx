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

function ScoreBar({ value }: { value: number }) {
  const color = value >= 80 ? 'bg-red-400' : value >= 55 ? 'bg-amber-400' : 'bg-gray-300';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs tabular-nums text-gray-500 w-7 text-right">{value}</span>
    </div>
  );
}

export function IssueFeed({ issues, onSelectIssue }: IssueFeedProps) {
  const appliedCount = issues.filter((i) => i.status === 'fix_applied').length;
  const sortedIssues = [...issues].sort((a, b) => b.priorityScore - a.priorityScore);

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
      <div className="grid grid-cols-3 gap-4 mb-8">
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
          <p className="text-xs text-gray-500 mb-1">Avg CSAT Lift</p>
          <p className="text-2xl font-semibold text-emerald-600">
            {appliedCount > 0 ? '+0.5' : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {appliedCount > 0 ? 'per applied fix' : 'apply fixes to see impact'}
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

                  {/* Mini score bars */}
                  <div className="mt-3 grid grid-cols-3 gap-x-6 gap-y-1.5 max-w-lg">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">How common</p>
                      <ScoreBar value={issue.scoreBreakdown.frequency} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">CSAT drag</p>
                      <ScoreBar value={issue.scoreBreakdown.csatImpact} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Deflection drag</p>
                      <ScoreBar value={issue.scoreBreakdown.deflectionImpact} />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-gray-100 group-hover:border-brand-purple/30 transition-colors">
                    <span className="text-sm font-bold text-gray-700">{issue.priorityScore}</span>
                  </div>
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
