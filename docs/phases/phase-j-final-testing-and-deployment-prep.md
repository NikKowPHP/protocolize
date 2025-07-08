Of course. Here is the detailed, atomic to-do list for the final phase of development, Phase J, formatted as `phase-j-final-testing-and-deployment-prep.md`.

This is the "production readiness" phase. It focuses on ensuring the application is stable, observable, and correctly configured for a live deployment on Vercel. Completing this phase signifies that the application is no longer just a development project but a robust service ready for real users.

---

# **Phase J: Final Integration, Testing & Deployment Preparation**

**Goal:** Ensure the application is production-ready. This includes end-to-end manual testing of all integrated features, setting up production-grade observability (error tracking, logging), and configuring all production environment variables for the first Vercel deployment.

**Prerequisite:** All previous phases (A through I) must be complete. The application should be fully functional on a local development environment.

---

### 1. Observability and Error Tracking Setup

-   [ ] **Task 1.1: Install Sentry SDKs:** Install the Sentry SDK for Next.js to enable real-time error tracking and performance monitoring.
    ```bash
    npm install --save @sentry/nextjs
    ```

-   [ ] **Task 1.2: Initialize Sentry:** Run the Sentry wizard to automatically configure the project. This will create necessary configuration files and add environment variables.
    *   **Command:** `npx @sentry/wizard@latest -i nextjs`
    *   **Action:** Follow the prompts. Log in to your Sentry account, select or create a project, and allow the wizard to create/modify the following files: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `sentry.properties`, `next.config.mjs`, and `.sentryclirc`. It will also add `SENTRY_AUTH_TOKEN` to a `.env.sentry-build-plugin` file and `SENTRY_DSN` to your `.env` file.

-   [ ] **Task 1.3: Update `.gitignore` for Sentry:** Ensure Sentry-specific environment files are not committed to the repository.
    *   **File:** `.gitignore`
    *   **Action:** Add the following line to the file.
    ```
    .env.sentry-build-plugin
    ```

-   [ ] **Task 1.4: Manually Test Error Reporting:** Intentionally introduce a small, temporary error in a component (e.g., `throw new Error("Sentry test error")` in a button's `onClick` handler) on your local machine. Trigger the error and verify that it appears in your Sentry project dashboard. **Remember to remove the test error afterward.**

---
### 2. Production Environment Configuration

-   [ ] **Task 2.1: Finalize Production Environment Variables:** Prepare the definitive list of all environment variables required for the production deployment.
    *   **Action:** Create a final list based on `.env.example`. This list must include production values for:
        *   `DATABASE_URL` (from your production PostgreSQL provider, e.g., Supabase, Neon, Aiven)
        *   `NEXT_PUBLIC_SUPABASE_URL`
        *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
        *   `GEMINI_API_KEY`
        *   `YOUTUBE_API_KEY`
        *   `YOUTUBE_CHANNEL_ID`
        *   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (production key)
        *   `STRIPE_SECRET_KEY` (production key)
        *   `STRIPE_WEBHOOK_SECRET` (production webhook secret)
        *   `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
        *   `VAPID_PRIVATE_KEY`
        *   `VAPID_MAILTO`
        *   `CRON_SECRET` (A secure, randomly generated string)
        *   `SENTRY_DSN` (from Sentry setup)

-   [ ] **Task 2.2: Configure Vercel Project:**
    *   **Action:** Log in to your Vercel account and create a new project linked to your Git repository.
    *   Navigate to the **Settings > Environment Variables** tab.
    *   Add all the production environment variables from Task 2.1 to the Vercel project. Ensure sensitive keys like `STRIPE_SECRET_KEY` and `DATABASE_URL` are configured as "Secret".

-   [ ] **Task 2.3: Configure Production Webhook Endpoints:**
    *   **Stripe:** In your Stripe Dashboard, go to **Developers > Webhooks**. Create a new endpoint for your production URL (e.g., `https://www.protocolize.app/api/stripe/webhook`). Use the production webhook secret.
    *   **Action:** Ensure this webhook is configured to listen for the same events as the test webhook: `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`.

---
### 3. End-to-End Manual Testing

-   [ ] **Task 3.1: Create a Manual Test Plan:** Create a checklist of all critical user flows to be tested. This ensures complete coverage. The list should include:
    *   [ ] User registration (Sign up)
    *   [ ] Email verification (if enabled in Supabase)
    *   [ ] User login and logout
    *   [ ] Viewing free protocol content on the dashboard
    *   [ ] Navigating between all pages (Dashboard, Journal, Study, Analytics, Pricing, Settings)
    *   [ ] Attempting to access a premium feature (e.g., creating a custom reminder) as a free user and seeing an upgrade prompt.
    *   [ ] Successfully upgrading to a Premium plan via Stripe Checkout (using a test card).
    *   [ ] Verifying premium access is granted immediately after successful payment (check for webhook processing).
    *   [ ] Creating, viewing, and deleting a custom reminder as a premium user.
    *   [ ] Logging adherence to a protocol.
    *   [ ] Viewing the analytics and tracking data.
    *   [ ] Managing the subscription via the Stripe Customer Portal link in Settings.
    *   [ ] Subscribing to and receiving a push notification (requires testing on a deployed environment).

-   [ ] **Task 3.2: Execute End-to-End Testing:** Systematically go through the test plan checklist on a local or staging environment that mirrors the production setup as closely as possible.
    *   **Action:** Perform each step in the test plan. Document any bugs, UI glitches, or unexpected behavior. Address and re-test all identified issues until the entire flow works seamlessly.

-   [ ] **Task 3.3: Test Admin Curation Flow:**
    *   **Action:** Manually set a user's role to `ADMIN` in the database.
    *   [ ] Log in as the admin user and navigate to `/admin/dashboard`.
    *   [ ] Verify you can see and access the list of draft episodes.
    *   [ ] Open a draft, make edits to the title and a protocol's description, and click "Save Draft". Verify the changes persist on page reload.
    *   [ ] Open another draft and click "Save & Publish". Verify it disappears from the drafts list and appears on the public-facing dashboard for a regular user.

### 4. Final Deployment Preparation

-   [ ] **Task 4.1: Review Production Build Settings:** Check the `next.config.mjs` and `package.json` files to ensure there are no development-only configurations that would negatively impact a production build.
    *   **Action:** Ensure `next.config.mjs` is clean. The Sentry wizard may have wrapped it; this is expected and correct.

-   [ ] **Task 4.2: Seed the Production Database:**
    *   **Action:** Connect to your production database and run the seed script to populate the `Plan` and initial `Protocol` data. This is a one-time setup action.
    *   **Command:** `npx prisma db seed` (run with the production `DATABASE_URL` set in your environment).

-   [ ] **Task 4.3: Merge to Main and Deploy:**
    *   **Action:** Once all tests pass and configurations are set, merge the `develop` branch (or your feature branch) into the `main` branch.
    *   Push the `main` branch to your Git repository.
    *   Vercel will automatically detect the push to the main branch and trigger a production deployment.
    *   Monitor the deployment logs in the Vercel dashboard for any build errors.

-   [ ] **Task 4.4: Post-Deployment Smoke Test:**
    *   **Action:** Once the deployment is live, quickly run through the most critical user flows on the production URL (e.g., register, log in, view dashboard) to confirm the site is operational. Check the Sentry dashboard for any immediate errors.