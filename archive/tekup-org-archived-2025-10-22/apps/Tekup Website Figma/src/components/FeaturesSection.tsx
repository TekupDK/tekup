'use client';

import { motion } from 'motion/react';
import { 
  Brain, 
  Users, 
  BarChart3, 
  Zap, 
  Shield, 
  Phone, 
  Mail, 
  Calendar,
  MessageSquare,
  Target,
  TrendingUp,
  Clock,
  CheckCircle,
  Star,
  Globe,
  Lock
} from 'lucide-react';

const features = [
  {
    category: "AI & Automatisering",
    icon: Brain,
    color: "from-purple-500 to-indigo-600",
    items: [
      {
        icon: Target,
        title: "Jarvis AI Lead Scoring",
        description: "Avanceret AI analyserer 100+ datapunkter og giver hver lead en præcis score fra 0-100 baseret på konverteringssandsynlighed."
      },
      {
        icon: Zap,
        title: "Intelligent Automatisering",
        description: "Automatiser rutineopgaver som lead tildeling, follow-up emails, og pipeline opdateringer baseret på AI anbefalinger."
      },
      {
        icon: MessageSquare,
        title: "AI Chat Assistant",
        description: "24/7 AI assistant der kan svare på kunde spørgsmål, kvalificere leads og booke møder automatisk."
      }
    ]
  },
  {
    category: "CRM & Lead Management",
    icon: Users,
    color: "from-blue-500 to-cyan-600",
    items: [
      {
        icon: Users,
        title: "360° Kundeoverblik",
        description: "Komplet kundehistorik med alle interaktioner, dokumenter, noter og kommunikation samlet på ét sted."
      },
      {
        icon: TrendingUp,
        title: "Advanced Pipeline",
        description: "Visuelt pipeline management med drag-and-drop, automatiske stage overgange og predictive analytics."
      },
      {
        icon: Calendar,
        title: "Integrated Booking",
        description: "Indbygget kalendersystem med automatisk møde booking, påmindelser og video konference integration."
      }
    ]
  },
  {
    category: "Analytics & Insights",
    icon: BarChart3,
    color: "from-emerald-500 to-teal-600",
    items: [
      {
        icon: BarChart3,
        title: "Real-time Dashboard",
        description: "Live dashboard med KPI tracking, conversion rates, revenue forecasting og team performance metrics."
      },
      {
        icon: Target,
        title: "Predictive Analytics",
        description: "AI-drevne forudsigelser om lead konvertering, deal closure probability og revenue forecasting."
      },
      {
        icon: TrendingUp,
        title: "ROI Tracking",
        description: "Detaljeret tracking af marketing ROI, campaign performance og customer acquisition costs."
      }
    ]
  },
  {
    category: "Kommunikation & Support",
    icon: Phone,
    color: "from-orange-500 to-red-600",
    items: [
      {
        icon: Mail,
        title: "Email Integration",
        description: "Fuld Gmail og Outlook integration med email tracking, templates og automatiske follow-ups."
      },
      {
        icon: Phone,
        title: "VoIP & Call Tracking",
        description: "Indbygget telefonsystem med call recording, automatic logging og integration til CRM."
      },
      {
        icon: MessageSquare,
        title: "Multi-channel Support",
        description: "Unified inbox for emails, chat, social media og telefon - alt samlet i én platform."
      }
    ]
  },
  {
    category: "Sikkerhed & Compliance",
    icon: Shield,
    color: "from-gray-600 to-gray-800",
    items: [
      {
        icon: Shield,
        title: "Enterprise Security",
        description: "AES-256 kryptering, 2FA, IP whitelist og SOC 2 Type II compliance for maksimal datasikkerhed."
      },
      {
        icon: Lock,
        title: "GDPR Compliant",
        description: "Fuld GDPR compliance med data retention policies, right to be forgotten og audit trails."
      },
      {
        icon: Globe,
        title: "EU Data Centers",
        description: "Alle data hostede i EU med 99.9% uptime SLA og daily encrypted backups."
      }
    ]
  },
  {
    category: "Integrationer & API",
    icon: Zap,
    color: "from-violet-500 to-purple-600",
    items: [
      {
        icon: Zap,
        title: "200+ Integrationer",
        description: "Native integrationer til Salesforce, HubSpot, Microsoft 365, Google Workspace, QuickBooks og mange flere."
      },
      {
        icon: CheckCircle,
        title: "REST API",
        description: "Powerful REST API med webhook support for custom integrationer og automatisering."
      },
      {
        icon: Clock,
        title: "Real-time Sync",
        description: "Real-time data synkronisering på tværs af alle integrerede systemer og platforme."
      }
    ]
  }
];

export function FeaturesSection() {
  return (
    <section className="section-padding bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[var(--color-tekup-primary-fallback)] rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[var(--color-tekup-accent-fallback)] rounded-full blur-3xl" />
      </div>

      <div className="container-tekup relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[var(--color-tekup-primary-fallback)] to-[var(--color-tekup-accent-fallback)] rounded-2xl mb-6">
            <Star className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Alt du behøver i én platform
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Tekup kombinerer AI-drevet CRM, lead scoring, automatisering og unified support i én kraftfuld platform designet specifikt til SMB'er.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="space-y-20">
          {features.map((category, categoryIndex) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: categoryIndex * 0.1 }}
            >
              {/* Category Header */}
              <div className="flex items-center mb-12">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${category.color} flex items-center justify-center mr-4`}>
                  <category.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                  {category.category}
                </h3>
              </div>

              {/* Features Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {category.items.map((feature, featureIndex) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: featureIndex * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="group"
                  >
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 h-full">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${category.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                      
                      <h4 className="text-xl font-bold text-foreground mb-4 group-hover:text-[var(--color-tekup-primary-fallback)] transition-colors">
                        {feature.title}
                      </h4>
                      
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-20"
        >
          <div className="bg-gradient-to-r from-[var(--color-tekup-primary-fallback)] to-[var(--color-tekup-accent-fallback)] rounded-3xl p-12 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative">
              <h3 className="text-3xl md:text-4xl font-bold mb-6">
                Klar til at opleve forskellen?
              </h3>
              <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                Join 2,500+ SMB'er der allerede bruger Tekup til at øge deres lead konvertering med 89%.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white text-[var(--color-tekup-primary-fallback)] px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors text-lg"
                >
                  Start gratis prøveperiode
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-[var(--color-tekup-primary-fallback)] transition-colors text-lg"
                >
                  Se demo
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}