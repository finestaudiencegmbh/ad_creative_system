import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { createPasswordResetToken, resetPasswordWithToken, sendPasswordResetEmail } from "../password-reset";
import { TRPCError } from "@trpc/server";

/**
 * Password Reset Router
 * Handles password reset request and password update
 */
export const passwordResetRouter = router({
  /**
   * Request password reset
   * Sends email with reset link
   */
  requestReset: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await createPasswordResetToken(input.email);

        if (!result) {
          // Don't reveal if email exists or not (security best practice)
          return {
            success: true,
            message: "Falls ein Account mit dieser E-Mail existiert, wurde eine Reset-E-Mail versendet.",
          };
        }

        // Send email
        await sendPasswordResetEmail(input.email, result.token);

        return {
          success: true,
          message: "Falls ein Account mit dieser E-Mail existiert, wurde eine Reset-E-Mail versendet.",
        };
      } catch (error) {
        console.error("[Password Reset] Request failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Fehler beim Versenden der Reset-E-Mail",
        });
      }
    }),

  /**
   * Reset password with token
   */
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        newPassword: z.string().min(8, "Passwort muss mindestens 8 Zeichen lang sein"),
      })
    )
    .mutation(async ({ input }) => {
      const success = await resetPasswordWithToken(input.token, input.newPassword);

      if (!success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Ungültiger oder abgelaufener Reset-Token",
        });
      }

      return {
        success: true,
        message: "Passwort erfolgreich zurückgesetzt",
      };
    }),
});
