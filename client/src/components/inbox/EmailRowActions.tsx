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
  MoreVertical,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface EmailRowActionsProps {
  email: {
    id: string; // messageId (used for read/unread/star)
    threadId: string; // threadId (used for archive/delete)
  };
}

export default function EmailRowActions({ email }: EmailRowActionsProps) {
  const utils = trpc.useUtils();

  const archiveMutation = trpc.inbox.email.archive.useMutation({
    onMutate: () =>
      toast.loading("Arkiverer...", { id: `archive-${email.threadId}` }),
    onSuccess: async () => {
      toast.success("Arkiveret", { id: `archive-${email.threadId}` });
      await utils.inbox.email.list.refetch();
    },
    onError: err =>
      toast.error(`Kunne ikke arkivere: ${err.message}`, {
        id: `archive-${email.threadId}`,
      }),
  });

  const deleteMutation = trpc.inbox.email.delete.useMutation({
    onMutate: () =>
      toast.loading("Sletter...", { id: `delete-${email.threadId}` }),
    onSuccess: async () => {
      toast.success("Flyttet til papirkurv", {
        id: `delete-${email.threadId}`,
      });
      await utils.inbox.email.list.refetch();
    },
    onError: err =>
      toast.error(`Kunne ikke slette: ${err.message}`, {
        id: `delete-${email.threadId}`,
      }),
  });

  const markAsReadMutation = trpc.inbox.email.markAsRead.useMutation({
    onSuccess: async () => {
      toast.success("Markeret som læst");
      await utils.inbox.email.list.refetch();
    },
    onError: err => toast.error(`Fejl: ${err.message}`),
  });

  const markAsUnreadMutation = trpc.inbox.email.markAsUnread.useMutation({
    onSuccess: async () => {
      toast.success("Markeret som ulæst");
      await utils.inbox.email.list.refetch();
    },
    onError: err => toast.error(`Fejl: ${err.message}`),
  });

  const starMutation = trpc.inbox.email.star.useMutation({
    onSuccess: async () => {
      toast.success("Stjerne tilføjet");
      await utils.inbox.email.list.refetch();
    },
    onError: err => toast.error(`Fejl: ${err.message}`),
  });

  const isBusy =
    archiveMutation.isPending ||
    deleteMutation.isPending ||
    markAsReadMutation.isPending ||
    markAsUnreadMutation.isPending ||
    starMutation.isPending;

  return (
    <div
      className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      onClick={e => e.stopPropagation()}
    >
      <Button
        variant="ghost"
        size="icon"
        title="Arkivér"
        onClick={() => archiveMutation.mutate({ threadId: email.threadId })}
        disabled={isBusy}
      >
        <Archive className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        title="Slet"
        onClick={() => deleteMutation.mutate({ threadId: email.threadId })}
        disabled={isBusy}
      >
        <Trash2 className="w-4 h-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            title="Flere handlinger"
            disabled={isBusy}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56"
          onClick={e => e.stopPropagation()}
        >
          <DropdownMenuLabel>Handlinger</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => markAsReadMutation.mutate({ messageId: email.id })}
            disabled={isBusy}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Marker som læst
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => markAsUnreadMutation.mutate({ messageId: email.id })}
            disabled={isBusy}
          >
            <Circle className="w-4 h-4 mr-2" />
            Marker som ulæst
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => starMutation.mutate({ messageId: email.id })}
            disabled={isBusy}
          >
            <Star className="w-4 h-4 mr-2" />
            Marker med stjerne
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
