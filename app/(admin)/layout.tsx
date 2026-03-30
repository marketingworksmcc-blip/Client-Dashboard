import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isRevelUser } from "@/lib/permissions";
import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if (!isRevelUser(session.user.role)) redirect("/dashboard");

  return (
    <AdminLayoutShell
      userName={session.user.name ?? ""}
      userEmail={session.user.email ?? ""}
      userRole={session.user.role}
    >
      {children}
    </AdminLayoutShell>
  );
}
