'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Crown, 
  Users, 
  UserCheck, 
  Bot, 
  Smartphone,
  ArrowRight,
  CheckCircle,
  Star
} from 'lucide-react';
import { LoginForm } from '@/components/auth/LoginForm';

export function LandingPage() {
  const [showLogin, setShowLogin] = useState(false);

  const portals = [
    {
      icon: Crown,
      title: 'Owner Portal',
      description: 'Komplet business management med real-time analytics og team oversight',
      features: ['Business Intelligence', 'Team Performance', 'Financial Reports', 'Customer Analytics'],
      color: 'from-purple-500 to-purple-700',
      href: '/owner'
    },
    {
      icon: Users,
      title: 'Employee Portal', 
      description: 'Daglige opgaver, tidsregistrering og jobstatus for medarbejdere',
      features: ['Daily Assignments', 'Time Tracking', 'Job Checklists', 'Route Optimization'],
      color: 'from-blue-500 to-blue-700',
      href: '/employee'
    },
    {
      icon: UserCheck,
      title: 'Customer Portal',
      description: 'Self-service booking, fakturaer og kommunikation for kunder',
      features: ['Online Booking', 'Service History', 'Invoice Access', 'Direct Messaging'],
      color: 'from-green-500 to-green-700', 
      href: '/customer'
    }
  ];

  const features = [
    {
      icon: Bot,
      title: 'AI Friday Assistant',
      description: 'Intelligent chat assistant integreret i alle portaler med context-aware responses'
    },
    {
      icon: Smartphone,
      title: 'Mobile App',
      description: 'Offline-capable mobile app til medarbejdere med GPS tracking og photo upload'
    },
    {
      icon: CheckCircle,
      title: 'Quality Control',
      description: 'Komplet quality control system med checklists og customer satisfaction tracking'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">RendetaljeOS</h1>
            </div>
            <button
              onClick={() => setShowLogin(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Log ind
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Complete Operations
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {' '}Management System
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              RendetaljeOS konsoliderer alle dine forretningsprocesser til én sammenhængende platform. 
              Fra booking til fakturering - alt i ét system.
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-8">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span>Production Ready</span>
              <span>•</span>
              <span>Team Accessible</span>
              <span>•</span>
              <span>AI Powered</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Portals Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Tre Portaler - Ét System
            </h2>
            <p className="text-lg text-gray-600">
              Hver rolle får sin egen optimerede portal med AI Friday integration
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {portals.map((portal, index) => (
              <motion.div
                key={portal.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className={`h-2 bg-gradient-to-r ${portal.color}`} />
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${portal.color} rounded-lg flex items-center justify-center`}>
                      <portal.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">{portal.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-4">{portal.description}</p>
                  <ul className="space-y-2 mb-6">
                    {portal.features.map((feature) => (
                      <li key={feature} className="flex items-center space-x-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => setShowLogin(true)}
                    className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>Få adgang</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Avancerede Features
            </h2>
            <p className="text-lg text-gray-600">
              Moderne teknologi der gør dit team mere effektivt
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Klar til at komme i gang?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Dit team kan begynde at bruge RendetaljeOS med det samme
          </p>
          <button
            onClick={() => setShowLogin(true)}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Log ind nu
          </button>
        </div>
      </section>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <LoginForm onClose={() => setShowLogin(false)} />
          </div>
        </div>
      )}
    </div>
  );
}