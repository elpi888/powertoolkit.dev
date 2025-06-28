# Local Development Setup for Open Chat

This guide provides step-by-step instructions to set up the Open Chat application for local development after migrating to Clerk for authentication and potentially Supabase for the database.

## Prerequisites

*   Node.js (latest LTS version recommended, or version specified in `.nvmrc` if present)
*   pnpm (package manager, version specified in `package.json` if present)
*   Git
*   Access to a PostgreSQL database (either local, Docker, or a cloud-hosted one like Supabase).
*   A Clerk account and an active Clerk application.
*   API keys for any integrated services you plan to use (e.g., OpenRouter, Exa, E2B, Mem0).

## Setup Steps

1.  **Clone the Repository:**
    ```bash
    git clone <repository-url>
    cd <repository-name>
    ```

2.  **Install Dependencies:**
    Ensure you have pnpm installed. Then run:
    ```bash
    pnpm install
    ```

3.  **Set Up Environment Variables:**
    *   Copy the example environment file:
        ```bash
        cp .env.example .env
        ```
    *   Open the `.env` file in a text editor. You will need to fill in the required values. Refer to the updated `.env.example` for a full list of necessary keys. At a minimum, you'll need:
        *   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: From your Clerk Dashboard (API Keys section).
        *   `CLERK_SECRET_KEY`: From your Clerk Dashboard (API Keys section).
        *   `DATABASE_URL`: Your PostgreSQL connection string.
            *   If using a local PostgreSQL instance, it might look like: `postgresql://user:password@localhost:5432/open-chat`
            *   If using Supabase, use the **Direct connection** string: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres`
        *   `OPENROUTER_API_KEY`: Your OpenRouter API key (if using OpenRouter models).
        *   *(Optional)* API keys for `EXA_API_KEY`, `E2B_API_KEY`, `MEM0_API_KEY` if you intend to use those specific toolkits.
        *   *(Optional)* `REDIS_URL` and `BLOB_READ_WRITE_TOKEN` if using resumable streams and Vercel Blob storage for attachments.

4.  **Clerk JWT Template Configuration (Important if you had migrated users with existing IDs, good practice otherwise):**
    *   This ensures consistent User ID handling between Clerk and your application database.
    *   Go to your Clerk Dashboard -> Your Application -> Sessions and JWTs -> JWT Templates.
    *   Create a new template or edit the default one.
    *   Ensure the template JSON includes at least:
        ```json
        {
          "user_id": "{{user.external_id || user.id}}"
          // You can add other claims like email, name, image_url as needed
        }
        ```
        (If you have no migrated users, `{{user.id}}` is sufficient, but `{{user.external_id || user.id}}` is robust.)
    *   Set this template as the default for your Clerk application.

5.  **Database Setup & Migration:**
    *   Ensure your PostgreSQL database server (local or Supabase) is running and accessible using the connection string provided in your `DATABASE_URL`.
    *   Run Prisma migrations to set up the database schema:
        ```bash
        pnpm prisma migrate deploy
        ```
    *   *(Optional)* If your application has seed data defined in `prisma/seed.ts` (e.g., for default features, workbenches), run the seed script:
        ```bash
        pnpm db:seed
        ```

6.  **Generate Prisma Client:**
    The `postinstall` script in `package.json` usually handles this. However, if you encounter Prisma Client issues or after manual schema changes, you can run it explicitly:
    ```bash
    pnpm prisma generate
    ```

7.  **Run the Development Server:**
    ```bash
    pnpm dev
    ```
    The application should now typically be running at `http://localhost:3000`.

8.  **Testing - First Use:**
    *   Open your browser and navigate to `http://localhost:3000`.
    *   **Sign Up:** Create a new user account through the Clerk sign-up flow.
    *   **Sign In:** Log in with the newly created account.
    *   **Verify Functionality:**
        *   Confirm that protected routes/features are accessible after login.
        *   Test core application functionalities (e.g., creating and interacting with chats, workbenches).
        *   Check the browser console and your terminal (where `pnpm dev` is running) for any errors.

## Subsequent Local Development

*   To start the application: `pnpm dev`
*   To update database schema after `prisma/schema.prisma` changes: `pnpm prisma migrate dev` followed by `pnpm prisma generate`.

## Troubleshooting Tips

*   **Environment Variables:** Double-check that all required variables in your `.env` file are correctly set. Refer to `src/env.js` for runtime validation of these variables.
*   **Clerk Configuration:** Ensure your Clerk application settings in the Clerk Dashboard are correct (e.g., redirect URLs for OAuth providers if you configure them in Clerk, enabled authentication methods).
*   **Database Connectivity:** Verify your `DATABASE_URL` is accurate and that your PostgreSQL server is running and accessible.
*   **Prisma Client Issues:** If you encounter errors related to Prisma Client (e.g., "PrismaClientInitializationError"), ensure `pnpm prisma generate` has been run successfully after any schema modifications or dependency updates.
*   **Port Conflicts:** If `http://localhost:3000` is in use, the `pnpm dev` command might fail or use an alternative port. Check the terminal output.
```
