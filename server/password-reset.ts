import { getDb } from "./db";
import { users, passwordResetTokens } from "../drizzle/schema";
import { eq, and, gt } from "drizzle-orm";
import { randomBytes } from "crypto";
import { hashPassword } from "./auth";

/**
 * Generate secure random token for password reset
 */
export function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Create password reset token for user
 * Returns token that expires in 1 hour
 */
export async function createPasswordResetToken(email: string): Promise<{ token: string; userId: number } | null> {
  const db = await getDb();
  if (!db) return null;

  // Find user by email
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user) {
    return null;
  }

  // Check if user is active
  if (user.isActive !== 1) {
    return null;
  }

  // Generate token
  const token = generateResetToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

  // Store token in database
  await db.insert(passwordResetTokens).values({
    userId: user.id,
    token,
    expiresAt,
    used: 0,
  });

  return { token, userId: user.id };
}

/**
 * Verify password reset token
 * Returns userId if token is valid, null otherwise
 */
export async function verifyResetToken(token: string): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  // Find token in database
  const [resetToken] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.used, 0),
        gt(passwordResetTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!resetToken) {
    return null;
  }

  return resetToken.userId;
}

/**
 * Reset password using token
 */
export async function resetPasswordWithToken(token: string, newPassword: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // Verify token
  const userId = await verifyResetToken(token);
  if (!userId) {
    return false;
  }

  // Hash new password
  const passwordHash = hashPassword(newPassword);

  // Update user password
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));

  // Mark token as used
  await db.update(passwordResetTokens).set({ used: 1 }).where(eq(passwordResetTokens.token, token));

  return true;
}

/**
 * Send password reset email
 * In production, this should use a real email service (SendGrid, AWS SES, etc.)
 */
export async function sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
  // Get frontend URL from environment or use default
  const frontendUrl = process.env.FRONTEND_URL || "https://3000-iifcp8pl6g0xvqpxalng1-27415a74.manusvm.computer";
  const resetLink = `${frontendUrl}/reset-password?token=${token}`;

  // In development: Log to console
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📧 PASSWORD RESET EMAIL");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("To:", email);
  console.log("Reset Link:", resetLink);
  console.log("Token expires in: 1 hour");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // TODO: In production, integrate with email service:
  // - SendGrid: https://sendgrid.com/
  // - AWS SES: https://aws.amazon.com/ses/
  // - Mailgun: https://www.mailgun.com/
  // - Postmark: https://postmarkapp.com/
  
  // Example with SendGrid:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send({
  //   to: email,
  //   from: 'noreply@finestaudience.de',
  //   subject: 'Passwort zurücksetzen - Ad Performance System',
  //   html: `
  //     <h2>Passwort zurücksetzen</h2>
  //     <p>Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt.</p>
  //     <p>Klicken Sie auf den folgenden Link, um ein neues Passwort zu setzen:</p>
  //     <a href="${resetLink}">${resetLink}</a>
  //     <p>Dieser Link ist 1 Stunde gültig.</p>
  //     <p>Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail.</p>
  //   `,
  // });

  return true;
}
