import { validatePasswordResetToken } from "@/lib/tokens";
import { SetPasswordForm } from "@/components/auth/SetPasswordForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function SetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return <InvalidLink message="No token provided." />;
  }

  const result = await validatePasswordResetToken(token);
  if (!result.valid) {
    return <InvalidLink message={result.error} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#ece9e1] px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <img src="/revel-icon.png" alt="Revel" className="w-14 h-14 rounded-2xl object-cover mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-semibold text-[#263a2e] tracking-tight">
            Revel Client Portal
          </h1>
          <p className="font-sans text-sm text-[#8a8880] mt-1">
            Welcome, {result.record.user.name}
          </p>
        </div>

        <Card className="border-[#e2e0d9] shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="font-heading text-lg text-[#464540]">Set your password</CardTitle>
            <CardDescription className="font-sans text-[#8a8880]">
              Choose a password to access your portal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SetPasswordForm token={token} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InvalidLink({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#ece9e1] px-4">
      <div className="w-full max-w-md text-center space-y-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#263a2e] mb-2">
          <span className="text-[#d3de2c] font-bold text-xl tracking-tight">R</span>
        </div>
        <h1 className="font-heading text-xl font-semibold text-[#263a2e]">Link invalid or expired</h1>
        <p className="text-sm text-[#8a8880]">{message}</p>
        <p className="text-sm text-[#8a8880]">
          Contact your{" "}
          <span className="text-[#464540]">Revel account manager</span>{" "}
          for a new invitation.
        </p>
        <Link href="/login" className="inline-block text-sm text-[#263a2e] underline underline-offset-2 mt-2">
          Back to login
        </Link>
      </div>
    </div>
  );
}
