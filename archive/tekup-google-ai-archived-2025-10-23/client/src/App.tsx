import { useAuth } from './components/auth/SupabaseAuthProvider'
import { SignInForm } from './components/auth/SignInForm'
import { AppRouter } from './router'
import { Toaster } from '@/components/ui/sonner'
import './App.css'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="App">
      <Toaster />
      {user ? (
        <AppRouter />
      ) : (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
          {/* Animated gradient background - Cursor inspired */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0A] via-[#0F0F14] to-[#0A0A0A]">
            {/* Subtle animated mesh gradient */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#00D4FF]/20 rounded-full blur-[120px] animate-pulse-glow"></div>
              <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#8B5CF6]/20 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '2s' }}></div>
            </div>
            {/* Grid pattern overlay */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
                backgroundSize: '40px 40px'
              }}
            ></div>
          </div>

          <div className="glass-card max-w-md w-full p-8 md:p-12 relative z-10 animate-fade-in-up">
            <div className="text-center space-y-8">
              {/* Logo */}
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00D4FF] to-[#0091B3] flex items-center justify-center shadow-glow">
                  <span className="text-3xl font-bold text-[#0A0A0A]">R</span>
                </div>
              </div>

              {/* Hero Text - Bold & Minimal like Cursor */}
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                  Velkommen til{' '}
                  <span className="bg-gradient-to-r from-[#00D4FF] to-[#8B5CF6] bg-clip-text text-transparent">
                    RenOS
                  </span>
                </h1>
                <p className="text-lg text-[#A3A3A3] leading-relaxed max-w-sm mx-auto">
                  Det intelligente management system til Rendetalje.dk
                </p>
              </div>

              {/* Features - Clean & Minimal */}
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00E676]"></div>
                  <span className="text-sm text-[#A3A3A3]">AI-powered automation</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00E676]"></div>
                  <span className="text-sm text-[#A3A3A3]">Effektiv workflow management</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00E676]"></div>
                  <span className="text-sm text-[#A3A3A3]">Real-time statistik og indsigt</span>
                </div>
              </div>

              {/* Sign In Button - Bold CTA like Cursor */}
              <div className="space-y-4 pt-4">
                <SignInForm minimal />

                <div className="text-xs text-[#737373] space-y-2 pt-2">
                  <p className="flex items-center justify-center gap-2">
                    <svg className="w-3.5 h-3.5 text-[#00E676]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Sikker login med Supabase
                  </p>
                  <p className="leading-relaxed">
                    Ved at logge ind accepterer du vores{' '}
                    <a href="/vilkaar" className="text-primary hover:underline">vilkår</a> og{' '}
                    <a href="/privatlivspolitik" className="text-primary hover:underline">privatlivspolitik</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
