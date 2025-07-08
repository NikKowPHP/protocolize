Of course. Here is the detailed, atomic to-do list for Phase B, formatted as `phase-b-static-component-implementation.md`.

This plan systematically builds all the necessary UI components for the "Protocolize" application. It follows the principle of creating reusable components first and then integrating them into the placeholder pages that were scaffolded in Phase A. All components in this phase are static and use mock/hardcoded data.

---

# **Phase B: Static Component Implementation**

**Goal:** Systematically build all new, static, reusable components required by the Protocolize epics (e.g., Journal Editor, SRS Flashcard, Analytics Charts), integrating them into the scaffolded pages from Phase A. This phase will use mock/hardcoded data for UI development purposes.

---

### 1. UI Primitive Installation

-   [ ] **Task 1.1: Install `shadcn/ui` Primitives:** Run a single command to add all the necessary, unstyled UI primitives to the codebase. These will be the building blocks for our custom components.
    ```bash
    npx shadcn-ui@latest add button card input select table dialog label textarea
    ```

---
### 2. Epic 2: Core Content Experience Components

-   [ ] **Task 2.1: Create `ProtocolCard` Component:** Create a reusable card component to display a single protocol in a list.
    *   **File:** `src/components/protocol-card.tsx`
    *   **Action:** Create the file with the following content.
    ```tsx
    import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
    import Link from "next/link";

    interface ProtocolCardProps {
      id: string;
      name: string;
      category: string;
      description: string;
    }

    export const ProtocolCard = ({ id, name, category, description }: ProtocolCardProps) => {
      return (
        <Link href={`/protocols/${id}`} passHref>
          <Card className="hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer">
            <CardHeader>
              <CardTitle className="text-xl">{name}</CardTitle>
              <CardDescription>{category}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">{description}</p>
            </CardContent>
          </Card>
        </Link>
      );
    };
    ```

-   [ ] **Task 2.2: Create `ProtocolList` Component:** Create a component to render a list of `ProtocolCard` components using mock data.
    *   **File:** `src/components/protocol-list.tsx`
    *   **Action:** Create the file with the following content.
    ```tsx
    import { ProtocolCard } from "./protocol-card";

    const MOCK_PROTOCOLS = [
      { id: "1", name: "Morning Sunlight Exposure", category: "Circadian Rhythm", description: "View sunlight by going outside within 30-60 minutes of waking. Do that again in the late afternoon." },
      { id: "2", name: "Cold Exposure", category: "Metabolism & Resilience", description: "Use cold exposure (ice bath, cold shower) to enhance metabolism and mental resilience." },
      { id: "3", name: "Non-Sleep Deep Rest (NSDR)", category: "Focus & Recovery", description: "A 10-30 minute protocol to deliberately disengage and enhance neuroplasticity and learning." },
    ];

    export const ProtocolList = () => {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_PROTOCOLS.map((protocol) => (
            <ProtocolCard key={protocol.id} {...protocol} />
          ))}
        </div>
      );
    };
    ```

-   [ ] **Task 2.3: Integrate `ProtocolList` into Dashboard:** Update the Dashboard page to display the list of protocols.
    *   **File:** `src/app/dashboard/page.tsx`
    *   **Action:** Replace the entire file content with the following code.
    ```tsx
    import { ProtocolList } from '@/components/protocol-list';
    import React from 'react';

    export default function DashboardPage() {
      return (
        <div className="container mx-auto p-4 md:p-8">
          <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
          <h2 className="text-2xl font-semibold mb-4">Featured Protocols</h2>
          <ProtocolList />
        </div>
      );
    }
    ```

---
### 3. Epic 3: Reminder Components

-   [ ] **Task 3.1: Create `ReminderForm` Component:** Create a static form for adding or editing a reminder.
    *   **File:** `src/components/reminder-form.tsx`
    *   **Action:** Create the file with the following content.
    ```tsx
    import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
    import { Label } from "@/components/ui/label";
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
    import { Input } from "@/components/ui/input";
    import { Button } from "@/components/ui/button";

    export const ReminderForm = () => {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Create New Reminder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="protocol">Protocol</Label>
              <Select>
                <SelectTrigger id="protocol">
                  <SelectValue placeholder="Select a protocol..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Morning Sunlight Exposure</SelectItem>
                  <SelectItem value="2">Cold Exposure</SelectItem>
                  <SelectItem value="3">Non-Sleep Deep Rest (NSDR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="time">Reminder Time</Label>
              <Input id="time" type="time" defaultValue="08:00" />
            </div>
            <div>
                <Button className="w-full">Save Reminder</Button>
            </div>
          </CardContent>
        </Card>
      );
    };
    ```

