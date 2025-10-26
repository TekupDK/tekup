import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Mic, Camera, Volume2, Image, Play, Pause, Square, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function VoiceAIApp() {
  const [isRecording, setIsRecording] = useState(false)
  const [activeTab, setActiveTab] = useState('voice')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full overflow-y-auto"
    >
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Mic className="w-8 h-8 text-primary-400" />
            Voice AI & Computer Vision
          </h1>
          <p className="text-slate-400 mt-2">
            Avanceret stemme- og billedteknologi med AI
          </p>
        </div>

        {/* Service Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-800 rounded-lg w-fit">
          {[
            { id: 'voice', label: 'Voice AI', icon: <Mic className="w-4 h-4" /> },
            { id: 'vision', label: 'Computer Vision', icon: <Camera className="w-4 h-4" /> },
            { id: 'synthesis', label: 'Speech Synthesis', icon: <Volume2 className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Voice AI Tab */}
        {activeTab === 'voice' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Voice Recording */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card-glass space-y-6"
            >
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Mic className="w-5 h-5 text-primary-400" />
                Voice Recording & Transcription
              </h2>
              
              <div className="text-center space-y-6">
                <div className="w-32 h-32 mx-auto bg-slate-800 rounded-full flex items-center justify-center relative">
                  <button
                    onClick={() => setIsRecording(!isRecording)}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isRecording 
                        ? 'bg-danger-500 hover:bg-danger-600 animate-pulse' 
                        : 'bg-primary-500 hover:bg-primary-600'
                    }`}
                  >
                    {isRecording ? (
                      <Square className="w-8 h-8 text-white" />
                    ) : (
                      <Mic className="w-8 h-8 text-white" />
                    )}
                  </button>
                  {isRecording && (
                    <div className="absolute inset-0 border-4 border-danger-400 rounded-full animate-ping" />
                  )}
                </div>
                
                <div>
                  <p className="text-white font-medium">
                    {isRecording ? 'Optager...' : 'Klik for at starte optagelse'}
                  </p>
                  <p className="text-sm text-slate-400">
                    Automatisk transskription til tekst
                  </p>
                </div>
                
                {isRecording && (
                  <div className="space-y-2">
                    <div className="text-sm text-slate-400">Varighed: 00:23</div>
                    <div className="w-full bg-slate-700 rounded-full h-1">
                      <div className="h-1 bg-primary-500 rounded-full w-1/3 animate-pulse" />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button className="btn-secondary">
                  <Play className="w-4 h-4 mr-2" />
                  Afspil
                </button>
                <button className="btn-secondary">
                  Gem Optagelse
                </button>
              </div>
            </motion.div>

            {/* Transcription Results */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="card-glass"
            >
              <h2 className="text-xl font-semibold text-white mb-6">Transskription</h2>
              
              <div className="h-64 bg-slate-800/50 rounded-lg p-4 overflow-y-auto">
                <div className="space-y-3">
                  <div className="text-sm text-slate-400 mb-2">Seneste transskription:</div>
                  <p className="text-white leading-relaxed">
                    "Hej og velkommen til vores møde i dag. Vi skal diskutere den nye AI platform 
                    og hvordan vi kan integrere voice recognition i vores workflow. Dette vil 
                    give os mulighed for at automatisere mange af vores manuelle processer..."
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-600">
                    <span className="text-xs text-slate-400">Confidence: 96.7%</span>
                    <span className="text-xs text-slate-400">Language: Dansk</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-4">
                <button className="btn-primary flex-1">
                  Eksporter som tekst
                </button>
                <button className="btn-secondary">
                  Redigér
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Computer Vision Tab */}
        {activeTab === 'vision' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Image Upload */}
              <div className="card-glass">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary-400" />
                  Billedanalyse
                </h2>
                
                <div className="border-2 border-dashed border-slate-600 rounded-lg p-12 text-center hover:border-primary-500 transition-colors cursor-pointer">
                  <Image className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-300 mb-2">Upload billede til analyse</p>
                  <p className="text-sm text-slate-400">Understøtter JPG, PNG, WebP</p>
                </div>
              </div>

              {/* Analysis Results */}
              <div className="card-glass">
                <h2 className="text-xl font-semibold text-white mb-6">Analyse Resultater</h2>
                
                <div className="space-y-4">
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <h3 className="font-medium text-white mb-2">Objekter detekteret:</h3>
                    <div className="flex flex-wrap gap-2">
                      {['Person (95.2%)', 'Laptop (87.4%)', 'Kop (76.8%)', 'Bog (65.1%)'].map((object, index) => (
                        <span key={index} className="px-2 py-1 bg-primary-500/20 text-primary-400 rounded text-sm">
                          {object}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <h3 className="font-medium text-white mb-2">Ansigter:</h3>
                    <p className="text-slate-300 text-sm">2 ansigter detekteret med emotion analyse</p>
                  </div>
                  
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <h3 className="font-medium text-white mb-2">Tekst (OCR):</h3>
                    <p className="text-slate-300 text-sm">"TekUp AI Platform - Fremtiden for Business Automation"</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Speech Synthesis Tab */}
        {activeTab === 'synthesis' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card-glass max-w-4xl mx-auto"
          >
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-primary-400" />
              Text-to-Speech Synthesis
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Indtast tekst til tale synthesis
                </label>
                <textarea
                  className="input-glass w-full h-32 resize-none"
                  placeholder="Skriv den tekst du vil konvertere til tale..."
                  defaultValue="Hej og velkommen til TekUp AI Platform. Dette er et eksempel på vores avancerede text-to-speech teknologi."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Stemme
                  </label>
                  <select className="input-glass w-full">
                    <option>Maria (Dansk, Kvinde)</option>
                    <option>Lars (Dansk, Mand)</option>
                    <option>Emma (Engelsk, Kvinde)</option>
                    <option>James (Engelsk, Mand)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Hastighed
                  </label>
                  <select className="input-glass w-full">
                    <option>Normal</option>
                    <option>Langsom</option>
                    <option>Hurtig</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Tonehøjde
                  </label>
                  <select className="input-glass w-full">
                    <option>Normal</option>
                    <option>Høj</option>
                    <option>Lav</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button className="btn-primary">
                  <Volume2 className="w-4 h-4 mr-2" />
                  Generer Tale
                </button>
                <button className="btn-secondary">
                  Download Audio
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Development Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary-500/20 rounded-lg">
              <ExternalLink className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Voice & Vision AI Integration</h3>
              <p className="text-slate-300 text-sm mb-4">
                Voice AI & Computer Vision integrerer med Azure Cognitive Services, Google Cloud AI, og OpenAI Whisper for state-of-the-art functionality.
              </p>
              <Link to="/settings/integrations" className="text-primary-400 hover:text-primary-300 text-sm">
                Konfigurer AI providers →
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
