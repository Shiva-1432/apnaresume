import SkeletonCard from '@/components/ui/SkeletonCard';

export default function ResumesLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 px-4 py-8 lg:py-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <SkeletonCard className="min-h-[180px]" lines={4} />
        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <SkeletonCard className="min-h-[260px]" lines={5} />
          <SkeletonCard className="min-h-[260px]" lines={5} />
        </div>
      </div>
    </div>
  );
}