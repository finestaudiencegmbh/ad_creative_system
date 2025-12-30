import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { accounts, users } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { authenticateUser, hashPassword, hasPermission } from "../auth";
import { TRPCError } from "@trpc/server";

/**
 * Account Management Router
 * Handles account CRUD operations (Super Admin / Admin only)
 */
export const accountsRouter = router({
  /**
   * List all accounts (Super Admin / Admin only)
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    // Check permission
    if (!hasPermission(ctx.user.role, "admin")) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can view accounts",
      });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const allAccounts = await db.select().from(accounts).orderBy(accounts.createdAt);

    // For each account, get the primary user and all users
    const accountsWithUsers = await Promise.all(
      allAccounts.map(async (account) => {
        const [primaryUser] = await db
          .select()
          .from(users)
          .where(and(eq(users.accountId, account.id), eq(users.role, "customer")))
          .limit(1);

        // Get all users for this account (excluding primary user)
        const allUsers = await db
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
          .where(eq(users.accountId, account.id));

        return {
          ...account,
          primaryUser: primaryUser || null,
          users: allUsers.filter(u => u.id !== primaryUser?.id).map(user => ({
            ...user,
            tabPermissions: user.tabPermissions ? JSON.parse(user.tabPermissions) : null,
          })),
        };
      })
    );

    return accountsWithUsers;
  }),

  /**
   * Get single account by ID (Super Admin / Admin only)
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      // Check permission
      if (!hasPermission(ctx.user.role, "admin")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view account details",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [account] = await db.select().from(accounts).where(eq(accounts.id, input.id)).limit(1);

      if (!account) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Account not found" });
      }

      // Get all users for this account
      const accountUsers = await db.select().from(users).where(eq(users.accountId, account.id));

      return {
        ...account,
        users: accountUsers,
      };
    }),

  /**
   * Create new account (Super Admin / Admin only)
   */
  create: protectedProcedure
    .input(
      z.object({
        companyName: z.string().min(1),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(8),
        metaAccessToken: z.string().optional(),
        metaAdAccountId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check permission
      if (!hasPermission(ctx.user.role, "admin")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can create accounts",
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

      // Create account
      const [newAccount] = await db
        .insert(accounts)
        .values({
          companyName: input.companyName,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          metaAccessToken: input.metaAccessToken || null,
          metaAdAccountId: input.metaAdAccountId || null,
          isActive: 1,
        })
        .$returningId();

      // Create primary user for account
      const passwordHash = hashPassword(input.password);

      await db.insert(users).values({
        accountId: newAccount.id,
        email: input.email,
        passwordHash,
        name: `${input.firstName} ${input.lastName}`,
        role: "customer",
        isActive: 1,
      });

      // Send welcome email
      // TODO: In production, replace console.log with actual email service
      const loginUrl = `${process.env.VITE_OAUTH_PORTAL_URL || 'http://localhost:3000'}/login`;
      console.log(`\n=== WELCOME EMAIL ===`);
      console.log(`To: ${input.email}`);
      console.log(`Subject: Willkommen bei Finest Ads`);
      console.log(`\nHallo ${input.firstName} ${input.lastName},\n`);
      console.log(`Ihr Account wurde erfolgreich erstellt!\n`);
      console.log(`Login-Daten:`);
      console.log(`E-Mail: ${input.email}`);
      console.log(`Passwort: ${input.password}`);
      console.log(`\nLogin-Link: ${loginUrl}`);
      console.log(`\nViele Grüße,`);
      console.log(`Finest Audience Team`);
      console.log(`====================\n`);

      return {
        success: true,
        accountId: newAccount.id,
      };
    }),

  /**
   * Update account (Super Admin / Admin only)
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        companyName: z.string().min(1).optional(),
        metaAccessToken: z.string().optional(),
        metaAdAccountId: z.string().optional(),
        isActive: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check permission
      if (!hasPermission(ctx.user.role, "admin")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update accounts",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { id, ...updateData } = input;

      await db.update(accounts).set(updateData).where(eq(accounts.id, id));

      return { success: true };
    }),

  /**
   * Delete account (Super Admin only)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Check permission - only super_admin can delete
      if (ctx.user.role !== "super_admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only super admins can delete accounts",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.delete(accounts).where(eq(accounts.id, input.id));

      return { success: true };
    }),

  /**
   * Update user password (Super Admin / Admin only)
   */
  updatePassword: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        newPassword: z.string().min(8),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check permission
      if (!hasPermission(ctx.user.role, "admin")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update passwords",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const passwordHash = hashPassword(input.newPassword);

      await db.update(users).set({ passwordHash }).where(eq(users.id, input.userId));

      return { success: true };
    }),
});
