
# **Phase A: Project Setup and UI Scaffolding**

**Goal:** Execute all initial project setup, dependency installation, boilerplate removal, and scaffold all new pages required for Protocolize. The output will be a fully prepared codebase ready for feature component implementation.

---

### 1. Boilerplate Cleanup

-   [x] **Task 1.1: Execute Boilerplate Removal Script:** Run the following shell command from the project root to remove all files and directories related to the old "PrepAI" project.

    ```bash
    # Remove unnecessary UI components
    rm -f src/components/AnalyticsCharts.tsx
    rm -f src/components/DeckManagement.tsx
    rm -f src/components/EvaluationFeedback.tsx
    rm -f src/components/ObjectivesList.tsx
    rm -f src/components/ProgressDashboard.tsx
    rm -f src/components/QuestionForm.tsx
    rm -f src/components/QuestionGeneratorForm.tsx
    rm -f src/components/ReadinessIndicator.tsx
    rm -f src/components/ReportGenerator.tsx
    rm -f src/components/RoleSelect.tsx
    rm -f src/components/TopicFilter.tsx
    rm -f src/components/VoiceRecorder.tsx
    rm -f src/components/WelcomeDashboard.tsx

    # Remove unnecessary API routes
    rm -rf src/app/api/analyze-knowledge-gaps/
    rm -rf src/app/api/generate-question/
    rm -rf src/app/api/generate-report/
    rm -rf src/app/api/objectives/
    rm -rf src/app/api/practice/
    rm -rf src/app/api/progress/
    rm -rf src/app/api/questions/
    rm -rf src/app/api/readiness/
    rm -rf src/app/api/validate-role/
    rm -rf src/app/api/voice-processing/

    # Remove unnecessary library/logic files
    rm -f src/lib/assessment.ts
    rm -f src/lib/objectives.ts
    rm -f src/lib/pdf.ts
    rm -f src/lib/progress.ts
    rm -f src/lib/readiness.ts
    rm -f src/lib/scheduler.ts
    rm -f src/lib/srs.ts
    rm -f src/lib/transcription.ts
    rm -f src/lib/types/question.ts

    # Remove unnecessary pages
    rm -rf src/app/generate/
    rm -rf src/app/questions/

    # Remove old database migrations and schema
    rm -rf prisma/migrations/*
    ```

