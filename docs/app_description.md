# **Protocolize: Technical Application Description (v3 - Final)**

## 1. Vision & Architectural Philosophy

**Protocolize** is a Progressive Web App (PWA) designed to be the definitive mobile-first companion for science-based wellness podcasts, starting with the Huberman Lab. Our architecture prioritizes a stellar developer experience, end-to-end type-safety, and a seamless PWA experience that bridges the gap between a website and a native application.

The core philosophy is to transform passive learning into active practice. We acknowledge the user's journey toward creating a healthier lifestyle. Therefore, this app is designed not as a permanent crutch, but as a **scaffolding tool** to help users build conscious, lasting habits. It facilitates implementation, provides crucial context, and then allows the user to internalize the protocols at their own pace.

Furthermore, we are committed to accessibility. Our **value-based freemium model** directly addresses this by ensuring that the core, foundational protocols and summaries are **always free**, providing tangible value to all users regardless of their financial situation. The premium tier funds the app's continued development and offers advanced tools for those who wish to accelerate and deepen their practice.

## 2. Architectural Overview

The system is designed around a clean separation of concerns within a Next.js monorepo. This approach leverages server components for performance and API routes for backend logic, creating a cohesive yet modular development environment.

```mermaid
graph TD
    subgraph User Device
        A[PWA on Browser/Mobile]
    end

    subgraph Vercel/Hosting
        B(Next.js App)
        B -- Serves UI --> A
        B -- API Routes --> C
    end

    subgraph Backend Services
        C{Protocolize API (Next.js API Routes)}
        D[Supabase Auth]
        E[Supabase Storage Bucket]
        F[PostgreSQL DB (via Prisma)]
        G[Stripe API]
        H[Firebase Cloud Messaging (FCM)]
        I[YouTube Data API]
        J[Google Gemini API]
    end

    %% User Facing Flows
    A -- "Signs In/Up" --> D
    A -- "Submits Note, Sets Reminder" --> C
    A -- "Upgrades Plan" --> G
    A -- "Subscribes to Notifications" --> C

    %% Backend System Flows
    C -- "Verifies User JWT" --> D
    C -- "CRUD (Notes, Protocols, etc)" --> F
    C -- "Manages Subscription Status" --> G
    C -- "Dispatches Push Notifications" --> H
    C -- "Stores Push Subscription" --> F

    subgraph Content Ingestion Pipeline (Triggered by Cron Job)
        C -- "1. Fetches New Videos" --> I
        C -- "2. Sends Transcript for Analysis" --> J
        J -- "3. Returns Structured Data" --> C
        C -- "4. Saves as Draft in DB" --> F
    end
```

**Flow Description:**

1.  **Client (PWA):** The user interacts with the Next.js frontend, rendered server-side for optimal performance and SEO. The Supabase client-side library handles authentication directly and securely.
2.  **Authentication & Storage:** Supabase provides a complete BaaS for user management (Auth) and file storage (Bucket) for potential future features like profile pictures.
3.  **Application Backend (Next.js API Routes):** Core business logic resides here. API routes, protected by Supabase JWT verification, handle data management, process payments with Stripe, and trigger push notifications via FCM.
4.  **Database Interaction:** Prisma acts as the type-safe ORM, bridging the gap between our API logic and the PostgreSQL database. It ensures all database operations are strongly typed.
5.  **Payment Processing:** Stripe handles all payment and subscription management. Our backend listens to Stripe webhooks to sync subscription states with our database.
6.  **Push Notifications:** Users can subscribe to notifications. The subscription object is stored in our database, and a cron job (Vercel Cron Jobs) will trigger an API route to send reminders via FCM.

## 3. Core Tech Stack

| Component              | Technology                         | Rationale                                                                                                                                                              |
| :--------------------- | :--------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**          | **Next.js 15+ (App Router)**       | Unified frontend/backend, Server Components for performance, file-based routing, and a first-class developer experience. Ideal for PWAs.                               |
| **Database**           | **PostgreSQL**                     | Robust, reliable, and scalable SQL database with strong support from Prisma and major hosting providers.                                                               |
| **ORM**                | **Prisma**                         | Provides ultimate type-safety between the database and application logic, with an auto-generated client, simplified migrations, and a great DX.                        |
| **Auth & Storage**     | **Supabase (Auth & Bucket)**       | Offloads complex user management and file storage, providing secure, scalable, and easy-to-use SDKs that integrate seamlessly with Next.js.                            |
| **Payments**           | **Stripe**                         | Industry leader for payment processing and subscription management with excellent developer tools, security, and React libraries.                                      |
| **AI Content Engine**  | **Google Gemini API**              | Advanced reasoning for parsing video transcripts into structured, actionable protocol data and summaries.                                                              |
| **Push Notifications** | **Firebase Cloud Messaging (FCM)** | Provides a reliable and free service to deliver push notifications to web clients (PWAs) across different browsers and devices.                                        |
| **Styling**            | **Tailwind CSS + shadcn/ui**       | Utility-first CSS for rapid, consistent development. `shadcn/ui` provides unstyled, accessible, and composable components perfect for building a custom design system. |
| **Deployment**         | **Vercel**                         | Native hosting for Next.js, offering seamless CI/CD, serverless functions, global CDN, and integrated cron jobs for scheduled tasks.                                   |

