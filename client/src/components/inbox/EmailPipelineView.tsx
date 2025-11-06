import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, CheckCircle2, DollarSign, Mail, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import EmailPreviewModal from "./EmailPreviewModal";

type PipelineStage =
  | "needs_action"
  | "venter_pa_svar"
  | "i_kalender"
  | "finance"
  | "afsluttet";

interface PipelineColumn {
  id: PipelineStage;
  title: string;
  color: string;
  icon: React.ReactNode;
}

const columns: PipelineColumn[] = [
  {
    id: "needs_action",
    title: "Needs Action",
    color: "bg-red-500",
    icon: <Mail className="w-4 h-4" />,
  },
  {
    id: "venter_pa_svar",
    title: "Venter på svar",
    color: "bg-orange-500",
    icon: <Send className="w-4 h-4" />,
  },
  {
    id: "i_kalender",
    title: "I kalender",
    color: "bg-green-500",
    icon: <Calendar className="w-4 h-4" />,
  },
  {
    id: "finance",
    title: "Finance",
    color: "bg-blue-500",
    icon: <DollarSign className="w-4 h-4" />,
  },
  {
    id: "afsluttet",
    title: "Afsluttet",
    color: "bg-gray-500",
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
];

interface EmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  internalDate?: number;
  body: string;
  snippet: string;
  unread: boolean;
  labels: string[];
  hasAttachment: boolean;
  sender: string;
}

interface PipelineEmailCardProps {
  email: EmailMessage;
  stage: PipelineStage;
  onQuickAction: (action: string, emailId: string) => void;
  onClick: () => void;
  onHover?: () => void;
}