-   [ ] **Task 1.2: Replace Prisma Schema:** Replace the entire content of `prisma/schema.prisma` with the new schema for the Protocolize application.

    *   **File:** `prisma/schema.prisma`
    *   **Action:** Replace the entire file content with the following code.

    ```prisma
    generator client {
      provider = "prisma-client-js"
    }

    datasource db {
      provider = "postgresql"
      url      = env("DATABASE_URL")
    }

    model User {
      id                String    @id @default(uuid())
      email             String    @unique
      name              String?
      supabaseAuthId    String    @unique @map("supabase_auth_id")

      stripeCustomerId   String?   @unique @map("stripe_customer_id")
      subscriptionTier   String    @default("FREE")
      subscriptionStatus String?   @map("subscription_status")

      createdAt      DateTime       @default(now()) @map("created_at")
      updatedAt      DateTime       @updatedAt @map("updated_at")
      
      subscriptions      Subscription[]
      notes              Note[]
      reminders          UserReminder[]
      trackingLogs       UserProtocolTracking[]
      pushSubscriptions  PushSubscription[]
    }

    model Plan {
      id              String   @id @default(cuid())
      name            String   @unique
      description     String?
      stripeProductId String?  @unique @map("stripe_product_id")
      isActive        Boolean  @default(true) @map("is_active")
      createdAt       DateTime @default(now()) @map("created_at")
      updatedAt       DateTime @updatedAt @map("updated_at")
      
      subscriptions Subscription[]
    }

    model Subscription {
      id             String    @id @default(cuid())
      userId         String
      user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)
      planId         String
      plan           Plan      @relation(fields: [planId], references: [id], onDelete: Restrict)
      status         String
      provider       String    @default("stripe")
      providerId     String    @unique @map("provider_id")
      endsAt         DateTime? @map("ends_at")
      createdAt      DateTime  @default(now()) @map("created_at")
      updatedAt      DateTime  @updatedAt @map("updated_at")
    }

    model Episode {
      id            String   @id @default(cuid())
      title         String
      episodeNumber Int?     @map("episode_number")
      publishedAt   DateTime?@map("published_at")
      description   String?  @db.Text
      sourceUrl     String?  @map("source_url")
      status        String   @default("DRAFT") // DRAFT, PUBLISHED, ARCHIVED
      createdAt     DateTime @default(now()) @map("created_at")
      updatedAt     DateTime @updatedAt @map("updated_at")
      
      protocols Protocol[] @relation("EpisodeProtocol")
      summaries Summary[]
      notes     Note[]
    }

    model Protocol {
      id                   String   @id @default(cuid())
      name                 String
      description          String   @db.Text
      category             String?
      implementationGuide  String?  @db.Text @map("implementation_guide")
      researchLinks        Json?    @map("research_links")
      isFree               Boolean  @default(false) @map("is_free")
      status               String   @default("DRAFT") // DRAFT, PUBLISHED
      createdAt            DateTime @default(now()) @map("created_at")
      updatedAt            DateTime @updatedAt @map("updated_at")
      
      @@index([name, status])

      episodes     Episode[]              @relation("EpisodeProtocol")
      reminders    UserReminder[]
      trackingLogs UserProtocolTracking[]
    }

    model Summary {
      id        String   @id @default(cuid())
      episodeId String
      episode   Episode  @relation(fields: [episodeId], references: [id], onDelete: Cascade)
      content   String   @db.Text
      type      String   @default("summary") // e.g., 'summary', 'key_takeaway'
      createdAt DateTime @default(now()) @map("created_at")
      updatedAt DateTime @updatedAt @map("updated_at")
    }

    model Note {
      id        String   @id @default(cuid())
      userId    String
      user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
      episodeId String
      episode   Episode  @relation(fields: [episodeId], references: [id], onDelete: Cascade)
      content   String   @db.Text
      isPublic  Boolean  @default(false) @map("is_public")
      createdAt DateTime @default(now()) @map("created_at")
      updatedAt DateTime @updatedAt @map("updated_at")
    }

    model UserReminder {
      id          String   @id @default(cuid())
      userId      String
      user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
      protocolId  String
      protocol    Protocol @relation(fields: [protocolId], references: [id], onDelete: Cascade)
      reminderTime String  @map("reminder_time")
      timezone    String
      isActive    Boolean  @default(true) @map("is_active")
      createdAt   DateTime @default(now()) @map("created_at")
      updatedAt   DateTime @updatedAt @map("updated_at")
    }

    model UserProtocolTracking {
      id         String   @id @default(cuid())
      userId     String
      user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
      protocolId String
      protocol   Protocol @relation(fields: [protocolId], references: [id], onDelete: Cascade)
      trackedAt  DateTime @map("tracked_at") @db.Date
      notes      String?  @db.Text
      createdAt  DateTime @default(now()) @map("created_at")

      @@unique([userId, protocolId, trackedAt])
    }

    model PushSubscription {
      id        String   @id @default(cuid())
      userId    String
      user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
      endpoint  String   @unique
      keys      Json
      createdAt DateTime @default(now()) @map("created_at")
    }

    // Many-to-many relation table for Episode and Protocol
    model EpisodeProtocol {
      episodeId  String
      protocolId String
      episode    Episode  @relation(fields: [episodeId], references: [id])
      protocol   Protocol @relation(fields: [protocolId], references: [id])
    
      @@id([episodeId, protocolId])
    }
    ```

