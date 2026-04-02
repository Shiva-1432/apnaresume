import SkeletonCard from '@/components/ui/SkeletonCard';

export default function UploadLoading() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <div className="h-9 w-20 rounded-lg bg-muted animate-pulse" />
            <div className="h-10 w-40 rounded-xl bg-muted animate-pulse" />
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-4 py-12">
        <div className="mx-auto max-w-3xl space-y-8">
          <SkeletonCard className="min-h-[220px]" lines={4} />
          <div className="grid gap-6 md:grid-cols-2">
            <SkeletonCard className="min-h-[180px]" lines={3} />
            <SkeletonCard className="min-h-[180px]" lines={3} />
          </div>
        </div>
      </main>
    </div>
  );
}