/**
 * EmailCard Component - Compact email card for pipeline board
 *
 * Used in EmailPipelineBoard to display emails in Kanban columns
 * Features:
 * - Compact design with avatar, subject, from
 * - Badge for unread status
 * - Preview of email body (truncated)
 * - Time indicator
 * - Draggable via @dnd-kit
 */

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { cn } from "@/lib/utils";
import { Mail, Star } from "lucide-react";

export interface EmailCardData {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  fromEmail: string;
  snippet: string;
  isUnread: boolean;
  isStarred: boolean;
  timestamp: string; // ISO 8601
  labels?: string[];
}

interface EmailCardProps {
  email: EmailCardData;
  onClick?: (email: EmailCardData) => void;
}

export function EmailCard({ email, onClick }: EmailCardProps) {
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
  };

  // Format timestamp to relative time
  const getRelativeTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return diffInMinutes < 1 ? "Nu" : `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${diffInHours}t`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d`;
    } else {
      return date.toLocaleDateString("da-DK", {
        day: "numeric",
        month: "short",
      });
    }
  };

  // Get initials from name
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isDragging && "opacity-50 cursor-grabbing shadow-lg",
        email.isUnread && "border-l-4 border-l-primary"
      )}
      onClick={() => onClick?.(email)}
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-3 space-y-2">
        {/* Header: Avatar + From + Time */}
        <div className="flex items-start gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {getInitials(email.from)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium truncate">
                {email.from}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                {getRelativeTime(email.timestamp)}
              </span>
            </div>
            <span className="text-xs text-muted-foreground truncate block">
              {email.fromEmail}
            </span>
          </div>
        </div>

        {/* Subject */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4
              className={cn(
                "text-sm line-clamp-1",
                email.isUnread && "font-semibold"
              )}
            >
              {email.subject || "(Ingen emne)"}
            </h4>
            {email.isStarred && (
              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 shrink-0" />
            )}
          </div>

          {/* Snippet */}
          <p className="text-xs text-muted-foreground line-clamp-2">
            {email.snippet}
          </p>
        </div>

        {/* Footer: Badges */}
        {(email.isUnread || email.labels) && (
          <div className="flex items-center gap-2 flex-wrap">
            {email.isUnread && (
              <Badge variant="default" className="h-5 text-xs">
                <Mail className="h-3 w-3 mr-1" />
                Ny
              </Badge>
            )}
            {email.labels?.slice(0, 2).map((label) => (
              <Badge
                key={label}
                variant="outline"
                className="h-5 text-xs"
              >
                {label}
              </Badge>
            ))}
            {email.labels && email.labels.length > 2 && (
              <span className="text-xs text-muted-foreground">
                +{email.labels.length - 2}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
