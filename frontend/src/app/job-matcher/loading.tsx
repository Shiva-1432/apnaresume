import { Skeleton } from '@/components/ui/skeleton';
import SkeletonCard from '@/components/ui/SkeletonCard';

export default function JobMatcherLoading() {
  return (
    <div className="min-h-screen bg-mesh py-12 pb-32">
      <div className="max-w-5xl mx-auto space-y-12 px-6">
        <div className="text-center space-y-3">
          <Skeleton className="mx-auto h-12 w-80" />
          <Skeleton className="mx-auto h-5 w-96" />
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <SkeletonCard className="min-h-[360px]" lines={6} />
          <SkeletonCard className="min-h-[360px]" lines={5} />
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <SkeletonCard className="min-h-[220px]" lines={4} />
          <SkeletonCard className="min-h-[220px]" lines={4} />
        </div>
      </div>
    </div>
  );
}