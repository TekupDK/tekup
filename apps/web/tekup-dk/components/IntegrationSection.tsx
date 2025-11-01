"use client";

import { motion } from "framer-motion";
import { Calendar, CheckCircle2, Github, Mail } from "lucide-react";

const integrations = [
  {
    icon: Mail,
    title: "Gmail Integration",
    description:
      "Automatisk email management med AI-analysis og smart kategorisering.",
    features: [
      "Email search & filtering",
      "AI-genererede svar",
      "Smart email categorization",
      "Auto-reply funktionalitet",
    ],
    color: "from-red-500 to-orange-500",
  },
  {
    icon: Calendar,
    title: "Google Calendar",
    description:
      "Smart booking system med automatisk konflikt-detection og availability checking.",
    features: [
      "Automatisk booking",
      "Conflict detection",
      "Availability checking",
      "Meeting assistant",
    ],
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Github,
    title: "GitHub Integration",
    description: "Automatisk repository synkronisering og portfolio showcase.",
    features: [
      "Auto-sync repositories",
      "Portfolio showcase",
      "Code quality metrics",
      "Live activity feed",
    ],
    color: "from-gray-700 to-gray-900",
  },
];

export default function IntegrationSection() {
  return (
    <section
      id="integrations"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white"
    >
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
            Populære Integrationer
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Fuldstændig integration med de værktøjer du allerede bruger
          </p>
        </motion.div>

        {/* Integrations Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {integrations.map((integration, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
            >
              {/* Icon */}
              <div
                className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${integration.color} flex items-center justify-center mb-6 mx-auto`}
              >
                <integration.icon className="w-10 h-10 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-2xl font-bold mb-3 text-center text-gray-900">
                {integration.title}
              </h3>
              <p className="text-gray-600 mb-6 text-center leading-relaxed">
                {integration.description}
              </p>

              {/* Features */}
              <ul className="space-y-3">
                {integration.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Status Badge */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Produktionsklar
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-center mt-16"
        >
          <p className="text-lg text-gray-600 mb-6">
            Har du brug for en anden integration?
          </p>
          <a
            href="#contact"
            className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Kontakt os for at høre mere
          </a>
        </motion.div>
      </div>
    </section>
  );
}
