'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { 
  Search, 
  FileText, 
  Code, 
  Database,
  Zap,
  Users,
  Brain,
  BarChart3,
  Settings,
  Shield,
  Globe,
  BookOpen,
  Download,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Copy,
  CheckCircle,
  AlertTriangle,
  Info,
  PlayCircle,
  Terminal,
  Smartphone,
  Webhook,
  Key,
  Lock,
  Monitor,
  Layers
} from 'lucide-react';

export function DocsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState('getting-started');
  const [expandedSections, setExpandedSections] = useState<string[]>(['getting-started']);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const documentation = [
    {
      id: 'getting-started',
      title: 'Kom i gang',
      icon: PlayCircle,
      sections: [
        { id: 'quick-start', title: 'Hurtig start guide', description: 'Få Tekup op at køre på 5 minutter' },
        { id: 'installation', title: 'Installation', description: 'Detaljeret installation guide' },
        { id: 'first-steps', title: 'Første skridt', description: 'Grundlæggende setup og konfiguration' },
        { id: 'demo-data', title: 'Demo data', description: 'Import demo data til test' }
      ]
    },
    {
      id: 'crm',
      title: 'CRM Platform',
      icon: Users,
      sections: [
        { id: 'contacts', title: 'Kontaktstyring', description: 'Administrer kunder og leads' },
        { id: 'deals', title: 'Deal pipeline', description: 'Sales pipeline management' },
        { id: 'activities', title: 'Aktiviteter', description: 'Spor kommunikation og møder' },
        { id: 'reporting', title: 'Rapportering', description: 'Sales analytics og reports' }
      ]
    },
    {
      id: 'leads',
      title: 'Lead Platform',
      icon: BarChart3,
      sections: [
        { id: 'lead-capture', title: 'Lead capture', description: 'Automatisk lead indsamling' },
        { id: 'scoring', title: 'Lead scoring', description: 'AI-drevet lead kvalificering' },
        { id: 'distribution', title: 'Lead distribution', description: 'Automatisk tildeling af leads' },
        { id: 'nurturing', title: 'Lead nurturing', description: 'Automatiseret lead opdyrkning' }
      ]
    },
    {
      id: 'ai',
      title: 'Jarvis AI',
      icon: Brain,
      sections: [
        { id: 'ai-setup', title: 'AI Setup', description: 'Konfigurer AI assistenten' },
        { id: 'automation', title: 'Automatisering', description: 'Workflow automation med AI' },
        { id: 'training', title: 'AI Training', description: 'Træn AI på din data' },
        { id: 'ai-api', title: 'AI API', description: 'Integrer AI i dine systemer' }
      ]
    },
    {
      id: 'api',
      title: 'API Reference',
      icon: Code,
      sections: [
        { id: 'authentication', title: 'Authentication', description: 'API nøgler og sikkerhed' },
        { id: 'endpoints', title: 'Endpoints', description: 'Alle tilgængelige API endpoints' },
        { id: 'webhooks', title: 'Webhooks', description: 'Real-time event notifications' },
        { id: 'sdks', title: 'SDKs', description: 'Officielle SDKs og libraries' }
      ]
    },
    {
      id: 'integrations',
      title: 'Integrationer',
      icon: Globe,
      sections: [
        { id: 'slack', title: 'Slack', description: 'Slack workspace integration' },
        { id: 'salesforce', title: 'Salesforce', description: 'Salesforce CRM sync' },
        { id: 'hubspot', title: 'HubSpot', description: 'HubSpot marketing automation' },
        { id: 'zapier', title: 'Zapier', description: '1000+ app connections' }
      ]
    },
    {
      id: 'security',
      title: 'Sikkerhed & Compliance',
      icon: Shield,
      sections: [
        { id: 'gdpr', title: 'GDPR Compliance', description: 'Databeskyttelse og GDPR' },
        { id: 'security', title: 'Sikkerhed', description: 'Platform sikkerhedsfunktioner' },
        { id: 'backups', title: 'Backup & Recovery', description: 'Data backup procedurer' },
        { id: 'audit', title: 'Audit logs', description: 'System audit og logging' }
      ]
    }
  ];

  const quickLinks = [
    { title: 'API Dokumentation', href: '#api', icon: Code },
    { title: 'Webhook Guide', href: '#webhooks', icon: Webhook },
    { title: 'SDK Downloads', href: '#sdks', icon: Download },
    { title: 'Postman Collection', href: '#postman', icon: Terminal }
  ];

  const popularGuides = [
    { title: 'Opsæt din første automation', views: '24.5k', category: 'Automation' },
    { title: 'Lead scoring best practices', views: '18.2k', category: 'Lead Management' },
    { title: 'GDPR og AI compliance', views: '15.8k', category: 'Compliance' },
    { title: 'Webhook implementation', views: '12.4k', category: 'Development' },
    { title: 'Salesforce integration setup', views: '9.7k', category: 'Integrations' }
  ];

  const codeExample = `// Opret et nyt lead via API
const response = await fetch('https://api.tekup.dk/v1/leads', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'john@company.com',
    name: 'John Doe',
    company: 'ACME Corp',
    source: 'website',
    score: 85
  })
});

const lead = await response.json();
console.log('Lead created:', lead.id);`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-tekup-primary)_0%,_transparent_50%)] opacity-10" />
      
      {/* Floating orbs */}
      <motion.div 
        className="absolute top-40 left-20 w-96 h-96 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-full opacity-40 blur-3xl"
        animate={{ 
          scale: [1, 1.3, 1],
          rotate: [0, 180, 360]
        }}
        transition={{ 
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <section className="pt-32 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center space-y-6"
            >
              <Badge className="bg-gradient-to-r from-green-500/20 to-cyan-500/20 border border-green-400/30 text-green-300 backdrop-blur-sm px-6 py-3">
                <FileText className="w-4 h-4 mr-2" />
                Developer Documentation
              </Badge>
              
              <h1 className="text-4xl md:text-6xl font-bold text-white">
                Byg med
                <br />
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  Tekup Platform
                </span>
              </h1>
              
              <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Komplet dokumentation, guides og API reference til at integrere og udvide 
                Tekup platformen. Fra hurtig start til avancerede implementeringer.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Search */}
        <section className="pb-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Søg i dokumentation, guides og API reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-4 bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:ring-cyan-500 focus:border-cyan-500 backdrop-blur-sm rounded-xl text-lg"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {quickLinks.map((link, index) => (
                <motion.div
                  key={link.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                >
                  <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-white/10 hover-lift smooth-3d cursor-pointer group">
                    <CardContent className="p-6 text-center">
                      <link.icon className="w-8 h-8 mx-auto mb-3 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                      <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                        {link.title}
                      </h3>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Main Content */}
        <section className="pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-4 gap-8">
              {/* Sidebar Navigation */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="lg:col-span-1"
              >
                <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10 sticky top-24">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <BookOpen className="w-5 h-5 mr-2" />
                      Dokumentation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-2">
                      {documentation.map((section) => (
                        <div key={section.id}>
                          <button
                            onClick={() => {
                              setActiveSection(section.id);
                              toggleSection(section.id);
                            }}
                            className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                              activeSection === section.id 
                                ? 'bg-cyan-500/20 text-cyan-400' 
                                : 'text-gray-300 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center">
                              <section.icon className="w-4 h-4 mr-3" />
                              <span className="font-medium">{section.title}</span>
                            </div>
                            {expandedSections.includes(section.id) ? 
                              <ChevronDown className="w-4 h-4" /> : 
                              <ChevronRight className="w-4 h-4" />
                            }
                          </button>
                          
                          {expandedSections.includes(section.id) && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="ml-7 pl-3 border-l border-white/10 space-y-1"
                            >
                              {section.sections.map((subsection) => (
                                <button
                                  key={subsection.id}
                                  className="block w-full text-left p-2 rounded text-sm text-gray-400 hover:text-cyan-400 hover:bg-white/5 transition-colors"
                                >
                                  {subsection.title}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Main Content Area */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="lg:col-span-2 space-y-8"
              >
                {/* Getting Started Content */}
                {activeSection === 'getting-started' && (
                  <div className="space-y-8">
                    <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center">
                          <PlayCircle className="w-5 h-5 mr-2 text-cyan-400" />
                          Hurtig Start Guide
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <p className="text-gray-300 leading-relaxed">
                          Få Tekup platformen op at køre på under 5 minutter. Denne guide dækker 
                          installation, grundlæggende konfiguration og dine første API kald.
                        </p>

                        <div className="space-y-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                            <div>
                              <h4 className="font-semibold text-white">Opret din konto</h4>
                              <p className="text-gray-300 text-sm">Tilmeld dig og få adgang til din dashboard</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                            <div>
                              <h4 className="font-semibold text-white">Generer API nøgle</h4>
                              <p className="text-gray-300 text-sm">Opret en sikker API nøgle til dine applikationer</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                            <div>
                              <h4 className="font-semibold text-white">Lav dit første API kald</h4>
                              <p className="text-gray-300 text-sm">Test forbindelsen med et simpelt API kald</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
                            <div>
                              <div className="font-medium text-emerald-300 mb-1">Pro tip</div>
                              <div className="text-emerald-100 text-sm">
                                Brug vores Postman collection til at teste API endpoints hurtigt
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center justify-between">
                          <div className="flex items-center">
                            <Code className="w-5 h-5 mr-2 text-cyan-400" />
                            Eksempel: Opret Lead
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-white"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="bg-gray-900/50 rounded-lg p-4 overflow-x-auto">
                          <code className="text-sm text-gray-300">{codeExample}</code>
                        </pre>
                        
                        <div className="mt-4 flex items-center space-x-3">
                          <Badge className="bg-blue-500/20 text-blue-300 border border-blue-400/30">
                            JavaScript
                          </Badge>
                          <Badge className="bg-green-500/20 text-green-300 border border-green-400/30">
                            Node.js
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center">
                          <Database className="w-5 h-5 mr-2 text-cyan-400" />
                          API Endpoints Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {[
                            { method: 'GET', endpoint: '/v1/leads', description: 'Hent alle leads' },
                            { method: 'POST', endpoint: '/v1/leads', description: 'Opret nyt lead' },
                            { method: 'PUT', endpoint: '/v1/leads/{id}', description: 'Opdater lead' },
                            { method: 'DELETE', endpoint: '/v1/leads/{id}', description: 'Slet lead' }
                          ].map((endpoint) => (
                            <div key={endpoint.endpoint} className="flex items-center justify-between p-3 bg-gray-900/30 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <Badge className={`${
                                  endpoint.method === 'GET' ? 'bg-green-500/20 text-green-300 border-green-400/30' :
                                  endpoint.method === 'POST' ? 'bg-blue-500/20 text-blue-300 border-blue-400/30' :
                                  endpoint.method === 'PUT' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30' :
                                  'bg-red-500/20 text-red-300 border-red-400/30'
                                } border font-mono text-xs`}>
                                  {endpoint.method}
                                </Badge>
                                <code className="text-gray-300 font-mono">{endpoint.endpoint}</code>
                              </div>
                              <span className="text-gray-400 text-sm">{endpoint.description}</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-6">
                          <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
                            Se komplet API reference
                            <ExternalLink className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Other sections content would go here */}
                {activeSection !== 'getting-started' && (
                  <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10">
                    <CardContent className="p-12 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-xl flex items-center justify-center">
                        <FileText className="w-8 h-8 text-cyan-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {documentation.find(doc => doc.id === activeSection)?.title} Dokumentation
                      </h3>
                      <p className="text-gray-400 mb-6">
                        Detaljeret dokumentation for dette område kommer snart. 
                        Besøg vores API reference for tekniske detaljer.
                      </p>
                      <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
                        Se API Reference
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </motion.div>

              {/* Right Sidebar */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="lg:col-span-1 space-y-6"
              >
                {/* Popular Guides */}
                <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Populære Guides
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {popularGuides.map((guide, index) => (
                      <div key={guide.title} className="p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group">
                        <h4 className="font-medium text-white group-hover:text-cyan-400 transition-colors text-sm leading-tight mb-1">
                          {guide.title}
                        </h4>
                        <div className="flex items-center justify-between text-xs">
                          <Badge variant="outline" className="bg-white/5 border-white/20 text-gray-400">
                            {guide.category}
                          </Badge>
                          <span className="text-gray-500">{guide.views} views</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Status */}
                <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Monitor className="w-5 h-5 mr-2" />
                      Platform Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">API</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-green-400 text-sm">Operationel</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Database</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-green-400 text-sm">Operationel</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">AI Services</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-green-400 text-sm">Operationel</span>
                      </div>
                    </div>
                    
                    <Separator className="bg-white/10" />
                    
                    <div className="text-center">
                      <div className="text-sm text-gray-400 mb-2">99.9% uptime</div>
                      <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs">
                        Se status page
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Support */}
                <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Info className="w-5 h-5 mr-2" />
                      Brug for hjælp?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-gray-300 text-sm">
                      Kan du ikke finde det du leder efter? Vores support team hjælper gerne.
                    </p>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20">
                        Kontakt support
                      </Button>
                      <Button variant="outline" size="sm" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20">
                        Community forum
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}