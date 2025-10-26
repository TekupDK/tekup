/**
 * Enhanced Authentication System for Tekup-org Integration
 * Supports both demo mode and real JWT authentication
 */

'use client';

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  Building, 
  Zap,
  Shield,
  Github,
  Chrome,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { config } from '../../utils/environment';

interface TekupAuthProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
  defaultMode?: 'login' | 'register';
}

interface AuthUser {
  id: string;
  email: string;
  name: string;
  company?: string;
  role: 'user' | 'admin' | 'owner';
  tenant: {
    id: string;
    name: string;
    plan: 'free' | 'pro' | 'enterprise';
  };
  permissions: string[];
}

interface AuthResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
  expiresAt: number;
}

export function TekupAuth({ isOpen, onClose, onSuccess, defaultMode = 'login' }: TekupAuthProps) {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    company: '',
    acceptTerms: false
  });

  const handleInputChange = useCallback((field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  }, []);

  const authenticateWithTekupOrg = async (email: string, password: string): Promise<AuthResponse> => {
    const response = await fetch(`${config.api.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        clientId: 'tekup-website',
        scopes: ['dashboard', 'leads', 'analytics']
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Authentication failed');
    }

    return response.json();
  };

  const registerWithTekupOrg = async (
    email: string, 
    password: string, 
    name: string, 
    company: string
  ): Promise<AuthResponse> => {
    const response = await fetch(`${config.api.baseUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name,
        company,
        plan: 'free', // Start with free plan
        source: 'website'
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    return response.json();
  };

  const handleDemoAuth = async (): Promise<AuthResponse> => {
    // Simulate demo authentication for development
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      user: {
        id: `demo_${Date.now()}`,
        email: formData.email,
        name: formData.name || formData.email.split('@')[0],
        company: formData.company || 'Demo Company',
        role: 'user',
        tenant: {
          id: `tenant_${Date.now()}`,
          name: formData.company || 'Demo Tenant',
          plan: 'pro'
        },
        permissions: ['dashboard:read', 'leads:read', 'leads:write', 'analytics:read']
      },
      token: `demo_token_${Date.now()}`,
      refreshToken: `demo_refresh_${Date.now()}`,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validation
      if (!formData.email || !formData.password) {
        throw new Error('Email og adgangskode er påkrævet');
      }

      if (mode === 'register') {
        if (!formData.name || !formData.company) {
          throw new Error('Navn og virksomhed er påkrævet for registrering');
        }

        if (!formData.acceptTerms) {
          throw new Error('Du skal acceptere servicevilkårene');
        }
      }

      let authResponse: AuthResponse;

      // Choose authentication method based on configuration
      if (config.features.useMockData) {
        authResponse = await handleDemoAuth();
      } else {
        if (mode === 'register') {
          authResponse = await registerWithTekupOrg(
            formData.email,
            formData.password,
            formData.name,
            formData.company
          );
        } else {
          authResponse = await authenticateWithTekupOrg(formData.email, formData.password);
        }
      }

      // Store authentication data
      localStorage.setItem(config.auth.storageKey, JSON.stringify({
        token: authResponse.token,
        refreshToken: authResponse.refreshToken,
        expiresAt: authResponse.expiresAt,
        user: authResponse.user
      }));

      // Set auth cookie for SSR
      document.cookie = `${config.auth.cookieName}=${authResponse.token}; path=/; max-age=${60 * 60 * 24}; secure; samesite=strict`;

      toast.success(mode === 'register' ? 'Konto oprettet! Velkommen til Tekup!' : 'Du er nu logget ind!');
      
      onSuccess(authResponse.user);
      onClose();

    } catch (error) {
      console.error('Auth error:', error);
      toast.error(error instanceof Error ? error.message : 'Der opstod en fejl');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'github') => {
    if (config.features.useMockData) {
      toast.info(`${provider} login er ikke tilgængelig i demo-versionen. Brug email/password login i stedet.`);
      return;
    }

    // Redirect to OAuth provider
    window.location.href = `${config.api.baseUrl}/auth/${provider}?redirect=${window.location.origin}/auth/callback`;
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
              {mode === 'login' ? 'Velkommen til Tekup' : 'Kom i gang med Tekup'}
            </DialogTitle>
            
            <div className="text-gray-300" aria-describedby="auth-description">
              <p id="auth-description">
                {mode === 'login' 
                  ? 'Log ind for at få adgang til din CRM dashboard'
                  : 'Opret din konto og boost dine leads med AI'
                }
              </p>
            </div>

            {config.features.useMockData && (
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
                <Shield className="w-3 h-3 mr-1" />
                Demo Mode - Brug enhver email/password
              </Badge>
            )}
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
                      ? 'bg-gradient-to-r from-[var(--color-tekup-primary)] to-[var(--color-tekup-accent)] text-white shadow-lg' 
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
                      ? 'bg-gradient-to-r from-[var(--color-tekup-primary)] to-[var(--color-tekup-accent)] text-white shadow-lg' 
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Opret konto
                </Button>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Registration Fields */}
            {mode === 'register' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-200">Fulde navn</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange('name')}
                      className="pl-10 bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:ring-[var(--color-tekup-accent)] focus:border-[var(--color-tekup-accent)] backdrop-blur-sm"
                      placeholder="Dit fulde navn"
                      required
                    />
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
                      className="pl-10 bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:ring-[var(--color-tekup-accent)] focus:border-[var(--color-tekup-accent)] backdrop-blur-sm"
                      placeholder="Din virksomhed"
                      required
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-200">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  className="pl-10 bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:ring-[var(--color-tekup-accent)] focus:border-[var(--color-tekup-accent)] backdrop-blur-sm"
                  placeholder={config.features.useMockData ? "demo@tekup.dk (eller enhver email)" : "din@email.dk"}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-200">Adgangskode</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  className="pl-10 pr-10 bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:ring-[var(--color-tekup-accent)] focus:border-[var(--color-tekup-accent)] backdrop-blur-sm"
                  placeholder={config.features.useMockData ? "demo123 (eller enhver password)" : "••••••••"}
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

            {/* Terms Acceptance for Registration */}
            {mode === 'register' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-start space-x-3"
              >
                <input
                  type="checkbox"
                  id="terms"
                  checked={formData.acceptTerms}
                  onChange={(e) => setFormData(prev => ({ ...prev, acceptTerms: e.target.checked }))}
                  className="mt-1 rounded border-white/20 bg-white/10 text-[var(--color-tekup-accent)] focus:ring-[var(--color-tekup-accent)]"
                />
                <Label htmlFor="terms" className="text-sm text-gray-300 leading-relaxed">
                  Jeg accepterer Tekups{' '}
                  <a href="#terms" className="text-[var(--color-tekup-accent)] hover:underline">
                    servicevilkår
                  </a>{' '}
                  og{' '}
                  <a href="#privacy" className="text-[var(--color-tekup-accent)] hover:underline">
                    privatlivspolitik
                  </a>
                </Label>
              </motion.div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[var(--color-tekup-primary)] to-[var(--color-tekup-accent)] text-white border-0 hover:shadow-lg hover:shadow-[var(--color-tekup-accent)]/25 py-3 rounded-xl font-semibold"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                mode === 'login' ? 'Log ind i Tekup' : 'Opret Tekup konto'
              )}
            </Button>

            {/* Social Authentication */}
            {!config.features.useMockData && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-gray-800 px-2 text-gray-400">eller</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSocialAuth('google')}
                    className="bg-white/10 border border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                  >
                    <Chrome className="w-4 h-4 mr-2" />
                    Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSocialAuth('github')}
                    className="bg-white/10 border border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                  >
                    <Github className="w-4 h-4 mr-2" />
                    GitHub
                  </Button>
                </div>
              </>
            )}
          </form>

          {/* Feature Highlight for Registration */}
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
                    Ingen kreditkort påkrævet. Opsig når som helst. Fuld adgang til Gmail AI og Lead Scoring.
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