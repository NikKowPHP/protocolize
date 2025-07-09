Of course. Based on the comprehensive SpecCheck audit, here is the prioritized, atomic, and fully explicit implementation plan designed to bring the codebase into 100% compliance with its specification.

### **Project Manager's Summary**

The audit identified three primary blockers: a non-functional content ingestion pipeline due to a missing AI service, a broken password reset flow from a missing UI component, and a logic error in the database seeder preventing a key free-tier feature from working. This plan prioritizes fixing these issues in a logical order: first, the critical backend failure (P0), then the broken user-facing features (P1), followed by integrating missing dev-ops tooling (P2) and finally, cleaning up documentation (P3).

---

### **P0 - Critical Fixes**

*This task resolves a severe bug that causes a core backend system to fail at runtime.*

- [x] **CREATE**: [PR-SYS-008]: Implement the AI Content Processor service.
    - **File(s)**: `src/lib/ai/content-processor.ts`
    - **Action**: Create the directory `src/lib/ai`. Inside it, create the file `content-processor.ts` with the complete function `extractProtocolsFromTranscript`. This function should initialize the Google Generative AI client and contain the specific prompt logic to parse a transcript into a structured JSON object containing `episodeSummary` and an array of `protocols`.
    - **Reason**: Audit Finding: "The entire content ingestion epic is non-functional. The cron job route at `src/app/api/cron/ingest-content/route.ts` attempts to import from `@/lib/ai/content-processor`. This file, and the entire `src/lib/ai` directory, is missing."

---

### **P1 - Missing Feature Implementation**

*These tasks address broken or unimplemented user stories.*

- [x] **CREATE**: [PR-003]: Implement the missing `ForgotPasswordForm` component.
    - **File(s)**: `src/components/ForgotPasswordForm.tsx`, `src/app/forgot-password/page.tsx`
    - **Action**: Create a new file `src/components/ForgotPasswordForm.tsx`. This component will contain a form with an email input and a submit button. The form's submit handler should call `supabase.auth.resetPasswordForEmail`. Then, update `src/app/forgot-password/page.tsx` to import and render this new component.
    - **Reason**: Audit Finding: "The page at `src/app/forgot-password/page.tsx` attempts to import a component named `ForgotPasswordForm` which is not present in the codebase. This will cause a runtime error, making the feature non-functional."

- [x] **UPDATE**: [PR-011]: Correctly seed foundational protocols as 'free' and 'published'.
    - **File(s)**: `prisma/seeders/protocols.ts`
    - **Action**: In the `foundationalProtocols` array, iterate through each protocol object and ensure the properties `isFree: true` and `status: 'PUBLISHED'` are present.
    - **Reason**: Audit Finding: "The seeder at `prisma/seeders/protocols.ts` creates the foundational protocols but fails to set `isFree: true`. As a result, no foundational reminders are ever created for new users."

---

### **P2 - Mismatches & Corrections**

*These tasks add missing, non-critical tooling specified in the documentation.*

- [x] **SETUP**: Install Sentry for error tracking.
    - **File(s)**: `package.json`, `next.config.mjs`, and new `sentry.*.config.ts` files.
    - **Action**: Run `npm install @sentry/nextjs`. Then, create the necessary configuration files (`sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`) in the project root as per Sentry's documentation, and update `next.config.mjs` to be wrapped with `withSentryConfig`.
    - **Reason**: Audit Finding: "| Observability | Sentry for Error Tracking | The Sentry SDK (`@sentry/nextjs`) is not present in `package.json`. | ❌ Gap |"

---

### **P3 - Documentation Updates**

*These tasks align the specification document with the reality of the codebase.*

- [x] **DOCS**: Document the existing API rate limiting feature.
    - **File(s)**: `docs/app_description.md`
    - **Action**: In Section 8.3 `API & Error Handling`, add a new point: "**API Security:** Endpoints are hardened with rate limiting to prevent abuse and brute-force attacks."
    - **Reason**: Audit Finding: "Undocumented Functionality (Specification Gaps) - Feature: API Rate Limiting... This entire analytics framework is not mentioned in the specification."

- [x] **DOCS**: Remove 'zustand' from the list of specified NPM libraries.
    - **File(s)**: `docs/app_description.md`
    - **Action**: In Section 4 `Key NPM Libraries & Tooling`, delete the line item for "State Management: `zustand`...".
    - **Reason**: Audit Finding: "| State Management | `zustand` | The `zustand` package is not present in `package.json`. | ⚠️ Minor Gap |"