-   [x] **Task 1.3: Synchronize Dependencies:** Run `npm install` to ensure `node_modules` and `package-lock.json` are consistent after removing files and changing the Prisma schema.
    ```bash
    npm install
    ```

---
### 2. Dependency Installation & Configuration

-   [x] **Task 2.1: Install New Dependencies:** Run the following command to install all new libraries required for Protocolize.
    ```bash
    npm install lucide-react clsx tailwind-merge recharts date-fns react-hook-form zod @tanstack/react-query @stripe/stripe-js @headlessui/react
    ```
    *Note: If this fails due to peer dependency conflicts, re-run with `--legacy-peer-deps`.*

-   [x] **Task 2.2: Initialize `shadcn/ui`:** Use the `shadcn/ui` CLI to initialize and configure the project. When prompted, use the specified values.
    ```bash
    npx shadcn-ui@latest init
    ```
    -   Use TypeScript? **yes**
    -   Style: **Default**
    -   Base color: **Slate**
    -   Global CSS: **`src/app/globals.css`**
    -   Use CSS variables? **yes**
    -   tailwind.config.ts: **`tailwind.config.ts`**
    -   Components alias: **`@/components`**
    -   Utils alias: **`@/lib/utils`**
    -   React Server Components? **yes**
    -   Write to `components.json`? **yes**

---
### 3. Core Layout & Branding Adaptation

