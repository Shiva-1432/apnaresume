"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const hideChromeRoutes = new Set([
    "/",
    "/home",
    "/dashboard",
    "/history",
    "/settings",
    "/upload",
    "/onboarding",
  ]);

  const hideChrome = pathname ? hideChromeRoutes.has(pathname) : false;

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only">
        Skip to content
      </a>
      <Navbar />

      <main id="main-content" className={`flex-grow ${hideChrome ? "pt-24 lg:pt-28" : "pt-32 lg:pt-40"}`}>
        {children}
      </main>

      {!hideChrome && (
      <footer className="mt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto bg-white/70 backdrop-blur-2xl rounded-[3rem] p-12 md:p-20 border border-neutral-200/80 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-50 blur-[80px] rounded-full opacity-60" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 relative z-10">
            <div className="col-span-1 md:col-span-1 space-y-6">
              <div className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-sm font-black group-hover:rotate-12 transition-transform shadow-lg shadow-indigo-100">A</div>
                <span className="text-2xl font-black tracking-tight text-neutral-900 group-hover:text-indigo-600 transition-colors font-syne">ApnaResume</span>
              </div>
              <p className="text-sm font-medium text-neutral-500 leading-relaxed max-w-xs">
                Your AI-powered companion for career growth. Land your dream job with precision.
              </p>
            </div>

            {[
              {
                title: "Features",
                links: [
                  { label: "Dashboard", href: "/dashboard" },
                  { label: "Job Matcher", href: "/job-matcher" },
                  { label: "Fresher Mode", href: "/fresher-mode" },
                  { label: "Skill Analysis", href: "/skill-gap" }
                ]
              },
              {
                title: "Support",
                links: [
                  { label: "FAQ", href: "/faq" },
                  { label: "Contact Support", href: "/support" },
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "Terms of Service", href: "/terms" }
                ]
              },
              {
                title: "Community",
                links: [
                  { label: "Twitter / X", href: "#" },
                  { label: "LinkedIn", href: "#" },
                  { label: "GitHub", href: "#" },
                  { label: "Discord", href: "#" }
                ]
              }
            ].map((group, idx) => (
              <div key={idx}>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-6 font-syne">{group.title}</h4>
                <ul className="space-y-4">
                  {group.links.map((link, lIdx) => (
                    <li key={lIdx}>
                      <Link href={link.href} className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-16 pt-8 border-t border-neutral-200 flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] font-black uppercase tracking-widest text-neutral-400 relative z-10">
            <p>© {new Date().getFullYear()} ApnaResume. All Rights Reserved.</p>
            <div className="flex items-center gap-10">
              <span>Enterprise Grade Security</span>
              <span>Optimized Performance</span>
            </div>
          </div>
        </div>
      </footer>
      )}
    </>
  );
}
