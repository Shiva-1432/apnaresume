'use client';

import { ReactNode, forwardRef } from 'react';

type ButtonVariant =
  | 'primary' // Main CTA (blue)
  | 'secondary' // Secondary action (gray)
  | 'success' // Positive action (green)
  | 'danger' // Destructive action (red)
  | 'ghost' // Minimal (transparent)
  | 'outline'; // Bordered

type ButtonSize = 'sm' | 'md' | 'lg' | 'xl' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: ReactNode;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

type ButtonVariantConfig = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

const baseStyles = [
  'font-semibold rounded-lg transition-all duration-200',
  'flex items-center justify-center gap-2',
  'active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
].join(' ');

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:shadow-lg hover:from-primary-700 hover:to-primary-800',
  secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200',
  success: 'bg-gradient-to-r from-success-600 to-success-700 text-white hover:shadow-lg',
  danger: 'bg-gradient-to-r from-danger-600 to-danger-700 text-white hover:shadow-lg',
  ghost: 'bg-transparent text-primary-600 hover:bg-primary-50',
  outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50'
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-lg',
  icon: 'h-9 w-9 p-0'
};

function buttonVariants({ variant = 'primary', size = 'md', className = '' }: ButtonVariantConfig = {}) {
  return [baseStyles, variantStyles[variant], sizeStyles[size], className].join(' ').trim();
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    children,
    disabled,
    loading,
    icon,
    fullWidth,
    type = 'button',
    className = '',
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`${buttonVariants({ variant, size, className })} ${fullWidth ? 'w-full' : ''}`}
      {...props}
    >
      {loading && <span className="inline-block animate-spin">⏳</span>}
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
});

export { buttonVariants };
export { Button };
export default Button;
