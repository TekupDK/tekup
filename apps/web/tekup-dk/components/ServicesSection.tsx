"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  Cloud,
  Code,
  Database,
  Shield,
  Zap,
} from "lucide-react";

const services = [
  {
    icon: Brain,
    title: "AI-løsninger",
    description:
      "Intelligent automation med AI-assistenter, semantic search og kontekstbaseret intelligens. Lokal eller cloud-baseret.",
    features: [
      "AI Assistants",
      "Semantic Search",
      "RAG Systemer",
      "LLM Integration",
    ],
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Zap,
    title: "Integrationer",
    description:
      "Fuldstændig integration mellem dine systemer. Gmail, Google Calendar, GitHub og mere gennem MCP-protokollen.",
    features: ["Gmail API", "Google Calendar", "GitHub Sync", "Billy.dk"],
    color: "from-indigo-500 to-blue-500",
  },
  {
    icon: Code,
    title: "Software Development",
    description:
      "Professionel udvikling af custom løsninger. TypeScript, React, Next.js og moderne tech stack.",
    features: ["Web Apps", "Mobile Apps", "APIs", "Microservices"],
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Database,
    title: "Data & Analytics",
    description:
      "Byg intelligent knowledge bases og analytics dashboards. Real-time metrics og business intelligence.",
    features: ["Knowledge Bases", "Dashboards", "Analytics", "Real-time Data"],
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Cloud,
    title: "Cloud Infrastructure",
    description:
      "Scalable cloud deployment med 99.9% uptime. Render, Supabase, PostgreSQL og moderne infrastructure.",
    features: ["Cloud Hosting", "Auto-scaling", "Monitoring", "CI/CD"],
    color: "from-orange-500 to-red-500",
  },
  {
    icon: Shield,
    title: "Sikkerhed & Compliance",
    description:
      "Enterprise-grade sikkerhed med encryption, OAuth2 og GDPR compliance.",
    features: ["OAuth2", "Encryption", "GDPR", "Security Audit"],
    color: "from-red-500 to-pink-500",
  },
];

export default function ServicesSection() {
  return (
    <section id="services" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Vores Services
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Alt hvad du har brug for til at transformere din virksomhed digitalt
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="group bg-white rounded-2xl p-8 border border-gray-100 hover:border-indigo-200 hover:shadow-xl transition-all duration-300"
            >
              {/* Icon */}
              <div
                className={`w-16 h-16 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
              >
                <service.icon className="w-8 h-8 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-2xl font-bold mb-3 text-gray-900">
                {service.title}
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {service.description}
              </p>

              {/* Features */}
              <ul className="space-y-2 mb-6">
                {service.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className="flex items-center text-sm text-gray-600"
                  >
                    <ArrowRight className="w-4 h-4 mr-2 text-indigo-600" />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Hover Effect */}
              <div className="mt-6 flex items-center text-indigo-600 font-medium group-hover:translate-x-2 transition-transform duration-300">
                <span>Læs mere</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
