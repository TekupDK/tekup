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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";
import {
  Bell,
  Brush,
  Calendar as CalendarIcon,
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Edit,
  ExternalLink,
  FileText,
  History,
  Mail,
  Map,
  MapPin,
  MoreVertical,
  Repeat,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  getEventColor,
  parseCustomerEmail,
  parseEstimate,
  parseTeamInfo,
} from "./calendar-utils";

// Utility functions now imported from calendar-utils.ts

export default function CalendarTab() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [recurringScope, setRecurringScope] = useState<
    "this" | "future" | "all"
  >("this");

  // Edit form state
  const [editForm, setEditForm] = useState({
    summary: "",
    description: "",
    start: "",
    end: "",
    location: "",
  });

  // Copy form state
  const [copyForm, setCopyForm] = useState({
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
    onError: error => {
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
    onError: error => {
      toast.error(`Fejl ved sletning: ${error.message}`);
    },
  });

  const createEventMutation = trpc.inbox.calendar.create.useMutation({
    onSuccess: () => {
      utils.inbox.calendar.list.invalidate();
      setIsCopyDialogOpen(false);
      setIsEventDialogOpen(false);
      toast.success("Ny booking oprettet!");
    },
    onError: error => {
      toast.error(`Fejl ved oprettelse: ${error.message}`);
    },
  });

  // Calculate date range: Fetch historical events for customer history
  // Extended: 5 months back (July 2024), 14 days forward for history panel accuracy
  const dateRange = useMemo(() => {
    const start = new Date(selectedDate);
    start.setMonth(start.getMonth() - 5); // 5 months back (July-October history)
    start.setHours(0, 0, 0, 0);

    const end = new Date(selectedDate);
    end.setDate(end.getDate() + 14); // 14 days forward for upcoming bookings
    end.setHours(23, 59, 59, 999);

    return {
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      maxResults: 500, // Increased for historical data (july-october + future)
    };
  }, [selectedDate]);

  const {
    data: events,
    isLoading,
    isFetching,
  } = trpc.inbox.calendar.list.useQuery(dateRange, {
    // Performance optimizations:
    staleTime: 60000, // Consider data fresh for 60 seconds (reduces refetches)
    gcTime: 300000, // Cache data for 5 minutes
    refetchInterval: 60000, // Auto-refresh every 60 seconds (reduced from 30)
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false, // Don't refetch when user switches tabs
  });

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

  // Keyboard shortcuts: ←/→ for day, Shift+←/→ for week, T for Today
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (e.shiftKey) navigateWeek("prev");
        else navigateDay("prev");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (e.shiftKey) navigateWeek("next");
        else navigateDay("next");
      } else if (e.key.toLowerCase() === "t") {
        e.preventDefault();
        setSelectedDate(new Date());
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedDate]);

  // Week helpers (Monday as first day)
  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = (date.getDay() + 6) % 7; // 0=Monday
    date.setDate(date.getDate() - day);
    date.setHours(0, 0, 0, 0);
    return date;
  };
  const getEndOfWeek = (d: Date) => {
    const start = getStartOfWeek(d);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  };
  const weekStart = getStartOfWeek(selectedDate);
  const weekEnd = getEndOfWeek(selectedDate);
  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const dt = new Date(weekStart);
        dt.setDate(dt.getDate() + i);
        return dt;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [weekStart.getTime()]
  );

  const weekEvents = useMemo(() => {
    if (!events) return [] as any[];
    return events.filter((event: any) => {
      const startTime =
        event.start?.dateTime || event.start?.date || event.start;
      if (!startTime) return false;
      const eventStart = new Date(startTime);
      return eventStart >= weekStart && eventStart <= weekEnd;
    });
  }, [events, weekStart, weekEnd]);

  // Keyboard navigation between events in dialog: ←/→ to jump, Escape to close
  useEffect(() => {
    if (!isEventDialogOpen || !selectedEvent) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const relevantEvents = viewMode === "day" ? dayEvents : weekEvents;
      if (!relevantEvents || relevantEvents.length === 0) return;

      const currentIndex = relevantEvents.findIndex(
        (ev: any) => ev.id === selectedEvent.id
      );
      if (currentIndex === -1) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        // Go to previous event
        if (currentIndex > 0) {
          setSelectedEvent(relevantEvents[currentIndex - 1]);
          toast.info("Forrige event");
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        // Go to next event
        if (currentIndex < relevantEvents.length - 1) {
          setSelectedEvent(relevantEvents[currentIndex + 1]);
          toast.info("Næste event");
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setIsEventDialogOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isEventDialogOpen, selectedEvent, dayEvents, weekEvents, viewMode]);

  // Cleaning events for the selected day
  const cleaningEvents = useMemo(() => {
    const stripDiacritics = (s: string) =>
      (s?.toString() || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    const keywords = [
      "rengor", // normalized "rengør"
      "rengoer",
      "rengoring", // normalized "rengøring"
      "flytterengor",
      "clean",
      "cleaning",
    ];
    return (dayEvents || []).filter((event: any) => {
      const text = stripDiacritics(
        [event?.summary, event?.description, event?.location]
          .filter(Boolean)
          .join(" ")
      );
      return keywords.some(k => text.includes(k));
    });
  }, [dayEvents]);

  // Initialize edit form when event is selected
  const handleEditClick = () => {
    if (!selectedEvent) return;

    const startTime =
      selectedEvent.start?.dateTime ||
      selectedEvent.start?.date ||
      selectedEvent.start;
    const endTime =
      selectedEvent.end?.dateTime ||
      selectedEvent.end?.date ||
      selectedEvent.end;

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

    // Validate: end must be strictly after start when both provided
    const startOk =
      !!editForm.start && !isNaN(new Date(editForm.start).getTime());
    const endOk = !!editForm.end && !isNaN(new Date(editForm.end).getTime());
    if (startOk && endOk) {
      const s = new Date(editForm.start);
      const e = new Date(editForm.end);
      if (e <= s) {
        toast.error("Sluttidspunkt skal være efter starttidspunkt");
        return;
      }
    }

    updateEventMutation.mutate({
      eventId: selectedEvent.id,
      summary: editForm.summary || undefined,
      description: editForm.description || undefined,
      start: editForm.start
        ? new Date(editForm.start).toISOString()
        : undefined,
      end: editForm.end ? new Date(editForm.end).toISOString() : undefined,
      location: editForm.location || undefined,
    });
  };

  const handleDelete = () => {
    if (!selectedEvent) return;
    deleteEventMutation.mutate({ eventId: selectedEvent.id });
  };

  const handleCopyClick = () => {
    if (!selectedEvent) return;

    const startTime =
      selectedEvent.start?.dateTime ||
      selectedEvent.start?.date ||
      selectedEvent.start;
    const endTime =
      selectedEvent.end?.dateTime ||
      selectedEvent.end?.date ||
      selectedEvent.end;

    // Default to tomorrow at same time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const startDateTime = startTime ? new Date(startTime) : new Date();
    const endDateTime = endTime ? new Date(endTime) : new Date();
    const startTimeStr = startDateTime.toTimeString().slice(0, 5);
    const endTimeStr = endDateTime.toTimeString().slice(0, 5);

    setCopyForm({
      summary: selectedEvent.summary || "",
      description: selectedEvent.description || "",
      start: `${tomorrowStr}T${startTimeStr}`,
      end: `${tomorrowStr}T${endTimeStr}`,
      location: selectedEvent.location || "",
    });
    setIsCopyDialogOpen(true);
  };

  const handleSaveCopy = () => {
    // Validate: end must be after start
    const startOk =
      !!copyForm.start && !isNaN(new Date(copyForm.start).getTime());
    const endOk = !!copyForm.end && !isNaN(new Date(copyForm.end).getTime());
    if (startOk && endOk) {
      const s = new Date(copyForm.start);
      const e = new Date(copyForm.end);
      if (e <= s) {
        toast.error("Sluttidspunkt skal være efter starttidspunkt");
        return;
      }
    }

    createEventMutation.mutate({
      summary: copyForm.summary,
      description: copyForm.description,
      start: copyForm.start
        ? new Date(copyForm.start).toISOString()
        : new Date().toISOString(),
      end: copyForm.end
        ? new Date(copyForm.end).toISOString()
        : new Date().toISOString(),
      location: copyForm.location,
    });
  };

  // Validation: end must be after start in edit dialog
  const timeError = useMemo(() => {
    if (!editForm.start || !editForm.end) return false;
    const s = new Date(editForm.start);
    const e = new Date(editForm.end);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return false;
    return e <= s;
  }, [editForm.start, editForm.end]);

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
        <div
          className="relative border rounded-lg overflow-hidden bg-background"
          style={{ height: `${14 * 80}px` }}
        >
          <div className="absolute left-0 top-0 w-14 bg-muted/30 border-r">
            {Array.from({ length: 14 }).map((_, i) => (
              <div
                key={i}
                className="h-20 border-b flex items-start justify-end pr-1.5 pt-0.5"
              >
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
          <div className="min-w-[220px] text-center">
            <h3 className="font-medium">
              {viewMode === "day"
                ? selectedDate.toLocaleDateString("da-DK", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })
                : `${weekDays[0].toLocaleDateString("da-DK", { day: "numeric", month: "short" })} - ${weekDays[6].toLocaleDateString("da-DK", { day: "numeric", month: "short" })}`}
            </h3>
            {viewMode === "week" && (
              <p className="text-xs text-muted-foreground">Ugevisning</p>
            )}
          </div>
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
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-md border p-0.5">
            <Button
              variant={viewMode === "day" ? "default" : "ghost"}
              size="sm"
              className="h-7 px-3"
              onClick={() => setViewMode("day")}
            >
              Dag
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "ghost"}
              size="sm"
              className="h-7 px-3"
              onClick={() => setViewMode("week")}
            >
              Uge
            </Button>
          </div>
          <Input
            type="date"
            className="h-8 w-[150px]"
            value={(() => {
              const y = selectedDate.getFullYear();
              const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
              const d = String(selectedDate.getDate()).padStart(2, "0");
              return `${y}-${m}-${d}`;
            })()}
            onChange={e => {
              const val = e.target.value; // yyyy-mm-dd
              if (!val) return;
              const [yy, mm, dd] = val.split("-").map(Number);
              const picked = new Date(yy, (mm || 1) - 1, dd || 1);
              if (!isNaN(picked.getTime())) setSelectedDate(picked);
            }}
            title="Gå til dato"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate(new Date())}
            title="I dag (T)"
          >
            I dag
          </Button>
        </div>
      </div>

      {/* Cleaning section: visible always with placeholder */}
      <CleaningSection
        selectedDate={selectedDate}
        viewMode={viewMode}
        dayEvents={dayEvents}
        weekEvents={weekEvents}
        onOpen={(ev: any) => {
          setSelectedEvent(ev);
          setIsEventDialogOpen(true);
        }}
      />

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

        {/* Event Container: Day vs Week */}
        {viewMode === "day" ? (
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
              const eventColor = getEventColor(event);
              const teamInfo = parseTeamInfo(event);
              return (
                <div
                  key={event.id}
                  className={`absolute left-2 right-2 ${eventColor} text-white rounded-md p-2 overflow-hidden border-l-4 border-white/30 cursor-pointer hover:opacity-90 hover:shadow-lg transition-all`}
                  style={position}
                  onClick={() => {
                    setSelectedEvent(event);
                    setIsEventDialogOpen(true);
                  }}
                  title="Klik for at se detaljer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-xs font-medium truncate flex-1">
                      {event.summary}
                    </div>
                    {teamInfo && (
                      <div className="flex items-center gap-0.5 bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0">
                        <Users className="w-3 h-3" />
                        {teamInfo}
                      </div>
                    )}
                  </div>
                  <div className="text-xs opacity-90">
                    {(() => {
                      const startTime =
                        event.start?.dateTime ||
                        event.start?.date ||
                        event.start;
                      const endTime =
                        event.end?.dateTime || event.end?.date || event.end;
                      return `${new Date(startTime).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })} - ${new Date(endTime).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })}`;
                    })()}
                  </div>
                </div>
              );
            })}

            {/* Current Time Indicator (Day) */}
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
        ) : (
          <div
            className="ml-16 relative"
            style={{ height: `${hours.length * 80}px` }}
          >
            {/* Week grid: 7 columns */}
            <div className="absolute inset-0 grid grid-cols-7">
              {weekDays.map((d, colIdx) => (
                <div
                  key={colIdx}
                  className={`relative ${colIdx !== 0 ? "border-l" : ""}`}
                >
                  {hours.map(h => (
                    <div key={h} className="h-20 border-b" />
                  ))}

                  {/* Day header */}
                  <div className="absolute top-0 left-2 text-xs text-muted-foreground">
                    {d.toLocaleDateString("da-DK", {
                      weekday: "short",
                      day: "numeric",
                    })}
                  </div>

                  {/* Events for this day */}
                  {weekEvents
                    .filter((event: any) => {
                      const startTime =
                        event.start?.dateTime ||
                        event.start?.date ||
                        event.start;
                      const start = new Date(startTime);
                      return (
                        start.getFullYear() === d.getFullYear() &&
                        start.getMonth() === d.getMonth() &&
                        start.getDate() === d.getDate()
                      );
                    })
                    .map((event: any) => {
                      const position = getEventPosition(event);
                      const eventColor = getEventColor(event);
                      const teamInfo = parseTeamInfo(event);
                      return (
                        <div
                          key={event.id}
                          className={`absolute left-2 right-2 ${eventColor} text-white rounded-md p-2 overflow-hidden border-l-4 border-white/30 cursor-pointer hover:opacity-90 hover:shadow-lg transition-all`}
                          style={position}
                          onClick={() => {
                            setSelectedEvent(event);
                            setIsEventDialogOpen(true);
                          }}
                          title="Klik for at se detaljer"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div className="text-xs font-medium truncate flex-1 leading-tight">
                              {event.summary}
                            </div>
                            {teamInfo && (
                              <div className="flex items-center gap-0.5 bg-white/20 px-1 py-0.5 rounded text-[9px] font-medium shrink-0">
                                <Users className="w-2.5 h-2.5" />
                                {teamInfo}
                              </div>
                            )}
                          </div>
                          <div className="text-[10px] opacity-90 mt-0.5">
                            {(() => {
                              const startTime =
                                event.start?.dateTime ||
                                event.start?.date ||
                                event.start;
                              const endTime =
                                event.end?.dateTime ||
                                event.end?.date ||
                                event.end;
                              return `${new Date(startTime).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })} - ${new Date(endTime).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })}`;
                            })()}
                          </div>
                        </div>
                      );
                    })}

                  {/* Current time indicator only for today's column */}
                  {(() => {
                    const today = new Date();
                    if (d.toDateString() !== today.toDateString()) return null;
                    const currentHour =
                      today.getHours() + today.getMinutes() / 60;
                    if (currentHour < 7 || currentHour > 20) return null;
                    return (
                      <div
                        className="absolute left-0 right-0 border-t-2 border-orange-500"
                        style={{ top: `${(currentHour - 7) * 80}px` }}
                      >
                        <div className="w-2 h-2 bg-orange-500 rounded-full -mt-1" />
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          </div>
        )}
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
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              {selectedEvent?.summary || "Event Details"}
              {selectedEvent?.recurringEventId && (
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-md text-xs font-medium">
                  <Repeat className="w-3 h-3" />
                  Gentager
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              Se alle detaljer for denne begivenhed, eller kopier, eksporter og
              rediger den.
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-3 py-2">
              {/* Time */}
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs text-muted-foreground mb-0.5">
                    Tidspunkt
                  </p>
                  <p className="text-sm leading-tight">
                    {(() => {
                      const startTime =
                        selectedEvent.start?.dateTime ||
                        selectedEvent.start?.date ||
                        selectedEvent.start;
                      const endTime =
                        selectedEvent.end?.dateTime ||
                        selectedEvent.end?.date ||
                        selectedEvent.end;
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
                          <span className="text-muted-foreground">
                            {timeStr}
                          </span>
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
                    <p className="font-medium text-xs text-muted-foreground mb-0.5">
                      Sted
                    </p>
                    <p className="text-sm leading-tight wrap-break-word mb-2">
                      {selectedEvent.location}
                    </p>
                    {/* Mini Google Maps */}
                    <div className="relative w-full h-32 rounded-md overflow-hidden border">
                      <iframe
                        src={`https://www.google.com/maps?q=${encodeURIComponent(selectedEvent.location)}&output=embed`}
                        className="w-full h-full border-0"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Google Maps"
                      />
                    </div>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedEvent.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"
                    >
                      <Map className="w-3 h-3" />
                      Få rutevejledning
                    </a>
                  </div>
                </div>
              )}

              {/* Estimate Info */}
              {(() => {
                const estimate = parseEstimate(selectedEvent);
                if (!estimate) return null;
                return (
                  <div className="flex items-start gap-2.5">
                    <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs text-muted-foreground mb-0.5">
                        Estimat
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {estimate.hours && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{estimate.hours} timer</span>
                          </div>
                        )}
                        {estimate.price && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1.5 cursor-help">
                                  <span className="text-lg">💰</span>
                                  <span className="font-semibold">
                                    {estimate.price} kr
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <div className="space-y-1.5 text-xs">
                                  <p className="font-semibold mb-2">
                                    Prisberegning
                                  </p>
                                  {estimate.hours && (
                                    <div className="flex justify-between gap-4">
                                      <span className="text-muted-foreground">
                                        Timer ({estimate.hours}t × 450 kr/t)
                                      </span>
                                      <span className="font-medium">
                                        {parseFloat(estimate.hours) * 450} kr
                                      </span>
                                    </div>
                                  )}
                                  {estimate.size && (
                                    <div className="flex justify-between gap-4">
                                      <span className="text-muted-foreground">
                                        Areal ({estimate.size} m²)
                                      </span>
                                      <span className="font-medium">Inkl.</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between gap-4 pt-1 border-t">
                                    <span className="text-muted-foreground">
                                      Moms (25%)
                                    </span>
                                    <span className="font-medium">
                                      {Math.round(
                                        parseFloat(estimate.price) * 0.2
                                      )}{" "}
                                      kr
                                    </span>
                                  </div>
                                  <div className="flex justify-between gap-4 pt-1 border-t font-semibold">
                                    <span>Total (inkl. moms)</span>
                                    <span>{estimate.price} kr</span>
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {estimate.size && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-lg">📏</span>
                            <span>{estimate.size} m²</span>
                          </div>
                        )}
                        {estimate.team && (
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>Team {estimate.team}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Description */}
              {selectedEvent.description && (
                <div className="flex items-start gap-2.5">
                  <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs text-muted-foreground mb-0.5">
                      Beskrivelse
                    </p>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap wrap-break-word max-h-[300px] overflow-y-auto pr-2">
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
                      const startTime =
                        selectedEvent.start?.dateTime ||
                        selectedEvent.start?.date ||
                        selectedEvent.start;
                      const endTime =
                        selectedEvent.end?.dateTime ||
                        selectedEvent.end?.date ||
                        selectedEvent.end;
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
                        selectedEvent.location &&
                          `Sted: ${selectedEvent.location}`,
                        selectedEvent.description &&
                          `Beskrivelse: ${selectedEvent.description}`,
                      ]
                        .filter(Boolean)
                        .join("\n");

                      navigator.clipboard.writeText(details);
                      toast.success("Event detaljer kopieret til clipboard!");
                    }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Kopier
                  </Button>

                  {/* Send Email Confirmation */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1.5 text-xs"
                    onClick={() => {
                      const customerEmail = parseCustomerEmail(selectedEvent);
                      const startTime =
                        selectedEvent.start?.dateTime ||
                        selectedEvent.start?.date ||
                        selectedEvent.start;
                      const endTime =
                        selectedEvent.end?.dateTime ||
                        selectedEvent.end?.date ||
                        selectedEvent.end;
                      const start = new Date(startTime);
                      const end = new Date(endTime);

                      const dateStr = start.toLocaleDateString("da-DK", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      });
                      const timeStr = `${start.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })}`;

                      const subject = `Bekræftelse: ${selectedEvent.summary}`;
                      const body = `Hej,

Din rengøring er nu booket:

📅 Dato: ${dateStr}
⏰ Tidspunkt: ${timeStr}
📍 Adresse: ${selectedEvent.location || "Se din booking for detaljer"}

${selectedEvent.description ? `\nDetaljer:\n${selectedEvent.description}\n` : ""}
Vi glæder os til at hjælpe dig!

Med venlig hilsen,
Rendetalje`;

                      const mailtoLink = `mailto:${customerEmail || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                      window.location.href = mailtoLink;

                      if (!customerEmail) {
                        toast.info(
                          "Email-adresse ikke fundet i event. Udfyld modtager manuelt."
                        );
                      } else {
                        toast.success("Email-vindue åbnet!");
                      }
                    }}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Send bekræftelse
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
                        const startTime =
                          selectedEvent.start?.dateTime ||
                          selectedEvent.start?.date ||
                          selectedEvent.start;
                        const endTime =
                          selectedEvent.end?.dateTime ||
                          selectedEvent.end?.date ||
                          selectedEvent.end;
                        const start = new Date(startTime);
                        const end = new Date(endTime);

                        // Format dates for ICS (YYYYMMDDTHHMMSSZ)
                        const formatICSDate = (date: Date) => {
                          return (
                            date
                              .toISOString()
                              .replace(/[-:]/g, "")
                              .split(".")[0] + "Z"
                          );
                        };

                        // Escape text per RFC 5545
                        const esc = (s: string) =>
                          (s || "")
                            .replace(/\\/g, "\\\\")
                            .replace(/\n/g, "\\n")
                            .replace(/,/g, "\\,")
                            .replace(/;/g, "\\;");

                        const icsContent = [
                          "BEGIN:VCALENDAR",
                          "VERSION:2.0",
                          "PRODID:-//Friday AI//Calendar Event//EN",
                          "BEGIN:VEVENT",
                          `DTSTART:${formatICSDate(start)}`,
                          `DTEND:${formatICSDate(end)}`,
                          `SUMMARY:${esc(selectedEvent.summary || "")}`,
                          selectedEvent.description &&
                            `DESCRIPTION:${esc(selectedEvent.description)}`,
                          selectedEvent.location &&
                            `LOCATION:${esc(selectedEvent.location)}`,
                          `UID:${selectedEvent.id}@friday-ai`,
                          "END:VEVENT",
                          "END:VCALENDAR",
                        ]
                          .filter(Boolean)
                          .join("\r\n");

                        const blob = new Blob([icsContent], {
                          type: "text/calendar;charset=utf-8",
                        });
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
                        // No-op server side; just invalidate cache to refresh
                        utils.inbox.calendar.list.invalidate();
                        toast.success("Event markeret som færdig!");
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Markér som færdig
                    </DropdownMenuItem>

                    {/* Edit Event */}
                    <DropdownMenuItem onClick={handleEditClick}>
                      <Edit className="w-4 h-4 mr-2" />
                      Rediger event
                    </DropdownMenuItem>

                    {/* Copy to New Date */}
                    <DropdownMenuItem onClick={handleCopyClick}>
                      <CalendarPlus className="w-4 h-4 mr-2" />
                      Kopier til ny dato
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {/* View History */}
                    <DropdownMenuItem
                      onClick={() => setIsHistoryDialogOpen(true)}
                    >
                      <History className="w-4 h-4 mr-2" />
                      Se historik
                    </DropdownMenuItem>

                    {/* Send Reminder */}
                    <DropdownMenuItem
                      onClick={() => {
                        toast.info("Påmindelse sendes 30 min før start");
                        // TODO: Implement actual reminder scheduling
                      }}
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      Send påmindelse
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
            <DialogTitle className="text-lg font-semibold">
              Rediger Event
            </DialogTitle>
            <DialogDescription>
              Rediger detaljerne for denne begivenhed. Alle ændringer
              synkroniseres med Google Calendar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-summary" className="text-xs">
                Titel *
              </Label>
              <Input
                id="edit-summary"
                value={editForm.summary}
                onChange={e =>
                  setEditForm({ ...editForm, summary: e.target.value })
                }
                placeholder="Event titel"
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-start" className="text-xs">
                Start tidspunkt *
              </Label>
              <Input
                id="edit-start"
                type="datetime-local"
                value={editForm.start}
                onChange={e =>
                  setEditForm({ ...editForm, start: e.target.value })
                }
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-end" className="text-xs">
                Slut tidspunkt *
              </Label>
              <Input
                id="edit-end"
                type="datetime-local"
                value={editForm.end}
                onChange={e =>
                  setEditForm({ ...editForm, end: e.target.value })
                }
                className="h-8 text-sm"
              />
              {timeError && (
                <p className="text-[11px] text-destructive mt-1">
                  Slut skal være efter start.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-location" className="text-xs">
                Lokation
              </Label>
              <Input
                id="edit-location"
                value={editForm.location}
                onChange={e =>
                  setEditForm({ ...editForm, location: e.target.value })
                }
                placeholder="Event lokation"
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-description" className="text-xs">
                Beskrivelse
              </Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={e =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                placeholder="Event beskrivelse"
                rows={6}
                className="text-sm max-h-[200px] overflow-y-auto resize-none"
              />
            </div>

            {/* Recurring Event Manager */}
            {selectedEvent?.recurringEventId && (
              <div className="space-y-2 p-3 bg-muted/30 rounded-md border">
                <div className="flex items-center gap-2 text-sm">
                  <Repeat className="w-4 h-4 text-primary" />
                  <span className="font-medium">Gentagende begivenhed</span>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Hvilke events skal opdateres?
                  </Label>
                  <div className="space-y-1.5">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recurringScope"
                        value="this"
                        checked={recurringScope === "this"}
                        onChange={e =>
                          setRecurringScope(
                            e.target.value as "this" | "future" | "all"
                          )
                        }
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          Kun denne begivenhed
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Opdater kun dette enkelte event
                        </div>
                      </div>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recurringScope"
                        value="future"
                        checked={recurringScope === "future"}
                        onChange={e =>
                          setRecurringScope(
                            e.target.value as "this" | "future" | "all"
                          )
                        }
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          Dette og alle fremtidige
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Opdater denne og alle kommende gentagelser
                        </div>
                      </div>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recurringScope"
                        value="all"
                        checked={recurringScope === "all"}
                        onChange={e =>
                          setRecurringScope(
                            e.target.value as "this" | "future" | "all"
                          )
                        }
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          Alle begivenheder i serien
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Opdater hele den gentagende serie
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}
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
              disabled={
                updateEventMutation.isPending ||
                !editForm.summary ||
                !editForm.start ||
                !editForm.end ||
                timeError
              }
            >
              {updateEventMutation.isPending ? "Gemmer..." : "Gem"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Event Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
            <AlertDialogDescription>
              Dette vil slette eventet "{selectedEvent?.summary}". Denne
              handling kan ikke fortrydes.
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

      {/* Copy Event to New Date Dialog */}
      <Dialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Kopier til ny dato
            </DialogTitle>
            <DialogDescription>
              Opret en ny booking baseret på denne begivenhed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="copy-summary" className="text-xs">
                Titel *
              </Label>
              <Input
                id="copy-summary"
                value={copyForm.summary}
                onChange={e =>
                  setCopyForm({ ...copyForm, summary: e.target.value })
                }
                placeholder="Event titel"
                className="h-8 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="copy-start" className="text-xs">
                  Start *
                </Label>
                <Input
                  id="copy-start"
                  type="datetime-local"
                  value={copyForm.start}
                  onChange={e =>
                    setCopyForm({ ...copyForm, start: e.target.value })
                  }
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="copy-end" className="text-xs">
                  Slut *
                </Label>
                <Input
                  id="copy-end"
                  type="datetime-local"
                  value={copyForm.end}
                  onChange={e =>
                    setCopyForm({ ...copyForm, end: e.target.value })
                  }
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="copy-location" className="text-xs">
                Lokation
              </Label>
              <Input
                id="copy-location"
                value={copyForm.location}
                onChange={e =>
                  setCopyForm({ ...copyForm, location: e.target.value })
                }
                placeholder="Adresse"
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="copy-description" className="text-xs">
                Beskrivelse
              </Label>
              <Textarea
                id="copy-description"
                value={copyForm.description}
                onChange={e =>
                  setCopyForm({ ...copyForm, description: e.target.value })
                }
                placeholder="Detaljer..."
                rows={4}
                className="text-sm resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCopyDialogOpen(false)}
            >
              Annuller
            </Button>
            <Button
              size="sm"
              onClick={handleSaveCopy}
              disabled={
                createEventMutation.isPending ||
                !copyForm.summary ||
                !copyForm.start ||
                !copyForm.end
              }
            >
              {createEventMutation.isPending ? "Opretter..." : "Opret booking"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Historik for{" "}
              {selectedEvent?.summary?.split("-")[1]?.trim() || "kunde"}
            </DialogTitle>
            <DialogDescription>
              Alle tidligere begivenheder for denne kunde/lokation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
            {/* History timeline */}
            {(() => {
              if (!selectedEvent || !events)
                return (
                  <p className="text-sm text-muted-foreground">
                    Ingen historik fundet.
                  </p>
                );

              // Filter events with same location or customer name (fuzzy matching)
              const customerName =
                selectedEvent.summary?.split("-")[1]?.trim().toLowerCase() ||
                "";
              const location = selectedEvent.location?.toLowerCase() || "";
              const customerEmail = parseCustomerEmail(selectedEvent);

              const relatedEvents = events
                .filter((ev: any) => {
                  if (ev.id === selectedEvent.id) return false;

                  const evCustomer = (
                    ev.summary?.split("-")[1]?.trim() || ""
                  ).toLowerCase();
                  const evLocation = (ev.location || "").toLowerCase();
                  const evSummary = (ev.summary || "").toLowerCase();
                  const evDescription = (ev.description || "").toLowerCase();

                  // Match by: customer name substring, location match, or email in event
                  return (
                    (customerName && evCustomer.includes(customerName)) || // Substring match on customer name
                    (customerName && evSummary.includes(customerName)) || // Customer name in full summary
                    (location && evLocation === location) || // Exact location match
                    (customerEmail &&
                      evDescription.includes(customerEmail.toLowerCase())) // Email in description
                  );
                })
                .sort((a: any, b: any) => {
                  const aTime = a.start?.dateTime || a.start?.date || a.start;
                  const bTime = b.start?.dateTime || b.start?.date || b.start;
                  return new Date(bTime).getTime() - new Date(aTime).getTime();
                });

              if (relatedEvents.length === 0) {
                return (
                  <p className="text-sm text-muted-foreground">
                    Ingen tidligere begivenheder fundet for denne kunde.
                  </p>
                );
              }

              return relatedEvents.map((ev: any) => {
                const startTime =
                  ev.start?.dateTime || ev.start?.date || ev.start;
                const start = new Date(startTime);
                const estimate = parseEstimate(ev);

                return (
                  <div
                    key={ev.id}
                    className="border-l-2 border-primary/30 pl-3 pb-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{ev.summary}</p>
                        <p className="text-xs text-muted-foreground">
                          {start.toLocaleDateString("da-DK", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                        {estimate && (
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            {estimate.hours && (
                              <span>⏱️ {estimate.hours}t</span>
                            )}
                            {estimate.price && (
                              <span className="font-semibold">
                                💰 {estimate.price} kr
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedEvent(ev);
                          setIsHistoryDialogOpen(false);
                          setIsEventDialogOpen(true);
                        }}
                        className="h-7 text-xs"
                      >
                        Åbn
                      </Button>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type CleaningSectionProps = {
  selectedDate: Date;
  viewMode: "day" | "week";
  dayEvents: any[];
  weekEvents: any[];
  onOpen: (ev: any) => void;
};

function CleaningSection({
  selectedDate,
  viewMode,
  dayEvents,
  weekEvents,
  onOpen,
}: CleaningSectionProps) {
  const [scope, setScope] = useState<"day" | "week">(viewMode);

  useEffect(() => {
    setScope(viewMode);
  }, [viewMode]);

  const stripDiacritics = (s: string) =>
    (s?.toString() || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  // Keywords to match in both raw (with diacritics) and normalized text
  const keywordsRaw = [
    "rengør",
    "rengøring",
    "flytterengøring",
    "rengoer",
    "clean",
    "cleaning",
  ];
  const keywordsNormalized = [
    "reng",
    "rengor",
    "rengo",
    "rengoer",
    "rengoring",
    "flytterengor",
    "clean",
    "cleaning",
  ];

  const filterCleaning = (events: any[]) =>
    (events || []).filter((event: any) => {
      const raw = [event?.summary, event?.description, event?.location]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const normalized = stripDiacritics(raw);
      return (
        keywordsNormalized.some(k => normalized.includes(k)) ||
        keywordsRaw.some(k => raw.includes(k))
      );
    });

  const items = useMemo(
    () =>
      scope === "day" ? filterCleaning(dayEvents) : filterCleaning(weekEvents),
    [scope, dayEvents, weekEvents]
  );

  const label =
    scope === "day"
      ? selectedDate.toLocaleDateString("da-DK", {
          weekday: "short",
          day: "numeric",
          month: "short",
        })
      : (() => {
          const d = new Date(selectedDate);
          const day = (d.getDay() + 6) % 7;
          const start = new Date(d);
          start.setDate(start.getDate() - day);
          const end = new Date(start);
          end.setDate(end.getDate() + 6);
          return `${start.toLocaleDateString("da-DK", { day: "numeric", month: "short" })} - ${end.toLocaleDateString("da-DK", { day: "numeric", month: "short" })}`;
        })();

  return (
    <div className="mb-4 border rounded-lg p-3 bg-muted/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Brush className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-semibold">Rengøring ({items.length})</h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {label}
          </span>
          <div className="inline-flex items-center rounded-md border p-0.5">
            <Button
              variant={scope === "day" ? "default" : "ghost"}
              size="sm"
              className="h-7 px-2"
              onClick={() => setScope("day")}
            >
              Dag
            </Button>
            <Button
              variant={scope === "week" ? "default" : "ghost"}
              size="sm"
              className="h-7 px-2"
              onClick={() => setScope("week")}
            >
              Uge
            </Button>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-xs text-muted-foreground">
          {scope === "day"
            ? "Ingen rengøringsaftaler i dag"
            : "Ingen rengøringsaftaler denne uge"}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((ev: any) => {
            const startTime = ev.start?.dateTime || ev.start?.date || ev.start;
            const endTime = ev.end?.dateTime || ev.end?.date || ev.end;
            const isAllDay = !!ev.start?.date && !ev.start?.dateTime;
            const timeLabel = isAllDay
              ? "Hele dagen"
              : `${new Date(startTime).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })} - ${new Date(endTime).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })}`;
            const datePrefix =
              scope === "week"
                ? `${new Date(startTime).toLocaleDateString("da-DK", { weekday: "short" })} · `
                : "";
            const textRaw =
              `${ev?.summary ?? ""} ${ev?.description ?? ""}`.toLowerCase();
            const textNorm = textRaw
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "");
            let badge: { label: string; className: string } | null = null;
            if (/\bflytter/.test(textNorm)) {
              badge = {
                label: "Flytterengøring",
                className: "bg-rose-500/15 text-rose-400",
              };
            } else if (/\bugentlig|\bugentligt|weekly/.test(textNorm)) {
              badge = {
                label: "Ugentlig",
                className: "bg-amber-500/15 text-amber-400",
              };
            } else if (/\bfast\b/.test(textNorm)) {
              badge = {
                label: "Fast",
                className: "bg-emerald-500/15 text-emerald-400",
              };
            } else if (
              /hovedrengor|hovedrengoer|hovedrengøring/.test(textNorm)
            ) {
              badge = {
                label: "Hovedrengøring",
                className: "bg-sky-500/15 text-sky-400",
              };
            } else if (/vindue|vinduer|windows/.test(textNorm)) {
              badge = {
                label: "Vinduer",
                className: "bg-cyan-500/15 text-cyan-400",
              };
            }
            return (
              <button
                key={ev.id}
                className="inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs hover:bg-muted/50 transition-colors"
                onClick={() => onOpen(ev)}
                title="Klik for at se detaljer"
              >
                {badge && (
                  <span
                    className={`hidden sm:inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                )}
                <span className="font-medium truncate max-w-[200px]">
                  {ev.summary}
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground whitespace-nowrap">
                  {datePrefix}
                  {timeLabel}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
