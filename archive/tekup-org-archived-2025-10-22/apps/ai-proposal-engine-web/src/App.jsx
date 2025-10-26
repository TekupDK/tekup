import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { 
  Brain, 
  FileText, 
  Zap, 
  Target, 
  TrendingUp, 
  Clock, 
  DollarSign,
  Users,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Download,
  ExternalLink
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('upload')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('')
  const [results, setResults] = useState(null)

  // Mock data for demonstration
  const mockResults = {
    buyingSignals: [
      { type: 'urgency', text: 'We need this implemented by end of quarter', confidence: 0.92 },
      { type: 'budget', text: 'We have allocated $50k for this project', confidence: 0.88 },
      { type: 'authority', text: 'I have the final say on this decision', confidence: 0.85 },
      { type: 'pain_point', text: 'Our current system is costing us too much', confidence: 0.90 }
    ],
    researchInsights: [
      'Technology companies are prioritizing cost reduction initiatives',
      'Modern solutions deliver measurable ROI within 6 months',
      'Implementation timelines are critical for Q4 budget cycles'
    ],
    proposalSections: [
      { title: 'Executive Summary', wordCount: 245 },
      { title: 'Current Challenges', wordCount: 312 },
      { title: 'Recommended Solution', wordCount: 428 },
      { title: 'Expected Benefits & ROI', wordCount: 298 },
      { title: 'Implementation Approach', wordCount: 356 },
      { title: 'Next Steps', wordCount: 189 }
    ],
    documentUrl: 'https://docs.google.com/document/d/1234567890/edit',
    confidence: 87,
    processingTime: '8.3 seconds'
  }

  const handleGenerate = async () => {
    if (!transcript.trim()) return

    setIsProcessing(true)
    setProgress(0)
    setActiveTab('processing')

    // Simulate processing steps
    const steps = [
      { name: 'Analyzing transcript...', duration: 1000 },
      { name: 'Extracting buying signals...', duration: 1500 },
      { name: 'Conducting live research...', duration: 2000 },
      { name: 'Generating narrative...', duration: 2500 },
      { name: 'Assembling document...', duration: 1000 }
    ]

    let currentProgress = 0
    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, step.duration))
      currentProgress += 100 / steps.length
      setProgress(currentProgress)
    }

    setResults(mockResults)
    setIsProcessing(false)
    setActiveTab('results')
  }

  const signalTypeColors = {
    urgency: 'bg-red-500/20 text-red-400 border-red-500/30',
    budget: 'bg-green-500/20 text-green-400 border-green-500/30',
    authority: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    pain_point: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
  }

  const signalTypeIcons = {
    urgency: Clock,
    budget: DollarSign,
    authority: Users,
    pain_point: AlertCircle
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      {/* Glassmorphism background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 backdrop-blur-sm border border-white/10">
              <Brain className="w-8 h-8 text-purple-400" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              AI Proposal Engine
            </h1>
          </div>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Transform sales call transcripts into precision-targeted proposals in minutes, not hours
          </p>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>10 minute generation</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-green-400" />
              <span>87% accuracy</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span>$8,500 closed last week</span>
            </div>
          </div>
        </motion.div>

        {/* Main Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/5 backdrop-blur-sm border border-white/10">
              <TabsTrigger value="upload" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
                Upload Transcript
              </TabsTrigger>
              <TabsTrigger value="processing" disabled={!isProcessing} className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
                Processing
              </TabsTrigger>
              <TabsTrigger value="results" disabled={!results} className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
                Results
              </TabsTrigger>
            </TabsList>

            {/* Upload Tab */}
            <TabsContent value="upload" className="mt-6">
              <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-400" />
                    Sales Call Transcript
                  </CardTitle>
                  <CardDescription className="text-slate-300">
                    Paste your sales call transcript and provide context for optimal proposal generation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company" className="text-slate-300">Company Name</Label>
                      <Input
                        id="company"
                        placeholder="e.g., Acme Corporation"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="industry" className="text-slate-300">Industry</Label>
                      <Input
                        id="industry"
                        placeholder="e.g., Technology, Healthcare"
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="transcript" className="text-slate-300">Call Transcript</Label>
                    <Textarea
                      id="transcript"
                      placeholder="Paste your sales call transcript here..."
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      className="min-h-[300px] bg-white/5 border-white/10 text-white placeholder:text-slate-400 resize-none"
                    />
                  </div>

                  <Button 
                    onClick={handleGenerate}
                    disabled={!transcript.trim() || isProcessing}
                    className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate AI Proposal
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Processing Tab */}
            <TabsContent value="processing" className="mt-6">
              <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-400 animate-pulse" />
                    AI Processing Pipeline
                  </CardTitle>
                  <CardDescription className="text-slate-300">
                    Analyzing transcript and generating your precision-targeted proposal
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Overall Progress</span>
                      <span className="text-purple-400 font-semibold">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-3 bg-white/10" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { icon: FileText, title: 'Transcript Analysis', desc: 'Processing conversation flow' },
                      { icon: Target, title: 'Signal Extraction', desc: 'Identifying buying signals' },
                      { icon: TrendingUp, title: 'Live Research', desc: 'Gathering market insights' },
                      { icon: Brain, title: 'Narrative Generation', desc: 'Creating compelling content' },
                      { icon: CheckCircle, title: 'Document Assembly', desc: 'Formatting final proposal' }
                    ].map((step, index) => (
                      <motion.div
                        key={step.title}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 rounded-lg bg-white/5 border border-white/10"
                      >
                        <step.icon className="w-6 h-6 text-purple-400 mb-2" />
                        <h3 className="text-white font-semibold text-sm">{step.title}</h3>
                        <p className="text-slate-400 text-xs">{step.desc}</p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Results Tab */}
            <TabsContent value="results" className="mt-6">
              <AnimatePresence>
                {results && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Success Header */}
                    <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-500/20">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-8 h-8 text-green-400" />
                            <div>
                              <h2 className="text-xl font-bold text-white">Proposal Generated Successfully!</h2>
                              <p className="text-green-300">Processed in {results.processingTime} with {results.confidence}% confidence</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                              <Download className="w-4 h-4 mr-2" />
                              Download PDF
                            </Button>
                            <Button size="sm" className="bg-green-500 hover:bg-green-600">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Open in Google Docs
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Buying Signals */}
                      <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center gap-2">
                            <Target className="w-5 h-5 text-purple-400" />
                            Buying Signals Detected
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {results.buyingSignals.map((signal, index) => {
                            const IconComponent = signalTypeIcons[signal.type]
                            return (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="p-3 rounded-lg bg-white/5 border border-white/10"
                              >
                                <div className="flex items-start gap-3">
                                  <IconComponent className="w-4 h-4 mt-1 text-purple-400" />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge className={`text-xs ${signalTypeColors[signal.type]}`}>
                                        {signal.type.replace('_', ' ')}
                                      </Badge>
                                      <span className="text-xs text-slate-400">
                                        {Math.round(signal.confidence * 100)}% confidence
                                      </span>
                                    </div>
                                    <p className="text-sm text-slate-300">"{signal.text}"</p>
                                  </div>
                                </div>
                              </motion.div>
                            )
                          })}
                        </CardContent>
                      </Card>

                      {/* Research Insights */}
                      <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-cyan-400" />
                            Research Insights
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {results.researchInsights.map((insight, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="p-3 rounded-lg bg-white/5 border border-white/10"
                            >
                              <p className="text-sm text-slate-300">{insight}</p>
                            </motion.div>
                          ))}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Proposal Sections */}
                    <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <FileText className="w-5 h-5 text-pink-400" />
                          Generated Proposal Sections
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {results.proposalSections.map((section, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                            >
                              <h3 className="text-white font-semibold mb-2">{section.title}</h3>
                              <p className="text-slate-400 text-sm">{section.wordCount} words</p>
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}

export default App
