/**
 * EmailPipelineBoard Component - Shortwave-inspired Kanban pipeline board
 *
 * Features:
 * - 5 columns for pipeline stages
 * - Drag-and-drop emails between stages
 * - Real-time updates via tRPC subscriptions
 * - Email preview on click
 * - Visual feedback during drag operations
 *
 * Stages:
 * 1. Needs Action (red) - New leads requiring immediate response
 * 2. Venter på svar (yellow) - Awaiting customer reply
 * 3. I kalender (blue) - Booking scheduled
 * 4. Finance (green) - Ready for invoicing
 * 5. Afsluttet (gray) - Completed/Archived
 */

import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { PipelineColumn, type PipelineStage } from "./PipelineColumn";
import { EmailCard, type EmailCardData } from "./EmailCard";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// Pipeline stage configuration
const PIPELINE_STAGES: Array<{ stage: PipelineStage; title: string }> = [
  { stage: "needs_action", title: "Needs Action" },
  { stage: "venter_pa_svar", title: "Venter på svar" },
  { stage: "i_kalender", title: "I kalender" },
  { stage: "finance", title: "Finance" },
  { stage: "afsluttet", title: "Afsluttet" },
];

interface EmailPipelineBoardProps {
  onEmailClick?: (email: EmailCardData) => void;
}

export function EmailPipelineBoard({ onEmailClick }: EmailPipelineBoardProps) {
  const [activeEmail, setActiveEmail] = useState<EmailCardData | null>(null);

  // Fetch pipeline data - grouped by stage
  const { data: pipelineData, isLoading } = trpc.inbox.pipeline.getAll.useQuery() as {
    data: Record<PipelineStage, EmailCardData[]> | undefined;
    isLoading: boolean;
  };

  // Mutation for updating pipeline stage
  const updateStageMutation = trpc.inbox.pipeline.updateStage.useMutation({
    onSuccess: (_data: any, variables: { threadId: string; newStage: PipelineStage }) => {
      toast.success(`Email flyttet til "${PIPELINE_STAGES.find(s => s.stage === variables.newStage)?.title}"`);
    },
    onError: (error: any) => {
      toast.error(`Kunne ikke flytte email: ${error.message}`);
    },
  });

  // Setup drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group emails by stage
  const emailsByStage = useMemo(() => {
    if (!pipelineData) {
      return PIPELINE_STAGES.reduce((acc, { stage }) => {
        acc[stage] = [];
        return acc;
      }, {} as Record<PipelineStage, EmailCardData[]>);
    }

    return pipelineData;
  }, [pipelineData]);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const threadId = active.id as string;

    // Find the email being dragged
    const email = Object.values(emailsByStage)
      .flat()
      .find((e: EmailCardData) => e.threadId === threadId);

    if (email) {
      setActiveEmail(email);
    }
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveEmail(null);

    if (!over) return;

    const threadId = active.id as string;
    const newStage = over.id as PipelineStage;

    // Find current stage of the email
    const currentStage = Object.entries(emailsByStage).find(([, emails]) =>
      emails.some((e) => e.threadId === threadId)
    )?.[0] as PipelineStage | undefined;

    if (!currentStage || currentStage === newStage) return;

    // Update stage via tRPC
    updateStageMutation.mutate({
      threadId,
      newStage,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Indlæser pipeline...</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 h-[calc(100vh-12rem)]">
        {PIPELINE_STAGES.map(({ stage, title }) => (
          <PipelineColumn
            key={stage}
            stage={stage}
            title={title}
            emails={emailsByStage[stage] || []}
            onEmailClick={onEmailClick}
          />
        ))}
      </div>

      {/* Drag Overlay - Shows card while dragging */}
      <DragOverlay>
        {activeEmail ? (
          <div className="cursor-grabbing opacity-90">
            <EmailCard email={activeEmail} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
