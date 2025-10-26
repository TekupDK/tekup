'use client'

import React, { useState } from 'react'
import { useAuth } from './SupabaseAuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Lock, User, Chrome } from 'lucide-react'

// ============================================================================
// Sign Up Form Component
// Replaces Clerk's SignUp component
// ============================================================================

interface SignUpFormProps {
  redirectTo?: string
  showSignIn?: boolean
  onSuccess?: () => void
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ 
  redirectTo = '/dashboard', 
  showSignIn = true,
  onSuccess 
}) => {
  const { signUp, signInWithGoogle, loading } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.firstName) {
      setError('Udfyld venligst alle påkrævede felter')
      return false
    }

    if (formData.password.length < 6) {
      setError('Adgangskoden skal være mindst 6 tegn')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Adgangskoderne matcher ikke')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Indtast venligst en gyldig email adresse')
      return false
    }

    return true
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const { error } = await signUp(
        formData.email, 
        formData.password,
        {
          first_name: formData.firstName,
          last_name: formData.lastName,
          full_name: `${formData.firstName} ${formData.lastName}`.trim()
        }
      )
      
      if (error) {
        setError(error.message)
      } else {
        setEmailSent(true)
      }
    } catch (err) {
      setError('Der opstod en uventet fejl')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setError(null)
    setIsSubmitting(true)

    try {
      const { error } = await signInWithGoogle()
      
      if (error) {
        setError(error.message)
      }
      // Note: Google OAuth will redirect automatically
    } catch (err) {
      setError('Der opstod en uventet fejl')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show email confirmation message
  if (emailSent) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Bekræft din email</CardTitle>
          <CardDescription className="text-center">
            Vi har sendt en bekræftelseslink til din email
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              Tjek din email ({formData.email}) og klik på linket for at aktivere din konto.
            </AlertDescription>
          </Alert>
          
          <div className="text-center text-sm text-muted-foreground">
            Har du ikke modtaget emailen? Tjek din spam-mappe eller{' '}
            <button 
              onClick={() => setEmailSent(false)}
              className="text-primary hover:underline"
            >
              prøv igen
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Opret konto</CardTitle>
        <CardDescription className="text-center">
          Opret din RenOS konto og kom i gang
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Google Sign Up Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignUp}
          disabled={loading || isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Chrome className="mr-2 h-4 w-4" />
          )}
          Fortsæt med Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Eller opret med email
            </span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailSignUp} className="space-y-4">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Fornavn *</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading || isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Efternavn</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                disabled={loading || isSubmitting}
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="din@email.dk"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="pl-10"
                required
                disabled={loading || isSubmitting}
              />
            </div>
          </div>

          {/* Password Fields */}
          <div className="space-y-2">
            <Label htmlFor="password">Adgangskode *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="pl-10"
                required
                disabled={loading || isSubmitting}
              />
            </div>
            <p className="text-xs text-muted-foreground">Mindst 6 tegn</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Bekræft adgangskode *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="pl-10"
                required
                disabled={loading || isSubmitting}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || isSubmitting || !formData.email || !formData.password || !formData.firstName}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Opretter konto...
              </>
            ) : (
              'Opret konto'
            )}
          </Button>
        </form>

        {/* Terms and Privacy */}
        <p className="text-xs text-muted-foreground text-center">
          Ved at oprette en konto accepterer du vores{' '}
          <a href="/terms" className="text-primary hover:underline">
            Servicevilkår
          </a>{' '}
          og{' '}
          <a href="/privacy" className="text-primary hover:underline">
            Privatlivspolitik
          </a>
        </p>
      </CardContent>

      {showSignIn && (
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-muted-foreground text-center">
            Har du allerede en konto?{' '}
            <a href="/auth/signin" className="text-primary hover:underline font-medium">
              Log ind
            </a>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}