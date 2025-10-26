import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash } from 'lucide-react';
import ServiceForm from '@/components/ServiceForm'; // Corrected import path
import { toast } from 'sonner';

interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
}

const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | undefined>(undefined);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services');
      if (response.ok) {
        const data = await response.json() as Service[];
        setServices(data);
      }
    } catch (error) {
      console.error('Failed to fetch services', error);
      toast.error('Could not fetch services.');
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchServices();
  }, []);

  const handleFormSubmit = async (data: Omit<Service, 'id'>) => {
    const method = editingService ? 'PUT' : 'POST';
    const url = editingService ? `/api/services/${editingService.id}` : '/api/services';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        void fetchServices(); // Refresh the list
        setIsFormOpen(false);
        setEditingService(undefined);
        toast.success(`Service ${editingService ? 'updated' : 'created'} successfully.`);
      } else {
        toast.error('Failed to save service.');
      }
    } catch (error) {
      console.error('Failed to save service', error);
      toast.error('An unexpected error occurred.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        const response = await fetch(`/api/services/${id}`, { method: 'DELETE' });
        if (response.ok) {
          void fetchServices(); // Refresh the list
          toast.success('Service deleted successfully.');
        } else {
          toast.error('Failed to delete service.');
        }
      } catch (error) {
        console.error('Failed to delete service', error);
        toast.error('An unexpected error occurred.');
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold" style={{ background: 'linear-gradient(90deg, var(--color-primary), var(--color-info))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Services</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Administrer dine tjenester og priser</p>
        </div>
        <Button
          onClick={() => { setEditingService(undefined); setIsFormOpen(true); }}
          className="btn-primary"
        >
          <Plus className="mr-2 h-4 w-4" /> Opret Service
        </Button>
      </header>

      {loading ? (
        <p>Loading services...</p>
      ) : services.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-12">
            <div className="flex flex-col items-center gap-6 text-center max-w-md mx-auto">
              <div className="p-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
                <Plus className="w-16 h-16 text-primary" />
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-foreground">Ingen services fundet</h2>
                <p className="text-muted-foreground text-lg">
                  Opret din første service for at komme i gang med priser og tilbud
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 w-full mt-4 text-left">
                <div className="p-4 rounded-lg bg-glass/30 border border-glass/50">
                  <p className="text-sm text-muted-foreground">
                    💼 <strong>Standard Rengøring</strong> - Almindelig rengøring af hjem
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-glass/30 border border-glass/50">
                  <p className="text-sm text-muted-foreground">
                    ✨ <strong>Dybderengøring</strong> - Grundig rengøring af alle rum
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-glass/30 border border-glass/50">
                  <p className="text-sm text-muted-foreground">
                    🏢 <strong>Erhvervsrengøring</strong> - Kontorer og forretninger
                  </p>
                </div>
              </div>

              <Button
                onClick={() => { setEditingService(undefined); setIsFormOpen(true); }}
                className="mt-4 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Opret Din Første Service
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id}>
              <CardHeader>
                <CardTitle>{service.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{service.description}</p>
                <div className="flex justify-between items-center mt-4">
                  <span className="font-bold">{service.price} kr.</span>
                  <span>{service.duration} min.</span>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline" size="icon" onClick={() => { setEditingService(service); setIsFormOpen(true); }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => void handleDelete(service.id)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ServiceForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={(data: Omit<Service, 'id'>) => void handleFormSubmit(data)}
        initialData={editingService}
      />
    </div>
  );
};

export default Services;