-   [ ] **Task 3.2: Create `ReminderList` Component:** Create a component to display a list of existing reminders using mock data.
    *   **File:** `src/components/reminder-list.tsx`
    *   **Action:** Create the file with the following content.
    ```tsx
    import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
    import { Button } from "@/components/ui/button";

    const MOCK_REMINDERS = [
      { id: "r1", protocolName: "Morning Sunlight", time: "07:30" },
      { id: "r2", protocolName: "Cold Exposure", time: "08:00" },
    ];

    export const ReminderList = () => {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Your Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {MOCK_REMINDERS.map(reminder => (
                <li key={reminder.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <div>
                    <p className="font-semibold">{reminder.protocolName}</p>
                    <p className="text-sm text-gray-500">{`Scheduled for ${reminder.time}`}</p>
                  </div>
                  <Button variant="ghost" size="sm">Edit</Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      );
    };
    ```

-   [ ] **Task 3.3: Integrate Reminder Components into Study Page:** Update the Study page to show reminder management UI.
    *   **File:** `src/app/study/page.tsx`
    *   **Action:** Replace the entire file content with the following code.
    ```tsx
    import { ReminderForm } from '@/components/reminder-form';
    import { ReminderList } from '@/components/reminder-list';
    import React from 'react';

    export default function StudyPage() {
      return (
        <div className="container mx-auto p-4 md:p-8">
          <h1 className="text-3xl font-bold mb-6">Study & Reminders</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <h2 className="text-2xl font-semibold mb-4">Your Active Reminders</h2>
              <ReminderList />
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-4">New Reminder</h2>
              <ReminderForm />
            </div>
          </div>
        </div>
      );
    }
    ```

---
### 4. Epic 4: Tracking & Analytics Components

