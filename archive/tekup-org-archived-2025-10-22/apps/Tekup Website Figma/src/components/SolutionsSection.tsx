'use client';

import { motion } from 'motion/react';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { 
  Building2, 
  Zap, 
  Users, 
  Shield, 
  TrendingUp, 
  ArrowRight,
  CheckCircle,
  Globe,
  Brain,
  Database,
  Workflow,
  Clock
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function SolutionsSection() {
  const solutions = [
    {
      icon: Building2,
      category: 'SMB IT Support',
      title: 'Komplet IT-support automation',
      description: 'Alt-i-en løsning for små og mellemstore virksomheder der vil automatisere IT-support og øge effektiviteten.',
      image: 'https://images.unsplash.com/photo-1579389248774-07907f421a6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjB0ZWFtJTIwY29sbGFib3JhdGlvbnxlbnwxfHx8fDE3NTc2NzAyNzV8MA&ixlib=rb-4.1.0&q=80&w=1080',
      benefits: [
        'Reducer support tid med 65%',
        'Automatiser 80% af routine tickets',
        'Centraliser alle IT-processer',
        'Skalér uden at ansætte flere'
      ],
      industries: ['Tech Startups', 'Konsulentvirksomheder', 'E-commerce', 'SaaS'],
      cta: 'Se SMB løsning',
      gradient: 'from-blue-600 to-cyan-500'
    },
    {
      icon: TrendingUp,
      category: 'Lead Management',
      title: 'AI-drevet lead optimering',
      description: 'Transformer din salgsproces med intelligent lead scoring, automatisk kvalificering og predictive analytics.',
      image: 'https://images.unsplash.com/photo-1748609160056-7b95f30041f0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXNoYm9hcmQlMjBhbmFseXRpY3MlMjBkYXRhfGVufDF8fHx8MTc1Nzc4NDUxOXww&ixlib=rb-4.1.0&q=80&w=1080',
      benefits: [
        'Øg konvertering med 89%',
        'AI scoring på 50+ parametre',
        'Automatisk lead distribution',
        'Real-time performance insights'
      ],
      industries: ['Sales Teams', 'Marketing Agencies', 'B2B SaaS', 'Consultancy'],
      cta: 'Optimer dine leads',
      gradient: 'from-emerald-600 to-teal-500'
    },
    {
      icon: Brain,
      category: 'AI Automation',
      title: 'Jarvis AI AssistentScope',
      description: 'Intelligent AI-assistent der automatiserer support, lærer af interaktioner og tilpasser sig din virksomhed.',
      image: 'https://images.unsplash.com/photo-1655393001768-d946c97d6fd1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBSSUyMHRlY2hub2xvZ3klMjBmdXR1cmlzdGljfGVufDF8fHx8MTc1Nzc4NDUyNnww&ixlib=rb-4.1.0&q=80&w=1080',
      benefits: [
        '24/7 automatisk support',
        'Multi-language capabilities',
        'Kontinuerlig læring og forbedring',
        'Mock/Real/Off deployment modes'
      ],
      industries: ['Support Teams', 'Customer Success', 'IT Helpdesk', 'Service'],
      cta: 'Test Jarvis AI',
      gradient: 'from-purple-600 to-indigo-500'
    }
  ];

  const useCases = [
    {
      icon: Zap,
      title: 'Startup Skalering',
      description: 'Fra 10 til 100 medarbejdere uden at miste IT-kontrol',
      stats: '4x hurtigere skalering'
    },
    {
      icon: Shield,
      title: 'Enterprise Sikkerhed',
      description: 'Bank-niveau sikkerhed i SMB-venlig indpakning',
      stats: '99.9% uptime SLA'
    },
    {
      icon: Globe,
      title: 'Multi-region Support',
      description: 'Global IT-support fra lokale datacentre',
      stats: '3 EU datacentre'
    },
    {
      icon: Clock,
      title: 'Real-time Monitoring',
      description: 'Proaktiv overvågning og fejlfinding',
      stats: '<2 min responstid'
    }
  ];

  return (
    <section id="solutions" className="py-24 relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Dark background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-tekup-primary)_0%,_transparent_50%)] opacity-10" />
      
      {/* Enhanced animated background */}
      <motion.div 
        className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-full opacity-40 blur-3xl"
        animate={{ 
          scale: [1, 1.3, 1],
          rotate: [0, -180, -360]
        }}
        transition={{ 
          duration: 35,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      <motion.div 
        className="absolute top-40 right-20 w-72 h-72 bg-gradient-to-br from-purple-500/20 to-indigo-600/20 rounded-full opacity-30 blur-3xl"
        animate={{ 
          scale: [1.3, 1, 1.3],
          rotate: [360, 180, 0]
        }}
        transition={{ 
          duration: 30,
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
          className="text-center space-y-6 mb-16"
        >
          <Badge className="bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-400/30 text-purple-300 backdrop-blur-sm px-4 py-2">
            <Workflow className="w-4 h-4 mr-2" />
            Løsninger & Use Cases
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-white">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Skræddersyet løsninger
            </span>
            <br />
            til din virksomheds behov
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Uanset om du er en tech startup der skal skalere, en etableret SMB der vil automatisere, 
            eller et team der søger AI-drevet effektivisering - Tekup har løsningen.
          </p>
        </motion.div>

        {/* Main Solutions */}
        <div className="space-y-16 mb-24">
          {solutions.map((solution, index) => (
            <motion.div
              key={solution.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className={`grid lg:grid-cols-2 gap-12 items-center ${
                index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''
              }`}>
                {/* Content */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${solution.gradient} flex items-center justify-center shadow-lg`}>
                        <solution.icon className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <Badge className={`mb-2 bg-gradient-to-r ${solution.gradient}/20 border border-current/20 text-white backdrop-blur-sm`}>
                          {solution.category}
                        </Badge>
                        <h3 className="text-2xl font-bold text-white">{solution.title}</h3>
                      </div>
                    </div>
                    
                    <p className="text-lg text-gray-300 leading-relaxed">{solution.description}</p>
                  </div>

                  {/* Benefits */}
                  <div className="space-y-3">
                    {solution.benefits.map((benefit) => (
                      <motion.div
                        key={benefit}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4 }}
                        viewport={{ once: true }}
                        className="flex items-center space-x-3"
                      >
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                        <span className="text-gray-200">{benefit}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Industries */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-400">Populære brancher:</div>
                    <div className="flex flex-wrap gap-2">
                      {solution.industries.map((industry) => (
                        <Badge key={industry} variant="outline" className="bg-white/10 border-white/20 text-gray-300 backdrop-blur-sm hover:bg-white/20 transition-colors">
                          {industry}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      size="lg"
                      className={`bg-gradient-to-r ${solution.gradient} text-white border-0 shadow-lg hover:shadow-xl transition-all px-6 py-3 rounded-xl`}
                    >
                      {solution.cta}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </motion.div>
                </div>

                {/* Image */}
                <motion.div 
                  className={`${index % 2 === 1 ? 'lg:col-start-1' : ''}`}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10 hover-lift smooth-3d overflow-hidden shadow-2xl">
                    <CardContent className="p-0">
                      <ImageWithFallback
                        src={solution.image}
                        alt={solution.title}
                        className="w-full h-64 lg:h-80 object-cover"
                      />
                      <div className="p-6">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-300">Live Demo Tilgængelig</span>
                          <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse" />
                            Active
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Use Cases Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="space-y-12"
        >
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold text-white">Populære Use Cases</h3>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Se hvordan forskellige virksomhedstyper bruger Tekup til at løse specifikke udfordringer
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase, index) => (
              <motion.div
                key={useCase.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-white/10 hover-lift smooth-3d h-full shadow-lg">
                  <CardContent className="p-6 text-center">
                    <useCase.icon className="w-12 h-12 mx-auto mb-4 text-cyan-400" />
                    <h4 className="font-semibold mb-2 text-white">{useCase.title}</h4>
                    <p className="text-sm text-gray-300 mb-4">{useCase.description}</p>
                    <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-400/30">
                      {useCase.stats}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Integration showcase */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-24"
        >
          <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl">
            <CardHeader className="text-center pb-6">
              <h3 className="text-2xl font-bold mb-2 text-white">Seamless Integration Ecosystem</h3>
              <p className="text-gray-300">
                Tekup integrerer med 50+ værktøjer du allerede bruger
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
                <div className="p-8 text-center">
                  <Database className="w-8 h-8 mx-auto mb-4 text-blue-400" />
                  <h4 className="font-semibold mb-2 text-white">CRM & Sales</h4>
                  <p className="text-sm text-gray-300 mb-3">Salesforce, HubSpot, Pipedrive</p>
                  <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-400/30">20+ integrationer</Badge>
                </div>
                <div className="p-8 text-center">
                  <Users className="w-8 h-8 mx-auto mb-4 text-emerald-400" />
                  <h4 className="font-semibold mb-2 text-white">Communication</h4>
                  <p className="text-sm text-gray-300 mb-3">Slack, Teams, Discord</p>
                  <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-400/30">15+ integrationer</Badge>
                </div>
                <div className="p-8 text-center">
                  <Workflow className="w-8 h-8 mx-auto mb-4 text-purple-400" />
                  <h4 className="font-semibold mb-2 text-white">Productivity</h4>
                  <p className="text-sm text-gray-300 mb-3">Notion, Asana, Trello</p>
                  <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-400/30">15+ integrationer</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}