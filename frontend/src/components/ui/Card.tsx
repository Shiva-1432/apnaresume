'use client';

import { ReactNode } from 'react';

type CardVariant = 'elevated' | 'outlined' | 'filled';
type CardPadding = 'sm' | 'md' | 'lg';

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  className?: string;
}

export default function Card({
  children,
  variant = 'outlined',
  padding = 'md',
  className = ''
}: CardProps) {
  const variants: Record<CardVariant, string> = {
    elevated: 'bg-white border border-gray-100 shadow-lg',
    outlined: 'bg-white border border-gray-200 shadow-sm',
    filled: 'bg-gray-50 border border-gray-200'
  };

  const paddings: Record<CardPadding, string> = {
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6'
  };

  return (
    <div className={`rounded-xl ${variants[variant]} ${paddings[padding]} ${className}`}>
      {children}
    </div>
  );
}
