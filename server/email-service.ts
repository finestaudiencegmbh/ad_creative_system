/**
 * Email Service using Manus Built-in Forge API
 * 
 * Sends transactional emails (welcome emails, password resets) via Manus infrastructure.
 */

import { ENV } from "./_core/env";

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
 * Send email via Manus Forge API
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResponse> {
  const { to, subject, html, text } = params;

  if (!ENV.forgeApiUrl) {
    console.error("[Email] BUILT_IN_FORGE_API_URL not configured");
    return { success: false, error: "Email service not configured" };
  }

  if (!ENV.forgeApiKey) {
    console.error("[Email] BUILT_IN_FORGE_API_KEY not configured");
    return { success: false, error: "Email service authentication missing" };
  }

  try {
    const response = await fetch(`${ENV.forgeApiUrl}/email/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ENV.forgeApiKey}`,
      },
      body: JSON.stringify({
        to,
        subject,
        html,
        text: text || stripHtml(html),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Email] Failed to send email to ${to}:`, errorText);
      return { 
        success: false, 
        error: `Email service returned ${response.status}: ${errorText}` 
      };
    }

    const result = await response.json();
    console.log(`[Email] Successfully sent email to ${to}`);
    
    return {
      success: true,
      messageId: result.messageId || result.id,
    };
  } catch (error) {
    console.error("[Email] Error sending email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
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

  const subject = "Willkommen bei AdScale - Deine Login-Daten";
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #5f2faf; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9f9f9; padding: 30px; }
    .credentials { background-color: white; padding: 20px; border-left: 4px solid #5f2faf; margin: 20px 0; }
    .button { display: inline-block; background-color: #5f2faf; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Willkommen bei AdScale</h1>
    </div>
    <div class="content">
      <p>Hallo ${firstName} ${lastName},</p>
      
      <p>Dein Account wurde erfolgreich erstellt! Du kannst dich jetzt mit folgenden Zugangsdaten einloggen:</p>
      
      <div class="credentials">
        <p><strong>E-Mail:</strong> ${to}</p>
        <p><strong>Passwort:</strong> ${password}</p>
      </div>
      
      <p>Aus Sicherheitsgründen empfehlen wir dir, das Passwort nach dem ersten Login zu ändern.</p>
      
      <p style="text-align: center;">
        <a href="${loginUrl}" class="button">Jetzt einloggen</a>
      </p>
      
      <p>Falls du Fragen hast, melde dich gerne bei uns!</p>
      
      <p>Viele Grüße,<br>Dein AdScale Team</p>
    </div>
    <div class="footer">
      <p>Diese E-Mail wurde automatisch generiert. Bitte antworte nicht auf diese E-Mail.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({ to, subject, html });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(params: {
  to: string;
  resetUrl: string;
}): Promise<SendEmailResponse> {
  const { to, resetUrl } = params;

  const subject = "Passwort zurücksetzen - AdScale";
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #5f2faf; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9f9f9; padding: 30px; }
    .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; background-color: #5f2faf; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Passwort zurücksetzen</h1>
    </div>
    <div class="content">
      <p>Hallo,</p>
      
      <p>Du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt.</p>
      
      <p>Klicke auf den folgenden Button, um ein neues Passwort zu setzen:</p>
      
      <p style="text-align: center;">
        <a href="${resetUrl}" class="button">Passwort zurücksetzen</a>
      </p>
      
      <div class="warning">
        <p><strong>⚠️ Wichtig:</strong> Dieser Link ist nur 1 Stunde gültig und kann nur einmal verwendet werden.</p>
      </div>
      
      <p>Falls du diese Anfrage nicht gestellt hast, ignoriere diese E-Mail einfach. Dein Passwort bleibt unverändert.</p>
      
      <p>Viele Grüße,<br>Dein AdScale Team</p>
    </div>
    <div class="footer">
      <p>Diese E-Mail wurde automatisch generiert. Bitte antworte nicht auf diese E-Mail.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({ to, subject, html });
}

/**
 * Strip HTML tags for plain text fallback
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