## 4. Key NPM Libraries & Tooling

- **State Management:** `zustand` (Minimal, fast, and scalable state management)
- **Data Fetching & Mutation:** `@tanstack/react-query` (Manages server state, caching, and optimistic updates)
- **Forms:** `react-hook-form` (High-performance, flexible form validation)
- **Schema Validation:** `zod` (TypeScript-first schema validation for API inputs, forms, and environment variables)
- **UI Components:** `shadcn/ui`, `headlessui/react` (Accessible, unstyled component primitives)
- **Utilities:** `date-fns`, `clsx`, `tailwind-merge`, `lucide-react`

## 5. Monetization Strategy: Value-Based Freemium

The app uses a **Freemium** model integrated with Stripe Billing. Core content and basic reminders are free to attract users. Revenue is generated via a Premium subscription that unlocks the full content library, advanced customization, and powerful tracking tools.

| Tier        | Price          | Key Features                                                                                                                                                                                                                            | Target                                                  |
| :---------- | :------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------ |
| **Free**    | $0             | **Limited** protocol summaries, **pre-set** foundational reminders, basic personal notes.                                                                                                                                               | New users for acquisition and demonstrating core value. |
| **Premium** | ~$5-10 / month | All Free features, plus:<br>• **Full** content library (all protocols, detailed guides)<br>• **Unlimited & Customizable** reminders<br>• Advanced note-taking<br>• Protocol adherence tracking & visualizations<br>• Ad-free experience | Dedicated users seeking to fully implement the system.  |

## 6. High-Level Prisma Schema

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

