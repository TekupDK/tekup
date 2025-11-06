import type { BillyInvoice } from "@/../../shared/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdaptivePolling } from "@/hooks/useAdaptivePolling";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useRateLimit } from "@/hooks/useRateLimit";
import { trpc } from "@/lib/trpc";
import {
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileEdit,
  FileText,
  Search,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { SafeStreamdown } from "../SafeStreamdown";

/**
 * InvoicesTab - Displays and manages Billy.dk invoices
 *
 * Integration: Uses Billy-mcp By Tekup (TekupDK/tekup-billy)
 * - Base URL: https://tekup-billy-production.up.railway.app
 * - API Version: 2.0.0
 * - Authentication: X-API-Key header
 * - Features: Automatic pagination, search, filter, AI analysis
 */
export default function InvoicesTab() {
  // Rate limit handling
  const rateLimit = useRateLimit();

  const {
    data: invoices,
    isLoading,
    isFetching,
    error,
    refetch,
  } = trpc.inbox.invoices.list.useQuery(undefined, {
    // Disable automatic polling - use adaptive polling instead
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    enabled: !rateLimit.isRateLimited,
    retry: (failureCount, error) => {
      if (rateLimit.isRateLimitError(error)) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Adaptive polling based on user activity
  useAdaptivePolling({
    baseInterval: 60000, // 60 seconds base
    minInterval: 30000, // 30 seconds when active
    maxInterval: 180000, // 3 minutes when inactive
    inactivityThreshold: 60000, // 1 minute to consider inactive
    pauseOnHidden: true,
    enabled: !rateLimit.isRateLimited && !isLoading,
    onPoll: async () => {
      if (!rateLimit.isRateLimited) {
        await refetch();
      }
    },
  });

  // Handle rate limit errors
  useEffect(() => {
    if (error && rateLimit.isRateLimitError(error)) {
      rateLimit.handleRateLimitError(error);
    }
  }, [error, rateLimit]);
  const analyzeInvoiceMutation = trpc.chat.analyzeInvoice.useMutation();
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInvoice, setSelectedInvoice] = useState<BillyInvoice | null>(null);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [analyzingInvoice, setAnalyzingInvoice] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<"up" | "down" | null>(
    null
  );
  const [feedbackComment, setFeedbackComment] = useState("");
  const [showCommentInput, setShowCommentInput] = useState(false);
  const submitFeedbackMutation = trpc.chat.submitAnalysisFeedback.useMutation();

  // Filter invoices based on search and status
  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];

    return invoices.filter((invoice: BillyInvoice) => {
      const matchesSearch =
        debouncedSearch === "" ||
        invoice.invoiceNo?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        invoice.contactId?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        invoice.id?.toLowerCase().includes(debouncedSearch.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || invoice.state === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, debouncedSearch, statusFilter]);

  const handleFeedback = async (rating: "up" | "down") => {
    if (!selectedInvoice) return;

    setFeedbackGiven(rating);

    // Show comment input for negative feedback
    if (rating === "down") {
      setShowCommentInput(true);
      return;
    }

    try {
      await submitFeedbackMutation.mutateAsync({
        invoiceId: selectedInvoice.id,
        rating,
        analysis: aiAnalysis,
        ...(feedbackComment && { comment: feedbackComment }),
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };

  const submitFeedbackWithComment = async () => {
    if (!selectedInvoice || !feedbackGiven) return;

    try {
      await submitFeedbackMutation.mutateAsync({
        invoiceId: selectedInvoice.id,
        rating: feedbackGiven,
        analysis: aiAnalysis,
        ...(feedbackComment && { comment: feedbackComment }),
      });
      setShowCommentInput(false);
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };

  const csvEscape = (val: any) => {
    const s = val == null ? "" : String(val);
    const escaped = s.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const formatDate = (d: any) => {
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? "" : dt.toLocaleDateString("da-DK");
  };

  const exportToCSV = (invoice: BillyInvoice, analysis: string) => {
    // Auto-categorize based on invoice state and AI analysis
    const category = (() => {
      if (invoice.state === "overdue") return "URGENT";
      if (invoice.state === "draft") return "PENDING_REVIEW";
      if (
        analysis.toLowerCase().includes("risk") ||
        analysis.toLowerCase().includes("concern")
      )
        return "ATTENTION_NEEDED";
      if (
        analysis.toLowerCase().includes("good") ||
        analysis.toLowerCase().includes("positive")
      )
        return "HEALTHY";
      return "NORMAL";
    })();

    // Extract priority from analysis
    const priority = (() => {
      if (
        analysis.toLowerCase().includes("urgent") ||
        invoice.state === "overdue"
      )
        return "HIGH";
      if (
        analysis.toLowerCase().includes("important") ||
        invoice.state === "approved"
      )
        return "MEDIUM";
      return "LOW";
    })();

    // Create CSV content with categorization
    const headers = [
      "Invoice Number",
      "Customer",
      "Status",
      "Category",
      "Priority",
      "Entry Date",
      "Payment Terms",
      "AI Summary",
      "Recommendations",
    ];

    // Extract recommendations from AI analysis (simple text extraction)
    const recommendations = analysis
      .split("\n")
      .filter(
        line =>
          line.toLowerCase().includes("recommend") ||
          line.toLowerCase().includes("action") ||
          line.toLowerCase().includes("follow-up")
      )
      .join(" | ");

    const summary = analysis.replace(/[\n\r]/g, " ").substring(0, 200) + "...";

    const row = [
      csvEscape(invoice.invoiceNo || invoice.id.slice(0, 8)),
      csvEscape(invoice.contactId ?? ""),
      csvEscape(invoice.state ?? ""),
      csvEscape(category),
      csvEscape(priority),
      csvEscape(formatDate(invoice.entryDate)),
      csvEscape(`${invoice.paymentTermsDays} days`),
      csvEscape(summary),
      csvEscape(recommendations || "See full analysis"),
    ];

    const csvContent = [headers.join(","), row.join(",")].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `invoice-${invoice.invoiceNo || invoice.id}-analysis.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Fix memory leak
  };

  const handleAnalyzeInvoice = async (invoice: BillyInvoice) => {
    const analysisId = invoice.id;

    setSelectedInvoice(invoice);
    setCurrentAnalysisId(analysisId);
    setFeedbackGiven(null);
    setFeedbackComment("");
    setShowCommentInput(false);
    setAnalyzingInvoice(true);
    setAiAnalysis("");

    try {
      // Create a formatted invoice summary for AI analysis
      const invoiceSummary = `
Invoice Analysis Request:
- Invoice Number: ${invoice.invoiceNo || invoice.id}
- Customer: ${invoice.contactId}
- Status: ${invoice.state}
- Entry Date: ${invoice.entryDate}
- Payment Terms: ${invoice.paymentTermsDays} days
- Lines: ${invoice.lines?.length || 0} items

Please analyze this invoice and provide:
1. Payment status and any overdue warnings
2. Invoice completeness check
3. Any anomalies or unusual patterns
4. Recommendations for follow-up actions
`;

      // Call AI to analyze the invoice using tRPC
      const result = await analyzeInvoiceMutation.mutateAsync({
        invoiceData: invoiceSummary,
      });

      // Only update if still analyzing the same invoice
      if (analysisId === currentAnalysisId) {
        setAiAnalysis(
          result.analysis || "Analysis complete. No issues detected."
        );
      }
    } catch (error) {
      console.error("Error analyzing invoice:", error);
      // Only update if still analyzing the same invoice
      if (analysisId === currentAnalysisId) {
        setAiAnalysis("Error analyzing invoice. Please try again.");
      }
    } finally {
      // Only update if still analyzing the same invoice
      if (analysisId === currentAnalysisId) {
        setAnalyzingInvoice(false);
      }
    }
  };

  const getStatusBadge = (state: string) => {
    switch (state) {
      case "paid":
        return {
          variant: "default" as const,
          icon: CheckCircle2,
          label: "Betalt",
        };
      case "approved":
        return { variant: "secondary" as const, icon: CheckCircle2, label: "Godkendt" };
      case "sent":
        return { variant: "secondary" as const, icon: Send, label: "Afsendt" };
      case "overdue":
        return {
          variant: "destructive" as const,
          icon: Clock,
          label: "Forfalden",
        };
      case "draft":
        return { variant: "outline" as const, icon: FileEdit, label: "Kladde" };
      case "voided":
        return { variant: "outline" as const, icon: FileText, label: "Annulleret" };
      default:
        return {
          variant: "secondary" as const,
          icon: FileText,
          label: state,
        };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("da-DK", {
      style: "currency",
      currency: "DKK",
    }).format(amount);
  };

  const addDays = (dateStr: string, days: number) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const copy = new Date(d);
    copy.setDate(copy.getDate() + (days || 0));
    return copy;
  };

  const formatDueInfo = (entryDate: string, paymentTermsDays?: number | null) => {
    const due = addDays(entryDate, paymentTermsDays ?? 0);
    if (!due) return "";
    const now = new Date();
    const msPerDay = 1000 * 60 * 60 * 24;
    const days = Math.ceil((due.getTime() - now.getTime()) / msPerDay);
    const when = days >= 0 ? `om ${days} dage` : `for ${Math.abs(days)} dage siden`;
    return `${due.toLocaleDateString("da-DK")} (${when})`;
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-16 bg-muted rounded" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søg fakturaer…"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrer efter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle statusser</SelectItem>
            <SelectItem value="draft">Kladde</SelectItem>
            <SelectItem value="approved">Godkendt</SelectItem>
            <SelectItem value="sent">Afsendt</SelectItem>
            <SelectItem value="paid">Betalt</SelectItem>
            <SelectItem value="overdue">Forfalden</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2"
          title="Synkroniser fakturaer fra Billy"
        >
          {isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {isFetching ? "Synkroniserer…" : "Synkroniser"}
        </Button>
        {(searchInput || statusFilter !== "all") && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSearchInput("");
              setStatusFilter("all");
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Invoice List */}
      <div className="space-y-2" data-testid="invoice-list">
        {filteredInvoices.length > 0 ? (
          filteredInvoices.map((invoice: BillyInvoice) => {
            const badge = getStatusBadge(invoice.state);
            const StatusIcon = badge.icon;

            return (
              <Card
                key={invoice.id}
                className="group p-2.5 hover:bg-accent/50 transition-all duration-200 hover:scale-[1.01] hover:shadow-md cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">
                        {invoice.invoiceNo
                          ? `Faktura #${invoice.invoiceNo}`
                          : `Kladde ${invoice.id.slice(0, 8)}`}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Kunde: {invoice.contactId}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Dato: {new Date(invoice.entryDate).toLocaleDateString("da-DK")} • Forfalder: {formatDueInfo( invoice.entryDate, invoice.paymentTermsDays )}


                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={badge.variant} className="gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {badge.label}
                      </Badge>
                      {/* Quick actions - visible on hover */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          title="Open in Billy.dk"
                          onClick={e => {
                            e.stopPropagation();
                            window.open(
                              `https://app.billy.dk/invoices/${invoice.id}`,
                              "_blank"
                            );
                          }}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          title="Download CSV"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              exportToCSV(invoice, "");
                              toast.success("CSV exported successfully");
                            } catch (error) {
                              console.error("CSV export failed:", error);
                              toast.error("Failed to export CSV. Please try again.");
                            }
                          }}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAnalyzeInvoice(invoice)}
                      disabled={analyzingInvoice}
                      aria-busy={analyzingInvoice && selectedInvoice?.id === invoice.id}
                      className="gap-1"
                    >
                      {analyzingInvoice && selectedInvoice?.id === invoice.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      {analyzingInvoice && selectedInvoice?.id === invoice.id
                        ? "Analyserer…"
                        : "Analyser"}
                    </Button>
                  </div>
                </div>
                {invoice.lines && invoice.lines.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                    {invoice.lines.length} line
                    {invoice.lines.length !== 1 ? "s" : ""}
                  </div>
                )}
              </Card>
            );
          })
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <FileText className="w-16 h-16 opacity-20" />
                <Search className="w-6 h-6 absolute -bottom-1 -right-1 opacity-40" />
              </div>
            </div>
            <p className="font-semibold text-base mb-2">
              {searchInput || statusFilter !== "all"
                ? "No invoices match your filters"
                : "No invoices yet"}
            </p>
            <p className="text-sm mb-4">
              {searchInput || statusFilter !== "all"
                ? "Try adjusting your search or filters to find what you're looking for"
                : "Your invoices from Billy.dk will automatically appear here"}
            </p>
            {!(searchInput || statusFilter !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Sync from Billy
              </Button>
            )}
          </div>
        )}
      </div>

      {/* AI Analysis Dialog */}
      <Dialog
        open={!!selectedInvoice}
        onOpenChange={open => !open && setSelectedInvoice(null)}
      >
        <DialogContent className="w-full sm:max-w-[800px] max-h-[85vh] flex flex-col">
          <div className="flex-1 overflow-y-auto smooth-scroll pr-2">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Invoice Analysis
              </DialogTitle>
              <DialogDescription>
                {selectedInvoice && (
                  <>
                    Invoice{" "}
                    {selectedInvoice.invoiceNo ||
                      selectedInvoice.id.slice(0, 8)}{" "}
                    • {selectedInvoice.contactId}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              {analyzingInvoice ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                    <span className="text-sm text-muted-foreground">
                      Analyzing invoice with AI...
                    </span>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-[95%]" />
                  <Skeleton className="h-4 w-[90%]" />
                  <Skeleton className="h-4 w-[97%]" />
                  <Skeleton className="h-4 w-[85%]" />
                </div>
              ) : aiAnalysis ? (
                <>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <SafeStreamdown content={aiAnalysis} />
                  </div>
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Was this analysis helpful?
                        </span>
                        <Button
                          variant={
                            feedbackGiven === "up" ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => handleFeedback("up")}
                          className="gap-1"
                        >
                          <ThumbsUp className="h-4 w-4" />
                          {feedbackGiven === "up" && "Thanks!"}
                        </Button>
                        <Button
                          variant={
                            feedbackGiven === "down" ? "destructive" : "outline"
                          }
                          size="sm"
                          onClick={() => handleFeedback("down")}
                          className="gap-1"
                        >
                          <ThumbsDown className="h-4 w-4" />
                          {feedbackGiven === "down" && "Noted"}
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            exportToCSV(selectedInvoice!, aiAnalysis);
                            toast.success("CSV exported successfully");
                          } catch (error) {
                            console.error("CSV export failed:", error);
                            toast.error("Failed to export CSV. Please try again.");
                          }
                        }}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Export to CSV
                      </Button>
                    </div>

                    {/* Feedback Comment Input */}
                    {showCommentInput && (
                      <div className="space-y-2">
                        <Input
                          placeholder="Tell us what could be improved... (optional)"
                          value={feedbackComment}
                          onChange={e => setFeedbackComment(e.target.value)}
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={submitFeedbackWithComment}>
                            Submit Feedback
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setShowCommentInput(false);
                              setFeedbackComment("");
                            }}
                          >
                            Skip
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Click "Analyser" to get AI insights about this invoice
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}






