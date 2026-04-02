import Link from "next/link";

export default function AnalysisNotFound() {
  return (
    <div className="min-h-screen bg-background px-4 py-16">
      <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-card p-10 text-center shadow-sm space-y-4">
        <h1 className="text-3xl font-black text-foreground">Analysis not found</h1>
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t find that analysis record. It may have been removed or the id is invalid.
        </p>
        <Link
          href="/resumes"
          className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-black uppercase tracking-wider text-primary-foreground hover:opacity-90"
        >
          Back to Resumes
        </Link>
      </div>
    </div>
  );
}
