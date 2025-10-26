'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Play, ArrowRight, Zap, Shield, TrendingUp, Users, Star } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { DemoBookingModal } from './DemoBookingModal';
import { toast } from 'sonner@2.0.3';

export function HeroSection() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  
  const stats = [
    { label: 'Nye leads', value: '12', icon: TrendingUp, color: 'text-emerald-400' },
    { label: 'Konvertering', value: '89%', icon: Users, color: 'text-cyan-400' },
    { label: 'AI Score', value: '95', icon: Zap, color: 'text-purple-400' },
    { label: 'Live Status', value: 'OK', icon: Shield, color: 'text-green-400' },
  ];

  const integrationLogos = [
    'Microsoft', 'Salesforce', 'HubSpot', 'Zendesk', 'Slack'
  ];

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Dark Background with subtle patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-tekup-primary)_0%,_transparent_50%)] opacity-20" />
      
      {/* Enhanced Animated Background Shapes */}
      <motion.div 
        className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-full opacity-40 blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{ 
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      <motion.div 
        className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-full opacity-30 blur-3xl"
        animate={{ 
          scale: [1.2, 1, 1.2],
          rotate: [360, 180, 0],
        }}
        transition={{ 
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      <motion.div 
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-cyan-500/10 to-blue-600/10 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.2, 0.3],
        }}
        transition={{ 
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 bg-[rgba(255,255,255,0)]">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-16 xl:gap-20 items-start lg:items-center min-h-[600px] lg:min-h-[500px]">
          
          {/* Left Column - Content */}
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Enhanced Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <Badge className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-cyan-300 hover-scale backdrop-blur-sm px-4 py-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse mr-3" />
                <span className="font-medium">My Jarvis AI Lead Scoring</span>
              </Badge>
            </motion.div>

            {/* Main Headline */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="space-y-8"
            >
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] text-white">
                <span className="block">AI-drevet CRM</span>
                <span className="block bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  for SMB'er
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-300 max-w-xl leading-relaxed font-light">
                Øg lead-konvertering med 89% gennem AI-assisteret CRM og unified IT-support.
              </p>
            </motion.div>

            {/* Enhanced CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-6"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="smooth-3d"
              >
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0 px-10 py-6 text-xl font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:shadow-cyan-500/25 hover-lift w-full sm:w-auto"
                  onClick={() => {
                    toast.success('Gratis prøveperiode aktiveret!', {
                      description: 'Book en demo for at komme i gang hurtigere'
                    });
                    setIsDemoModalOpen(true);
                  }}
                >
                  Start gratis - 14 dage
                  <ArrowRight className="w-6 h-6 ml-3" />
                </Button>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="smooth-3d"
              >
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="bg-white/10 border border-white/20 text-white backdrop-blur-sm px-8 py-6 text-lg font-medium rounded-2xl hover:bg-white/20 hover-lift transition-all w-full sm:w-auto"
                  onClick={() => setIsDemoModalOpen(true)}
                >
                  <Play className="w-5 h-5 mr-3" />
                  Se demo
                </Button>
              </motion.div>
            </motion.div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="space-y-6"
            >
              <div className="flex items-center space-x-3 text-sm">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-white font-medium">4.9/5 fra 2,500+ SMB kunder</span>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-gray-400">Integrerer med:</div>
                <div className="flex flex-wrap items-center gap-4">
                  {integrationLogos.map((logo) => (
                    <span key={logo} className="px-3 py-1 bg-white/10 rounded-md text-sm font-medium text-gray-300 backdrop-blur-sm">
                      {logo}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Enhanced Dashboard Preview */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          >
            {/* Main Dashboard Card */}
            <motion.div 
              className="relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover-lift smooth-3d shadow-2xl"
              whileHover={{ rotateY: 2, rotateX: 2 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white text-lg">Tekup Dashboard</h3>
                  <Badge className="bg-emerald-500 text-white px-3 py-1 rounded-full shadow-lg">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2" />
                    Live
                  </Badge>
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {stats.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1 + index * 0.1, duration: 0.4 }}
                      className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 backdrop-blur rounded-xl p-4 text-center hover-scale smooth-3d border border-white/5"
                    >
                      <stat.icon className={`w-6 h-6 mx-auto mb-3 ${stat.color}`} />
                      <div className={`text-2xl font-bold mb-1 ${stat.color}`}>{stat.value}</div>
                      <div className="text-xs text-gray-400">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
                
                {/* Recent Activity */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-white">Top leads i dag</h4>
                  {[
                    { company: 'TechStart ApS', score: 95, status: 'Hot Lead', color: 'bg-emerald-500' },
                    { company: 'Digital Solutions', score: 87, status: 'Varm', color: 'bg-cyan-500' },
                  ].map((lead, index) => (
                    <motion.div
                      key={lead.company}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.5 + index * 0.1, duration: 0.4 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-700/30 to-gray-800/30 backdrop-blur border border-white/5"
                    >
                      <div className="flex-1">
                        <span className="text-sm text-white font-medium block">{lead.company}</span>
                        <span className="text-xs text-gray-400">{lead.status}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-bold text-white">{lead.score}%</span>
                        <div className={`w-3 h-3 rounded-full ${lead.color} shadow-lg`} />
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {/* Bottom status */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-xs text-emerald-400 font-medium">99.9% uptime</span>
                  </div>
                  <span className="text-xs text-gray-400">Sidste opdatering: Nu</span>
                </div>
              </div>
            </motion.div>

            {/* Enhanced Floating Notifications */}
            <motion.div 
              className="absolute -top-6 -right-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg p-3 shadow-lg hover-scale smooth-3d border border-white/20"
              initial={{ opacity: 0, scale: 0, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 1.2, duration: 0.5, type: "spring" }}
              whileHover={{ rotate: 2, scale: 1.05 }}
            >
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-xs font-bold text-white">2 nye leads</span>
              </div>
            </motion.div>
            
            <motion.div 
              className="absolute -bottom-6 -left-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-3 shadow-lg hover-scale smooth-3d border border-white/20"
              initial={{ opacity: 0, scale: 0, rotate: 10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 1.4, duration: 0.5, type: "spring" }}
              whileHover={{ rotate: -2, scale: 1.05 }}
            >
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-white" />
                <span className="text-xs font-bold text-white">Live monitoring</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
      
      {/* Demo Booking Modal */}
      <DemoBookingModal 
        isOpen={isDemoModalOpen} 
        onClose={() => setIsDemoModalOpen(false)} 
      />
    </div>
  );
}