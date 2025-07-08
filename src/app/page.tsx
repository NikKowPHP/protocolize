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
            <Link href="/signup" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-transform transform hover:scale-105 text-center">
              Start for Free
            </Link>
            <Link href="/dashboard" className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-full text-lg transition-transform transform hover:scale-105 text-center">
              Go to Dashboard
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
    </div>
  );
}