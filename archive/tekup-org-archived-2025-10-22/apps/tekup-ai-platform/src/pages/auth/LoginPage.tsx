import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Navigate } from 'react-router-dom'

export default function LoginPage() {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth()
  const [formData, setFormData] = useState({
    email: 'admin@tekup.dk',
    password: 'admin'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      await login(formData.email, formData.password)
      setSuccess('Login succesfuldt! Omdirigerer...')
    } catch (err: any) {
      setError(err.message || 'Der opstod en fejl under login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-md"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          Velkommen tilbage
        </h2>
        <p className="text-slate-400">
          Log ind på din TekUp AI platform
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
            Email adresse
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="input-glass w-full"
            placeholder="din@email.dk"
            disabled={isLoading || authLoading}
          />
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
            Adgangskode
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={formData.password}
              onChange={handleChange}
              className="input-glass w-full pr-12"
              placeholder="••••••••"
              disabled={isLoading || authLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              disabled={isLoading || authLoading}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 p-4 bg-danger-500/20 border border-danger-500/30 rounded-lg"
          >
            <AlertCircle className="w-5 h-5 text-danger-400 flex-shrink-0" />
            <p className="text-danger-300 text-sm">{error}</p>
          </motion.div>
        )}

        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 p-4 bg-success-500/20 border border-success-500/30 rounded-lg"
          >
            <CheckCircle className="w-5 h-5 text-success-400 flex-shrink-0" />
            <p className="text-success-300 text-sm">{success}</p>
          </motion.div>
        )}

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="w-4 h-4 bg-slate-700 border-slate-600 rounded text-primary-500 focus:ring-primary-500 focus:ring-2"
              disabled={isLoading || authLoading}
            />
            <span className="ml-2 text-sm text-slate-300">Husk mig</span>
          </label>
          <button
            type="button"
            className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
            disabled={isLoading || authLoading}
          >
            Glemt adgangskode?
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || authLoading}
          className="btn-primary w-full relative"
        >
          {isLoading || authLoading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader className="w-4 h-4 animate-spin" />
              <span>Logger ind...</span>
            </div>
          ) : (
            'Log ind'
          )}
        </button>

        {/* Demo Credentials */}
        <div className="text-center p-4 bg-slate-800/50 rounded-lg border border-slate-600/50">
          <p className="text-xs text-slate-400 mb-2">Demo adgangskoder:</p>
          <div className="text-xs text-slate-300 space-y-1">
            <div><strong>Admin:</strong> admin@tekup.dk / admin</div>
            <div><strong>Manager:</strong> manager@tekup.dk / manager</div>
            <div><strong>User:</strong> user@tekup.dk / user</div>
          </div>
        </div>
      </form>

      {/* Additional Options */}
      <div className="mt-8 space-y-4">
        {/* SSO Options */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-slate-800 text-slate-400">Eller log ind med</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button className="btn-glass flex items-center justify-center gap-2" disabled>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>
          <button className="btn-glass flex items-center justify-center gap-2" disabled>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
            Microsoft
          </button>
        </div>

        <p className="text-xs text-slate-400 text-center">
          Har du ikke en konto?{' '}
          <button className="text-primary-400 hover:text-primary-300 transition-colors">
            Kontakt support
          </button>
        </p>
      </div>
    </motion.div>
  )
}
