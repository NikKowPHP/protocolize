Of course. Based on the latest audit, the primary remaining work is to fix the non-functional reminder system and its related components. Here is the comprehensive, prioritized implementation plan designed to bring the codebase into full compliance with its documentation.

### **Project Manager's Summary**

The audit has revealed that while most features are implemented, the entire **Reminder system** is non-functional due to a critical bug in the dispatch logic and incomplete implementation on the frontend. This plan prioritizes fixing this system. The work is broken down into three logical steps: first, fixing the frontend form to capture all necessary data (P1); second, fixing the backend dispatch logic to correctly process that data (P2); and finally, adding the missing logic to provide default reminders to new users (P2).

---

### **P0 - Critical Code Fixes**

*(No tasks in this category, as the primary bug is a functional failure rather than a system-crashing error. It is addressed as a high-priority partial implementation fix in P2.)*

---

### **P1 - Implementation of Missing Features**

- [x] **CREATE**: Automatically create default reminders for new users on registration.
    - **File**: `src/lib/user.ts`
    - **Action**: In the `ensureUserInDb` function, after the `const newUser = await prisma.user.create(...)` call, add new logic. This logic should query the database for the three foundational protocols (e.g., where `isFree: true`). Then, for each of these protocols, create a corresponding `UserReminder` record linked to the `newUser.id`. Use default times (e.g., '08:00', '13:00') and a default `timezone` of 'UTC'.
    - **Reason**: To correctly implement the user story "As a free user, I can receive pre-set reminders," which the audit identified as unfulfilled.

---

### **P2 - Correcting Mismatches & Partial Implementations**

- [ ] **UPDATE**: Enhance the `ReminderForm` to capture the user's timezone.
    - **File**: `src/components/reminder-form.tsx`
    - **Action**: Modify the form to include a hidden input for the timezone. Use a `useEffect` hook to set this input's value automatically with `Intl.DateTimeFormat().resolvedOptions().timeZone`. Ensure this `timezone` field is included in the data submitted by the form.
    - **Reason**: The backend API for creating reminders requires a `timezone`, but the frontend form was not providing it. This is a critical part of making the reminder feature functional.

- [ ] **UPDATE**: Pass the timezone when creating a reminder.
    - **File**: `src/components/reminder-form.tsx`
    - **Action**: In the `onSubmit` function, update the `createMutation.mutate` call to include the `timezone` value from the form data, so the payload matches the API's expectation: `{ protocolId, reminderTime, timezone }`.
    - **Reason**: To complete the frontend portion of the reminder creation workflow, ensuring all necessary data is sent to the API.

- [ ] **FIX**: Correct the time-matching logic in the reminder dispatch cron job.
    - **File**: `src/app/api/cron/dispatch-reminders/route.ts`
    - **Action**: Rewrite the `GET` handler's logic. Instead of querying with a flawed `where` clause, fetch all active reminders first: `prisma.userReminder.findMany({ where: { isActive: true }, ... })`. Then, iterate through these reminders in the code. For each reminder, get the current time in the reminder's specific `timezone` using `new Date().toLocaleTimeString('en-GB', { timeZone: reminder.timezone, hour: '2-digit', minute: '2-digit' })` and compare this `HH:mm` string with the `reminder.reminderTime`. Dispatch notifications only for the reminders that match.
    - **Reason**: Audit Finding: "The logic in this route compares a full ISO timestamp with a simple 'HH:mm' time string, meaning the findMany query will never return any reminders. This must be fixed for the core reminder feature to work."

---

### **P3 - Documentation Updates**

*(No tasks in this category as all identified discrepancies require code changes.)*