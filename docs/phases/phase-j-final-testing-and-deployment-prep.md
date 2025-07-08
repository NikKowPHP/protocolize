Of course. I have performed the critical review and will now generate the detailed, atomic, and fully explicit to-do list for the final phase of development, **Phase J**.

This is the "production readiness" phase. It focuses on ensuring the application is stable, observable, and correctly configured for a live deployment on Vercel. Completing this phase signifies that the application is no longer just a development project but a robust service ready for real users. The instructions are explicit and contain all necessary code, configurations, and manual testing steps for the autonomous agent and a human operator to follow.

---

# **Phase J: Final Testing, Observability & Deployment Preparation**

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
    *   **Action:** Follow the prompts from the CLI. Log in to your Sentry account, select or create a project named "protocolize". Allow the wizard to create/modify the following files: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `sentry.properties`, `next.config.mjs`, and `.sentryclirc`. It will also add `SENTRY_AUTH_TOKEN` to a `.env.sentry-build-plugin` file and `SENTRY_DSN` to your `.env` file.

-   [ ] **Task 1.3: Update `.gitignore` for Sentry:** Ensure Sentry-specific environment files are not committed to the repository.
    *   **File:** `.gitignore`
    *   **Action:** Add the following line to the end of the file.
    ```
    .env.sentry-build-plugin
    ```

-   [ ] **Task 1.4: Manually Test Error Reporting:** Intentionally introduce a small, temporary error in a component to verify Sentry is working.
    *   **File:** `src/app/dashboard/page.tsx`
    *   **Action:** Add a button with an `onClick` handler that throws an error.
    ```tsx
    // Add this to the top of the component for testing purposes
    "use client";
    import { Button } from "@/components/ui/button";

    // Add this button inside the return statement of the component
    <Button onClick={() => { throw new Error("Sentry Frontend Test Error"); }}>Test Sentry</Button>
    ```
    *   **Verification:** Run the app locally, navigate to the dashboard, click the button, and confirm that a new issue appears in your Sentry project dashboard.
    *   **Cleanup:** **Remove the test button and its related code from `src/app/dashboard/page.tsx` after verification.**

---
### 2. Production Environment Configuration

-   [ ] **Task 2.1: Finalize Production Environment Variables:** This is a manual step for the human operator. All required production keys must be gathered and ready.
    *   **Action:** Create a final list of all production keys based on `.env.example`. This includes production values for:
        *   `DATABASE_URL` (from your production PostgreSQL provider)
        *   `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`
        *   `GEMINI_API_KEY`
        *   `YOUTUBE_API_KEY` & `YOUTUBE_CHANNEL_ID`
        *   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (production key)
        *   `STRIPE_SECRET_KEY` (production key)
        *   `STRIPE_WEBHOOK_SECRET` (production webhook secret)
        *   `STRIPE_PREMIUM_PRICE_ID` (production price ID)
        *   `NEXT_PUBLIC_VAPID_PUBLIC_KEY` & `VAPID_PRIVATE_KEY` & `VAPID_MAILTO`
        *   `CRON_SECRET` (A secure, randomly generated string)
        *   `SENTRY_DSN`

-   [ ] **Task 2.2: Configure Vercel Project:** This is a manual step for the human operator.
    *   **Action:** Log in to your Vercel account and create a new project linked to your Git repository.
    *   Navigate to the **Settings > Environment Variables** tab.
    *   Add all the production environment variables from Task 2.1 to the Vercel project. Ensure sensitive keys like `STRIPE_SECRET_KEY` and `DATABASE_URL` are configured as "Secret".

-   [ ] **Task 2.3: Configure Production Webhook Endpoints:** This is a manual step for the human operator.
    *   **Stripe:** In your Stripe Dashboard, go to **Developers > Webhooks**. Create a new endpoint for your production URL (e.g., `https://www.protocolize.app/api/stripe/webhook`). Use the production webhook secret.
    *   **Action:** Ensure this webhook is configured to listen for the same events as the test webhook: `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`.

---
### 3. End-to-End Manual Testing

