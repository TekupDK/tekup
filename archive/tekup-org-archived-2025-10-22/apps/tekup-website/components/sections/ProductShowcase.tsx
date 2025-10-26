"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { trackEvent } from "@/components/Analytics"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

const features = [
  {
    id: "nis2",
    title: "NIS2 Compliance",
    subtitle: "Komplet efterlevelse på autopilot",
    description: "Automatisk gap-analyse og kontrolstyring der sikrer jeres virksomhed overholder alle NIS2-krav.",
    features: [
      "Automatisk risikovurdering",
      "Policy-templates og skabeloner", 
      "Kontinuerlig compliance-monitoring",
      "Audit-klar dokumentation"
    ],
    color: "from-blue-500 to-indigo-600",
    icon: "🛡️"
  },
  {
    id: "copilot",
    title: "Copilot Ready",
    subtitle: "Sikker AI-brug i jeres organisation", 
    description: "Implementer Microsoft Copilot sikkert med policies, governance og brugsovervågning.",
    features: [
      "AI-sikkerhedspolicies",
      "Data-beskyttelse og classification",
      "Brugsovervågning og analytics",
      "Kompetenceudvikling til medarbejdere"
    ],
    color: "from-purple-500 to-pink-600",
    icon: "🤖"
  },
  {
    id: "m365",
    title: "M365 Governance", 
    subtitle: "Optimér jeres Microsoft 365-miljø",
    description: "Kontinuerlige scans og forbedringsforslag til jeres Microsoft 365-setup og sikkerhedsindstillinger.",
    features: [
      "Security-scans og assessments",
      "Konfigurationsanbefalinger",
      "Compliance-dashboards",
      "Performance-optimering"
    ],
    color: "from-green-500 to-teal-600",
    icon: "⚙️"
  }
]

export function ProductShowcase() {
  const sectionRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    const ctx = gsap.context(() => {
      // Title animation
      gsap.fromTo(titleRef.current, {
        y: 50,
        opacity: 0
      }, {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: titleRef.current,
          start: "top 80%",
          end: "bottom 60%",
          toggleActions: "play none none reverse"
        }
      })

      // Cards stagger animation
      const cards = cardsRef.current?.children
      if (cards) {
        gsap.fromTo(Array.from(cards), {
          y: 100,
          opacity: 0,
          scale: 0.8
        }, {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: cardsRef.current,
            start: "top 75%",
            end: "bottom 25%",
            toggleActions: "play none none reverse"
          }
        })
      }

      // Parallax effect for cards
      if (cards) {
        Array.from(cards).forEach((card, index) => {
          gsap.to(card, {
            yPercent: -10 * (index + 1),
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 1
            }
          })
        })
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  const handleFeatureClick = (featureId: string) => {
    trackEvent('feature_clicked', { 
      feature: featureId,
      section: 'product_showcase'
    })
  }

  return (
    <section 
      ref={sectionRef}
      id="product-showcase" 
      className="py-20 bg-gray-50 overflow-hidden relative"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-10 w-72 h-72 rounded-full bg-gradient-to-r from-primary-400 to-accent-400 blur-3xl" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 rounded-full bg-gradient-to-r from-accent-400 to-primary-400 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 
            ref={titleRef}
            className="text-4xl md:text-5xl font-bold font-display mb-6"
          >
            <span className="gradient-text">TekUp Platform</span>
            <br />
            <span className="text-gray-700">Alt hvad I behøver for compliance</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Tre kraftfulde moduler der arbejder sammen for at sikre jeres digitale sikkerhed og efterlevelse.
          </p>
        </div>

        <div 
          ref={cardsRef}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
        >
          {features.map((feature) => (
            <div
              key={feature.id}
              className="group relative"
            >
              {/* Glass card effect */}
              <div className="glass-card p-8 rounded-2xl hover:scale-105 transition-all duration-500 cursor-pointer h-full bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl"
                   onClick={() => handleFeatureClick(feature.id)}
              >
                {/* Gradient border effect */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                
                {/* Content */}
                <div className="relative z-10">
                  {/* Icon and title */}
                  <div className="flex items-start space-x-4 mb-6">
                    <div className="text-4xl">{feature.icon}</div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                      <p className="text-sm font-medium text-primary-600 mb-4">{feature.subtitle}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 mb-6 leading-relaxed">{feature.description}</p>

                  {/* Feature list */}
                  <ul className="space-y-3 mb-6">
                    {feature.features.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-center text-sm text-gray-700">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center mr-3 flex-shrink-0">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <div className="flex items-center text-primary-600 font-medium group-hover:text-primary-700 transition-colors">
                    <span>Lær mere</span>
                    <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* Hover effect glow */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-5 blur-xl transition-opacity duration-500 -z-10`} />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center space-x-4 bg-white/60 backdrop-blur-sm border border-white/20 rounded-full px-8 py-4 shadow-lg">
            <span className="text-gray-700 font-medium">Klar til at komme i gang?</span>
            <a 
              href="/kontakt" 
              className="btn-premium text-white px-6 py-2 text-sm rounded-lg"
              onClick={() => trackEvent('cta_clicked', { location: 'product_showcase_bottom' })}
            >
              Book en demo
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
