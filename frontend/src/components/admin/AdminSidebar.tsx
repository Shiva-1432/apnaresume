"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Overview", href: "/admin" },
  { label: "Users", href: "/admin/users" },
  { label: "Resumes", href: "/admin/resumes" },
  { label: "Support Tickets", href: "/admin/tickets" },
  { label: "Analysis Queue", href: "/admin/queue" },
  { label: "Analytics", href: "/admin/analytics" },
  { label: "Audit Log", href: "/admin/audit" },
  { label: "Feature Flags", href: "/admin/flags" },
  { label: "Billing", href: "/admin/billing" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const isActiveLink = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="hidden md:flex md:w-72 md:flex-col bg-slate-950 border-r border-slate-800">
      <div className="px-6 py-6 border-b border-slate-800">
        <div className="text-xs font-bold tracking-[0.18em] uppercase text-cyan-400">
          Control Plane
        </div>
        <div className="mt-2 text-2xl font-black text-white">Admin</div>
      </div>

      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = isActiveLink(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={[
                "block rounded-xl px-4 py-3 text-sm font-bold transition-colors",
                isActive
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white border border-transparent",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4 border-t border-slate-800">
        <Link
          href="/dashboard"
          className="block rounded-xl px-4 py-3 text-sm font-bold text-slate-300 hover:bg-slate-900 hover:text-white"
        >
          ← Go to App
        </Link>
      </div>
    </aside>
  );
}
