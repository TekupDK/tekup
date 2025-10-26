'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { 
  Building2, 
  Users, 
  Mail, 
  Crown, 
  Shield, 
  Settings,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  Globe,
  Zap,
  UserPlus
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Tenant {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  plan: 'starter' | 'professional' | 'enterprise';
  settings: {
    allowedDomains: string[];
    features: string[];
    userLimit: number;
  };
}

interface TenantUser {
  userId: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'user';
  joinedAt: string;
  status: 'active' | 'pending' | 'suspended';
}

export function TenantSettings() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    allowedDomains: '',
    features: [] as string[]
  });
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'user'>('user');

  useEffect(() => {
    loadTenantData();
  }, []);

  const loadTenantData = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('tekup_session') || '{}');
      if (!session.access_token) {
        toast.error('Ikke logget ind');
        return;
      }

      // Load tenant settings
      const tenantResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-68ad12b6/tenant/settings`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (tenantResponse.ok) {
        const tenantData = await tenantResponse.json();
        setTenant(tenantData);
        setEditForm({
          name: tenantData.name,
          allowedDomains: tenantData.settings.allowedDomains.join(', '),
          features: tenantData.settings.features
        });
      }

      // Mock users data for demo
      setUsers([
        {
          userId: '1',
          email: 'owner@tekup.dk',
          name: 'John Owner',
          role: 'owner',
          joinedAt: new Date().toISOString(),
          status: 'active'
        },
        {
          userId: '2',
          email: 'admin@tekup.dk',
          name: 'Jane Admin',
          role: 'admin',
          joinedAt: new Date(Date.now() - 86400000).toISOString(),
          status: 'active'
        }
      ]);

    } catch (error) {
      console.error('Failed to load tenant data:', error);
      toast.error('Kunne ikke hente tenant data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTenant = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('tekup_session') || '{}');
      if (!session.access_token) {
        toast.error('Ikke logget ind');
        return;
      }

      const updateData = {
        name: editForm.name,
        settings: {
          ...tenant?.settings,
          allowedDomains: editForm.allowedDomains
            .split(',')
            .map(domain => domain.trim())
            .filter(domain => domain.length > 0),
          features: editForm.features
        }
      };

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-68ad12b6/tenant/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error('Opdatering fejlede');
      }

      const result = await response.json();
      setTenant(result.tenant);
      setIsEditing(false);
      toast.success('Tenant indstillinger opdateret!');

    } catch (error) {
      console.error('Save tenant error:', error);
      toast.error('Kunne ikke gemme ændringer');
    }
  };

  const handleInviteUser = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('tekup_session') || '{}');
      if (!session.access_token) {
        toast.error('Ikke logget ind');
        return;
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-68ad12b6/tenant/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole
        })
      });

      if (!response.ok) {
        throw new Error('Invitation fejlede');
      }

      toast.success('Invitation sendt!');
      setInviteEmail('');
      setInviteRole('user');

    } catch (error) {
      console.error('Invite user error:', error);
      toast.error('Kunne ikke sende invitation');
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'starter': return 'bg-blue-500/20 text-blue-400 border-blue-400/30';
      case 'professional': return 'bg-purple-500/20 text-purple-400 border-purple-400/30';
      case 'enterprise': return 'bg-orange-500/20 text-orange-400 border-orange-400/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-400/30';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return Crown;
      case 'admin': return Shield;
      default: return Users;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!tenant) {
    return (
      <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10">
        <CardContent className="p-8 text-center">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Ingen tenant fundet</h3>
          <p className="text-gray-400">Der opstod en fejl ved hentning af tenant data.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tenant Overview */}
      <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">{tenant.name}</CardTitle>
                <p className="text-gray-400">Tenant ID: {tenant.id}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className={`${getPlanColor(tenant.plan)} border`}>
                {tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1)}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                {isEditing ? <X className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                {isEditing ? 'Annuller' : 'Rediger'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isEditing ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="tenantName" className="text-gray-200">Virksomhedsnavn</Label>
                <Input
                  id="tenantName"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="allowedDomains" className="text-gray-200">Tilladte domæner (kommasepareret)</Label>
                <Input
                  id="allowedDomains"
                  value={editForm.allowedDomains}
                  onChange={(e) => setEditForm({ ...editForm, allowedDomains: e.target.value })}
                  placeholder="@tekup.dk, @company.com"
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleSaveTenant}
                  className="bg-gradient-to-r from-emerald-500 to-green-600 text-white"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Gem ændringer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Annuller
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-white mb-2">Plan detaljer</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300">Max {tenant.settings.userLimit} brugere</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300">{tenant.settings.features.length} funktioner</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-2">Tilladte domæner</h4>
                <div className="space-y-1">
                  {tenant.settings.allowedDomains.length > 0 ? (
                    tenant.settings.allowedDomains.map((domain, index) => (
                      <Badge key={index} className="bg-cyan-500/20 text-cyan-400 border-cyan-400/30 mr-2">
                        {domain}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-400 text-sm">Alle domæner tilladt</span>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-2">Aktive funktioner</h4>
                <div className="space-y-1">
                  {tenant.settings.features.map((feature, index) => (
                    <Badge key={index} className="bg-purple-500/20 text-purple-400 border-purple-400/30 mr-2 mb-1">
                      {feature.replace('_', ' ').toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Management */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800/50 border border-white/10">
          <TabsTrigger value="users" className="text-white data-[state=active]:bg-white/10">
            Brugere ({users.length})
          </TabsTrigger>
          <TabsTrigger value="invites" className="text-white data-[state=active]:bg-white/10">
            Invitationer ({invites.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Brugere
                </CardTitle>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Email til invitation"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="bg-white/10 border-white/20 text-white w-48"
                    />
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as 'admin' | 'user')}
                      className="bg-white/10 border border-white/20 text-white rounded-md px-3 py-2"
                    >
                      <option value="user">Bruger</option>
                      <option value="admin">Admin</option>
                    </select>
                    <Button
                      onClick={handleInviteUser}
                      disabled={!inviteEmail}
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Inviter
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => {
                  const RoleIcon = getRoleIcon(user.role);
                  
                  return (
                    <motion.div
                      key={user.userId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium text-white">{user.name}</h4>
                          <p className="text-sm text-gray-300">{user.email}</p>
                          <p className="text-xs text-gray-400">
                            Tilsluttet {new Date(user.joinedAt).toLocaleDateString('da-DK')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Badge className={`${
                          user.role === 'owner' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30' :
                          user.role === 'admin' ? 'bg-purple-500/20 text-purple-400 border-purple-400/30' :
                          'bg-blue-500/20 text-blue-400 border-blue-400/30'
                        } border`}>
                          <RoleIcon className="w-3 h-3 mr-1" />
                          {user.role}
                        </Badge>
                        
                        <Badge className={`${
                          user.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-400/30' :
                          user.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30' :
                          'bg-red-500/20 text-red-400 border-red-400/30'
                        } border`}>
                          {user.status}
                        </Badge>
                        
                        {user.role !== 'owner' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invites" className="mt-6">
          <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                Ventende invitationer
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invites.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">Ingen ventende invitationer</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium text-white">{invite.email}</h4>
                        <p className="text-sm text-gray-300">Role: {invite.role}</p>
                        <p className="text-xs text-gray-400">
                          Sendt {new Date(invite.createdAt).toLocaleDateString('da-DK')}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-400/30 border">
                          Venter
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}