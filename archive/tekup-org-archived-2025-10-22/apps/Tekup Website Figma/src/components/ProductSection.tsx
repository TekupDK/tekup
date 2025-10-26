'use client';

import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Users, 
  BarChart3, 
  Brain, 
  Target, 
  Zap, 
  Shield, 
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Filter,
  Mail,
  Phone,
  Calendar,
  Workflow
} from 'lucide-react';

export function ProductSection() {
  const products = [
    {
      id: 'crm',
      title: 'CRM',
      subtitle: 'Komplet kundestyring',
      status: 'Færdig implementeret',
      icon: Users,
      color: 'from-green-500 to-emerald-600',
      features: [
        'Centraliseret kundedatabase',
        '360° kunde visning',
        'Automatiseret kommunikation',
        'Salgs pipeline management',
        'Rapporter og analytics'
      ]
    },
    {
      id: 'leads',
      title: 'Lead Platform',
      subtitle: 'AI-drevet lead scoring',
      status: 'Prioriteret fokus',
      icon: BarChart3,
      color: 'from-[var(--color-tekup-primary)] to-[var(--color-tekup-accent)]',
      features: [
        'Intelligent lead scoring (ML)',
        'Automatiseret kvalificering',
        'Smart fordeling til teams',
        'Real-time konverteringsanalyse',
        'Predictive lead analytics'
      ]
    },
    {
      id: 'ai',
      title: 'Jarvis AI',
      subtitle: 'AgentScope integration',
      status: 'Mock/Real/Off modes',
      icon: Brain,
      color: 'from-purple-500 to-indigo-600',
      features: [
        'Intelligent chat support',
        'Automatiseret ticket routing',
        'Predictive problem solving',
        'Multi-language support',
        'Continuous learning'
      ]
    }
  ];

  const leadPlatformFeatures = [
    {
      title: 'Intelligent Scoring',
      description: 'ML-algoritmer evaluerer leads baseret på 50+ datapunkter',
      icon: Target,
      stats: '95% præcision'
    },
    {
      title: 'Automatisk Kvalificering',
      description: 'AI-drevet BANT kvalificering sparer 40% tid på lead processing',
      icon: CheckCircle,
      stats: '40% hurtigere'
    },
    {
      title: 'Smart Distribution',
      description: 'Intelligente algoritmer matcher leads med bedste sælger',
      icon: Workflow,
      stats: '67% højere close rate'
    },
    {
      title: 'Konverteringsanalyse',
      description: 'Real-time insights om lead kvalitet og konvertering',
      icon: TrendingUp,
      stats: '89% konvertering'
    }
  ];

  return (
    <section id="products" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-tekup-surface)] to-background -z-10 pointer-events-none" />
      
      {/* Floating shapes */}
      <motion.div 
        className="absolute top-40 right-20 w-32 h-32 bg-gradient-to-br from-[var(--color-tekup-accent)] to-[var(--color-tekup-primary)] rounded-full opacity-5 blur-xl"
        animate={{ 
          rotate: [0, 360],
          scale: [1, 1.2, 1]
        }}
        transition={{ 
          duration: 15,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center space-y-4 mb-16"
        >
          <Badge className="glass border-[var(--color-tekup-glass-border)]">
            Moduler & Integration
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold">
            <span className="bg-gradient-to-r from-[var(--color-tekup-primary)] to-[var(--color-tekup-accent)] bg-clip-text text-transparent">
              Tre kraftfulde moduler
            </span>
            <br />
            i ét sammenhængende system
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Tekup kombinerer færdigbygget CRM, prioriteret Lead Platform og intelligent Jarvis AI 
            i en sikker multi-tenant arkitektur.
          </p>
        </motion.div>

        {/* Product Navigation - Premium Design */}
        <Tabs defaultValue="leads" className="w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="relative max-w-5xl mx-auto mb-12">
              {/* Background container with enhanced glass effect */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900/95 to-gray-800/95 border border-white/10 backdrop-blur-xl">
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 to-gray-800/80" />
                
                <div className="relative p-4">
                  <TabsList className="grid w-full grid-cols-3 bg-transparent p-0 h-auto gap-4">
                    {products.map((product, index) => (
                      <TabsTrigger 
                        key={product.id}
                        value={product.id}
                        className="relative flex-1 p-3 rounded-xl text-white/70 data-[state=active]:text-white data-[state=active]:bg-white/10 transition-all duration-300 hover:text-white/90 hover:bg-white/5 group min-h-[80px]"
                      >
                        <motion.div 
                          className="flex flex-col items-center text-center space-y-2"
                          whileHover={{ scale: 1.02 }}
                          transition={{ duration: 0.2 }}
                        >
                          {/* Icon container with gradient background */}
                          <div className="relative">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-white/20 to-white/10 group-data-[state=active]:from-cyan-500/30 group-data-[state=active]:to-blue-500/30 transition-all duration-300">
                              <product.icon className="w-5 h-5 group-data-[state=active]:text-cyan-400 transition-colors duration-300" />
                            </div>
                            {/* Subtle glow effect on active */}
                            <div className="absolute inset-0 rounded-lg bg-cyan-400/20 blur-lg opacity-0 group-data-[state=active]:opacity-100 transition-opacity duration-300" />
                          </div>
                          
                          <div className="text-center space-y-1">
                            <div className="font-semibold text-sm group-data-[state=active]:text-white transition-colors duration-300">
                              {product.title}
                            </div>
                            <div className="text-xs text-white/50 group-data-[state=active]:text-white/70 transition-colors duration-300 leading-tight">
                              {product.subtitle}
                            </div>
                          </div>
                          
                          {product.id === 'leads' && (
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.3, duration: 0.3 }}
                            >
                              <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs px-2 py-0.5 rounded-full shadow-lg">
                                Prioriteret
                              </Badge>
                            </motion.div>
                          )}
                        </motion.div>
                        
                        {/* Active state indicator */}
                        <motion.div
                          className="absolute bottom-2 left-1/2 transform -translate-x-1/2 h-1 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full"
                          initial={{ width: 0, opacity: 0 }}
                          animate={{ 
                            width: product.id === 'leads' ? '60%' : '0%',
                            opacity: product.id === 'leads' ? 1 : 0
                          }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                        />
                        
                        {/* Hover effect */}
                        <motion.div
                          className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          layoutId={`hover-${product.id}`}
                        />
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
              </div>
              
              {/* Enhanced background glow effect */}
              <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-tekup-primary)]/30 to-[var(--color-tekup-accent)]/30 blur-2xl rounded-2xl" />
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 blur-xl rounded-2xl" />
              </div>
            </div>
          </motion.div>

          {/* CRM Content */}
          <TabsContent value="crm" className="mt-0">
            <motion.div
              id="crm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="grid lg:grid-cols-2 gap-12 items-center"
            >
              <div className="space-y-6">
                <div className="space-y-4">
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    ✅ Fuldt implementeret
                  </Badge>
                  <h3 className="text-2xl font-bold">Komplet CRM løsning</h3>
                  <p className="text-muted-foreground">
                    Vores CRM modul er færdigudviklet og klar til brug. Centralisér alle 
                    kundeinformationer og automatisér salgsprocesser.
                  </p>
                </div>
                
                <div className="space-y-3">
                  {products[0].features.map((feature, index) => (
                    <motion.div
                      key={feature}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.4 }}
                      className="flex items-center space-x-3"
                    >
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>{feature}</span>
                    </motion.div>
                  ))}
                </div>
                
                <Button variant="outline" className="glass border-[var(--color-tekup-glass-border)]">
                  Se CRM demo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
              
              <div className="glass rounded-2xl p-6 hover-lift smooth-3d">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">CRM Dashboard</h4>
                    <Badge className="bg-green-500 text-white">Live</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-white/10 rounded-lg">
                      <div className="text-2xl font-bold text-green-500">1,247</div>
                      <div className="text-sm text-muted-foreground">Aktive kunder</div>
                    </div>
                    <div className="text-center p-4 bg-white/10 rounded-lg">
                      <div className="text-2xl font-bold text-blue-500">€2.3M</div>
                      <div className="text-sm text-muted-foreground">Pipeline værdi</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* Lead Platform Content (Priority) */}
          <TabsContent value="leads" className="mt-0">
            <motion.div
              id="leads"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-12"
            >
              {/* Header */}
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <Badge className="bg-gradient-to-r from-[var(--color-tekup-primary)] to-[var(--color-tekup-accent)] text-white">
                      🎯 Prioriteret udvikling
                    </Badge>
                    <h3 className="text-2xl font-bold">AI-drevet Lead Platform</h3>
                    <p className="text-muted-foreground">
                      Vores Lead Platform bruger machine learning til at score, kvalificere og 
                      distribuere leads med 89% konverteringsrate.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {products[1].features.map((feature, index) => (
                      <motion.div
                        key={feature}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.4 }}
                        className="flex items-center space-x-3"
                      >
                        <Zap className="w-5 h-5 text-[var(--color-tekup-accent)]" />
                        <span>{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                  
                  <Button className="bg-gradient-to-r from-[var(--color-tekup-primary)] to-[var(--color-tekup-accent)] text-white">
                    Se Lead Platform demo
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
                
                <div className="glass rounded-2xl p-6 hover-lift smooth-3d">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Lead Scoring Dashboard</h4>
                      <Badge className="bg-[var(--color-tekup-accent)] text-white">AI Active</Badge>
                    </div>
                    
                    {/* Lead scoring visualization */}
                    <div className="space-y-3">
                      {[
                        { company: 'TechStart ApS', score: 95, trend: '+12' },
                        { company: 'Digital Solutions', score: 87, trend: '+8' },
                        { company: 'Innovation Hub', score: 76, trend: '+15' },
                        { company: 'Cloud Systems', score: 64, trend: '+5' }
                      ].map((lead, index) => (
                        <motion.div
                          key={lead.company}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1, duration: 0.4 }}
                          className="flex items-center justify-between p-3 bg-white/10 rounded-lg"
                        >
                          <span className="text-sm font-medium">{lead.company}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-green-400">{lead.trend}</span>
                            <div className="w-16 h-2 bg-gray-300 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-[var(--color-tekup-primary)] to-[var(--color-tekup-accent)]"
                                initial={{ width: 0 }}
                                animate={{ width: `${lead.score}%` }}
                                transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                              />
                            </div>
                            <span className="text-sm font-bold">{lead.score}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Lead Platform Features Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {leadPlatformFeatures.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.6 }}
                    viewport={{ once: true }}
                  >
                    <Card className="glass border-[var(--color-tekup-glass-border)] hover-lift smooth-3d h-full">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <feature.icon className="w-8 h-8 text-[var(--color-tekup-accent)]" />
                            <Badge className="bg-[var(--color-tekup-accent)]/20 text-[var(--color-tekup-accent)]">
                              {feature.stats}
                            </Badge>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">{feature.title}</h4>
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          {/* Jarvis AI Content */}
          <TabsContent value="ai" className="mt-0">
            <motion.div
              id="ai"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="grid lg:grid-cols-2 gap-12 items-center"
            >
              <div className="space-y-6">
                <div className="space-y-4">
                  <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    🤖 Mock/Real/Off modes
                  </Badge>
                  <h3 className="text-2xl font-bold">Jarvis AI Assistant</h3>
                  <p className="text-muted-foreground">
                    AgentScope-integreret AI som kan køre i mock mode til test, 
                    real mode til produktion, eller slås helt fra.
                  </p>
                </div>
                
                <div className="space-y-3">
                  {products[2].features.map((feature, index) => (
                    <motion.div
                      key={feature}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.4 }}
                      className="flex items-center space-x-3"
                    >
                      <Brain className="w-5 h-5 text-purple-500" />
                      <span>{feature}</span>
                    </motion.div>
                  ))}
                </div>
                
                <Button variant="outline" className="glass border-[var(--color-tekup-glass-border)]">
                  Test Jarvis AI
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
              
              <div className="glass rounded-2xl p-6 hover-lift smooth-3d">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">AI Status</h4>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-sm text-green-400">Real Mode</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Tickets løst automatisk:</span>
                      <span className="font-medium">847 (65%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gennemsnitlig responstid:</span>
                      <span className="font-medium">1.2 sek</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tilfredshedsscore:</span>
                      <span className="font-medium">4.8/5</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-white/10 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Seneste automatiske løsning:</div>
                    <div className="text-sm">"VPN forbindelsesproblemer løst via automatisk konfiguration"</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}