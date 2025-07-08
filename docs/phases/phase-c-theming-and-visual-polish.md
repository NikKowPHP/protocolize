Of course. Here is the detailed, atomic to-do list for the next phase of development, Phase C, formatted as `phase-c-theming-and-visual-polish.md`.

This plan is now fully explicit, removing any ambiguity. It contains the complete code for each step, ensuring the autonomous AI agent can execute it precisely. It focuses on implementing a light/dark theme toggle, updating the global styles to support it, and refining the visual consistency of the application.

---

# **Phase C: Theming and Visual Polish**

**Goal:** Implement light/dark mode and conduct a full visual review to refine styling and ensure a cohesive, polished look and feel across all new components and pages.

---

### 1. Light/Dark Mode Implementation

-   [x] **Task 1.1: Update `tailwind.config.ts` for Dark Mode:** Enable Tailwind's dark mode functionality by setting the `darkMode` strategy to `"class"`.
    *   **File:** `tailwind.config.ts`
    *   **Action:** Replace the entire file content with the following code. This ensures the correct class-based strategy is used.
    ```ts
    import type { Config } from "tailwindcss"

    const config = {
      darkMode: ["class"],
      content: [
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
      ],
      prefix: "",
      theme: {
        container: {
          center: true,
          padding: "2rem",
          screens: {
            "2xl": "1400px",
          },
        },
        extend: {
          colors: {
            border: "hsl(var(--border))",
            input: "hsl(var(--input))",
            ring: "hsl(var(--ring))",
            background: "hsl(var(--background))",
            foreground: "hsl(var(--foreground))",
            primary: {
              DEFAULT: "hsl(var(--primary))",
              foreground: "hsl(var(--primary-foreground))",
            },
            secondary: {
              DEFAULT: "hsl(var(--secondary))",
              foreground: "hsl(var(--secondary-foreground))",
            },
            destructive: {
              DEFAULT: "hsl(var(--destructive))",
              foreground: "hsl(var(--destructive-foreground))",
            },
            muted: {
              DEFAULT: "hsl(var(--muted))",
              foreground: "hsl(var(--muted-foreground))",
            },
            accent: {
              DEFAULT: "hsl(var(--accent))",
              foreground: "hsl(var(--accent-foreground))",
            },
            popover: {
              DEFAULT: "hsl(var(--popover))",
              foreground: "hsl(var(--popover-foreground))",
            },
            card: {
              DEFAULT: "hsl(var(--card))",
              foreground: "hsl(var(--card-foreground))",
            },
          },
          borderRadius: {
            lg: "var(--radius)",
            md: "calc(var(--radius) - 2px)",
            sm: "calc(var(--radius) - 4px)",
          },
          keyframes: {
            "accordion-down": {
              from: { height: "0" },
              to: { height: "var(--radix-accordion-content-height)" },
            },
            "accordion-up": {
              from: { height: "var(--radix-accordion-content-height)" },
              to: { height: "0" },
            },
          },
          animation: {
            "accordion-down": "accordion-down 0.2s ease-out",
            "accordion-up": "accordion-up 0.2s ease-out",
          },
        },
      },
      plugins: [require("tailwindcss-animate")],
    } satisfies Config
    
    export default config
    ```

-   [x] **Task 1.2: Create a `ThemeProvider` Component:** Create a new client component that wraps the `next-themes` provider to avoid hydration errors with server components.
    *   **File:** `src/components/theme-provider.tsx`
    *   **Action:** Create the file with the following content.
    ```tsx
    "use client"

    import * as React from "react"
    import { ThemeProvider as NextThemesProvider } from "next-themes"
    import type { ThemeProviderProps } from "next-themes/dist/types"

    export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
      return <NextThemesProvider {...props}>{children}</NextThemesProvider>
    }
    ```

-   [x] **Task 1.3: Integrate `ThemeProvider` into Root Layout:** Wrap the entire application in the new `ThemeProvider`.
    *   **File:** `src/app/layout.tsx`
    *   **Action:** Import the `ThemeProvider` and use it to wrap the `AuthProvider` and its children.
    ```tsx
    import React from 'react';
    import type { Metadata } from "next";
    import "./globals.css";
    import { AuthProvider } from '@/lib/auth-context';
    import Navbar from '@/components/Navbar';
    import { ThemeProvider } from "@/components/theme-provider";

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
              <AuthProvider>
                <Navbar />
                <main>{children}</main>
              </AuthProvider>
            </ThemeProvider>
          </body>
        </html>
      );
    }
    ```

