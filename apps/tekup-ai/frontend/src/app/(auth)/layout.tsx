'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Brain } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/chat');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side - Branding */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary to-blue-600 p-12 flex-col justify-between text-primary-foreground">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Brain className="w-7 h-7" />
            </div>
            <span className="text-3xl font-bold">TekupAI</span>
          </div>
          <h1 className="text-4xl font-bold mb-6">
            Your AI Assistant with a Memory
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-md">
            Experience truly personalized AI conversations with persistent memory,
            contextual understanding, and seamless integrations.
          </p>
        </div>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold">1</span>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Persistent Memory</h3>
              <p className="text-sm text-primary-foreground/70">
                Your assistant remembers context across all conversations
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold">2</span>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Powered by Claude</h3>
              <p className="text-sm text-primary-foreground/70">
                Advanced AI capabilities for natural conversations
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold">3</span>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Secure & Private</h3>
              <p className="text-sm text-primary-foreground/70">
                Your data is encrypted and stored securely
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-background">
        <div className="w-full max-w-md">
          <div className="md:hidden mb-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold">TekupAI</span>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
