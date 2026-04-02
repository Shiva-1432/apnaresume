import SkeletonCard from '@/components/ui/SkeletonCard';

export default function MyResumesLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 px-4 py-8 lg:py-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="space-y-3">
          <div className="h-3 w-28 rounded-full bg-muted animate-pulse" />
          <div className="h-10 w-64 rounded-lg bg-muted animate-pulse" />
          <div className="h-5 w-96 rounded-lg bg-muted animate-pulse" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <SkeletonCard className="min-h-[220px]" lines={4} />
          <SkeletonCard className="min-h-[220px]" lines={5} />
        </div>

        <SkeletonCard className="min-h-[320px]" lines={6} />
      </div>
    </div>
  );
}