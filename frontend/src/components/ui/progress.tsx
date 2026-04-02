'use client';

interface ProgressProps {
  value?: number;
  className?: string;
}

export function Progress({ value = 0, className = '' }: ProgressProps) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div className={`w-full overflow-hidden rounded-full bg-neutral-200 ${className}`}>
      <div
        className="h-full bg-indigo-600 transition-all duration-500"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
