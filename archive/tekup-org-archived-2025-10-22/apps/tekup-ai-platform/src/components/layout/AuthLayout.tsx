import React from 'react'
import { motion } from 'framer-motion'

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-8">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="max-w-md mx-auto"
        >
          {/* Logo */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 4L28 12V24L16 32L4 24V12L16 4Z" fill="white" opacity="0.9"/>
                <circle cx="16" cy="16" r="5" fill="currentColor" className="text-primary-600"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">TekUp</h1>
              <p className="text-slate-400 text-sm">AI Platform</p>
            </div>
          </div>

          {/* Hero Content */}
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-white leading-tight">
              Unified AI Business
              <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                {' '}Automation
              </span>
            </h2>
            
            <p className="text-lg text-slate-300 leading-relaxed">
              Få adgang til 11 integrerede AI-tjenester, der automatiserer hele din virksomhed. 
              Fra forslag og indhold til kundesupport og analytics.
            </p>

            {/* Features List */}
            <div className="grid grid-cols-1 gap-4 mt-8">
              {[
                { icon: '🎯', title: 'AI Proposal Engine', desc: 'Generer præcise forslag fra sales calls' },
                { icon: '✍️', title: 'Content Generator', desc: 'Skab engaging indhold til alle platforme' },
                { icon: '🎧', title: 'Customer Support', desc: 'Intelligent chatbot og ticket management' },
                { icon: '📊', title: 'Analytics Platform', desc: 'Predictive analytics og business intelligence' }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
                >
                  <span className="text-2xl">{feature.icon}</span>
                  <div>
                    <h3 className="font-semibold text-white text-sm">{feature.title}</h3>
                    <p className="text-slate-400 text-xs">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="grid grid-cols-3 gap-4 mt-8 p-4 rounded-xl glass"
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-400">96%</div>
              <div className="text-xs text-slate-400">Tidsbesparelse</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent-400">11</div>
              <div className="text-xs text-slate-400">AI Services</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success-400">24/7</div>
              <div className="text-xs text-slate-400">Automation</div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-8 lg:flex-initial lg:w-96">
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          className="sm:mx-auto sm:w-full sm:max-w-md"
        >
          {/* Mobile Logo */}
          <div className="flex justify-center lg:hidden mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 3L21 9V18L12 24L3 18V9L12 3Z" fill="white" opacity="0.9"/>
                  <circle cx="12" cy="12" r="4" fill="currentColor" className="text-primary-600"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">TekUp AI</h1>
              </div>
            </div>
          </div>

          {/* Auth Form Container */}
          <div className="glass-dark rounded-2xl p-8 shadow-2xl border border-white/10">
            {children}
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="mt-8 text-center"
          >
            <div className="flex items-center justify-center gap-6 text-sm text-slate-400">
              <a href="/privacy" className="hover:text-white transition-colors">
                Privatlivspolitik
              </a>
              <span>•</span>
              <a href="/terms" className="hover:text-white transition-colors">
                Vilkår
              </a>
              <span>•</span>
              <a href="/support" className="hover:text-white transition-colors">
                Support
              </a>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              © 2024 TekUp. Alle rettigheder forbeholdes.
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl animate-float animation-delay-150" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.02"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40" />
      </div>
    </div>
  )
}

