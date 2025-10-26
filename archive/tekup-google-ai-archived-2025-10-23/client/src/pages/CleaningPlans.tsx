/**
 * Cleaning Plans Page (Category B - Sprint 1)
 * 
 * Features:
 * - List all cleaning plans with templates
 * - Create new plans with task checklist builder
 * - Edit existing plans
 * - Link plans to bookings
 * - Calculate pricing based on tasks and square meters
 */

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Copy, CheckSquare, Calendar, DollarSign, Clock, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import CreatePlanModal from '@/components/CreatePlanModal';
import EditPlanModal from '@/components/EditPlanModal';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.renos.dk';

interface CleaningTask {
  id: string;
  name: string;
  description?: string;
  category: string;
  estimatedTime: number;
  isRequired: boolean;
  isCompleted: boolean;
  sortOrder: number;
  pricePerTask?: number;
}

interface CleaningPlan {
  id: string;
  customerId: string;
  name: string;
  description?: string;
  serviceType: string;
  frequency: 'once' | 'weekly' | 'biweekly' | 'monthly';
  isTemplate: boolean;
  isActive: boolean;
  estimatedDuration: number;
  estimatedPrice?: number;
  squareMeters?: number;
  address?: string;
  notes?: string;
  tasks: CleaningTask[];
  createdAt: string;
  updatedAt: string;
  customer?: {
    name: string;
    email?: string;
  };
}

const CleaningPlans = () => {
  const [plans, setPlans] = useState<CleaningPlan[]>([]);
  const [templates, setTemplates] = useState<CleaningPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'plans' | 'templates'>('plans');
  const [selectedPlan, setSelectedPlan] = useState<CleaningPlan | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchPlans();
    fetchTemplates();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      // TODO: Implement customer ID from auth context
      const customerId = 'default'; // Placeholder
      const response = await fetch(`${API_URL}/api/cleaning-plans/customer/${customerId}`);
      const data = await response.json();
      if (data.success) {
        setPlans(data.data);
      }
    } catch (error) {
      console.error('Error fetching cleaning plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${API_URL}/api/cleaning-plans/templates`);
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Er du sikker på at du vil slette denne plan?')) return;

    try {
      const response = await fetch(`${API_URL}/api/cleaning-plans/${planId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setPlans(plans.filter(p => p.id !== planId));
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
    }
  };

  const handleDuplicatePlan = async (plan: CleaningPlan) => {
    try {
      const response = await fetch(`${API_URL}/api/cleaning-plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...plan,
          name: `${plan.name} (Kopi)`,
          id: undefined,
          createdAt: undefined,
          updatedAt: undefined,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setPlans([...plans, data.data]);
      }
    } catch (error) {
      console.error('Error duplicating plan:', error);
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      once: 'Én gang',
      weekly: 'Ugentlig',
      biweekly: '14-dage',
      monthly: 'Månedlig',
    };
    return labels[frequency] || frequency;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Cleaning: 'bg-blue-500/20 text-blue-400',
      Kitchen: 'bg-green-500/20 text-green-400',
      Bathroom: 'bg-purple-500/20 text-purple-400',
      Windows: 'bg-cyan-500/20 text-cyan-400',
      Special: 'bg-yellow-500/20 text-yellow-400',
    };
    return colors[category] || 'bg-gray-500/20 text-gray-400';
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours} timer`;
    return `${hours}t ${mins}m`;
  };

  const displayPlans = view === 'plans' ? plans : templates;

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="glass-card mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              <CheckSquare className="inline-block w-8 h-8 mr-3 text-cyan-400" />
              Rengøringsplaner
            </h1>
            <p className="text-muted-foreground">
              Opret genbrugelige planer med checklists og opgaver
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Opret Plan
          </Button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={view === 'plans' ? 'default' : 'outline'}
          onClick={() => setView('plans')}
          className={view === 'plans' ? 'bg-cyan-500 hover:bg-cyan-600' : ''}
        >
          <CheckSquare className="w-4 h-4 mr-2" />
          Mine Planer ({plans.length})
        </Button>
        <Button
          variant={view === 'templates' ? 'default' : 'outline'}
          onClick={() => setView('templates')}
          className={view === 'templates' ? 'bg-cyan-500 hover:bg-cyan-600' : ''}
        >
          <Copy className="w-4 h-4 mr-2" />
          Skabeloner ({templates.length})
        </Button>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Indlæser planer...</p>
        </div>
      ) : displayPlans.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <CheckSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Ingen planer endnu</h3>
            <p className="text-muted-foreground mb-4">
              {view === 'plans'
                ? 'Opret din første rengøringsplan for at komme i gang'
                : 'Vælg en skabelon og tilpas den til dine behov'}
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Opret Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayPlans.map((plan) => (
            <Card key={plan.id} className="glass-card hover:glass-card-hover transition-all">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{plan.name}</CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getCategoryColor(plan.serviceType)}>
                        {plan.serviceType}
                      </Badge>
                      <Badge variant="outline">
                        {getFrequencyLabel(plan.frequency)}
                      </Badge>
                      {plan.isTemplate && (
                        <Badge className="bg-purple-500/20 text-purple-400">
                          Skabelon
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {plan.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {plan.description}
                  </p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>{formatDuration(plan.estimatedDuration)}</span>
                  </div>
                  {plan.estimatedPrice && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <span>{plan.estimatedPrice.toLocaleString()} kr</span>
                    </div>
                  )}
                  {plan.squareMeters && (
                    <div className="flex items-center gap-2 text-sm">
                      <Home className="w-4 h-4 text-blue-400" />
                      <span>{plan.squareMeters} m²</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <CheckSquare className="w-4 h-4 text-purple-400" />
                    <span>{plan.tasks.length} opgaver</span>
                  </div>
                </div>

                {/* Tasks Preview */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                    Opgaver:
                  </h4>
                  <div className="space-y-1">
                    {plan.tasks.slice(0, 3).map((task) => (
                      <div key={task.id} className="text-sm flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getCategoryColor(task.category)}`} />
                        <span className="truncate">{task.name}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {task.estimatedTime}m
                        </span>
                      </div>
                    ))}
                    {plan.tasks.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{plan.tasks.length - 3} flere opgaver
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedPlan(plan)}
                    className="flex-1"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Rediger
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDuplicatePlan(plan)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  {!plan.isTemplate && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeletePlan(plan.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreatePlanModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchPlans();
          setShowCreateModal(false);
        }}
        customerId="default"
      />

      <EditPlanModal
        isOpen={selectedPlan !== null}
        onClose={() => setSelectedPlan(null)}
        onSuccess={() => {
          fetchPlans();
          setSelectedPlan(null);
        }}
        planId={selectedPlan?.id || null}
      />
    </div>
  );
};

export default CleaningPlans;
