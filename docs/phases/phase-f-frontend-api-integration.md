
# **Phase F: Frontend API Integration**

**Goal:** Make the application fully dynamic by connecting the static frontend to the live backend. This involves **replacing all mock data** in the UI with live data fetched from the newly created API using `@tanstack/react-query` for data fetching, caching, and mutations.

**Prerequisite:** Phase E must be complete. All core API endpoints should be implemented and manually testable.

---

### 1. Setup `@tanstack/react-query`

-   [ ] **Task 1.1: Create a React Query Provider:** Create a new client component to provide the `QueryClient` to the entire application.
    *   **File:** `src/components/query-provider.tsx`
    *   **Action:** Create the file with the following content.
    ```tsx
    "use client"

    import React from 'react';
    import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
    import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

    export default function QueryProvider({ children }: { children: React.ReactNode }) {
      const [queryClient] = React.useState(() => new QueryClient());

      return (
        <QueryClientProvider client={queryClient}>
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      );
    }
    ```

-   [ ] **Task 1.2: Integrate `QueryProvider` into Root Layout:** Wrap the application with the new provider to make React Query available globally.
    *   **File:** `src/app/layout.tsx`
    *   **Action:** Import `QueryProvider` and use it to wrap the `AuthProvider` and its children.
    ```tsx
    // ... other imports
    import QueryProvider from '@/components/query-provider';

    export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
      return (
        <html lang="en" suppressHydrationWarning>
          <body className="antialiased">
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <QueryProvider> {/* Add QueryProvider here */}
                <AuthProvider>
                  <Navbar />
                  <main>{children}</main>
                </AuthProvider>
              </QueryProvider>
            </ThemeProvider>
          </body>
        </html>
      );
    }
    ```

### 2. Core Content Integration

-   [ ] **Task 2.1: Create an API Client Library for Protocols:** Create a dedicated file for fetching protocol data.
    *   **File:** `src/lib/api/protocols.ts`
    *   **Action:** Create the file with a function to fetch all published protocols.
    ```typescript
    // In a real app, you would define the Protocol type based on your Prisma schema
    // For now, we'll use a generic type.
    export type Protocol = {
      id: string;
      name: string;
      category: string;
      description: string;
    };
    
    export const getProtocols = async (): Promise<Protocol[]> => {
      const res = await fetch('/api/protocols');
      if (!res.ok) {
        throw new Error('Failed to fetch protocols');
      }
      return res.json();
    };
    ```

-   [ ] **Task 2.2: Refactor `ProtocolList` to use React Query:** Modify the `ProtocolList` component to fetch live data from the `/api/protocols` endpoint.
    *   **File:** `src/components/protocol-list.tsx`
    *   **Action:** Replace the mock data with a `useQuery` hook. Handle loading and error states.
    ```tsx
    "use client";

    import { useQuery } from "@tanstack/react-query";
    import { ProtocolCard } from "./protocol-card";
    import { getProtocols } from "@/lib/api/protocols";

    export const ProtocolList = () => {
      const { data: protocols, isLoading, isError } = useQuery({
        queryKey: ["protocols"],
        queryFn: getProtocols,
      });

      if (isLoading) {
        return <div>Loading protocols...</div>;
      }

      if (isError) {
        return <div className="text-red-500">Error loading protocols. Please try again later.</div>;
      }

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {protocols?.map((protocol) => (
            <ProtocolCard key={protocol.id} {...protocol} />
          ))}
        </div>
      );
    };
    ```

-   [ ] **Task 2.3: Create a Dynamic Protocol Detail Page:** Create a page to display details for a single protocol fetched from the API.
    *   **Command:** `mkdir -p src/app/protocols/[protocolId]`
    *   **File:** `src/app/protocols/[protocolId]/page.tsx`
    *   **Action:** Create a page that uses the `protocolId` from the URL to fetch and display its data.
    ```tsx
    // This will be a Server Component fetching data directly
    import { prisma } from '@/lib/db';
    import { notFound } from 'next/navigation';
    import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

    async function getProtocol(protocolId: string) {
      const protocol = await prisma.protocol.findFirst({
        where: { id: protocolId, status: 'PUBLISHED' },
      });
      return protocol;
    }

    export default async function ProtocolDetailPage({ params }: { params: { protocolId: string } }) {
      const protocol = await getProtocol(params.protocolId);

      if (!protocol) {
        notFound();
      }

      return (
        <div className="container mx-auto p-4 md:p-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">{protocol.name}</CardTitle>
              <CardDescription>{protocol.category}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Description</h3>
                <p className="text-muted-foreground">{protocol.description}</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Implementation Guide</h3>
                <div className="prose dark:prose-invert max-w-none">
                  {protocol.implementationGuide}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    ```

### 3. Reminder Management Integration

