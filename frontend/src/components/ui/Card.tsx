'use client';

import { ReactNode } from 'react';

type CardVariant = 'elevated' | 'outlined' | 'filled';
type CardPadding = 'sm' | 'md' | 'lg';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
}

function Card({
  children,
  variant = 'outlined',
  padding = 'md',
  className = '',
  ...props
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
    <div className={`rounded-xl ${variants[variant]} ${paddings[padding]} ${className}`} {...props}>
      {children}
    </div>
  );
}

interface BasicProps {
  children: ReactNode;
  className?: string;
}

function CardHeader({ children, className = '' }: BasicProps) {
  return <div className={`space-y-1.5 p-6 pb-2 ${className}`}>{children}</div>;
}

function CardTitle({ children, className = '' }: BasicProps) {
  return <h3 className={`font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
}

function CardDescription({ children, className = '' }: BasicProps) {
  return <p className={`text-sm text-neutral-500 ${className}`}>{children}</p>;
}

function CardContent({ children, className = '' }: BasicProps) {
  return <div className={`p-6 pt-0 ${className}`}>{children}</div>;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
export default Card;
