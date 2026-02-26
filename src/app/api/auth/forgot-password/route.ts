import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendResetPasswordEmail } from "@/lib/email";
import { getClientIdentifier, isRateLimited } from "@/lib/rate-limit";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  const genericMessage =
    "If an account exists for this email, a reset link has been sent.";

  try {
    const { email } = (await request.json().catch(() => ({}))) as {
      email?: string;
    };

    const identifier = getClientIdentifier(request);
    if (isRateLimited(identifier)) {
      return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    if (!email || !isValidEmail(email)) {
      // Return generic success to avoid email enumeration.
      return NextResponse.json({ message: genericMessage }, { status: 200 });
    }

    const supabaseAdmin = createAdminClient();

    // Look up user by email via Supabase Admin API
    // listUsers doesn't support email filter, so we list and filter manually
    const { data: usersData, error: listError } =
      await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000, // Get enough users to find the one we need
      });

    if (listError) {
      console.error("[forgot-password] Failed to list users:", listError);
      // Still return generic success to avoid email enumeration
      return NextResponse.json({ message: genericMessage }, { status: 200 });
    }

    // Find user by email in the results
    const user = usersData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Do not reveal user existence
      return NextResponse.json({ message: genericMessage }, { status: 200 });
    }

    // Generate a secure token
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    // Invalidate existing tokens for this user
    const { error: deleteError } = await supabaseAdmin
      .from("password_reset_tokens")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      console.error(
        "Failed to delete existing password reset tokens:",
        deleteError
      );
    }

    // Store hashed token and expiry
    const { error: insertError } = await supabaseAdmin
      .from("password_reset_tokens")
      .insert({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error("Failed to insert password reset token:", insertError);
      // Still respond generically
      return NextResponse.json({ message: genericMessage }, { status: 200 });
    }

    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      new URL(request.url).origin ||
      "http://localhost:3000";

    const resetUrl = new URL("/reset-password", origin);
    resetUrl.searchParams.set("token", token);

    // Send reset password email
    try {
      await sendResetPasswordEmail(email, resetUrl.toString());
      console.log(`[forgot-password] Reset email sent successfully to ${email}`);
    } catch (emailError: any) {
      // Check if it's a Resend testing mode limitation
      const isTestingModeError =
        emailError?.message?.includes("testing mode") ||
        emailError?.message?.includes("verified email");

      if (isTestingModeError) {
        console.warn(
          `[forgot-password] Resend testing mode limitation: ${emailError.message}`
        );
        console.warn(
          `[forgot-password] Reset token has been stored. User can request again after domain verification.`
        );
      } else {
        console.error(
          "[forgot-password] Failed to send reset email:",
          emailError
        );
      }
      // Still return success to avoid email enumeration
      // Token is stored, user can request again if email fails
    }

    return NextResponse.json({ message: genericMessage }, { status: 200 });
  } catch (error) {
    console.error("Unexpected error in forgot-password:", error);
    // Generic response to avoid leaking details
    return NextResponse.json(
      { message: genericMessage },
      {
        status: 200,
      }
    );
  }
}

