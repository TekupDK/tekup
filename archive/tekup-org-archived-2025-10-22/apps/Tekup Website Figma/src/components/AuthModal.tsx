'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  Building, 
  Globe,
  Zap,
  Shield,
  Github,
  Chrome
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, defaultMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    company: '',
    agreeToTerms: false
  });

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'register') {
        if (formData.password !== formData.confirmPassword) {
          toast.error('Adgangskoder matcher ikke');
          setIsLoading(false);
          return;
        }
        if (!formData.agreeToTerms) {
          toast.error('Du skal acceptere servicevilkårene');
          setIsLoading(false);
          return;
        }

        // For demo purposes, simulate successful signup
        // In production, you would call your signup endpoint
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate successful response
        const result = {
          user: {
            id: crypto.randomUUID(),
            email: formData.email
          },
          tenant: {
            id: crypto.randomUUID(),
            name: formData.company,
            ownerId: crypto.randomUUID()
          }
        };

        // Success - already defined above

        toast.success('Konto oprettet! Du kan nu logge ind.');
        
        // Store user info in localStorage for demo purposes
        localStorage.setItem('tekup_user', JSON.stringify({
          id: result.user.id,
          email: formData.email,
          name: `${formData.firstName} ${formData.lastName}`,
          company: formData.company,
          tenant: result.tenant
        }));
        
        setMode('login');
        
      } else {
        // Login mode - for demo purposes, simulate successful login
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate successful login
        const mockSession = {
          access_token: 'demo_token_' + Date.now(),
          expires_at: Date.now() + 3600000,
          user: {
            id: crypto.randomUUID(),
            email: formData.email
          }
        };

        const mockUser = {
          id: mockSession.user.id,
          email: formData.email,
          name: formData.email.split('@')[0] || 'Demo User',
          company: 'Demo Corp',
          tenant: {
            id: crypto.randomUUID(),
            name: 'Demo Corp',
            ownerId: mockSession.user.id
          }
        };

        // Store session and user info
        localStorage.setItem('tekup_session', JSON.stringify(mockSession));
        localStorage.setItem('tekup_user', JSON.stringify(mockUser));

        toast.success('Du er nu logget ind!');
        
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error(error instanceof Error ? error.message : 'Der opstod en fejl');
    } finally {
      setIsLoading(false);
      if (mode === 'login') {
        onClose();
      }
    }
  };

  const handleSocialAuth = async (provider: string) => {
    toast.info(`${provider} login er ikke tilgængelig i demo-versionen. Brug email/password login i stedet.`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-white/10 shadow-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          <DialogHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-tekup-primary)] to-[var(--color-tekup-accent)] rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
            </div>
            
            <DialogTitle className="text-2xl font-bold text-white">
              {mode === 'login' ? 'Velkommen tilbage' : 'Opret din konto'}
            </DialogTitle>
            
            <DialogDescription className="text-gray-300">
              {mode === 'login' 
                ? 'Log ind for at få adgang til din Tekup dashboard'
                : 'Start din gratis 14-dages prøveperiode i dag'
              }
            </DialogDescription>
          </DialogHeader>

          {/* Mode Toggle */}
          <div className="flex items-center justify-center my-6">
            <div className="bg-gray-800/50 rounded-lg p-1 backdrop-blur-sm border border-white/10">
              <div className="flex">
                <Button
                  variant={mode === 'login' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setMode('login')}
                  className={`px-6 rounded-md transition-all ${
                    mode === 'login' 
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg' 
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Log ind
                </Button>
                <Button
                  variant={mode === 'register' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setMode('register')}
                  className={`px-6 rounded-md transition-all ${
                    mode === 'register' 
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg' 
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Opret konto
                </Button>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-gray-200">Fornavn</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="firstName"
                          type="text"
                          value={formData.firstName}
                          onChange={handleInputChange('firstName')}
                          className="pl-10 bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:ring-cyan-500 focus:border-cyan-500 backdrop-blur-sm"
                          placeholder="John"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-gray-200">Efternavn</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="lastName"
                          type="text"
                          value={formData.lastName}
                          onChange={handleInputChange('lastName')}
                          className="pl-10 bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:ring-cyan-500 focus:border-cyan-500 backdrop-blur-sm"
                          placeholder="Doe"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-gray-200">Virksomhed</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="company"
                        type="text"
                        value={formData.company}
                        onChange={handleInputChange('company')}
                        className="pl-10 bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:ring-cyan-500 focus:border-cyan-500 backdrop-blur-sm"
                        placeholder="Din virksomhed"
                        required
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-200">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  className="pl-10 bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:ring-cyan-500 focus:border-cyan-500 backdrop-blur-sm"
                  placeholder="din@email.dk"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-200">Adgangskode</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  className="pl-10 pr-10 bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:ring-cyan-500 focus:border-cyan-500 backdrop-blur-sm"
                  placeholder="••••••••"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {mode === 'register' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-200">Bekræft adgangskode</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleInputChange('confirmPassword')}
                      className="pl-10 pr-10 bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:ring-cyan-500 focus:border-cyan-500 backdrop-blur-sm"
                      placeholder="••••••••"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, agreeToTerms: checked as boolean }))
                    }
                    className="mt-1 border-white/20 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                  />
                  <Label htmlFor="terms" className="text-sm text-gray-300 leading-relaxed">
                    Jeg accepterer Tekups{' '}
                    <a href="#terms" className="text-cyan-400 hover:text-cyan-300 underline">
                      servicevilkår
                    </a>{' '}
                    og{' '}
                    <a href="#privacy" className="text-cyan-400 hover:text-cyan-300 underline">
                      privatlivspolitik
                    </a>
                  </Label>
                </div>
              </motion.div>
            )}

            {mode === 'login' && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" className="border-white/20 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500" />
                  <Label htmlFor="remember" className="text-sm text-gray-300">
                    Husk mig
                  </Label>
                </div>
                <a href="#forgot" className="text-sm text-cyan-400 hover:text-cyan-300">
                  Glemt adgangskode?
                </a>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0 hover:shadow-lg hover:shadow-cyan-500/25 py-3 rounded-xl font-semibold"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                mode === 'login' ? 'Log ind' : 'Opret konto'
              )}
            </Button>

            <div className="relative">
              <Separator className="bg-white/20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Badge className="bg-gray-800/80 text-gray-400 px-3 border border-white/10 backdrop-blur-sm">
                  eller
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSocialAuth('Google')}
                className="bg-white/10 border border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
              >
                <Chrome className="w-4 h-4 mr-2" />
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSocialAuth('GitHub')}
                className="bg-white/10 border border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
              >
                <Github className="w-4 h-4 mr-2" />
                GitHub
              </Button>
            </div>
          </form>

          {mode === 'register' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-6 p-4 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-xl border border-emerald-400/30 backdrop-blur-sm"
            >
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-emerald-400 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-emerald-300 mb-1">14 dages gratis prøveperiode</div>
                  <div className="text-gray-300">
                    Ingen kreditkort påkrævet. Cancel når som helst. Fuld adgang til alle funktioner.
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}