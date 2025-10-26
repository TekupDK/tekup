'use client';

import { motion } from 'motion/react';
import { 
  Zap, 
  CheckCircle, 
  ArrowRight,
  Mail,
  Calendar,
  MessageSquare,
  Phone,
  BarChart3,
  CreditCard,
  Users,
  FileText,
  Cloud,
  Shield,
  Smartphone
} from 'lucide-react';

const integrationCategories = [
  {
    title: "Email & Kommunikation",
    icon: Mail,
    color: "from-blue-500 to-blue-600",
    integrations: [
      { name: "Gmail", description: "Fuld email sync og tracking", logo: "📧" },
      { name: "Outlook", description: "Microsoft email integration", logo: "📮" },
      { name: "Mailchimp", description: "Email marketing automation", logo: "🐵" },
      { name: "SendGrid", description: "Email delivery service", logo: "📨" }
    ]
  },
  {
    title: "CRM & Sales",
    icon: Users,
    color: "from-emerald-500 to-emerald-600",
    integrations: [
      { name: "Salesforce", description: "Data sync og migration", logo: "☁️" },
      { name: "HubSpot", description: "Marketing & sales hub", logo: "🔶" },
      { name: "Pipedrive", description: "Sales pipeline import", logo: "🟠" },
      { name: "Zendesk", description: "Customer support tickets", logo: "🎫" }
    ]
  },
  {
    title: "Produktivitet",
    icon: Calendar,
    color: "from-purple-500 to-purple-600",
    integrations: [
      { name: "Microsoft 365", description: "Office suite integration", logo: "🏢" },
      { name: "Google Workspace", description: "Google apps sync", logo: "🔍" },
      { name: "Slack", description: "Team kommunikation", logo: "💬" },
      { name: "Microsoft Teams", description: "Video meetings & chat", logo: "👥" }
    ]
  },
  {
    title: "Økonomi & Fakturering",
    icon: CreditCard,
    color: "from-green-500 to-green-600",
    integrations: [
      { name: "QuickBooks", description: "Regnskab og fakturering", logo: "📊" },
      { name: "Xero", description: "Cloud accounting", logo: "💰" },
      { name: "Stripe", description: "Online betalinger", logo: "💳" },
      { name: "Economic", description: "Dansk regnskabssystem", logo: "🇩🇰" }
    ]
  },
  {
    title: "Marketing & Analytics",
    icon: BarChart3,
    color: "from-orange-500 to-orange-600",
    integrations: [
      { name: "Google Analytics", description: "Website tracking", logo: "📈" },
      { name: "Facebook Ads", description: "Social media marketing", logo: "👍" },
      { name: "LinkedIn Sales", description: "Professional networking", logo: "💼" },
      { name: "Zapier", description: "Workflow automation", logo: "⚡" }
    ]
  },
  {
    title: "Telefon & Support",
    icon: Phone,
    color: "from-red-500 to-red-600",
    integrations: [
      { name: "Twilio", description: "SMS og voice calls", logo: "📱" },
      { name: "3CX", description: "VoIP telefonsystem", logo: "☎️" },
      { name: "Intercom", description: "Live chat support", logo: "💭" },
      { name: "Freshdesk", description: "Help desk software", logo: "🎧" }
    ]
  }
];

const stats = [
  { number: "200+", label: "Integrationer", icon: Zap },
  { number: "99.9%", label: "Uptime SLA", icon: Shield },
  { number: "< 24h", label: "Setup tid", icon: CheckCircle },
  { number: "API", label: "REST & GraphQL", icon: Cloud }
];

export function IntegrationsSection() {
  return (
    <section className="section-padding bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container-tekup relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[var(--color-tekup-primary-fallback)] to-[var(--color-tekup-accent-fallback)] rounded-2xl mb-6">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Integrerer med dine eksisterende værktøjer
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Tekup forbinder problemfrit med 200+ populære business applikationer. Ingen data siloer, kun en samlet platform.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
        >
          {stats.map((stat, index) => (
            <div key={stat.label} className="text-center">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                <stat.icon className="w-8 h-8 mx-auto mb-3 text-[var(--color-tekup-primary-fallback)]" />
                <div className="text-2xl font-bold text-foreground mb-1">{stat.number}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Integration Categories */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {integrationCategories.map((category, categoryIndex) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
              className="group"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 h-full">
                {/* Category Header */}
                <div className="flex items-center mb-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${category.color} flex items-center justify-center mr-4 group-hover:scale-110 transition-transform`}>
                    <category.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground group-hover:text-[var(--color-tekup-primary-fallback)] transition-colors">
                    {category.title}
                  </h3>
                </div>

                {/* Integrations List */}
                <div className="space-y-4">
                  {category.integrations.map((integration, index) => (
                    <div key={integration.name} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="text-2xl">{integration.logo}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-foreground text-sm">{integration.name}</div>
                        <div className="text-xs text-muted-foreground">{integration.description}</div>
                      </div>
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-1" />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* API & Custom Integrations */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-gradient-to-r from-[var(--color-tekup-primary-fallback)] to-[var(--color-tekup-accent-fallback)] rounded-3xl p-8 md:p-12 text-white mb-16 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold mb-6">
                Mangler din integration?
              </h3>
              <p className="text-lg mb-6 opacity-90">
                Vores REST API og webhook system gør det nemt at bygge custom integrationer. Vi hjælper også med at udvikle specialiserede integrationer til dine unikke behov.
              </p>
              <div className="space-y-3 mb-8">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5" />
                  <span>REST API med fuld dokumentation</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5" />
                  <span>Webhook support for real-time events</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5" />
                  <span>Dedikeret integration support</span>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-[var(--color-tekup-primary-fallback)] px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors inline-flex items-center"
              >
                Se API dokumentation
                <ArrowRight className="w-5 h-5 ml-2" />
              </motion.button>
            </div>
            
            <div className="relative">
              {/* Code Preview */}
              <div className="bg-gray-900 rounded-lg p-6 text-sm font-mono overflow-hidden">
                <div className="flex space-x-2 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="space-y-2 text-gray-300">
                  <div><span className="text-blue-400">POST</span> /api/v1/leads</div>
                  <div className="text-gray-500">Content-Type: application/json</div>
                  <div className="text-gray-500">Authorization: Bearer ...</div>
                  <div className="mt-3">{`{`}</div>
                  <div className="ml-4 text-green-400">"name": "John Doe",</div>
                  <div className="ml-4 text-green-400">"email": "john@company.com",</div>
                  <div className="ml-4 text-green-400">"score": 95</div>
                  <div>{`}`}</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Klar til at forbinde dine systemer?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Vores onboarding team hjælper dig med at få alle dine integrationer op at køre på under 24 timer.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-[var(--color-tekup-primary-fallback)] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[var(--color-tekup-primary-fallback)]/90 transition-colors"
              >
                Start gratis prøveperiode
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border-2 border-[var(--color-tekup-primary-fallback)] text-[var(--color-tekup-primary-fallback)] px-8 py-3 rounded-xl font-semibold hover:bg-[var(--color-tekup-primary-fallback)] hover:text-white transition-colors"
              >
                Kontakt integration team
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}