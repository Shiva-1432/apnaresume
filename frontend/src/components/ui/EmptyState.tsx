import type { ReactNode } from 'react';
import { Button } from './Button';

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
};

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  children,
}: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-300 bg-white/60 p-8 text-center">
      <h2 className="text-xl font-bold text-neutral-900">{title}</h2>
      <p className="mt-2 text-sm text-neutral-600">{description}</p>
      {children}
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      )}
    </div>
  );
}