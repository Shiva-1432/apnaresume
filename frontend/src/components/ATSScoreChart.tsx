'use client';

import { useMemo } from 'react';

type DataPoint = { label: string; score: number };

interface ATSScoreChartProps {
  data?: DataPoint[];
}

const DEFAULT_DATA: DataPoint[] = [
  { label: 'Jan', score: 45 },
  { label: 'Feb', score: 52 },
  { label: 'Mar', score: 58 },
  { label: 'Apr', score: 61 },
  { label: 'May', score: 70 },
  { label: 'Jun', score: 68 },
  { label: 'Jul', score: 78 },
];

export default function ATSScoreChart({ data = DEFAULT_DATA }: ATSScoreChartProps) {
  const width = 500;
  const height = 140;
  const padding = { top: 16, right: 16, bottom: 28, left: 32 };

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const minScore = 0;
  const maxScore = 100;

  const chartState = useMemo(() => {
    const points = data.map((d, i) => ({
      x: padding.left + (i / (data.length - 1)) * chartW,
      y: padding.top + chartH - ((d.score - minScore) / (maxScore - minScore)) * chartH,
      ...d,
    }));

    const linePath = points.map((p, i) =>
      i === 0 ? `M ${p.x} ${p.y}` : `C ${points[i - 1].x + chartW / (data.length - 1) / 2} ${points[i - 1].y}, ${p.x - chartW / (data.length - 1) / 2} ${p.y}, ${p.x} ${p.y}`
    ).join(' ');

    const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;
    const latest = points[points.length - 1];
    const prev = points[points.length - 2];
    const improvement = latest.score - prev.score;

    return { points, linePath, areaPath, latest, improvement };
  }, [data, chartW, chartH, padding.left, padding.top]);

  const { points, linePath, areaPath, latest, improvement } = chartState;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">ATS Score History</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-neutral-900">{latest.score}</span>
            <span className={`text-xs font-black ${improvement >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {improvement >= 0 ? '+' : ''}{improvement} this month
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Improving</span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full overflow-visible"
        style={{ height: height }}
      >
        <defs>
          <linearGradient id="ats-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(val => {
          const y = padding.top + chartH - ((val - minScore) / (maxScore - minScore)) * chartH;
          return (
            <g key={val}>
              <line
                x1={padding.left} y1={y}
                x2={padding.left + chartW} y2={y}
                stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4"
              />
              <text x={padding.left - 6} y={y + 4} textAnchor="end" className="text-[9px]" fill="#9ca3af" fontSize="9">
                {val}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill="url(#ats-gradient)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points + labels */}
        {points.map((p, i) => (
          <g key={i}>
            {/* X axis label */}
            <text x={p.x} y={height - 4} textAnchor="middle" fill="#9ca3af" fontSize="9" className="text-[9px]">
              {p.label}
            </text>

            {/* Dot */}
            <circle cx={p.x} cy={p.y} r={i === points.length - 1 ? 5 : 3.5}
              fill={i === points.length - 1 ? '#4f46e5' : '#fff'}
              stroke="#4f46e5" strokeWidth="2"
            />

            {/* Latest score tooltip */}
            {i === points.length - 1 && (
              <g>
                <rect x={p.x - 16} y={p.y - 28} width="32" height="18" rx="6" fill="#4f46e5" />
                <text x={p.x} y={p.y - 15} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="900">
                  {p.score}
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
