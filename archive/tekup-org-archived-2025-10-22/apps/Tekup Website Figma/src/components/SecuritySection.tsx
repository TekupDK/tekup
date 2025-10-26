'use client';

import { motion } from 'motion/react';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { 
  Shield, 
  Lock, 
  Server, 
  Users, 
  Eye, 
  Key, 
  Globe, 
  Award,
  CheckCircle,
  Zap,
  Database,
  Cloud
} from 'lucide-react';

export function SecuritySection() {
  const securityFeatures = [
    {
      icon: Shield,
      title: 'Multi-Tenant Isolation',
      description: 'Hver kunde får sin egen isolerede tenant med krypteret database og netværkssegmentering.',
      details: ['Container-baseret isolation', 'Separate databaser per tenant', 'Netværkssegmentering', 'Zero-trust arkitektur']
    },
    {
      icon: Lock,
      title: 'End-to-End Kryptering',
      description: 'AES-256 kryptering af data i transit og at rest med regelmæssig key rotation.',
      details: ['AES-256 encryption', 'TLS 1.3 protokol', 'Key rotation hver 90 dag', 'Hardware Security Modules']
    },
    {
      icon: Eye,
      title: 'RBAC Adgangskontrol',
      description: 'Granulær rolle-baseret adgangskontrol med least-privilege principper.',
      details: ['Granulære roller', 'Permission inheritance', 'Session management', 'Multi-factor authentication']
    },
    {
      icon: Server,
      title: 'Infrastructure Security',
      description: 'Sikker cloud infrastruktur med automatisk patching og monitoring.',
      details: ['Auto-patching', '24/7 monitoring', 'DDoS beskyttelse', 'Intrusion detection']
    }
  ];

  const compliance = [
    {
      icon: Award,
      title: 'SOC 2 Type II',
      description: 'Certificeret for sikkerhed, tilgængelighed og fortrolighed',
      status: 'Certificeret'
    },
    {
      icon: Globe,
      title: 'GDPR Compliant',
      description: 'Fuld overholdelse af EU databeskyttelsesforordningen',
      status: 'Overholdt'
    },
    {
      icon: Shield,
      title: 'ISO 27001',
      description: 'International standard for informationssikkerhedsstyring',
      status: 'I proces'
    },
    {
      icon: CheckCircle,
      title: 'Penetration Testing',
      description: 'Kvartalsvise sikkerhedstest af externe eksperter',
      status: 'Sidste: Q4 2024'
    }
  ];

  const techStack = [
    { name: 'Next.js 14/15', description: 'Modern React framework med App Router' },
    { name: 'React 18', description: 'Concurrent features og optimeret performance' },
    { name: 'Tailwind CSS 4.1', description: 'Utility-first styling med custom design tokens' },
    { name: 'pnpm Monorepo', description: 'Effektiv pakkehåndtering og kodefaring' },
    { name: 'TypeScript', description: 'Type-safety og bedre developer experience' },
    { name: 'Supabase', description: 'Managed PostgreSQL med real-time features' }
  ];

  const performance = [
    { metric: 'Uptime SLA', value: '99.9%', description: 'Garanteret oppetid med penalites' },
    { metric: 'Response Time', value: '<200ms', description: 'P95 API response tid' },
    { metric: 'Data Centers', value: '3 EU', description: 'Multi-region deployment' },
    { metric: 'Backup Frequency', value: '4x dagligt', description: 'Automatiske backups med point-in-time recovery' }
  ];

  return (
    <section id="security" className="py-24 relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Dark background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-tekup-primary)_0%,_transparent_50%)] opacity-10" />
      
      {/* Animated background elements */}
      <motion.div 
        className="absolute top-32 right-20 w-48 h-48 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-full opacity-40 blur-2xl"
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
      
      <motion.div 
        className="absolute bottom-32 left-20 w-64 h-64 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-full opacity-30 blur-2xl"
        animate={{ 
          scale: [1.3, 1, 1.3],
          rotate: [360, 180, 0]
        }}
        transition={{ 
          duration: 20,
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
          <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 text-green-300 backdrop-blur-sm px-4 py-2">
            <Shield className="w-4 h-4 mr-2" />
            Sikkerhed & Tillid
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold">
            <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Enterprise-grade sikkerhed
            </span>
            <br />
            <span className="text-white">bygget for SMB'er</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Multi-tenant arkitektur med bank-niveau sikkerhed. Dine data er isoleret, 
            krypteret og beskyttet af internationale standarder.
          </p>
        </motion.div>

        {/* Security Features Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {securityFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10 hover-lift smooth-3d h-full shadow-2xl">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                    </div>
                    
                    <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                    
                    <div className="space-y-2">
                      {feature.details.map((detail) => (
                        <div key={detail} className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span className="text-sm text-gray-300">{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Compliance Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold mb-4 text-white">Compliance & Certificeringer</h3>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Vi overholder internationale standarder for sikkerhed og databeskyttelse
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {compliance.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                viewport={{ once: true }}
              >
                <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10 hover-scale smooth-3d text-center shadow-2xl">
                  <CardContent className="p-6">
                    <item.icon className="w-12 h-12 mx-auto mb-4 text-green-400" />
                    <h4 className="font-semibold mb-2 text-white">{item.title}</h4>
                    <p className="text-sm text-gray-300 mb-3">{item.description}</p>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {item.status}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tech Stack */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10 shadow-2xl">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-4 text-white">Moderne Tech Stack</h3>
                <p className="text-gray-300">
                  Bygget med de nyeste teknologier for performance og skalerbarhed
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {techStack.map((tech, index) => (
                  <motion.div
                    key={tech.name}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    viewport={{ once: true }}
                    className="flex items-start space-x-3 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mt-1 shadow-md">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{tech.name}</h4>
                      <p className="text-sm text-gray-300">{tech.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold mb-4 text-white">Performance & Tilgængelighed</h3>
            <p className="text-gray-300">
              Pålidelig infrastruktur med garanteret performance
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {performance.map((item, index) => (
              <motion.div
                key={item.metric}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                viewport={{ once: true }}
              >
                <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10 hover-lift smooth-3d text-center shadow-2xl">
                  <CardContent className="p-6">
                    <div className="text-3xl font-bold text-cyan-400 mb-2">
                      {item.value}
                    </div>
                    <h4 className="font-semibold mb-2 text-white">{item.metric}</h4>
                    <p className="text-sm text-gray-300">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-300">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <span>2.5TB+ data sikret dagligt</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>2,500+ virksomheder stoler på os</span>
              </div>
              <div className="flex items-center space-x-2">
                <Cloud className="w-4 h-4 text-blue-400" />
                <span>99.9% uptime siden 2023</span>
              </div>
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4 text-green-400" />
                <span>Zero sikkerhedsbrud</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}