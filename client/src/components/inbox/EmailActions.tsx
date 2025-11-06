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
    onMutate: () => {
      toast.loading("Arkiverer email...", { id: "archive" });
    },
    onSuccess: async () => {
      toast.success("Email arkiveret!", { id: "archive" });
      setShowArchiveConfirm(false);
      // Close thread first
      onArchive?.();

      // Force immediate refetch - now fetches from Gmail API directly (not database cache)
      // since query includes "in:inbox" filter
      await utils.inbox.email.list.refetch();
    },
    onError: error => {
      toast.error(`Fejl ved arkivering: ${error.message}`, { id: "archive" });
    },
  });

  const deleteMutation = trpc.inbox.email.delete.useMutation({
    onMutate: () => {
      toast.loading("Sletter email...", { id: "delete" });
    },
    onSuccess: async () => {
      toast.success("Email slettet!", { id: "delete" });
      setShowDeleteConfirm(false);
      // Close thread first
      onDelete?.();

      // Force immediate refetch - now fetches from Gmail API directly
      await utils.inbox.email.list.refetch();
    },
    onError: error => {
      toast.error(`Fejl ved sletning: ${error.message}`, { id: "delete" });
    },
  });

  const addLabelMutation = trpc.inbox.email.addLabel.useMutation({
    onMutate: () => {
      toast.loading("Tilføjer label...", { id: "add-label" });
    },
    onSuccess: async () => {
      toast.success("Label tilføjet!", { id: "add-label" });
      onLabelChange?.();
      // Force immediate refetch to update list and thread
      await Promise.all([
        utils.inbox.email.getThread.refetch({ threadId }),
        utils.inbox.email.list.refetch(),
      ]);
    },
    onError: error => {
      toast.error(`Fejl ved tilføjelse af label: ${error.message}`, {
        id: "add-label",
      });
    },
  });

  const removeLabelMutation = trpc.inbox.email.removeLabel.useMutation({
    onMutate: () => {
      toast.loading("Fjerner label...", { id: "remove-label" });
    },
    onSuccess: async () => {
      toast.success("Label fjernet!", { id: "remove-label" });
      onLabelChange?.();
      // Force immediate refetch to update list and thread
      await Promise.all([
        utils.inbox.email.getThread.refetch({ threadId }),
        utils.inbox.email.list.refetch(),
      ]);
    },
    onError: error => {
      toast.error(`Fejl ved fjernelse af label: ${error.message}`, {
        id: "remove-label",
      });
    },
  });

  const starMutation = trpc.inbox.email.star.useMutation({
    onMutate: () => {
      toast.loading("Tilføjer stjerne...", { id: "star" });
    },
    onSuccess: async () => {
      toast.success("Email markeret med stjerne!", { id: "star" });
      // Force immediate refetch to update list and thread
      await Promise.all([
        utils.inbox.email.getThread.refetch({ threadId }),
        utils.inbox.email.list.refetch(),
      ]);
    },
    onError: error => {
      toast.error(`Fejl: ${error.message}`, { id: "star" });
    },
  });

  const unstarMutation = trpc.inbox.email.unstar.useMutation({
    onMutate: () => {
      toast.loading("Fjerner stjerne...", { id: "unstar" });
    },
    onSuccess: async () => {
      toast.success("Stjerne fjernet!", { id: "unstar" });
      // Force immediate refetch to update list and thread
      await Promise.all([
        utils.inbox.email.getThread.refetch({ threadId }),
        utils.inbox.email.list.refetch(),
      ]);
    },
    onError: error => {
      toast.error(`Fejl: ${error.message}`, { id: "unstar" });
    },
  });

  const markAsReadMutation = trpc.inbox.email.markAsRead.useMutation({
    onMutate: () => {
      toast.loading("Markerer som læst...", { id: "mark-read" });
    },
    onSuccess: async () => {
      toast.success("Markeret som læst!", { id: "mark-read" });
      // Force immediate refetch to update list and thread
      await Promise.all([
        utils.inbox.email.getThread.refetch({ threadId }),
        utils.inbox.email.list.refetch(),
      ]);
    },
    onError: error => {
      toast.error(`Fejl: ${error.message}`, { id: "mark-read" });
    },
  });

  const markAsUnreadMutation = trpc.inbox.email.markAsUnread.useMutation({
    onMutate: () => {
      toast.loading("Markerer som ulæst...", { id: "mark-unread" });
    },
    onSuccess: async () => {
      toast.success("Markeret som ulæst!", { id: "mark-unread" });
      // Force immediate refetch to update list and thread
      await Promise.all([
        utils.inbox.email.getThread.refetch({ threadId }),
        utils.inbox.email.list.refetch(),
      ]);
    },
    onError: error => {
      toast.error(`Fejl: ${error.message}`, { id: "mark-unread" });
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

  const isAnyMutationLoading =
    archiveMutation.isPending ||
    deleteMutation.isPending ||
    addLabelMutation.isPending ||
    removeLabelMutation.isPending ||
    starMutation.isPending ||
    unstarMutation.isPending ||
    markAsReadMutation.isPending ||
    markAsUnreadMutation.isPending;

  return (
    <div className="flex items-center gap-1">
      {/* Quick Actions */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          onReply?.(message);
          toast.info("Åbner svar...");
        }}
        disabled={isAnyMutationLoading}
        title="Svar"
      >
        <Reply className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          onForward?.(message);
          toast.info("Åbner videresendelse...");
        }}
        disabled={isAnyMutationLoading}
        title="Videresend"
      >
        <Forward className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowArchiveConfirm(true)}
        disabled={isAnyMutationLoading}
        title="Arkivér"
      >
        <Archive className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowDeleteConfirm(true)}
        disabled={isAnyMutationLoading}
        title="Slet"
      >
        <Trash2 className="w-4 h-4" />
      </Button>

      {/* More Actions Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            title="Flere handlinger"
            disabled={isAnyMutationLoading}
          >
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
            disabled={isAnyMutationLoading}
          >
            <Star className="w-4 h-4 mr-2" />
            {starMutation.isPending ? "Markerer..." : "Marker med stjerne"}
          </DropdownMenuItem>

          {/* Mark as Read/Unread */}
          <DropdownMenuItem
            onClick={() => {
              markAsReadMutation.mutate({ messageId: message.id });
            }}
            disabled={isAnyMutationLoading}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {markAsReadMutation.isPending ? "Markerer..." : "Marker som læst"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              markAsUnreadMutation.mutate({ messageId: message.id });
            }}
            disabled={isAnyMutationLoading}
          >
            <Circle className="w-4 h-4 mr-2" />
            {markAsUnreadMutation.isPending
              ? "Markerer..."
              : "Marker som ulæst"}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Labels */}
          <DropdownMenuLabel>
            {addLabelMutation.isPending ? "Tilføjer label..." : "Labels"}
          </DropdownMenuLabel>
          {standardLabels.map(label => (
            <DropdownMenuItem
              key={label.id}
              onClick={() => handleAddLabel(label.name)}
              disabled={isAnyMutationLoading}
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
