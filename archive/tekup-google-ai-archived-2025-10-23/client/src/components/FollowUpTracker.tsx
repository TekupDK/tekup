import { useState, useEffect } from 'react';
import { Clock, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.renos.dk';

interface FollowUpLead {
    id: string;
    name: string | null;
    email: string | null;
    status: string;
    followUpAttempts: number;
    lastFollowUpDate: string | null;
    createdAt: string;
    daysSinceContact: number;
    urgency: 'high' | 'medium' | 'low';
    nextAttemptNumber: number;
    customer: {
        id: string;
        name: string;
        email: string;
    } | null;
}

interface FollowUpStats {
    period: string;
    totalFollowUpsSent: number;
    needingAttention: number;
    successRate: number;
    avgAttempts: number;
    recentActivity: {
        last7Days: number;
    };
    attemptBreakdown: {
        attempt1: number;
        attempt2: number;
        attempt3Plus: number;
    };
    converted: number;
    timestamp: string;
}

interface FollowUpResponse {
    leads: FollowUpLead[];
    total: number;
    timestamp: string;
}

/**
 * Follow-Up Tracker Component
 * 
 * Displays leads needing follow-up with urgency indicators.
 * Shows follow-up statistics and success rate.
 */
export function FollowUpTracker() {
    const [leads, setLeads] = useState<FollowUpLead[]>([]);
    const [stats, setStats] = useState<FollowUpStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState<FollowUpLead | null>(null);

    useEffect(() => {
        void loadData();
        // Refresh every 60 seconds
        const interval = setInterval(() => void loadData(), 60000);
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        try {
            const [leadsRes, statsRes] = await Promise.all([
                fetch(`${API_BASE}/api/dashboard/follow-ups/pending`),
                fetch(`${API_BASE}/api/dashboard/follow-ups/stats`)
            ]);

            if (leadsRes.ok && statsRes.ok) {
                const leadsData = await leadsRes.json() as FollowUpResponse;
                const statsData = await statsRes.json() as FollowUpStats;
                setLeads(leadsData.leads);
                setStats(statsData);
            }
        } catch (error) {
            console.error('Failed to load follow-up data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getUrgencyColor = (urgency: string) => {
        switch (urgency) {
            case 'high': return 'red';
            case 'medium': return 'orange';
            default: return 'blue';
        }
    };

    const getUrgencyIcon = (urgency: string) => {
        switch (urgency) {
            case 'high': return <AlertCircle className="w-5 h-5" />;
            case 'medium': return <Clock className="w-5 h-5" />;
            default: return <Mail className="w-5 h-5" />;
        }
    };

    if (loading) {
        return (
            <Card>
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-semibold">Follow-Up Tracking</h2>
                    </div>
                    <p className="text-gray-600">Indlæser follow-up data...</p>
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
                            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                <Clock className="w-6 h-6 text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-bold">Follow-Up Tracking</h2>
                        </div>
                        {stats && (
                            <div className="flex items-center gap-3">
                                <span className="text-base text-gray-600">Success Rate:</span>
                                <span className={`text-2xl font-bold ${stats.successRate >= 30 ? 'text-green-600' :
                                    stats.successRate >= 15 ? 'text-yellow-600' :
                                        'text-red-600'
                                    }`}>
                                    {stats.successRate}%
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Stats Overview */}
                    {stats && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="glass-card p-6 rounded-xl space-y-2 border-red-500/20">
                                <div className="text-sm text-gray-600 font-medium">Kræver Handling</div>
                                <div className="text-3xl font-bold text-red-600">
                                    {stats.needingAttention}
                                </div>
                                <div className="text-xs text-gray-500">5+ dage siden kontakt</div>
                            </div>
                            <div className="glass-card p-6 rounded-xl space-y-2 border-blue-500/20">
                                <div className="text-sm text-gray-600 font-medium">Total Sendt</div>
                                <div className="text-3xl font-bold text-blue-600">
                                    {stats.totalFollowUpsSent}
                                </div>
                                <div className="text-xs text-gray-500">{stats.period}</div>
                            </div>
                            <div className="glass-card p-6 rounded-xl space-y-2 border-green-500/20">
                                <div className="text-sm text-gray-600 font-medium">Konverteret</div>
                                <div className="text-3xl font-bold text-green-600">
                                    {stats.converted}
                                </div>
                                <div className="text-xs text-gray-500">
                                    Gns. {stats.avgAttempts} forsøg
                                </div>
                            </div>
                            <div className="glass-card p-6 rounded-xl space-y-2 border-purple-500/20">
                                <div className="text-sm text-gray-600 font-medium">Seneste 7 dage</div>
                                <div className="text-3xl font-bold text-purple-600">
                                    {stats.recentActivity.last7Days}
                                </div>
                                <div className="text-xs text-gray-500">Follow-ups sendt</div>
                            </div>
                        </div>
                    )}

                    {/* Attempt Breakdown */}
                    {stats && (
                        <div className="space-y-4 mb-8">
                            <h3 className="text-lg font-semibold text-gray-700">Forsøg Fordeling</h3>
                            <div className="grid grid-cols-3 gap-6">
                                <div className="glass-card p-6 rounded-xl text-center space-y-2">
                                    <div className="text-3xl font-bold text-gray-900">
                                        {stats.attemptBreakdown.attempt1}
                                    </div>
                                    <div className="text-sm text-gray-600">1. forsøg</div>
                                </div>
                                <div className="glass-card p-6 rounded-xl text-center space-y-2">
                                    <div className="text-3xl font-bold text-gray-900">
                                        {stats.attemptBreakdown.attempt2}
                                    </div>
                                    <div className="text-sm text-gray-600">2. forsøg</div>
                                </div>
                                <div className="glass-card p-6 rounded-xl text-center space-y-2">
                                    <div className="text-3xl font-bold text-gray-900">
                                        {stats.attemptBreakdown.attempt3Plus}
                                    </div>
                                    <div className="text-sm text-gray-600">3+ forsøg</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Leads List */}
                    {leads.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="p-4 rounded-full bg-green-500/10 border border-green-500/20 w-fit mx-auto mb-6">
                                <CheckCircle className="w-16 h-16 text-green-500" />
                            </div>
                            <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                                Alle Follow-Ups Er Opdaterede
                            </h3>
                            <p className="text-gray-600 text-lg">
                                Ingen leads kræver follow-up i øjeblikket ✓
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-700 mb-4">
                                Leads Kræver Follow-Up ({leads.length})
                            </h3>
                            {leads.map((lead) => (
                                <div
                                    key={lead.id}
                                    onClick={() => setSelectedLead(lead)}
                                    className="glass-card p-5 rounded-xl hover:bg-opacity-10 cursor-pointer transition-all duration-200"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-blue-500/10">
                                                {getUrgencyIcon(lead.urgency)}
                                            </div>
                                            <span className="font-semibold text-gray-900 text-base">
                                                {lead.name || lead.email || 'Ukendt'}
                                            </span>
                                            <Badge color={getUrgencyColor(lead.urgency)}>
                                                {lead.urgency.toUpperCase()}
                                            </Badge>
                                            <Badge color="gray">
                                                Forsøg {lead.followUpAttempts + 1}
                                            </Badge>
                                        </div>
                                        <span className="text-sm text-gray-500 font-medium">
                                            {lead.daysSinceContact} dage siden
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-700 mb-3">
                                        <strong>Email:</strong> {lead.email || 'Mangler'}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <span>Status: {lead.status}</span>
                                        {lead.lastFollowUpDate && (
                                            <span>
                                                Sidste follow-up: {new Date(lead.lastFollowUpDate).toLocaleDateString('da-DK')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            {/* Lead Detail Modal */}
            {selectedLead && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                    onClick={() => setSelectedLead(null)}
                >
                    <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="p-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Lead Detaljer</h3>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge color={getUrgencyColor(selectedLead.urgency)}>
                                            {selectedLead.urgency.toUpperCase()} URGENCY
                                        </Badge>
                                        <Badge color="gray">{selectedLead.status}</Badge>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedLead(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Navn</label>
                                    <p className="text-gray-900">{selectedLead.name || 'Ukendt'}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700">Email</label>
                                    <p className="text-gray-900">{selectedLead.email || 'Mangler'}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700">Follow-Up Status</label>
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-1">
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <span className="text-gray-600">Forsøg gjort:</span>
                                                <span className="ml-2 font-semibold">{selectedLead.followUpAttempts}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Næste forsøg:</span>
                                                <span className="ml-2 font-semibold">{selectedLead.nextAttemptNumber}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Dage siden kontakt:</span>
                                                <span className="ml-2 font-semibold">{selectedLead.daysSinceContact}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Urgency:</span>
                                                <span className="ml-2 font-semibold">{selectedLead.urgency}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {selectedLead.lastFollowUpDate && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Sidste Follow-Up</label>
                                        <p className="text-gray-900">
                                            {new Date(selectedLead.lastFollowUpDate).toLocaleString('da-DK', {
                                                dateStyle: 'long',
                                                timeStyle: 'short'
                                            })}
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <label className="text-sm font-medium text-gray-700">Lead Oprettet</label>
                                    <p className="text-gray-900">
                                        {new Date(selectedLead.createdAt).toLocaleString('da-DK', {
                                            dateStyle: 'long',
                                            timeStyle: 'short'
                                        })}
                                    </p>
                                </div>

                                {selectedLead.customer && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Kunde Information</label>
                                        <div className="bg-green-50 rounded-lg p-3 mt-1 text-sm">
                                            <p><strong>Navn:</strong> {selectedLead.customer.name}</p>
                                            <p><strong>Email:</strong> {selectedLead.customer.email}</p>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="text-sm font-medium text-gray-700">Anbefalet Handling</label>
                                    <div className={`rounded-lg p-3 mt-1 text-sm ${selectedLead.urgency === 'high' ? 'bg-red-50 border border-red-200' :
                                        selectedLead.urgency === 'medium' ? 'bg-orange-50 border border-orange-200' :
                                            'bg-blue-50 border border-blue-200'
                                        }`}>
                                        {selectedLead.urgency === 'high' && (
                                            <p className="text-red-900">
                                                ⚠️ HØST PRIORITET: {selectedLead.daysSinceContact} dage uden kontakt.
                                                Send follow-up nu eller ring direkte til kunden.
                                            </p>
                                        )}
                                        {selectedLead.urgency === 'medium' && (
                                            <p className="text-orange-900">
                                                ⚡ MELLEM PRIORITET: Send follow-up inden for 1-2 dage.
                                            </p>
                                        )}
                                        {selectedLead.urgency === 'low' && (
                                            <p className="text-blue-900">
                                                📧 LAV PRIORITET: Planlæg follow-up inden for næste uge.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={() => setSelectedLead(null)}
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
