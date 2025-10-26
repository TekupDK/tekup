'use client';

import { motion } from 'motion/react';
import { 
  Shield, 
  Lock, 
  Globe, 
  Award, 
  CheckCircle, 
  Users,
  Clock,
  TrendingUp,
  Star,
  FileText,
  Eye,
  Zap
} from 'lucide-react';

const certifications = [
  {
    title: "SOC 2 Type II",
    description: "Auditeret og certificeret",
    icon: Shield,
    verified: true
  },
  {
    title: "ISO 27001",
    description: "Information sikkerhed",
    icon: Lock,
    verified: true
  },
  {
    title: "GDPR Compliant",
    description: "EU data beskyttelse",
    icon: Globe,
    verified: true
  },
  {
    title: "OWASP Secure",
    description: "Web application sikkerhed",
    icon: Award,
    verified: true
  }
];

const securityFeatures = [
  {
    title: "AES-256 Kryptering",
    description: "Bank-level kryptering af alle data i transit og at rest",
    icon: Lock
  },
  {
    title: "99.9% Uptime SLA",
    description: "Enterprise-grade infrastruktur med redundans",
    icon: Clock
  },
  {
    title: "EU Data Centers",
    description: "Alle data hostede i certificerede EU datacentre",
    icon: Globe
  },
  {
    title: "Daily Backups",
    description: "Automatiske krypterede backups og disaster recovery",
    icon: Shield
  },
  {
    title: "Role-based Access",
    description: "Granulær adgangskontrol og audit trails",
    icon: Users
  },
  {
    title: "Penetration Testing",
    description: "Kvartårlige sikkerhedstests af eksterne eksperter",
    icon: Eye
  }
];

const stats = [
  {
    number: "2,500+",
    label: "Virksomheder stoler på Tekup",
    icon: Users,
    color: "text-blue-500"
  },
  {
    number: "99.9%",
    label: "Uptime de sidste 12 måneder",
    icon: TrendingUp,
    color: "text-green-500"
  },
  {
    number: "< 2 sek",
    label: "Gennemsnitlig response tid",
    icon: Zap,
    color: "text-yellow-500"
  },
  {
    number: "4.9/5",
    label: "Gennemsnitlig kundetilfredshed",
    icon: Star,
    color: "text-purple-500"
  }
];

const customerLogos = [
  { name: "TechStart ApS", sector: "IT Services" },
  { name: "Nordic Clean", sector: "Cleaning Services" },
  { name: "Digital Solutions", sector: "Marketing" },
  { name: "Green Energy DK", sector: "Renewable Energy" },
  { name: "Smart Logistics", sector: "Transportation" },
  { name: "Health Plus", sector: "Healthcare" }
];

export function TrustSignalsSection() {
  return (
    <section className="section-padding bg-white dark:bg-gray-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='0.1' fill-rule='evenodd'%3E%3Cpath d='m0 40l40-40h-40v40zm40 0v-40h-40l40 40z'/%3E%3C/g%3E%3C/svg%3E")`,
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-6">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Din data er i sikre hænder
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Enterprise-grade sikkerhed, compliance og pålidelighed som 2,500+ virksomheder stoler på dagligt.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center group"
            >
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 group-hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700">
                <stat.icon className={`w-8 h-8 mx-auto mb-3 ${stat.color}`} />
                <div className="text-2xl md:text-3xl font-bold text-foreground mb-2">{stat.number}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Certifications */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-20"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-12">
            Certificeringer & Compliance
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {certifications.map((cert, index) => (
              <motion.div
                key={cert.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group"
              >
                <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-600 text-center relative">
                  {cert.verified && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  <cert.icon className="w-12 h-12 mx-auto mb-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                  <h4 className="font-bold text-foreground mb-2">{cert.title}</h4>
                  <p className="text-sm text-muted-foreground">{cert.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Security Features */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-20"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-12">
            Enterprise Sikkerhedsfeatures
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {securityFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-start space-x-4 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl hover:shadow-md transition-all duration-300"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-2">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Customer Trust */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-16"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-12">
            Stolte på af virksomheder i hele Danmark
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {customerLogos.map((customer, index) => (
              <motion.div
                key={customer.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 dark:border-gray-700"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-lg mx-auto mb-3 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-600 dark:text-gray-300">
                    {customer.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <h4 className="font-semibold text-foreground text-sm mb-1">{customer.name}</h4>
                <p className="text-xs text-muted-foreground">{customer.sector}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Security Promise CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-8 md:p-12 text-white text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative">
            <Shield className="w-16 h-16 mx-auto mb-6 opacity-90" />
            <h3 className="text-2xl md:text-3xl font-bold mb-6">
              Din Sikkerhed er Vores Prioritet
            </h3>
            <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
              Vi investerer kontinuerligt i de nyeste sikkerhedsteknologier og compliance standarder for at sikre dine data er beskyttede.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-emerald-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
              >
                Se sikkerhedsdokumentation
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-emerald-600 transition-colors"
              >
                Kontakt sikkerhedsteam
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}