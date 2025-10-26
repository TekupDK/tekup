"use client"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import React from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import { PLANS } from '@/data/pricing'
import { FAQS } from '@/data/faqs'

// Inline SVG icons replacing lucide-react for zero deps in prototype
const Icon = {
  ArrowRight: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  Shield: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  ),
  Zap: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Users: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  ),
  BarChart3: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  ),
  CheckCircle: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Bot: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  ),
  MessageSquare: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  ),
  Settings: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Play: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1M9 10v5a2 2 0 002 2h2a2 2 0 002-2v-5m-6 0h6"
      />
    </svg>
  ),
  Square: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
      />
    </svg>
  ),
}

export default function HomePage() {
  const { ArrowRight, Shield, Zap, Users, BarChart3, CheckCircle, Bot, MessageSquare, Settings, Play, Square } = Icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Navigation */}
      <nav className="glass-nav px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm">T</span>
            </div>
            <span className="text-xl font-semibold">Tekup</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-foreground/80 hover:text-foreground transition-colors">
              Hjem
            </a>
            <div className="relative group">
              <a href="#" className="text-foreground/80 hover:text-foreground transition-colors flex items-center">
                Produkt <span className="ml-1 rotate-90 inline-block"><ArrowRight /></span>
              </a>
            </div>
            <a href="#" className="text-foreground/80 hover:text-foreground transition-colors">
              Priser
            </a>
            <a href="#" className="text-foreground/80 hover:text-foreground transition-colors">
              Løsninger
            </a>
            <a href="#" className="text-foreground/80 hover:text-foreground transition-colors">
              Docs
            </a>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="hidden md:inline-flex">
              Log ind
            </Button>
            <ThemeToggle />
            <Button className="btn-3d">Start Gratis</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
              <span className="mr-2 inline-block w-4 h-4 align-middle"><Zap /></span>
              Ny: Jarvis AI Assistant er nu tilgængelig
            </Badge>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-balance">
              Unified IT Support,{' '}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                CRM og AI-assisterede
              </span>{' '}
              Leads for SMB'er
            </h1>

            {/* Subheading */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto text-pretty">
              Automatiser lead-kvalificering, integrer seamlessly med eksisterende CRM, og skalér sikkert med
              multi-tenant arkitektur. Trusted by 500+ SMB'er.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="btn-3d text-lg px-8 py-4">
                Start Gratis - Ingen Kreditkort
                <span className="ml-2 inline-block w-5 h-5 align-middle"><ArrowRight /></span>
              </Button>
              <Button size="lg" variant="outline" className="glass text-lg px-8 py-4 bg-transparent">
                Book 15-min Demo
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex flex-col items-center space-y-4">
              <p className="text-sm text-muted-foreground">Trusted by leading SMB'er</p>
              <div className="flex items-center space-x-8 opacity-60">
                {['TechCorp', 'DataFlow', 'CloudSync', 'NetSolutions'].map((brand) => (
                  <div key={brand} className="w-24 h-8 bg-muted rounded flex items-center justify-center text-xs font-medium">
                    {brand}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Background Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
        </div>
      </section>

  {/* Dashboard Preview */}
      <section className="px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="glass-card parallax-3d">
            <div className="aspect-video bg-gradient-to-br from-muted/50 to-muted/20 rounded-xl overflow-hidden relative">
              {/* Mock Dashboard Interface */}
              <div className="absolute inset-4 space-y-4">
                {/* Top Bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-primary/20 rounded-lg" />
                    <div className="space-y-1">
                      <div className="w-24 h-3 bg-foreground/20 rounded" />
                      <div className="w-16 h-2 bg-foreground/10 rounded" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-secondary/20 rounded-full" />
                    <div className="w-6 h-6 bg-primary/20 rounded-full" />
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="glass p-4 rounded-lg">
                      <div className="w-full h-2 bg-primary/20 rounded mb-2" />
                      <div className="w-3/4 h-4 bg-foreground/20 rounded" />
                    </div>
                  ))}
                </div>

                {/* Chart Area */}
                <div className="glass p-6 rounded-lg flex-1">
                  <div className="w-1/3 h-4 bg-foreground/20 rounded mb-4" />
                  <div className="h-32 bg-gradient-to-t from-primary/10 to-transparent rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Alt du behøver for at{' '}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">skalere dit IT-support</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Fra lead-generering til kundesupport - alt i én sikker, multi-tenant platform
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* CRM */}
            <div className="glass-card text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="inline-block w-8 h-8 text-white"><Users /></span>
              </div>
              <h3 className="text-2xl font-semibold mb-4">CRM Integration</h3>
              <p className="text-muted-foreground mb-6">Seamless integration med eksisterende CRM-systemer. Sync data automatisk og hold alt opdateret.</p>
              <div className="space-y-2">
                <div className="flex items-center justify-center text-sm"><span className="mr-2"><CheckCircle /></span>Automatisk data sync</div>
                <div className="flex items-center justify-center text-sm"><span className="mr-2"><CheckCircle /></span>Real-time opdateringer</div>
              </div>
            </div>
            {/* Lead Platform */}
            <div className="glass-card text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-secondary to-secondary/60 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="inline-block w-8 h-8 text-white"><BarChart3 /></span>
              </div>
              <h3 className="text-2xl font-semibold mb-4">Lead Platform</h3>
              <p className="text-muted-foreground mb-6">AI-drevet lead scoring og automatisk distribution til det rigtige team på det rigtige tidspunkt.</p>
              <div className="space-y-2">
                <div className="flex items-center justify-center text-sm"><span className="mr-2"><CheckCircle /></span>Smart lead scoring</div>
                <div className="flex items-center justify-center text-sm"><span className="mr-2"><CheckCircle /></span>Automatisk routing</div>
              </div>
            </div>
            {/* Security */}
            <div className="glass-card text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="inline-block w-8 h-8 text-white"><Shield /></span>
              </div>
              <h3 className="text-2xl font-semibold mb-4">Multi-tenant Sikkerhed</h3>
              <p className="text-muted-foreground mb-6">Isolerede tenants, secure by design. GDPR-compliant og enterprise-grade sikkerhed.</p>
              <div className="space-y-2">
                <div className="flex items-center justify-center text-sm"><span className="mr-2"><CheckCircle /></span>Data isolation</div>
                <div className="flex items-center justify-center text-sm"><span className="mr-2"><CheckCircle /></span>GDPR compliant</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lead Platform Deep Dive (condensed) */}
      <section className="px-6 py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 px-4 py-2"><span className="mr-2 inline-block w-4 h-4"><BarChart3 /></span>Lead Platform</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Intelligent Lead Platform - <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">Fra Prospect til Kunde</span></h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">Automatiser hele lead-processen med AI-drevet scoring, smart distribution og real-time analytics.</p>
          </div>
          {/* Lead scoring sample */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="space-y-6">
              <div className="flex items-center space-x-3"><div className="w-12 h-12 bg-secondary/60 rounded-xl flex items-center justify-center"><span className="text-white font-bold">1</span></div><h3 className="text-3xl font-bold">Lead Scoring</h3></div>
              <p className="text-lg text-muted-foreground">AI-drevet scoring baseret på adfærd, demografi og engagement. Prioritér automatisk de mest lovende leads.</p>
              <div className="space-y-3">
                {['Behavioral scoring', 'Demografisk analyse', 'Engagement tracking', 'Predictive analytics'].map((t) => (
                  <div key={t} className="flex items-center"><span className="mr-3"><CheckCircle /></span><span>{t}</span></div>
                ))}
              </div>
            </div>
            <div className="glass-card">
              <div className="space-y-3">
                {[
                  { name: 'TechCorp A/S', score: 95, status: 'Hot' },
                  { name: 'DataFlow Solutions', score: 87, status: 'Warm' },
                  { name: 'CloudSync ApS', score: 72, status: 'Qualified' },
                ].map((lead) => (
                  <div key={lead.name} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                    <div className="flex items-center space-x-3"><div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-xs font-medium">{lead.name.charAt(0)}</div><span className="font-medium">{lead.name}</span></div>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-secondary to-primary rounded-full" style={{ width: `${lead.score}%` }} /></div>
                        <span className="text-sm font-medium">{lead.score}</span>
                      </div>
                      <Badge variant={lead.status === 'Hot' ? 'destructive' : lead.status === 'Warm' ? 'secondary' : 'outline'}>{lead.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI/Jarvis Section (condensed) */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 px-4 py-2"><span className="mr-2 inline-block w-4 h-4"><Bot /></span>Jarvis AI Assistant</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Jarvis AI - <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Din Intelligente IT Support Assistent</span></h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">Automatiser 80% af support-tickets. Mock, Real eller Off modes for fuld kontrol.</p>
          </div>
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            {/* Chat mock */}
            <div className="glass-card">
              <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center"><Bot /></div>
                  <div>
                    <h4 className="font-semibold">Jarvis AI Assistant</h4>
                    <p className="text-sm text-muted-foreground">Online • Real Mode</p>
                  </div>
                </div>
                <button className="h-8 px-3 rounded-md border border-border text-sm bg-transparent" aria-label="Settings"><Settings /></button>
              </div>
              <div className="space-y-4 max-h-80 overflow-y-auto">
                <div className="flex justify-end"><div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2 max-w-xs"><p className="text-sm">Hej, jeg har problemer med min email setup. Kan du hjælpe?</p></div></div>
                <div className="flex items-start space-x-3"><div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center"><Bot /></div><div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2 max-w-xs"><p className="text-sm">Selvfølgelig! Jeg kan se du bruger Outlook 365. Lad mig guide dig.</p></div></div>
              </div>
              <div className="border-t border-border pt-4 mt-4">
                <div className="flex items-center space-x-2">
                  <input className="flex-1 bg-background rounded-full px-4 py-2 border border-border text-sm" placeholder="Skriv din besked..." />
                  <Button size="sm" className="rounded-full w-10 h-10 p-0"><ArrowRight /></Button>
                </div>
              </div>
            </div>
            {/* Selling points */}
            <div className="space-y-6">
              <h3 className="text-3xl font-bold">Kontekst-Aware AI Support</h3>
              <p className="text-lg text-muted-foreground">Jarvis integrerer med dit CRM og kender kunders historik, produkter og cases.</p>
              <div className="space-y-4">
                <div className="flex items-start space-x-4"><div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center"><MessageSquare /></div><div><h4 className="font-semibold mb-2">Intelligent Responses</h4><p className="text-muted-foreground text-sm">Kontekstuelle svar baseret på kundens setup og historik.</p></div></div>
                <div className="flex items-start space-x-4"><div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center"><Users /></div><div><h4 className="font-semibold mb-2">CRM Integration</h4><p className="text-muted-foreground text-sm">Automatisk adgang til kundedata for bedre service.</p></div></div>
                <div className="flex items-start space-x-4"><div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center"><Shield /></div><div><h4 className="font-semibold mb-2">Sikker & Privat</h4><p className="text-muted-foreground text-sm">GDPR-compliant AI med kontrol over dataadgang.</p></div></div>
              </div>
            </div>
          </div>
          {/* Modes */}
          <div className="glass-card">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-4">Fleksible AI Modes</h3>
              <p className="text-muted-foreground">Vælg den rigtige balance mellem automatisering og kontrol</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 border border-border rounded-2xl hover:border-primary/50 transition-colors">
                <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4"><Play /></div>
                <h4 className="text-xl font-semibold mb-3">Mock Mode</h4>
                <p className="text-muted-foreground text-sm">Test og træn AI'en med simulerede samtaler.</p>
              </div>
              <div className="text-center p-6 border-2 border-primary rounded-2xl bg-primary/5">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4"><Zap /></div>
                <h4 className="text-xl font-semibold mb-3">Real Mode</h4>
                <Badge variant="secondary" className="mb-3">Anbefalet</Badge>
                <p className="text-muted-foreground text-sm">Fuld AI-automatisering med human oversight.</p>
              </div>
              <div className="text-center p-6 border border-border rounded-2xl hover:border-muted-foreground/50 transition-colors">
                <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4"><Square /></div>
                <h4 className="text-xl font-semibold mb-3">Off Mode</h4>
                <p className="text-muted-foreground text-sm">Traditionel support uden AI, fuld kontrol.</p>
              </div>
            </div>
            <div className="text-center mt-8"><Button size="lg" className="btn-3d">Prøv Jarvis AI Gratis <span className="ml-2 inline-block w-5 h-5 align-middle"><ArrowRight /></span></Button></div>
          </div>
        </div>
      </section>

      {/* Pricing (condensed) */}
      <section className="px-6 py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 px-4 py-2"><span className="mr-2 inline-block w-4 h-4"><BarChart3 /></span>Priser</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Vælg den <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">rigtige plan</span> for dit team</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">Alle planer inkluderer multi-tenant sikkerhed og GDPR compliance.</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            {PLANS.map((plan) => (
              <div key={plan.name} className={plan.highlight ? 'glass-card text-center border-2 border-primary bg-primary/5 relative' : 'glass-card text-center'}>
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2"><Badge variant="secondary" className="px-4 py-1">Mest Populær</Badge></div>
                )}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-6"><span className="text-4xl font-bold">{plan.price}</span></div>
                  <Button className={plan.highlight ? 'w-full btn-3d' : 'w-full btn-3d bg-transparent'} variant={plan.highlight ? 'default' : 'outline'}>
                    {plan.cta}
                  </Button>
                </div>
                <div className="space-y-3 text-left">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center"><span className="mr-3"><CheckCircle /></span><span className="text-sm">{f}</span></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {/* FAQ (short) */}
          <div className="grid md:grid-cols-2 gap-6">
            {FAQS.map((f) => (
              <div key={f.q} className="glass-card"><h4 className="font-semibold mb-2">{f.q}</h4><p className="text-sm text-muted-foreground">{f.a}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-16 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm">T</span>
            </div>
            <span className="text-xl font-semibold">Tekup</span>
          </div>
          <span className="text-sm text-muted-foreground">© 2025 Tekup. Alle rettigheder forbeholdes.</span>
        </div>
      </footer>
    </div>
  )
}
