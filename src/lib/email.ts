import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "onboarding@resend.dev";

if (!RESEND_API_KEY) {
  console.warn(
    "[email] RESEND_API_KEY is not set. Password reset emails will not be sent."
  );
}

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const BRAND_NAME = "DineEasy";
const BRAND_PRIMARY_COLOR = "#C6A75E";

export async function sendResetPasswordEmail(to: string, resetLink: string) {
  if (!resend || !RESEND_API_KEY) {
    // Throw error so caller can handle it properly
    throw new Error(
      "Resend client not initialized. RESEND_API_KEY is missing or invalid."
    );
  }

  const subject = "Reset your password";

  const html = `
  <div style="background-color:#f4f4f5;padding:24px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.15);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            <tr>
              <td style="padding:24px 32px;border-bottom:1px solid #e5e7eb;background:linear-gradient(135deg,#111827,#1f2937);">
                <table width="100%">
                  <tr>
                    <td align="left">
                      <div style="display:inline-flex;align-items:center;gap:10px;">
                        <div style="width:32px;height:32px;border-radius:999px;background:rgba(249,250,251,0.08);display:flex;align-items:center;justify-content:center;">
                          <span style="font-size:18px;color:#f9fafb;">🍽️</span>
                        </div>
                        <span style="color:#f9fafb;font-weight:600;font-size:18px;letter-spacing:0.02em;">${BRAND_NAME}</span>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:32px 32px 8px;">
                <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#111827;">Reset your password</h1>
                <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#4b5563;">
                  We received a request to reset the password for your ${BRAND_NAME} account.
                </p>
                <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#4b5563;">
                  Click the button below to create a new password. This link will expire in <strong>15 minutes</strong>.
                </p>

                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0 28px;">
                  <tr>
                    <td align="center">
                      <a href="${resetLink}" style="display:inline-block;padding:12px 28px;border-radius:999px;background:${BRAND_PRIMARY_COLOR};color:#111827;font-weight:600;font-size:14px;text-decoration:none;box-shadow:0 10px 20px rgba(198,167,94,0.45);">
                        Reset password
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin:0 0 18px;font-size:12px;line-height:1.6;color:#6b7280;">
                  If the button doesn’t work, copy and paste this link into your browser:
                </p>
                <p style="margin:0 0 24px;font-size:11px;line-height:1.5;color:#9ca3af;word-break:break-all;">
                  ${resetLink}
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:0 32px 24px;">
                <div style="border-radius:12px;background:#f9fafb;padding:14px 16px;border:1px solid #e5e7eb;">
                  <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#111827;">Security notice</p>
                  <p style="margin:0;font-size:11px;line-height:1.6;color:#6b7280;">
                    If you didn’t request a password reset, you can safely ignore this email.
                    For your security, this link will stop working after 15 minutes or once your password is changed.
                  </p>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:12px 32px 20px;text-align:center;border-top:1px solid #e5e7eb;background:#f9fafb;">
                <p style="margin:8px 0 0;font-size:11px;color:#9ca3af;">
                  © ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
  `;

  try {
    const result = await resend.emails.send({
      from: `${BRAND_NAME} <${EMAIL_FROM}>`,
      to,
      subject,
      html,
    });

    if (result.error) {
      // Handle Resend testing mode limitation
      if (
        result.error.statusCode === 403 &&
        result.error.name === "validation_error" &&
        result.error.message?.includes("testing emails")
      ) {
        const verifiedEmailMatch = result.error.message.match(
          /\(([^)]+)\)/
        );
        const verifiedEmail = verifiedEmailMatch
          ? verifiedEmailMatch[1]
          : "your verified email";

        console.warn(
          `[email] Resend testing mode: Can only send to ${verifiedEmail}. ` +
            `Attempted to send to ${to}. ` +
            `To send to any email, verify a domain at resend.com/domains or upgrade your Resend account.`
        );

        // In development/testing, allow the flow to continue
        // The token is still stored, user can request again when domain is verified
        if (process.env.NODE_ENV === "development") {
          console.warn(
            `[email] Development mode: Email sending skipped. ` +
              `Reset token is stored. To test, use email: ${verifiedEmail} or verify a domain.`
          );
          return result; // Return without throwing to allow flow to continue
        }

        throw new Error(
          `Resend testing mode: Can only send to ${verifiedEmail}. Verify a domain at resend.com/domains to send to any email address.`
        );
      }

      console.error("[email] Resend API error:", result.error);
      throw new Error(`Failed to send email: ${result.error.message}`);
    }

    console.log(`[email] Reset password email sent successfully to ${to}`);
    return result;
  } catch (error) {
    console.error("[email] Error sending reset password email:", error);
    throw error;
  }
}

