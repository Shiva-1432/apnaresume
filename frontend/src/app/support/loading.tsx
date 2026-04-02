import SkeletonCard from '@/components/ui/SkeletonCard';

export default function SupportLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 px-4 py-8 lg:py-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="space-y-3">
          <div className="h-3 w-28 rounded-full bg-muted animate-pulse" />
          <div className="h-10 w-72 rounded-lg bg-muted animate-pulse" />
          <div className="h-5 w-96 rounded-lg bg-muted animate-pulse" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <SkeletonCard className="min-h-[420px]" lines={6} />
          <SkeletonCard className="min-h-[420px]" lines={6} />
        </div>
      </div>
    </div>
  );
}