-   [ ] **Task 3.1: Update Main Navigation Bar:** Modify `src/components/Navbar.tsx` to change the branding from "PrepAI" to "Protocolize" and update the navigation links to match the new application structure.
    *   **File:** `src/components/Navbar.tsx`
    *   **Action:** Replace the entire content of the file with the following code.
    ```tsx
    'use client';

    import React, { useState } from 'react';
    import Link from "next/link";
    import { AuthLinks } from '@/components/AuthLinks';

    const Navbar: React.FC = () => {
        const [isOpen, setIsOpen] = useState(false);
        
        const closeMenu = () => setIsOpen(false);

        return (
            <header className="bg-gray-800 text-white p-4 sticky top-0 z-50">
                <div className="container mx-auto flex justify-between items-center">
                    <Link href="/" className="text-lg font-bold" onClick={closeMenu}>Protocolize</Link>
                    
                    {/* Desktop Menu */}
                    <div className="hidden md:flex space-x-4 items-center">
                        <Link href="/dashboard" className="hover:underline">Dashboard</Link>
                        <Link href="/journal" className="hover:underline">Journal</Link>
                        <Link href="/study" className="hover:underline">Study</Link>
                        <Link href="/analytics" className="hover:underline">Analytics</Link>
                        <Link href="/pricing" className="hover:underline">Pricing</Link>
                        <AuthLinks />
                    </div>
                    
                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu" className="p-2">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}></path>
                            </svg>
                        </button>
                    </div>
                </div>
                
                {/* Mobile Menu */}
                <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-screen pt-4' : 'max-h-0'}`}>
                    <div className="flex flex-col space-y-4">
                        <Link href="/dashboard" className="hover:underline block px-2 py-1" onClick={closeMenu}>Dashboard</Link>
                        <Link href="/journal" className="hover:underline block px-2 py-1" onClick={closeMenu}>Journal</Link>
                        <Link href="/study" className="hover:underline block px-2 py-1" onClick={closeMenu}>Study</Link>
                        <Link href="/analytics" className="hover:underline block px-2 py-1" onClick={closeMenu}>Analytics</Link>
                        <Link href="/pricing" className="hover:underline block px-2 py-1" onClick={closeMenu}>Pricing</Link>
                        <div className="border-t border-gray-700 my-2"></div>
                        <div className="px-2 py-1 flex flex-col space-y-4 items-start">
                            <AuthLinks />
                        </div>
                    </div>
                </div>
            </header>
        );
    };

    export default Navbar;
    ```

-   [ ] **Task 3.2: Update Public Landing Page Content:** Modify `src/app/page.tsx` to reflect Protocolize's branding and features.
    *   **File:** `src/app/page.tsx`
    *   **Action:** Replace the entire content of the file with the following code.
    ```tsx
    import Link from 'next/link';

    const FeatureCard = ({ icon, title, description }: { icon: string, title: string, description: string }) => (
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300">
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-600 text-white mb-4">
          <span className="text-2xl">{icon}</span>
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-400">{description}</p>
      </div>
    );

    export default function Home() {
      return (
        <div className="bg-gray-900 text-white">
          {/* Hero Section */}
          <section className="text-center py-20 px-4 sm:py-32">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
                Turn Wellness Theory into Daily Practice
              </h1>
              <p className="mt-4 text-lg sm:text-xl text-gray-300">
                Stop just listening. Start doing. Protocolize helps you implement science-backed health protocols from your favorite experts into a consistent, actionable lifestyle.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                <Link href="/signup" legacyBehavior>
                  <a className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-transform transform hover:scale-105 text-center">
                    Start for Free
                  </a>
                </Link>
                <Link href="/dashboard" legacyBehavior>
                  <a className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-full text-lg transition-transform transform hover:scale-105 text-center">
                    Go to Dashboard
                  </a>
                </Link>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="py-20 px-4 bg-gray-900">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold">Everything You Need for Consistent Action</h2>
                <p className="mt-2 text-gray-400">Our platform is packed with features to make implementation effortless.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <FeatureCard
                  icon="🤖"
                  title="Automated Content Pipeline"
                  description="New episodes are automatically processed, extracting key protocols and summaries so you're always up-to-date."
                />
                <FeatureCard
                  icon="📝"
                  title="AI-Powered Summaries"
                  description="Get concise, epiphanic summaries and detailed implementation guides for every protocol discussed."
                />
                <FeatureCard
                  icon="🔔"
                  title="Customizable Reminders"
                  description="Set smart reminders for any protocol, tailored to your schedule, to build habits that stick."
                />
                <FeatureCard
                  icon="📈"
                  title="Track Your Progress"
                  description="Log your adherence to protocols and visualize your consistency over time with insightful analytics."
                />
                <FeatureCard
                  icon="🧠"
                  title="Personal Notes"
                  description="Capture your thoughts and takeaways for each protocol, creating a personalized knowledge base."
                />
                <FeatureCard
                  icon="🤝"
                  title="Community Insights"
                  description="Share your notes publicly and learn from the takeaways of other dedicated users."
                />
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section className="py-20 px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold">Get Started in 3 Simple Steps</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div className="flex flex-col items-center">
                  <div className="text-4xl font-bold text-blue-500 bg-gray-800 rounded-full w-16 h-16 flex items-center justify-center mb-4">1</div>
                  <h3 className="text-xl font-bold mb-2">Explore Protocols</h3>
                  <p className="text-gray-400">Browse the latest protocols and summaries automatically extracted from new episodes.</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-4xl font-bold text-blue-500 bg-gray-800 rounded-full w-16 h-16 flex items-center justify-center mb-4">2</div>
                  <h3 className="text-xl font-bold mb-2">Set Reminders</h3>
                  <p className="text-gray-400">Choose the protocols you want to implement and set custom reminders to fit your lifestyle.</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-4xl font-bold text-blue-500 bg-gray-800 rounded-full w-16 h-16 flex items-center justify-center mb-4">3</div>
                  <h3 className="text-xl font-bold mb-2">Track & Master</h3>
                  <p className="text-gray-400">Log your daily progress, watch your consistency grow, and turn knowledge into habit.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Final CTA Section */}
          <section className="bg-blue-600">
            <div className="max-w-4xl mx-auto text-center py-16 px-4">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">
                Ready to Protocolize Your Life?
              </h2>
              <p className="text-blue-200 mt-2 mb-6">Stop guessing. Start building better habits today.</p>
              <Link href="/signup" legacyBehavior>
                <a className="bg-white text-blue-600 font-bold py-3 px-8 rounded-full text-lg transition-transform transform hover:scale-105 text-center">
                  Sign Up and Start for Free
                </a>
              </Link>
            </div>
          </section>

          {/* Footer */}
          <footer className="bg-gray-900 py-6">
            <div className="max-w-6xl mx-auto px-4 text-center text-gray-500">
              <p>© {new Date().getFullYear()} Protocolize. All rights reserved.</p>
            </div>
          </footer>
        </div>
      );
    }
    ```

---
### 4. Page Scaffolding

-   [ ] **Task 4.1: Update Dashboard Page:** Replace the content of `src/app/dashboard/page.tsx` with a simple placeholder.
    *   **File:** `src/app/dashboard/page.tsx`
    *   **Action:** Replace the entire file content with the following code.
    ```tsx
    import React from 'react';

    export default function DashboardPage() {
      return (
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold">Protocolize Dashboard</h1>
          <p>Dashboard content will go here, showing recent protocols and user stats.</p>
        </div>
      );
    }
    ```

-   [ ] **Task 4.2: Create Journal Page:** Create the file `src/app/journal/page.tsx` with placeholder content.
    *   **Command:** `mkdir -p src/app/journal`
    *   **File:** `src/app/journal/page.tsx`
    *   **Content:**
        ```tsx
        import React from 'react';

        export default function JournalPage() {
          return (
            <div className="container mx-auto p-4">
              <h1 className="text-2xl font-bold">My Journal</h1>
              <p>The rich text editor and journal entries (notes) will go here.</p>
            </div>
          );
        }
        ```

-   [ ] **Task 4.3: Create Study Page:** Create the file `src/app/study/page.tsx` with placeholder content.
    *   **Command:** `mkdir -p src/app/study`
    *   **File:** `src/app/study/page.tsx`
    *   **Content:**
        ```tsx
        import React from 'react';

        export default function StudyPage() {
          return (
            <div className="container mx-auto p-4">
              <h1 className="text-2xl font-bold">Study Deck (SRS)</h1>
              <p>The Spaced Repetition System for reviewing protocols will be displayed here.</p>
            </div>
          );
        }
        ```

-   [ ] **Task 4.4: Create Analytics Page:** Create the file `src/app/analytics/page.tsx` with placeholder content.
    *   **Command:** `mkdir -p src/app/analytics`
    *   **File:** `src/app/analytics/page.tsx`
    *   **Content:**
        ```tsx
        import React from 'react';

        export default function AnalyticsPage() {
          return (
            <div className="container mx-auto p-4">
              <h1 className="text-2xl font-bold">My Analytics</h1>
              <p>Charts and progress visualizations for protocol adherence will be rendered here.</p>
            </div>
          );
        }
        ```

-   [ ] **Task 4.5: Create Pricing Page:** Create the file `src/app/pricing/page.tsx` with placeholder content.
    *   **Command:** `mkdir -p src/app/pricing`
    *   **File:** `src/app/pricing/page.tsx`
    *   **Content:**
        ```tsx
        import React from 'react';

        export default function PricingPage() {
          return (
            <div className="container mx-auto p-4">
              <h1 className="text-2xl font-bold">Pricing</h1>
              <p>The feature comparison table and subscription options will be here.</p>
            </div>
          );
        }
        ```

-   [ ] **Task 4.6: Create Settings Page:** Create a placeholder for the user settings page.
    *   **Command:** `mkdir -p src/app/settings`
    *   **File:** `src/app/settings/page.tsx`
    *   **Content:**
        ```tsx
        import React from 'react';

        export default function SettingsPage() {
          return (
            <div className="container mx-auto p-4">
              <h1 className="text-2xl font-bold">Settings</h1>
              <p>User profile, subscription management, and account settings will be here.</p>
            </div>
          );
        }
        ```