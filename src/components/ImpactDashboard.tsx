import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import type { Issue } from '../types';

interface ImpactDashboardProps {
  issues: Issue[];
  onSelectIssue: (id: string) => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-md px-3 py-2.5 text-xs">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="tabular-nums">
          {p.name}: <span className="font-semibold">{p.value}</span>
          {p.name === 'CSAT' ? ' / 100' : '%'}
        </p>
      ))}
    </div>
  );
}

function ImpactCard({ issue, onSelect }: { issue: Issue; onSelect: () => void }) {
  const data = issue.impactData;
  const fixIdx = issue.fixAppliedWeek ?? data.length;
  const before = data.slice(0, fixIdx);
  const after = data.slice(fixIdx);

  const WINDOW = 1; // weeks (R7)
  const avg = (arr: typeof data, key: 'csat' | 'deflection') =>
    arr.length ? Math.round(arr.reduce((s, d) => s + d[key], 0) / arr.length) : null;

  // Before: last WINDOW weeks before fix (fixed baseline)
  // After: last WINDOW weeks of post-fix data (rolling)
  const beforeWindow = before.slice(-WINDOW);
  const afterWindow = after.slice(-WINDOW);

  const beforeCsat = avg(beforeWindow, 'csat');
  const beforeDeflection = avg(beforeWindow, 'deflection');
  const afterCsat = avg(afterWindow, 'csat');
  const afterDeflection = avg(afterWindow, 'deflection');

  const csatLift = beforeCsat !== null && afterCsat !== null ? afterCsat - beforeCsat : null;
  const deflectionLift =
    beforeDeflection !== null && afterDeflection !== null
      ? afterDeflection - beforeDeflection
      : null;

  const fixWeekLabel = data[fixIdx]?.week;

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-start justify-between gap-4 mb-1">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {issue.category}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900">{issue.title}</h3>
          </div>
          <button
            onClick={onSelect}
            className="text-xs text-brand-purple font-medium hover:underline shrink-0"
          >
            View issue
          </button>
        </div>

        {/* Stat pills */}
        <div className="flex flex-wrap gap-3 mt-3 mb-4">
          {csatLift !== null ? (
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-lg">
              <TrendingUp size={13} />
              CSAT {csatLift > 0 ? '+' : ''}{Math.round(csatLift)} pts
              <span className="text-emerald-500 font-normal">
                ({beforeCsat} → {afterCsat}) · R7
              </span>
            </div>
          ) : null}
          {deflectionLift !== null ? (
            <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-lg">
              <TrendingUp size={13} />
              Deflection {deflectionLift > 0 ? '+' : ''}{Math.round(deflectionLift)} pts
              <span className="text-blue-400 font-normal">
                ({beforeDeflection}% → {afterDeflection}%) · R7
              </span>
            </div>
          ) : null}
          {fixWeekLabel && (
            <div className="flex items-center gap-1.5 text-gray-400 text-xs px-2 py-1.5">
              <CheckCircle2 size={12} />
              Fix applied {fixWeekLabel}
            </div>
          )}
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
            <YAxis
              yAxisId="csat"
              domain={[40, 100]}
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}`}
            />
            <YAxis
              yAxisId="deflection"
              orientation="right"
              domain={[40, 90]}
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              iconType="circle"
              iconSize={8}
            />
            {fixWeekLabel && (
              <ReferenceLine
                x={fixWeekLabel}
                yAxisId="csat"
                stroke="#5754FF"
                strokeDasharray="4 3"
                label={{ value: 'Fix applied', position: 'insideTopLeft', fontSize: 10, fill: '#5754FF' }}
              />
            )}
            <Line
              yAxisId="csat"
              type="monotone"
              dataKey="csat"
              name="CSAT"
              stroke="#5754FF"
              strokeWidth={2}
              dot={{ r: 3, fill: '#5754FF' }}
              activeDot={{ r: 4 }}
            />
            <Line
              yAxisId="deflection"
              type="monotone"
              dataKey="deflection"
              name="Deflection"
              stroke="#00AEC2"
              strokeWidth={2}
              dot={{ r: 3, fill: '#00AEC2' }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>

        <p className="text-xs text-gray-400 mt-2">
          Metrics measured on conversations in the <strong>{issue.category}</strong> category. CSAT shown out of 100.
          {fixWeekLabel
            ? ` Lift = R7 after fix vs. R7 baseline before fix. Dashed line = deployment (${fixWeekLabel}).`
            : ''}
        </p>
      </div>
    </div>
  );
}

export function ImpactDashboard({ issues, onSelectIssue }: ImpactDashboardProps) {
  const appliedIssues = issues.filter((i) => i.status === 'fix_applied');
  const pendingIssues = issues.filter((i) => i.status !== 'fix_applied');

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-gray-900">Impact Tracker</h1>
        <p className="mt-1 text-sm text-gray-500">
          See how each applied fix has moved your CSAT and deflection rate over time. Metrics are
          segmented by issue category so you can see the direct effect of each change.
        </p>
      </div>

      {appliedIssues.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
          <Clock size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No fixes applied yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Apply a fix from the Optimization Feed to start tracking its impact here.
          </p>
          {pendingIssues.length > 0 && (
            <button
              onClick={() => onSelectIssue(pendingIssues[0].id)}
              className="mt-4 text-sm text-brand-purple font-medium hover:underline"
            >
              View top issue →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {appliedIssues.map((issue) => (
            <ImpactCard
              key={issue.id}
              issue={issue}
              onSelect={() => onSelectIssue(issue.id)}
            />
          ))}
        </div>
      )}

      {appliedIssues.length > 0 && pendingIssues.length > 0 && (
        <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-sm font-medium text-gray-700 mb-2">
            {pendingIssues.length} more {pendingIssues.length === 1 ? 'issue' : 'issues'} waiting for a fix
          </p>
          <div className="flex flex-wrap gap-2">
            {pendingIssues.map((issue) => (
              <button
                key={issue.id}
                onClick={() => onSelectIssue(issue.id)}
                className="text-xs text-gray-600 bg-white border border-gray-200 hover:border-brand-purple/40 px-3 py-1.5 rounded-lg transition-colors"
              >
                {issue.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
