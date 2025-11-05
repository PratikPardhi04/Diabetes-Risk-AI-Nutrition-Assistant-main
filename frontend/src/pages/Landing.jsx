import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const Landing = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900" />
          <div className="absolute -top-48 right-1/2 h-96 w-[50rem] rounded-full bg-primary-200/60 blur-3xl dark:bg-primary-600/10 -rotate-12" />
          <div className="container px-4 py-20 text-center">
            <div className="mx-auto max-w-3xl">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                Diabetes Risk & AI Nutrition Assistant
              </h1>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                Assess your risk, log meals effortlessly, and get actionable, AI-powered insights to live healthier.
              </p>
              <div className="mt-8 flex items-center justify-center gap-3">
                <Button asChild className="h-11 px-6">
                  <Link to="/signup">Get started</Link>
                </Button>
                <Button asChild variant="outline" className="h-11 px-6">
                  <Link to="/login">Log in</Link>
                </Button>
              </div>
              <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="rounded-md border bg-white/60 backdrop-blur dark:bg-gray-900/40 p-3">No ads</div>
                <div className="rounded-md border bg-white/60 backdrop-blur dark:bg-gray-900/40 p-3">Privacy-first</div>
                <div className="rounded-md border bg-white/60 backdrop-blur dark:bg-gray-900/40 p-3">Fast & simple</div>
                <div className="rounded-md border bg-white/60 backdrop-blur dark:bg-gray-900/40 p-3">Free to start</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container px-4 py-16">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="group p-6 transition hover:shadow-md">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-primary-100 text-2xl group-hover:scale-105 transition">🩺</div>
              <h3 className="text-lg font-semibold text-center">Risk Assessment</h3>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                Take a comprehensive questionnaire to assess your diabetes risk.
              </p>
            </Card>
            <Card className="group p-6 transition hover:shadow-md">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-primary-100 text-2xl group-hover:scale-105 transition">🍎</div>
              <h3 className="text-lg font-semibold text-center">AI Nutrition Analysis</h3>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                Get instant, AI-powered nutrition breakdowns for your meals.
              </p>
            </Card>
            <Card className="group p-6 transition hover:shadow-md">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-primary-100 text-2xl group-hover:scale-105 transition">💬</div>
              <h3 className="text-lg font-semibold text-center">Health Chat Assistant</h3>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                Ask questions and get guidance tailored to your lifestyle.
              </p>
            </Card>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default Landing;

