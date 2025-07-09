### **Implementation Plan: Achieving 100% Specification Compliance for Protocolize**

This document outlines the prioritized, atomic work plan required to address all discrepancies identified in the SpecCheck audit report. The plan is structured to be executed by an AI developer agent, ensuring a systematic path to full compliance with the `app_description.md` specification.

The work is prioritized to first implement missing critical functionality (P1), then correct partial implementations (P2), and finally update the documentation to reflect implemented but undocumented features (P3). There are no P0-level critical bugs to fix.

---

### **P1 - Missing Feature Implementation**

*This tier focuses on creating entirely missing features, primarily the UI for premium functionality and the full implementation of community features.*

- [x] **CREATE**: [PR-030]: Create the UI button for logging protocol adherence.
    - **File(s)**: `src/components/protocol-card.tsx` (or a new component if more appropriate, like a protocol detail page)
    - **Action**: Add a "Mark as Complete for Today" button to the UI for each protocol. This button should, when clicked, trigger a mutation that calls the `POST /api/tracking` endpoint with the `protocolId` and the current date.
    - **Reason**: Audit Finding: "[🟡 Partial] PR-030: ...no UI component was found in the codebase that allows a user to trigger this action."

- [x] **CREATE**: [PR-061]: Create the API endpoint to fetch public notes for an episode.
    - **File(s)**: `src/app/api/notes/route.ts` (or a new route like `src/app/api/notes/public/route.ts`)
    - **Action**: Create a new GET handler that accepts an `episodeId`. This handler should query the `Note` model, filtering for notes where `episodeId` matches and `isPublic` is `true`. It should not require authentication.
    - **Reason**: Audit Finding: "[❌ Unverified] PR-061: No API endpoint or UI component was found that fetches or displays public notes from other users."

- [x] **CREATE**: [PR-061]: Create the UI component to display public notes.
    - **File(s)**: `src/app/journal/page.tsx` (or a new `PublicNotesList.tsx` component)
    - **Action**: Create a new component that fetches data from the public notes API endpoint created in the previous step. It should render a list of public notes, including their content and potentially the author's name (if available and privacy allows). This component should be displayed on the journal page or a relevant episode detail page.
    - **Reason**: Audit Finding: "[❌ Unverified] PR-061: No API endpoint or UI component was found that fetches or displays public notes from other users."

---

### **P2 - Mismatches & Corrections**

*This tier focuses on updating existing components and backend logic to fully satisfy their user stories and technical requirements.*

- [x] **UPDATE**: [PR-SYS-010]: Implement admin notifications for content ingestion failures.
    - **File(s)**: `src/app/api/cron/ingest-content/route.ts`
    - **Action**: In the `catch` block of the main `try...catch` statement, add logic to send an alert. This can be achieved by integrating a service like Sentry to capture the error with a high severity level or by using a simple email service. The existing `console.error` should be augmented with this notification.
    - **Reason**: Audit Finding: "[🟡 Partial] PR-SYS-010: ...there is no implementation for actively notifying an admin (e.g., via email or another service)."

- [x] **UPDATE**: [PR-060]: Add a UI switch to the Note Editor for making a note public.
    - **File(s)**: `src/components/note-editor.tsx`
    - **Action**: Within the `NoteEditor` component's form, add a `Switch` component from `shadcn/ui` bound to a new form field, `isPublic`. Ensure this switch is disabled and shows a tooltip or message indicating it's a "Premium feature" if the user is not on the premium tier. The value of this switch must be passed in the `createNote` mutation payload.
    - **Reason**: Audit Finding: "[🟡 Partial] PR-060: ...the `NoteEditor` component ... does not include a switch or checkbox to set this flag."

---

### **P3 - Documentation Updates**

*This final tier brings the project's documentation into alignment with the fully-implemented codebase.*

- [x] **DOCS**: Document the API rate-limiting feature.
    - **File(s)**: `docs/app_description.md`
    - **Action**: In Section `8.3. API & Error Handling`, add a new subsection or bullet point for "API Security". The text should state: "Endpoints are hardened with rate limiting to prevent abuse and brute-force attacks on sensitive routes like authentication."
    - **Reason**: Audit Finding: "Undocumented Functionality ... A custom memory-based rate limiter (`authRateLimiter`) has been implemented and applied to all authentication-related API endpoints...This entire ... framework is not mentioned in the specification."