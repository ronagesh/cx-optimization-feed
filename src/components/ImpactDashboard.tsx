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
import { TrendingUp, Clock } from 'lucide-react';
import type { Issue, ImpactDataPoint } from '../types';

interface ImpactDashboardProps {
  issues: Issue[];
  onSelectIssue: (id: string) => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number | null; color: string; strokeDasharray?: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const visible = payload.filter((p) => p.value !== null && p.value !== undefined);
  if (!visible.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-md px-3 py-2.5 text-xs">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      {visible.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="tabular-nums">
          {p.name}: <span className="font-semibold">{p.value}</span>
          {p.name === 'CSAT' || p.name === 'CSAT (projected)' ? ' / 100' : '%'}
        </p>
      ))}
    </div>
  );
}

// Linear regression over an array of values (x = index 0..n-1)
function linReg(values: number[]): { slope: number; intercept: number } {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] ?? 0 };
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i; sumY += values[i];
    sumXY += i * values[i]; sumX2 += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

// 95% CI half-width: 1.96 * sd / sqrt(n), rounded to 1 decimal
function ci95(values: number[]): number {
  if (values.length < 2) return 0;
  return Math.round(1.96 * stdDev(values) / Math.sqrt(values.length));
}

function buildChartData(
  data: ImpactDataPoint[],
  fixIdx: number
): Array<ImpactDataPoint & { csatCounterfactual: number | null; deflectionCounterfactual: number | null }> {
  const before = data.slice(0, fixIdx);
  if (!before.length || fixIdx >= data.length) {
    return data.map((d) => ({ ...d, csatCounterfactual: null, deflectionCounterfactual: null }));
  }
  const csatReg = linReg(before.map((d) => d.csat));
  const deflReg = linReg(before.map((d) => d.deflection));
  return data.map((d, i) => ({
    ...d,
    csatCounterfactual: i >= fixIdx
      ? Math.round(csatReg.intercept + csatReg.slope * i)
      : null,
    deflectionCounterfactual: i >= fixIdx
      ? Math.round(deflReg.intercept + deflReg.slope * i)
      : null,
  }));
}

function ImpactCard({ issue, onSelect }: { issue: Issue; onSelect: () => void }) {
  const data = issue.impactData;
  const fixIdx = issue.fixAppliedIndex ?? data.length;
  const before = data.slice(0, fixIdx);
  const after = data.slice(fixIdx);

  const WINDOW = 7;
  const avg = (arr: typeof data, key: 'csat' | 'deflection') =>
    arr.length ? arr.reduce((s, d) => s + d[key], 0) / arr.length : null;

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

  // Confidence intervals on lift (propagate CI of after window)
  const csatCI = afterWindow.length >= 2 ? ci95(afterWindow.map((d) => d.csat)) : null;
  const deflCI = afterWindow.length >= 2 ? ci95(afterWindow.map((d) => d.deflection)) : null;

  const fixDateLabel = data[fixIdx]?.date;
  const chartData = buildChartData(data, fixIdx);

  const timeToFix = (() => {
    if (!issue.detectedDate || !issue.fixAppliedDate) return null;
    const msPerDay = 1000 * 60 * 60 * 24;
    const days = Math.round(
      (new Date(issue.fixAppliedDate).getTime() - new Date(issue.detectedDate).getTime()) / msPerDay
    );
    return days === 1 ? '1 day' : `${days} days`;
  })();

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
          <div className="flex items-center gap-4 shrink-0">
            {issue.fixAppliedDate && (
              <div className="text-right">
                <p className="text-xs text-gray-400">Fix applied</p>
                <p className="text-xs font-medium text-gray-700">
                  {new Date(issue.fixAppliedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {timeToFix && <span className="text-gray-400 font-normal"> · {timeToFix} to fix</span>}
                </p>
              </div>
            )}
            <button
              onClick={onSelect}
              className="text-xs text-brand-purple font-medium hover:underline"
            >
              View issue
            </button>
          </div>
        </div>

        {/* Stat pills */}
        <div className="flex flex-wrap gap-3 mt-3 mb-1">
          {csatLift !== null ? (
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-lg">
              <TrendingUp size={13} />
              CSAT {csatLift > 0 ? '+' : ''}{Math.round(csatLift)} pts
              {csatCI !== null && csatCI > 0 && (
                <span className="text-emerald-500 font-normal">±{csatCI}</span>
              )}
              <span className="text-emerald-500 font-normal">
                ({Math.round(beforeCsat!)} → {Math.round(afterCsat!)}) · R7
              </span>
            </div>
          ) : null}
          {deflectionLift !== null ? (
            <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-lg">
              <TrendingUp size={13} />
              Deflection {deflectionLift > 0 ? '+' : ''}{Math.round(deflectionLift)} pts
              {deflCI !== null && deflCI > 0 && (
                <span className="text-blue-400 font-normal">±{deflCI}</span>
              )}
              <span className="text-blue-400 font-normal">
                ({Math.round(beforeDeflection!)}% → {Math.round(afterDeflection!)}%) · R7
              </span>
            </div>
          ) : null}
        </div>

        {/* Sample size */}
        {issue.sampleSize != null && (
          <p className="text-xs text-gray-400 mb-3">
            Based on {issue.sampleSize.toLocaleString()} conversations
          </p>
        )}

        {/* Chart */}
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={false}
              interval={6}
            />
            <YAxis
              yAxisId="csat"
              domain={[30, 100]}
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="deflection"
              orientation="right"
              domain={[30, 90]}
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
            {fixDateLabel && (
              <ReferenceLine
                x={fixDateLabel}
                yAxisId="csat"
                stroke="#5754FF"
                strokeDasharray="4 3"
                label={{ value: 'Fix applied', position: 'insideTopLeft', fontSize: 10, fill: '#5754FF' }}
              />
            )}
            {/* Actual lines */}
            <Line
              yAxisId="csat"
              type="monotone"
              dataKey="csat"
              name="CSAT"
              stroke="#5754FF"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
            />
            <Line
              yAxisId="deflection"
              type="monotone"
              dataKey="deflection"
              name="Deflection"
              stroke="#00AEC2"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
            />
            {/* Counterfactual lines (dashed) */}
            {fixIdx < data.length && (
              <>
                <Line
                  yAxisId="csat"
                  type="monotone"
                  dataKey="csatCounterfactual"
                  name="CSAT (projected)"
                  stroke="#5754FF"
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                  dot={false}
                  activeDot={false}
                  connectNulls={false}
                  legendType="none"
                />
                <Line
                  yAxisId="deflection"
                  type="monotone"
                  dataKey="deflectionCounterfactual"
                  name="Deflection (projected)"
                  stroke="#00AEC2"
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                  dot={false}
                  activeDot={false}
                  connectNulls={false}
                  legendType="none"
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>

        <p className="text-xs text-gray-400 mt-2">
          CSAT out of 100. Lift = R7 avg after fix vs. R7 baseline before.
          {fixDateLabel ? ` Dashed lines show projected trend without the fix (counterfactual).` : ''}
          {(csatCI || deflCI) ? ' ±CI = 95% confidence interval.' : ''}
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
