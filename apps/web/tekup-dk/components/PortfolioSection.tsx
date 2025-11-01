"use client";

import { motion } from "framer-motion";
import { ExternalLink, GitBranch, Github, Star } from "lucide-react";

const projects = [
  {
    name: "TekUpVault",
    description:
      "Central knowledge base med semantic search og AI-powered retrieval.",
    tech: ["TypeScript", "PostgreSQL", "pgvector", "OpenAI"],
    github: "TekupDK/tekup",
    stars: "12",
    status: "Production",
  },
  {
    name: "TekUp-Billy",
    description:
      "Billy.dk API integration via MCP med 32+ tools og circuit breaker.",
    tech: ["TypeScript", "Express", "Redis", "MCP"],
    github: "TekupDK/tekup",
    stars: "8",
    status: "Production",
  },
  {
    name: "RenOS",
    description:
      "Komplet business management system med AI-assistenter og automatisering.",
    tech: ["Next.js", "NestJS", "PostgreSQL", "AI"],
    github: "JonasAbde/renos-backend",
    stars: "15",
    status: "Production",
  },
];

export default function PortfolioSection() {
  return (
    <section id="portfolio" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
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
            Vores Portfolio
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Se nogle af vores produktionsløsninger og open source projekter
          </p>
        </motion.div>

        {/* Projects Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {project.name}
                  </h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {project.status}
                  </span>
                </div>
                <Github className="w-6 h-6 text-gray-400" />
              </div>

              {/* Description */}
              <p className="text-gray-600 mb-4 leading-relaxed">
                {project.description}
              </p>

              {/* Tech Stack */}
              <div className="flex flex-wrap gap-2 mb-4">
                {project.tech.map((tech, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {/* Stats & Link */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    {project.stars}
                  </span>
                  <span className="flex items-center">
                    <GitBranch className="w-4 h-4 mr-1" />
                    Active
                  </span>
                </div>
                <a
                  href={`https://github.com/${project.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-700 flex items-center text-sm font-medium"
                >
                  Se på GitHub
                  <ExternalLink className="w-4 h-4 ml-1" />
                </a>
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
          <a
            href="https://github.com/TekupDK"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 bg-gray-900 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-800 transition-all duration-300"
          >
            <Github className="w-5 h-5" />
            <span>Se alle projekter på GitHub</span>
            <ExternalLink className="w-5 h-5" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
