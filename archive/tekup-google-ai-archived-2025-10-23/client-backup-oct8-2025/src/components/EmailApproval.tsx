import { useState, useEffect } from "react";
import { Mail, Check, X, Edit2, Clock } from "lucide-react";

interface PendingEmail {
  id: string;
  recipientEmail: string;
  subject: string;
  body: string;
  createdAt: string;
  lead: {
    name: string;
    customer?: {
      name: string;
    };
  };
}

export default function EmailApproval() {
  const [pendingEmails, setPendingEmails] = useState<PendingEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<PendingEmail | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSubject, setEditedSubject] = useState("");
  const [editedBody, setEditedBody] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPendingEmails();
  }, []);

  const fetchPendingEmails = async () => {
    try {
      const res = await fetch("/api/email-approval/pending");
      const data = await res.json();
      setPendingEmails(data);
    } catch (error) {
      console.error("Failed to fetch pending emails:", error);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm("Send denne email til kunden?")) return;

    setLoading(true);
    try {
      await fetch(`/api/email-approval/${id}/approve`, {
        method: "POST",
      });

      fetchPendingEmails();
      setSelectedEmail(null);
    } catch (error) {
      console.error("Failed to approve email:", error);
      alert("Fejl ved afsendelse af email");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Hvorfor afviser du denne email?");
    if (!reason) return;

    setLoading(true);
    try {
      await fetch(`/api/email-approval/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      fetchPendingEmails();
      setSelectedEmail(null);
    } catch (error) {
      console.error("Failed to reject email:", error);
      alert("Fejl ved afvisning af email");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedEmail) return;

    setLoading(true);
    try {
      await fetch(`/api/email-approval/${selectedEmail.id}/edit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: editedSubject,
          body: editedBody,
        }),
      });

      setIsEditing(false);
      fetchPendingEmails();
    } catch (error) {
      console.error("Failed to edit email:", error);
      alert("Fejl ved redigering af email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Email Godkendelse</h1>
        <p className="text-gray-600">
          {pendingEmails.length} emails venter på godkendelse
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email List */}
        <div className="space-y-3">
          {pendingEmails.map((email) => (
            <div
              key={email.id}
              onClick={() => {
                setSelectedEmail(email);
                setEditedSubject(email.subject);
                setEditedBody(email.body);
                setIsEditing(false);
              }}
              className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedEmail?.id === email.id ? "border-blue-500 bg-blue-50" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {email.lead.customer?.name || email.lead.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {new Date(email.createdAt).toLocaleDateString("da-DK")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{email.subject}</p>
                </div>
              </div>
            </div>
          ))}

          {pendingEmails.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Ingen emails venter på godkendelse</p>
            </div>
          )}
        </div>

        {/* Email Preview/Edit */}
        {selectedEmail && (
          <div className="border rounded-lg p-6 bg-white">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Til: {selectedEmail.recipientEmail}
              </label>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emne:
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedSubject}
                  onChange={(e) => setEditedSubject(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{selectedEmail.subject}</p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Besked:
              </label>
              {isEditing ? (
                <textarea
                  value={editedBody}
                  onChange={(e) => setEditedBody(e.target.value)}
                  rows={15}
                  className="w-full px-3 py-2 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                  {selectedEmail.body}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleEdit}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="w-4 h-4" />
                    {loading ? "Gemmer..." : "Gem Ændringer"}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    disabled={loading}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Annuller
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleApprove(selectedEmail.id)}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="w-4 h-4" />
                    {loading ? "Sender..." : "Godkend & Send"}
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    disabled={loading}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Edit2 className="w-4 h-4" />
                    Rediger
                  </button>
                  <button
                    onClick={() => handleReject(selectedEmail.id)}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="w-4 h-4" />
                    Afvis
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

