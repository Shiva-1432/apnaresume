import { Skeleton } from '@/components/ui/skeleton';
import SkeletonCard from '@/components/ui/SkeletonCard';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50">
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-96" />
          </div>
          <SkeletonCard className="min-h-[140px]" lines={3} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        <div className="grid gap-6 lg:grid-cols-3">
          <SkeletonCard className="lg:col-span-2 min-h-[220px]" lines={4} />
          <SkeletonCard className="min-h-[220px]" lines={4} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <SkeletonCard className="min-h-[260px]" lines={5} />
          <SkeletonCard className="min-h-[260px]" lines={5} />
        </div>
      </div>
    </div>
  );
}