import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Calendar, DollarSign, Mail, Send, TrendingUp } from "lucide-react";

export default function PipelineDashboard() {
  const { data: pipelineStates, isLoading } =
    trpc.inbox.email.getPipelineStates.useQuery({});

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-2" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </Card>
        ))}
      </div>
    );
  }

  // Count emails by stage
  const stageCounts = {
    needs_action:
      pipelineStates?.filter(s => s.stage === "needs_action").length || 0,
    venter_pa_svar:
      pipelineStates?.filter(s => s.stage === "venter_pa_svar").length || 0,
    i_kalender:
      pipelineStates?.filter(s => s.stage === "i_kalender").length || 0,
    finance: pipelineStates?.filter(s => s.stage === "finance").length || 0,
    afsluttet: pipelineStates?.filter(s => s.stage === "afsluttet").length || 0,
  };

  const total = Object.values(stageCounts).reduce((a, b) => a + b, 0);

  // Calculate conversion rates
  const conversionRates = {
    needsToQuoted:
      stageCounts.needs_action > 0
        ? (
            (stageCounts.venter_pa_svar / stageCounts.needs_action) *
            100
          ).toFixed(1)
        : "0",
    quotedToBooked:
      stageCounts.venter_pa_svar > 0
        ? ((stageCounts.i_kalender / stageCounts.venter_pa_svar) * 100).toFixed(
            1
          )
        : "0",
    bookedToInvoiced:
      stageCounts.i_kalender > 0
        ? ((stageCounts.finance / stageCounts.i_kalender) * 100).toFixed(1)
        : "0",
    invoicedToCompleted:
      stageCounts.finance > 0
        ? ((stageCounts.afsluttet / stageCounts.finance) * 100).toFixed(1)
        : "0",
  };

  const metrics = [
    {
      title: "Needs Action",
      count: stageCounts.needs_action,
      color: "bg-red-500",
      icon: <Mail className="w-5 h-5" />,
      conversion: null,
    },
    {
      title: "Venter på svar",
      count: stageCounts.venter_pa_svar,
      color: "bg-orange-500",
      icon: <Send className="w-5 h-5" />,
      conversion: conversionRates.needsToQuoted,
    },
    {
      title: "I kalender",
      count: stageCounts.i_kalender,
      color: "bg-green-500",
      icon: <Calendar className="w-5 h-5" />,
      conversion: conversionRates.quotedToBooked,
    },
    {
      title: "Finance",
      count: stageCounts.finance,
      color: "bg-blue-500",
      icon: <DollarSign className="w-5 h-5" />,
      conversion: conversionRates.bookedToInvoiced,
    },
    {
      title: "Afsluttet",
      count: stageCounts.afsluttet,
      color: "bg-gray-500",
      icon: <TrendingUp className="w-5 h-5" />,
      conversion: conversionRates.invoicedToCompleted,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {metrics.map(metric => (
          <Card key={metric.title} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`${metric.color} text-white p-2 rounded-lg`}>
                {metric.icon}
              </div>
              {metric.conversion && (
                <Badge variant="secondary" className="text-xs">
                  {metric.conversion}%
                </Badge>
              )}
            </div>
            <div className="text-2xl font-bold">{metric.count}</div>
            <div className="text-sm text-muted-foreground">{metric.title}</div>
            {metric.conversion && (
              <div className="text-xs text-muted-foreground mt-1">
                Conversion: {metric.conversion}%
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Pipeline Funnel */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Pipeline Funnel</h3>
        <div className="space-y-2">
          {metrics.map((metric, index) => {
            const percentage = total > 0 ? (metric.count / total) * 100 : 0;
            return (
              <div key={metric.title} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{metric.title}</span>
                  <span className="text-muted-foreground">
                    {metric.count} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`${metric.color} h-2 rounded-full transition-all`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Total Summary */}
      <Card className="p-4 bg-primary/5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Total Emails i Pipeline
            </p>
            <p className="text-3xl font-bold">{total}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Completion Rate</p>
            <p className="text-3xl font-bold">
              {total > 0
                ? ((stageCounts.afsluttet / total) * 100).toFixed(1)
                : "0"}
              %
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
