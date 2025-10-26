'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useStripe } from './StripeProvider';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner@2.0.3';
import { Check, Zap, Crown, Building2, Loader2 } from 'lucide-react';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  currency: string;
  description: string;
  features: string[];
  limitations?: string[];
  recommended?: boolean;
  stripePriceId?: string;
  icon: React.ComponentType<any>;
  maxUsers?: number;
  maxLeads?: number;
}

interface PricingCardProps {
  plan: PricingPlan;
  onSubscribe?: (plan: PricingPlan) => void;
  isCurrentPlan?: boolean;
  isPopular?: boolean;
}

export function PricingCard({ plan, onSubscribe, isCurrentPlan, isPopular }: PricingCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { stripe } = useStripe();
  const { user, isAuthenticated } = useAuth();

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      toast.error('Du skal være logget ind for at abonnere');
      return;
    }

    if (!stripe || !plan.stripePriceId) {
      toast.error('Betalingssystem ikke tilgængeligt');
      return;
    }

    setIsLoading(true);

    try {
      // Call backend to create checkout session
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('tekup_access_token')}`
        },
        body: JSON.stringify({
          priceId: plan.stripePriceId,
          planId: plan.id,
          userId: user?.id,
          successUrl: `${window.location.origin}/dashboard?subscription=success`,
          cancelUrl: `${window.location.origin}/pricing?subscription=cancelled`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();

      // Redirect to Stripe Checkout
      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        throw new Error(error.message);
      }

    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Der opstod en fejl. Prøv igen senere.');
    } finally {
      setIsLoading(false);
    }

    onSubscribe?.(plan);
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative ${isPopular ? 'scale-105' : ''}`}
    >
      <Card className={`relative h-full border-2 transition-all duration-300 ${
        isPopular 
          ? 'border-[var(--color-tekup-accent-fallback)] shadow-lg shadow-[var(--color-tekup-accent-fallback)]/20' 
          : 'border-border hover:border-[var(--color-tekup-primary-fallback)]'
      } ${isCurrentPlan ? 'bg-[var(--color-tekup-surface-fallback)]' : 'bg-card'}`}>
        
        {/* Popular badge */}
        {isPopular && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-gradient-to-r from-[var(--color-tekup-primary-fallback)] to-[var(--color-tekup-accent-fallback)] text-white px-4 py-1">
              <Crown className="w-3 h-3 mr-1" />
              Mest populær
            </Badge>
          </div>
        )}

        {/* Current plan badge */}
        {isCurrentPlan && (
          <div className="absolute -top-3 right-4">
            <Badge className="bg-[var(--color-tekup-success-fallback)] text-white">
              <Check className="w-3 h-3 mr-1" />
              Aktuel plan
            </Badge>
          </div>
        )}

        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 w-12 h-12 bg-gradient-to-br from-[var(--color-tekup-primary-fallback)] to-[var(--color-tekup-accent-fallback)] rounded-xl flex items-center justify-center">
            <plan.icon className="w-6 h-6 text-white" />
          </div>
          
          <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
          <p className="text-muted-foreground text-sm mt-2">{plan.description}</p>
          
          <div className="mt-4">
            <div className="flex items-baseline justify-center">
              <span className="text-3xl font-bold">{formatPrice(plan.price, plan.currency)}</span>
              <span className="text-muted-foreground ml-1">/{plan.interval === 'month' ? 'md' : 'år'}</span>
            </div>
            {plan.interval === 'year' && (
              <p className="text-sm text-[var(--color-tekup-success-fallback)] mt-1">
                Spar {formatPrice(plan.price * 12 * 0.2, plan.currency)} årligt
              </p>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Usage limits */}
          {(plan.maxUsers || plan.maxLeads) && (
            <div className="space-y-2">
              {plan.maxUsers && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Brugere:</span>
                  <span className="font-medium">{plan.maxUsers === -1 ? 'Ubegrænset' : plan.maxUsers}</span>
                </div>
              )}
              {plan.maxLeads && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Leads/måned:</span>
                  <span className="font-medium">{plan.maxLeads === -1 ? 'Ubegrænset' : plan.maxLeads.toLocaleString('da-DK')}</span>
                </div>
              )}
            </div>
          )}

          {/* Features */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Inkluderet:</h4>
            <ul className="space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <Check className="w-4 h-4 text-[var(--color-tekup-success-fallback)] mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Limitations */}
          {plan.limitations && plan.limitations.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Begrænsninger:</h4>
              <ul className="space-y-2">
                {plan.limitations.map((limitation, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="w-4 h-4 border border-muted-foreground rounded-full mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{limitation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA Button */}
          <div className="pt-4">
            <Button
              onClick={handleSubscribe}
              disabled={isLoading || isCurrentPlan}
              className={`w-full ${
                isPopular 
                  ? 'bg-gradient-to-r from-[var(--color-tekup-primary-fallback)] to-[var(--color-tekup-accent-fallback)] hover:opacity-90' 
                  : isCurrentPlan 
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Behandler...
                </>
              ) : isCurrentPlan ? (
                'Aktuel plan'
              ) : plan.price === 0 ? (
                'Start gratis'
              ) : (
                'Vælg plan'
              )}
            </Button>
          </div>

          {/* Trial info */}
          {plan.price > 0 && !isCurrentPlan && (
            <p className="text-xs text-center text-muted-foreground">
              14 dages gratis prøveperiode • Ingen binding • Stop når som helst
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Predefined pricing plans for Danish cleaning businesses
export const tekupPricingPlans: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 0,
    interval: 'month',
    currency: 'DKK',
    description: 'Perfekt til små rengøringsvirksomheder der kommer i gang',
    icon: Zap,
    maxUsers: 1,
    maxLeads: 50,
    features: [
      'Basis CRM funktioner',
      'Op til 50 leads/måned',
      'Email integration',
      'Basis rapporter',
      'Mobil app adgang',
      'Email support'
    ],
    limitations: [
      'Kun 1 bruger',
      'Begrænset til 50 leads/måned',
      'Basis funktioner'
    ],
    stripePriceId: 'price_starter_monthly'
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 299,
    interval: 'month',
    currency: 'DKK',
    description: 'For voksende rengøringsvirksomheder med flere ansatte',
    icon: Building2,
    maxUsers: 5,
    maxLeads: 500,
    recommended: true,
    features: [
      'Alle Starter funktioner',
      'Op til 500 leads/måned',
      'AI lead scoring',
      'Automatisk lead kvalificering',
      'Team samarbejde (5 brugere)',
      'Kalender integration',
      'Avancerede rapporter',
      'Prioriteret support',
      'Jarvis AI assistent (basis)'
    ],
    stripePriceId: 'price_professional_monthly'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 599,
    interval: 'month',
    currency: 'DKK',
    description: 'For store rengøringsvirksomheder med komplekse behov',
    icon: Crown,
    maxUsers: -1, // Unlimited
    maxLeads: -1, // Unlimited
    features: [
      'Alle Professional funktioner',
      'Ubegrænset leads og brugere',
      'Fuld Jarvis AI suite',
      'Avanceret automatisering',
      'Custom integrationer',
      'Dedicated account manager',
      'White-label muligheder',
      'API adgang',
      'SLA garanti',
      'Telefon support'
    ],
    stripePriceId: 'price_enterprise_monthly'
  }
];