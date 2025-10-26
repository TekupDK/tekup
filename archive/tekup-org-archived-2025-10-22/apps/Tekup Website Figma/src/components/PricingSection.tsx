'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader } from './ui/card';
import { Switch } from './ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Check, X, Zap, Crown, Rocket, Shield, Users, Brain, BarChart3, Headphones } from 'lucide-react';
import { DemoBookingModal } from './DemoBookingModal';
import { toast } from 'sonner@2.0.3';

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const plans = [
    {
      name: 'Starter',
      description: 'Perfekt til små teams der vil i gang',
      icon: Zap,
      price: { monthly: 49, annual: 39 },
      features: [
        'Op til 5 brugere',
        'Basis CRM funktioner',
        'Email support',
        '5GB storage',
        'Basis rapporter',
        'Single tenant'
      ],
      notIncluded: [
        'Lead Platform',
        'Jarvis AI',
        'Advanced rapporter',
        'API adgang',
        'Priority support'
      ],
      popular: false,
      cta: 'Start gratis'
    },
    {
      name: 'Professional',
      description: 'For voksende SMB\'er med avancerede behov',
      icon: Crown,
      price: { monthly: 149, annual: 119 },
      features: [
        'Op til 25 brugere',
        'Komplet CRM + Lead Platform',
        'AI Lead Scoring (95% præcision)',
        'Automatisk kvalificering',
        'Priority support',
        '50GB storage',
        'Advanced rapporter',
        'API adgang',
        'Multi-tenant sikkerhed',
        'Integration hub'
      ],
      notIncluded: [
        'Jarvis AI (fuld version)',
        'Custom integrationer',
        'Dedicated support',
        'SLA garanti'
      ],
      popular: true,
      cta: 'Mest populær'
    },
    {
      name: 'Enterprise',
      description: 'Fuld platform til store organisationer',
      icon: Rocket,
      price: { monthly: 349, annual: 279 },
      features: [
        'Ubegrænset brugere',
        'Alt i Professional',
        'Jarvis AI (Mock/Real/Off)',
        'Custom integrationer',
        'Dedicated success manager',
        'Unlimited storage',
        'SLA 99.9% uptime',
        'Advanced sikkerhed',
        'On-premise deployment',
        'White-label muligheder'
      ],
      notIncluded: [],
      popular: false,
      cta: 'Kontakt salg'
    }
  ];

  const faqs = [
    {
      question: 'Hvad er forskellen på Mock, Real og Off mode for Jarvis AI?',
      answer: 'Mock mode bruger forudindstillede svar til test og demo. Real mode forbinder til AgentScope AI for live support. Off mode deaktiverer AI fuldstændigt og bruger manuel support.'
    },
    {
      question: 'Hvor sikker er multi-tenant arkitekturen?',
      answer: 'Tekup bruger isolerede tenant-containere med krypterede databaser, RBAC adgangskontrol og SOC 2 Type II certificering. Hver tenant har fuldstændig dataisolation.'
    },
    {
      question: 'Kan jeg opgradere fra Starter til Professional?',
      answer: 'Ja, du kan opgradere når som helst. Data og konfiguration overføres automatisk, og du betaler kun pro-rata forskellen.'
    },
    {
      question: 'Hvilke integrationer er inkluderet?',
      answer: 'Professional inkluderer 50+ pre-built integrationer (Salesforce, HubSpot, Slack, Teams, etc.). Enterprise får custom integrationer og API webhooks.'
    },
    {
      question: 'Hvad sker hvis jeg når brugergrænsen?',
      answer: 'Systemet giver besked 7 dage før grænsen. Du kan auto-opgradere eller tilføje ekstra brugere for €15/bruger/måned.'
    },
    {
      question: 'Er der en gratis prøveperiode?',
      answer: 'Ja, alle planer inkluderer 14 dages gratis prøveperiode med fuld funktionalitet. Ingen kreditkort påkrævet.'
    }
  ];

  const featureMatrix = [
    { feature: 'Brugere', starter: '5', professional: '25', enterprise: 'Ubegrænset' },
    { feature: 'Storage', starter: '5GB', professional: '50GB', enterprise: 'Ubegrænset' },
    { feature: 'CRM', starter: true, professional: true, enterprise: true },
    { feature: 'Lead Platform', starter: false, professional: true, enterprise: true },
    { feature: 'AI Lead Scoring', starter: false, professional: true, enterprise: true },
    { feature: 'Jarvis AI', starter: false, professional: false, enterprise: true },
    { feature: 'API Adgang', starter: false, professional: true, enterprise: true },
    { feature: 'Multi-tenant', starter: false, professional: true, enterprise: true },
    { feature: 'Priority Support', starter: false, professional: true, enterprise: true },
    { feature: 'SLA Garanti', starter: false, professional: false, enterprise: true }
  ];

  return (
    <section id="pricing" className="py-24 relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Dark background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-tekup-primary)_0%,_transparent_50%)] opacity-10" />
      
      <motion.div 
        className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-full opacity-40 blur-2xl"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      
      <motion.div 
        className="absolute bottom-20 right-20 w-72 h-72 bg-gradient-to-br from-purple-500/20 to-indigo-600/20 rounded-full opacity-30 blur-2xl"
        animate={{ rotate: [360, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
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
          <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 text-green-300 backdrop-blur-sm px-4 py-2">
            <BarChart3 className="w-4 h-4 mr-2" />
            Priser & Planer
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
            Transparent priser
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              ingen skjulte omkostninger
            </span>
          </h2>
          <div className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed space-y-2">
            <p>Start gratis i 14 dage. Opgrader når du har brug for det.</p>
            <p>Alle planer inkluderer multi-tenant sikkerhed og 99.9% uptime.</p>
          </div>

          {/* Annual/Monthly Toggle */}
          <div className="flex items-center justify-center space-x-4 p-2 bg-white/10 backdrop-blur-sm rounded-full w-fit mx-auto border border-white/20">
            <span className={`px-4 py-2 text-sm rounded-full transition-all ${!isAnnual ? 'text-white bg-white/20' : 'text-gray-400'}`}>
              Månedligt
            </span>
            <Switch 
              checked={isAnnual} 
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-cyan-500"
            />
            <span className={`px-4 py-2 text-sm rounded-full transition-all ${isAnnual ? 'text-white bg-white/20' : 'text-gray-400'}`}>
              Årligt
            </span>
            {isAnnual && (
              <Badge className="bg-emerald-500 text-white ml-2 shadow-lg">
                Spar 20%
              </Badge>
            )}
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
              className="relative"
            >
              {plan.popular && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 shadow-lg ring-2 ring-cyan-500/30 backdrop-blur-sm">
                    MEST POPULÆR
                  </Badge>
                </div>
              )}
              
              <Card className={`bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10 hover-lift smooth-3d h-full shadow-2xl ${
                plan.popular ? 'ring-2 ring-cyan-500/50 border-cyan-500/30' : ''
              }`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                      plan.popular 
                        ? 'bg-gradient-to-br from-cyan-500 to-blue-600' 
                        : 'bg-gradient-to-br from-gray-600 to-gray-700'
                    }`}>
                      <plan.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                      <p className="text-sm text-gray-300">{plan.description}</p>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-4xl font-bold text-white">
                        €{isAnnual ? plan.price.annual : plan.price.monthly}
                      </span>
                      <span className="text-gray-400">/måned</span>
                    </div>
                    {isAnnual && (
                      <p className="text-sm text-gray-400 mt-1">
                        Normalt €{plan.price.monthly}/måned
                      </p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Features */}
                  <div className="space-y-3">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-center space-x-3">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span className="text-sm text-gray-200">{feature}</span>
                      </div>
                    ))}
                    
                    {plan.notIncluded.map((feature) => (
                      <div key={feature} className="flex items-center space-x-3 opacity-50">
                        <X className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="text-sm text-gray-500 line-through">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      className={`w-full rounded-xl font-semibold transition-all ${
                        plan.popular 
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl hover:shadow-cyan-500/25' 
                          : 'bg-white/10 border border-white/20 text-white backdrop-blur-sm hover:bg-white/20'
                      }`}
                      size="lg"
                      onClick={() => {
                        if (plan.name === 'Enterprise') {
                          setIsDemoModalOpen(true);
                        } else {
                          toast.success('Tak for din interesse!', {
                            description: `${plan.name} plan er klar til opstart. Vi kontakter dig snart!`
                          });
                        }
                      }}
                    >
                      {plan.cta}
                    </Button>
                  </motion.div>
                  
                  <p className="text-xs text-center text-gray-400">
                    14 dages gratis prøveperiode • Ingen opsigelse
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Feature Matrix */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10 shadow-2xl">
            <CardHeader>
              <h3 className="text-2xl font-bold text-center text-white">Detaljeret funktionssammenligning</h3>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-4 font-medium text-white">Funktion</th>
                      <th className="text-center py-4 font-medium text-white">Starter</th>
                      <th className="text-center py-4 font-medium text-white">Professional</th>
                      <th className="text-center py-4 font-medium text-white">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    {featureMatrix.map((row, index) => (
                      <motion.tr
                        key={row.feature}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.4 }}
                        viewport={{ once: true }}
                        className="border-b border-white/5"
                      >
                        <td className="py-3 font-medium text-white">{row.feature}</td>
                        <td className="text-center py-3">
                          {typeof row.starter === 'boolean' ? (
                            row.starter ? (
                              <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                            ) : (
                              <X className="w-4 h-4 text-gray-500 mx-auto" />
                            )
                          ) : (
                            <span className="text-gray-300">{row.starter}</span>
                          )}
                        </td>
                        <td className="text-center py-3">
                          {typeof row.professional === 'boolean' ? (
                            row.professional ? (
                              <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                            ) : (
                              <X className="w-4 h-4 text-gray-500 mx-auto" />
                            )
                          ) : (
                            <span className="text-gray-300">{row.professional}</span>
                          )}
                        </td>
                        <td className="text-center py-3">
                          {typeof row.enterprise === 'boolean' ? (
                            row.enterprise ? (
                              <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                            ) : (
                              <X className="w-4 h-4 text-gray-500 mx-auto" />
                            )
                          ) : (
                            <span className="text-gray-300">{row.enterprise}</span>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold mb-4 text-white">Ofte stillede spørgsmål</h3>
            <p className="text-gray-300">
              Har du andre spørgsmål? Kontakt vores salg for personlig rådgivning.
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                viewport={{ once: true }}
              >
                <AccordionItem value={`item-${index}`} className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-white/10 rounded-lg px-6 shadow-lg">
                  <AccordionTrigger className="text-left hover:no-underline text-white">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-300 pt-2">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
        
        {/* Demo Booking Modal */}
        <DemoBookingModal 
          isOpen={isDemoModalOpen} 
          onClose={() => setIsDemoModalOpen(false)} 
        />
      </div>
    </section>
  );
}