'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Mail, CheckCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { makeAPIRequest } from '../utils/supabase/info';

interface NewsletterSignupProps {
  compact?: boolean;
  className?: string;
}

export function NewsletterSignup({ compact = false, className = '' }: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);

    try {
      await makeAPIRequest('/newsletter', {
        method: 'POST',
        body: JSON.stringify({
          email,
          name: name || '',
          source: 'footer_signup'
        }),
      });

      setIsSubscribed(true);
      toast.success('Tak for tilmeldingen!', {
        description: 'Du er nu tilmeldt vores newsletter med de seneste nyheder og updates.'
      });

      // Reset form after a short delay
      setTimeout(() => {
        setEmail('');
        setName('');
        setIsSubscribed(false);
      }, 3000);

    } catch (error: any) {
      console.error('Error subscribing to newsletter:', error);
      
      if (error.message.includes('already subscribed')) {
        toast.error('Email allerede tilmeldt', {
          description: 'Denne email er allerede tilmeldt vores newsletter.'
        });
      } else {
        toast.error('Fejl ved tilmelding', {
          description: 'Der opstod en fejl. Prøv igen senere.'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubscribed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`text-center space-y-4 p-6 ${className}`}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 10 }}
          className="w-16 h-16 mx-auto bg-gradient-to-r from-green-500 to-emerald-400 rounded-full flex items-center justify-center"
        >
          <CheckCircle className="w-8 h-8 text-white" />
        </motion.div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">Tak for tilmeldingen! 🎉</h3>
          <p className="text-sm text-gray-300">
            Du får snart en bekræftelse på <strong>{email}</strong>
          </p>
        </div>

        <Badge className="bg-green-500/20 text-green-400 border border-green-400/30">
          Newsletter aktiv
        </Badge>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className={className}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!compact && (
          <div className="space-y-2 text-center">
            <Badge className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-cyan-300 backdrop-blur-sm px-4 py-2">
              <Mail className="w-4 h-4 mr-2" />
              Newsletter
            </Badge>
            <h3 className="text-xl font-semibold text-white">
              Hold dig opdateret
            </h3>
            <p className="text-gray-300 text-sm">
              Få de seneste nyheder, produktopdateringer og eksklusive tilbud direkte i din indbakke.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {!compact && (
            <div className="space-y-2">
              <Label htmlFor="newsletter-name" className="text-gray-200 text-sm">
                Navn (valgfrit)
              </Label>
              <Input
                id="newsletter-name"
                type="text"
                placeholder="Dit navn"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:ring-cyan-500 focus:border-cyan-500 backdrop-blur-sm"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="newsletter-email" className="text-gray-200 text-sm">
              Email *
            </Label>
            <div className="flex space-x-2">
              <Input
                id="newsletter-email"
                type="email"
                placeholder="din@email.dk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:ring-cyan-500 focus:border-cyan-500 backdrop-blur-sm flex-1"
                required
              />
              <Button
                type="submit"
                disabled={!email || isSubmitting}
                className={`${
                  compact 
                    ? 'px-4' 
                    : 'px-6'
                } bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0 hover:shadow-lg hover:shadow-cyan-500/25 rounded-xl font-medium`}
              >
                {isSubmitting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : compact ? (
                  <ArrowRight className="w-4 h-4" />
                ) : (
                  <>
                    Tilmeld
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {!compact && (
          <p className="text-xs text-gray-400 text-center">
            Vi sender kun relevant indhold og respekterer din privatsfære. 
            Du kan afmelde dig når som helst.
          </p>
        )}
      </form>
    </motion.div>
  );
}