-   [ ] **Task 3.1: Refactor `ReminderList` to use React Query:** Fetch the user's reminders from the `/api/reminders` endpoint.
    *   **File:** `src/components/reminder-list.tsx`
    *   **Action:** Remove mock data and implement a `useQuery` hook to fetch live reminder data.
    ```tsx
    "use client";

    import { useQuery } from "@tanstack/react-query";
    // ... other imports

    async function getReminders() {
      const res = await fetch('/api/reminders');
      if (!res.ok) throw new Error("Failed to fetch reminders");
      return res.json();
    }

    export const ReminderList = () => {
      const { data: reminders, isLoading } = useQuery({ queryKey: ['reminders'], queryFn: getReminders });
      // ... handle loading, error, and render the list
    };
    ```

-   [ ] **Task 3.2: Implement `useMutation` for `ReminderForm`:** Connect the `ReminderForm` to the backend to create new reminders.
    *   **File:** `src/components/reminder-form.tsx`
    *   **Action:** Use the `useMutation` hook from React Query to handle the `POST` request to `/api/reminders`. On success, invalidate the `reminders` query to automatically refresh the list.
    ```tsx
    "use client";

    import { useMutation, useQueryClient } from "@tanstack/react-query";
    // ... other imports

    async function createReminder(newReminder: { protocolId: string; reminderTime: string; timezone: string; }) {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReminder),
      });
      if (!res.ok) throw new Error("Failed to create reminder");
      return res.json();
    }

    export const ReminderForm = () => {
      const queryClient = useQueryClient();
      const mutation = useMutation({
        mutationFn: createReminder,
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['reminders'] });
        },
      });

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // ... get form data ...
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        mutation.mutate({ protocolId, reminderTime, timezone });
      };

      // ... rest of the form component
    };
    ```

### 4. Note Management Integration

-   [ ] **Task 4.1: Create `NoteList` Component with React Query:** Create a new component to display notes for a given episode.
    *   **File:** `src/components/note-list.tsx`
    *   **Action:** Create a component that accepts an `episodeId` and uses `useQuery` to fetch notes from `/api/notes?episodeId=...`.
    ```tsx
    "use client";
    
    import { useQuery } from "@tanstack/react-query";

    async function getNotes(episodeId: string) {
        const res = await fetch(`/api/notes?episodeId=${episodeId}`);
        if (!res.ok) throw new Error("Failed to fetch notes");
        return res.json();
    }

    export const NoteList = ({ episodeId }: { episodeId: string }) => {
        const { data: notes, isLoading } = useQuery({ 
            queryKey: ['notes', episodeId], 
            queryFn: () => getNotes(episodeId) 
        });
        // ... handle loading, error, and render the list of notes
    };
    ```

-   [ ] **Task 4.2: Create `NoteEditor` Component with `useMutation`:** Create a rich text editor component for creating and submitting notes.
    *   **File:** `src/components/note-editor.tsx`
    *   **Action:** Use `react-hook-form` and `useMutation` to handle form state and submission to `POST /api/notes`.
    ```tsx
    "use client";

    import { useMutation, useQueryClient } from "@tanstack/react-query";
    // ... other imports

    async function createNote(newNote: { episodeId: string; content: string; }) {
      // ... implementation for POST /api/notes
    }

    export const NoteEditor = ({ episodeId }: { episodeId: string }) => {
      const queryClient = useQueryClient();
      const mutation = useMutation({
        mutationFn: createNote,
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['notes', episodeId] });
        },
      });

      // ... form handling logic with react-hook-form
    };
    ```

-   [ ] **Task 4.3: Integrate Note Components into Journal Page:** Update the journal page to be dynamic.
    *   **File:** `src/app/journal/page.tsx`
    *   **Action:** Add a select dropdown to choose an episode, and then display the `NoteList` and `NoteEditor` for the selected episode.
    ```tsx
    "use client";

    import React, { useState } from 'react';
    import { NoteEditor } from '@/components/note-editor';
    import { NoteList } from '@/components/note-list';
    // ... other imports

    export default function JournalPage() {
      const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null);

      // Fetch episodes to populate the dropdown
      // const { data: episodes } = useQuery(...) 

      return (
        <div className="container mx-auto p-4 md:p-8">
          <h1 className="text-3xl font-bold mb-6">My Journal</h1>
          {/* ... Dropdown to select an episode ... */}

          {selectedEpisodeId && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
              <div>
                <h2 className="text-2xl font-semibold mb-4">Your Notes</h2>
                <NoteList episodeId={selectedEpisodeId} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-4">New Note</h2>
                <NoteEditor episodeId={selectedEpisodeId} />
              </div>
            </div>
          )}
        </div>
      );
    }
    ```

### 5. Settings and Profile Integration

-   [ ] **Task 5.1: Integrate Live Data into `UserProfileForm`:** Fetch the current user's data and connect the form to update their profile.
    *   **File:** `src/components/user-profile-form.tsx`
    *   **Action:** Use `useAuth` to get the current user's info to pre-fill the form. Use `useMutation` to handle the `PUT` request to `/api/users/profile` (assuming this endpoint exists).

-   [ ] **Task 5.2: Integrate Live Data into `SubscriptionManagement`:** Fetch the user's current subscription status.
    *   **File:** `src/components/subscription-management.tsx`
    *   **Action:** Use `useQuery` to fetch data from a new `/api/users/subscription` endpoint. Display the user's current plan and status. The "Manage Billing" button will be connected in the next phase.