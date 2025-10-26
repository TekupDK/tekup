'use client';

import { motion } from 'motion/react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Zap, 
  Users, 
  Globe, 
  Award, 
  Target, 
  Heart,
  Linkedin,
  Twitter,
  Github,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Shield,
  Clock,
  Lightbulb,
  Rocket
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function AboutPage() {
  const stats = [
    { value: '10,000+', label: 'Tilfredse kunder', icon: Users },
    { value: '99.9%', label: 'Uptime garanti', icon: Shield },
    { value: '50+', label: 'Lande verdensomspændende', icon: Globe },
    { value: '24/7', label: 'Support tilgængelig', icon: Clock }
  ];

  const values = [
    {
      icon: Lightbulb,
      title: 'Innovation',
      description: 'Vi pusher grænserne for hvad der er muligt med AI og automation i SMB-segmentet.',
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Heart,
      title: 'Kundefokus',
      description: 'Vores kunders succes er vores succes. Alt vi laver er designet med brugeren i centrum.',
      gradient: 'from-red-500 to-pink-500'
    },
    {
      icon: Shield,
      title: 'Tillid & Sikkerhed',
      description: 'Bank-niveau sikkerhed og GDPR compliance er fundamental i alt hvad vi bygger.',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: Rocket,
      title: 'Skalering',
      description: 'Fra startup til enterprise - vores løsninger vokser med din virksomhed.',
      gradient: 'from-blue-500 to-cyan-500'
    }
  ];

  const teamMembers = [
    {
      name: 'Lars Hansen',
      role: 'CEO & Founder',
      bio: 'Serial entrepreneur med 15+ års erfaring inden for SaaS og AI. Tidligere CTO hos 3 danske scaleups.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1hbiUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NTc3ODQ2MDJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
      socials: [
        { platform: 'LinkedIn', url: '#', icon: Linkedin },
        { platform: 'Twitter', url: '#', icon: Twitter }
      ]
    },
    {
      name: 'Maria Andersen',
      role: 'CTO',
      bio: 'AI ekspert og software arkitekt. PhD i Machine Learning fra DTU. Tidligere Principal Engineer hos Microsoft.',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b367?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHdvbWFuJTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc1Nzc4NDYwOXww&ixlib=rb-4.1.0&q=80&w=1080',
      socials: [
        { platform: 'LinkedIn', url: '#', icon: Linkedin },
        { platform: 'Github', url: '#', icon: Github }
      ]
    },
    {
      name: 'Mikkel Jensen',
      role: 'VP of Product',
      bio: 'Product visioner med passion for UX/UI. 10+ års erfaring med B2B SaaS produkter. Tidligere hos Zendesk.',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1hbiUyMHByb2Zlc3Npb25hbCUyMHNtaWxpbmd8ZW58MXx8fHwxNzU3Nzg0NjE2fDA&ixlib=rb-4.1.0&q=80&w=1080',
      socials: [
        { platform: 'LinkedIn', url: '#', icon: Linkedin },
        { platform: 'Twitter', url: '#', icon: Twitter }
      ]
    }
  ];

  const milestones = [
    { year: '2019', title: 'Tekup grundlagt', description: 'Starten på rejsen med fokus på SMB IT-automation' },
    { year: '2020', title: 'Første 100 kunder', description: 'Hurtig vækst og produktmarkedsfit opnået' },
    { year: '2021', title: 'Serie A', description: '€5M rejst til international expansion' },
    { year: '2022', title: 'AI Platform lanceret', description: 'Jarvis AI introduceret til markedet' },
    { year: '2023', title: '10.000+ kunder', description: 'Markedsleder i Norden inden for SMB automation' },
    { year: '2024', title: 'Global expansion', description: 'Expansion til UK, Tyskland og Nederlandene' }
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
        {/* Hero Section */}
        <section className="pt-32 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center space-y-8"
            >
              <Badge className="bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-400/30 text-purple-300 backdrop-blur-sm px-6 py-3">
                <Award className="w-4 h-4 mr-2" />
                Danmarks førende SaaS automation platform
              </Badge>
              
              <h1 className="text-4xl md:text-6xl font-bold text-white max-w-4xl mx-auto">
                Vi bygger fremtidens
                <br />
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  IT-infrastruktur
                </span>
              </h1>
              
              <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Tekup startede med en simpel vision: at give små og mellemstore virksomheder 
                adgang til enterprise-niveau IT-automation og AI-teknologi. I dag betjener vi 
                10.000+ virksomheder i 50+ lande.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0 px-8 shadow-lg hover:shadow-xl hover:shadow-cyan-500/25 rounded-xl">
                    Læs vores historie
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" size="lg" className="bg-white/10 border border-white/20 text-white backdrop-blur-sm px-8 hover:bg-white/20 rounded-xl">
                    Se karriere muligheder
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                >
                  <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-white/10 text-center p-8 hover-lift smooth-3d">
                    <CardContent className="space-y-4">
                      <div className="w-16 h-16 mx-auto bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-xl flex items-center justify-center">
                        <stat.icon className="w-8 h-8 text-cyan-400" />
                      </div>
                      <div className="text-3xl font-bold text-white">{stat.value}</div>
                      <div className="text-gray-300">{stat.label}</div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                <div className="space-y-6">
                  <Badge className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-cyan-300 backdrop-blur-sm">
                    <Target className="w-4 h-4 mr-2" />
                    Vores Mission
                  </Badge>
                  <h2 className="text-3xl md:text-4xl font-bold text-white">
                    Demokratisering af 
                    <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"> AI-teknologi</span>
                  </h2>
                  <p className="text-lg text-gray-300 leading-relaxed">
                    Vi tror på, at alle virksomheder - uanset størrelse - fortjener adgang til 
                    de samme avancerede IT-værktøjer som de største corporations. Vores mission 
                    er at bygge bro mellem enterprise-teknologi og SMB-virkeligheden.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    'Gøre AI tilgængeligt for alle virksomhedsstørrelser',
                    'Reducere kompleksiteten i IT-drift markant',
                    'Skabe værdi gennem intelligent automation',
                    'Bygge bæredygtige, skalerbare løsninger'
                  ].map((point, index) => (
                    <motion.div
                      key={point}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      viewport={{ once: true }}
                      className="flex items-center space-x-3"
                    >
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <span className="text-gray-200">{point}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl hover-lift smooth-3d">
                  <CardContent className="p-0">
                    <ImageWithFallback
                      src="https://images.unsplash.com/photo-1552664730-d307ca884978?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWFtJTIwd29yayUyMG9mZmljZSUyMGNvbGxhYm9yYXRpb258ZW58MXx8fHwxNzU3Nzg0NjMwfDA&ixlib=rb-4.1.0&q=80&w=1080"
                      alt="Tekup team collaboration"
                      className="w-full h-80 object-cover"
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center space-y-6 mb-16"
            >
              <Badge className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-400/30 text-emerald-300 backdrop-blur-sm px-4 py-2">
                <Heart className="w-4 h-4 mr-2" />
                Vores Værdier
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Hvad driver os hver dag
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Fire kerneprincipper der definerer hvordan vi arbejder, innoverer og behandler vores kunder
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                >
                  <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-white/10 h-full hover-lift smooth-3d">
                    <CardContent className="p-6 text-center space-y-4">
                      <div className={`w-16 h-16 mx-auto rounded-xl bg-gradient-to-br ${value.gradient}/20 flex items-center justify-center`}>
                        <value.icon className={`w-8 h-8 bg-gradient-to-br ${value.gradient} bg-clip-text text-transparent`} />
                      </div>
                      <h3 className="text-xl font-bold text-white">{value.title}</h3>
                      <p className="text-gray-300 leading-relaxed">{value.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center space-y-6 mb-16"
            >
              <Badge className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 text-blue-300 backdrop-blur-sm px-4 py-2">
                <Users className="w-4 h-4 mr-2" />
                Mød Teamet
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Mennesker bag teknologien
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Et team af serielle entrepreneurs, AI-eksperter og produktvisioner der brænder for at skabe værdi
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {teamMembers.map((member, index) => (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                >
                  <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10 overflow-hidden hover-lift smooth-3d">
                    <CardContent className="p-0">
                      <ImageWithFallback
                        src={member.image}
                        alt={member.name}
                        className="w-full h-64 object-cover"
                      />
                      <div className="p-6 space-y-4">
                        <div>
                          <h3 className="text-xl font-bold text-white">{member.name}</h3>
                          <p className="text-cyan-400 font-medium">{member.role}</p>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">{member.bio}</p>
                        <div className="flex space-x-3 pt-2">
                          {member.socials.map((social) => (
                            <motion.a
                              key={social.platform}
                              href={social.url}
                              className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center hover:border-cyan-400 transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <social.icon className="w-4 h-4 text-gray-400 hover:text-cyan-400" />
                            </motion.a>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center space-y-6 mb-16"
            >
              <Badge className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-400/30 text-orange-300 backdrop-blur-sm px-4 py-2">
                <TrendingUp className="w-4 h-4 mr-2" />
                Vores Rejse
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Fra startup til markedsleder
              </h2>
            </motion.div>

            <div className="relative">
              <div className="absolute left-1/2 transform -translate-x-1/2 w-px h-full bg-gradient-to-b from-cyan-500 to-purple-500"></div>
              <div className="space-y-12">
                {milestones.map((milestone, index) => (
                  <motion.div
                    key={milestone.year}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.6 }}
                    viewport={{ once: true }}
                    className={`flex items-center ${
                      index % 2 === 0 ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    <div className={`w-5/12 ${index % 2 === 0 ? 'text-right pr-8' : 'text-left pl-8'}`}>
                      <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-white/10 hover-lift smooth-3d">
                        <CardContent className="p-6">
                          <div className="text-2xl font-bold text-cyan-400 mb-2">{milestone.year}</div>
                          <div className="text-lg font-semibold text-white mb-2">{milestone.title}</div>
                          <div className="text-gray-300">{milestone.description}</div>
                        </CardContent>
                      </Card>
                    </div>
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full border-4 border-gray-900"></div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl">
                <CardContent className="p-12">
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                    Vil du være en del af vores rejse?
                  </h2>
                  <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                    Vi søger altid talentfulde mennesker der vil være med til at forme fremtiden 
                    for SMB automation og AI-teknologi.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0 px-8 shadow-lg hover:shadow-xl hover:shadow-cyan-500/25 rounded-xl">
                        Se ledige stillinger
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="outline" size="lg" className="bg-white/10 border border-white/20 text-white backdrop-blur-sm px-8 hover:bg-white/20 rounded-xl">
                        Kontakt os
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
}