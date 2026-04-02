import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/skeleton';

type SkeletonCardProps = {
  className?: string;
  titleWidth?: string;
  subtitleWidth?: string;
  lines?: number;
  children?: ReactNode;
};

export default function SkeletonCard({
  className = '',
  titleWidth = 'w-40',
  subtitleWidth = 'w-60',
  lines = 2,
  children,
}: SkeletonCardProps) {
  return (
    <Card className={`border-0 bg-white/80 shadow-sm ${className}`}>
      <CardHeader className="space-y-3 pb-4">
        <Skeleton className={`h-5 ${titleWidth}`} />
        <Skeleton className={`h-4 ${subtitleWidth}`} />
      </CardHeader>
      <CardContent className="space-y-3">
        {children ??
          Array.from({ length: lines }).map((_, index) => (
            <Skeleton
              key={index}
              className={index === lines - 1 ? 'h-20 w-full' : 'h-4 w-full'}
            />
          ))}
      </CardContent>
    </Card>
  );
}