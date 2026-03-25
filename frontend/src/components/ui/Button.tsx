'use client';

import { ReactNode } from 'react';

type ButtonVariant =
  | 'primary' // Main CTA (blue)
  | 'secondary' // Secondary action (gray)
  | 'success' // Positive action (green)
  | 'danger' // Destructive action (red)
  | 'ghost' // Minimal (transparent)
  | 'outline'; // Bordered

type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled,
  loading,
  icon,
  fullWidth,
  type = 'button'
}: ButtonProps) {
  const baseStyles = `
    font-semibold rounded-lg transition-all duration-200
    flex items-center justify-center gap-2
    active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variants = {
    primary:
      'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:shadow-lg hover:from-primary-700 hover:to-primary-800',
    secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200',
    success: 'bg-gradient-to-r from-success-600 to-success-700 text-white hover:shadow-lg',
    danger: 'bg-gradient-to-r from-danger-600 to-danger-700 text-white hover:shadow-lg',
    ghost: 'bg-transparent text-primary-600 hover:bg-primary-50',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-lg'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
      `}
    >
      {loading && <span className="inline-block animate-spin">⏳</span>}
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
}
