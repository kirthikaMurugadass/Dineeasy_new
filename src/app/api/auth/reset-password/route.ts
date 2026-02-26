import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

type ResetBody = {
  token?: string;
  password?: string;
};

function isStrongPassword(password: string) {
  if (password.length < 8) return false;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasLetter && hasNumber;
}

export async function POST(request: Request) {
  try {
    const { token, password } = (await request.json().catch(() => ({}))) as ResetBody;

    if (!token || !password) {
      return NextResponse.json(
        { message: "Token and new password are required." },
        { status: 400 }
      );
    }

    if (!isStrongPassword(password)) {
      return NextResponse.json(
        {
          message:
            "Password must be at least 8 characters and include letters and numbers.",
        },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const nowIso = new Date().toISOString();

    const { data: tokenRow, error: selectError } = await supabaseAdmin
      .from("password_reset_tokens")
      .select("*")
      .eq("token_hash", tokenHash)
      .is("used_at", null)
      .gt("expires_at", nowIso)
      .maybeSingle();

    if (selectError) {
      console.error("Failed to query password_reset_tokens:", selectError);
      return NextResponse.json(
        { message: "Invalid or expired reset token." },
        { status: 400 }
      );
    }

    if (!tokenRow) {
      return NextResponse.json(
        { message: "Invalid or expired reset token." },
        { status: 400 }
      );
    }

    const userId = tokenRow.user_id as string;

    // Update password via Supabase Admin API (Supabase handles hashing securely)
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password }
    );

    if (updateError) {
      console.error("Failed to update user password:", updateError);
      return NextResponse.json(
        { message: "Unable to reset password. Please try again." },
        { status: 500 }
      );
    }

    const { error: markUsedError } = await supabaseAdmin
      .from("password_reset_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", tokenRow.id);

    if (markUsedError) {
      console.error("Failed to mark reset token as used:", markUsedError);
    }

    return NextResponse.json(
      { message: "Password has been reset successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error in reset-password:", error);
    return NextResponse.json(
      { message: "Unable to reset password. Please try again." },
      { status: 500 }
    );
  }
}

