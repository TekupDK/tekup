import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Info, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface FeatureStatus {
    enabled: boolean;
    safe: boolean;
    description: string;
}

interface EnvironmentStatus {
    runMode: 'live' | 'dry-run';
    isLiveMode: boolean;
    features: {
        autoResponse: FeatureStatus;
        followUp: FeatureStatus;
        escalation: FeatureStatus;
    };
    riskLevel: 'safe' | 'caution' | 'danger';
    warnings: string[];
    recommendation: string;
}

const API_BASE = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api/dashboard`
    : 'https://api.renos.dk/api/dashboard';

export default function SystemStatus() {
    const [status, setStatus] = useState<EnvironmentStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    const fetchStatus = async () => {
        try {
            const res = await fetch(`${API_BASE}/environment/status`);
            if (res.ok) {
                setStatus(await res.json() as EnvironmentStatus);
                setLastUpdate(new Date());
            }
        } catch (error) {
            console.error('Failed to fetch environment status:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchStatus();
        // Refresh every 30 seconds
        const interval = setInterval(() => void fetchStatus(), 30000);
        return () => clearInterval(interval);
    }, []);

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'danger': return 'bg-red-500/10 border-red-500/50 text-red-400';
            case 'caution': return 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400';
            case 'safe': return 'bg-green-500/10 border-green-500/50 text-green-400';
            default: return 'bg-gray-500/10 border-gray-500/50 text-gray-400';
        }
    };

    const getRiskIcon = (level: string) => {
        switch (level) {
            case 'danger': return <XCircle className="w-6 h-6" />;
            case 'caution': return <AlertTriangle className="w-6 h-6" />;
            case 'safe': return <CheckCircle className="w-6 h-6" />;
            default: return <Shield className="w-6 h-6" />;
        }
    };

    const getRiskText = (level: string) => {
        switch (level) {
            case 'danger': return 'FARLIGT';
            case 'caution': return 'FORSIGTIG';
            case 'safe': return 'SIKKERT';
            default: return 'UKENDT';
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader className="pb-6">
                    <CardTitle className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <Shield className="w-6 h-6" />
                        </div>
                        <span className="text-2xl">System Status</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-24 glass-card rounded-xl"></div>
                        <div className="h-20 glass-card rounded-xl"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!status) {
        return (
            <Card>
                <CardHeader className="pb-6">
                    <CardTitle className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <Shield className="w-6 h-6" />
                        </div>
                        <span className="text-2xl">System Status</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-16 text-gray-500">
                        <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20 w-fit mx-auto mb-6">
                            <AlertTriangle className="w-16 h-16 text-red-500" />
                        </div>
                        <p className="text-xl font-semibold">Kunne ikke hente status</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-2">
            <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <Shield className="w-6 h-6" />
                        </div>
                        <span className="text-2xl">System Sikkerhedsstatus</span>
                    </CardTitle>
                    <button
                        onClick={() => void fetchStatus()}
                        className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
                        title="Opdater status"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                    Sidst opdateret: {lastUpdate.toLocaleTimeString('da-DK')}
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Risk Level Banner */}
                <div className={`p-6 rounded-xl border-2 ${getRiskColor(status.riskLevel)}`}>
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-black/10">
                            {getRiskIcon(status.riskLevel)}
                        </div>
                        <div className="flex-1">
                            <div className="font-bold text-2xl">
                                {getRiskText(status.riskLevel)}
                            </div>
                            <div className="text-base opacity-90 mt-2">
                                {status.recommendation}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Run Mode */}
                <div className="glass-card p-6 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-blue-500/10">
                            <Info className="w-6 h-6 text-blue-500" />
                        </div>
                        <span className="font-semibold text-lg">Run Mode:</span>
                    </div>
                    <span className={`px-4 py-2 rounded-xl text-base font-bold ${status.isLiveMode
                        ? 'bg-red-100 text-red-700 border-2 border-red-300'
                        : 'bg-green-100 text-green-700 border-2 border-green-300'
                        }`}>
                        {status.runMode.toUpperCase()}
                    </span>
                </div>

                {/* Features Status */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-gray-700 mb-4">Email Automation Features:</h3>

                    {/* Auto Response */}
                    <div className={`glass-card p-5 rounded-xl border-2 ${status.features.autoResponse.safe
                        ? 'border-green-500/20'
                        : 'border-red-500/50'
                        }`}>
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`p-2 rounded-lg ${status.features.autoResponse.safe ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                        {status.features.autoResponse.safe ? (
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-red-600" />
                                        )}
                                    </div>
                                    <span className="font-semibold text-base">Auto-Response</span>
                                </div>
                                <p className="text-sm text-gray-600 ml-12">
                                    {status.features.autoResponse.description}
                                </p>
                            </div>
                            <span className={`px-3 py-2 rounded-lg text-sm font-bold whitespace-nowrap ${status.features.autoResponse.enabled
                                ? 'bg-red-200 text-red-800'
                                : 'bg-gray-200 text-gray-700'
                                }`}>
                                {status.features.autoResponse.enabled ? 'AKTIV' : 'SLÅET FRA'}
                            </span>
                        </div>
                    </div>

                    {/* Follow Up */}
                    <div className={`glass-card p-5 rounded-xl border-2 ${status.features.followUp.safe
                        ? 'border-green-500/20'
                        : 'border-orange-500/50'
                        }`}>
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`p-2 rounded-lg ${status.features.followUp.safe ? 'bg-green-500/10' : 'bg-orange-500/10'}`}>
                                        {status.features.followUp.safe ? (
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        ) : (
                                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                                        )}
                                    </div>
                                    <span className="font-semibold text-base">Follow-Up</span>
                                </div>
                                <p className="text-sm text-gray-600 ml-12">
                                    {status.features.followUp.description}
                                </p>
                            </div>
                            <span className={`px-3 py-2 rounded-lg text-sm font-bold whitespace-nowrap ${status.features.followUp.enabled
                                ? 'bg-orange-200 text-orange-800'
                                : 'bg-gray-200 text-gray-700'
                                }`}>
                                {status.features.followUp.enabled ? 'AKTIV' : 'SLÅET FRA'}
                            </span>
                        </div>
                    </div>

                    {/* Escalation */}
                    <div className="glass-card p-5 rounded-xl border-2 border-blue-500/20">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-blue-500/10">
                                        <Shield className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <span className="font-semibold text-base">Escalation</span>
                                </div>
                                <p className="text-sm text-gray-600 ml-12">
                                    {status.features.escalation.description}
                                </p>
                            </div>
                            <span className={`px-3 py-2 rounded-lg text-sm font-bold whitespace-nowrap ${status.features.escalation.enabled
                                ? 'bg-blue-200 text-blue-800'
                                : 'bg-gray-200 text-gray-700'
                                }`}>
                                {status.features.escalation.enabled ? 'AKTIV' : 'SLÅET FRA'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Warnings */}
                {status.warnings.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg text-gray-700">Advarsler:</h3>
                        {status.warnings.map((warning, i) => (
                            <div
                                key={i}
                                className={`glass-card p-5 rounded-xl text-base border-2 ${warning.includes('AKTIVERET I LIVE MODE')
                                    ? 'bg-red-50/50 text-red-800 border-red-300 font-semibold'
                                    : warning.includes('Dry-run')
                                        ? 'bg-green-50/50 text-green-800 border-green-300'
                                        : 'bg-yellow-50/50 text-yellow-800 border-yellow-300'
                                    }`}
                            >
                                {warning}
                            </div>
                        ))}
                    </div>
                )}

                {/* Quick Actions */}
                {status.riskLevel === 'danger' && (
                    <div className="glass-card p-6 rounded-xl bg-red-50/50 border-2 border-red-400">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 rounded-xl bg-red-500/20">
                                <AlertTriangle className="w-6 h-6 text-red-700" />
                            </div>
                            <div className="font-bold text-xl text-red-800">⚠️ HANDLING PÅKRÆVET</div>
                        </div>
                        <p className="text-base text-red-700 mb-4 font-semibold">
                            Auto-send er aktiveret i live mode. Emails sendes automatisk til kunder!
                        </p>
                        <div className="space-y-3 text-base text-red-800 bg-white/50 p-5 rounded-xl">
                            <div className="font-semibold">1. Gå til <a href="https://dashboard.render.com" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-red-600">Render.com Dashboard</a></div>
                            <div>2. Åbn Environment Variables</div>
                            <div>3. Sæt <code className="bg-red-200 px-2 py-1 rounded-lg font-mono text-sm">AUTO_RESPONSE_ENABLED=false</code></div>
                            <div>4. Sæt <code className="bg-red-200 px-2 py-1 rounded-lg font-mono text-sm">FOLLOW_UP_ENABLED=false</code></div>
                            <div>5. Redeploy applikationen</div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
