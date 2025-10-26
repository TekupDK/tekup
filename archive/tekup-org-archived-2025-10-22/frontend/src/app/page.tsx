import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ChefHat, 
  BarChart3, 
  Users, 
  Clock, 
  Star, 
  ArrowRight,
  CheckCircle,
  Smartphone,
  Globe,
  Shield
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const features = [
  {
    icon: ChefHat,
    title: 'Menu Management',
    description: 'Create and manage digital menus with real-time updates, pricing, and availability.',
  },
  {
    icon: BarChart3,
    title: 'AI Analytics',
    description: 'Get intelligent insights about your restaurant performance and customer preferences.',
  },
  {
    icon: Users,
    title: 'Customer Management',
    description: 'Track customer orders, preferences, and build lasting relationships.',
  },
  {
    icon: Clock,
    title: 'Order Tracking',
    description: 'Real-time order management and kitchen workflow optimization.',
  },
  {
    icon: Smartphone,
    title: 'Mobile Ready',
    description: 'Fully responsive design that works perfectly on all devices.',
  },
  {
    icon: Shield,
    title: 'Secure & Reliable',
    description: 'Enterprise-grade security with 99.9% uptime guarantee.',
  },
];

const benefits = [
  'Increase revenue by up to 30%',
  'Reduce operational costs',
  'Improve customer satisfaction',
  'Streamline kitchen operations',
  'Real-time business insights',
  'Multi-location management',
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ChefHat className="h-8 w-8 text-tekup-600" />
            <span className="text-2xl font-bold tekup-gradient-text">TekUp</span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-gray-600 hover:text-tekup-600 transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-gray-600 hover:text-tekup-600 transition-colors">
              Pricing
            </Link>
            <Link href="#about" className="text-gray-600 hover:text-tekup-600 transition-colors">
              About
            </Link>
            <Link href="/auth/signin">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button variant="tekup">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              The Future of
              <span className="tekup-gradient-text block">Restaurant Management</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Streamline your restaurant operations with AI-powered analytics, 
              digital menu management, and real-time insights that drive growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="xl" variant="tekup" className="w-full sm:w-auto">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button size="xl" variant="outline" className="w-full sm:w-auto">
                  Watch Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools to manage every aspect of your restaurant business
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="card-hover border-0 shadow-lg">
                  <CardHeader>
                    <div className="w-12 h-12 bg-tekup-100 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-tekup-600" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-tekup-600 to-tekup-700 text-white">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Why Choose TekUp?</h2>
              <p className="text-xl mb-8 text-tekup-100">
                Join thousands of restaurants that have transformed their operations with TekUp
              </p>
              <div className="grid gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
                    <span className="text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 glass-effect">
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">10,000+</div>
                  <div className="text-tekup-200 mb-6">Restaurants Trust TekUp</div>
                  <div className="flex justify-center space-x-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <div className="text-tekup-200">4.9/5 Customer Rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Restaurant?</h2>
            <p className="text-xl text-gray-600 mb-8">
              Start your free trial today and see the difference TekUp can make for your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="xl" variant="tekup" className="w-full sm:w-auto">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="xl" variant="outline" className="w-full sm:w-auto">
                  Contact Sales
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <ChefHat className="h-8 w-8 text-tekup-400" />
                <span className="text-2xl font-bold">TekUp</span>
              </div>
              <p className="text-gray-400">
                The future of restaurant management is here.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#integrations" className="hover:text-white transition-colors">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="/status" className="hover:text-white transition-colors">Status</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 TekUp. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}