import { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.renos.dk';

interface RateLimit {
    source: string;
    current: number;
    max: number;
    remaining: number;
    usagePercent: number;
    windowStart: string | null;
    status: 'ok' | 'warning' | 'blocked';
}

interface RateLimitStatus {
    limits: RateLimit[];
    summary: {
        totalSent: number;
        totalCapacity: number;
        totalRemaining: number;
        systemStatus: 'ok' | 'warning' | 'blocked';
        window: string;
        maxPerSource: number;
    };
    timestamp: string;
}

interface HistoryPoint {
    timestamp: string;
    count: number;
    status: 'ok' | 'warning' | 'exceeded';
}

interface RateLimitHistory {
    history: HistoryPoint[];
    stats: {
        totalSent24h: number;
        avgPerHour: number;
        peakHour: {
            timestamp: string;
            count: number;
        } | null;
    };
    limits: {
        perHour: number;
        per5Min: number;
    };
    timestamp: string;
}

/**
 * Rate Limiting Monitor Component
 * 
 * Displays real-time email sending rate from emailGateway.
 * Shows per-source limits, remaining capacity, and 24h history.
 */
export function RateLimitMonitor() {
    const [status, setStatus] = useState<RateLimitStatus | null>(null);
    const [history, setHistory] = useState<RateLimitHistory | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        void loadData();
        // Refresh every 30 seconds
        const interval = setInterval(() => void loadData(), 30000);
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        try {
            const [statusRes, historyRes] = await Promise.all([
                fetch(`${API_BASE}/api/dashboard/rate-limits/status`),
                fetch(`${API_BASE}/api/dashboard/rate-limits/history`)
            ]);

            if (statusRes.ok && historyRes.ok) {
                const statusData = await statusRes.json() as RateLimitStatus;
                const historyData = await historyRes.json() as RateLimitHistory;
                setStatus(statusData);
                setHistory(historyData);
            }
        } catch (error) {
            console.error('Failed to load rate limit data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'blocked': return 'red';
            case 'warning': return 'orange';
            default: return 'green';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'blocked': return <AlertTriangle className="w-5 h-5" />;
            case 'warning': return <Clock className="w-5 h-5" />;
            default: return <CheckCircle className="w-5 h-5" />;
        }
    };

    const formatSourceName = (source: string) => {
        return source
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    if (loading) {
        return (
            <Card>
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-5 h-5 text-purple-600" />
                        <h2 className="text-lg font-semibold">Rate Limiting Monitor</h2>
                    </div>
                    <p className="text-gray-600">Indlæser rate limit data...</p>
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                            <Activity className="w-6 h-6 text-purple-600" />
                        </div>
                        <h2 className="text-2xl font-bold">Rate Limiting Monitor</h2>
                    </div>
                    {status && (
                        <Badge color={getStatusColor(status.summary.systemStatus)}>
                            {status.summary.systemStatus.toUpperCase()}
                        </Badge>
                    )}
                </div>

                {/* Summary Stats */}
                {status && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="glass-card p-6 rounded-xl space-y-2 border-blue-500/20">
                            <div className="text-sm text-gray-600 font-medium">Sendt Nu</div>
                            <div className="text-3xl font-bold text-blue-600">
                                {status.summary.totalSent}
                            </div>
                            <div className="text-xs text-gray-500">
                                af {status.summary.totalCapacity} ({status.summary.window})
                            </div>
                        </div>
                        <div className="glass-card p-6 rounded-xl space-y-2 border-green-500/20">
                            <div className="text-sm text-gray-600 font-medium">Resterende</div>
                            <div className="text-3xl font-bold text-green-600">
                                {status.summary.totalRemaining}
                            </div>
                            <div className="text-xs text-gray-500">emails tilbage</div>
                        </div>
                        {history && (
                            <>
                                <div className="glass-card p-6 rounded-xl space-y-2 border-purple-500/20">
                                    <div className="text-sm text-gray-600 font-medium">24t Total</div>
                                    <div className="text-3xl font-bold text-purple-600">
                                        {history.stats.totalSent24h}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        Gns. {history.stats.avgPerHour}/time
                                    </div>
                                </div>
                                <div className="glass-card p-6 rounded-xl space-y-2 border-orange-500/20">
                                    <div className="text-sm text-gray-600 font-medium">Peak Time</div>
                                    <div className="text-3xl font-bold text-orange-600">
                                        {history.stats.peakHour?.count || 0}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {history.stats.peakHour
                                            ? new Date(history.stats.peakHour.timestamp).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })
                                            : 'N/A'}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Per-Source Limits */}
                {status && status.limits.length > 0 && (
                    <div className="space-y-4 mb-8">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">
                            Per-Service Limits ({status.summary.window} vindue)
                        </h3>
                        {status.limits.map((limit) => (
                            <div
                                key={limit.source}
                                className="glass-card p-5 rounded-xl hover:bg-opacity-10 transition-all duration-200"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-purple-500/10">
                                            {getStatusIcon(limit.status)}
                                        </div>
                                        <span className="font-semibold text-gray-900 text-base">
                                            {formatSourceName(limit.source)}
                                        </span>
                                        <Badge color={getStatusColor(limit.status)}>
                                            {limit.status.toUpperCase()}
                                        </Badge>
                                    </div>
                                    <span className="text-base text-gray-600 font-medium">
                                        {limit.current} / {limit.max}
                                    </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                                    <div
                                        className={`h-3 rounded-full transition-all ${limit.status === 'blocked' ? 'bg-red-600' :
                                            limit.status === 'warning' ? 'bg-orange-500' :
                                                'bg-green-500'
                                            }`}
                                        style={{ width: `${limit.usagePercent}%` }}
                                    />
                                </div>

                                <div className="flex items-center justify-between text-sm text-gray-500">
                                    <span>{limit.remaining} emails tilbage</span>
                                    <span>{limit.usagePercent}% brugt</span>
                                </div>

                                {limit.windowStart && (
                                    <div className="text-sm text-gray-500 mt-2">
                                        Vindue starter: {new Date(limit.windowStart).toLocaleTimeString('da-DK')}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* 24-Hour History Chart (Simple Text-Based) */}
                {history && history.history.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">
                            24-Timers Historie
                        </h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {history.history.slice(-12).reverse().map((point, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">
                                        {new Date(point.timestamp).toLocaleString('da-DK', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            day: '2-digit',
                                            month: '2-digit'
                                        })}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-32 bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${point.status === 'exceeded' ? 'bg-red-600' :
                                                    point.status === 'warning' ? 'bg-orange-500' :
                                                        'bg-green-500'
                                                    }`}
                                                style={{
                                                    width: `${Math.min(100, (point.count / (history.limits.perHour || 50)) * 100)}%`
                                                }}
                                            />
                                        </div>
                                        <span className="font-medium text-gray-900 w-8 text-right">
                                            {point.count}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
                            <div className="flex items-center justify-between">
                                <span>Limits:</span>
                                <span>
                                    {history.limits.per5Min}/5min · {history.limits.perHour}/time
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Warning if approaching limits */}
                {status && status.summary.systemStatus !== 'ok' && (
                    <div className={`mt-4 rounded-lg p-4 ${status.summary.systemStatus === 'blocked'
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-orange-50 border border-orange-200'
                        }`}>
                        <div className="flex items-start gap-2">
                            <AlertTriangle className={`w-5 h-5 mt-0.5 ${status.summary.systemStatus === 'blocked' ? 'text-red-600' : 'text-orange-600'
                                }`} />
                            <div>
                                <h4 className={`font-medium ${status.summary.systemStatus === 'blocked' ? 'text-red-900' : 'text-orange-900'
                                    }`}>
                                    {status.summary.systemStatus === 'blocked'
                                        ? '🚫 Rate Limit Nået'
                                        : '⚠️ Nærmer Sig Limit'}
                                </h4>
                                <p className={`text-sm mt-1 ${status.summary.systemStatus === 'blocked' ? 'text-red-800' : 'text-orange-800'
                                    }`}>
                                    {status.summary.systemStatus === 'blocked'
                                        ? 'En eller flere services har nået rate limit. Nye emails vil blive blokeret indtil vinduet nulstilles.'
                                        : 'Nogle services nærmer sig deres rate limit. Overvåg email-sending tæt.'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
