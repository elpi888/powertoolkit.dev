import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

// Removed createAuthSchema and authRuntimeEnv functions as they are NextAuth specific

const createImageModelSchema = () => {
  const imageModelSchema = {};

  if (process.env.OPENAI_API_KEY) {
    imageModelSchema.OPENAI_API_KEY = z.string();
  }

  if (process.env.XAI_API_KEY) {
    imageModelSchema.XAI_API_KEY = z.string();
  }

  return imageModelSchema;
};

const imageModelRuntimeEnv = () => {
  const object = {};

  if (process.env.OPENAI_API_KEY) {
    object.OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  }

  if (process.env.XAI_API_KEY) {
    object.XAI_API_KEY = process.env.XAI_API_KEY;
  }

  return object;
};

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    APP_URL: z.string().url(),
    // AUTH_SECRET: process.env.NODE_ENV === "production" ? z.string() : z.string().optional(), // Removed
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    OPENROUTER_API_KEY: z.string(),
    EXA_API_KEY: z.string().optional(),
    MEM0_API_KEY: z.string().optional(),
    E2B_API_KEY: z.string().optional(),
    // Add Clerk server-side keys
    CLERK_SECRET_KEY: z.string().startsWith("sk_"),
    CLERK_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(), // Optional
    // ...createAuthSchema(), // Removed
    ...createImageModelSchema(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().startsWith("pk_"),
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    APP_URL: process.env.APP_URL,
    // AUTH_SECRET: process.env.AUTH_SECRET, // Removed
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    EXA_API_KEY: process.env.EXA_API_KEY,
    MEM0_API_KEY: process.env.MEM0_API_KEY,
    E2B_API_KEY: process.env.E2B_API_KEY,
    // Add Clerk keys to runtimeEnv
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    // ...authRuntimeEnv(), // Removed
    ...imageModelRuntimeEnv(),
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
