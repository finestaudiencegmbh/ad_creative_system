/**
 * Email Service using Resend
 * 
 * Sends transactional emails (welcome emails, password resets) via Resend.
 * Resend is specifically designed for transactional emails with excellent deliverability.
 */

import { Resend } from "resend";

// Initialize Resend only if API key is available
let resend: Resend | null = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send email via Resend
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResponse> {
  const { to, subject, html, text } = params;

  if (!process.env.RESEND_API_KEY || !resend) {
    console.error("[Email] RESEND_API_KEY not configured");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Finest Ads <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
      text: text || stripHtml(html),
    });

    if (error) {
      console.error(`[Email] Failed to send email to ${to}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`[Email] Successfully sent email to ${to}`);
    return { success: true, messageId: data?.id };
  } catch (error: any) {
    console.error("[Email] Error sending email:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Strip HTML tags for plain text fallback
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gi, "")
    .replace(/<script[^>]*>.*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Send welcome email with login credentials
 */
export async function sendWelcomeEmail(params: {
  to: string;
  firstName: string;
  lastName: string;
  password: string;
  loginUrl: string;
}): Promise<SendEmailResponse> {
  const { to, firstName, lastName, password, loginUrl } = params;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Willkommen bei Finest Ads</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #5f2faf 0%, #7c3aed 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Willkommen bei Finest Ads!</h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hallo ${firstName} ${lastName},
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Ihr Account wurde erfolgreich erstellt! Hier sind Ihre Zugangsdaten:
              </p>
              
              <!-- Credentials Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px; margin: 30px 0;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 12px; color: #666666; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      Login-Daten
                    </p>
                    <p style="margin: 0 0 8px; color: #333333; font-size: 15px;">
                      <strong>E-Mail:</strong> ${to}
                    </p>
                    <p style="margin: 0; color: #333333; font-size: 15px;">
                      <strong>Passwort:</strong> <code style="background-color: #e9ecef; padding: 4px 8px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 16px; color: #5f2faf;">${password}</code>
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #5f2faf 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(95, 47, 175, 0.3);">
                      Jetzt anmelden
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                <strong>Sicherheitshinweis:</strong> Bitte ändern Sie Ihr Passwort nach dem ersten Login.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid #e9ecef; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 13px; line-height: 1.6;">
                Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese Nachricht.
              </p>
              <p style="margin: 10px 0 0; color: #999999; font-size: 13px;">
                © ${new Date().getFullYear()} Finest Audience GmbH
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({
    to,
    subject: "Willkommen bei Finest Ads - Ihre Zugangsdaten",
    html,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(params: {
  to: string;
  resetUrl: string;
}): Promise<SendEmailResponse> {
  const { to, resetUrl } = params;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Passwort zurücksetzen</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #5f2faf 0%, #7c3aed 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Passwort zurücksetzen</h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt.
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Klicken Sie auf den folgenden Button, um ein neues Passwort zu setzen:
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #5f2faf 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(95, 47, 175, 0.3);">
                      Passwort zurücksetzen
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                <strong>Wichtig:</strong> Dieser Link ist 1 Stunde gültig.
              </p>
              
              <p style="margin: 20px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail. Ihr Passwort bleibt unverändert.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid #e9ecef; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 13px; line-height: 1.6;">
                Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese Nachricht.
              </p>
              <p style="margin: 10px 0 0; color: #999999; font-size: 13px;">
                © ${new Date().getFullYear()} Finest Audience GmbH
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({
    to,
    subject: "Passwort zurücksetzen - Finest Ads",
    html,
  });
}
