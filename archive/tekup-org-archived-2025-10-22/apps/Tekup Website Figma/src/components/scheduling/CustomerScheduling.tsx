'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Calendar, Clock, MapPin, User, Phone, Mail, Plus, CheckCircle2, AlertCircle, DollarSign } from 'lucide-react';
import { format, addDays, startOfWeek, eachDayOfInterval, endOfWeek, isSameDay } from 'date-fns';
import { da } from 'date-fns/locale';

interface TimeSlot {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  available: boolean;
  price?: number;
  teamMember?: string;
}

interface BookingRequest {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  jobType: 'kontorrenhold' | 'privat' | 'specialrengøring' | 'vinduespolering';
  preferredDate: Date;
  preferredTime: string;
  duration: number;
  frequency: 'one_time' | 'weekly' | 'biweekly' | 'monthly';
  notes: string;
  status: 'pending' | 'confirmed' | 'declined';
  estimatedPrice: number;
  urgency: 'high' | 'medium' | 'low';
  createdAt: Date;
}

interface CustomerSchedulingProps {
  onBookingConfirm?: (booking: BookingRequest) => void;
  onBookingDecline?: (bookingId: string) => void;
}

export function CustomerScheduling({ onBookingConfirm, onBookingDecline }: CustomerSchedulingProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [filterJobType, setFilterJobType] = useState<string>('all');

  // Mock available time slots with realistic Danish pricing
  const [timeSlots] = useState<TimeSlot[]>([
    // Monday slots
    { id: '1', date: new Date(2024, 11, 16), startTime: '08:00', endTime: '11:00', available: true, price: 2400, teamMember: 'Maria Hansen' },
    { id: '2', date: new Date(2024, 11, 16), startTime: '11:30', endTime: '14:30', available: true, price: 2400, teamMember: 'Peter Nielsen' },
    { id: '3', date: new Date(2024, 11, 16), startTime: '15:00', endTime: '18:00', available: false },
    
    // Tuesday slots
    { id: '4', date: new Date(2024, 11, 17), startTime: '09:00', endTime: '12:00', available: true, price: 2100, teamMember: 'Anna Larsen' },
    { id: '5', date: new Date(2024, 11, 17), startTime: '13:00', endTime: '16:00', available: true, price: 2100, teamMember: 'Lars Kristensen' },
    
    // Wednesday slots
    { id: '6', date: new Date(2024, 11, 18), startTime: '08:00', endTime: '12:00', available: true, price: 3200, teamMember: 'Michael Olsen' },
    { id: '7', date: new Date(2024, 11, 18), startTime: '14:00', endTime: '17:00', available: true, price: 2400, teamMember: 'Mette Sørensen' },
    
    // Thursday slots
    { id: '8', date: new Date(2024, 11, 19), startTime: '10:00', endTime: '13:00', available: true, price: 2100, teamMember: 'Anna Larsen' },
    { id: '9', date: new Date(2024, 11, 19), startTime: '15:00', endTime: '18:00', available: false },
    
    // Friday slots
    { id: '10', date: new Date(2024, 11, 20), startTime: '08:00', endTime: '11:00', available: true, price: 2400, teamMember: 'Maria Hansen' },
    { id: '11', date: new Date(2024, 11, 20), startTime: '12:00', endTime: '15:00', available: true, price: 2100, teamMember: 'Peter Nielsen' }
  ]);

  // Mock booking requests with realistic Danish data
  const [bookingRequests] = useState<BookingRequest[]>([
    {
      id: '1',
      customerName: 'Natascha Kring',
      customerEmail: 'natascha@kringpartners.dk',
      customerPhone: '42 18 75 93',
      address: 'Nørrebrogade 66, 2200 København N',
      jobType: 'kontorrenhold',
      preferredDate: new Date(2024, 11, 16),
      preferredTime: '17:00',
      duration: 120,
      frequency: 'weekly',
      notes: 'Akut behov - kræver svar i dag. Kan være fleksibel med tid.',
      status: 'pending',
      estimatedPrice: 2800,
      urgency: 'high',
      createdAt: new Date(2024, 11, 15, 14, 30)
    },
    {
      id: '2',
      customerName: 'Henrik Madsen',
      customerEmail: 'henrik@madfirma.dk',
      customerPhone: '23 45 67 89',
      address: 'Østerbrogade 120, 2100 København Ø',
      jobType: 'privat',
      preferredDate: new Date(2024, 11, 18),
      preferredTime: '10:00',
      duration: 180,
      frequency: 'monthly',
      notes: 'Stor 4-værelses lejlighed. Kæledyr (2 katte) - allergivenlige produkter ønskes.',
      status: 'pending',
      estimatedPrice: 3500,
      urgency: 'medium',
      createdAt: new Date(2024, 11, 15, 9, 15)
    },
    {
      id: '3',
      customerName: 'Søren Nielsen',
      customerEmail: 'soren@techsolutions.dk',
      customerPhone: '87 65 43 21',
      address: 'Vesterbrogade 45, 1620 København V',
      jobType: 'specialrengøring',
      preferredDate: new Date(2024, 11, 20),
      preferredTime: '18:00',
      duration: 240,
      frequency: 'one_time',
      notes: 'Flytterengøring - skal være perfekt. Budget er ikke en begrænsning.',
      status: 'confirmed',
      estimatedPrice: 4800,
      urgency: 'low',
      createdAt: new Date(2024, 11, 14, 16, 45)
    }
  ]);

  const [newBooking, setNewBooking] = useState<Partial<BookingRequest>>({
    jobType: 'kontorrenhold',
    frequency: 'one_time',
    urgency: 'medium'
  });

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getSlotsForDate = (date: Date) => {
    return timeSlots.filter(slot => isSameDay(slot.date, date));
  };

  const getJobTypeColor = (type: BookingRequest['jobType']) => {
    switch (type) {
      case 'kontorrenhold': return 'bg-blue-500 text-white';
      case 'privat': return 'bg-green-500 text-white';
      case 'specialrengøring': return 'bg-purple-500 text-white';
      case 'vinduespolering': return 'bg-cyan-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getUrgencyColor = (urgency: BookingRequest['urgency']) => {
    switch (urgency) {
      case 'high': return 'text-red-400 bg-red-500/20 border-red-500';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500';
      case 'low': return 'text-green-400 bg-green-500/20 border-green-500';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500';
    }
  };

  const getFrequencyText = (frequency: BookingRequest['frequency']) => {
    switch (frequency) {
      case 'weekly': return 'Ugentlig';
      case 'biweekly': return 'Hver 14. dag';
      case 'monthly': return 'Månedlig';
      default: return 'Engangs';
    }
  };

  const calculatePrice = (jobType: string, duration: number, frequency: string) => {
    const baseRate = 160; // DKK per hour
    let multiplier = 1;
    
    switch (jobType) {
      case 'specialrengøring': multiplier = 1.5; break;
      case 'vinduespolering': multiplier = 1.3; break;
      case 'privat': multiplier = 1.1; break;
    }
    
    if (frequency !== 'one_time') multiplier *= 0.9; // Discount for recurring
    
    return Math.round((duration / 60) * baseRate * multiplier);
  };

  const handleBookingSubmit = () => {
    if (!selectedSlot || !newBooking.customerName) return;
    
    const booking: BookingRequest = {
      id: `booking-${Date.now()}`,
      customerName: newBooking.customerName!,
      customerEmail: newBooking.customerEmail || '',
      customerPhone: newBooking.customerPhone || '',
      address: newBooking.address || '',
      jobType: newBooking.jobType || 'kontorrenhold',
      preferredDate: selectedSlot.date,
      preferredTime: selectedSlot.startTime,
      duration: parseInt(selectedSlot.endTime.split(':')[0]) * 60 + parseInt(selectedSlot.endTime.split(':')[1]) - 
                (parseInt(selectedSlot.startTime.split(':')[0]) * 60 + parseInt(selectedSlot.startTime.split(':')[1])),
      frequency: newBooking.frequency || 'one_time',
      notes: newBooking.notes || '',
      status: 'pending',
      estimatedPrice: selectedSlot.price || 0,
      urgency: newBooking.urgency || 'medium',
      createdAt: new Date()
    };
    
    onBookingConfirm?.(booking);
    setShowBookingForm(false);
    setSelectedSlot(null);
    setNewBooking({ jobType: 'kontorrenhold', frequency: 'one_time', urgency: 'medium' });
  };

  const pendingRequests = bookingRequests.filter(req => req.status === 'pending');
  const filteredRequests = filterJobType === 'all' ? pendingRequests : pendingRequests.filter(req => req.jobType === filterJobType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Kunde Booking</h2>
          <p className="text-gray-300">
            Administrer kundernes bookinganmodninger og tilgængelige tider
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={filterJobType}
            onChange={(e) => setFilterJobType(e.target.value)}
            className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">Alle job typer</option>
            <option value="kontorrenhold">Kontorrenhold</option>
            <option value="privat">Privat renhold</option>
            <option value="specialrengøring">Specialrengøring</option>
            <option value="vinduespolering">Vinduespolering</option>
          </select>
          
          <Button
            onClick={() => setShowBookingForm(true)}
            className="bg-gradient-to-r from-emerald-500 to-green-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Manuel Booking
          </Button>
        </div>
      </div>

      {/* Pending Requests */}
      <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>Ventende Bookinganmodninger ({filteredRequests.length})</span>
            <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
              {pendingRequests.filter(req => req.urgency === 'high').length} høj prioritet
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">Ingen ventende bookinganmodninger</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 rounded-lg p-4 border border-white/10"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center space-x-3">
                        <Badge className={getJobTypeColor(request.jobType)}>
                          {request.jobType}
                        </Badge>
                        <Badge className={getUrgencyColor(request.urgency)} variant="outline">
                          {request.urgency === 'high' ? '🔴 Høj' : 
                           request.urgency === 'medium' ? '🟡 Medium' : '🟢 Lav'} prioritet
                        </Badge>
                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                          {getFrequencyText(request.frequency)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center space-x-2 text-white font-medium mb-1">
                            <User className="w-4 h-4" />
                            <span>{request.customerName}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-400 text-sm mb-1">
                            <Mail className="w-4 h-4" />
                            <span>{request.customerEmail}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-400 text-sm mb-1">
                            <Phone className="w-4 h-4" />
                            <span>{request.customerPhone}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-400 text-sm">
                            <MapPin className="w-4 h-4" />
                            <span>{request.address}</span>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2 text-gray-300 text-sm mb-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Ønsket: {format(request.preferredDate, 'EEEE d. MMMM', { locale: da })} kl. {request.preferredTime}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-300 text-sm mb-2">
                            <Clock className="w-4 h-4" />
                            <span>{request.duration} minutter</span>
                          </div>
                          <div className="flex items-center space-x-2 text-green-400 text-sm font-medium">
                            <DollarSign className="w-4 h-4" />
                            <span>{request.estimatedPrice.toLocaleString('da-DK')} kr</span>
                          </div>
                        </div>
                      </div>
                      
                      {request.notes && (
                        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded p-3">
                          <p className="text-yellow-200 text-sm">
                            <strong>Bemærkninger:</strong> {request.notes}
                          </p>
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        Anmodning modtaget: {format(request.createdAt, 'dd/MM/yyyy HH:mm', { locale: da })}
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 lg:ml-6">
                      <Button
                        onClick={() => onBookingConfirm?.(request)}
                        className="bg-gradient-to-r from-emerald-500 to-green-600 text-white"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Bekræft
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => onBookingDecline?.(request.id)}
                        className="border-red-500 text-red-400 hover:bg-red-500/10"
                      >
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Afvis
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-cyan-400 hover:text-cyan-300"
                      >
                        Alternativ tid
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Time Slots Calendar */}
      <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10">
        <CardHeader>
          <CardTitle className="text-white">
            Tilgængelige Tider - {format(weekStart, 'MMM yyyy', { locale: da })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const daySlots = getSlotsForDate(day);
              const availableSlots = daySlots.filter(slot => slot.available);
              
              return (
                <div key={day.toISOString()} className="space-y-2">
                  <div className="text-center p-2 rounded-lg bg-white/5">
                    <div className="text-xs font-medium text-gray-300">
                      {format(day, 'EEE', { locale: da })}
                    </div>
                    <div className="text-lg font-bold text-white">
                      {format(day, 'd')}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    {daySlots.map((slot) => (
                      <motion.button
                        key={slot.id}
                        whileHover={{ scale: slot.available ? 1.02 : 1 }}
                        whileTap={{ scale: slot.available ? 0.98 : 1 }}
                        onClick={() => slot.available && setSelectedSlot(slot)}
                        disabled={!slot.available}
                        className={`w-full p-2 rounded text-xs transition-all ${
                          slot.available
                            ? selectedSlot?.id === slot.id
                              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                              : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30 cursor-not-allowed'
                        }`}
                      >
                        <div className="font-medium">
                          {slot.startTime}-{slot.endTime}
                        </div>
                        {slot.available ? (
                          <div className="text-xs opacity-80">
                            {slot.price?.toLocaleString('da-DK')} kr
                          </div>
                        ) : (
                          <div className="text-xs">Optaget</div>
                        )}
                        {slot.available && slot.teamMember && (
                          <div className="text-xs opacity-60 mt-1">
                            {slot.teamMember}
                          </div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          
          {selectedSlot && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-cyan-500/20 border border-cyan-500/30 rounded-lg"
            >
              <h4 className="text-cyan-300 font-semibold mb-2">Valgt tidspunkt</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Dato: </span>
                  <span className="text-white">{format(selectedSlot.date, 'EEEE d. MMMM', { locale: da })}</span>
                </div>
                <div>
                  <span className="text-gray-400">Tid: </span>
                  <span className="text-white">{selectedSlot.startTime} - {selectedSlot.endTime}</span>
                </div>
                <div>
                  <span className="text-gray-400">Pris: </span>
                  <span className="text-green-400 font-medium">{selectedSlot.price?.toLocaleString('da-DK')} kr</span>
                </div>
                <div>
                  <span className="text-gray-400">Medarbejder: </span>
                  <span className="text-white">{selectedSlot.teamMember}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 mt-4">
                <Button
                  onClick={() => setShowBookingForm(true)}
                  className="bg-gradient-to-r from-emerald-500 to-green-600 text-white"
                >
                  Book dette tidspunkt
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedSlot(null)}
                  className="text-gray-400 hover:text-white"
                >
                  Annuller
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Manual Booking Form Modal */}
      {showBookingForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-xl font-bold text-white mb-6">Ny Booking</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Kunde navn *
                  </label>
                  <Input
                    value={newBooking.customerName || ''}
                    onChange={(e) => setNewBooking({ ...newBooking, customerName: e.target.value })}
                    placeholder="Fulde navn"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={newBooking.customerEmail || ''}
                    onChange={(e) => setNewBooking({ ...newBooking, customerEmail: e.target.value })}
                    placeholder="kunde@email.dk"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Telefon
                  </label>
                  <Input
                    value={newBooking.customerPhone || ''}
                    onChange={(e) => setNewBooking({ ...newBooking, customerPhone: e.target.value })}
                    placeholder="12 34 56 78"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Job type *
                  </label>
                  <select
                    value={newBooking.jobType}
                    onChange={(e) => setNewBooking({ ...newBooking, jobType: e.target.value as BookingRequest['jobType'] })}
                    className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="kontorrenhold">Kontorrenhold</option>
                    <option value="privat">Privat renhold</option>
                    <option value="specialrengøring">Specialrengøring</option>
                    <option value="vinduespolering">Vinduespolering</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Adresse *
                </label>
                <Input
                  value={newBooking.address || ''}
                  onChange={(e) => setNewBooking({ ...newBooking, address: e.target.value })}
                  placeholder="Gade og nummer, postnummer by"
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Hyppighed
                  </label>
                  <select
                    value={newBooking.frequency}
                    onChange={(e) => setNewBooking({ ...newBooking, frequency: e.target.value as BookingRequest['frequency'] })}
                    className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="one_time">Engangs</option>
                    <option value="weekly">Ugentlig</option>
                    <option value="biweekly">Hver 14. dag</option>
                    <option value="monthly">Månedlig</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Prioritet
                  </label>
                  <select
                    value={newBooking.urgency}
                    onChange={(e) => setNewBooking({ ...newBooking, urgency: e.target.value as BookingRequest['urgency'] })}
                    className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="low">Lav</option>
                    <option value="medium">Medium</option>
                    <option value="high">Høj</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bemærkninger
                </label>
                <Textarea
                  value={newBooking.notes || ''}
                  onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
                  placeholder="Specielle ønsker eller information..."
                  rows={3}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              
              {selectedSlot && (
                <div className="bg-cyan-500/20 border border-cyan-500/30 rounded-lg p-4">
                  <h4 className="text-cyan-300 font-medium mb-2">Valgt tidspunkt</h4>
                  <p className="text-white">
                    {format(selectedSlot.date, 'EEEE d. MMMM', { locale: da })} • {selectedSlot.startTime}-{selectedSlot.endTime}
                  </p>
                  <p className="text-green-400 font-medium">
                    Estimeret pris: {selectedSlot.price?.toLocaleString('da-DK')} kr
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <Button
                variant="ghost"
                onClick={() => setShowBookingForm(false)}
                className="text-gray-400 hover:text-white"
              >
                Annuller
              </Button>
              <Button
                onClick={handleBookingSubmit}
                disabled={!newBooking.customerName || !newBooking.address || !selectedSlot}
                className="bg-gradient-to-r from-emerald-500 to-green-600 text-white disabled:opacity-50"
              >
                Opret Booking
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}