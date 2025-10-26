import { useState, useEffect } from "react";
import { X, Calendar, Clock, MapPin, User } from "lucide-react";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  customerId?: string;
  leadId?: string;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  address?: string;
}

export default function BookingModal({ isOpen, onClose, onSuccess, customerId, leadId }: BookingModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customerId || "");
  const [scheduledAt, setScheduledAt] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState(120);
  const [serviceType, setServiceType] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
      // Set default date to tomorrow 10 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      setScheduledAt(tomorrow.toISOString().slice(0, 16));
    }
  }, [isOpen]);

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/dashboard/customers");
      const data = await res.json();
      setCustomers(data);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          leadId,
          scheduledAt,
          estimatedDuration,
          serviceType,
          address,
          notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create booking");
      }

      onSuccess?.();
      onClose();
      // Reset form
      setScheduledAt("");
      setServiceType("");
      setAddress("");
      setNotes("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 sm:p-6 lg:p-8" role="dialog" aria-modal="true" aria-labelledby="booking-modal-title">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 z-10 bg-white p-6 sm:p-8 border-b flex items-center justify-between">
          <h2 id="booking-modal-title" className="text-xl sm:text-2xl font-bold text-gray-900">Ny Booking</h2>
          <button
            onClick={onClose}
            className="p-3 -m-3 text-gray-400 hover:text-gray-600 transition-colors rounded-xl hover:bg-gray-100"
            aria-label="Luk booking modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-base">
              {error}
            </div>
          )}

          {/* Customer Selection */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-3 flex items-center gap-2">
              <User className="w-5 h-5" />
              Kunde *
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              required
              aria-label="Vælg kunde"
              className="w-full px-4 py-3 border rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Vælg kunde...</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} {customer.email && `(${customer.email})`}
                </option>
              ))}
            </select>
          </div>

          {/* Service Type */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-3">
              Service Type *
            </label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              required
              className="w-full px-4 py-3 border rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Vælg service...</option>
              <option value="Privatrengøring">Privatrengøring</option>
              <option value="Flytterengøring">Flytterengøring</option>
              <option value="Hovedrengøring">Hovedrengøring</option>
              <option value="Erhverv">Erhvervsrengøring</option>
              <option value="Airbnb">Airbnb Rengøring</option>
              <option value="Vinduer">Vinduespolering</option>
            </select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Dato & Tid *
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
                className="w-full px-4 py-3 border rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-base font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Varighed (minutter) *
              </label>
              <select
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(Number(e.target.value))}
                className="w-full px-4 py-3 border rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="60">1 time</option>
                <option value="90">1.5 timer</option>
                <option value="120">2 timer</option>
                <option value="180">3 timer</option>
                <option value="240">4 timer</option>
                <option value="360">6 timer</option>
                <option value="480">8 timer</option>
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Adresse
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Indtast adresse..."
              className="w-full px-4 py-3 border rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-3">
              Noter
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Ekstra information..."
              className="w-full px-4 py-3 border rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 border rounded-xl text-base hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Annuller
            </button>
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full sm:flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors text-base font-semibold"
            >
              <Calendar className="w-5 h-5" />
              {loading ? "Opretter..." : "Opret Booking"}
            </button>
          </div>

          <div className="text-base text-gray-500 bg-blue-50 p-4 rounded-xl border border-blue-100">
            💡 Booking oprettes automatisk i Google Calendar hvis konfigureret.
          </div>
        </form>
      </div>
    </div>
  );
}

