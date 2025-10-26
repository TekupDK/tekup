import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, Mail, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.renos.dk';

interface EmailQualityIssue {
    id: string;
    leadId: string;
    recipientEmail: string;
    subject: string;
    bodyPreview: string;
    status: string;
    createdAt: string;
    lead: {
        id: string;
        email: string;
        name: string | null;
        status: string;
    } | null;
    qualityIssues: string[];
    severity: 'critical' | 'high' | 'medium' | 'low';
    hasIssues: boolean;
}

interface EmailQualityStats {
    period: string;
    totalChecked: number;
    totalIssues: number;
    issueBreakdown: {
        critical: number;
        high: number;
        medium: number;
    };
    rejected: number;
    qualityScore: number;
    last24Hours: {
        checked: number;
        issues: number;
    };
    timestamp: string;
}

interface EmailQualityResponse {
    emails: EmailQualityIssue[];
    total: number;
    timestamp: string;
}

/**
 * Email Quality Monitor Component
 * 
 * Displays real-time warnings about email quality issues detected by the gateway.
 * Shows problematic emails with placeholders, after-hours times, or missing data.
 */
export function EmailQualityMonitor() {
    const [emails, setEmails] = useState<EmailQualityIssue[]>([]);
    const [stats, setStats] = useState<EmailQualityStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedEmail, setSelectedEmail] = useState<EmailQualityIssue | null>(null);

    useEffect(() => {
        void loadData();
        // Refresh every 30 seconds
        const interval = setInterval(() => void loadData(), 30000);
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        try {
            const [emailsRes, statsRes] = await Promise.all([
                fetch(`${API_BASE}/api/dashboard/email-quality/recent`),
                fetch(`${API_BASE}/api/dashboard/email-quality/stats`)
            ]);

            if (emailsRes.ok && statsRes.ok) {
                const emailsData = await emailsRes.json() as EmailQualityResponse;
                const statsData = await statsRes.json() as EmailQualityStats;
                setEmails(emailsData.emails);
                setStats(statsData);
            }
        } catch (error) {
            console.error('Failed to load email quality data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'red';
            case 'high': return 'orange';
            case 'medium': return 'yellow';
            default: return 'blue';
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return <XCircle className="w-5 h-5" />;
            case 'high': return <AlertTriangle className="w-5 h-5" />;
            case 'medium': return <Clock className="w-5 h-5" />;
            default: return <Mail className="w-5 h-5" />;
        }
    };

    if (loading) {
        return (
            <Card>
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        <h2 className="text-lg font-semibold">Email Kvalitetskontrol</h2>
                    </div>
                    <p className="text-gray-600">Indlæser email kvalitetsdata...</p>
                </div>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                            </div>
                            <h2 className="text-2xl font-bold">Email Kvalitetskontrol</h2>
                        </div>
                        {stats && (
                            <div className="flex items-center gap-3">
                                <span className="text-base text-gray-600">Kvalitetsscore:</span>
                                <span className={`text-2xl font-bold ${stats.qualityScore >= 90 ? 'text-green-600' :
                                    stats.qualityScore >= 70 ? 'text-yellow-600' :
                                        'text-red-600'
                                    }`}>
                                    {stats.qualityScore}%
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Stats Overview */}
                    {stats && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="glass-card p-6 rounded-xl space-y-2">
                                <div className="text-sm text-gray-600 font-medium">Total Tjekket</div>
                                <div className="text-3xl font-bold">{stats.totalChecked}</div>
                                <div className="text-xs text-gray-500">{stats.period}</div>
                            </div>
                            <div className="glass-card p-6 rounded-xl space-y-2 border-red-500/20">
                                <div className="text-sm text-gray-600 font-medium">Kritiske</div>
                                <div className="text-3xl font-bold text-red-600">
                                    {stats.issueBreakdown.critical}
                                </div>
                                <div className="text-xs text-gray-500">Placeholders/Efter åbningstid</div>
                            </div>
                            <div className="glass-card p-6 rounded-xl space-y-2 border-orange-500/20">
                                <div className="text-sm text-gray-600 font-medium">Høj Prioritet</div>
                                <div className="text-3xl font-bold text-orange-600">
                                    {stats.issueBreakdown.high}
                                </div>
                                <div className="text-xs text-gray-500">Kvalitetsproblemer</div>
                            </div>
                            <div className="glass-card p-6 rounded-xl space-y-2 border-blue-500/20">
                                <div className="text-sm text-gray-600 font-medium">Seneste 24t</div>
                                <div className="text-3xl font-bold text-blue-600">
                                    {stats.last24Hours.issues}
                                </div>
                                <div className="text-xs text-gray-500">
                                    af {stats.last24Hours.checked} emails
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Email List */}
                    {emails.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="p-4 rounded-full bg-green-500/10 border border-green-500/20 w-fit mx-auto mb-6">
                                <CheckCircle className="w-16 h-16 text-green-500" />
                            </div>
                            <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                                Ingen Kvalitetsproblemer
                            </h3>
                            <p className="text-gray-600 text-lg">
                                Alle emails passerer kvalitetskontrol ✓
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-700 mb-4">
                                Problematiske Emails ({emails.length})
                            </h3>
                            {emails.map((email) => (
                                <div
                                    key={email.id}
                                    onClick={() => setSelectedEmail(email)}
                                    className="glass-card p-5 rounded-xl hover:bg-opacity-10 cursor-pointer transition-all duration-200"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-red-500/10">
                                                {getSeverityIcon(email.severity)}
                                            </div>
                                            <span className="font-semibold text-gray-900 text-base">
                                                {email.recipientEmail}
                                            </span>
                                            <Badge color={getSeverityColor(email.severity)}>
                                                {email.severity.toUpperCase()}
                                            </Badge>
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {new Date(email.createdAt).toLocaleString('da-DK')}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-700 mb-3">
                                        <strong>Emne:</strong> {email.subject}
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {email.qualityIssues.map((issue, idx) => (
                                            <Badge key={idx} color="red">
                                                ⚠️ {issue}
                                            </Badge>
                                        ))}
                                    </div>
                                    {email.lead && (
                                        <div className="text-sm text-gray-500">
                                            Lead: {email.lead.name || 'Ukendt'} ({email.lead.status})
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            {/* Email Detail Modal */}
            {selectedEmail && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                    onClick={() => setSelectedEmail(null)}
                >
                    <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="p-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Email Detaljer</h3>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge color={getSeverityColor(selectedEmail.severity)}>
                                            {selectedEmail.severity.toUpperCase()}
                                        </Badge>
                                        <Badge color="gray">{selectedEmail.status}</Badge>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedEmail(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Modtager</label>
                                    <p className="text-gray-900">{selectedEmail.recipientEmail}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700">Emne</label>
                                    <p className="text-gray-900">{selectedEmail.subject}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700">Kvalitetsproblemer</label>
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-1">
                                        {selectedEmail.qualityIssues.map((issue, idx) => (
                                            <div key={idx} className="flex items-start gap-2 mb-2 last:mb-0">
                                                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                                <span className="text-sm text-red-900">{issue}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700">Email Indhold (preview)</label>
                                    <div className="bg-gray-50 rounded-lg p-3 mt-1 text-sm text-gray-700 whitespace-pre-wrap font-mono">
                                        {selectedEmail.bodyPreview}...
                                    </div>
                                </div>

                                {selectedEmail.lead && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Lead Information</label>
                                        <div className="bg-blue-50 rounded-lg p-3 mt-1 text-sm">
                                            <p><strong>Navn:</strong> {selectedEmail.lead.name || 'Ukendt'}</p>
                                            <p><strong>Email:</strong> {selectedEmail.lead.email}</p>
                                            <p><strong>Status:</strong> {selectedEmail.lead.status}</p>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="text-sm font-medium text-gray-700">Oprettet</label>
                                    <p className="text-gray-900">
                                        {new Date(selectedEmail.createdAt).toLocaleString('da-DK', {
                                            dateStyle: 'long',
                                            timeStyle: 'short'
                                        })}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={() => setSelectedEmail(null)}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Luk
                                </button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </>
    );
}
