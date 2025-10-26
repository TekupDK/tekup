'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  MicrophoneIcon, 
  ChartBarIcon, 
  ShieldCheckIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  PlayCircleIcon
} from '@heroicons/react/24/outline'

export default function HomePage() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleNewsletterSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Integrate with ConvertKit API
    setIsSubmitted(true)
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="container mx-auto px-6 py-20">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-8">
              AI Transformation for <span className="text-yellow-300">Danish SMVs</span>
            </h1>
            <p className="text-xl md:text-2xl mb-10 opacity-90 leading-relaxed">
              Fra voice agents til multi-business automation - få AI til at arbejde for din virksomhed
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <motion.a 
                href="#consultation"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-blue-600 px-10 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all shadow-lg"
              >
                Book Gratis AI Assessment
              </motion.a>
              <motion.a 
                href="#demo"
                whileHover={{ scale: 1.05 }}
                className="border-2 border-white px-10 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all flex items-center gap-2"
              >
                <PlayCircleIcon className="w-5 h-5" />
                Se Demo
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="max-w-6xl mx-auto"
          >
            <h2 className="text-4xl font-bold text-center mb-12">Er Din Virksomhed Klar Til AI?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Manual Processer",
                  description: "Spild timer på gentagne opgaver der kunne automatiseres",
                  color: "red",
                  stat: "15+ timer/uge"
                },
                {
                  title: "Fragmenteret Data", 
                  description: "Information spredt på tværs af systemer uden sammenhæng",
                  color: "yellow",
                  stat: "5+ systemer"
                },
                {
                  title: "Manglende Insights",
                  description: "Kan ikke se mønstre på tværs af dine forretningsområder", 
                  color: "orange",
                  stat: "€10K+ skjult"
                }
              ].map((problem, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className={`p-8 bg-${problem.color}-50 rounded-xl border border-${problem.color}-200`}
                >
                  <h3 className={`text-xl font-semibold mb-4 text-${problem.color}-700`}>
                    {problem.title}
                  </h3>
                  <p className="text-gray-700 mb-4">{problem.description}</p>
                  <div className={`text-2xl font-bold text-${problem.color}-600`}>
                    {problem.stat}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="max-w-7xl mx-auto"
          >
            <h2 className="text-4xl font-bold text-center mb-16">AI Transformation Services</h2>
            
            {/* Consulting Services */}
            <div className="mb-16">
              <h3 className="text-2xl font-semibold mb-8 text-center">Consulting Services</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  {
                    icon: <ChartBarIcon className="w-8 h-8" />,
                    title: "AI Assessment",
                    description: "Identificer automation muligheder i din virksomhed",
                    price: "€5.000",
                    duration: "1 uge",
                    features: ["Proces analyse", "AI implementation plan", "Tool anbefalinger", "ROI projektion"],
                    popular: false
                  },
                  {
                    icon: <MicrophoneIcon className="w-8 h-8" />,
                    title: "Voice Agent Setup", 
                    description: "Custom danske voice commands til din business",
                    price: "€15.000",
                    duration: "2 uger",
                    features: ["Dansk voice processing", "Business-specific commands", "System integration", "Staff training"],
                    popular: true
                  },
                  {
                    icon: <ChartBarIcon className="w-8 h-8" />,
                    title: "Multi-Business Dashboard",
                    description: "Unified analytics på tværs af alle dine businesses", 
                    price: "€15.000",
                    duration: "2 uger",
                    features: ["Cross-business analytics", "Custom KPI tracking", "Mobile-responsive", "Real-time updates"],
                    popular: false
                  },
                  {
                    icon: <ArrowPathIcon className="w-8 h-8" />,
                    title: "AI Transformation",
                    description: "Komplet AI makeover af dine business processer",
                    price: "€25.000", 
                    duration: "1 måned",
                    features: ["Full workflow automation", "AI agent deployment", "Staff training program", "3 måneders support"],
                    popular: false
                  }
                ].map((service, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className={`bg-white p-8 rounded-xl shadow-lg relative ${
                      service.popular ? 'border-2 border-blue-500 transform scale-105' : ''
                    }`}
                  >
                    {service.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                          MEST POPULÆR
                        </span>
                      </div>
                    )}
                    <div className="text-blue-600 mb-4">{service.icon}</div>
                    <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
                    <p className="text-gray-600 mb-6">{service.description}</p>
                    <div className="text-3xl font-bold text-blue-600 mb-2">{service.price}</div>
                    <div className="text-sm text-gray-500 mb-6">{service.duration} levering</div>
                    <ul className="space-y-2 mb-8">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm">
                          <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                      Book Konsultation
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Micro-SaaS Products */}
            <div>
              <h3 className="text-2xl font-semibold mb-8 text-center">Micro-SaaS Products</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  {
                    icon: <MicrophoneIcon className="w-8 h-8" />,
                    title: "VoiceDK",
                    description: "Danish voice command processor for any business",
                    price: "€49/måned",
                    features: ["1000 commands/måned", "Danish language optimized", "Easy API integration", "Business command library"],
                    status: "Coming Soon"
                  },
                  {
                    icon: <ChartBarIcon className="w-8 h-8" />,
                    title: "MultiDash", 
                    description: "One dashboard for all your businesses",
                    price: "€99/måned",
                    features: ["Unlimited businesses", "50+ integrations", "Real-time analytics", "Custom KPIs"],
                    status: "Beta"
                  },
                  {
                    icon: <ShieldCheckIcon className="w-8 h-8" />,
                    title: "ComplianceBot",
                    description: "Automated GDPR & NIS2 compliance monitoring",
                    price: "€199/måned", 
                    features: ["Daily compliance scans", "Automated reporting", "Risk assessment", "Audit trails"],
                    status: "Coming Soon"
                  },
                  {
                    icon: <ArrowPathIcon className="w-8 h-8" />,
                    title: "CrossSync",
                    description: "Customer data sync across all your systems",
                    price: "€79/måned",
                    features: ["Smart customer matching", "Real-time sync", "Conflict resolution", "Journey tracking"],
                    status: "Coming Soon"
                  }
                ].map((product, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="bg-white p-8 rounded-xl shadow-lg"
                  >
                    <div className="text-purple-600 mb-4">{product.icon}</div>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-semibold">{product.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        product.status === 'Beta' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {product.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-6">{product.description}</p>
                    <div className="text-2xl font-bold text-purple-600 mb-6">{product.price}</div>
                    <ul className="space-y-2 mb-8">
                      {product.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm">
                          <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full py-3 rounded-lg font-semibold transition ${
                        product.status === 'Beta' 
                          ? 'bg-purple-600 text-white hover:bg-purple-700' 
                          : 'bg-gray-200 text-gray-600 cursor-not-allowed'
                      }`}
                      disabled={product.status !== 'Beta'}
                    >
                      {product.status === 'Beta' ? 'Start Free Trial' : 'Join Waitlist'}
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="max-w-6xl mx-auto"
          >
            <h2 className="text-4xl font-bold text-center mb-16">Proven Results</h2>
            <div className="grid md:grid-cols-2 gap-12">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="p-8 bg-green-50 rounded-xl border border-green-200"
              >
                <h3 className="text-2xl font-semibold mb-4">Restaurant Chain</h3>
                <p className="text-gray-700 mb-6">Implementerede voice ordering system og inventory management for dansk restaurant kæde</p>
                <div className="space-y-3">
                  <div className="flex items-center text-green-600 font-semibold">
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    40% reduction i order processing tid
                  </div>
                  <div className="flex items-center text-green-600 font-semibold">
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    25% mindre inventory waste
                  </div>
                  <div className="flex items-center text-green-600 font-semibold">
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    €8.000/måned øget revenue
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="p-8 bg-blue-50 rounded-xl border border-blue-200"
              >
                <h3 className="text-2xl font-semibold mb-4">Service Business</h3>
                <p className="text-gray-700 mb-6">Multi-location dashboard og automated customer communication for professionel service virksomhed</p>
                <div className="space-y-3">
                  <div className="flex items-center text-blue-600 font-semibold">
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    60% faster customer response
                  </div>
                  <div className="flex items-center text-blue-600 font-semibold">
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    Unified view af alle locations
                  </div>
                  <div className="flex items-center text-blue-600 font-semibold">
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    €12.000/måned efficiency gains
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-700 text-white">
        <div className="container mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-4xl font-bold mb-6">AI-First Entrepreneur Newsletter</h2>
            <p className="text-xl mb-8 opacity-90">
              Weekly insights om AI development, multi-business automation og real case studies
            </p>
            
            {!isSubmitted ? (
              <form onSubmit={handleNewsletterSignup} className="max-w-md mx-auto">
                <div className="flex gap-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Din email adresse"
                    className="flex-1 px-6 py-4 rounded-lg text-gray-900 text-lg"
                    required
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition"
                  >
                    Join Newsletter
                  </motion.button>
                </div>
                <p className="text-sm mt-4 opacity-75">
                  Gratis insights • Ingen spam • Unsubscribe når som helst
                </p>
              </form>
            ) : (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
              >
                <CheckCircleIcon className="w-16 h-16 mx-auto mb-4 text-green-400" />
                <h3 className="text-2xl font-semibold mb-2">Tak for tilmeldingen!</h3>
                <p className="text-lg opacity-90">Du modtager første newsletter på fredag</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="consultation" className="py-20 bg-white">
        <div className="container mx-auto px-6 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-4xl font-bold mb-8">Klar Til At Transformere Din Business?</h2>
            <p className="text-xl mb-12 text-gray-600">
              Book en gratis 30-minutters AI assessment og se hvordan AI kan revolutionere dine processer
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {[
                "Identificer automation opportunities",
                "Custom AI implementation plan", 
                "Realistic ROI beregning"
              ].map((benefit, index) => (
                <div key={index} className="flex items-center justify-center">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 mr-3" />
                  <span className="text-lg">{benefit}</span>
                </div>
              ))}
            </div>

            <motion.a
              href="https://calendly.com/tekup-ai/assessment"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-4 rounded-xl font-semibold text-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
            >
              Book Gratis Assessment
            </motion.a>
            
            <p className="text-sm mt-6 text-gray-500">
              Ingen forpligtelser • 30 minutters konsultation • Konkret action plan
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">Tekup AI Solutions</h3>
                <p className="text-gray-400 mb-4">Specialist i AI transformation for danske SMVs</p>
                <div className="space-y-2">
                  <a href="mailto:contact@tekup.dk" className="block text-gray-400 hover:text-white transition">
                    contact@tekup.dk
                  </a>
                  <a href="tel:+4512345678" className="block text-gray-400 hover:text-white transition">
                    +45 12 34 56 78
                  </a>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Services</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#services" className="hover:text-white transition">AI Assessment</a></li>
                  <li><a href="#services" className="hover:text-white transition">Voice Agents</a></li>
                  <li><a href="#services" className="hover:text-white transition">Multi-Business Dashboard</a></li>
                  <li><a href="#services" className="hover:text-white transition">Full Transformation</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Products</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white transition">VoiceDK</a></li>
                  <li><a href="#" className="hover:text-white transition">MultiDash</a></li>
                  <li><a href="#" className="hover:text-white transition">ComplianceBot</a></li>
                  <li><a href="#" className="hover:text-white transition">CrossSync</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Resources</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white transition">Newsletter</a></li>
                  <li><a href="#" className="hover:text-white transition">Case Studies</a></li>
                  <li><a href="#" className="hover:text-white transition">Blog</a></li>
                  <li><a href="#" className="hover:text-white transition">Documentation</a></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
              <p>&copy; 2024 Tekup AI Solutions. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}