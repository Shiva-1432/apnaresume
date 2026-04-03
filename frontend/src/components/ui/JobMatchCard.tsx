'use client';

interface JobMatchCardProps {
  jobTitle: string;
  company: string;
  matchPercentage: number;
  missingSkills: string[];
  strengths: string[];
  onClick?: () => void;
}

export default function JobMatchCard({
  jobTitle,
  company,
  matchPercentage,
  missingSkills,
  strengths,
  onClick
}: JobMatchCardProps) {
  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'accent';
    if (percentage >= 40) return 'neutral';
    return 'danger';
  };

  const matchColor = getMatchColor(matchPercentage);

  const colorMap = {
    success: 'from-success-500 to-success-600 bg-success-50 border-success-200',
    accent: 'from-accent-500 to-accent-600 bg-accent-50 border-accent-200',
    neutral: 'from-neutral-500 to-neutral-700 bg-neutral-50 border-neutral-200',
    danger: 'from-danger-500 to-danger-600 bg-danger-50 border-danger-200'
  };

  return (
    <div
      onClick={onClick}
      className={`
        bg-gradient-to-br ${colorMap[matchColor]}
        border rounded-lg p-6 shadow-md hover:shadow-lg
        transition-all duration-200 cursor-pointer hover-lift
      `}
    >
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-neutral-900">{jobTitle}</h3>
        <p className="text-sm text-neutral-600">{company}</p>
      </div>

      {/* Match Percentage - Large */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-4xl font-extrabold text-neutral-900">
            {matchPercentage}%
          </p>
          <p className="text-xs font-semibold text-neutral-600 mt-1">
            {matchPercentage >= 80 && '✅ Excellent Match'}
            {matchPercentage >= 60 && matchPercentage < 80 && '✔️ Good Match'}
            {matchPercentage >= 40 && matchPercentage < 60 && '⚠️ Fair Match'}
            {matchPercentage < 40 && '❌ Poor Match'}
          </p>
        </div>

        {/* Visual Indicator */}
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="35"
              fill="none"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="3"
            />
            <circle
              cx="40"
              cy="40"
              r="35"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${(matchPercentage / 100) * 220} 220`}
              className={`
                ${matchColor === 'success' && 'text-success-600'}
                ${matchColor === 'accent' && 'text-accent-600'}
                ${matchColor === 'neutral' && 'text-neutral-600'}
                ${matchColor === 'danger' && 'text-danger-600'}
                transition-all duration-500
              `}
            />
          </svg>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white bg-opacity-60 rounded p-2">
          <p className="text-xs text-neutral-600 font-semibold">Strengths</p>
          <p className="text-lg font-bold text-neutral-900">{strengths.length}</p>
        </div>
        <div className="bg-white bg-opacity-60 rounded p-2">
          <p className="text-xs text-neutral-600 font-semibold">Gaps</p>
          <p className="text-lg font-bold text-neutral-900">{missingSkills.length}</p>
        </div>
      </div>

      {/* CTA */}
      <button className="w-full mt-4 py-2 bg-white text-neutral-900 font-semibold rounded-lg hover:bg-neutral-50 transition">
        View Details →
      </button>
    </div>
  );
}
