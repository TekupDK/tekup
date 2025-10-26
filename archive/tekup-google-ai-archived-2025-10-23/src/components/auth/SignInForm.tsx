'use client'

import React, { useState } from 'react'
import { useAuth } from './SupabaseAuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Lock, Chrome } from 'lucide-react'

// ============================================================================
// Sign In Form Component
// Replaces Clerk's SignIn component
// ============================================================================

interface SignInFormProps {
  redirectTo?: string
  showSignUp?: boolean
  onSuccess?: () => void
}

export const SignInForm: React.FC<SignInFormProps> = ({ 
  redirectTo = '/dashboard', 
  showSignUp = true,
  onSuccess 
}) => {
  const { signIn, signInWithGoogle, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const { error } = await signIn(email, password)
      
      if (error) {
        setError(error.message)
      } else {
        // Success - redirect or call onSuccess
        if (onSuccess) {
          onSuccess()
        } else {
          window.location.href = redirectTo
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setIsSubmitting(true)

    try {
      const { error } = await signInWithGoogle()
      
      if (error) {
        setError(error.message)
      }
      // Note: Google OAuth will redirect automatically, so no need to handle success here
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Log ind</CardTitle>
        <CardDescription className="text-center">
          Log ind på din RenOS konto
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Google Sign In Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
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
              Eller fortsæt med email
            </span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="din@email.dk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
                disabled={loading || isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Adgangskode</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
                disabled={loading || isSubmitting}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || isSubmitting || !email || !password}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logger ind...
              </>
            ) : (
              'Log ind'
            )}
          </Button>
        </form>

        {/* Forgot Password Link */}
        <div className="text-center">
          <a 
            href="/auth/forgot-password" 
            className="text-sm text-muted-foreground hover:text-primary underline"
          >
            Glemt adgangskode?
          </a>
        </div>
      </CardContent>

      {showSignUp && (
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-muted-foreground text-center">
            Har du ikke en konto?{' '}
            <a href="/auth/signup" className="text-primary hover:underline font-medium">
              Opret konto
            </a>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}

// ============================================================================
// Minimal Sign In Form (for modals/popups)
// ============================================================================

interface MinimalSignInFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export const MinimalSignInForm: React.FC<MinimalSignInFormProps> = ({ 
  onSuccess, 
  onCancel 
}) => {
  const { signInWithGoogle, loading } = useAuth()
  const [error, setError] = useState<string | null>(null)

  const handleGoogleSignIn = async () => {
    setError(null)
    try {
      const { error } = await signInWithGoogle()
      if (error) {
        setError(error.message)
      } else if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      setError('An unexpected error occurred')
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full"
        variant="outline"
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Chrome className="mr-2 h-4 w-4" />
        )}
        Log ind med Google
      </Button>

      {onCancel && (
        <Button
          onClick={onCancel}
          variant="ghost"
          className="w-full"
        >
          Annuller
        </Button>
      )}
    </div>
  )
}