import { useState } from 'react';
import { X, CheckCircle, AlertTriangle, Mail, DollarSign, Clock, Users, Home, Calendar, Sparkles, Edit, Send } from 'lucide-react';

interface AIQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteData: any;
  onSuccess: () => void;
}

const AIQuoteModal = ({ isOpen, onClose, quoteData, onSuccess }: AIQuoteModalProps) => {
  const [sending, setSending] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedQuote, setEditedQuote] = useState(quoteData?.quote?.body || '');

  if (!isOpen || !quoteData) return null;

  const { customer, service, estimate, availableSlots, quote, parsed, duplicateCheck } = quoteData;

  const handleSendQuote = async () => {
    setSending(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://api.renos.dk';

      const response = await fetch(`${API_URL}/api/quotes/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: customer?.email,
          subject: quote?.subject,
          body: editMode ? editedQuote : quote?.body,
          leadId: quoteData?.metadata?.emailId,
          emailId: quoteData?.metadata?.emailId,
          threadId: quoteData?.metadata?.threadId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send quote');
      }

      const data = await response.json();
      console.log('Quote sent successfully:', data);

      alert('✅ Tilbud sendt til kunde!\n\nEmail: ' + customer?.email + '\nLabel opdateret til: Venter på svar');
      onSuccess();
    } catch (error: any) {
      console.error('Error sending quote:', error);
      alert('❌ Kunne ikke sende tilbud:\n' + error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="glass rounded-xl border w-full max-w-5xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
          {/* Header */}
          <div className="sticky top-0 z-10 glass border-b border-glass p-4 sm:p-6 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-green-400" />
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-foreground">AI Genereret Tilbud</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Processeret på {parsed?.confidence?.overall || 0}% confidence
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 -m-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-glass"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Duplicate Warning */}
            {duplicateCheck && (
              <div className="glass rounded-lg p-4 border border-yellow-400/30 bg-yellow-400/10 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-400 mb-1">Advarsel: Duplicate Check</h4>
                    <p className="text-sm text-foreground">
                      {duplicateCheck.recommendation}
                    </p>
                    {duplicateCheck.daysSinceLastContact && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Sidste kontakt: {duplicateCheck.daysSinceLastContact} dage siden
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Main Content - 2 Column Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
              {/* Left Column: Parsed Lead Info */}
              <div className="space-y-4">
                {/* Customer Info */}
                <div className="glass rounded-lg p-4 border">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Kunde Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Navn:</span>
                      <span className="text-foreground font-medium">{customer?.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="text-foreground font-medium">{customer?.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Telefon:</span>
                      <span className="text-foreground font-medium">{customer?.phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Adresse:</span>
                      <span className="text-foreground font-medium text-right">{customer?.address || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Service Info */}
                <div className="glass rounded-lg p-4 border">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Service Detaljer
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="text-foreground font-medium">{service?.type || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Størrelse:</span>
                      <span className="text-foreground font-medium">{service?.propertySize || 'N/A'} m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rum:</span>
                      <span className="text-foreground font-medium">{service?.rooms || 'N/A'}</span>
                    </div>
                    {service?.specialRequests && service.specialRequests.length > 0 && (
                      <div className="pt-2 border-t border-glass">
                        <span className="text-muted-foreground block mb-1">Specielle ønsker:</span>
                        <div className="flex flex-wrap gap-1">
                          {service.specialRequests.map((req: string, i: number) => (
                            <span key={i} className="px-2 py-1 bg-blue-400/10 border border-blue-400/30 text-blue-400 rounded text-xs">
                              {req}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price Estimate */}
                <div className="glass rounded-lg p-4 border">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Pris Estimat
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Estimeret tid:
                      </span>
                      <span className="text-foreground font-medium">{estimate?.estimatedHours || 0} timer</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Medarbejdere:
                      </span>
                      <span className="text-foreground font-medium">{estimate?.workers || 2} personer</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total arbejdstimer:</span>
                      <span className="text-foreground font-medium">{estimate?.totalLaborHours || 0} timer</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Timepris:</span>
                      <span className="text-foreground font-medium">{estimate?.hourlyRate || 349} kr/time/person</span>
                    </div>
                    <div className="pt-2 border-t border-glass flex justify-between text-base font-semibold">
                      <span className="text-foreground">Pris Range:</span>
                      <span className="text-green-400">
                        {estimate?.priceMin?.toLocaleString() || 0} - {estimate?.priceMax?.toLocaleString() || 0} kr
                      </span>
                    </div>
                  </div>
                </div>

                {/* Available Slots */}
                <div className="glass rounded-lg p-4 border">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Ledige Tider ({availableSlots?.slots?.length || 0})
                  </h3>
                  <div className="space-y-2 text-xs">
                    {availableSlots?.slots?.slice(0, 5).map((slot: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-glass/30 rounded">
                        <span className="text-foreground">
                          {new Date(slot.start).toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                        <span className="text-muted-foreground">
                          kl. {new Date(slot.start).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                          {slot.preferredTime && <span className="ml-1">⭐</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: AI Generated Quote */}
              <div className="space-y-4">
                <div className="glass rounded-lg p-4 border">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-green-400" />
                      AI Genereret Tilbud
                    </h3>
                    <button
                      onClick={() => setEditMode(!editMode)}
                      className="text-blue-400 hover:text-blue-300 transition-colors text-sm flex items-center gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      {editMode ? 'Preview' : 'Rediger'}
                    </button>
                  </div>

                  {/* Subject */}
                  <div className="mb-4 p-3 bg-glass/50 rounded">
                    <p className="text-xs text-muted-foreground mb-1">Emne:</p>
                    <p className="text-sm font-medium text-foreground">{quote?.subject || 'Ingen emne'}</p>
                  </div>

                  {/* Body */}
                  <div className="bg-glass/30 rounded p-4 max-h-96 overflow-y-auto">
                    {editMode ? (
                      <textarea
                        value={editedQuote}
                        onChange={(e) => setEditedQuote(e.target.value)}
                        rows={20}
                        className="w-full px-3 py-2 text-sm input-glass rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono resize-none"
                      />
                    ) : (
                      <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">{quote?.body || 'Ingen indhold'}</pre>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Confidence Badge */}
            {parsed?.confidence?.overall && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className="h-3 w-3" />
                <span>AI Confidence: {parsed.confidence.overall}%</span>
                {parsed.confidence.overall < 70 && (
                  <span className="text-yellow-400">(Lav - gennemgå nøje)</span>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="sticky bottom-0 glass border-t border-glass p-4 sm:p-6 flex flex-col-reverse sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="w-full sm:flex-1 px-4 py-3 bg-glass border border-glass text-foreground rounded-lg hover:bg-gray-700 transition-colors"
            >
              Annuller
            </button>
            <button
              onClick={handleSendQuote}
              disabled={sending}
              className="w-full sm:flex-1 px-4 py-3 bg-gradient-to-r from-green-400 to-emerald-300 text-slate-900 rounded-lg hover:from-green-500 hover:to-emerald-400 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-slate-900 border-t-transparent rounded-full" />
                  Sender...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline">Godkend &</span> Send Tilbud
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIQuoteModal;


