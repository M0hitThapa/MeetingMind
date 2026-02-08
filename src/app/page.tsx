import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Mic, 
  Brain, 
  Zap, 
  Shield, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { Header } from '@/components/layout/header';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
     <Header />
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-8">
            <Zap className="w-4 h-4" />
            <span>Powered by MeetingMind</span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
            Never Miss a{' '}
            <span className="text-primary">Critical Insight</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            MeetingMind transforms your meetings into actionable intelligence with 
            AI-powered transcription, smart task management, and integrated learning.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="gap-2">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need for Meeting Intelligence
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Mic,
                title: 'Smart Transcription',
                description: 'AssemblyAI-powered transcription with speaker diarization and automatic chapters.',
              },
              {
                icon: Brain,
                title: 'AI Analysis',
                description: 'MeetingMind extracts decisions, action items, risks, and sentiment automatically.',
              },
              {
                icon: Zap,
                title: 'Multi-Component Insights',
                description: 'One query generates multiple visualizations tailored to your question.',
              },
              {
                icon: CheckCircle2,
                title: 'Task Management',
                description: 'Convert action items into organized tasks with GTD and Kanban workflows.',
              },
              {
                icon: Shield,
                title: 'Knowledge Retention',
                description: 'Auto-generated flashcards with spaced repetition for long-term learning.',
              },
              {
                icon: ArrowRight,
                title: 'Follow-through',
                description: 'Automated reminders and deadline tracking ensure nothing falls through.',
              },
            ].map((feature) => (
              <div 
                key={feature.title}
                className="p-6 rounded-lg bg-card border border-border hover:shadow-lg transition-shadow"
              >
                <feature.icon className="w-10 h-10 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}