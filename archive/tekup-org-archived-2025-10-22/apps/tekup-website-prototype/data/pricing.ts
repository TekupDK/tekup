export type Plan = {
  name: string
  price: string
  cta: string
  highlight?: boolean
  features: string[]
}

export const PLANS: Plan[] = [
  { name: 'Starter', price: '€49/m', cta: 'Start Gratis Trial', features: ['Op til 5 brugere', 'Basis CRM integration', 'Lead scoring (basis)', 'Email support', 'Jarvis (Mock)', 'GDPR compliance'] },
  { name: 'Professional', price: '€149/m', cta: 'Start Gratis Trial', highlight: true, features: ['Op til 25 brugere', 'Avanceret CRM integration', 'AI lead scoring', 'Smart distribution', 'Analytics', 'Jarvis (Real)', 'A/B testing', 'API adgang'] },
  { name: 'Enterprise', price: 'Custom', cta: 'Kontakt Sales', features: ['Unlimited brugere', 'Custom integrationer', 'White-label', 'Dedicated Jarvis', 'Advanced analytics', '24/7 support', 'SLA'] },
]
