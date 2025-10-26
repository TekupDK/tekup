'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Calendar, Clock, Users, Building2, Mail, Phone, CheckCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface DemoBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DemoBookingModal({ isOpen, onClose }: DemoBookingModalProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    employees: '',
    timeSlot: '',
    interests: [] as string[],
    message: ''
  });

  const timeSlots = [
    { value: 'mon-09', label: 'Mandag 9:00-10:00' },
    { value: 'mon-14', label: 'Mandag 14:00-15:00' },
    { value: 'tue-10', label: 'Tirsdag 10:00-11:00' },
    { value: 'tue-15', label: 'Tirsdag 15:00-16:00' },
    { value: 'wed-09', label: 'Onsdag 9:00-10:00' },
    { value: 'wed-13', label: 'Onsdag 13:00-14:00' },
    { value: 'thu-11', label: 'Torsdag 11:00-12:00' },
    { value: 'thu-16', label: 'Torsdag 16:00-17:00' },
    { value: 'fri-10', label: 'Fredag 10:00-11:00' },
    { value: 'fri-14', label: 'Fredag 14:00-15:00' }
  ];

  const interestOptions = [
    { id: 'crm', label: 'CRM Integration', icon: Users },
    { id: 'leads', label: 'Lead Platform', icon: Building2 },
    { id: 'ai', label: 'Jarvis AI', icon: CheckCircle },
    { id: 'security', label: 'Multi-tenant Sikkerhed', icon: CheckCircle },
    { id: 'integrations', label: 'API & Integrationer', icon: CheckCircle }
  ];

  const employeeSizes = [
    { value: '1-10', label: '1-10 medarbejdere' },
    { value: '11-50', label: '11-50 medarbejdere' },
    { value: '51-100', label: '51-100 medarbejdere' },
    { value: '100+', label: '100+ medarbejdere' }
  ];

  const handleInterestToggle = (interestId: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(id => id !== interestId)
        : [...prev.interests, interestId]
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.success('Demo booket!', {
      description: 'Vi har sendt bekræftelse til din email. Vi glæder os til at møde dig!',
      duration: 5000
    });
    
    setIsSubmitting(false);
    setStep(3);
    
    // Close modal after success message
    setTimeout(() => {
      onClose();
      setStep(1);
      setFormData({
        name: '',
        email: '',
        company: '',
        phone: '',
        employees: '',
        timeSlot: '',
        interests: [],
        message: ''
      });
    }, 3000);
  };

  const canProceedToStep2 = formData.name && formData.email && formData.company && formData.employees;
  const canSubmit = canProceedToStep2 && formData.timeSlot;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass border-[var(--color-tekup-glass-border)] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-[var(--color-tekup-accent)]" />
            <span>Book personlig demo</span>
          </DialogTitle>
          <DialogDescription>
            Få en skræddersyet demo af Tekup platformen (15-20 minutter)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center space-x-2">
                <motion.div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step >= stepNumber
                      ? 'bg-gradient-to-r from-[var(--color-tekup-primary)] to-[var(--color-tekup-accent)] text-white'
                      : 'bg-white/10 text-muted-foreground'
                  }`}
                  animate={step >= stepNumber ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {step > stepNumber ? <CheckCircle className="w-4 h-4" /> : stepNumber}
                </motion.div>
                {stepNumber < 3 && (
                  <div className={`w-8 h-0.5 transition-colors ${
                    step > stepNumber ? 'bg-[var(--color-tekup-accent)]' : 'bg-white/10'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Basic Information */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Fulde navn *</Label>
                  <Input
                    id="name"
                    placeholder="Dit fulde navn"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="glass border-[var(--color-tekup-glass-border)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="din@email.dk"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="glass border-[var(--color-tekup-glass-border)]"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Virksomhed *</Label>
                  <Input
                    id="company"
                    placeholder="Din virksomhed"
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    className="glass border-[var(--color-tekup-glass-border)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    placeholder="+45 12 34 56 78"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="glass border-[var(--color-tekup-glass-border)]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Virksomhedsstørrelse *</Label>
                <Select 
                  value={formData.employees} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, employees: value }))}
                >
                  <SelectTrigger className="glass border-[var(--color-tekup-glass-border)]">
                    <SelectValue placeholder="Vælg antal medarbejdere" />
                  </SelectTrigger>
                  <SelectContent className="glass border-[var(--color-tekup-glass-border)]">
                    {employeeSizes.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          )}

          {/* Step 2: Interests & Scheduling */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-3">
                <Label>Hvad interesserer dig mest? (vælg flere)</Label>
                <div className="grid md:grid-cols-2 gap-3">
                  {interestOptions.map((interest) => (
                    <motion.div
                      key={interest.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Badge
                        className={`p-3 cursor-pointer transition-all w-full justify-start ${
                          formData.interests.includes(interest.id)
                            ? 'bg-[var(--color-tekup-accent)]/20 border-[var(--color-tekup-accent)] text-[var(--color-tekup-accent)]'
                            : 'glass border-[var(--color-tekup-glass-border)] hover:border-[var(--color-tekup-accent)]/50'
                        }`}
                        onClick={() => handleInterestToggle(interest.id)}
                      >
                        <interest.icon className="w-4 h-4 mr-2" />
                        {interest.label}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Vælg tidspunkt *</Label>
                <div className="grid md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {timeSlots.map((slot) => (
                    <motion.div
                      key={slot.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Badge
                        className={`p-3 cursor-pointer transition-all w-full justify-start ${
                          formData.timeSlot === slot.value
                            ? 'bg-[var(--color-tekup-primary)]/20 border-[var(--color-tekup-primary)] text-[var(--color-tekup-primary)]'
                            : 'glass border-[var(--color-tekup-glass-border)] hover:border-[var(--color-tekup-primary)]/50'
                        }`}
                        onClick={() => setFormData(prev => ({ ...prev, timeSlot: slot.value }))}
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        {slot.label}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Besked (valgfrit)</Label>
                <Textarea
                  id="message"
                  placeholder="Fortæl os om dine specifikke behov eller spørgsmål..."
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  className="glass border-[var(--color-tekup-glass-border)] min-h-[100px]"
                />
              </div>
            </motion.div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 10 }}
                className="w-16 h-16 mx-auto bg-gradient-to-r from-[var(--color-tekup-success)] to-green-400 rounded-full flex items-center justify-center"
              >
                <CheckCircle className="w-8 h-8 text-white" />
              </motion.div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Demo er booket! 🎉</h3>
                <p className="text-muted-foreground">
                  Vi har sendt en bekræftelse til <strong>{formData.email}</strong>
                </p>
              </div>

              <div className="glass rounded-lg p-6 text-left space-y-3">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-[var(--color-tekup-accent)]" />
                  <span>{timeSlots.find(slot => slot.value === formData.timeSlot)?.label}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-[var(--color-tekup-accent)]" />
                  <span>15-20 minutter</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-[var(--color-tekup-accent)]" />
                  <span>Mødeinvitation sendt til din email</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Leder vores salgsteam tager kontakt inden mødet for at tilpasse demoen til dine behov.
              </p>
            </motion.div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between pt-4 border-t border-white/10">
            {step > 1 && step < 3 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="glass border-[var(--color-tekup-glass-border)]"
              >
                Tilbage
              </Button>
            )}
            
            {step < 3 && (
              <div className="ml-auto">
                {step === 1 ? (
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!canProceedToStep2}
                    className="bg-gradient-to-r from-[var(--color-tekup-primary)] to-[var(--color-tekup-accent)] text-white border-0"
                  >
                    Næste
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!canSubmit || isSubmitting}
                    className="bg-gradient-to-r from-[var(--color-tekup-primary)] to-[var(--color-tekup-accent)] text-white border-0"
                  >
                    {isSubmitting ? 'Booker...' : 'Book demo'}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}