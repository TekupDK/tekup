import { ArrowRight, Bot, Brain, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

const Index = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    setIsVisible(true);

    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Mouse tracking for ambient effects
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      clearInterval(timeInterval);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      {/* Ambient Background Effect */}
      <div
        className="fixed inset-0 pointer-events-none opacity-10"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.3) 0%, transparent 50%)`
        }}
      />


      {/* Hero Section */}
  <main className="relative z-10 container mx-auto px-6 pt-28 pb-24 md:pt-36">
        <div className={`text-center max-w-6xl mx-auto transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>

          {/* AI Status */}
          <div className="flex items-center justify-center mb-12">
            <div className="flex items-center space-x-4 bg-gray-800/60 backdrop-blur-sm px-8 py-4 rounded-full border border-gray-700 shadow-lg">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-white font-medium">System Klar - {currentTime.toLocaleTimeString('da-DK')}</span>
              <Brain className="w-4 h-4 text-blue-400" />
            </div>
          </div>

          {/* Main Title */}
          <h1 className="text-6xl md:text-8xl font-black mb-12 leading-tight">
            <span className="block bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent font-mono">
              TekUp.dk
            </span>
            <span className="block text-4xl md:text-6xl text-gray-300 mt-8 font-light">
              Din pålidelige AI-partner
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-400 mb-16 max-w-5xl mx-auto leading-relaxed">
            Vi hjælper <span className="text-blue-400 font-semibold">danske virksomheder</span> med at træffe bedre beslutninger gennem intelligent teknologi.
            Med over <span className="text-purple-400 font-semibold">10 års erfaring</span> leverer vi AI-løsninger der understøtter jeres 
            <span className="text-pink-400 font-semibold"> medarbejdere</span> og skaber målbare forretningsresultater.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-8 justify-center mb-20">
            <button className="btn btn-primary px-12 py-6 text-xl font-semibold rounded-xl shadow-2xl hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-3">
              <Bot className="w-6 h-6" />
              <span>Start din digitale transformation</span>
              <ArrowRight className="w-6 h-6" />
            </button>

            <button className="btn btn-outline px-12 py-6 text-xl font-semibold rounded-xl border-2 border-purple-500/50 text-purple-400 hover:bg-purple-500/10 transition-all duration-300 flex items-center justify-center space-x-3">
              <Sparkles className="w-6 h-6" />
              <span>Se vores løsninger</span>
            </button>
          </div>

          {/* Metrics Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto mb-24 md:mb-32">
            <div className="card p-10 text-center hover:scale-105 transition-transform duration-300">
              <div className="text-5xl font-bold text-blue-400 mb-4">200+</div>
              <div className="text-sm text-gray-400 uppercase tracking-wide font-medium">Succesfulde implementeringer</div>
            </div>
            <div className="card p-10 text-center hover:scale-105 transition-transform duration-300">
              <div className="text-5xl font-bold text-purple-400 mb-4">99.7%</div>
              <div className="text-sm text-gray-400 uppercase tracking-wide font-medium">Oppetid på alle systemer</div>
            </div>
            <div className="card p-10 text-center hover:scale-105 transition-transform duration-300">
              <div className="text-5xl font-bold text-pink-400 mb-4">45%</div>
              <div className="text-sm text-gray-400 uppercase tracking-wide font-medium">Gennemsnitlig effektivitetsforbedring</div>
            </div>
            <div className="card p-10 text-center hover:scale-105 transition-transform duration-300">
              <div className="text-5xl font-bold text-green-400 mb-4">4.8/5</div>
              <div className="text-sm text-gray-400 uppercase tracking-wide font-medium">Kundetilfredshed</div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-400 mb-24 md:mb-32">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              GDPR-compliant og sikker
            </span>
            <span>•</span>
            <span>Dansk support og værdier</span>
            <span>•</span>
            <span>60% hurtigere dataanalyse</span>
            <span>•</span>
            <span>Øget medarbejdertilfredshed</span>
          </div>
        </div>
      </main>

      {/* About Section - Credibility Builder */}
      <section className="relative z-10 bg-gray-800/50 py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Hvorfor danske virksomheder vælger <span className="text-blue-400">TekUp.dk</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Vi kombinerer teknisk ekspertise med dyb forståelse af den danske forretningskultur
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-20">
              {/* Experience */}
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Brain className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4">10+ års erfaring</h3>
                <p className="text-gray-400 leading-relaxed">
                  Vores team har hjulpet danske virksomheder siden 2014 med at implementere intelligente teknologiløsninger
                </p>
              </div>

              {/* Danish Values */}
              <div className="text-center">
                <div className="w-20 h-20 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-10 h-10 text-green-400" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4">Danske værdier</h3>
                <p className="text-gray-400 leading-relaxed">
                  Vi forstår vigtigheden af transparens, tillid og personlig service i dansk forretningskultur
                </p>
              </div>

              {/* Proven Results */}
              <div className="text-center">
                <div className="w-20 h-20 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Bot className="w-10 h-10 text-purple-400" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4">Dokumenterede resultater</h3>
                <p className="text-gray-400 leading-relaxed">
                  Alle vores kunder oplever målbare forbedringer i effektivitet og beslutningsprocesser
                </p>
              </div>
            </div>

            {/* Customer Testimonials */}
            <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-12 border border-gray-700">
              <h3 className="text-2xl font-semibold text-white text-center mb-12">Hvad vores kunder siger</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="text-center">
                  <p className="text-gray-300 italic text-lg mb-6">
                    "TekUp.dk hjalp os med at automatisere vores dataanalyse. Vi sparer nu 15 timer om ugen og træffer bedre beslutninger."
                  </p>
                  <div className="text-sm text-gray-400">
                    <span className="font-semibold text-white">Lars Nielsen</span><br />
                    IT-direktør, Dansk Producent ApS
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-gray-300 italic text-lg mb-6">
                    "Den personlige service og forståelse for vores behov gjorde forskellen. Implementeringen forløb uden problemer."
                  </p>
                  <div className="text-sm text-gray-400">
                    <span className="font-semibold text-white">Maria Andersen</span><br />
                    CEO, Regional Konsulent A/S
                  </div>
                </div>
              </div>
            </div>

            {/* Compliance & Security */}
            <div className="mt-20 text-center">
              <h3 className="text-2xl font-semibold text-white mb-8">Sikkerhed og compliance</h3>
              <div className="flex flex-wrap justify-center items-center gap-8 text-gray-400">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  GDPR-compliant
                </span>
                <span>•</span>
                <span>ISO 27001 certificeret</span>
                <span>•</span>
                <span>Dansk databehandling</span>
                <span>•</span>
                <span>24/7 support på dansk</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-800/80 backdrop-blur-sm border-t border-gray-700 mt-24">
        <div className="container mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <h3 className="text-xl font-semibold text-white mb-6">TekUp.dk</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Ansvarlig AI-innovation for danske virksomheder
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-6">Services</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">AI Indsigt Platform</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Intelligent Dataanalyse</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Customer Relationship Management</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Automatiseret Beslutningsstøtte</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-6">Kontakt</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li>contact@tekup.dk</li>
                <li>+45 XX XX XX XX</li>
                <li>Denmark</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-6">Social</h4>
              <div className="flex space-x-6">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">LinkedIn</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">GitHub</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Twitter</a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-12 text-center">
            <p className="text-gray-400 text-sm mb-6">
              &copy; 2024 TekUp.dk - Alle rettigheder forbeholdes
            </p>
            <div className="flex justify-center space-x-8 text-xs text-gray-500">
              <a href="#" className="hover:text-gray-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-gray-400 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-gray-400 transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;