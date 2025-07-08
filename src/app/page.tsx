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