"use client";

import Link from "next/link";
import { SignOutButton, useUser } from "@clerk/nextjs";

export default function AdminNavbar() {
  const { user } = useUser();
  const displayName =
    user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress || "Admin";

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/95 backdrop-blur px-4 md:px-6">
      <div className="h-full flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="md:hidden rounded-lg px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-800"
          >
            ← Go to App
          </Link>
          <div>
            <p className="text-white text-lg font-black tracking-tight">ApnaResume Admin</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-sm font-semibold text-slate-300">
            {displayName}
          </span>
          <SignOutButton>
            <button
              type="button"
              className="rounded-lg px-3 py-1.5 text-xs font-bold text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/10"
            >
              Sign out
            </button>
          </SignOutButton>
        </div>
      </div>
    </header>
  );
}
