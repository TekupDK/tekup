import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import {
  Archive,
  CheckCircle2,
  Circle,
  Forward,
  MoreVertical,
  Reply,
  Star,
  Tag,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import EmailConfirmationDialog from "./EmailConfirmationDialog";

interface EmailActionsProps {
  message: {
    id: string;
    threadId: string;
    from?: string;
    to?: string;
    subject?: string;
    body?: string;
  };
  threadId: string;
  onReply?: (message: any) => void;
  onForward?: (message: any) => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onLabelChange?: () => void;
}

export default function EmailActions({
  message,
  threadId,
  onReply,
  onForward,
  onArchive,
  onDelete,
  onLabelChange,
}: EmailActionsProps) {
  const utils = trpc.useUtils();
  const { data: labels } = trpc.inbox.email.getLabels.useQuery();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  const archiveMutation = trpc.inbox.email.archive.useMutation({
    onSuccess: () => {
      toast.success("Email arkiveret!");
      utils.inbox.email.list.invalidate();
      onArchive?.();
    },
    onError: error => {
      toast.error(`Fejl ved arkivering: ${error.message}`);
    },
  });

  const deleteMutation = trpc.inbox.email.delete.useMutation({
    onSuccess: () => {
      toast.success("Email slettet!");
      utils.inbox.email.list.invalidate();
      onDelete?.();
    },
    onError: error => {
      toast.error(`Fejl ved sletning: ${error.message}`);
    },
  });

  const addLabelMutation = trpc.inbox.email.addLabel.useMutation({
    onSuccess: () => {
      toast.success("Label tilføjet!");
      utils.inbox.email.getThread.invalidate({ threadId });
      utils.inbox.email.list.invalidate();
      onLabelChange?.();
    },
    onError: error => {
      toast.error(`Fejl ved tilføjelse af label: ${error.message}`);
    },
  });

  const removeLabelMutation = trpc.inbox.email.removeLabel.useMutation({
    onSuccess: () => {
      toast.success("Label fjernet!");
      utils.inbox.email.getThread.invalidate({ threadId });
      utils.inbox.email.list.invalidate();
      onLabelChange?.();
    },
    onError: error => {
      toast.error(`Fejl ved fjernelse af label: ${error.message}`);
    },
  });

  const starMutation = trpc.inbox.email.star.useMutation({
    onSuccess: () => {
      toast.success("Email markeret med stjerne!");
      utils.inbox.email.getThread.invalidate({ threadId });
      utils.inbox.email.list.invalidate();
    },
    onError: error => {
      toast.error(`Fejl: ${error.message}`);
    },
  });

  const unstarMutation = trpc.inbox.email.unstar.useMutation({
    onSuccess: () => {
      toast.success("Stjerne fjernet!");
      utils.inbox.email.getThread.invalidate({ threadId });
      utils.inbox.email.list.invalidate();
    },
    onError: error => {
      toast.error(`Fejl: ${error.message}`);
    },
  });

  const markAsReadMutation = trpc.inbox.email.markAsRead.useMutation({
    onSuccess: () => {
      toast.success("Markeret som læst!");
      utils.inbox.email.getThread.invalidate({ threadId });
      utils.inbox.email.list.invalidate();
    },
    onError: error => {
      toast.error(`Fejl: ${error.message}`);
    },
  });

  const markAsUnreadMutation = trpc.inbox.email.markAsUnread.useMutation({
    onSuccess: () => {
      toast.success("Markeret som ulæst!");
      utils.inbox.email.getThread.invalidate({ threadId });
      utils.inbox.email.list.invalidate();
    },
    onError: error => {
      toast.error(`Fejl: ${error.message}`);
    },
  });

  const handleAddLabel = (labelName: string) => {
    addLabelMutation.mutate({ threadId, labelName });
  };

  const handleRemoveLabel = (labelName: string) => {
    removeLabelMutation.mutate({ threadId, labelName });
  };

  const standardLabels =
    labels?.filter(label =>
      [
        "Leads",
        "Needs Reply",
        "Venter på svar",
        "I kalender",
        "Finance",
        "Afsluttet",
      ].includes(label.name)
    ) || [];

  return (
    <div className="flex items-center gap-1">
      {/* Quick Actions */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onReply?.(message)}
        title="Svar"
      >
        <Reply className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onForward?.(message)}
        title="Videresend"
      >
        <Forward className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowArchiveConfirm(true)}
        title="Arkivér"
      >
        <Archive className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowDeleteConfirm(true)}
        title="Slet"
      >
        <Trash2 className="w-4 h-4" />
      </Button>

      {/* More Actions Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" title="Flere handlinger">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Handlinger</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Star/Unstar */}
          <DropdownMenuItem
            onClick={() => {
              // Toggle star - for simplicity, always star (you'd need to check current state)
              starMutation.mutate({ messageId: message.id });
            }}
          >
            <Star className="w-4 h-4 mr-2" />
            Marker med stjerne
          </DropdownMenuItem>

          {/* Mark as Read/Unread */}
          <DropdownMenuItem
            onClick={() => {
              markAsReadMutation.mutate({ messageId: message.id });
            }}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Marker som læst
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              markAsUnreadMutation.mutate({ messageId: message.id });
            }}
          >
            <Circle className="w-4 h-4 mr-2" />
            Marker som ulæst
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Labels */}
          <DropdownMenuLabel>Labels</DropdownMenuLabel>
          {standardLabels.map(label => (
            <DropdownMenuItem
              key={label.id}
              onClick={() => handleAddLabel(label.name)}
            >
              <Tag className="w-4 h-4 mr-2" />
              Tilføj "{label.name}"
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirmation Dialogs */}
      <EmailConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Slet email?"
        description="Er du sikker på, at du vil slette denne email? Denne handling kan ikke fortrydes."
        confirmLabel="Slet"
        cancelLabel="Annuller"
        onConfirm={() => deleteMutation.mutate({ threadId })}
        isLoading={deleteMutation.isPending}
        variant="destructive"
      />

      <EmailConfirmationDialog
        open={showArchiveConfirm}
        onOpenChange={setShowArchiveConfirm}
        title="Arkivér email?"
        description="Emailen vil blive flyttet til arkiv. Du kan stadig finde den i arkiv-mappen."
        confirmLabel="Arkivér"
        cancelLabel="Annuller"
        onConfirm={() => archiveMutation.mutate({ threadId })}
        isLoading={archiveMutation.isPending}
        variant="default"
      />
    </div>
  );
}
