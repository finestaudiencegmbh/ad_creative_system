import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { authenticateUser, getUserById } from "../auth";
import { TRPCError } from "@trpc/server";

/**
 * Authentication Router
 * Handles login, logout, and current user info
 */
export const authRouter = router({
  /**
   * Login with email and password
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await authenticateUser(input.email, input.password);

      if (!result) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      return {
        user: result.user,
        token: result.token,
      };
    }),

  /**
   * Get current user info
   */
  me: protectedProcedure.query(async ({ ctx }) => {
    const userWithAccount = await getUserById(ctx.user.id);

    if (!userWithAccount) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not found",
      });
    }

    return userWithAccount;
  }),

  /**
   * Logout (client-side will clear token)
   */
  logout: protectedProcedure.mutation(async () => {
    return { success: true };
  }),
});