// ... other models like Plan, Subscription ...
```

## 7. Development Epics & User Stories

### **Core System & Infrastructure**

- **PR-SYS-001: Subscription State Machine:** The API route for Stripe webhooks correctly handles events to update a user's subscription status.
- **PR-SYS-002: Secure Webhook Handling:** The Stripe webhook API route validates the incoming request signature.
- **PR-SYS-003: Feature Gating:** Server Components and API routes check a user's subscription status before rendering or returning premium content.
- **PR-SYS-004: Reminder Scheduling Engine:** A Vercel Cron Job triggers an API route to query for due reminders.
- **PR-SYS-005: PWA Push Notification Dispatch:** The reminder API route dispatches notifications via FCM.

### **Epic 1: User Onboarding & Authentication**

- **PR-001: Account Creation:** As a user, I can register for an account using my email and password.
- **PR-002: User Login:** As a user, I can log into my account.
- **PR-003: Password Reset:** As a user, I can use the password reset flow.

### **Epic 2: Core Content Experience (Freemium)**

- **PR-010: View Foundational Protocols:** [Free] As a free user, I can view summaries for foundational protocols.
- **PR-011: Receive Foundational Reminders:** [Free] As a free user, I can receive pre-set reminders.
- **PR-012: Discover Premium:** [Free] As a free user, I can see clear UI prompts to upgrade.

### **Epic 3: Customizable Reminders (Premium)**

- **PR-020: Subscribe to Notifications:** As a user, my browser prompts me to allow push notifications.
- **PR-021: Create Custom Reminder:** [Premium] As a premium user, I can create a custom reminder for any protocol.
- **PR-022: Manage Reminders:** [Premium] As a premium user, I can view, edit, and delete my custom reminders.

### **Epic 4: Protocol Tracking & Visualization (Premium)**

- **PR-030: Log Protocol Adherence:** [Premium] As a premium user, I can mark a protocol as 'completed'.
- **PR-031: View Progress:** [Premium] As a premium user, I can see a visualization of my adherence.

### **Epic 5: Monetization & Billing**

- **PR-050: View Pricing Page:** A clear pricing page compares Free vs. Premium tiers.
- **PR-051: Seamless Upgrade:** The upgrade process is handled by a secure Stripe Checkout session.
- **PR-052: Manage Subscription:** Users can manage their subscription via the Stripe Customer Portal.

### **Epic 6: Automated Content Ingestion Pipeline**

- **PR-SYS-006: Scheduled YouTube Channel Check:** A Vercel Cron Job triggers an API route daily to check for new videos.
- **PR-SYS-007: Video Transcript Retrieval:** The system retrieves a new video's full transcript.
- **PR-SYS-008: AI-Powered Content Extraction:** The system sends the transcript to the Gemini API with a specialized prompt to extract a summary and structured protocol data.
- **PR-SYS-009: Draft Content Creation:** The system parses the AI response and creates new `Episode` and `Protocol` records with a status of **"DRAFT"**.
- **PR-SYS-010: Ingestion Failure Handling:** If any step fails, an admin is notified.

### **Epic 7: Admin Content Curation & Publishing**

- **PR-ADM-001: Draft Review Dashboard:** As an Admin, I can view a list of all content in "DRAFT" status.
- **PR-ADM-002: Edit AI-Generated Content:** As an Admin, I can review and edit AI-generated summaries and protocols.
- **PR-ADM-003: Publish Content:** As an Admin, I can "Publish" content, changing its status and making it visible to all users.

### **Epic 8: Community Engagement (Post-MVP)**

- **PR-060: Mark Note as Public:** [Premium] As a premium user, I can toggle a note's visibility to "Public".
- **PR-061: View Public Notes:** As a user, I can view a feed of public notes shared by others on an episode's page.

## 8. Development & Compliance Practices

### 8.1. UI/UX: Mobile-First Responsive Design

The application will be built with a **mobile-first** philosophy. All UI will be designed for the smallest mobile viewport first, then progressively enhanced for larger screens using Tailwind CSS's responsive breakpoints.

### 8.2. Code Quality & Best Practices

- **Folder Structure:** We will follow a feature-based folder structure. Core logic and services will be organized in the `lib/` directory.
- **Component Scoping:** We will default to Server Components for performance, opting into Client Components (`"use client"`) only when interactivity is required.
- **End-to-End Type Safety:** `Prisma` and `Zod` will be used to ensure data is strongly typed from the database to the frontend.
- **Environment Variables:** All environment variables will be validated on start-up using `Zod` to prevent runtime errors.

### 8.3. API & Error Handling

- **API Responses:** All successful API responses will be structured consistently.
- **Error Handling:** API routes will use centralized error handling to return consistent, structured error responses.

### 8.4. Accessibility (A11y)

- **Goal:** The application will strive to meet WCAG 2.1 AA standards.
- **Implementation:** We will use semantic HTML, ensure keyboard navigability, and provide appropriate ARIA attributes. The use of `shadcn/ui` provides a strong, accessible foundation.

### 8.5. Observability Strategy

- **Error Tracking:** We will integrate **Sentry** to capture and report all unhandled exceptions in real-time.
- **Performance Monitoring:** We will leverage **Vercel Analytics** to monitor Core Web Vitals.
- **Structured Logging:** The Content Ingestion Pipeline will use structured logging to trace its execution, with logs drained to a service for debugging.
- **Alerting:** Critical failure alerts will be configured for pipeline failures or spikes in application errors.

## 9. MVP Scope & Phasing

Our immediate goal is to launch an MVP that validates the core user proposition and the automated content pipeline.

### Phase 1: MVP (Target: Initial Launch)

- **Focus:** Core user authentication, displaying content, basic premium upgrade, and a functional admin review panel.
- **Epics to be Completed:** Epic 1, Epic 2 (core stories), Epic 5, Epic 6, Epic 7.

### Phase 2: Post-MVP (First Major Update)

- **Focus:** Enhancing the premium offering with interactive features.
- **Epics to be Implemented:** Epic 3 (Reminders), Epic 4 (Tracking), and Epic 8 (Community).

## 10. Potential Risks & Mitigation

| Risk Category  | Risk Description                                                                        | Mitigation Strategy                                                                                                            |
| :------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| **Technical**  | The Gemini API may return inconsistent or low-quality structured data from transcripts. | Develop a highly robust and detailed prompt. The Admin Review Dashboard is a non-negotiable feature for quality control.       |
| **Dependency** | The YouTube API or transcript availability may change, breaking the content pipeline.   | Build resilient error handling and admin notifications. Have a documented manual fallback process in the admin dashboard.      |
| **Product**    | The Freemium model may not achieve the desired conversion rate.                         | Track conversion metrics closely post-launch and adjust the feature balance between tiers based on user behavior and feedback. |
| **Resource**   | Manual review of AI-generated content could become a bottleneck.                        | For future phases, explore fine-tuning a model to improve the quality of the first draft, reducing the manual review burden.   |

## 11. Future Scope & Roadmap Ideas

Beyond the initial launch, the following ideas from user feedback are captured for future consideration:

- **Expanded Content Sources:** Integrating protocols and takeaways from related experts.
- **Dedicated Feature Modules:** Exploring new sections like a "Gratefulness Journal".
- **Advanced Community Features:** Adding voting or discussion threads to public notes.
