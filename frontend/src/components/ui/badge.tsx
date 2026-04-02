'use client';

import { ReactNode } from 'react';

type BadgeVariant = 'default' | 'secondary' | 'destructive';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    default: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    secondary: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    destructive: 'bg-red-100 text-red-700 border-red-200'
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
