import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  TrendingUp,
} from "lucide-react";

interface CustomerCaseAnalysis {
  customer: {
    id: string | number;
    name: string | null;
    email: string;
    phone: string | null;
    address?: string | null;
    property?: {
      size?: number;
      type?: string;
    };
    lead_source?: string | null;
    status?: "resolved" | "open" | "pending" | string;
    satisfaction?: "medium" | "high" | "low";
  };
  conflict?: {
    type: string;
    severity: "low" | "medium" | "high";
    root_cause?: string;
  };
  timeline?: Array<{
    date: string;
    event: string;
    quote?: {
      hours_work: string;
      team_size: number | null | string;
      price: number;
    };
    reason?: string;
    customer_reaction?: string;
    executed?: {
      team_size: number;
      time_on_site: string;
      total_work_hours: number;
      price_charged: number;
    };
    final_price?: number;
    resolution_type?: string;
    message?: string;
  }>;
  lessons?: {
    root_cause_analysis?: string[];
    fix_applied?: string[];
  };
  similar_cases?: string[];
}

interface CaseAnalysisTabProps {
  analysis?: CustomerCaseAnalysis;
}

export function CaseAnalysisTab({ analysis }: CaseAnalysisTabProps) {
  if (!analysis) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No case analysis available</p>
      </div>
    );
  }

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "open":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Customer Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Customer Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Status:</span>{" "}
              <Badge
                variant="outline"
                className={getStatusColor(analysis.customer.status)}
              >
                {analysis.customer.status || "Unknown"}
              </Badge>
            </div>
            {analysis.customer.satisfaction && (
              <div>
                <span className="text-muted-foreground">Satisfaction:</span>{" "}
                <Badge variant="outline">
                  {analysis.customer.satisfaction}
                </Badge>
              </div>
            )}
          </div>
          {analysis.customer.property && (
            <div className="text-sm">
              <span className="text-muted-foreground">Property:</span>{" "}
              {analysis.customer.property.size}m²{" "}
              {analysis.customer.property.type}
            </div>
          )}
          {analysis.customer.address && (
            <div className="text-sm">
              <span className="text-muted-foreground">Address:</span>{" "}
              {analysis.customer.address}
            </div>
          )}
          {analysis.customer.lead_source && (
            <div className="text-sm">
              <span className="text-muted-foreground">Lead Source:</span>{" "}
              {analysis.customer.lead_source}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conflict Info */}
      {analysis.conflict && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Conflict Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Type:</span>
              <Badge variant="outline">{analysis.conflict.type}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Severity:</span>
              <Badge variant={getSeverityColor(analysis.conflict.severity)}>
                {analysis.conflict.severity}
              </Badge>
            </div>
            {analysis.conflict.root_cause && (
              <div className="text-sm">
                <span className="text-muted-foreground">Root Cause:</span>{" "}
                {analysis.conflict.root_cause}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {analysis.timeline && analysis.timeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.timeline.map((item, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="shrink-0 w-2 h-2 mt-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">
                        {new Date(item.date).toLocaleDateString("da-DK", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {item.event.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    {item.quote && (
                      <div className="text-sm text-muted-foreground">
                        Quote: {item.quote.hours_work} hours
                        {item.quote.team_size
                          ? ` × ${item.quote.team_size} persons`
                          : " (team size not specified)"}{" "}
                        = {item.quote.price} DKK
                      </div>
                    )}
                    {item.reason && (
                      <div className="text-sm text-muted-foreground">
                        Reason: {item.reason}
                      </div>
                    )}
                    {item.customer_reaction && (
                      <div className="text-sm text-orange-600 font-medium">
                        Customer: {item.customer_reaction}
                      </div>
                    )}
                    {item.executed && (
                      <div className="text-sm text-muted-foreground">
                        Executed: {item.executed.team_size} persons ×{" "}
                        {item.executed.time_on_site} ={" "}
                        {item.executed.total_work_hours}h total →{" "}
                        {item.executed.price_charged} DKK
                      </div>
                    )}
                    {item.message && (
                      <div className="text-sm text-muted-foreground italic">
                        "{item.message}"
                      </div>
                    )}
                    {item.final_price && (
                      <div className="text-sm font-medium text-green-600">
                        Resolved: {item.final_price} DKK ({item.resolution_type}
                        )
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lessons Learned */}
      {analysis.lessons && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Lessons Learned
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.lessons.root_cause_analysis &&
              analysis.lessons.root_cause_analysis.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">
                    Root Cause Analysis
                  </h4>
                  <ul className="space-y-1.5">
                    {analysis.lessons.root_cause_analysis.map((item, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-muted-foreground flex gap-2"
                      >
                        <span className="text-orange-500">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            {analysis.lessons.fix_applied &&
              analysis.lessons.fix_applied.length > 0 && (
                <div>
                  <Separator className="my-3" />
                  <h4 className="text-sm font-medium mb-2 text-green-600">
                    Fixes Applied
                  </h4>
                  <ul className="space-y-1.5">
                    {analysis.lessons.fix_applied.map((item, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-muted-foreground flex gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </CardContent>
        </Card>
      )}

      {/* Similar Cases */}
      {analysis.similar_cases && analysis.similar_cases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Similar Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analysis.similar_cases.map((caseId, idx) => (
                <Badge key={idx} variant="secondary">
                  {caseId}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
