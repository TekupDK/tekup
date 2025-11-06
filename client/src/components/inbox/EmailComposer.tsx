import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { FileText, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface EmailComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "compose" | "reply" | "forward";
  replyTo?: {
    threadId: string;
    messageId: string;
    to: string;
    subject: string;
    body: string;
  };
  forwardFrom?: {
    subject: string;
    body: string;
  };
}

export default function EmailComposer({
  open,
  onOpenChange,
  mode,
  replyTo,
  forwardFrom,
}: EmailComposerProps) {
  const [to, setTo] = useState(replyTo?.to || "");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState(
    mode === "reply"
      ? replyTo?.subject.startsWith("Re:")
        ? replyTo.subject
        : `Re: ${replyTo?.subject || ""}`
      : mode === "forward"
        ? forwardFrom?.subject.startsWith("Fwd:")
          ? forwardFrom.subject
          : `Fwd: ${forwardFrom?.subject || ""}`
        : ""
  );
  const [body, setBody] = useState(
    mode === "reply" && replyTo?.body
      ? `\n\n---\n${replyTo.body.substring(0, 200)}...`
      : mode === "forward" && forwardFrom?.body
        ? `\n\n--- Original Message ---\n${forwardFrom.body}`
        : ""
  );
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("none");

  // Initialize fields on open with current mode/payload, but avoid clobbering while editing
  const prevOpenRef = useRef<boolean>(open);
  useEffect(() => {
    // Run only on transition from closed -> open
    if (open && !prevOpenRef.current) {
      if (mode === "reply" && replyTo) {
        setTo(replyTo.to || "");
        const subj = replyTo.subject?.startsWith("Re:")
          ? replyTo.subject
          : `Re: ${replyTo.subject || ""}`;
        setSubject(subj);
        const preview = replyTo.body
          ? `\n\n---\n${replyTo.body.substring(0, 200)}...`
          : "";
        setBody(preview);
      } else if (mode === "forward" && forwardFrom) {
        setTo("");
        const subj = forwardFrom.subject?.startsWith("Fwd:")
          ? forwardFrom.subject
          : `Fwd: ${forwardFrom.subject || ""}`;
        setSubject(subj);
        setBody(`\n\n--- Original Message ---\n${forwardFrom.body || ""}`);
      } else {
        // compose
        setTo("");
        setSubject("");
        setBody("");
      }
      // Do not reset Cc/Bcc visibility here to preserve user's last preference during a session
      setSelectedTemplate("none");
    }
    prevOpenRef.current = open;
  }, [open, mode, replyTo, forwardFrom]);

  // Email templates
  const templates = [
    {
      id: "lead_response",
      name: "Lead Response",
      subject: "Tak for din henvendelse - Rengøring",
      body: `Hej {{customerName}},

Tak for din henvendelse vedrørende {{serviceType}}.

Vi vender tilbage til dig snarest med et tilbud.

Med venlig hilsen,
Rendetalje`,
    },
    {
      id: "quote_followup",
      name: "Quote Follow-up",
      subject: "Opfølgning på tilbud - {{serviceType}}",
      body: `Hej {{customerName}},

Vi håber du har haft mulighed for at gennemgå vores tilbud på {{serviceType}}.

Har du spørgsmål eller ønsker du at booke opgaven?

Med venlig hilsen,
Rendetalje`,
    },
    {
      id: "booking_confirmation",
      name: "Booking Confirmation",
      subject: "Booking bekræftet - {{serviceType}} {{date}}",
      body: `Hej {{customerName}},

Vi bekræfter din booking for {{serviceType}} den {{date}} kl. {{time}}.

Vi ser frem til at hjælpe dig!

Med venlig hilsen,
Rendetalje`,
    },
    {
      id: "payment_reminder",
      name: "Payment Reminder",
      subject: "Påmindelse - Betaling for {{serviceType}}",
      body: `Hej {{customerName}},

Dette er en påmindelse om betaling for {{serviceType}}.

Beløb: {{amount}} DKK
Forfaldsdato: {{dueDate}}

Venligst sørg for betaling snarest.

Med venlig hilsen,
Rendetalje`,
    },
  ];

  const applyTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId === "none") return;

    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    // Extract customer name from 'to' field or use placeholder
    const customerName = to.split("@")[0] || "{{customerName}}";
    const date = new Date().toLocaleDateString("da-DK");
    const time = new Date().toLocaleTimeString("da-DK", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Replace template variables
    let templateBody = template.body;
    let templateSubject = template.subject;

    // Simple variable replacement (could be enhanced with proper parsing)
    templateBody = templateBody
      .replace(/\{\{customerName\}\}/g, customerName)
      .replace(/\{\{serviceType\}\}/g, "rengøring")
      .replace(/\{\{date\}\}/g, date)
      .replace(/\{\{time\}\}/g, time)
      .replace(/\{\{amount\}\}/g, "349")
      .replace(/\{\{dueDate\}\}/g, date);

    templateSubject = templateSubject
      .replace(/\{\{customerName\}\}/g, customerName)
      .replace(/\{\{serviceType\}\}/g, "rengøring")
      .replace(/\{\{date\}\}/g, date)
      .replace(/\{\{time\}\}/g, time);

    setBody(templateBody);
    if (!subject || mode === "compose") {
      setSubject(templateSubject);
    }
    setSelectedTemplate(templateId);
  };

  const utils = trpc.useUtils();

  const sendMutation = trpc.inbox.email.send.useMutation({
    onSuccess: () => {
      toast.success("Email sendt!");
      utils.inbox.email.list.invalidate();
      onOpenChange(false);
      resetForm();
    },
    onError: error => {
      toast.error(`Fejl ved afsendelse: ${error.message}`);
    },
  });

  const replyMutation = trpc.inbox.email.reply.useMutation({
    onSuccess: () => {
      toast.success("Svar sendt!");
      utils.inbox.email.list.invalidate();
      utils.inbox.email.getThread.invalidate({ threadId: replyTo?.threadId });
      onOpenChange(false);
      resetForm();
    },
    onError: error => {
      toast.error(`Fejl ved afsendelse: ${error.message}`);
    },
  });

  const forwardMutation = trpc.inbox.email.forward.useMutation({
    onSuccess: () => {
      toast.success("Email videresendt!");
      utils.inbox.email.list.invalidate();
      onOpenChange(false);
      resetForm();
    },
    onError: error => {
      toast.error(`Fejl ved videresendelse: ${error.message}`);
    },
  });

  const resetForm = () => {
    setTo("");
    setCc("");
    setBcc("");
    setSubject("");
    setBody("");
    setShowCcBcc(false);
  };

  const handleSend = () => {
    if (!to.trim()) {
      toast.error("Til-feltet er påkrævet");
      return;
    }

    if (mode === "reply" && replyTo) {
      replyMutation.mutate({
        threadId: replyTo.threadId,
        messageId: replyTo.messageId,
        to: to.trim(),
        subject: subject.trim(),
        body: body.trim(),
        cc: cc.trim() || undefined,
        bcc: bcc.trim() || undefined,
      });
    } else if (mode === "forward") {
      forwardMutation.mutate({
        to: to.trim(),
        subject: subject.trim(),
        body: body.trim(),
        cc: cc.trim() || undefined,
        bcc: bcc.trim() || undefined,
      });
    } else {
      sendMutation.mutate({
        to: to.trim(),
        subject: subject.trim(),
        body: body.trim(),
        cc: cc.trim() || undefined,
        bcc: bcc.trim() || undefined,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[75vw] max-h-[85vh] overflow-hidden flex flex-col p-4"
        data-testid="email-composer"
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {mode === "reply"
              ? "Svar på email"
              : mode === "forward"
                ? "Videresend email"
                : "Ny email"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {mode === "reply"
              ? "Skriv dit svar nedenfor"
              : mode === "forward"
                ? "Videresend denne email"
                : "Opret og send en ny email"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-4 mt-4 pr-2">
          {/* To */}
          <div className="space-y-2">
            <Label htmlFor="to" className="text-sm font-medium">
              Til *
            </Label>
            <Input
              id="to"
              value={to}
              onChange={e => setTo(e.target.value)}
              placeholder="email@example.com"
              disabled={mode === "reply"}
            />
          </div>

          {/* Cc/Bcc toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={e => {
                e.stopPropagation();
                setShowCcBcc(!showCcBcc);
              }}
            >
              {showCcBcc ? "Skjul" : "Vis"} Cc/Bcc
            </Button>
          </div>

          {/* Cc */}
          {showCcBcc && (
            <div className="space-y-2">
              <Label htmlFor="cc" className="text-sm font-medium">
                Cc
              </Label>
              <Input
                id="cc"
                value={cc}
                onChange={e => setCc(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
          )}

          {/* Bcc */}
          {showCcBcc && (
            <div className="space-y-2">
              <Label htmlFor="bcc" className="text-sm font-medium">
                Bcc
              </Label>
              <Input
                id="bcc"
                value={bcc}
                onChange={e => setBcc(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
          )}

          {/* Email Template Selector (only for compose mode) */}
          {mode === "compose" && (
            <div className="space-y-2">
              <Label htmlFor="template" className="text-sm font-medium">
                Template
              </Label>
              <Select value={selectedTemplate} onValueChange={applyTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Vælg template (valgfrit)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ingen template</SelectItem>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {template.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-sm font-medium">
              Emne
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Email emne"
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label htmlFor="body" className="text-sm font-medium">
              Besked *
            </Label>
            <Textarea
              id="body"
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Skriv din besked her..."
              rows={10}
              className="font-mono text-sm resize-none"
            />
          </div>
        </div>

        {/* Actions - Fixed at bottom */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t shrink-0 bg-background">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={
              sendMutation.isPending ||
              replyMutation.isPending ||
              forwardMutation.isPending
            }
          >
            Annuller
          </Button>
          <Button
            onClick={handleSend}
            disabled={
              sendMutation.isPending ||
              replyMutation.isPending ||
              forwardMutation.isPending ||
              !to.trim() ||
              !body.trim()
            }
          >
            <Send className="w-4 h-4 mr-2" />
            {sendMutation.isPending ||
            replyMutation.isPending ||
            forwardMutation.isPending
              ? "Sender..."
              : "Send"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
