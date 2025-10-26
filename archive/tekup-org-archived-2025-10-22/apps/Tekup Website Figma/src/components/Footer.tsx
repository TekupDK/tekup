'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  Zap, 
  Mail, 
  Phone, 
  MapPin, 
  Github, 
  Twitter, 
  Linkedin, 
  Globe,
  FileText,
  Shield,
  HelpCircle,
  Book,
  Users,
  BarChart3,
  Brain
} from 'lucide-react';
import { DemoBookingModal } from './DemoBookingModal';
import { toast } from 'sonner@2.0.3';

import { Route } from './Router';

interface FooterProps {
  onNavigate: (route: Route) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  
  const handleNavClick = (route: Route) => {
    onNavigate(route);
  };

  const scrollToSection = (sectionId: string) => {
    onNavigate('home');
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const footerSections = [
    {
      title: 'Produkt',
      links: [
        { label: 'CRM', action: () => scrollToSection('crm'), icon: Users },
        { label: 'Lead Platform', action: () => scrollToSection('leads'), icon: BarChart3 },
        { label: 'Jarvis AI', action: () => scrollToSection('ai'), icon: Brain },
        { label: 'Priser', action: () => handleNavClick('pricing') },
        { label: 'Demos', action: () => setIsDemoModalOpen(true) }
      ]
    },
    {
      title: 'Løsninger',
      links: [
        { label: 'SMB Solutions', action: () => handleNavClick('solutions') },
        { label: 'Lead Management', action: () => scrollToSection('leads') },
        { label: 'AI Automatisering', action: () => scrollToSection('ai') },
        { label: 'Dashboard', action: () => handleNavClick('dashboard') },
        { label: 'Integrationer', action: () => scrollToSection('solutions') }
      ]
    },
    {
      title: 'Ressourcer',
      links: [
        { label: 'Dokumentation', action: () => handleNavClick('docs'), icon: FileText },
        { label: 'API Reference', action: () => handleNavClick('docs') },
        { label: 'Blog', action: () => handleNavClick('blog'), icon: Book },
        { label: 'Support Center', action: () => handleNavClick('contact'), icon: HelpCircle },
        { label: 'Status Page', action: () => toast.info('Status page kommer snart!') }
      ]
    },
    {
      title: 'Virksomhed',
      links: [
        { label: 'Om Tekup', action: () => handleNavClick('about') },
        { label: 'Karriere', action: () => toast.info('Karriere side kommer snart!') },
        { label: 'Partnere', action: () => toast.info('Partner program kommer snart!') },
        { label: 'Sikkerhed', action: () => scrollToSection('security'), icon: Shield },
        { label: 'Kontakt', action: () => handleNavClick('contact') }
      ]
    }
  ];

  const languages = [
    { code: 'da', label: 'Dansk', flag: '🇩🇰' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'sv', label: 'Svenska', flag: '🇸🇪' }
  ];

  const socialLinks = [
    { icon: Twitter, href: '#twitter', label: 'Twitter' },
    { icon: Linkedin, href: '#linkedin', label: 'LinkedIn' },
    { icon: Github, href: '#github', label: 'GitHub' }
  ];

  const legalLinks = [
    { label: 'Privatlivspolitik', href: '#privacy' },
    { label: 'Servicevilkår', href: '#terms' },
    { label: 'Cookie Policy', href: '#cookies' },
    { label: 'GDPR', href: '#gdpr' }
  ];

  return (
    <footer className="relative mt-24 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Background decoration */}
      <motion.div 
        className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        transition={{ duration: 1.5 }}
        viewport={{ once: true }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter/CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="py-16 text-center"
        >
          <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl">
            <Badge className="mb-6 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-cyan-300 backdrop-blur-sm px-4 py-2">
              <Zap className="w-4 h-4 mr-2" />
              Klar til at komme i gang?
            </Badge>
            
            <h3 className="text-2xl md:text-3xl font-bold mb-4 text-white">
              Start din gratis 14-dages prøveperiode
            </h3>
            
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Få adgang til hele Tekup platformen med CRM, Lead Platform og Jarvis AI. 
              Ingen kreditkort påkrævet.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0 px-8 shadow-lg hover:shadow-xl hover:shadow-cyan-500/25 rounded-xl font-semibold"
                  onClick={() => {
                    toast.success('Gratis prøveperiode aktiveret!', {
                      description: 'Book en demo for at komme i gang hurtigere'
                    });
                    setIsDemoModalOpen(true);
                  }}
                >
                  Start gratis nu
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="bg-white/10 border border-white/20 text-white backdrop-blur-sm px-8 hover:bg-white/20 rounded-xl font-medium"
                  onClick={() => setIsDemoModalOpen(true)}
                >
                  Book demo
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid lg:grid-cols-6 gap-8">
            {/* Brand Column */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Logo */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[var(--color-tekup-primary)] to-[var(--color-tekup-accent)] rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-[var(--color-tekup-primary)] to-[var(--color-tekup-accent)] bg-clip-text text-transparent">
                  Tekup
                </span>
              </div>

              <p className="text-muted-foreground">
                Den ultimative multi-tenant SaaS platform for SMB IT-support. 
                Forener CRM, lead management og AI i ét sammenhængende system.
              </p>

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <Mail className="w-4 h-4 text-[var(--color-tekup-accent)]" />
                  <span>kontakt@tekup.dk</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <Phone className="w-4 h-4 text-[var(--color-tekup-accent)]" />
                  <span>+45 70 20 30 40</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <MapPin className="w-4 h-4 text-[var(--color-tekup-accent)]" />
                  <span>København, Danmark</span>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex space-x-4">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    className="w-10 h-10 rounded-lg glass border-[var(--color-tekup-glass-border)] flex items-center justify-center hover:border-[var(--color-tekup-accent)] transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label={social.label}
                  >
                    <social.icon className="w-4 h-4" />
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* Links Columns */}
            {footerSections.map((section, sectionIndex) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: sectionIndex * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                className="space-y-4"
              >
                <h4 className="font-semibold text-foreground">{section.title}</h4>
                <div className="space-y-3">
                  {section.links.map((link) => (
                    <motion.button
                      key={link.label}
                      onClick={link.action}
                      className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-[var(--color-tekup-accent)] transition-colors w-full text-left"
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      {link.icon && <link.icon className="w-4 h-4" />}
                      <span>{link.label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <Separator className="opacity-20" />

        {/* Bottom Footer */}
        <div className="py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Copyright */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-sm text-muted-foreground"
            >
              © 2024 Tekup ApS. Alle rettigheder forbeholdes.
            </motion.div>

            {/* Legal Links */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="flex flex-wrap items-center gap-6 text-sm"
            >
              {legalLinks.map((link, index) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-muted-foreground hover:text-[var(--color-tekup-accent)] transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </motion.div>

            {/* Language Selector */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="flex items-center space-x-2"
            >
              <Globe className="w-4 h-4 text-muted-foreground" />
              <select className="bg-transparent text-sm text-muted-foreground border-none outline-none cursor-pointer">
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.label}
                  </option>
                ))}
              </select>
            </motion.div>
          </div>
        </div>

        {/* Status indicator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="pb-8"
        >
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>Alle systemer fungerer normalt</span>
              <span>•</span>
              <span>99.9% uptime</span>
              <span>•</span>
              <span>Sidst opdateret: 2 min siden</span>
            </div>
          </div>
        </motion.div>
        
        {/* Demo Booking Modal */}
        <DemoBookingModal 
          isOpen={isDemoModalOpen} 
          onClose={() => setIsDemoModalOpen(false)} 
        />
      </div>
    </footer>
  );
}