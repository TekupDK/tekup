'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import {
  MessageSquare,
  Brain,
  Zap,
  Lock,
  Code,
  Users
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/chat');
    }
  }, [isAuthenticated, router]);

  const features = [
    {
      icon: Brain,
      title: 'Persistent Memory',
      description: 'Your AI assistant remembers context across conversations for truly personalized interactions.',
    },
    {
      icon: MessageSquare,
      title: 'Natural Conversations',
      description: 'Powered by Claude AI for human-like, contextual conversations.',
    },
    {
      icon: Zap,
      title: 'MCP Integration',
      description: 'Connect to external tools and services through the Model Context Protocol.',
    },
    {
      icon: Lock,
      title: 'Secure & Private',
      description: 'Your data is encrypted and stored securely with Supabase.',
    },
    {
      icon: Code,
      title: 'Developer Friendly',
      description: 'Built with modern tech stack: Next.js 15, TypeScript, and real-time WebSockets.',
    },
    {
      icon: Users,
      title: 'Multi-User Support',
      description: 'Separate workspaces and memories for each user.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Brain className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold">TekupAI</span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/login')}>
            Sign In
          </Button>
          <Button onClick={() => router.push('/register')}>
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Your AI Assistant with a Memory
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Experience truly personalized AI conversations. TekupAI remembers your preferences,
            context, and history to provide intelligent, contextual responses every time.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button size="lg" onClick={() => router.push('/register')}>
              Start Chatting Free
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push('/login')}>
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need for intelligent, contextual AI interactions
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
              <feature.icon className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="max-w-4xl mx-auto p-12 text-center bg-gradient-to-r from-primary/10 to-blue-600/10 border-primary/20">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of users who are experiencing the future of AI conversations
          </p>
          <Button size="lg" onClick={() => router.push('/register')}>
            Create Free Account
          </Button>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <span className="font-semibold">TekupAI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            2024 TekupAI. Built with Next.js 15 and Claude AI.
          </p>
        </div>
      </footer>
    </div>
  );
}
