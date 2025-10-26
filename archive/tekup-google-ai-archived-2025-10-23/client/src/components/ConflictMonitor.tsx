import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Clock, Shield } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface Escalation {
    id: string;
    leadId: string;
    customerEmail: string;
    customerName: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    conflictScore: number;
    matchedKeywords: string[];
    emailSnippet: string;
    escalatedBy: 'system' | 'manual';
    createdAt: string;
    resolvedAt: string | null;
    resolution: string | null;
    lead?: {
        name: string;
        email: string;
        taskType: string;
        customer?: {
            name: string;
        };
    };
}

interface EscalationStats {
    total: number;
    bySeverity: {
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
    resolved: number;
    unresolved: number;
    resolutionRate: string;
}

// HARDCODED: Full backend URL to prevent CORS errors
const API_BASE = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api/dashboard`
    : 'https://api.renos.dk/api/dashboard';

export default function ConflictMonitor() {
    const [escalations, setEscalations] = useState<Escalation[]>([]);
    const [stats, setStats] = useState<EscalationStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedEscalation, setSelectedEscalation] = useState<Escalation | null>(null);

    useEffect(() => {
        void fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [escalationsRes, statsRes] = await Promise.all([
                fetch(`${API_BASE}/escalations/recent?limit=5`),
                fetch(`${API_BASE}/escalations/stats?period=30d`)
            ]);

            if (escalationsRes.ok) {
                setEscalations(await escalationsRes.json() as Escalation[]);
            }
            if (statsRes.ok) {
                setStats(await statsRes.json() as EscalationStats);
            }
        } catch (error) {
            console.error('Failed to fetch escalations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (id: string) => {
        const resolution = prompt('Hvordan blev konflikten løst?');
        if (!resolution) return;

        try {
            const res = await fetch(`${API_BASE}/escalations/${id}/resolve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resolution })
            });

            if (res.ok) {
                void fetchData();
                setSelectedEscalation(null);
            }
        } catch (error) {
            console.error('Failed to resolve escalation:', error);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'text-red-600 bg-red-50 border-red-200';
            case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return <XCircle className="w-5 h-5" />;
            case 'high': return <AlertTriangle className="w-5 h-5" />;
            case 'medium': return <Clock className="w-5 h-5" />;
            case 'low': return <Shield className="w-5 h-5" />;
            default: return <AlertTriangle className="w-5 h-5" />;
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Konflikt Monitor
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse space-y-3">
                        <div className="h-16 bg-gray-200 rounded"></div>
                        <div className="h-16 bg-gray-200 rounded"></div>
                        <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <span className="text-2xl">Konflikt Monitor</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Stats Overview */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                        <div className="glass-card p-6 rounded-xl space-y-2 border-gray-500/20">
                            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                            <div className="text-sm text-gray-600 font-medium">Total (30d)</div>
                        </div>
                        <div className="glass-card p-6 rounded-xl space-y-2 border-red-500/20">
                            <div className="text-3xl font-bold text-red-600">{stats.bySeverity.critical}</div>
                            <div className="text-sm text-red-600 font-medium">Kritiske</div>
                        </div>
                        <div className="glass-card p-6 rounded-xl space-y-2 border-orange-500/20">
                            <div className="text-3xl font-bold text-orange-600">{stats.bySeverity.high}</div>
                            <div className="text-sm text-orange-600 font-medium">Høj</div>
                        </div>
                        <div className="glass-card p-6 rounded-xl space-y-2 border-green-500/20">
                            <div className="text-3xl font-bold text-green-600">{stats.resolutionRate}%</div>
                            <div className="text-sm text-green-600 font-medium">Løst</div>
                        </div>
                    </div>
                )}

                {/* Recent Escalations */}
                <div className="space-y-4">
                    {escalations.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="p-4 rounded-full bg-green-500/10 border border-green-500/20 w-fit mx-auto mb-6">
                                <CheckCircle className="w-16 h-16 text-green-500" />
                            </div>
                            <p className="text-xl font-semibold mb-2">Ingen aktive konflikter</p>
                            <p className="text-base text-gray-500">Alt kører glat! 🎉</p>
                        </div>
                    ) : (
                        escalations.map((esc) => (
                            <div
                                key={esc.id}
                                className={`glass-card p-5 rounded-xl cursor-pointer transition-all duration-200 hover:bg-opacity-10 ${esc.resolvedAt ? 'opacity-50' : ''
                                    }`}
                                onClick={() => setSelectedEscalation(esc)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1">
                                        <div className="p-2 rounded-lg bg-red-500/10">
                                            {getSeverityIcon(esc.severity)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-base truncate">
                                                {esc.lead?.name || esc.customerName}
                                            </div>
                                            <div className="text-sm truncate text-gray-500 mt-1">
                                                {esc.customerEmail}
                                            </div>
                                            <div className="text-sm mt-2 text-gray-500">
                                                Score: {esc.conflictScore} • {esc.matchedKeywords.slice(0, 3).join(', ')}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-3">
                                        <div className="text-sm font-semibold uppercase">
                                            {esc.severity}
                                        </div>
                                        {esc.resolvedAt ? (
                                            <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                                                <CheckCircle className="w-3 h-3" />
                                                Løst
                                            </div>
                                        ) : (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    void handleResolve(esc.id);
                                                }}
                                                className="text-xs bg-white px-2 py-1 rounded border border-current mt-1 hover:bg-opacity-20"
                                            >
                                                Marker som løst
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Details Modal */}
                {selectedEscalation && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                        onClick={() => setSelectedEscalation(null)}
                    >
                        <div
                            className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 space-y-4">
                                <div className="flex items-start justify-between">
                                    <h3 className="text-lg font-bold">Konflikt Detaljer</h3>
                                    <button
                                        onClick={() => setSelectedEscalation(null)}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className={`p-3 rounded-lg ${getSeverityColor(selectedEscalation.severity)}`}>
                                    <div className="flex items-center gap-2 font-medium mb-2">
                                        {getSeverityIcon(selectedEscalation.severity)}
                                        {selectedEscalation.severity.toUpperCase()} SEVERITY
                                    </div>
                                    <div className="text-sm">
                                        Konflikt Score: {selectedEscalation.conflictScore}
                                    </div>
                                </div>

                                <div>
                                    <div className="font-medium mb-1">Kunde:</div>
                                    <div className="text-sm text-gray-600">
                                        {selectedEscalation.lead?.name || selectedEscalation.customerName}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {selectedEscalation.customerEmail}
                                    </div>
                                </div>

                                <div>
                                    <div className="font-medium mb-1">Matchede Nøgleord:</div>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedEscalation.matchedKeywords.map((keyword, i) => (
                                            <span
                                                key={i}
                                                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                                            >
                                                {keyword}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div className="font-medium mb-1">Email Uddrag:</div>
                                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-200">
                                        "{selectedEscalation.emailSnippet}"
                                    </div>
                                </div>

                                <div className="text-xs text-gray-500">
                                    Eskaleret: {new Date(selectedEscalation.createdAt).toLocaleString('da-DK')} •{' '}
                                    {selectedEscalation.escalatedBy === 'system' ? 'Automatisk' : 'Manuel'}
                                </div>

                                {selectedEscalation.resolvedAt && selectedEscalation.resolution && (
                                    <div className="bg-green-50 p-3 rounded border border-green-200">
                                        <div className="font-medium text-green-800 mb-1">Løsning:</div>
                                        <div className="text-sm text-green-700">{selectedEscalation.resolution}</div>
                                        <div className="text-xs text-green-600 mt-1">
                                            Løst: {new Date(selectedEscalation.resolvedAt).toLocaleString('da-DK')}
                                        </div>
                                    </div>
                                )}

                                {!selectedEscalation.resolvedAt && (
                                    <button
                                        onClick={() => void handleResolve(selectedEscalation.id)}
                                        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors"
                                    >
                                        Marker som Løst
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
