import { z } from "zod";

/** Shared primitives — expand per module in later phases. */
export const uuidSchema = z.string().uuid();

export const nonEmptyStringSchema = z.string().trim().min(1);

/** Example stub for future RHF + Zod forms (Phase 2+). */
export const placeholderSignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type PlaceholderSignInValues = z.infer<typeof placeholderSignInSchema>;
