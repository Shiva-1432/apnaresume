import SkeletonCard from '@/components/ui/SkeletonCard';

export default function AnalyticsLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
            <div className="h-6 w-40 rounded-lg bg-muted animate-pulse" />
          </div>
          <div className="h-9 w-24 rounded-lg bg-muted animate-pulse" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10 space-y-8">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <SkeletonCard className="min-h-[340px]" lines={5} />
          <SkeletonCard className="min-h-[340px]" lines={5} />
        </div>

        <SkeletonCard className="min-h-[300px]" lines={6} />
      </div>
    </div>
  );
}