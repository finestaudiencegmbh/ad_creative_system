import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";
import { users, accounts } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { hashPassword } from "../auth";
import { generateSecurePassword } from "../password-generator";
import { hasPermission } from "../auth";

export const usersRouter = router({
  /**
   * List all users for a specific account (Admin only)
   */
  listByAccount: protectedProcedure
    .input(z.object({ accountId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Check permission
      if (!hasPermission(ctx.user.role, "admin")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can list users",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const accountUsers = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          tabPermissions: users.tabPermissions,
          isActive: users.isActive,
          createdAt: users.createdAt,
          lastSignedIn: users.lastSignedIn,
        })
        .from(users)
        .where(eq(users.accountId, input.accountId));

      return accountUsers.map(user => ({
        ...user,
        tabPermissions: user.tabPermissions ? JSON.parse(user.tabPermissions) : null,
      }));
    }),

  /**
   * Add new user to account (Admin only)
   */
  create: protectedProcedure
    .input(
      z.object({
        accountId: z.number(),
        email: z.string().email(),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        tabPermissions: z.array(z.string()).nullable(), // null = all tabs, [] = no tabs, ["campaigns"] = specific tabs
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check permission
      if (!hasPermission(ctx.user.role, "admin")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can create users",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Check if email already exists
      const [existingUser] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already exists",
        });
      }

      // Generate secure password
      const password = generateSecurePassword();
      const passwordHash = hashPassword(password);

      // Create user
      await db.insert(users).values({
        accountId: input.accountId,
        email: input.email,
        passwordHash,
        name: `${input.firstName} ${input.lastName}`,
        role: "customer",
        tabPermissions: input.tabPermissions ? JSON.stringify(input.tabPermissions) : null,
        isActive: 1,
      });

      // Get account details for welcome email
      const [account] = await db.select().from(accounts).where(eq(accounts.id, input.accountId)).limit(1);

      // Send welcome email
      // TODO: In production, replace console.log with actual email service
      const loginUrl = `${process.env.VITE_OAUTH_PORTAL_URL || 'http://localhost:3000'}/login`;
      console.log(`\n=== USER WELCOME EMAIL ===`);
      console.log(`To: ${input.email}`);
      console.log(`Subject: Willkommen bei Finest Ads - ${account?.companyName || 'Ihr Account'}`);
      console.log(`\nHallo ${input.firstName} ${input.lastName},\n`);
      console.log(`Sie wurden zu folgendem Account hinzugefügt: ${account?.companyName || 'Unbekannt'}\n`);
      console.log(`Login-Daten:`);
      console.log(`E-Mail: ${input.email}`);
      console.log(`Passwort: ${password}`);
      console.log(`\nLogin-Link: ${loginUrl}`);
      console.log(`\nViele Grüße,`);
      console.log(`Finest Audience Team`);
      console.log(`=========================\n`);

      return {
        success: true,
        temporaryPassword: password, // Return for admin to see
      };
    }),

  /**
   * Update user (Admin only)
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        email: z.string().email().optional(),
        name: z.string().optional(),
        tabPermissions: z.array(z.string()).nullable().optional(),
        isActive: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check permission
      if (!hasPermission(ctx.user.role, "admin")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update users",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { id, ...updateData } = input;

      // Convert tabPermissions to JSON string if provided
      const finalUpdateData: any = { ...updateData };
      if (updateData.tabPermissions !== undefined) {
        finalUpdateData.tabPermissions = updateData.tabPermissions ? JSON.stringify(updateData.tabPermissions) : null;
      }

      await db.update(users).set(finalUpdateData).where(eq(users.id, id));

      return { success: true };
    }),

  /**
   * Reset user password (Admin only)
   */
  resetPassword: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Check permission
      if (!hasPermission(ctx.user.role, "admin")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can reset passwords",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Get user details
      const [user] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Generate new password
      const newPassword = generateSecurePassword();
      const passwordHash = hashPassword(newPassword);

      // Update password
      await db.update(users).set({ passwordHash }).where(eq(users.id, input.userId));

      // Send password reset email
      // TODO: In production, replace console.log with actual email service
      console.log(`\n=== PASSWORD RESET EMAIL ===`);
      console.log(`To: ${user.email}`);
      console.log(`Subject: Ihr neues Passwort - Finest Ads`);
      console.log(`\nHallo ${user.name || 'Benutzer'},\n`);
      console.log(`Ihr Passwort wurde zurückgesetzt.\n`);
      console.log(`Neues Passwort: ${newPassword}`);
      console.log(`\nBitte ändern Sie Ihr Passwort nach dem Login.`);
      console.log(`\nViele Grüße,`);
      console.log(`Finest Audience Team`);
      console.log(`============================\n`);

      return {
        success: true,
        temporaryPassword: newPassword, // Return for admin to see
      };
    }),

  /**
   * Delete user (Admin only)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Check permission
      if (!hasPermission(ctx.user.role, "admin")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can delete users",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Prevent deleting super admin
      const [user] = await db.select().from(users).where(eq(users.id, input.id)).limit(1);

      if (user?.role === "super_admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot delete super admin",
        });
      }

      await db.delete(users).where(eq(users.id, input.id));

      return { success: true };
    }),
});
