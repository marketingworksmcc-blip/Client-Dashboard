import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isRevelUser } from "@/lib/permissions";

export default async function RootPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (isRevelUser(session.user.role)) {
    redirect("/admin/dashboard");
  }

  redirect("/dashboard");
}
