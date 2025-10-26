'use client'

import React, { useState } from 'react'
import { useAuth } from './SupabaseAuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Loader2, User, Mail, Settings, LogOut, Shield } from 'lucide-react'

// ============================================================================
// User Button Component (replaces Clerk's UserButton)
// ============================================================================

export const UserButton: React.FC = () => {
  const { user, signOut, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
    )
  }

  if (!user) {
    return null
  }

  const userInitials = user.user_metadata?.first_name && user.user_metadata?.last_name
    ? `${user.user_metadata.first_name[0]}${user.user_metadata.last_name[0]}`
    : user.email?.[0]?.toUpperCase() || 'U'

  const userName = user.user_metadata?.full_name || 
                   `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() ||
                   user.email?.split('@')[0] || 
                   'Bruger'

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/auth/signin'
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={user.user_metadata?.avatar_url} 
              alt={userName}
            />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <a href="/profile" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Profil</span>
          </a>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <a href="/settings" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Indstillinger</span>
          </a>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log ud</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ============================================================================
// User Profile Component (full profile management)
// ============================================================================

interface UserProfileProps {
  showCard?: boolean
}

export const UserProfile: React.FC<UserProfileProps> = ({ showCard = true }) => {
  const { user, loading } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    firstName: user?.user_metadata?.first_name || '',
    lastName: user?.user_metadata?.last_name || '',
    email: user?.email || ''
  })

  React.useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.user_metadata?.first_name || '',
        lastName: user.user_metadata?.last_name || '',
        email: user.email || ''
      })
    }
  }, [user])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setError(null)
    setSuccess(null)
    setIsSaving(true)

    try {
      // Update user metadata via Supabase
      const { supabase } = await import('@/lib/supabase')
      
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          full_name: `${formData.firstName} ${formData.lastName}`.trim()
        }
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess('Profil opdateret succesfuldt')
        setIsEditing(false)
      }
    } catch (err) {
      setError('Der opstod en fejl ved opdatering af profilen')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      firstName: user?.user_metadata?.first_name || '',
      lastName: user?.user_metadata?.last_name || '',
      email: user?.email || ''
    })
    setIsEditing(false)
    setError(null)
    setSuccess(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <Alert>
        <AlertDescription>
          Du skal være logget ind for at se din profil.
        </AlertDescription>
      </Alert>
    )
  }

  const userInitials = formData.firstName && formData.lastName
    ? `${formData.firstName[0]}${formData.lastName[0]}`
    : user.email?.[0]?.toUpperCase() || 'U'

  const content = (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex items-center space-x-4">
        <Avatar className="h-20 w-20">
          <AvatarImage 
            src={user.user_metadata?.avatar_url} 
            alt={`${formData.firstName} ${formData.lastName}`}
          />
          <AvatarFallback className="text-lg">{userInitials}</AvatarFallback>
        </Avatar>
        
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">
            {`${formData.firstName} ${formData.lastName}`.trim() || 'Bruger'}
          </h2>
          <p className="text-muted-foreground">{user.email}</p>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Medlem siden {new Date(user.created_at).toLocaleDateString('da-DK')}</span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Profile Form */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Profil Information</h3>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              Rediger
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Fornavn</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              disabled={!isEditing || isSaving}
              placeholder="Indtast fornavn"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Efternavn</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              disabled={!isEditing || isSaving}
              placeholder="Indtast efternavn"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              value={formData.email}
              disabled={true}
              className="pl-10"
              placeholder="Email kan ikke ændres"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Email adressen kan ikke ændres. Kontakt support hvis du har brug for hjælp.
          </p>
        </div>

        {isEditing && (
          <div className="flex space-x-2">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gemmer...
                </>
              ) : (
                'Gem ændringer'
              )}
            </Button>
            <Button 
              onClick={handleCancel} 
              variant="outline"
              disabled={isSaving}
              className="flex-1"
            >
              Annuller
            </Button>
          </div>
        )}
      </div>

      {/* Account Info */}
      <div className="space-y-4 pt-6 border-t">
        <h3 className="text-lg font-medium">Konto Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <Label className="text-muted-foreground">Bruger ID</Label>
            <p className="font-mono text-xs break-all">{user.id}</p>
          </div>
          
          <div>
            <Label className="text-muted-foreground">Email bekræftet</Label>
            <p className={user.email_confirmed_at ? 'text-green-600' : 'text-orange-600'}>
              {user.email_confirmed_at ? 'Ja' : 'Nej'}
            </p>
          </div>
          
          <div>
            <Label className="text-muted-foreground">Sidste login</Label>
            <p>{new Date(user.last_sign_in_at || user.created_at).toLocaleString('da-DK')}</p>
          </div>
          
          <div>
            <Label className="text-muted-foreground">Login metode</Label>
            <p className="capitalize">
              {user.app_metadata?.provider || 'Email'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  if (!showCard) {
    return content
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Min Profil</CardTitle>
        <CardDescription>
          Administrer dine konto oplysninger og indstillinger
        </CardDescription>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  )
}