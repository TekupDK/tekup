/**
 * Edit Plan Modal (Category B - Sprint 1)
 * 
 * Modal for editing existing cleaning plans
 * Features:
 * - Pre-populated form with plan data
 * - Task management (add, remove, reorder)
 * - Price and duration recalculation
 * - Validation
 */

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, GripVertical, CheckSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.renos.dk';

interface Task {
  id?: string;
  name: string;
  description?: string;
  category: string;
  estimatedTime: number;
  isRequired: boolean;
  pricePerTask?: number;
  sortOrder: number;
}

interface EditPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  planId: string | null;
}

const serviceTypes = [
  'Fast Rengøring',
  'Flytterengøring',
  'Hovedrengøring',
  'Erhvervsrengøring',
  'Airbnb Rengøring',
  'Vinduespolering',
];

const frequencyOptions = [
  { value: 'once', label: 'Én gang' },
  { value: 'weekly', label: 'Ugentlig' },
  { value: 'biweekly', label: '14-dage' },
  { value: 'monthly', label: 'Månedlig' },
];

const taskCategories = [
  { value: 'Cleaning', label: 'Rengøring', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'Kitchen', label: 'Køkken', color: 'bg-green-500/20 text-green-400' },
  { value: 'Bathroom', label: 'Badeværelse', color: 'bg-purple-500/20 text-purple-400' },
  { value: 'Windows', label: 'Vinduer', color: 'bg-cyan-500/20 text-cyan-400' },
  { value: 'Special', label: 'Special', color: 'bg-yellow-500/20 text-yellow-400' },
];

