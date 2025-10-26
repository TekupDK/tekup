'use client';

import { motion } from 'motion/react';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Star, Quote, TrendingUp, Zap, Users, ArrowRight } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Button } from './ui/button';

export function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Lars Andersen',
      title: 'IT Chef',
      company: 'TechStart ApS',
      avatar: 'LA',
      rating: 5,
      text: 'Tekup transformerede vores IT-support. Lead Platform\'s AI scoring gav os 89% højere konvertering på bare 3 måneder. Jarvis AI løser 65% af vores tickets automatisk.',
      metrics: {
        improvement: '+89%',
        metric: 'Lead konvertering',
        timeframe: '3 måneder'
      }
    },
    {
      name: 'Maria Nielsen',
      title: 'COO',
      company: 'Digital Solutions',
      avatar: 'MN',
      rating: 5,
      text: 'Multi-tenant sikkerheden og seamless CRM integration gjorde forskellen. Vi har skaleret fra 50 til 200 kunder uden problemer. Support team elsker Jarvis AI.',
      metrics: {
        improvement: '4x',
        metric: 'Kunde skalering',
        timeframe: '6 måneder'
      }
    },
    {
      name: 'Thomas Hansen',
      title: 'Grundlægger',
      company: 'Innovation Hub',
      avatar: 'TH',
      rating: 5,
      text: 'Tekup\'s Lead Platform er game-changer. AI scoring identificerer hot leads øjeblikkeligt. Vi sparede 40% tid på lead kvalificering og øgede close rate med 67%.',
      metrics: {
        improvement: '+67%',
        metric: 'Close rate',
        timeframe: '2 måneder'
      }
    }
  ];

  const companyLogos = [
    { name: 'TechStart', logo: 'TS' },
    { name: 'Digital Solutions', logo: 'DS' },
    { name: 'Innovation Hub', logo: 'IH' },
    { name: 'Cloud Systems', logo: 'CS' },
    { name: 'DataFlow', logo: 'DF' },
    { name: 'NextGen', logo: 'NG' }
  ];

  const stats = [
    { value: '2,500+', label: 'Tilfredse kunder', icon: Users },
    { value: '89%', label: 'Øget konvertering', icon: TrendingUp },
    { value: '65%', label: 'Support besparelse', icon: Zap },
    { value: '4.9/5', label: 'Gennemsnitlig rating', icon: Star }
  ];

  return (
    <section id="testimonials" className="py-24 relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Dark background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-tekup-primary)_0%,_transparent_50%)] opacity-10" />
      
      {/* Animated shapes */}
      <motion.div 
        className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-full opacity-40 blur-2xl"
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360]
        }}
        transition={{ 
          duration: 30,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      <motion.div 
        className="absolute bottom-20 left-20 w-72 h-72 bg-gradient-to-br from-purple-500/20 to-indigo-600/20 rounded-full opacity-30 blur-2xl"
        animate={{ 
          scale: [1.2, 1, 1.2],
          rotate: [360, 180, 0]
        }}
        transition={{ 
          duration: 25,
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
          <Badge className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/30 text-emerald-300 backdrop-blur-sm px-4 py-2">
            <Quote className="w-4 h-4 mr-2" />
            Kundeanmeldelser
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              2,500+ SMB'er
            </span>
            <br />
            <span className="text-white">har transformeret deres IT-support</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Se hvordan virksomheder som din har øget lead konvertering med 89% 
            og sparet 65% support tid med Tekup platformen.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              viewport={{ once: true }}
            >
              <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10 hover-scale smooth-3d text-center shadow-2xl">
                <CardContent className="p-6">
                  <stat.icon className="w-8 h-8 mx-auto mb-4 text-cyan-400" />
                  <div className="text-3xl font-bold text-cyan-400 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-300">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Main testimonials */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10 hover-lift smooth-3d h-full shadow-2xl">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Rating */}
                    <div className="flex space-x-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>

                    {/* Quote */}
                    <blockquote className="text-gray-100 italic relative">
                      <Quote className="absolute -top-2 -left-1 w-6 h-6 text-cyan-400 opacity-30" />
                      <p className="pl-6 leading-relaxed">{testimonial.text}</p>
                    </blockquote>

                    {/* Metrics */}
                    <div className="p-4 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-400/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-cyan-400">
                            {testimonial.metrics.improvement}
                          </div>
                          <div className="text-sm text-gray-300">
                            {testimonial.metrics.metric}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {testimonial.metrics.timeframe}
                        </div>
                      </div>
                    </div>

                    {/* Author */}
                    <div className="flex items-center space-x-3 pt-4 border-t border-white/10">
                      <Avatar>
                        <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-500 text-white">
                          {testimonial.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-white">{testimonial.name}</div>
                        <div className="text-sm text-gray-300">
                          {testimonial.title}, {testimonial.company}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Company logos */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center space-y-8"
        >
          <div>
            <h3 className="text-xl font-semibold mb-2 text-white">Tillid fra innovative SMB'er</h3>
            <p className="text-gray-300">Virksomheder der valgte Tekup til deres IT-support transformation</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 opacity-70">
            {companyLogos.map((company, index) => (
              <motion.div
                key={company.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                viewport={{ once: true }}
                className="flex items-center space-x-3"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-700/70 backdrop-blur border border-white/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-300">{company.logo}</span>
                </div>
                <span className="font-medium text-gray-300">{company.name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            <h3 className="text-2xl font-bold mb-4 text-white">Klar til at blive den næste success story?</h3>
            <p className="text-gray-300 mb-6">
              Start din gratis 14-dages prøveperiode og se selv hvorfor 2,500+ SMB'er vælger Tekup.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-0 shadow-lg hover:shadow-xl transition-all px-6 py-3 rounded-xl"
                >
                  Start gratis nu
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" size="lg" className="bg-gray-700/50 border border-white/20 text-gray-300 backdrop-blur-sm hover:bg-gray-700/70 px-6 py-3 rounded-xl">
                  Se customer stories
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}