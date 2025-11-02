import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  FileText,
  Copy,
  ExternalLink,
  Download,
  CheckCircle2,
  MoreVertical,
  Edit,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

export default function CalendarTab() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    summary: "",
    description: "",
    start: "",
    end: "",
    location: "",
  });

  const utils = trpc.useUtils();
  const updateEventMutation = trpc.inbox.calendar.update.useMutation({
    onSuccess: () => {
      utils.inbox.calendar.list.invalidate();
      setIsEditDialogOpen(false);
      setIsEventDialogOpen(false);
      toast.success("Event opdateret!");
    },
    onError: (error) => {
      toast.error(`Fejl ved opdatering: ${error.message}`);
    },
  });

  const deleteEventMutation = trpc.inbox.calendar.delete.useMutation({
    onSuccess: () => {
      utils.inbox.calendar.list.invalidate();
      setIsDeleteDialogOpen(false);
      setIsEventDialogOpen(false);
      toast.success("Event slettet!");
    },
    onError: (error) => {
      toast.error(`Fejl ved sletning: ${error.message}`);
    },
  });

  // Calculate date range: Only fetch what's needed for navigation
  // Optimized: 7 days back, 14 days forward = 21 days total (faster loading)
  const dateRange = useMemo(() => {
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - 7); // 7 days back (reduced from 30)
    start.setHours(0, 0, 0, 0);

    const end = new Date(selectedDate);
    end.setDate(end.getDate() + 14); // 14 days forward (reduced from 60)
    end.setHours(23, 59, 59, 999);

    return {
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      maxResults: 100, // Reduced from 250 (faster API response)
    };
  }, [selectedDate]);

  const {
    data: events,
    isLoading,
    isFetching,
  } = trpc.inbox.calendar.list.useQuery(
    dateRange,
    {
      // Performance optimizations:
      staleTime: 60000, // Consider data fresh for 60 seconds (reduces refetches)
      gcTime: 300000, // Cache data for 5 minutes
      refetchInterval: 60000, // Auto-refresh every 60 seconds (reduced from 30)
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: false, // Don't refetch when user switches tabs
    }
  );

  // Filter events for selected date
  const dayEvents = useMemo(() => {
    if (!events) return [];

    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    return events.filter((event: any) => {
      // Handle both old and new format
      const startTime =
        event.start?.dateTime || event.start?.date || event.start;
      if (!startTime) return false;

      const eventStart = new Date(startTime);
      return eventStart >= startOfDay && eventStart <= endOfDay;
    });
  }, [events, selectedDate]);

  // Generate hourly slots (7:00 - 20:00)
  const hours = Array.from({ length: 14 }, (_, i) => i + 7);

  const getEventPosition = (event: any) => {
    // Handle both old and new format
    const startTime = event.start?.dateTime || event.start?.date || event.start;
    const endTime = event.end?.dateTime || event.end?.date || event.end;

    const start = new Date(startTime);
    const end = new Date(endTime);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;

    return {
      top: `${(startHour - 7) * 80}px`,
      height: `${(endHour - startHour) * 80}px`,
    };
  };

  const navigateDay = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    setSelectedDate(newDate);
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    setSelectedDate(newDate);
  };

  // Initialize edit form when event is selected
  const handleEditClick = () => {
    if (!selectedEvent) return;

    const startTime = selectedEvent.start?.dateTime || selectedEvent.start?.date || selectedEvent.start;
    const endTime = selectedEvent.end?.dateTime || selectedEvent.end?.date || selectedEvent.end;

    setEditForm({
      summary: selectedEvent.summary || "",
      description: selectedEvent.description || "",
      start: startTime ? new Date(startTime).toISOString().slice(0, 16) : "",
      end: endTime ? new Date(endTime).toISOString().slice(0, 16) : "",
      location: selectedEvent.location || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedEvent) return;

    updateEventMutation.mutate({
      eventId: selectedEvent.id,
      summary: editForm.summary || undefined,
      description: editForm.description || undefined,
      start: editForm.start ? new Date(editForm.start).toISOString() : undefined,
      end: editForm.end ? new Date(editForm.end).toISOString() : undefined,
      location: editForm.location || undefined,
    });
  };

  const handleDelete = () => {
    if (!selectedEvent) return;
    deleteEventMutation.mutate({ eventId: selectedEvent.id });
  };

  // Show compact skeleton loading
  if (isLoading) {
    return (
      <div className="space-y-3">
        {/* Compact Date Navigation Skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-7 w-16" />
        </div>

        {/* Compact Calendar Grid Skeleton */}
        <div className="relative border rounded-lg overflow-hidden bg-background" style={{ height: `${14 * 80}px` }}>
          <div className="absolute left-0 top-0 w-14 bg-muted/30 border-r">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="h-20 border-b flex items-start justify-end pr-1.5 pt-0.5">
                <Skeleton className="h-2.5 w-6" />
              </div>
            ))}
          </div>
          <div className="ml-14 relative h-full">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="h-20 border-b" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Date Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateWeek("prev")}
            title="Forrige uge"
          >
            <ChevronLeft className="w-4 h-4" />
            <ChevronLeft className="w-4 h-4 -ml-2" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateDay("prev")}
            title="Forrige dag"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h3 className="font-medium min-w-[120px] text-center">
            {selectedDate.toLocaleDateString("da-DK", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </h3>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateDay("next")}
            title="Næste dag"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateWeek("next")}
            title="Næste uge"
          >
            <ChevronRight className="w-4 h-4" />
            <ChevronRight className="w-4 h-4 -ml-2" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedDate(new Date())}
        >
          Today
        </Button>
      </div>

      {/* Hourly Grid - Show loading indicator during refetch */}
      <div className="relative border rounded-lg overflow-hidden bg-background">
        {isFetching && !isLoading && (
          <div className="absolute top-2 right-2 z-10">
            <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-md border text-xs text-muted-foreground">
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Opdaterer...
            </div>
          </div>
        )}
        {/* Time Labels */}
        <div className="absolute left-0 top-0 w-16 bg-muted/30 border-r">
          {hours.map(hour => (
            <div
              key={hour}
              className="h-20 border-b flex items-start justify-end pr-2 pt-1"
            >
              <span className="text-xs text-muted-foreground">{hour}:00</span>
            </div>
          ))}
        </div>

        {/* Event Container */}
        <div
          className="ml-16 relative"
          style={{ height: `${hours.length * 80}px` }}
        >
          {/* Grid Lines */}
          {hours.map(hour => (
            <div key={hour} className="h-20 border-b" />
          ))}

          {/* Events */}
          {dayEvents.map((event: any) => {
            const position = getEventPosition(event);
            const eventColor = event.summary
              ?.toLowerCase()
              .includes("flytterengøring")
              ? "bg-red-900/80"
              : "bg-primary/80";

            return (
              <div
                key={event.id}
                className={`absolute left-2 right-2 ${eventColor} text-white rounded-md p-2 overflow-hidden border-l-4 border-primary cursor-pointer hover:opacity-90 hover:shadow-lg transition-all`}
                style={position}
                onClick={() => {
                  setSelectedEvent(event);
                  setIsEventDialogOpen(true);
                }}
                title="Klik for at se detaljer"
              >
                <div className="text-xs font-medium truncate">
                  {event.summary}
                </div>
                <div className="text-xs opacity-90">
                  {(() => {
                    const startTime = event.start?.dateTime || event.start?.date || event.start;
                    const endTime = event.end?.dateTime || event.end?.date || event.end;
                    return `${new Date(startTime).toLocaleTimeString("da-DK", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })} - ${new Date(endTime).toLocaleTimeString("da-DK", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`;
                  })()}
                </div>
              </div>
            );
          })}

          {/* Current Time Indicator */}
          {selectedDate.toDateString() === new Date().toDateString() &&
            (() => {
              const now = new Date();
              const currentHour = now.getHours() + now.getMinutes() / 60;
              if (currentHour >= 7 && currentHour <= 20) {
                return (
                  <div
                    className="absolute left-0 right-0 border-t-2 border-orange-500"
                    style={{ top: `${(currentHour - 7) * 80}px` }}
                  >
                    <div className="w-2 h-2 bg-orange-500 rounded-full -mt-1" />
                  </div>
                );
              }
              return null;
            })()}
        </div>
      </div>

      {dayEvents.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No events scheduled for this day</p>
        </div>
      )}

      {/* Event Details Dialog */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {selectedEvent?.summary || "Event Details"}
            </DialogTitle>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-3 py-2">
              {/* Time */}
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs text-muted-foreground mb-0.5">Tidspunkt</p>
                  <p className="text-sm leading-tight">
                    {(() => {
                      const startTime = selectedEvent.start?.dateTime || selectedEvent.start?.date || selectedEvent.start;
                      const endTime = selectedEvent.end?.dateTime || selectedEvent.end?.date || selectedEvent.end;
                      const start = new Date(startTime);
                      const end = new Date(endTime);
                      const dateStr = start.toLocaleDateString("da-DK", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      });
                      const timeStr = `${start.toLocaleTimeString("da-DK", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })} - ${end.toLocaleTimeString("da-DK", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`;
                      return (
                        <>
                          <span className="block">{dateStr}</span>
                          <span className="text-muted-foreground">{timeStr}</span>
                        </>
                      );
                    })()}
                  </p>
                </div>
              </div>

              {/* Location */}
              {selectedEvent.location && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs text-muted-foreground mb-0.5">Sted</p>
                    <p className="text-sm leading-tight break-words">
                      {selectedEvent.location}
                    </p>
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedEvent.description && (
                <div className="flex items-start gap-2.5">
                  <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs text-muted-foreground mb-0.5">Beskrivelse</p>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap break-words max-h-[300px] overflow-y-auto pr-2">
                      {selectedEvent.description}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons - Redesigned for better UX */}
              <Separator className="my-3" />
              <div className="flex items-center justify-between gap-2">
                {/* Primary Actions - Most used */}
                <div className="flex gap-2">
                {/* Copy Event Details */}
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1.5 text-xs"
                  onClick={() => {
                    const startTime = selectedEvent.start?.dateTime || selectedEvent.start?.date || selectedEvent.start;
                    const endTime = selectedEvent.end?.dateTime || selectedEvent.end?.date || selectedEvent.end;
                    const start = new Date(startTime);
                    const end = new Date(endTime);
                    const dateStr = start.toLocaleDateString("da-DK", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    });
                    const timeStr = `${start.toLocaleTimeString("da-DK", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })} - ${end.toLocaleTimeString("da-DK", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`;

                    const details = [
                      selectedEvent.summary,
                      `${dateStr} ${timeStr}`,
                      selectedEvent.location && `Sted: ${selectedEvent.location}`,
                      selectedEvent.description && `Beskrivelse: ${selectedEvent.description}`,
                    ].filter(Boolean).join("\n");

                    navigator.clipboard.writeText(details);
                    toast.success("Event detaljer kopieret til clipboard!");
                  }}
                >
                  <Copy className="w-3.5 h-3.5" />
                  Kopier
                </Button>

                  {/* Open in Google Calendar */}
                  {selectedEvent.htmlLink && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1.5 text-xs"
                      onClick={() => {
                        window.open(selectedEvent.htmlLink, "_blank");
                      }}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Åbn i Google
                    </Button>
                  )}
                </div>

                {/* Secondary Actions - Dropdown Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1.5 text-xs"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                      Flere
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {/* Export to ICS */}
                    <DropdownMenuItem
                      onClick={() => {
                        const startTime = selectedEvent.start?.dateTime || selectedEvent.start?.date || selectedEvent.start;
                        const endTime = selectedEvent.end?.dateTime || selectedEvent.end?.date || selectedEvent.end;
                        const start = new Date(startTime);
                        const end = new Date(endTime);

                        // Format dates for ICS (YYYYMMDDTHHMMSS)
                        const formatICSDate = (date: Date) => {
                          return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
                        };

                        const icsContent = [
                          "BEGIN:VCALENDAR",
                          "VERSION:2.0",
                          "PRODID:-//Friday AI//Calendar Event//EN",
                          "BEGIN:VEVENT",
                          `DTSTART:${formatICSDate(start)}`,
                          `DTEND:${formatICSDate(end)}`,
                          `SUMMARY:${selectedEvent.summary || ""}`,
                          selectedEvent.description && `DESCRIPTION:${selectedEvent.description.replace(/\n/g, "\\n")}`,
                          selectedEvent.location && `LOCATION:${selectedEvent.location}`,
                          `UID:${selectedEvent.id}@friday-ai`,
                          "END:VEVENT",
                          "END:VCALENDAR",
                        ].filter(Boolean).join("\r\n");

                        const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = `${selectedEvent.summary || "event"}.ics`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);

                        toast.success("Event eksporteret som .ics fil!");
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Eksport .ics
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {/* Mark as Complete */}
                    <DropdownMenuItem
                      onClick={() => {
                        const utils = trpc.useUtils();
                        utils.inbox.calendar.list.invalidate();
                        toast.success("Event markeret som færdig!");
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Markér som færdig
                    </DropdownMenuItem>

                    {/* Edit Event */}
                    <DropdownMenuItem
                      onClick={handleEditClick}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Rediger event
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {/* Delete Event */}
                    <DropdownMenuItem
                      onClick={() => setIsDeleteDialogOpen(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Slet event
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Event ID (for debugging) */}
              <div className="pt-2 border-t mt-3">
                <p className="text-xs text-muted-foreground font-mono">
                  ID: {selectedEvent.id}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog - Compact */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Rediger Event</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-summary" className="text-xs">Titel *</Label>
              <Input
                id="edit-summary"
                value={editForm.summary}
                onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                placeholder="Event titel"
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-start" className="text-xs">Start tidspunkt *</Label>
              <Input
                id="edit-start"
                type="datetime-local"
                value={editForm.start}
                onChange={(e) => setEditForm({ ...editForm, start: e.target.value })}
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-end" className="text-xs">Slut tidspunkt *</Label>
              <Input
                id="edit-end"
                type="datetime-local"
                value={editForm.end}
                onChange={(e) => setEditForm({ ...editForm, end: e.target.value })}
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-location" className="text-xs">Lokation</Label>
              <Input
                id="edit-location"
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                placeholder="Event lokation"
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-description" className="text-xs">Beskrivelse</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Event beskrivelse"
                rows={6}
                className="text-sm max-h-[200px] overflow-y-auto resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Annuller
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEdit}
              disabled={updateEventMutation.isPending || !editForm.summary || !editForm.start || !editForm.end}
            >
              {updateEventMutation.isPending ? "Gemmer..." : "Gem"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Event Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
            <AlertDialogDescription>
              Dette vil slette eventet "{selectedEvent?.summary}". Denne handling kan ikke fortrydes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuller</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteEventMutation.isPending}
            >
              {deleteEventMutation.isPending ? "Sletter..." : "Slet"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