function PipelineEmailCard({
  email,
  stage,
  onQuickAction,
  onClick,
  onHover,
}: PipelineEmailCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: email.threadId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getQuickActions = () => {
    switch (stage) {
      case "needs_action":
        return [
          { label: "Send Tilbud", action: "send_tilbud", color: "bg-blue-500" },
        ];
      case "venter_pa_svar":
        return [
          {
            label: "Bekræft Booking",
            action: "bekraeft_booking",
            color: "bg-green-500",
          },
        ];
      case "i_kalender":
        return [
          {
            label: "Send Faktura",
            action: "send_faktura",
            color: "bg-purple-500",
          },
        ];
      case "finance":
        return [{ label: "Afslut", action: "afslut", color: "bg-gray-500" }];
      default:
        return [];
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-3 mb-2 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
        isDragging ? "ring-2 ring-primary" : ""
      }`}
      onClick={onClick}
      onMouseEnter={onHover}
    >
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {email.subject || "No Subject"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {email.from || email.sender}
            </p>
          </div>
          {email.unread && (
            <Badge variant="destructive" className="text-xs">
              Nyt
            </Badge>
          )}
        </div>

        {/* Snippet */}
        <p className="text-xs text-muted-foreground line-clamp-2">
          {email.snippet}
        </p>

        {/* Labels */}
        {email.labels && email.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {email.labels.slice(0, 3).map(label => (
              <Badge key={label} variant="outline" className="text-xs">
                {label}
              </Badge>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-1 pt-1 border-t">
          {getQuickActions().map(({ label, action, color }) => (
            <Button
              key={action}
              size="sm"
              variant="ghost"
              className={`text-xs h-7 ${color} hover:${color}/90 text-white`}
              onClick={e => {
                e.stopPropagation();
                onQuickAction(action, email.threadId);
              }}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Time */}
        <div className="text-xs text-muted-foreground">
          {new Date(email.internalDate || email.date).toLocaleString("da-DK", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </Card>
  );
}

interface PipelineColumnProps {
  column: PipelineColumn;
  emails: EmailMessage[];
  onQuickAction: (action: string, emailId: string) => void;
  onEmailClick: (email: EmailMessage) => void;
  onEmailHover?: (email: EmailMessage) => void;
}

function PipelineColumnComponent({
  column,
  emails,
  onQuickAction,
  onEmailClick,
  onEmailHover,
}: PipelineColumnProps) {
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div className="flex flex-col h-full min-w-[280px]">
      {/* Column Header */}
      <div
        className={`${column.color} text-white p-3 rounded-t-lg flex items-center gap-2`}
      >
        {column.icon}
        <div className="flex-1">
          <h3 className="font-semibold">{column.title}</h3>
          <p className="text-xs opacity-90">{emails.length} emails</p>
        </div>
      </div>

      {/* Column Content */}
      <div
        ref={setDroppableRef}
        className={`flex-1 bg-muted/30 p-3 rounded-b-lg overflow-y-auto border-l border-r border-b transition-colors ${
          isOver ? "bg-primary/10 ring-2 ring-primary" : ""
        }`}
        data-stage={column.id}
      >
        <SortableContext
          items={emails.map(e => e.threadId)}
          strategy={verticalListSortingStrategy}
        >
          {emails.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              Ingen emails
            </div>
          ) : (
            emails.map(email => (
              <PipelineEmailCard
                key={email.threadId}
                email={email}
                stage={column.id}
                onQuickAction={onQuickAction}
                onClick={() => onEmailClick(email)}
                onHover={onEmailHover ? () => onEmailHover(email) : undefined}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

interface EmailPipelineViewProps {
  emails: EmailMessage[];
  onEmailClick: (email: EmailMessage) => void;
  onEmailHover?: (email: EmailMessage) => void;
}

export default function EmailPipelineView({
  emails,
  onEmailClick,
  onEmailHover,
}: EmailPipelineViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pipelineState, setPipelineState] = useState<
    Record<string, PipelineStage>
  >({});
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewThreadId, setPreviewThreadId] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: pipelineStates } = trpc.inbox.email.getPipelineStates.useQuery(
    {}
  );

  const inferStageFromEmail = (email: EmailMessage): PipelineStage => {
    if (email.labels?.includes("Venter på svar")) {
      return "venter_pa_svar";
    }
    if (email.labels?.includes("I kalender")) {
      return "i_kalender";
    }
    if (email.labels?.includes("Finance")) {
      return "finance";
    }
    if (email.labels?.includes("Afsluttet")) {
      return "afsluttet";
    }
    return "needs_action";
  };

  useEffect(() => {
    if (!pipelineStates) {
      return;
    }
    const next: Record<string, PipelineStage> = {};
    pipelineStates.forEach(state => {
      next[state.threadId] = state.stage as PipelineStage;
    });
    setPipelineState(prev => ({ ...prev, ...next }));
  }, [pipelineStates]);
  const updatePipelineMutation =
    trpc.inbox.email.updatePipelineStage.useMutation({
      onSuccess: () => {
        utils.inbox.email.list.invalidate();
        utils.inbox.email.getPipelineStates.invalidate();
      },
    });

  // Ensure local state contains entries for all loaded emails
  useEffect(() => {
    setPipelineState(prev => {
      const next = { ...prev };
      emails.forEach(email => {
        if (!next[email.threadId]) {
          next[email.threadId] = inferStageFromEmail(email);
        }
      });
      return next;
    });
  }, [emails]);

  const getStageTitle = (stage: PipelineStage) =>
    columns.find(column => column.id === stage)?.title ?? stage;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const emailId = active.id as string;
    const targetColumnId = over.id as PipelineStage;

    // Update pipeline state optimistically
    setPipelineState(prev => ({
      ...prev,
      [emailId]: targetColumnId,
    }));

    // Call backend endpoint to update pipeline stage
    updatePipelineMutation.mutate({
      threadId: emailId,
      stage: targetColumnId,
      triggeredBy: "user",
    });

    toast.success(`Email flyttet til ${getStageTitle(targetColumnId)}`);
  };

  const handleQuickAction = async (action: string, emailId: string) => {
    let newStage: PipelineStage | null = null;

    switch (action) {
      case "send_tilbud":
        // Remove "Needs Action", Add "Venter på svar"
        newStage = "venter_pa_svar";
        break;
      case "bekraeft_booking":
        // Remove "Venter på svar", Add "I kalender"
        newStage = "i_kalender";
        break;
      case "send_faktura":
        // Remove "I kalender", Add "Finance"
        newStage = "finance";
        break;
      case "afslut":
        // Move to completed state
        newStage = "afsluttet";
        break;
    }

    if (newStage) {
      // Update optimistically
      setPipelineState(prev => ({
        ...prev,
        [emailId]: newStage!,
      }));

      // Call backend
      updatePipelineMutation.mutate({
        threadId: emailId,
        stage: newStage,
        triggeredBy: "quick_action",
      });

      toast.success(`Email flyttet til '${getStageTitle(newStage)}'`);
    }
  };

  // Group emails by pipeline stage
  const emailsByStage = columns.reduce(
    (acc, column) => {
      acc[column.id] = emails.filter(email => {
        const stage =
          pipelineState[email.threadId] ?? inferStageFromEmail(email);
        return stage === column.id;
      });
      return acc;
    },
    {} as Record<PipelineStage, EmailMessage[]>
  );

  const activeEmail = activeId
    ? emails.find(e => e.threadId === activeId)
    : null;

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 h-full overflow-x-auto pb-4">
          {columns.map(column => (
            <PipelineColumnComponent
              key={column.id}
              column={column}
              emails={emailsByStage[column.id] || []}
              onQuickAction={handleQuickAction}
              onEmailClick={email => {
                setPreviewThreadId(email.threadId);
                setPreviewModalOpen(true);
                onEmailClick(email);
              }}
              onEmailHover={onEmailHover}
            />
          ))}
        </div>

        <DragOverlay>
          {activeEmail ? (
            <Card className="p-3 w-[280px] opacity-90 rotate-3">
              <p className="text-sm font-medium truncate">
                {activeEmail.subject}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {activeEmail.from}
              </p>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Email Preview Modal */}
      {previewThreadId && (
        <EmailPreviewModal
          open={previewModalOpen}
          onOpenChange={setPreviewModalOpen}
          threadId={previewThreadId}
          onReply={() => {}}
          onForward={() => {}}
          onOpenFull={() => {
            // Navigate to full thread view
            setPreviewModalOpen(false);
          }}
        />
      )}
    </>
  );
}
