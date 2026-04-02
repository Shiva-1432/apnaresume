import SkeletonCard from '@/components/ui/SkeletonCard';

export default function HistoryLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 px-4 py-8 lg:py-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="space-y-3">
          <div className="h-3 w-24 rounded-full bg-muted animate-pulse" />
          <div className="h-10 w-64 rounded-lg bg-muted animate-pulse" />
          <div className="h-5 w-96 rounded-lg bg-muted animate-pulse" />
        </div>

        <SkeletonCard className="min-h-[160px]" lines={4} />
        <SkeletonCard className="min-h-[260px]" lines={5} />
      </div>
    </div>
  );
}