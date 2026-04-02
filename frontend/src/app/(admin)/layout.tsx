import AdminNavbar from "@/components/admin/AdminNavbar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { assertAdmin } from "@/lib/utils/assertAdmin";

export default async function AdminGroupLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await assertAdmin();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex-1 min-w-0">
          <AdminNavbar />
          <main className="p-4 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
