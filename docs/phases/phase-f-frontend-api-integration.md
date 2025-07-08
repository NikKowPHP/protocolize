Of course. I have performed the analysis and will now generate the detailed, atomic, and fully explicit to-do list for **Phase F**.

This is a comprehensive phase focused on the frontend. It involves removing all mock data and connecting the UI to the live backend API endpoints created in Phase E. We will use `@tanstack/react-query` for robust data fetching, caching, and state synchronization. Each task includes the complete code needed for the autonomous AI agent to implement it precisely.

---

# **Phase F: Frontend API Integration**

**Goal:** Make the application fully dynamic by connecting the static frontend to the live backend. This involves **replacing all mock data** in the UI with live data fetched from the newly created API using `@tanstack/react-query` for data fetching, caching, and mutations.

**Prerequisite:** Phase E must be complete. All core API endpoints must be implemented and functional.

---

### 1. Setup `@tanstack/react-query`

-   [ ] **Task 1.1: Create a React Query Provider:** Create a new client component to provide the `QueryClient` to the entire application.
    *   **File:** `src/components/query-provider.tsx`
    *   **Action:** Create the file with the following complete content.
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
    *   **Action:** Replace the entire file content with the following code, which now includes the `QueryProvider`.
    ```tsx
    import React from 'react';
    import type { Metadata } from "next";
    import "./globals.css";
    import { AuthProvider } from '@/lib/auth-context';
    import Navbar from '@/components/Navbar';
    import { ThemeProvider } from "@/components/theme-provider";
    import QueryProvider from '@/components/query-provider';

    export const metadata: Metadata = {
      title: "Protocolize - Turn Theory into Practice",
      description: "Implement science-backed health protocols from your favorite experts into a consistent, actionable lifestyle.",
    };

    export default function RootLayout({
      children,
    }: Readonly<{
      children: React.ReactNode;
    }>) {
      return (
        <html lang="en" suppressHydrationWarning>
          <body className="antialiased">
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <QueryProvider>
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

---
### 2. Core Content Integration (Protocols & Episodes)

-   [ ] **Task 2.1: Define Content Types:** Create a types file for our core content models.
    *   **Command:** `mkdir -p src/lib/types`
    *   **File:** `src/lib/types/protocolize.ts`
    *   **Action:** Create the file with the following content.
    ```typescript
    // Based on our Prisma Schema
    export interface Protocol {
      id: string;
      name: string;
      description: string;
      category: string | null;
      implementationGuide: string | null;
      isFree: boolean;
      status: string;
    }

    export interface Summary {
        id: string;
        content: string;
        type: string;
    }

    export interface Episode {
      id: string;
      title: string;
      description: string | null;
      publishedAt: string | null;
      sourceUrl: string | null;
      protocols: Protocol[];
      summaries: Summary[];
    }
    ```

-   [ ] **Task 2.2: Create an API Client Library for Protocols and Episodes:**
    *   **Command:** `mkdir -p src/lib/api`
    *   **File:** `src/lib/api/content.ts`
    *   **Action:** Create the file with functions to fetch protocols and episodes.
    ```typescript
    import { Episode, Protocol } from "@/lib/types/protocolize";

    export const getProtocols = async (): Promise<Protocol[]> => {
      const res = await fetch('/api/protocols');
      if (!res.ok) {
        throw new Error('Failed to fetch protocols');
      }
      return res.json();
    };

    export const getEpisodes = async (): Promise<Episode[]> => {
        const res = await fetch('/api/episodes');
        if (!res.ok) {
            throw new Error('Failed to fetch episodes');
        }
        return res.json();
    };
    ```

-   [ ] **Task 2.3: Refactor `ProtocolList` to Use React Query:** Modify the `ProtocolList` component to fetch live data from the `/api/protocols` endpoint.
    *   **File:** `src/components/protocol-list.tsx`
    *   **Action:** Replace the entire file content with the following dynamic version.
    ```tsx
    "use client";

    import { useQuery } from "@tanstack/react-query";
    import { ProtocolCard } from "./protocol-card";
    import { getProtocols } from "@/lib/api/content";

    export const ProtocolList = () => {
      const { data: protocols, isLoading, isError } = useQuery({
        queryKey: ["protocols"],
        queryFn: getProtocols,
      });

      if (isLoading) {
        return <div className="text-center p-4">Loading protocols...</div>;
      }

      if (isError) {
        return <div className="text-red-500 text-center p-4">Error loading protocols. Please try again later.</div>;
      }

      if (!protocols || protocols.length === 0) {
        return <div className="text-center p-4">No protocols found.</div>;
      }

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {protocols.map((protocol) => (
            <ProtocolCard key={protocol.id} {...protocol} />
          ))}
        </div>
      );
    };
    ```
---
### 3. Note Management Integration

-   [ ] **Task 3.1: Define Note Type and API Client:**
    *   **File:** `src/lib/types/protocolize.ts`
    *   **Action:** Add the `Note` interface.
    ```typescript
    // Add to the end of the file
    export interface Note {
        id: string;
        userId: string;
        episodeId: string;
        content: string;
        isPublic: boolean;
        createdAt: string;
    }
    ```
    *   **File:** `src/lib/api/notes.ts`
    *   **Action:** Create the API client file for notes.
    ```typescript
    import { Note } from "@/lib/types/protocolize";

    export const getNotesForEpisode = async (episodeId: string): Promise<Note[]> => {
      const res = await fetch(`/api/notes?episodeId=${episodeId}`);
      if (!res.ok) throw new Error("Failed to fetch notes");
      return res.json();
    };

    type CreateNotePayload = {
      episodeId: string;
      content: string;
      isPublic?: boolean;
    };
    export const createNote = async (payload: CreateNotePayload): Promise<Note> => {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to create note');
      }
      return res.json();
    };
    ```

-   [ ] **Task 3.2: Refactor `NoteList` to be Dynamic:** Update the component to fetch, display, and handle deletion of notes.
    *   **File:** `src/components/note-list.tsx`
    *   **Action:** Replace the entire file with the following dynamic version.
    ```tsx
    "use client";
    
    import { useQuery } from "@tanstack/react-query";
    import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
    import { getNotesForEpisode } from "@/lib/api/notes";
    import { formatDistanceToNow } from 'date-fns';

    export const NoteList = ({ episodeId }: { episodeId: string }) => {
      const { data: notes, isLoading, isError } = useQuery({
        queryKey: ['notes', episodeId],
        queryFn: () => getNotesForEpisode(episodeId),
        enabled: !!episodeId, // Only fetch if episodeId is provided
      });

      if (!episodeId) return <div className="text-center text-muted-foreground p-4">Select an episode to see your notes.</div>;
      if (isLoading) return <div>Loading notes...</div>;
      if (isError) return <div className="text-red-500">Failed to load notes.</div>;

      return (
        <Card>
          <CardHeader>
            <CardTitle>Your Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {notes && notes.length > 0 ? (
                notes.map(note => (
                    <div key={note.id} className="p-3 bg-muted/50 rounded-md">
                        <p className="text-sm text-foreground">{note.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                            {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                        </p>
                    </div>
                ))
            ) : (
                <p className="text-muted-foreground">No notes for this episode yet.</p>
            )}
          </CardContent>
        </Card>
      );
    };
    ```

-   [ ] **Task 3.3: Refactor `NoteEditor` to be Dynamic:** Connect the editor to the `createNote` mutation.
    *   **File:** `src/components/note-editor.tsx`
    *   **Action:** Replace the entire file with the following dynamic version.
    ```tsx
    "use client";

    import { useMutation, useQueryClient } from "@tanstack/react-query";
    import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
    import { Label } from "@/components/ui/label";
    import { Textarea } from "@/components/ui/textarea";
    import { Button } from "@/components/ui/button";
    import { createNote } from "@/lib/api/notes";
    import { useForm } from "react-hook-form";

    interface NoteEditorProps {
      episodeId: string;
      episodeTitle: string;
    }

    type FormData = {
        content: string;
    };

    export const NoteEditor = ({ episodeId, episodeTitle }: NoteEditorProps) => {
      const queryClient = useQueryClient();
      const { register, handleSubmit, reset } = useForm<FormData>();

      const mutation = useMutation({
        mutationFn: createNote,
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['notes', episodeId] });
          reset();
        },
        onError: (error) => {
            alert(`Error: ${error.message}`);
        }
      });

      const onSubmit = (data: FormData) => {
        mutation.mutate({ episodeId, content: data.content });
      };

      return (
        <Card>
          <CardHeader>
            <CardTitle>New Note for: {episodeTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                <Label htmlFor="note-content" className="sr-only">Note Content</Label>
                <Textarea 
                    id="note-content" 
                    placeholder="Write your thoughts and takeaways here..." 
                    rows={10}
                    {...register("content", { required: true })}
                />
                </div>
                <Button type="submit" className="w-full" disabled={mutation.isPending}>
                    {mutation.isPending ? "Saving..." : "Save Note"}
                </Button>
            </form>
          </CardContent>
        </Card>
      );
    };
    ```

-   [ ] **Task 3.4: Make the Journal Page Fully Dynamic:** Fetch episodes for the dropdown and pass the selected ID to the note components.
    *   **File:** `src/app/journal/page.tsx`
    *   **Action:** Replace the entire file with the following dynamic version.
    ```tsx
    "use client";

    import { NoteEditor } from '@/components/note-editor';
    import { NoteList } from '@/components/note-list';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
    import React, { useState } from 'react';
    import { useQuery } from '@tanstack/react-query';
    import { getEpisodes } from '@/lib/api/content';

    export default function JournalPage() {
      const [selectedEpisodeId, setSelectedEpisodeId] = useState<string>("");
      
      const { data: episodes, isLoading: isLoadingEpisodes } = useQuery({
        queryKey: ['episodes'],
        queryFn: getEpisodes
      });

      const selectedEpisodeTitle = episodes?.find(e => e.id === selectedEpisodeId)?.title || "selected episode";

      return (
        <div className="container mx-auto p-4 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold">My Journal</h1>
            <div className="w-full md:w-72">
                <Select onValueChange={setSelectedEpisodeId} value={selectedEpisodeId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select an episode..." />
                    </SelectTrigger>
                    <SelectContent>
                        {isLoadingEpisodes ? <SelectItem value="loading" disabled>Loading...</SelectItem> :
                        episodes?.map(ep => <SelectItem key={ep.id} value={ep.id}>{ep.title}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
          </div>
          
          {selectedEpisodeId ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <NoteEditor episodeId={selectedEpisodeId} episodeTitle={selectedEpisodeTitle} />
              <NoteList episodeId={selectedEpisodeId} />
            </div>
          ) : (
            <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                Please select an episode to view or add notes.
            </div>
          )}
        </div>
      );
    }
    ```

---
### 4. Push Notification Subscription

-   [ ] **Task 4.1: Create a Service Worker:** Create the service worker file that will listen for push events in the background.
    *   **File:** `public/sw.js`
    *   **Action:** Create the file with the following content.
    ```javascript
    self.addEventListener('push', event => {
      const data = event.data.json();
      const options = {
        body: data.body,
        icon: '/icon-192x192.png', // Make sure you have this icon
        badge: '/badge-72x72.png', // and this badge
      };
      event.waitUntil(
        self.registration.showNotification(data.title, options)
      );
    });
    ```

-   [ ] **Task 4.2: Create a Push Subscription Utility:** Create a client-side utility to handle subscribing and unsubscribing the user.
    *   **File:** `src/lib/push-notifications.ts`
    *   **Action:** Create the file with the following content.
    ```typescript
    function urlBase64ToUint8Array(base64String: string) {
      const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    }

    export async function subscribeToPushNotifications() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error("Push notifications are not supported by this browser.");
      }

      await navigator.serviceWorker.register('/sw.js');
      const registration = await navigator.serviceWorker.ready;
      
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log("User is already subscribed.");
        return;
      }

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error("VAPID public key not found.");
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Send the subscription object to the backend
      await fetch('/api/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });
    }
    ```

-   [ ] **Task 4.3: Add a "Enable Notifications" Button:** Add a button to the settings page to trigger the subscription flow.
    *   **File:** `src/components/user-settings-forms.tsx`
    *   **Action:** Add a new `NotificationSettings` card component to the file.
    ```tsx
    // Add to the top of the file
    import { subscribeToPushNotifications } from "@/lib/push-notifications";
    
    // Add this new component to the file
    export const NotificationSettings = () => {
        const handleEnableNotifications = async () => {
            try {
                await subscribeToPushNotifications();
                alert("Notifications enabled successfully!");
            } catch (error) {
                alert(`Error enabling notifications: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        };

        return (
            <Card>
                <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>Enable push notifications for your reminders.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleEnableNotifications}>Enable Notifications</Button>
                </CardContent>
            </Card>
        );
    };
    ```

-   [ ] **Task 4.4: Integrate Notification Settings into Settings Page:**
    *   **File:** `src/app/settings/page.tsx`
    *   **Action:** Add the `NotificationSettings` component to the settings page.
    ```tsx
    import { SubscriptionManagement, UserProfileForm, NotificationSettings } from '@/components/user-settings-forms'; // Add NotificationSettings
    import React from 'react';

    export default function SettingsPage() {
      return (
        <div className="container mx-auto p-4 md:p-8">
          <h1 className="text-3xl font-bold mb-6">Settings</h1>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <UserProfileForm />
            <SubscriptionManagement />
            <NotificationSettings /> {/* Add this component */}
          </div>
        </div>
      );
    }
    ```