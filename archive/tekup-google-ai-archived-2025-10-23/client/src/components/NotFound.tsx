import { Home, ArrowLeft } from 'lucide-react'

interface NotFoundProps {
  onNavigate?: (page: string) => void
}

export default function NotFound({ onNavigate }: NotFoundProps) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <h1 className="text-8xl sm:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-4">
            404
          </h1>
          <div className="w-32 h-1 bg-gradient-to-r from-blue-400 to-cyan-300 mx-auto mb-8 rounded-full"></div>
        </div>
        
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
          Siden blev ikke fundet
        </h2>
        
        <p className="text-muted-foreground mb-8">
          Beklager, men den side du leder efter eksisterer ikke eller er blevet flyttet.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 glass border border-glass text-foreground rounded-xl hover:bg-glass-hover transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Gå tilbage
          </button>
          
          <button
            onClick={() => onNavigate?.('dashboard')}
            className="px-6 py-3 bg-gradient-to-r from-blue-400 to-cyan-300 text-slate-900 rounded-xl hover:from-blue-500 hover:to-cyan-400 transition-all font-medium flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Til forsiden
          </button>
        </div>
      </div>
    </div>
  )
}