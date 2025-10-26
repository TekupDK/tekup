import { useState, useEffect } from 'react';
import { X, User, Mail, Phone, MapPin, Briefcase, DollarSign, FileText } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string | null;
}

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Using centralized apiClient; no direct API_URL needed here

const CreateLeadModal = ({ isOpen, onClose, onSuccess }: CreateLeadModalProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    taskType: '',
    address: '',
    estimatedValue: '',
    notes: '',
    customerId: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
    }
  }, [isOpen]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/dashboard/customers`);
      if (!response.ok) throw new Error('Failed to fetch customers');
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/dashboard/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue) : null,
          customerId: formData.customerId || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to create lead');

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        taskType: '',
        address: '',
        estimatedValue: '',
        notes: '',
        customerId: '',
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating lead:', error);
      alert('Kunne ikke oprette lead. Prøv igen.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 lg:p-8">
      <div className="glass rounded-xl border w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 z-10 glass border-b border-glass p-4 sm:p-6 -m-4 sm:-m-6 mb-4 sm:mb-6 flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Tilføj Lead</h2>
          <button
            onClick={onClose}
            className="p-2 -m-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-glass"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* Link to existing customer */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <User className="h-4 w-4 inline mr-2" />
              Eksisterende Kunde (valgfrit)
            </label>
            <select
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              className="w-full px-4 py-3 text-sm select-glass rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Ingen - ny lead</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} {customer.email ? `(${customer.email})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <User className="h-4 w-4 inline mr-2" />
                Navn *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Fulde navn"
                className="w-full px-4 py-3 text-sm input-glass rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Mail className="h-4 w-4 inline mr-2" />
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                className="w-full px-4 py-3 text-sm input-glass rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Phone className="h-4 w-4 inline mr-2" />
                Telefon
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+45 12 34 56 78"
                className="w-full px-4 py-3 text-sm input-glass rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Task Type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Briefcase className="h-4 w-4 inline mr-2" />
                Opgave Type
              </label>
              <select
                value={formData.taskType}
                onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
                className="w-full px-4 py-3 text-sm select-glass rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Vælg type...</option>
                <option value="Almindelig rengøring">Almindelig rengøring</option>
                <option value="Hovedrengøring">Hovedrengøring</option>
                <option value="Erhvervsrengøring">Erhvervsrengøring</option>
                <option value="Flytterengøring">Flytterengøring</option>
                <option value="Kontorrengøring">Kontorrengøring</option>
                <option value="Vinduespudsning">Vinduespudsning</option>
                <option value="Trappevask">Trappevask</option>
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <MapPin className="h-4 w-4 inline mr-2" />
              Adresse
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Vej, postnummer, by"
              className="w-full px-4 py-3 text-sm bg-glass border border-glass rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground"
            />
          </div>

          {/* Estimated Value */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <DollarSign className="h-4 w-4 inline mr-2" />
              Estimeret Værdi (DKK)
            </label>
            <input
              type="number"
              value={formData.estimatedValue}
              onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
              placeholder="0"
              min="0"
              step="100"
              className="w-full px-4 py-3 text-sm bg-glass border border-glass rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <FileText className="h-4 w-4 inline mr-2" />
              Noter
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ekstra information..."
              rows={3}
              className="w-full px-4 py-3 text-sm input-glass rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:flex-1 px-4 py-3 bg-glass border border-glass text-foreground rounded-lg hover:bg-gray-700 transition-colors"
            >
              Annuller
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:flex-1 px-4 py-3 bg-gradient-to-r from-blue-400 to-cyan-300 text-slate-900 rounded-lg hover:from-blue-500 hover:to-cyan-400 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Opretter...' : 'Opret Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLeadModal;