-   [ ] **Task 3.1: Execute Full Manual Test Plan:** This is a manual verification step for the human operator. Systematically go through all critical user flows on a local or staging environment.
    *   **Action:** Follow this checklist:
        *   [ ] **User Flow:** Register a new user, log out, log back in.
        *   [ ] **Content Flow:** Verify published protocols appear on the dashboard for the new user.
        *   [ ] **Freemium Flow:** As a free user, attempt to access a premium feature (e.g., create a custom reminder) and verify an upgrade prompt appears.
        *   [ ] **Billing Flow (Crucial):**
            *   [ ] Use a test card to upgrade to the Premium plan via Stripe Checkout.
            *   [ ] Verify the redirect to the success page works.
            *   [ ] Verify the user's role and subscription status are updated in the database and they now have premium access.
            *   [ ] Navigate to Settings and click "Manage Billing". Verify it redirects to the Stripe Customer Portal.
            *   [ ] In the Stripe Portal, cancel the subscription.
            *   [ ] Verify the `customer.subscription.deleted` webhook fires and the user's access is immediately downgraded back to "Free".
        *   [ ] **Premium Feature Flow:** As a (temporary) premium user, create a custom reminder and log adherence to a protocol. Verify the data is saved correctly.
        *   [ ] **Notification Flow:** Subscribe to push notifications in Settings. Manually trigger the reminder cron job API (if possible) or wait for it to run and verify a push notification is received.
        *   [ ] **Admin Flow:**
            *   [ ] Manually set a user's role to `ADMIN` in the database.
            *   [ ] Log in as the admin and navigate to `/admin/dashboard`.
            *   [ ] Verify the draft episodes list is accessible.
            *   [ ] Edit and save a draft. Verify changes persist.
            *   [ ] Publish a draft. Verify it appears for regular users.

---
### 4. Final Deployment

-   [ ] **Task 4.1: Review Production Build Settings:** Check the `next.config.mjs` to ensure there are no development-only configurations.
    *   **File:** `next.config.mjs`
    *   **Action:** Replace the entire file with the Sentry-wrapped production-ready version.
    ```javascript
    // This file sets a custom webpack configuration to use Next.js's
    // static Server Actions.
    // https://nextjs.org/docs/app/building-your-application/configuring/webpack
    
    /** @type {import('next').NextConfig} */
    const nextConfig = {
        webpack: (config) => {
            config.experiments = {
                ...config.experiments,
                topLevelAwait: true,
            }
            return config
        }
    };
    
    export default nextConfig;
    
    
    // Injected content via Sentry wizard below
    
    import { withSentryConfig } from "@sentry/nextjs";
    
    module.exports = withSentryConfig(
      module.exports,
      {
        // For all available options, see:
        // https://github.com/getsentry/sentry-webpack-plugin#options
    
        // Suppresses source map uploading logs during build
        silent: true,
        org: "YOUR_SENTRY_ORG",
        project: "protocolize",
      },
      {
        // For all available options, see:
        // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
    
        // Uploads source maps to Sentry
        widenClientFileUpload: true,
    
        // Hides source maps from generated client bundles
        hideSourceMaps: true,
    
        // Automatically tree-shakes Sentry logger statements to reduce bundle size
        disableLogger: true,
    
        // Enables automatic instrumentation of Vercel Cron Monitors.
        // See the following for more information:
        // https://docs.sentry.io/product/crons/
        // https://vercel.com/docs/cron-jobs
        automaticVercelMonitors: true,
      }
    );
    ```
    *Note: The `YOUR_SENTRY_ORG` placeholder will be filled in by the Sentry wizard.*

-   [ ] **Task 4.2: Seed the Production Database:** This is a manual, one-time action for the human operator.
    *   **Action:** Connect to your production database. Run the seed script to populate the `Plan` and initial `Protocol` data.
    *   **Command:** `npx prisma db seed` (run with the production `DATABASE_URL` set in your terminal environment).

-   [ ] **Task 4.3: Deploy to Production:** This is a manual action by the human operator.
    *   **Action:** Once all tests pass and configurations are set, merge the `develop` branch (or your feature branch) into the `main` branch.
    *   Push the `main` branch to the linked Git repository.
    *   Vercel will automatically detect the push and trigger a production deployment.
    *   **Verification:** Monitor the deployment logs in the Vercel dashboard for any build errors.

-   [ ] **Task 4.4: Post-Deployment Smoke Test:** This is a final manual verification by the human operator.
    *   **Action:** Once the deployment is live, quickly run through the most critical user flows on the production URL (e.g., register, log in, view dashboard). Check the Sentry dashboard for any immediate errors. Confirm the site is fully operational.