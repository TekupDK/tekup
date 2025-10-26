'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: "Hvor hurtigt kan vi komme i gang med Tekup?",
    answer: "De fleste kunder er oppe at køre inden for 24 timer. Vores onboarding team hjælper med setup af integrationer, import af eksisterende data og training af jeres team. Vi har også AI-assisteret setup der gør processen endnu hurtigere."
  },
  {
    question: "Hvilke systemer kan Tekup integrere med?",
    answer: "Tekup integrerer med 200+ populære business tools inklusiv Gmail, Outlook, HubSpot, Salesforce, Microsoft Teams, Slack, QuickBooks, og mange flere. Vores API gør det også muligt at bygge custom integrationer."
  },
  {
    question: "Hvor sikre er vores data hos Tekup?",
    answer: "Vi tager sikkerhed meget seriøst. Alle data er krypteret både i transit og at rest med enterprise-grade AES-256 kryptering. Vi er GDPR-compliant, ISO 27001 certificeret, og vores servere er hostede i EU. Vi gennemgår regelmæssige sikkerhedsaudits."
  },
  {
    question: "Hvad koster Tekup per måned?",
    answer: "Vores priser starter fra 299 kr/måned for op til 5 brugere. Vi har fleksible plans der skalerer med jeres business. Alle plans inkluderer AI lead scoring, CRM, automation, og support. Se vores pricing sektion for detaljerede priser."
  },
  {
    question: "Kan vi teste Tekup gratis?",
    answer: "Ja! Vi tilbyder en 14-dages gratis prøveperiode uden binding. I får adgang til alle features og kan importere jeres eksisterende data. Vores support team hjælper jer med at komme i gang, så I får mest muligt ud af prøveperioden."
  },
  {
    question: "Hvad hvis vi allerede bruger et andet CRM?",
    answer: "Intet problem! Vi hjælper med at migrere jeres data fra næsten alle CRM systemer inklusiv HubSpot, Salesforce, Pipedrive, og mange andre. Vores migration team sørger for at ingen data går tabt i processen."
  },
  {
    question: "Hvordan fungerer AI lead scoring?",
    answer: "Vores Jarvis AI analyserer 100+ datapunkter om hver lead inklusiv website adfærd, email engagement, company data, social signals og meget mere. AI'en lærer af jeres historiske data og giver hver lead en score fra 0-100 baseret på sandsynligheden for konvertering."
  },
  {
    question: "Får vi support på dansk?",
    answer: "Ja! Vi har dansk support team der er tilgængelige via live chat, email og telefon. Support er inkluderet i alle plans og vi stræber efter at svare inden for 2 timer på hverdage. Vi tilbyder også video onboarding på dansk."
  }
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="section-padding bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, var(--color-tekup-primary-fallback) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="container-tekup relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[var(--color-tekup-primary-fallback)] to-[var(--color-tekup-accent-fallback)] rounded-2xl mb-6">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Ofte stillede spørgsmål
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Har du spørgsmål om Tekup? Her finder du svar på de mest almindelige spørgsmål fra vores kunder.
          </p>
        </motion.div>

        {/* FAQ Grid */}
        <div className="max-w-4xl mx-auto">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="mb-6"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-tekup-primary-fallback)] focus:ring-opacity-50"
                >
                  <h3 className="text-lg font-semibold text-foreground pr-8">
                    {faq.question}
                  </h3>
                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown className="w-6 h-6 text-[var(--color-tekup-primary-fallback)]" />
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-8 pb-6 text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-[var(--color-tekup-primary-fallback)] to-[var(--color-tekup-accent-fallback)] rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Kunne ikke finde svar på dit spørgsmål?
            </h3>
            <p className="text-lg mb-6 opacity-90">
              Vores support team er klar til at hjælpe dig.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-[var(--color-tekup-primary-fallback)] px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
              >
                Kontakt support
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border-2 border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white hover:text-[var(--color-tekup-primary-fallback)] transition-colors"
              >
                Book demo
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}