-   [x] **Task 1.4: Create the `ThemeToggle` Component:** Create the UI control that allows users to switch between light, dark, and system themes.
    *   **File:** `src/components/theme-toggle.tsx`
    *   **Action:** Create the file with the following content.
    ```tsx
    "use client"

    import * as React from "react"
    import { Moon, Sun } from "lucide-react"
    import { useTheme } from "next-themes"

    import { Button } from "@/components/ui/button"
    import {
      DropdownMenu,
      DropdownMenuContent,
      DropdownMenuItem,
      DropdownMenuTrigger,
    } from "@/components/ui/dropdown-menu"

    export function ThemeToggle() {
      const { setTheme } = useTheme()

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
    ```

-   [x] **Task 1.5: Add `ThemeToggle` to Navbar:** Integrate the new theme toggle button into the main navigation bar for easy access.
    *   **File:** `src/components/Navbar.tsx`
    *   **Action:** Replace the entire file content with the following code, which adds the `ThemeToggle`.
    ```tsx
    'use client';

    import React, { useState } from 'react';
    import Link from "next/link";
    import { AuthLinks } from '@/components/AuthLinks';
    import { ThemeToggle } from './theme-toggle';

    const Navbar: React.FC = () => {
        const [isOpen, setIsOpen] = useState(false);
        
        const closeMenu = () => setIsOpen(false);

        return (
            <header className="bg-background border-b sticky top-0 z-50">
                <div className="container mx-auto flex justify-between items-center p-4">
                    <Link href="/" className="text-lg font-bold" onClick={closeMenu}>Protocolize</Link>
                    
                    {/* Desktop Menu */}
                    <div className="hidden md:flex space-x-4 items-center">
                        <Link href="/dashboard" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Dashboard</Link>
                        <Link href="/journal" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Journal</Link>
                        <Link href="/study" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Study</Link>
                        <Link href="/analytics" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Analytics</Link>
                        <Link href="/pricing" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Pricing</Link>
                        <AuthLinks />
                        <ThemeToggle />
                    </div>
                    
                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-2">
                        <ThemeToggle />
                        <button onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu" className="p-2">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}></path>
                            </svg>
                        </button>
                    </div>
                </div>
                
                {/* Mobile Menu */}
                {isOpen && (
                    <div className="md:hidden">
                        <div className="flex flex-col space-y-4 px-4 pb-4">
                            <Link href="/dashboard" className="hover:underline block px-2 py-1" onClick={closeMenu}>Dashboard</Link>
                            <Link href="/journal" className="hover:underline block px-2 py-1" onClick={closeMenu}>Journal</Link>
                            <Link href="/study" className="hover:underline block px-2 py-1" onClick={closeMenu}>Study</Link>
                            <Link href="/analytics" className="hover:underline block px-2 py-1" onClick={closeMenu}>Analytics</Link>
                            <Link href="/pricing" className="hover:underline block px-2 py-1" onClick={closeMenu}>Pricing</Link>
                            <div className="border-t border-border my-2"></div>
                            <div className="px-2 py-1 flex flex-col space-y-4 items-start">
                                <AuthLinks />
                            </div>
                        </div>
                    </div>
                )}
            </header>
        );
    };

    export default Navbar;
    ```

---
### 2. Visual Polish & Consistency Review

