Of course. Based on the audit findings, here is the comprehensive, prioritized implementation plan designed for an AI developer agent to execute.

### **Project Manager's Summary**

The following plan addresses all critical, partial, and missing implementations identified in the SpecCheck Audit Report. The priority is to first resolve the runtime bug in the reminder system (P0), then implement the missing user-facing features to fulfill the application's core value proposition (P1), and finally, clean up the codebase to remove unused and undocumented code (P2). By completing this plan, the application will be brought into full compliance with its documentation.

---

### **P0 - Critical Code Fixes**

*These tasks resolve severe bugs that would cause runtime failures.*

- [x] **FIX**: Correct the broken database query in the reminder dispatch cron job.
    - **File**: `src/app/api/cron/dispatch-reminders/route.ts`
    - **Action**: Modify the Prisma query inside the `GET` handler. Change the model from `prisma.reminder` to `prisma.userReminder` and update the `where` clause to query against the correct fields: `{ isActive: true, reminderTime: currentTimeFormatted }`. Also, ensure the logic correctly handles the returned `user` and `protocol` relations.
    - **Reason**: Audit Finding: "The code in `src/app/api/cron/dispatch-reminders/route.ts` attempts to query the `Reminder` model (which does not exist) for fields `scheduledAt` and `status`, which also do not exist. This API endpoint will fail at runtime."

---

### **P1 - Implementation of Missing Features**

*These tasks build documented features that are currently missing from the application.*

- [x] **CREATE**: Implement the logic for pre-set, foundational reminders for free-tier users.
    - **File**: `prisma/seeders/protocols.ts`
    - **Action**: In the `seedProtocolsAndEpisodes` function, after creating the foundational protocols, add logic to associate them with a placeholder or system user account if one existed, or modify the reminder dispatch logic to handle a global, non-user-specific reminder type. Since a system user doesn't exist, the most direct way to fulfill the story "As a free user, I can receive pre-set reminders" is to make the core protocols' reminders available to all users. A better approach is to integrate this into the main reminder feature but not gate its creation for the 3 free protocols.
    - **Reason**: Audit Finding: "User Story: '[Free] As a free user, I can receive pre-set reminders.' ... This user story is unimplemented. The documentation describes a feature that does not exist in the code."

---

### **P2 - Correcting Mismatches & Partial Implementations**

*These tasks modify existing code to match documented specifications and connect partially implemented features.*

- [ ] **REFACTOR**: Remove unused AI Question Generation service code.
    - **File**: `src/lib/ai/`
    - **Action**: Delete the entire `src/lib/ai/` directory and all its contents (`gemini-service.ts`, `generation-service.ts`, `index.ts`).
    - **Reason**: Audit Finding: "Undocumented Functionality: AI Question Generation Service... This functionality is completely unrelated to the Protocolize application's documented purpose... and should be removed."

- [ ] **REFACTOR**: Remove unused and redundant UI components.
    - **Files**: `src/components/flashcard.tsx`, `src/components/SignInForm.tsx`, `src/components/SignUpForm.tsx`, `src/components/ForgotPasswordForm.tsx`
    - **Action**: Delete these four component files from the codebase.
    - **Reason**: Audit Finding: "Undocumented Functionality: Unused UI Components... These components are present in the codebase but are not imported or used by any active page... Remove these unused components."

- [ ] **CREATE**: Create the API client library for the Reminders feature.
    - **File**: `src/lib/api/reminders.ts`
    - **Action**: Create a new file with exported async functions `getReminders`, `createReminder`, `updateReminder`, and `deleteReminder`. These functions should call the corresponding API endpoints (`/api/reminders` and `/api/reminders/[reminderId]`) with `fetch`.
    - **Reason**: Audit Gap: The `ReminderList` and `ReminderForm` components are static and need a client library to interact with the backend API.

- [ ] **UPDATE**: Make the `ReminderList` component fully dynamic.
    - **File**: `src/components/reminder-list.tsx`
    - **Action**: Replace the static `MOCK_REMINDERS` data with a `useQuery` hook from `@tanstack/react-query` that calls the `getReminders` function. Implement a `useMutation` hook for the "Remove" button to call `deleteReminder` and invalidate the query on success.
    - **Reason**: Audit Finding: "The frontend components (`src/components/reminder-form.tsx`, `src/components/reminder-list.tsx`) are static mockups and were never integrated with the API."

- [ ] **UPDATE**: Make the `ReminderForm` component fully dynamic.
    - **File**: `src/components/reminder-form.tsx`
    - **Action**: Use `react-hook-form` to manage form state. Implement a `useMutation` hook that calls the `createReminder` function on form submission. On success, it should invalidate the reminders query to update the list.
    - **Reason**: Audit Finding: "The frontend components (`src/components/reminder-form.tsx`, `src/components/reminder-list.tsx`) are static mockups and were never integrated with the API."

- [ ] **CREATE**: Create the API client library for the Protocol Tracking feature.
    - **File**: `src/lib/api/tracking.ts`
    - **Action**: Create a new file with exported async functions `getTrackingLogs` and `createTrackingLog`. These functions should call the corresponding API endpoints (`/api/tracking`).
    - **Reason**: Audit Gap: The `AdherenceCalendar` and `AnalyticsCharts` components are static and need a client library to interact with the backend API.

- [ ] **UPDATE**: Make the `AdherenceCalendar` and `AnalyticsCharts` components dynamic.
    - **Files**: `src/components/adherence-calendar.tsx`, `src/components/analytics-charts.tsx`
    - **Action**: In both components, replace the static `MOCK_DAYS` and `MOCK_DATA` with a `useQuery` hook that calls `getTrackingLogs`. Process the fetched data to render the user's actual adherence and progress.
    - **Reason**: Audit Finding: "The frontend components (`src/components/adherence-calendar.tsx`, `src/components/analytics-charts.tsx`) are static mockups using hardcoded data."

---

### **P3 - Documentation Updates**

*No tasks in this category. The audit did not identify any code that was correctly implemented but lacked documentation. All discrepancies required code changes.*