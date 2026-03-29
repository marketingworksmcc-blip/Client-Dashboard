import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "Revel Agency <onboarding@resend.dev>";
const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export async function sendWelcomeEmail({
  name,
  email,
  token,
  clientName,
}: {
  name: string;
  email: string;
  token: string;
  clientName?: string;
}) {
  const setPasswordUrl = `${APP_URL}/set-password?token=${token}`;
  const portalLabel = clientName ? `the ${clientName} portal` : "your client portal";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Revel</title>
</head>
<body style="margin:0;padding:0;background-color:#ece9e1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ece9e1;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#263a2e;border-radius:14px;width:52px;height:52px;text-align:center;vertical-align:middle;">
                    <span style="color:#d3de2c;font-size:22px;font-weight:700;line-height:52px;">R</span>
                  </td>
                </tr>
              </table>
              <p style="margin:12px 0 0;color:#263a2e;font-size:18px;font-weight:600;letter-spacing:-0.3px;">Revel Client Portal</p>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#ffffff;border-radius:16px;border:1px solid #e2e0d9;padding:40px 40px 36px;">
              <h1 style="margin:0 0 8px;color:#263a2e;font-size:22px;font-weight:600;letter-spacing:-0.4px;">Welcome, ${escapeHtml(name)}</h1>
              <p style="margin:0 0 24px;color:#8a8880;font-size:15px;line-height:1.6;">
                You've been added to ${portalLabel}. Set your password below to get started.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="${setPasswordUrl}"
                       style="display:inline-block;background-color:#263a2e;color:#ece9e1;text-decoration:none;font-size:15px;font-weight:600;padding:13px 32px;border-radius:10px;letter-spacing:-0.2px;">
                      Set your password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 6px;color:#8a8880;font-size:13px;">Or copy and paste this link into your browser:</p>
              <p style="margin:0 0 24px;font-size:12px;color:#464540;word-break:break-all;background-color:#f0efe9;padding:10px 12px;border-radius:8px;border:1px solid #e2e0d9;">
                ${setPasswordUrl}
              </p>

              <table cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid #e2e0d9;padding-top:20px;">
                <tr>
                  <td style="color:#8a8880;font-size:12.5px;line-height:1.6;">
                    This link expires in <strong style="color:#464540;">72 hours</strong>. If you weren't expecting this email, you can safely ignore it.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;color:#8a8880;font-size:12px;">Revel Agency &mdash; Sent on behalf of your account manager</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: `You've been added to ${portalLabel} — set your password`,
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}

function escapeHtml(str: string) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
