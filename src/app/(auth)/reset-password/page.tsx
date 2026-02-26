"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordStrength = useMemo(
    () => getPasswordStrength(password),
    [password]
  );

  const passwordsMatch =
    password.length > 0 && confirmPassword.length > 0
      ? password === confirmPassword
      : true;

  useEffect(() => {
    if (!token) {
      toast.error("Invalid or expired reset link.");
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      toast.error("Invalid or expired reset link.");
      return;
    }

    if (!password || !confirmPassword) {
      toast.error("Please fill in both password fields.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      toast.error(
        "Password must be at least 8 characters and include letters and numbers."
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data?.message ?? "Unable to reset password.");
        return;
      }

      toast.success("Your password has been reset successfully.");
      setSuccess(true);

      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const disabled =
    loading || !password || !confirmPassword || !passwordsMatch || !token;

  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center p-4 lg:p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-5xl overflow-hidden rounded-2xl border border-border/50 bg-card shadow-xl dark:shadow-2xl"
      >
        <div className="flex min-h-[520px] flex-col lg:flex-row">
          {/* Left - Form */}
          <div className="flex w-full flex-col justify-center bg-card p-8 lg:w-[50%] lg:p-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto w-full max-w-md space-y-6"
            >
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground font-serif">
                  Reset your password
                </h1>
                <p className="text-sm text-muted-foreground">
                  Choose a strong new password to secure your DineEasy account.
                  Your reset link is valid for a limited time and can only be
                  used once.
                </p>
              </div>

              {!token ? (
                <div className="space-y-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                  <p className="text-sm font-medium text-destructive">
                    This reset link is invalid or has expired.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Request a new link from the forgot password page.
                  </p>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-primary hover:text-primary/80"
                  >
                    Go to forgot password
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* New password */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-sm font-medium text-foreground"
                    >
                      New password
                    </Label>
                    <div className="relative">
                      <Lock
                        size={16}
                        className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                          focusedField === "password"
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter a strong password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocusedField("password")}
                        onBlur={() => setFocusedField(null)}
                        className={`h-12 rounded-xl border bg-background pl-10 pr-4 text-foreground placeholder:text-muted-foreground transition-all ${
                          focusedField === "password"
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
                        }`}
                        required
                        disabled={loading || success}
                        autoComplete="new-password"
                        minLength={8}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Use at least 8 characters with letters and numbers.</span>
                      <div className="flex items-center gap-1">
                        <span
                          className={`h-1.5 w-8 rounded-full ${
                            passwordStrength >= 1
                              ? "bg-red-400"
                              : "bg-muted"
                          }`}
                        />
                        <span
                          className={`h-1.5 w-8 rounded-full ${
                            passwordStrength >= 2
                              ? "bg-amber-400"
                              : "bg-muted"
                          }`}
                        />
                        <span
                          className={`h-1.5 w-8 rounded-full ${
                            passwordStrength >= 3
                              ? "bg-emerald-500"
                              : "bg-muted"
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Confirm password */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="confirmPassword"
                      className="text-sm font-medium text-foreground"
                    >
                      Confirm new password
                    </Label>
                    <div className="relative">
                      <Lock
                        size={16}
                        className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                          focusedField === "confirmPassword"
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Re-enter your new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onFocus={() => setFocusedField("confirmPassword")}
                        onBlur={() => setFocusedField(null)}
                        className={`h-12 rounded-xl border bg-background pl-10 pr-4 text-foreground placeholder:text-muted-foreground transition-all ${
                          focusedField === "confirmPassword"
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
                        }`}
                        required
                        disabled={loading || success}
                        autoComplete="new-password"
                        minLength={8}
                      />
                    </div>
                    {!passwordsMatch && confirmPassword.length > 0 && (
                      <p className="text-xs text-destructive">
                        Passwords do not match.
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={disabled || success}
                    className="h-12 w-full rounded-xl bg-gradient-to-r from-[#C6A75E] to-[#B8964A] font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed dark:from-[#D4AF37] dark:to-[#C6A75E]"
                  >
                    <AnimatePresence mode="wait">
                      {loading ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-center gap-2"
                        >
                          <Loader2 size={18} className="animate-spin" />
                          <span>Updating password...</span>
                        </motion.div>
                      ) : success ? (
                        <motion.span
                          key="success"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          Redirecting to login...
                        </motion.span>
                      ) : (
                        <motion.span
                          key="default"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          Save new password
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    Remember your password?{" "}
                    <Link
                      href="/login"
                      className="font-medium text-primary transition-colors hover:text-primary/80"
                    >
                      Back to login
                    </Link>
                  </p>
                </form>
              )}
            </motion.div>
          </div>

          {/* Right - Imagery */}
          <div className="relative hidden w-full overflow-hidden lg:block lg:w-[50%]">
            <motion.div
              animate={{
                scale: [1, 1.03, 1],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute inset-0"
            >
              <Image
                src="/images/image2.jpg"
                alt="Fine dining experience"
                fill
                className="object-cover"
                priority
                unoptimized
              />
            </motion.div>
            <div className="absolute inset-0 bg-black/60 dark:bg-black/60" />
            <div className="relative z-10 flex h-full flex-col items-center justify-center px-8 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="space-y-4"
              >
                <h2 className="text-4xl font-bold text-white font-serif">
                  Your account, your control.
                </h2>
                <p className="mx-auto max-w-sm text-base text-white/90">
                  We never share your password and we only use secure,
                  time-limited links for sensitive actions like password
                  changes.
                </p>
                <Link href="/signup">
                  <Button
                    variant="outline"
                    className="border-2 border-white/50 bg-transparent px-8 py-6 text-base font-semibold text-white transition-all hover:bg-white/10 hover:border-white/70"
                  >
                    Create a new account
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

