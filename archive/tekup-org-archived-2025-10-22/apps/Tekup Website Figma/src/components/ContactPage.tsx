'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  Send,
  MessageCircle,
  Users,
  Building,
  Calendar,
  Zap,
  HeadphonesIcon,
  Globe,
  CheckCircle,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    phone: '',
    subject: '',
    message: '',
    inquiryType: '',
    companySize: '',
    budget: ''
  });

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleSelectChange = (field: string) => (value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    toast.success('Besked sendt!', {
      description: 'Vi vender tilbage til dig inden for 24 timer'
    });

    setIsSubmitting(false);
    
    // Reset form
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      company: '',
      phone: '',
      subject: '',
      message: '',
      inquiryType: '',
      companySize: '',
      budget: ''
    });
  };

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Send os en email og få svar inden for 24 timer',
      value: 'kontakt@tekup.dk',
      action: 'Send email',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Phone,
      title: 'Telefon Support',
      description: 'Ring og tal direkte med vores eksperter',
      value: '+45 70 20 30 40',
      action: 'Ring nu',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chat med vores support team i real-time',
      value: 'Tilgængelig 9-17',
      action: 'Start chat',
      gradient: 'from-purple-500 to-indigo-500'
    },
    {
      icon: Calendar,
      title: 'Book Meeting',
      description: 'Planlæg et videomøde med vores sales team',
      value: '30 min konsultation',
      action: 'Book tid',
      gradient: 'from-orange-500 to-red-500'
    }
  ];

  const offices = [
    {
      city: 'København',
      country: 'Danmark',
      address: 'Tekup Hovedkontor\nØster Alle 42, 2100 København Ø',
      phone: '+45 70 20 30 40',
      email: 'copenhagen@tekup.dk',
      timezone: 'CET (UTC+1)',
      isHeadquarters: true
    },
    {
      city: 'Stockholm',
      country: 'Sverige',
      address: 'Tekup Nordic\nKungsgatan 12, 111 43 Stockholm',
      phone: '+46 8 123 456 78',
      email: 'stockholm@tekup.dk',
      timezone: 'CET (UTC+1)',
      isHeadquarters: false
    },
    {
      city: 'Amsterdam',
      country: 'Nederlandene',
      address: 'Tekup Benelux\nPrinsengracht 263, 1016 GV Amsterdam',
      phone: '+31 20 123 4567',
      email: 'amsterdam@tekup.dk',
      timezone: 'CET (UTC+1)',
      isHeadquarters: false
    }
  ];

  const supportHours = [
    { day: 'Mandag - Fredag', hours: '9:00 - 17:00 CET', type: 'general' },
    { day: 'Weekend', hours: 'Kun kritisk support', type: 'limited' },
    { day: '24/7 Emergency', hours: 'Enterprise kunder', type: 'premium' }
  ];

  const faqs = [
    {
      question: 'Hvor hurtigt kan jeg komme i gang?',
      answer: 'De fleste kunder er op at køre inden for samme dag. Vores onboarding team hjælper dig hele vejen.'
    },
    {
      question: 'Tilbyder I migration fra andre systemer?',
      answer: 'Ja, vi hjælper med gratis data migration fra populære CRM og lead management systemer.'
    },
    {
      question: 'Hvilken support tilbyder I?',
      answer: 'Vi tilbyder email, telefon og live chat support på dansk, svensk og engelsk. Enterprise kunder får dedikeret success manager.'
    },
    {
      question: 'Er der en minimum kontrakt periode?',
      answer: 'Nej, alle vores planer er månedlige uden binding. Du kan cancel når som helst.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-tekup-primary)_0%,_transparent_50%)] opacity-10" />
      
      {/* Floating orbs */}
      <motion.div 
        className="absolute top-40 left-20 w-96 h-96 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-full opacity-40 blur-3xl"
        animate={{ 
          scale: [1, 1.3, 1],
          rotate: [0, 180, 360]
        }}
        transition={{ 
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      <motion.div 
        className="absolute bottom-40 right-20 w-72 h-72 bg-gradient-to-br from-purple-500/20 to-indigo-600/20 rounded-full opacity-30 blur-3xl"
        animate={{ 
          scale: [1.3, 1, 1.3],
          rotate: [360, 180, 0]
        }}
        transition={{ 
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <section className="pt-32 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center space-y-6"
            >
              <Badge className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-400/30 text-emerald-300 backdrop-blur-sm px-6 py-3">
                <HeadphonesIcon className="w-4 h-4 mr-2" />
                Kontakt & Support
              </Badge>
              
              <h1 className="text-4xl md:text-6xl font-bold text-white">
                Vi er her for at
                <br />
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  hjælpe dig
                </span>
              </h1>
              
              <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Har du spørgsmål til Tekup platformen? Vil du book en demo eller har brug for support? 
                Vores team af eksperter er klar til at hjælpe dig.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {contactMethods.map((method, index) => (
                <motion.div
                  key={method.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                >
                  <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-white/10 h-full hover-lift smooth-3d group cursor-pointer">
                    <CardContent className="p-6 text-center space-y-4">
                      <div className={`w-16 h-16 mx-auto rounded-xl bg-gradient-to-br ${method.gradient}/20 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <method.icon className={`w-8 h-8 bg-gradient-to-br ${method.gradient} bg-clip-text text-transparent`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-2">{method.title}</h3>
                        <p className="text-gray-300 text-sm mb-3">{method.description}</p>
                        <div className="font-medium text-cyan-400 mb-4">{method.value}</div>
                        <Button 
                          size="sm" 
                          className={`bg-gradient-to-r ${method.gradient} text-white border-0 hover:shadow-lg transition-all`}
                        >
                          {method.action}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Main Content */}
        <section className="pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="lg:col-span-2"
              >
                <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Send className="w-5 h-5 mr-2" />
                      Send os en besked
                    </CardTitle>
                    <p className="text-gray-300">
                      Udfyld formularen nedenfor og vi vender tilbage til dig hurtigst muligt
                    </p>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-gray-200">Fornavn *</Label>
                          <Input
                            id="firstName"
                            type="text"
                            value={formData.firstName}
                            onChange={handleInputChange('firstName')}
                            className="bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:ring-cyan-500 focus:border-cyan-500 backdrop-blur-sm"
                            placeholder="John"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-gray-200">Efternavn *</Label>
                          <Input
                            id="lastName"
                            type="text"
                            value={formData.lastName}
                            onChange={handleInputChange('lastName')}
                            className="bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:ring-cyan-500 focus:border-cyan-500 backdrop-blur-sm"
                            placeholder="Doe"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-gray-200">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange('email')}
                            className="bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:ring-cyan-500 focus:border-cyan-500 backdrop-blur-sm"
                            placeholder="john@company.com"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-gray-200">Telefon</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleInputChange('phone')}
                            className="bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:ring-cyan-500 focus:border-cyan-500 backdrop-blur-sm"
                            placeholder="+45 12 34 56 78"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="company" className="text-gray-200">Virksomhed *</Label>
                        <Input
                          id="company"
                          type="text"
                          value={formData.company}
                          onChange={handleInputChange('company')}
                          className="bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:ring-cyan-500 focus:border-cyan-500 backdrop-blur-sm"
                          placeholder="ACME Corp"
                          required
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-gray-200">Type henvendelse</Label>
                          <Select value={formData.inquiryType} onValueChange={handleSelectChange('inquiryType')}>
                            <SelectTrigger className="bg-white/10 border border-white/20 text-white backdrop-blur-sm">
                              <SelectValue placeholder="Vælg type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="demo">Demo booking</SelectItem>
                              <SelectItem value="sales">Sales forespørgsel</SelectItem>
                              <SelectItem value="support">Teknisk support</SelectItem>
                              <SelectItem value="partnership">Partnership</SelectItem>
                              <SelectItem value="other">Andet</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-200">Virksomhedsstørrelse</Label>
                          <Select value={formData.companySize} onValueChange={handleSelectChange('companySize')}>
                            <SelectTrigger className="bg-white/10 border border-white/20 text-white backdrop-blur-sm">
                              <SelectValue placeholder="Antal medarbejdere" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1-10">1-10 medarbejdere</SelectItem>
                              <SelectItem value="11-50">11-50 medarbejdere</SelectItem>
                              <SelectItem value="51-200">51-200 medarbejdere</SelectItem>
                              <SelectItem value="201-1000">201-1000 medarbejdere</SelectItem>
                              <SelectItem value="1000+">1000+ medarbejdere</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject" className="text-gray-200">Emne *</Label>
                        <Input
                          id="subject"
                          type="text"
                          value={formData.subject}
                          onChange={handleInputChange('subject')}
                          className="bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:ring-cyan-500 focus:border-cyan-500 backdrop-blur-sm"
                          placeholder="Hvad kan vi hjælpe med?"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message" className="text-gray-200">Besked *</Label>
                        <Textarea
                          id="message"
                          value={formData.message}
                          onChange={handleInputChange('message')}
                          className="bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:ring-cyan-500 focus:border-cyan-500 backdrop-blur-sm min-h-[120px]"
                          placeholder="Beskriv dit behov eller spørgsmål i detaljer..."
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0 hover:shadow-lg hover:shadow-cyan-500/25 py-3 rounded-xl font-semibold"
                      >
                        {isSubmitting ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                          />
                        ) : (
                          <Send className="w-5 h-5 mr-2" />
                        )}
                        {isSubmitting ? 'Sender besked...' : 'Send besked'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Sidebar */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                {/* Support Hours */}
                <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Clock className="w-5 h-5 mr-2" />
                      Support Tider
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {supportHours.map((schedule) => (
                      <div key={schedule.day} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white text-sm">{schedule.day}</div>
                          <div className="text-xs text-gray-400">{schedule.hours}</div>
                        </div>
                        <Badge className={`${
                          schedule.type === 'general' ? 'bg-green-500/20 text-green-400 border-green-400/30' :
                          schedule.type === 'limited' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30' :
                          'bg-purple-500/20 text-purple-400 border-purple-400/30'
                        } border`}>
                          {schedule.type === 'general' ? 'Fuld support' : 
                           schedule.type === 'limited' ? 'Begrænset' : 'Premium'}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* FAQs */}
                <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Ofte stillede spørgsmål</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {faqs.map((faq, index) => (
                      <div key={index} className="space-y-2">
                        <h4 className="font-medium text-white text-sm">{faq.question}</h4>
                        <p className="text-gray-300 text-xs leading-relaxed">{faq.answer}</p>
                        {index < faqs.length - 1 && <Separator className="bg-white/10" />}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Emergency Contact */}
                <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-400/20 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Zap className="w-5 h-5 mr-2 text-red-400" />
                      Akut Support
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 text-sm mb-4">
                      Kritiske systemnedgang eller sikkerhedsproblemer? Ring direkte.
                    </p>
                    <Button className="w-full bg-gradient-to-r from-red-500 to-orange-600 text-white border-0">
                      <Phone className="w-4 h-4 mr-2" />
                      +45 70 20 30 41
                    </Button>
                    <p className="text-xs text-gray-400 mt-2 text-center">
                      Kun for Enterprise kunder
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Office Locations */}
        <section className="pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center space-y-6 mb-12"
            >
              <Badge className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 text-blue-300 backdrop-blur-sm px-4 py-2">
                <Globe className="w-4 h-4 mr-2" />
                Vores Kontorer
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Vi er tæt på dig
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Med kontorer i Norden og Benelux er vi altid tæt på vores kunder
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {offices.map((office, index) => (
                <motion.div
                  key={office.city}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                >
                  <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10 h-full hover-lift smooth-3d">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-white">{office.city}</h3>
                          <p className="text-gray-400">{office.country}</p>
                        </div>
                        {office.isHeadquarters && (
                          <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-400/30">
                            Hovedkontor
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-3 text-sm">
                        <div className="flex items-start space-x-3">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div className="text-gray-300 whitespace-pre-line">{office.address}</div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <div className="text-gray-300">{office.phone}</div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <div className="text-gray-300">{office.email}</div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <div className="text-gray-300">{office.timezone}</div>
                        </div>
                      </div>

                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                      >
                        Se på kort
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}