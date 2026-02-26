"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 429) {
        toast.error(
          data?.message ??
            "Too many requests. Please wait a few minutes and try again."
        );
      } else {
        toast.success(
          "If an account exists for this email, a reset link has been sent."
        );
        setSubmitted(true);
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

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
                  Forgot password
                </h1>
                <p className="text-sm text-muted-foreground">
                  Enter the email associated with your account and we&apos;ll
                  send you a secure link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-foreground"
                  >
                    Email address
                  </Label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                        focusedField === "email"
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      className={`h-12 rounded-xl border bg-background pl-10 pr-4 text-foreground placeholder:text-muted-foreground transition-all ${
                        focusedField === "email"
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
                      }`}
                      required
                      disabled={loading || submitted}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !email || submitted}
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
                        <span>Sending link...</span>
                      </motion.div>
                    ) : submitted ? (
                      <motion.span
                        key="submitted"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        Check your email
                      </motion.span>
                    ) : (
                      <motion.span
                        key="default"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        Send reset link
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  For security, we always respond with the same message, even if
                  the email is not registered.
                </p>

                <p className="text-center text-sm text-muted-foreground">
                  Remember your password?{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    Back to login
                  </button>
                </p>
              </form>
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
                src="/images/image1.jpg"
                alt="Elegant restaurant interior"
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
                  Secure access, made simple.
                </h2>
                <p className="mx-auto max-w-sm text-base text-white/90">
                  We use time-limited, single-use links to keep your
                  DineEasy account safe while giving you a smooth recovery
                  experience.
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

