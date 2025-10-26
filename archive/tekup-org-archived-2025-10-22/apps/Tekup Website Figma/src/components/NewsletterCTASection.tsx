'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  Mail, 
  ArrowRight, 
  CheckCircle, 
  Star,
  Users,
  TrendingUp,
  Zap,
  Gift
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

const benefits = [
  {
    icon: TrendingUp,
    title: "Lead Optimering Tips",
    description: "Månedlige guides til at øge konvertering"
  },
  {
    icon: Zap,
    title: "Nye Features Først",
    description: "Få adgang til beta features før alle andre"
  },
  {
    icon: Star,
    title: "Success Stories",
    description: "Lær af andre SMB'ers resultater"
  },
  {
    icon: Gift,
    title: "Eksklusiv Indhold",
    description: "Templates, checklists og workflows"
  }
];

const testimonial = {
  quote: "Tekup's newsletter har hjulpet os med at øge vores lead konvertering med 67% på bare 3 måneder. De praktiske tips er guld værd!",
  author: "Maria Hansen",
  company: "Nordic Clean ApS",
  role: "Marketing Director"
};

export function NewsletterCTASection() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Indtast venligst din email adresse');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubscribed(true);
      setIsSubmitting(false);
      toast.success('Velkommen til Tekup newsletter! 🎉', {
        description: 'Tjek din email for bekræftelse'
      });
    }, 1500);
  };

  if (isSubscribed) {
    return (
      <section className="section-padding bg-gradient-to-br from-[var(--color-tekup-primary-fallback)] to-[var(--color-tekup-accent-fallback)] relative overflow-hidden">
        <div className="container-tekup relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center text-white"
          >
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tak for din tilmelding! 🎉
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Du vil modtage vores første newsletter inden for 24 timer med eksklusivt indhold om lead optimering og AI-drevet CRM.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-white text-[var(--color-tekup-primary-fallback)] hover:bg-gray-100 px-8 py-6 text-lg font-semibold"
                onClick={() => {
                  toast.success('Demo booking åbnet!');
                }}
              >
                Book gratis demo nu
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="section-padding bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <motion.div 
          className="absolute top-20 left-10 w-72 h-72 bg-[var(--color-tekup-primary-fallback)] rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
          }}
        />
        <motion.div 
          className="absolute bottom-20 right-10 w-96 h-96 bg-[var(--color-tekup-accent-fallback)] rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ 
            duration: 10,
            repeat: Infinity,
          }}
        />
      </div>

      <div className="container-tekup relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column - Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[var(--color-tekup-primary-fallback)] to-[var(--color-tekup-accent-fallback)] rounded-2xl mb-6">
              <Mail className="w-8 h-8 text-white" />
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Få mere ud af din CRM
            </h2>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Tilmeld dig vores newsletter og få månedlige tips, tricks og strategier til at øge din lead konvertering med AI-drevet CRM.
            </p>

            {/* Benefits */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-start space-x-3"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-tekup-primary-fallback)]/20 to-[var(--color-tekup-accent-fallback)]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-5 h-5 text-[var(--color-tekup-primary-fallback)]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">{benefit.title}</h4>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Newsletter Form */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              onSubmit={handleSubmit}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    type="email"
                    placeholder="Indtast din email adresse"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 text-lg border-gray-300 dark:border-gray-600 focus:border-[var(--color-tekup-primary-fallback)] focus:ring-[var(--color-tekup-primary-fallback)]"
                    disabled={isSubmitting}
                  />
                </div>
                <Button 
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-[var(--color-tekup-primary-fallback)] to-[var(--color-tekup-accent-fallback)] text-white h-12 px-8 font-semibold hover:shadow-lg transition-all duration-300"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Tilmelder...
                    </div>
                  ) : (
                    <>
                      Tilmeld mig
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Gratis tilmelding. Afmeld når som helst. Vi spammer ikke.
              </p>
            </motion.form>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex items-center space-x-4 mt-6 text-sm text-muted-foreground"
            >
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>8,500+ abonnenter</span>
              </div>
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="ml-1">4.8/5 rating</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Testimonial */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="bg-gradient-to-br from-[var(--color-tekup-primary-fallback)] to-[var(--color-tekup-accent-fallback)] rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative">
                {/* Quote Icon */}
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                  </svg>
                </div>

                <blockquote className="text-lg md:text-xl leading-relaxed mb-8 opacity-95">
                  "{testimonial.quote}"
                </blockquote>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="font-bold text-lg">
                      {testimonial.author.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.author}</div>
                    <div className="opacity-75 text-sm">
                      {testimonial.role}, {testimonial.company}
                    </div>
                  </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-white/5 rounded-full blur-xl" />
              </div>
            </div>

            {/* Additional Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-8 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <h4 className="font-bold text-foreground mb-4">
                Hvad venter dig i næste newsletter:
              </h4>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-muted-foreground">10 AI prompts til bedre lead kvalificering</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-muted-foreground">CRM automation workflow templates</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-muted-foreground">Case study: 150% ROI på 6 måneder</span>
                </li>
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}