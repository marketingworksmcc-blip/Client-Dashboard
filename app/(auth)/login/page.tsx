"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get("welcome") === "1";
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginForm) {
    setAuthError(null);
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setAuthError("Invalid email or password. Please try again.");
      return;
    }

    // Middleware will handle redirect based on role
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#ece9e1] px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo / Brand */}
        <div className="text-center">
          <img src="/revel-icon.png" alt="Revel" className="w-14 h-14 rounded-2xl object-cover mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-semibold text-[#263a2e] tracking-tight">
            Revel Client Portal
          </h1>
          <p className="font-sans text-sm text-[#8a8880] mt-1">
            Sign in to your account
          </p>
        </div>

        {isWelcome && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-center">
            <p className="text-sm text-emerald-700 font-medium">Password set! Sign in to access your portal.</p>
          </div>
        )}

        <Card className="border-[#e2e0d9] shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="font-heading text-lg text-[#464540]">Welcome back</CardTitle>
            <CardDescription className="font-sans text-[#8a8880]">
              Enter your credentials to access your portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[#464540]">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  className="border-[#e2e0d9] focus-visible:ring-[#d3de2c]"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-[#ff6b6c]">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[#464540]">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] pr-10"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a8880] hover:text-[#464540] transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-[#ff6b6c]">{errors.password.message}</p>
                )}
              </div>

              {authError && (
                <div className="rounded-md bg-[#ff6b6c]/10 border border-[#ff6b6c]/20 px-3 py-2">
                  <p className="text-sm text-[#ff6b6c]">{authError}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#263a2e] hover:bg-[#1e2e24] text-[#ece9e1] font-medium"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-[#8a8880]">
          Need access?{" "}
          <span className="text-[#464540]">Contact your Revel account manager.</span>
        </p>
      </div>
    </div>
  );
}