-   [ ] **Task 4.1: Create `AdherenceCalendar` Component:** Create a static calendar view to mock protocol adherence.
    *   **File:** `src/components/adherence-calendar.tsx`
    *   **Action:** Create the file with the following content.
    ```tsx
    import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
    
    // Simple mock data for demonstration
    const MOCK_DAYS = Array.from({ length: 35 }, (_, i) => {
      const day = i - 5;
      const completed = day > 0 && Math.random() > 0.4;
      return { day, completed };
    });

    export const AdherenceCalendar = () => {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Adherence Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {["S", "M", "T", "W", "T", "F", "S"].map(day => (
                <div key={day} className="font-bold text-center text-xs text-gray-500">{day}</div>
              ))}
              {MOCK_DAYS.map(({ day, completed }, index) => (
                <div
                  key={index}
                  className={`w-full h-10 rounded flex items-center justify-center text-sm ${
                    day <= 0 ? "bg-gray-100 dark:bg-gray-800" :
                    completed ? "bg-green-500 text-white" : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  {day > 0 && day}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    };
    ```

-   [ ] **Task 4.2: Create `AnalyticsCharts` Component:** Create a static chart component using `recharts`.
    *   **File:** `src/components/analytics-charts.tsx`
    *   **Action:** Create the file with the following content.
    ```tsx
    'use client';
    import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
    import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

    const MOCK_DATA = [
      { name: 'Week 1', adherence: 4 },
      { name: 'Week 2', adherence: 6 },
      { name: 'Week 3', adherence: 5 },
      { name: 'Week 4', adherence: 7 },
    ];

    export const AnalyticsCharts = () => {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Consistency</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={MOCK_DATA}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="adherence" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      );
    };
    ```

-   [ ] **Task 4.3: Integrate Analytics Components into Analytics Page:** Update the Analytics page.
    *   **File:** `src/app/analytics/page.tsx`
    *   **Action:** Replace the entire file content with the following code.
    ```tsx
    import { AdherenceCalendar } from '@/components/adherence-calendar';
    import { AnalyticsCharts } from '@/components/analytics-charts';
    import React from 'react';

    export default function AnalyticsPage() {
      return (
        <div className="container mx-auto p-4 md:p-8">
          <h1 className="text-3xl font-bold mb-6">My Analytics</h1>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AnalyticsCharts />
            <AdherenceCalendar />
          </div>
        </div>
      );
    }
    ```

---
### 5. Epic 5: Monetization Component

-   [ ] **Task 5.1: Create `PricingTable` Component:** Create a static pricing table comparing the Free and Premium tiers.
    *   **File:** `src/components/pricing-table.tsx`
    *   **Action:** Create the file with the following content.
    ```tsx
    import { Button } from "@/components/ui/button";
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
    import { CheckCircle } from "lucide-react";

    const Feature = ({ children }: { children: React.ReactNode }) => (
      <li className="flex items-center space-x-2">
        <CheckCircle className="h-5 w-5 text-green-500" />
        <span className="text-gray-700 dark:text-gray-300">{children}</span>
      </li>
    );

    export const PricingTable = () => {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Free Tier */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Free</CardTitle>
              <CardDescription>Get started with the basics</CardDescription>
              <p className="text-4xl font-bold mt-2">$0</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                <Feature>Limited protocol summaries</Feature>
                <Feature>Pre-set foundational reminders</Feature>
                <Feature>Basic personal notes</Feature>
              </ul>
              <Button variant="outline" className="w-full">Your Current Plan</Button>
            </CardContent>
          </Card>
          {/* Premium Tier */}
          <Card className="border-blue-500">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Premium</CardTitle>
              <CardDescription>Unlock your full potential</CardDescription>
              <p className="text-4xl font-bold mt-2">$7<span className="text-lg font-normal text-gray-500">/mo</span></p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                <Feature>Full content library & guides</Feature>
                <Feature>Unlimited & Customizable reminders</Feature>
                <Feature>Advanced note-taking</Feature>
                <Feature>Protocol adherence tracking</Feature>
                <Feature>Community notes access</Feature>
              </ul>
              <Button className="w-full">Upgrade to Premium</Button>
            </CardContent>
          </Card>
        </div>
      );
    };
    ```

-   [ ] **Task 5.2: Integrate `PricingTable` into Pricing Page:** Update the Pricing page.
    *   **File:** `src/app/pricing/page.tsx`
    *   **Action:** Replace the entire file content with the following code.
    ```tsx
    import { PricingTable } from '@/components/pricing-table';
    import React from 'react';

    export default function PricingPage() {
      return (
        <div className="container mx-auto p-4 md:p-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Start for free, and upgrade when you're ready to take your implementation to the next level.
            </p>
          </div>
          <div className="max-w-2xl mx-auto">
             <PricingTable />
          </div>
        </div>
      );
    }
    ```

---
### 6. Epic 1 & User Settings Integration

-   [ ] **Task 6.1: Create `UserProfileForm` Component:** Create a static form for updating user profile information.
    *   **File:** `src/components/user-profile-form.tsx`
    *   **Action:** Create the file with the following content.
    ```tsx
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
    import { Label } from "@/components/ui/label";
    import { Input } from "@/components/ui/input";
    import { Button } from "@/components/ui/button";

    export const UserProfileForm = () => {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>Update your name and email address.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="Jane Doe" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="jane.doe@example.com" disabled />
            </div>
            <Button>Update Profile</Button>
          </CardContent>
        </Card>
      );
    };
    ```

-   [ ] **Task 6.2: Create `SubscriptionManagement` Component:** Create a static component for managing subscriptions.
    *   **File:** `src/components/subscription-management.tsx`
    *   **Action:** Create the file with the following content.
    ```tsx
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
    import { Button } from "@/components/ui/button";

    export const SubscriptionManagement = () => {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>Manage your billing and subscription details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>You are currently on the <span className="font-semibold text-blue-500">Premium Plan</span>.</p>
            <p className="text-sm text-gray-500">Your subscription will renew on July 31, 2024.</p>
            <Button>Manage Billing</Button>
          </CardContent>
        </Card>
      );
    };
    ```

-   [ ] **Task 6.3: Integrate User Components into Settings Page:** Update the Settings page.
    *   **File:** `src/app/settings/page.tsx`
    *   **Action:** Replace the entire file content with the following code.
    ```tsx
    import { SubscriptionManagement } from '@/components/subscription-management';
    import { UserProfileForm } from '@/components/user-profile-form';
    import React from 'react';

    export default function SettingsPage() {
      return (
        <div className="container mx-auto p-4 md:p-8">
          <h1 className="text-3xl font-bold mb-6">Settings</h1>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <UserProfileForm />
            <SubscriptionManagement />
          </div>
        </div>
      );
    }
    ```