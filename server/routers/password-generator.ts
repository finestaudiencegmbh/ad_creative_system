import { publicProcedure, router } from "../_core/trpc";
import { generateSecurePassword } from "../password-generator";

export const passwordGeneratorRouter = router({
  /**
   * Generate a secure random password
   * Public procedure - no auth required (used in account creation form)
   */
  generate: publicProcedure.query(() => {
    return {
      password: generateSecurePassword(),
    };
  }),
});
