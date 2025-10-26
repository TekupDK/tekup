/**
 * Invoice Manager Component (Sprint 3)
 * Manage invoices, send emails, track payments
 */

import React, { useState, useEffect } from 'react';
import { FileText, Send, Check, AlertCircle, Download, DollarSign } from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail?: string;
  issueDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  vatAmount: number;
  total: number;
  sentAt?: string;
  paidAt?: string;
  lineItems: InvoiceLineItem[];
}

interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export function InvoiceManager() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Fetch invoices
  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/invoices');
      const data = await res.json();
      if (data.success) {
        setInvoices(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  // Send invoice
  const sendInvoice = async (invoiceId: string) => {
    if (!confirm('Send faktura til kunde?')) return;

    try {
      const res = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        alert('Faktura sendt!');
        fetchInvoices();
      }
    } catch (error) {
      console.error('Failed to send invoice:', error);
      alert('Fejl ved afsendelse af faktura');
    }
  };

  // Mark as paid
  const markAsPaid = async (invoiceId: string) => {
    const paymentMethod = prompt('Betalingsmetode:', 'bank_transfer');
    if (!paymentMethod) return;

    try {
      const res = await fetch(`/api/invoices/${invoiceId}/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Faktura markeret som betalt!');
        fetchInvoices();
      }
    } catch (error) {
      console.error('Failed to mark as paid:', error);
      alert('Fejl ved markering af betaling');
    }
  };

  // Send reminder
  const sendReminder = async (invoiceId: string) => {
    if (!confirm('Send betalingspåmindelse?')) return;

    try {
      const res = await fetch(`/api/invoices/${invoiceId}/send-reminder`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        alert('Påmindelse sendt!');
        fetchInvoices();
      }
    } catch (error) {
      console.error('Failed to send reminder:', error);
      alert('Fejl ved afsendelse af påmindelse');
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Filter invoices
  const filteredInvoices = invoices.filter((inv) => {
    if (filter === 'all') return true;
    return inv.status === filter;
  });

  // Status badge
  const StatusBadge = ({ status }: { status: string }) => {
    const colors = {
      draft: 'bg-gray-200 text-gray-800',
      sent: 'bg-blue-200 text-blue-800',
      paid: 'bg-green-200 text-green-800',
      overdue: 'bg-red-200 text-red-800',
      cancelled: 'bg-gray-300 text-gray-600',
    };

    const labels = {
      draft: 'Kladde',
      sent: 'Sendt',
      paid: 'Betalt',
      overdue: 'Forsinket',
      cancelled: 'Annulleret',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('da-DK');
  };

  if (loading) {
    return <div className="p-8">Indlæser fakturaer...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-8 h-8" />
          Fakturaer
        </h2>
        <div className="flex gap-2">
          {['all', 'draft', 'sent', 'paid', 'overdue'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {f === 'all' ? 'Alle' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Total Sendt</div>
          <div className="text-2xl font-bold">
            {invoices.filter(i => i.status === 'sent').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Betalt</div>
          <div className="text-2xl font-bold text-green-600">
            {invoices.filter(i => i.status === 'paid').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Forsinket</div>
          <div className="text-2xl font-bold text-red-600">
            {invoices.filter(i => i.status === 'overdue').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Total Omsætning</div>
          <div className="text-2xl font-bold">
            {formatCurrency(
              invoices
                .filter(i => i.status === 'paid')
                .reduce((sum, i) => sum + i.total, 0)
            )}
          </div>
        </div>
      </div>

      {/* Invoice List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Faktura#
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Kunde
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Udstedelsesdato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Forfaldsdato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Beløb
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Handlinger
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {invoice.customerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {formatDate(invoice.issueDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {formatDate(invoice.dueDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {formatCurrency(invoice.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={invoice.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      {invoice.status === 'draft' && (
                        <button
                          onClick={() => sendInvoice(invoice.id)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Send faktura"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      )}
                      {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                        <>
                          <button
                            onClick={() => markAsPaid(invoice.id)}
                            className="text-green-600 hover:text-green-800"
                            title="Marker som betalt"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => sendReminder(invoice.id)}
                            className="text-yellow-600 hover:text-yellow-800"
                            title="Send påmindelse"
                          >
                            <AlertCircle className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="text-gray-600 hover:text-gray-800"
                        title="Vis detaljer"
                      >
                        <FileText className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold">
                  {selectedInvoice.invoiceNumber}
                </h3>
                <p className="text-gray-600">{selectedInvoice.customerName}</p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <StatusBadge status={selectedInvoice.status} />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <div className="text-sm text-gray-600">Udstedelsesdato</div>
                <div className="font-medium">
                  {formatDate(selectedInvoice.issueDate)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Forfaldsdato</div>
                <div className="font-medium">
                  {formatDate(selectedInvoice.dueDate)}
                </div>
              </div>
            </div>

            <div className="border-t pt-4 mb-4">
              <h4 className="font-medium mb-3">Linjeposter:</h4>
              {selectedInvoice.lineItems.map((item) => (
                <div key={item.id} className="flex justify-between py-2">
                  <div>
                    <div className="font-medium">{item.description}</div>
                    <div className="text-sm text-gray-600">
                      {item.quantity} × {formatCurrency(item.unitPrice)}
                    </div>
                  </div>
                  <div className="font-medium">
                    {formatCurrency(item.amount)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(selectedInvoice.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Moms (25%):</span>
                <span>{formatCurrency(selectedInvoice.vatAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(selectedInvoice.total)}</span>
              </div>
            </div>

            {selectedInvoice.paidAt && (
              <div className="mt-4 p-3 bg-green-100 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">
                    Betalt {formatDate(selectedInvoice.paidAt)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
