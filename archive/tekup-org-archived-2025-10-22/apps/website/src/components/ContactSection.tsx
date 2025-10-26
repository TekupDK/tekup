import { useState } from "react";
import { 
  Plus, 
  Building, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  Users,
  Target,
  DollarSign,
  Clock,
  X
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createLogger } from "@/utils/logger";

const logger = createLogger('ContactSection');

const ContactSection = () => {
  const [formData, setFormData] = useState({
    projectName: "",
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    projectType: "",
    budget: "",
    timeline: "",
    description: "",
    requirements: [] as string[]
  });

  const [newRequirement, setNewRequirement] = useState("");

  const projectTypes = [
    "Digital Transformation",
    "Custom Software Development", 
    "IT Infrastructure",
    "System Integration",
    "AI Implementation",
    "Cloud Migration"
  ];

  const budgetRanges = [
    "Under 100.000 kr",
    "100.000 - 500.000 kr",
    "500.000 - 1.000.000 kr",
    "1.000.000+ kr"
  ];

  const timelineOptions = [
    "ASAP (< 1 måned)",
    "Q1 2024 (1-3 måneder)",
    "Q2 2024 (3-6 måneder)",
    "H2 2024 (6+ måneder)"
  ];

  const addRequirement = () => {
    if (newRequirement.trim() && !formData.requirements.includes(newRequirement.trim())) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()]
      }));
      setNewRequirement("");
    }
  };

  const removeRequirement = (requirement: string) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter(req => req !== requirement)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    logger.info("Project data:", formData);
  };

  return (
    <section className="py-24 px-6 bg-gradient-to-b from-background to-ecosystem-dark">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form - Styled as "Add New Project" Dialog */}
          <div>
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-neon-blue/10 px-4 py-2 rounded-full mb-6">
                <Plus className="w-4 h-4 text-neon-blue" />
                <span className="text-sm font-semibold text-neon-blue uppercase tracking-wide">
                  Add New Project
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-orbitron font-bold text-foreground mb-6">
                Lad os skabe
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-cyan">
                  {" "}noget fantastisk
                </span>
              </h2>
              <p className="text-xl text-muted-foreground">
                Start dit næste digitale projekt ved at udfylde project briefet nedenfor. 
                Vi kontakter dig inden for 24 timer.
              </p>
            </div>

            <Card className="glass-card p-8 border-glass-border/30">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Project Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Projekt Navn *
                    </label>
                    <Input
                      placeholder="f.eks. Digital Transformation 2024"
                      value={formData.projectName}
                      onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                      className="glass border-glass-border/30"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Virksomhed *
                    </label>
                    <Input
                      placeholder="Virksomhedsnavn"
                      value={formData.companyName}
                      onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                      className="glass border-glass-border/30"
                      required
                    />
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Kontaktperson *
                    </label>
                    <Input
                      placeholder="Fulde navn"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                      className="glass border-glass-border/30"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Email *
                    </label>
                    <Input
                      type="email"
                      placeholder="din@email.dk"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="glass border-glass-border/30"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Telefon
                    </label>
                    <Input
                      placeholder="+45 XX XX XX XX"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="glass border-glass-border/30"
                    />
                  </div>
                </div>

                {/* Project Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      <Target className="w-4 h-4 inline mr-1" />
                      Projekt Type
                    </label>
                    <select
                      value={formData.projectType}
                      onChange={(e) => setFormData(prev => ({ ...prev, projectType: e.target.value }))}
                      className="w-full p-3 rounded-lg glass border-glass-border/30 bg-dashboard-surface text-foreground"
                    >
                      <option value="">Vælg projekt type</option>
                      {projectTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      Budget Range
                    </label>
                    <select
                      value={formData.budget}
                      onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                      className="w-full p-3 rounded-lg glass border-glass-border/30 bg-dashboard-surface text-foreground"
                    >
                      <option value="">Vælg budget</option>
                      {budgetRanges.map(range => (
                        <option key={range} value={range}>{range}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Timeline
                    </label>
                    <select
                      value={formData.timeline}
                      onChange={(e) => setFormData(prev => ({ ...prev, timeline: e.target.value }))}
                      className="w-full p-3 rounded-lg glass border-glass-border/30 bg-dashboard-surface text-foreground"
                    >
                      <option value="">Vælg timeline</option>
                      {timelineOptions.map(timeline => (
                        <option key={timeline} value={timeline}>{timeline}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Requirements */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Specifikke Krav & Features
                  </label>
                  <div className="flex gap-2 mb-3">
                    <Input
                      placeholder="Tilføj krav eller feature..."
                      value={newRequirement}
                      onChange={(e) => setNewRequirement(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                      className="glass border-glass-border/30"
                    />
                    <Button 
                      type="button"
                      onClick={addRequirement}
                      size="sm"
                      className="bg-neon-blue/20 hover:bg-neon-blue/30 text-neon-blue border-neon-blue/30"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.requirements.map((req, idx) => (
                      <Badge 
                        key={idx}
                        variant="outline"
                        className="bg-neon-blue/10 text-neon-blue border-neon-blue/30 pr-1"
                      >
                        {req}
                        <X 
                          className="w-3 h-3 ml-1 cursor-pointer hover:text-red-400" 
                          onClick={() => removeRequirement(req)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Projekt Beskrivelse
                  </label>
                  <Textarea
                    placeholder="Beskriv dit projekt, mål og eventuelle udfordringer..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="glass border-glass-border/30 min-h-[120px]"
                    rows={5}
                  />
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit"
                  size="lg"
                  className="w-full bg-neon-blue hover:bg-neon-blue/90 text-ecosystem-dark font-semibold text-lg ripple neon-glow"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Project Request
                </Button>
              </form>
            </Card>
          </div>

          {/* Contact Information & Map */}
          <div className="space-y-8">
            {/* Contact Cards */}
            <div className="space-y-6">
              <h3 className="text-3xl font-orbitron font-bold text-foreground">
                Kontakt Information
              </h3>
              
              <Card className="glass-card p-6 border-glass-border/30">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-neon-blue/20 rounded-xl">
                    <Building className="w-6 h-6 text-neon-blue" />
                  </div>
                  <div>
                    <h4 className="font-orbitron font-bold text-foreground">Hovedkontor</h4>
                    <p className="text-muted-foreground">TekUp ApS</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-neon-blue" />
                    <span className="text-foreground">Ørestads Boulevard 108, 2300 København S</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-neon-blue" />
                    <span className="text-foreground">+45 22 65 02 26</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-neon-blue" />
                    <span className="text-foreground">kundeservice@tekup.dk</span>
                  </div>
                </div>
              </Card>

              <Card className="glass-card p-6 border-glass-border/30">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-neon-blue/20 rounded-xl">
                    <Calendar className="w-6 h-6 text-neon-blue" />
                  </div>
                  <div>
                    <h4 className="font-orbitron font-bold text-foreground">Åbningstider</h4>
                    <p className="text-muted-foreground">Support & konsultation</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mandag - Fredag</span>
                    <span className="text-foreground">08:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Weekend</span>
                    <span className="text-foreground">Emergency support</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">24/7 Monitoring</span>
                    <span className="text-green-400">Aktiv</span>
                  </div>
                </div>
              </Card>

              <Card className="glass-card p-6 border-glass-border/30">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-neon-blue/20 rounded-xl">
                    <Users className="w-6 h-6 text-neon-blue" />
                  </div>
                  <div>
                    <h4 className="font-orbitron font-bold text-foreground">Book Møde</h4>
                    <p className="text-muted-foreground">Gratis konsultation</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  Book et gratis 30-minutters konsultationsmøde hvor vi diskuterer 
                  jeres specifikke behov og hvordan TekUp kan hjælpe.
                </p>
                <Button 
                  variant="outline"
                  className="w-full border-neon-blue/50 text-neon-blue hover:bg-neon-blue/10"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Book gratis konsultation
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
