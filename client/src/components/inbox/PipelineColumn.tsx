/**
 * PipelineColumn Component - Kanban column for pipeline board
 *
 * Features:
 * - Header with stage name + email count
 * - Droppable area for EmailCard components
 * - Empty state when no emails
 * - Scrollable content area
 * - Visual feedback for drag-over state
 */

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Card } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "@/lib/utils";
import { EmailCard, type EmailCardData } from "./EmailCard";
import { Badge } from "../ui/badge";
import { Inbox } from "lucide-react";

export type PipelineStage =
  | "needs_action"
  | "venter_pa_svar"
  | "i_kalender"
  | "finance"
  | "afsluttet";

interface PipelineColumnProps {
  stage: PipelineStage;
  title: string;
  emails: EmailCardData[];
  onEmailClick?: (email: EmailCardData) => void;
}

// Stage colors
const STAGE_COLORS: Record<PipelineStage, string> = {
  needs_action: "bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-700",
  venter_pa_svar: "bg-yellow-100 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700",
  i_kalender: "bg-blue-100 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700",
  finance: "bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-700",
  afsluttet: "bg-gray-100 dark:bg-gray-900/20 border-gray-300 dark:border-gray-700",
};

const STAGE_TEXT_COLORS: Record<PipelineStage, string> = {
  needs_action: "text-red-900 dark:text-red-300",
  venter_pa_svar: "text-yellow-900 dark:text-yellow-300",
  i_kalender: "text-blue-900 dark:text-blue-300",
  finance: "text-green-900 dark:text-green-300",
  afsluttet: "text-gray-900 dark:text-gray-300",
};

export function PipelineColumn({
  stage,
  title,
  emails,
  onEmailClick,
}: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  });

  const threadIds = emails.map((email) => email.threadId);

  return (
    <Card
      className={cn(
        "flex flex-col h-full transition-all",
        isOver && "ring-2 ring-primary"
      )}
    >
      {/* Column Header */}
      <div className={cn(
        "p-4 border-b-2 rounded-t-lg",
        STAGE_COLORS[stage]
      )}>
        <div className="flex items-center justify-between">
          <h3 className={cn(
            "font-semibold text-sm",
            STAGE_TEXT_COLORS[stage]
          )}>
            {title}
          </h3>
          <Badge
            variant="secondary"
            className={cn(
              "h-6 min-w-[24px] justify-center",
              STAGE_TEXT_COLORS[stage]
            )}
          >
            {emails.length}
          </Badge>
        </div>
      </div>

      {/* Droppable Email List */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 p-3 transition-colors",
          isOver && "bg-accent/50"
        )}
      >
        <SortableContext items={threadIds} strategy={verticalListSortingStrategy}>
          <ScrollArea className="h-full">
            <div className="space-y-2">
              {emails.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground">
                  <Inbox className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">Ingen emails</p>
                  <p className="text-xs">Træk emails hertil</p>
                </div>
              ) : (
                emails.map((email) => (
                  <EmailCard
                    key={email.threadId}
                    email={email}
                    onClick={onEmailClick}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </SortableContext>
      </div>
    </Card>
  );
}
