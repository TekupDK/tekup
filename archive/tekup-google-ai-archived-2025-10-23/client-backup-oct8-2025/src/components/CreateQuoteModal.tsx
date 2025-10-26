import { useState, useEffect } from 'react';
import { X, FileText, DollarSign, Clock, Calendar, User } from 'lucide-react';

interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  taskType: string | null;
}

interface CreateQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedLeadId?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'https://api.renos.dk';

const CreateQuoteModal = ({ isOpen, onClose, onSuccess, preselectedLeadId }: CreateQuoteModalProps) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    leadId: preselectedLeadId || '',
    hourlyRate: '500',
    estimatedHours: '4',
    vatRate: '0.25',
    notes: '',
    validUntil: '',
  });

  const subtotal = parseFloat(formData.hourlyRate || '0') * parseFloat(formData.estimatedHours || '0');
  const vatAmount = subtotal * parseFloat(formData.vatRate || '0');
  const total = subtotal + vatAmount;

  useEffect(() => {
    if (isOpen) {
      fetchLeads();
    }
  }, [isOpen]);

  useEffect(() => {
    if (preselectedLeadId) {
      setFormData(prev => ({ ...prev, leadId: preselectedLeadId }));
    }
  }, [preselectedLeadId]);

  const fetchLeads = async () => {
    try {
      const response = await fetch(`${API_URL}/api/dashboard/leads`);
      if (!response.ok) throw new Error('Failed to fetch leads');
      const data = await response.json();
      // Only show non-converted leads
      const activeLeads = data.filter((lead: any) => lead.status !== 'converted');
      setLeads(activeLeads);
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.leadId) {
      alert('Vælg venligst en lead');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/dashboard/quotes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId: formData.leadId,
          hourlyRate: parseFloat(formData.hourlyRate),
          estimatedHours: parseFloat(formData.estimatedHours),
          vatRate: parseFloat(formData.vatRate),
          notes: formData.notes || null,
          validUntil: formData.validUntil || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to create quote');

      // Reset form
      setFormData({
        leadId: '',
        hourlyRate: '500',
        estimatedHours: '4',
        vatRate: '0.25',
        notes: '',
        validUntil: '',
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating quote:', error);
      alert('Kunne ikke oprette tilbud. Prøv igen.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 lg:p-8">
      <div className="glass rounded-xl border w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 z-10 glass border-b border-glass p-4 sm:p-6 -m-4 sm:-m-6 mb-4 sm:mb-6 flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Opret Tilbud</h2>
          <button
            onClick={onClose}
            className="p-2 -m-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-glass"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Lead Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <User className="h-4 w-4 inline mr-2" />
              Lead *
            </label>
            <select
              required
              value={formData.leadId}
              onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
              className="w-full px-4 py-3 text-sm select-glass rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Vælg lead...</option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.name || 'Unavngivet'} {lead.taskType ? `- ${lead.taskType}` : ''} {lead.email ? `(${lead.email})` : ''}
                </option>
              ))}
            </select>
            {leads.length === 0 && (
              <p className="text-xs text-yellow-400 mt-1">
                Ingen ledige leads. Opret venligst en lead først.
              </p>
            )}
          </div>

          {/* Pricing Section */}
          <div className="glass rounded-lg p-4 border border-glass">
            <h3 className="text-lg font-semibold text-foreground mb-4">Prissætning</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Hourly Rate */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <DollarSign className="h-4 w-4 inline mr-2" />
                  Timepris (DKK) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="10"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                  className="w-full px-4 py-3 text-sm select-glass rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Estimated Hours */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Clock className="h-4 w-4 inline mr-2" />
                  Estimerede Timer *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.5"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                  className="w-full px-4 py-3 text-sm select-glass rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* VAT Rate */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Moms (%)
                </label>
                <select
                  value={formData.vatRate}
                  onChange={(e) => setFormData({ ...formData, vatRate: e.target.value })}
                  className="w-full px-4 py-3 text-sm select-glass rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="0.25">25% (Standard)</option>
                  <option value="0">0% (Momsfri)</option>
                  <option value="0.15">15%</option>
                </select>
              </div>

              {/* Valid Until */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Gyldigt til
                </label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 text-sm select-glass rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Price Summary */}
            <div className="mt-4 pt-4 border-t border-glass space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="text-foreground font-medium">{subtotal.toFixed(2)} DKK</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Moms ({(parseFloat(formData.vatRate) * 100).toFixed(0)}%):</span>
                <span className="text-foreground font-medium">{vatAmount.toFixed(2)} DKK</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-glass">
                <span className="text-foreground">Total:</span>
                <span className="text-blue-400">{total.toFixed(2)} DKK</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <FileText className="h-4 w-4 inline mr-2" />
              Noter / Beskrivelse
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Beskrivelse af arbejdet, særlige betingelser, mv."
              rows={4}
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
              disabled={loading || !formData.leadId}
              className="w-full sm:flex-1 px-4 py-3 bg-gradient-to-r from-blue-400 to-cyan-300 text-slate-900 rounded-lg hover:from-blue-500 hover:to-cyan-400 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Opretter...' : 'Opret Tilbud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateQuoteModal;
