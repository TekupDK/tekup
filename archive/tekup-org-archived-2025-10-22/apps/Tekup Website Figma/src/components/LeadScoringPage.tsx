'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Users, 
  Building, 
  Mail, 
  Globe, 
  Star, 
  CheckCircle,
  AlertCircle,
  Zap,
  BarChart3,
  ArrowRight,
  Lightbulb,
  Calculator
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function LeadScoringPage() {
  const [isScoring, setIsScoring] = useState(false);
  const [scoreResult, setScoreResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    company: '',
    email: '',
    website: '',
    employees: '',
    industry: ''
  });

  const industries = [
    'Technology',
    'Finance',
    'Healthcare',
    'Consulting',
    'Manufacturing',
    'Retail',
    'Education',
    'Government',
    'Real Estate',
    'Other'
  ];

  const employeeSizes = [
    { value: '1-10', label: '1-10 medarbejdere' },
    { value: '11-50', label: '11-50 medarbejdere' },
    { value: '51-200', label: '51-200 medarbejdere' },
    { value: '201-1000', label: '201-1000 medarbejdere' },
    { value: '1000+', label: '1000+ medarbejdere' }
  ];

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleSelectChange = (field: string) => (value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsScoring(true);

    try {
      // Import projectId and publicAnonKey from utils
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      
      const employeeCount = formData.employees.includes('+') ? 1000 : 
                           formData.employees.includes('-') ? 
                           parseInt(formData.employees.split('-')[1]) : 
                           parseInt(formData.employees) || 0;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-68ad12b6/leads/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          ...formData,
          employees: employeeCount
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setScoreResult(result);
        toast.success('Lead scoring gennemført!', {
          description: `Score: ${result.lead.score}/100 - Status: ${result.lead.status}`
        });
      } else {
        toast.error('Fejl ved scoring', {
          description: result.error || 'Der skete en fejl. Prøv igen senere.',
        });
      }
    } catch (error) {
      console.error('Lead scoring error:', error);
      toast.error('Fejl ved scoring', {
        description: 'Der skete en fejl. Prøv igen senere.',
      });
    } finally {
      setIsScoring(false);
    }
  };

  const resetForm = () => {
    setFormData({
      company: '',
      email: '',
      website: '',
      employees: '',
      industry: ''
    });
    setScoreResult(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-emerald-500 to-green-600';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    if (score >= 40) return 'from-orange-500 to-red-500';
    return 'from-red-500 to-red-600';
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'hot':
        return { icon: Star, color: 'text-emerald-400', bg: 'bg-emerald-500/20' };
      case 'warm':
        return { icon: TrendingUp, color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
      case 'cold':
        return { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/20' };
      default:
        return { icon: Target, color: 'text-gray-400', bg: 'bg-gray-500/20' };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-20">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-tekup-primary)_0%,_transparent_50%)] opacity-10" />
      
      {/* Floating orbs */}
      <motion.div 
        className="absolute top-40 left-20 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-indigo-600/20 rounded-full opacity-40 blur-3xl"
        animate={{ 
          scale: [1, 1.3, 1],
          rotate: [0, 180, 360]
        }}
        transition={{ 
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-6 mb-12"
        >
          <Badge className="bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-400/30 text-purple-300 backdrop-blur-sm px-6 py-3">
            <Brain className="w-4 h-4 mr-2" />
            AI Lead Scoring
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white">
            Intelligent Lead
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
              Scoring Engine
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Vores AI-drevne lead scoring system evaluerer potentielle kunder baseret på 50+ datapunkter
            og giver dig actionable insights til at prioritere dine salgsaktiviteter.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Lead Scoring Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Calculator className="w-5 h-5 mr-2" />
                  Lead Scoring Tool
                </CardTitle>
                <p className="text-gray-300">
                  Indtast oplysninger om dit lead for at få en AI-genereret score
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-gray-200">Virksomhedsnavn *</Label>
                    <Input
                      id="company"
                      type="text"
                      value={formData.company}
                      onChange={handleInputChange('company')}
                      className="bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:ring-purple-500 focus:border-purple-500 backdrop-blur-sm"
                      placeholder="ACME Corporation"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-200">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange('email')}
                      className="bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:ring-purple-500 focus:border-purple-500 backdrop-blur-sm"
                      placeholder="contact@acme.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-gray-200">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={handleInputChange('website')}
                      className="bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:ring-purple-500 focus:border-purple-500 backdrop-blur-sm"
                      placeholder="https://acme.com"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-200">Virksomhedsstørrelse *</Label>
                      <Select value={formData.employees} onValueChange={handleSelectChange('employees')}>
                        <SelectTrigger className="bg-white/10 border border-white/20 text-white backdrop-blur-sm">
                          <SelectValue placeholder="Vælg størrelse" />
                        </SelectTrigger>
                        <SelectContent>
                          {employeeSizes.map((size) => (
                            <SelectItem key={size.value} value={size.value}>
                              {size.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-200">Branche *</Label>
                      <Select value={formData.industry} onValueChange={handleSelectChange('industry')}>
                        <SelectTrigger className="bg-white/10 border border-white/20 text-white backdrop-blur-sm">
                          <SelectValue placeholder="Vælg branche" />
                        </SelectTrigger>
                        <SelectContent>
                          {industries.map((industry) => (
                            <SelectItem key={industry} value={industry.toLowerCase()}>
                              {industry}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isScoring || !formData.company || !formData.email || !formData.employees || !formData.industry}
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-0 hover:shadow-lg hover:shadow-purple-500/25 py-3 rounded-xl font-semibold"
                  >
                    {isScoring ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                      />
                    ) : (
                      <Brain className="w-5 h-5 mr-2" />
                    )}
                    {isScoring ? 'Scorer lead...' : 'Score lead'}
                  </Button>

                  {scoreResult && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                      className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                    >
                      Score nyt lead
                    </Button>
                  )}
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results Panel */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6"
          >
            {scoreResult ? (
              <>
                {/* Score Result */}
                <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      Lead Score Resultat
                      <Badge className={`${getStatusInfo(scoreResult.lead.status).bg} ${getStatusInfo(scoreResult.lead.status).color} border-0`}>
                        {getStatusInfo(scoreResult.lead.status).icon && 
                          <getStatusInfo(scoreResult.lead.status).icon className="w-4 h-4 mr-1" />
                        }
                        {scoreResult.lead.status.toUpperCase()}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 10 }}
                        className="relative w-32 h-32 mx-auto mb-4"
                      >
                        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="2"
                          />
                          <motion.path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="url(#scoreGradient)"
                            strokeWidth="2"
                            strokeDasharray={`${scoreResult.lead.score}, 100`}
                            initial={{ strokeDasharray: "0, 100" }}
                            animate={{ strokeDasharray: `${scoreResult.lead.score}, 100` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                          />
                          <defs>
                            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#8B5CF6" />
                              <stop offset="100%" stopColor="#EC4899" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-3xl font-bold text-white">{scoreResult.lead.score}</span>
                        </div>
                      </motion.div>
                      <h3 className="text-xl font-bold text-white mb-2">{scoreResult.lead.company}</h3>
                      <p className="text-gray-300">{scoreResult.lead.email}</p>
                    </div>

                    <Separator className="bg-white/20" />

                    <div className="space-y-3">
                      <h4 className="font-medium text-white flex items-center">
                        <Lightbulb className="w-4 h-4 mr-2 text-yellow-400" />
                        AI Anbefalinger
                      </h4>
                      <div className="space-y-2">
                        {scoreResult.recommendations.map((rec: string, index: number) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + index * 0.1 }}
                            className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg"
                          >
                            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-300">{rec}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Lead Details */}
                <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Lead Detaljer</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300">Virksomhed:</span>
                      </div>
                      <span className="text-white font-medium">{scoreResult.lead.company}</span>

                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300">Email:</span>
                      </div>
                      <span className="text-white font-medium">{scoreResult.lead.email}</span>

                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300">Medarbejdere:</span>
                      </div>
                      <span className="text-white font-medium">{formData.employees}</span>

                      <div className="flex items-center space-x-2">
                        <BarChart3 className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300">Branche:</span>
                      </div>
                      <span className="text-white font-medium capitalize">{scoreResult.lead.industry}</span>

                      {scoreResult.lead.website && (
                        <>
                          <div className="flex items-center space-x-2">
                            <Globe className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-300">Website:</span>
                          </div>
                          <span className="text-white font-medium">{scoreResult.lead.website}</span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10">
                <CardContent className="p-12 text-center">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-full flex items-center justify-center"
                  >
                    <Target className="w-8 h-8 text-purple-400" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-4">Klar til lead scoring</h3>
                  <p className="text-gray-300 mb-6">
                    Udfyld formularen til venstre for at få en detaljeret AI-analyse af dit lead
                  </p>
                  <div className="space-y-3 text-sm text-gray-400">
                    <div className="flex items-center justify-center space-x-2">
                      <Zap className="w-4 h-4" />
                      <span>Real-time AI scoring</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <Brain className="w-4 h-4" />
                      <span>50+ datapunkter analyseret</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <TrendingUp className="w-4 h-4" />
                      <span>Actionable anbefalinger</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}