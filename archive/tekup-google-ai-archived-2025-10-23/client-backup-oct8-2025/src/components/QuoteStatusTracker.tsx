/**
 * Quote Status Tracker Component
 * 
 * Displays quote pipeline with status tracking:
 * - Draft, Sent, Accepted, Rejected
 * - Conversion metrics
 * - Recent quotes with status
 */

import { useEffect, useState } from 'react';
import { FileText, TrendingUp, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { buildApiUrl } from '@/config/api';

interface QuoteStatusData {
  status: string;
  count: number;
  totalValue: number;
}

interface QuoteMetrics {
  totalQuotes: number;
  acceptedQuotes: number;
  conversionRate: number;
  avgQuoteValue: number;
}

interface RecentQuote {
  id: string;
  status: string;
  total: number;
  validUntil: string | null;
  createdAt: string;
  lead: {
    name: string;
    email: string;
  };
}

interface QuoteTrackingData {
  byStatus: QuoteStatusData[];
  recentQuotes: RecentQuote[];
  metrics: QuoteMetrics;
}

const STATUS_CONFIG = {
  draft: { label: 'Kladde', icon: FileText, color: 'text-gray-400', bg: 'bg-gray-100' },
  sent: { label: 'Sendt', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-100' },
  accepted: { label: 'Accepteret', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100' },
  rejected: { label: 'Afvist', icon: XCircle, color: 'text-red-500', bg: 'bg-red-100' },
};

export default function QuoteStatusTracker() {
  const [data, setData] = useState<QuoteTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuoteData();
    // Refresh every 60 seconds
    const interval = setInterval(fetchQuoteData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchQuoteData = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl('/api/dashboard/quotes/status-tracking'));
      
      if (!response.ok) {
        throw new Error('Failed to fetch quote tracking data');
      }

      const quoteData = await response.json() as QuoteTrackingData;
      setData(quoteData);
      setError(null);
    } catch (err) {
      console.error('Error fetching quote data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load quote data');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Tilbudsoversigt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-glass rounded"></div>
            <div className="h-20 bg-glass rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Tilbudsoversigt</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Fejl: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-3">
            <FileText className="w-6 h-6" />
            Tilbudsoversigt
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {data.metrics.totalQuotes} tilbud i alt
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Metrics Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card p-6 rounded-xl space-y-2">
            <div className="text-sm text-muted-foreground">Konverteringsrate</div>
            <div className="text-3xl font-bold text-primary flex items-center gap-3">
              <TrendingUp className="w-6 h-6" />
              {data.metrics.conversionRate}%
            </div>
          </div>
          
          <div className="glass-card p-6 rounded-xl space-y-2">
            <div className="text-sm text-muted-foreground">Accepteret</div>
            <div className="text-3xl font-bold text-green-500 flex items-center gap-3">
              <CheckCircle className="w-6 h-6" />
              {data.metrics.acceptedQuotes}
            </div>
          </div>
          
          <div className="glass-card p-6 rounded-xl space-y-2">
            <div className="text-sm text-muted-foreground">Gns. værdi</div>
            <div className="text-3xl font-bold text-foreground flex items-center gap-3">
              <DollarSign className="w-6 h-6" />
              {Math.round(data.metrics.avgQuoteValue).toLocaleString('da-DK')} kr
            </div>
          </div>
          
          <div className="glass-card p-6 rounded-xl space-y-2">
            <div className="text-sm text-muted-foreground">I alt</div>
            <div className="text-3xl font-bold text-foreground flex items-center gap-3">
              <FileText className="w-6 h-6" />
              {data.metrics.totalQuotes}
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground mb-4">Status fordeling</h3>
          <div className="space-y-3">
            {data.byStatus.map((statusData) => {
              const config = STATUS_CONFIG[statusData.status as keyof typeof STATUS_CONFIG];
              if (!config) return null;
              
              const Icon = config.icon;
              const percentage = data.metrics.totalQuotes > 0 
                ? Math.round((statusData.count / data.metrics.totalQuotes) * 100)
                : 0;

              return (
                <div key={statusData.status} className="glass-card p-5 rounded-xl hover:bg-opacity-10 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`${config.bg} p-3 rounded-xl`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div className="space-y-1">
                        <div className="font-semibold text-base">{config.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {statusData.count} tilbud • {statusData.totalValue.toLocaleString('da-DK')} kr
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{percentage}%</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Quotes */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground mb-4">Seneste tilbud</h3>
          <div className="space-y-3">
            {data.recentQuotes.slice(0, 5).map((quote) => {
              const config = STATUS_CONFIG[quote.status as keyof typeof STATUS_CONFIG];
              if (!config) return null;
              
              const Icon = config.icon;

              return (
                <div key={quote.id} className="glass-card p-5 rounded-xl hover:bg-opacity-10 transition-all duration-200 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`${config.bg} p-3 rounded-xl`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="font-semibold text-base">{quote.lead.name}</div>
                        <div className="text-sm text-muted-foreground">{quote.lead.email}</div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="font-bold text-lg">{quote.total.toLocaleString('da-DK')} kr</div>
                      <div className={`text-sm ${config.color} font-medium`}>{config.label}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