const EditPlanModal = ({ isOpen, onClose, onSuccess, planId }: EditPlanModalProps) => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [serviceType, setServiceType] = useState('Fast Rengøring');
  const [frequency, setFrequency] = useState<'once' | 'weekly' | 'biweekly' | 'monthly'>('weekly');
  const [squareMeters, setSquareMeters] = useState<number | undefined>();
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAddTask, setShowAddTask] = useState(false);

  // New task form
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('Cleaning');
  const [newTaskTime, setNewTaskTime] = useState(15);

  useEffect(() => {
    if (isOpen && planId) {
      fetchPlanDetails();
    }
  }, [isOpen, planId]);

  const fetchPlanDetails = async () => {
    if (!planId) return;

    try {
      setFetching(true);
      const response = await fetch(`${API_URL}/api/cleaning-plans/${planId}`);
      const data = await response.json();

      if (data.success && data.data) {
        const plan = data.data;
        setName(plan.name || '');
        setDescription(plan.description || '');
        setServiceType(plan.serviceType || 'Fast Rengøring');
        setFrequency(plan.frequency || 'weekly');
        setSquareMeters(plan.squareMeters);
        setAddress(plan.address || '');
        setNotes(plan.notes || '');
        setTasks((plan.tasks || []).map((t: any, i: number) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          category: t.category,
          estimatedTime: t.estimatedTime,
          isRequired: t.isRequired,
          pricePerTask: t.pricePerTask,
          sortOrder: i,
        })));
      }
    } catch (error) {
      console.error('Error fetching plan:', error);
      alert('Kunne ikke hente plan detaljer');
    } finally {
      setFetching(false);
    }
  };

  const handleAddTask = () => {
    if (!newTaskName.trim()) return;

    const newTask: Task = {
      name: newTaskName,
      category: newTaskCategory,
      estimatedTime: newTaskTime,
      isRequired: true,
      sortOrder: tasks.length,
    };

    setTasks([...tasks, newTask]);
    setNewTaskName('');
    setNewTaskCategory('Cleaning');
    setNewTaskTime(15);
    setShowAddTask(false);
  };

  const handleRemoveTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleMoveTask = (index: number, direction: 'up' | 'down') => {
    const newTasks = [...tasks];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;

    if (swapIndex < 0 || swapIndex >= newTasks.length) return;

    [newTasks[index], newTasks[swapIndex]] = [newTasks[swapIndex], newTasks[index]];
    newTasks.forEach((task, i) => task.sortOrder = i);

    setTasks(newTasks);
  };

  const calculatePrice = () => {
    const totalMinutes = tasks.reduce((sum, task) => sum + task.estimatedTime, 0);
    const hours = totalMinutes / 60;
    const hourlyRate = 349;
    return Math.round(hours * hourlyRate);
  };

  const calculateDuration = () => {
    return tasks.reduce((sum, task) => sum + task.estimatedTime, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!planId) return;
    if (!name.trim()) {
      alert('Indtast venligst et navn til planen');
      return;
    }
    if (tasks.length === 0) {
      alert('Tilføj mindst én opgave til planen');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/cleaning-plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          serviceType,
          frequency,
          squareMeters,
          address,
          notes,
          tasks: tasks.map(({ id, name, description, category, estimatedTime, isRequired, pricePerTask }) => ({
            id,
            name,
            description,
            category,
            estimatedTime,
            isRequired,
            pricePerTask,
          })),
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        handleClose();
      } else {
        alert(`Fejl: ${data.error || 'Kunne ikke opdatere plan'}`);
      }
    } catch (error) {
      console.error('Error updating plan:', error);
      alert('Der opstod en fejl ved opdatering af planen');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setServiceType('Fast Rengøring');
    setFrequency('weekly');
    setSquareMeters(undefined);
    setAddress('');
    setNotes('');
    setTasks([]);
    setShowAddTask(false);
    onClose();
  };

  if (!isOpen) return null;

  const estimatedPrice = calculatePrice();
  const estimatedDuration = calculateDuration();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-cyan-400" />
            Rediger Rengøringsplan
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="hover:bg-red-500/10"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Loading State */}
        {fetching ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="text-center">
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-cyan-400" />
              <p className="text-muted-foreground">Henter plan detaljer...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Plan Navn *</label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="F.eks. 'Ugentlig Kontorrengøring 150m²'"
                    className="glass"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="serviceType" className="text-sm font-medium">Service Type *</label>
                  <select
                    id="serviceType"
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full glass rounded-md px-3 py-2 text-sm"
                  >
                    {serviceTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="frequency" className="text-sm font-medium">Frekvens *</label>
                  <select
                    id="frequency"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full glass rounded-md px-3 py-2 text-sm"
                  >
                    {frequencyOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="squareMeters" className="text-sm font-medium">Kvadratmeter</label>
                  <Input
                    id="squareMeters"
                    type="number"
                    value={squareMeters || ''}
                    onChange={(e) => setSquareMeters(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="80"
                    className="glass"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="address" className="text-sm font-medium">Adresse</label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Eksempel Vej 123, 8000 Aarhus"
                    className="glass"
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">Beskrivelse</label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detaljeret beskrivelse af planen..."
                    className="glass min-h-[80px]"
                  />
                </div>
              </div>

              {/* Price & Duration Summary */}
              <div className="grid grid-cols-3 gap-4 p-4 glass rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-400">{tasks.length}</div>
                  <div className="text-xs text-muted-foreground">Opgaver</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {Math.floor(estimatedDuration / 60)}:{(estimatedDuration % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="text-xs text-muted-foreground">Estimeret tid</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{estimatedPrice.toLocaleString()} kr</div>
                  <div className="text-xs text-muted-foreground">Estimeret pris</div>
                </div>
              </div>

              {/* Tasks Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium">Opgaver ({tasks.length})</span>
                  <Button
                    type="button"
                    onClick={() => setShowAddTask(true)}
                    size="sm"
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Tilføj Opgave
                  </Button>
                </div>

                {/* Task List */}
                <div className="space-y-2">
                  {tasks.map((task, index) => {
                    const category = taskCategories.find(c => c.value === task.category);
                    return (
                      <div key={task.id || index} className="glass p-3 rounded-lg flex items-center gap-3">
                        <div className="flex flex-col gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveTask(index, 'up')}
                            disabled={index === 0}
                            className="h-4 w-4 p-0"
                          >
                            <GripVertical className="w-3 h-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveTask(index, 'down')}
                            disabled={index === tasks.length - 1}
                            className="h-4 w-4 p-0"
                          >
                            <GripVertical className="w-3 h-3" />
                          </Button>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{task.name}</span>
                            <Badge className={category?.color}>{category?.label}</Badge>
                          </div>
                          {task.description && (
                            <p className="text-xs text-muted-foreground">{task.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{task.estimatedTime} min</Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveTask(index)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                  {tasks.length === 0 && (
                    <div className="text-center py-8 glass rounded-lg">
                      <CheckSquare className="w-12 h-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">Ingen opgaver tilføjet endnu</p>
                      <p className="text-sm text-muted-foreground">Klik på "Tilføj Opgave" for at komme i gang</p>
                    </div>
                  )}
                </div>

                {/* Add Task Form */}
                {showAddTask && (
                  <div className="glass p-4 rounded-lg space-y-3 border-2 border-cyan-500/20">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Plus className="w-4 h-4 text-cyan-400" />
                      Ny Opgave
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <Input
                        placeholder="Opgave navn"
                        value={newTaskName}
                        onChange={(e) => setNewTaskName(e.target.value)}
                        className="glass col-span-2"
                      />
                      <select
                        value={newTaskCategory}
                        onChange={(e) => setNewTaskCategory(e.target.value)}
                        className="glass rounded-md px-3 py-2 text-sm"
                      >
                        {taskCategories.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                      <Input
                        type="number"
                        placeholder="Minutter"
                        value={newTaskTime}
                        onChange={(e) => setNewTaskTime(Number(e.target.value))}
                        className="glass"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={handleAddTask}
                        size="sm"
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      >
                        Tilføj
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setShowAddTask(false)}
                        size="sm"
                        variant="outline"
                      >
                        Annuller
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label htmlFor="notes" className="text-sm font-medium">Noter</label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ekstra noter eller instruktioner..."
                  className="glass min-h-[80px]"
                />
              </div>
            </form>

            {/* Footer */}
            <div className="flex justify-end gap-2 p-6 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Annuller
              </Button>
              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={loading}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              >
                {loading ? 'Gemmer...' : 'Gem Ændringer'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EditPlanModal;
