'use client';

import { useState } from 'react';
import {
  getScoreBg,
  getScoreColor,
  getScoreLabel,
  getScoreTier,
} from '@/lib/constants/scores';

interface ATSScoreCardProps {
  score: number; // 0-100
  breakdown: {
    format: number;
    keywords: number;
    experience: number;
    education: number;
  };
  onViewDetails?: () => void;
}

export default function ATSScoreCard({
  score,
  breakdown,
  onViewDetails
}: ATSScoreCardProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const tier = getScoreTier(score);
  const label = getScoreLabel(score);
  const scoreTextClass = getScoreColor(tier);
  const scoreBgClass = getScoreBg(tier);

  const ratingCopy: Record<typeof label, string> = {
    'Needs Work': '💪 Major revisions recommended',
    'On Track': '👍 Good foundation, minor improvements',
    'ATS Ready': '🎉 Ready to apply!',
  };

  return (
    <div className={`rounded-xl p-8 shadow-lg border border-primary-200 ${scoreBgClass}`}>
      {/* Main Score */}
      <div className="text-center mb-8">
        <div className="inline-block relative">
          {/* Circular Progress */}
          <div className="relative w-32 h-32">
            <svg className="transform -rotate-90 w-32 h-32">
              {/* Background circle */}
              <circle
                cx="64"
                cy="64"
                r="60"
                fill="none"
                stroke="rgba(200, 200, 200, 0.1)"
                strokeWidth="4"
              />
              {/* Progress circle */}
              <circle
                cx="64"
                cy="64"
                r="60"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={`${(score / 100) * 376} 376`}
                className="text-primary-600 transition-all duration-500"
              />
            </svg>

            {/* Score text in center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className={`text-4xl font-extrabold ${scoreTextClass}`}>{score}</p>
              <p className={`text-xs font-semibold ${scoreTextClass}`}>out of 100</p>
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="mt-6">
          <p className={`text-2xl font-bold ${scoreTextClass}`}>{label}</p>
          <p className="text-sm text-neutral-600 mt-1">
            {ratingCopy[label]}
          </p>
        </div>
      </div>

      {/* Breakdown */}
      <button
        onClick={() => setShowBreakdown(!showBreakdown)}
        className="w-full py-2 text-primary-600 font-semibold hover:text-primary-700 transition text-sm"
      >
        {showBreakdown ? '▼ Hide' : '▶ Show'} Breakdown
      </button>

      {onViewDetails && (
        <button
          onClick={onViewDetails}
          className="w-full py-2 text-neutral-700 font-semibold hover:text-neutral-900 transition text-sm"
        >
          View Detailed Insights
        </button>
      )}

      {showBreakdown && (
        <div className="mt-4 space-y-3 border-t border-primary-200 pt-4">
          {Object.entries(breakdown).map(([category, value]) => (
            <div key={category}>
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-semibold text-neutral-700 capitalize">
                  {category === 'format' && '📄 Format'}
                  {category === 'keywords' && '🔑 Keywords'}
                  {category === 'experience' && '💼 Experience'}
                  {category === 'education' && '🎓 Education'}
                </p>
                <p className="text-sm font-bold text-primary-600">{value}%</p>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-primary-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary-500 to-primary-600 h-full transition-all duration-500"
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
