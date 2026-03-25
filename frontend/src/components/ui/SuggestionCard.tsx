'use client';

interface SuggestionCardProps {
  type: 'strength' | 'weakness' | 'improvement' | 'skill-gap';
  title: string;
  description: string;
  action?: string;
  onActionClick?: () => void;
  priority?: 'high' | 'medium' | 'low';
}

export default function SuggestionCard({
  type,
  title,
  description,
  action,
  onActionClick,
  priority = 'medium'
}: SuggestionCardProps) {
  const typeConfig = {
    strength: {
      icon: '✅',
      bgColor: 'bg-success-50',
      borderColor: 'border-success-200',
      textColor: 'text-success-700',
      accentColor: 'text-success-600'
    },
    weakness: {
      icon: '⚠️',
      bgColor: 'bg-danger-50',
      borderColor: 'border-danger-200',
      textColor: 'text-danger-700',
      accentColor: 'text-danger-600'
    },
    improvement: {
      icon: '💡',
      bgColor: 'bg-accent-50',
      borderColor: 'border-accent-200',
      textColor: 'text-accent-700',
      accentColor: 'text-accent-600'
    },
    'skill-gap': {
      icon: '🎯',
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-200',
      textColor: 'text-primary-700',
      accentColor: 'text-primary-600'
    }
  };

  const config = typeConfig[type];

  const priorityIndicator = {
    high: '🔴 High Priority',
    medium: '🟡 Medium Priority',
    low: '🟢 Low Priority'
  };

  return (
    <div
      className={`
      ${config.bgColor}
      border ${config.borderColor}
      rounded-lg p-4 space-y-3 hover-lift-soft
    `}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <h4 className={`font-bold ${config.textColor}`}>{title}</h4>
            {priority && (
              <p className={`text-xs font-semibold mt-1 ${config.accentColor}`}>
                {priorityIndicator[priority]}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className={`text-sm ${config.textColor}`}>{description}</p>

      {/* Action Button */}
      {action && (
        <button
          onClick={onActionClick}
          className={`
            w-full py-2 px-3 rounded font-semibold text-sm
            bg-white text-neutral-900
            hover:shadow-md transition-all
            border border-neutral-200
          `}
        >
          {action} →
        </button>
      )}
    </div>
  );
}
