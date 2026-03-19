"use client";

import Link from "next/link";
import { useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        router.replace("/");
      }
    }

    checkUser();
  }, [router, supabase]);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");
    setInfoMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setErrorMessage("Enter your email first to receive a reset link.");
      setInfoMessage("");
      return;
    }

    setErrorMessage("");
    setInfoMessage("");
    setIsSendingReset(true);

    const redirectBaseUrl = appUrl || window.location.origin;
    const redirectTo = `${redirectBaseUrl}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    setIsSendingReset(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setInfoMessage("Password reset link sent. Check your email.");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Log in to BookStack</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isSendingReset}
                className="text-sm text-muted-foreground underline-offset-4 hover:underline disabled:pointer-events-none disabled:opacity-50"
              >
                {isSendingReset ? "Sending reset link..." : "Forgot password?"}
              </button>
            </div>

            {errorMessage ? <p className="text-sm text-red-500">{errorMessage}</p> : null}
            {infoMessage ? (
              <p className="text-sm text-emerald-600">{infoMessage}</p>
            ) : null}

            <Button type="submit" className="w-full">
              Log in
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Need an account?{" "}
              <Link href="/signup" className="underline underline-offset-4">
                Sign up
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