-   [x] **Task 2.1: Update Global Styles:** Refine `src/app/globals.css` to use CSS variables defined by `shadcn/ui` for background and foreground colors, ensuring the theme toggle works correctly.
    *   **File:** `src/app/globals.css`
    *   **Action:** Replace the entire file content with the following `tailwind` directives and CSS variables.
    ```css
    @import "tailwindcss";

    @layer base {
      :root {
        --background: 0 0% 100%;
        --foreground: 222.2 84% 4.9%;
        --card: 0 0% 100%;
        --card-foreground: 222.2 84% 4.9%;
        --popover: 0 0% 100%;
        --popover-foreground: 222.2 84% 4.9%;
        --primary: 222.2 47.4% 11.2%;
        --primary-foreground: 210 40% 98%;
        --secondary: 210 40% 96.1%;
        --secondary-foreground: 222.2 47.4% 11.2%;
        --muted: 210 40% 96.1%;
        --muted-foreground: 215.4 16.3% 46.9%;
        --accent: 210 40% 96.1%;
        --accent-foreground: 222.2 47.4% 11.2%;
        --destructive: 0 84.2% 60.2%;
        --destructive-foreground: 210 40% 98%;
        --border: 214.3 31.8% 91.4%;
        --input: 214.3 31.8% 91.4%;
        --ring: 222.2 84% 4.9%;
        --radius: 0.5rem;
      }
    
      .dark {
        --background: 222.2 84% 4.9%;
        --foreground: 210 40% 98%;
        --card: 222.2 84% 4.9%;
        --card-foreground: 210 40% 98%;
        --popover: 222.2 84% 4.9%;
        --popover-foreground: 210 40% 98%;
        --primary: 210 40% 98%;
        --primary-foreground: 222.2 47.4% 11.2%;
        --secondary: 217.2 32.6% 17.5%;
        --secondary-foreground: 210 40% 98%;
        --muted: 217.2 32.6% 17.5%;
        --muted-foreground: 215 20.2% 65.1%;
        --accent: 217.2 32.6% 17.5%;
        --accent-foreground: 210 40% 98%;
        --destructive: 0 62.8% 30.6%;
        --destructive-foreground: 210 40% 98%;
        --border: 217.2 32.6% 17.5%;
        --input: 217.2 32.6% 17.5%;
        --ring: 212.7 26.8% 83.9%;
      }
    }
    
    @layer base {
      * {
        @apply border-border;
      }
      body {
        @apply bg-background text-foreground;
        font-feature-settings: "rlig" 1, "calt" 1;
      }
    }
    ```

-   [x] **Task 2.2: Polish Landing Page:** Update `src/app/page.tsx` to use theme-aware colors and improve visual hierarchy using `shadcn/ui` components.
    *   **File:** `src/app/page.tsx`
    *   **Action:** Replace the entire file content with the following polished version.
    ```tsx
    import Link from 'next/link';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';

    const FeatureCard = ({ icon, title, description }: { icon: string, title: string, description: string }) => (
      <Card className="text-center bg-card/50">
        <CardHeader>
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary mb-4">
            <span className="text-2xl">{icon}</span>
          </div>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    );

    export default function Home() {
      return (
        <>
          {/* Hero Section */}
          <section className="text-center py-20 px-4 sm:py-32">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
                Turn Wellness Theory into Daily Practice
              </h1>
              <p className="mt-4 text-lg sm:text-xl text-muted-foreground">
                Stop just listening. Start doing. Protocolize helps you implement science-backed health protocols from your favorite experts into a consistent, actionable lifestyle.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                <Button asChild size="lg">
                  <Link href="/signup">Start for Free</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="py-20 px-4 bg-muted/40">
            <div className="container mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold">Everything You Need for Consistent Action</h2>
                <p className="mt-2 text-muted-foreground">Our platform is packed with features to make implementation effortless.</p>
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

          {/* Final CTA Section */}
          <section className="bg-primary text-primary-foreground">
            <div className="container mx-auto text-center py-16 px-4">
              <h2 className="text-3xl sm:text-4xl font-bold">
                Ready to Protocolize Your Life?
              </h2>
              <p className="opacity-80 mt-2 mb-6">Stop guessing. Start building better habits today.</p>
              <Button asChild size="lg" variant="secondary">
                <Link href="/signup">Sign Up and Start for Free</Link>
              </Button>
            </div>
          </section>

          {/* Footer */}
          <footer className="bg-background border-t">
            <div className="container mx-auto py-6 px-4 text-center text-muted-foreground">
              <p>© {new Date().getFullYear()} Protocolize. All rights reserved.</p>
            </div>
          </footer>
        </>
      );
    }
    ```

-   [ ] **Task 2.3: Final Code Formatting:** Run a single command to format the entire codebase according to the project's prettier rules, ensuring all changes are clean and consistent.
    ```bash
    npx prettier --write .
    ```