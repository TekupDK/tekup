import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

interface ServiceFormValues {
  name: string;
  description?: string;
  price: number;
  duration: number;
}

interface ServiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ServiceFormValues) => void;
  initialData?: ServiceFormValues;
}

const ServiceForm: React.FC<ServiceFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || '');
      setPrice(initialData.price);
      setDuration(initialData.duration);
    } else {
      setName('');
      setDescription('');
      setPrice(0);
      setDuration(0);
    }
  }, [initialData, isOpen]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, description, price, duration });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Service' : 'Create Service'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Service Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <Textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <Input
              type="number"
              step="0.01"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              required
            />
          </div>
          <div>
            <Input
              type="number"
              placeholder="Duration (minutes)"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit">{initialData ? 'Save Changes' : 'Create'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceForm;