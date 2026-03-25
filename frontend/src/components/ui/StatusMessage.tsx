'use client';

type StatusVariant = 'error' | 'success' | 'info';

type StatusMessageProps = {
  variant: StatusVariant;
  message: string;
  className?: string;
};

const variantStyles: Record<StatusVariant, string> = {
  error: 'bg-danger-50 border border-danger-200 text-danger-700',
  success: 'bg-success-50 border border-success-200 text-success-700',
  info: 'bg-primary-50 border border-primary-200 text-primary-700'
};

export default function StatusMessage({ variant, message, className = '' }: StatusMessageProps) {
  return (
    <div
      className={`p-3 rounded text-sm ${variantStyles[variant]} ${className}`}
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live="polite"
    >
      {message}
    </div>
  );
}
