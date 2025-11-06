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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useVirtualizer } from "@tanstack/react-virtual";
import { format } from "date-fns";
import { da } from "date-fns/locale";
import {
  Calendar,
  CheckSquare,
  Clock,
  Download,
  Filter,
  GripVertical,
  Link2,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type TaskStatus = "todo" | "in_progress" | "done" | "cancelled";
type TaskPriority = "low" | "medium" | "high" | "urgent";

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  todo: {
    label: "To Do",
    color: "bg-blue-500",
  },
  in_progress: {
    label: "In Progress",
    color: "bg-yellow-500",
  },
  done: {
    label: "Done",
    color: "bg-green-500",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-gray-500",
  },
};

const PRIORITY_CONFIG: Record<
  TaskPriority,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  low: {
    label: "Low",
    variant: "outline",
  },
  medium: {
    label: "Medium",
    variant: "secondary",
  },
  high: {
    label: "High",
    variant: "default",
  },
  urgent: {
    label: "Urgent",
    variant: "destructive",
  },
};

export default function TasksTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">(
    "all"
  );
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [activeTask, setActiveTask] = useState<any | null>(null);

  // Virtual scrolling - flatten all groups with headers into single list for virtualization
  const scrollableRef = useRef<HTMLDivElement>(null);

  const [newTaskForm, setNewTaskForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium" as TaskPriority,
    relatedTo: "",
  });

  const [editTaskForm, setEditTaskForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium" as TaskPriority,
    relatedTo: "",
  });

  const utils = trpc.useUtils();
  const { data: tasks, isLoading } = trpc.inbox.tasks.list.useQuery();

  const createTaskMutation = trpc.inbox.tasks.create.useMutation({
    onSuccess: () => {
      utils.inbox.tasks.list.invalidate();
      setIsCreateDialogOpen(false);
      setNewTaskForm({
        title: "",
        description: "",
        dueDate: "",
        priority: "medium",
        relatedTo: "",
      });
      toast.success("Task oprettet!");
    },
    onError: error => {
      toast.error(`Fejl ved oprettelse: ${error.message}`);
    },
  });

  const updateTaskMutation = trpc.inbox.tasks.update.useMutation({
    onSuccess: () => {
      utils.inbox.tasks.list.invalidate();
      setIsEditDialogOpen(false);
      setSelectedTask(null);
      toast.success("Task opdateret!");
    },
    onError: error => {
      toast.error(`Fejl ved opdatering: ${error.message}`);
    },
  });

  const updateStatusMutation = trpc.inbox.tasks.updateStatus.useMutation({
    onSuccess: () => {
      utils.inbox.tasks.list.invalidate();
      toast.success("Status opdateret!");
    },
    onError: error => {
      toast.error(`Fejl ved opdatering: ${error.message}`);
    },
  });

  const deleteTaskMutation = trpc.inbox.tasks.delete.useMutation({
    onSuccess: () => {
      utils.inbox.tasks.list.invalidate();
      setIsDeleteDialogOpen(false);
      setSelectedTask(null);
      toast.success("Task slettet!");
    },
    onError: error => {
      toast.error(`Fejl ved sletning: ${error.message}`);
    },
  });

  const bulkDeleteMutation = trpc.inbox.tasks.bulkDelete.useMutation({
    onSuccess: data => {
      utils.inbox.tasks.list.invalidate();
      setIsBulkDeleteDialogOpen(false);
      setSelectedTasks(new Set());
      toast.success(
        `${data.deletedCount} task${data.deletedCount !== 1 ? "s" : ""} slettet!`
      );
    },
    onError: error => {
      toast.error(`Fejl ved sletning: ${error.message}`);
    },
  });

  const bulkUpdateStatusMutation =
    trpc.inbox.tasks.bulkUpdateStatus.useMutation({
      onSuccess: data => {
        utils.inbox.tasks.list.invalidate();
        setSelectedTasks(new Set());
        toast.success(
          `${data.updatedCount} task${data.updatedCount !== 1 ? "s" : ""} opdateret!`
        );
      },
      onError: error => {
        toast.error(`Fejl ved opdatering: ${error.message}`);
      },
    });

  const bulkUpdatePriorityMutation =
    trpc.inbox.tasks.bulkUpdatePriority.useMutation({
      onSuccess: data => {
        utils.inbox.tasks.list.invalidate();
        setSelectedTasks(new Set());
        toast.success(
          `${data.updatedCount} task${data.updatedCount !== 1 ? "s" : ""} opdateret!`
        );
      },
      onError: error => {
        toast.error(`Fejl ved opdatering: ${error.message}`);
      },
    });

  const bulkUpdateOrderMutation = trpc.inbox.tasks.bulkUpdateOrder.useMutation({
    onSuccess: () => {
      utils.inbox.tasks.list.invalidate();
    },
    onError: error => {
      toast.error(`Fejl ved opdatering af rækkefølge: ${error.message}`);
    },
  });

  // Drag & Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Calculate task statistics
  const taskStats = useMemo(() => {
    if (!tasks) return { todo: 0, in_progress: 0, done: 0 };
    return {
      todo: tasks.filter(t => t.status === "todo").length,
      in_progress: tasks.filter(t => t.status === "in_progress").length,
      done: tasks.filter(t => t.status === "done").length,
    };
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];

    return tasks.filter(task => {
      const matchesSearch =
        searchQuery === "" ||
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || task.status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter]);

  // Group tasks by due date
  const groupedTasks = useMemo(() => {
    if (!filteredTasks || filteredTasks.length === 0)
      return { overdue: [], today: [], upcoming: [], noDate: [] };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const groups: Record<string, typeof filteredTasks> = {
      overdue: [],
      today: [],
      upcoming: [],
      noDate: [],
    };

    filteredTasks.forEach(task => {
      if (!task.dueDate) {
        groups.noDate.push(task);
        return;
      }

      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      if (dueDate < today) {
        groups.overdue.push(task);
      } else if (dueDate.getTime() === today.getTime()) {
        groups.today.push(task);
      } else {
        groups.upcoming.push(task);
      }
    });

    return groups;
  }, [filteredTasks]);

  // Create flat list with headers and tasks (after groupedTasks is defined)
  const flatTaskList = useMemo(() => {
    const items: Array<{ type: "header" | "task"; data: any; group: string }> =
      [];

    if (groupedTasks.overdue.length > 0) {
      items.push({
        type: "header",
        data: {
          label: "Overdue",
          count: groupedTasks.overdue.length,
          color: "destructive",
        },
        group: "overdue",
      });
      groupedTasks.overdue.forEach(task =>
        items.push({ type: "task", data: task, group: "overdue" })
      );
    }

    if (groupedTasks.today.length > 0) {
      items.push({
        type: "header",
        data: {
          label: "Due Today",
          count: groupedTasks.today.length,
          color: "yellow",
        },
        group: "today",
      });
      groupedTasks.today.forEach(task =>
        items.push({ type: "task", data: task, group: "today" })
      );
    }

    if (groupedTasks.upcoming.length > 0) {
      items.push({
        type: "header",
        data: { label: "Upcoming", count: groupedTasks.upcoming.length },
        group: "upcoming",
      });
      groupedTasks.upcoming.forEach(task =>
        items.push({ type: "task", data: task, group: "upcoming" })
      );
    }

    if (groupedTasks.noDate.length > 0) {
      items.push({
        type: "header",
        data: { label: "No Due Date", count: groupedTasks.noDate.length },
        group: "noDate",
      });
      groupedTasks.noDate.forEach(task =>
        items.push({ type: "task", data: task, group: "noDate" })
      );
    }

    return items;
  }, [groupedTasks]);

  // Virtualizer - only enable if total tasks > 50 for performance
  const shouldVirtualize = flatTaskList.length > 50;

  const virtualizer = useVirtualizer({
    count: shouldVirtualize ? flatTaskList.length : 0,
    getScrollElement: () => scrollableRef.current,
    estimateSize: index => {
      const item = flatTaskList[index];
      return item?.type === "header" ? 48 : 96; // Header smaller (48px), tasks larger (96px)
    },
    overscan: 10, // Increased overscan for smoother scrolling
    enabled: shouldVirtualize,
    // Measure actual element sizes for better accuracy
    measureElement: element => {
      return element?.getBoundingClientRect().height ?? 96;
    },
  });

  // Update virtualizer when flatTaskList changes (e.g., after drag-drop)
  useEffect(() => {
    if (shouldVirtualize && virtualizer) {
      virtualizer.measureElement(undefined); // Force remeasure
    }
  }, [flatTaskList.length, shouldVirtualize, virtualizer]);

  const handleCreateTask = () => {
    if (!newTaskForm.title.trim()) {
      toast.error("Titel er påkrævet");
      return;
    }

    createTaskMutation.mutate({
      title: newTaskForm.title,
      description: newTaskForm.description || undefined,
      dueDate: newTaskForm.dueDate || undefined,
      priority: newTaskForm.priority,
      relatedTo: newTaskForm.relatedTo || undefined,
    });
  };

  const handleEditClick = (task: any) => {
    setSelectedTask(task);
    setEditTaskForm({
      title: task.title || "",
      description: task.description || "",
      dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "",
      priority: (task.priority as TaskPriority) || "medium",
      relatedTo: task.relatedTo || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedTask || !editTaskForm.title.trim()) {
      toast.error("Titel er påkrævet");
      return;
    }

    updateTaskMutation.mutate({
      taskId: selectedTask.id,
      title: editTaskForm.title,
      description: editTaskForm.description || undefined,
      dueDate: editTaskForm.dueDate || undefined,
      priority: editTaskForm.priority,
      relatedTo: editTaskForm.relatedTo || undefined,
    });
  };

  const handleDeleteClick = (task: any) => {
    setSelectedTask(task);
    setIsDeleteDialogOpen(true);
  };

  const handleCheckboxChange = (task: any, checked: boolean) => {
    const newStatus: TaskStatus = checked ? "done" : "todo";
    updateStatusMutation.mutate({
      taskId: task.id,
      status: newStatus,
    });
  };

  const handleStatusChange = (taskId: number, newStatus: TaskStatus) => {
    updateStatusMutation.mutate({
      taskId,
      status: newStatus,
    });
  };

  // Multi-select handlers
  const handleTaskSelect = useCallback((taskId: number, checked: boolean) => {
    setSelectedTasks(prev => {
      const next = new Set(prev);
      if (checked) {
        next.add(taskId);
      } else {
        next.delete(taskId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        const allTaskIds = new Set(filteredTasks.map(t => t.id));
        setSelectedTasks(allTaskIds);
      } else {
        setSelectedTasks(new Set());
      }
    },
    [filteredTasks]
  );

  // Clear selection when filters change
  useEffect(() => {
    setSelectedTasks(new Set());
  }, [searchQuery, statusFilter, priorityFilter]);

  const isAllSelected = useMemo(() => {
    if (filteredTasks.length === 0) return false;
    return filteredTasks.every(task => selectedTasks.has(task.id));
  }, [filteredTasks, selectedTasks]);

  const isSomeSelected = useMemo(() => {
    return selectedTasks.size > 0;
  }, [selectedTasks]);

  // Drag & Drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = filteredTasks.find(t => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || active.id === over.id) {
      // If virtualized, force remeasure after drag
      if (shouldVirtualize && virtualizer) {
        virtualizer.measureElement(undefined);
      }
      return;
    }

    // Find which group contains the active task
    let activeGroup: string | null = null;
    let activeIndex = -1;
    let groupTasks: typeof filteredTasks = [];

    if (groupedTasks.overdue.some(t => t.id === active.id)) {
      activeGroup = "overdue";
      activeIndex = groupedTasks.overdue.findIndex(t => t.id === active.id);
      groupTasks = groupedTasks.overdue;
    } else if (groupedTasks.today.some(t => t.id === active.id)) {
      activeGroup = "today";
      activeIndex = groupedTasks.today.findIndex(t => t.id === active.id);
      groupTasks = groupedTasks.today;
    } else if (groupedTasks.upcoming.some(t => t.id === active.id)) {
      activeGroup = "upcoming";
      activeIndex = groupedTasks.upcoming.findIndex(t => t.id === active.id);
      groupTasks = groupedTasks.upcoming;
    } else if (groupedTasks.noDate.some(t => t.id === active.id)) {
      activeGroup = "noDate";
      activeIndex = groupedTasks.noDate.findIndex(t => t.id === active.id);
      groupTasks = groupedTasks.noDate;
    }

    if (!activeGroup || activeIndex === -1) return;

    // Find over group
    let overGroup: string | null = null;
    let overIndex = -1;

    if (groupedTasks.overdue.some(t => t.id === over.id)) {
      overGroup = "overdue";
      overIndex = groupedTasks.overdue.findIndex(t => t.id === over.id);
    } else if (groupedTasks.today.some(t => t.id === over.id)) {
      overGroup = "today";
      overIndex = groupedTasks.today.findIndex(t => t.id === over.id);
    } else if (groupedTasks.upcoming.some(t => t.id === over.id)) {
      overGroup = "upcoming";
      overIndex = groupedTasks.upcoming.findIndex(t => t.id === over.id);
    } else if (groupedTasks.noDate.some(t => t.id === over.id)) {
      overGroup = "noDate";
      overIndex = groupedTasks.noDate.findIndex(t => t.id === over.id);
    }

    // If dragging within same group, just reorder
    if (activeGroup === overGroup && overGroup) {
      const newOrder = arrayMove(groupTasks, activeIndex, overIndex);
      const updates = newOrder.map((task, index) => ({
        taskId: task.id,
        orderIndex: index,
      }));
      bulkUpdateOrderMutation.mutate(updates);
      // Force virtualizer remeasure after reorder
      if (shouldVirtualize && virtualizer) {
        setTimeout(() => {
          virtualizer.measureElement(undefined);
        }, 100);
      }
      return;
    }

    // If dragging to different group, check if we should change status
    if (activeGroup && overGroup && activeGroup !== overGroup) {
      const activeTask = groupTasks[activeIndex];
      if (!activeTask) return;

      // Find the task being dragged over
      let overTask: (typeof filteredTasks)[0] | null = null;
      if (overGroup === "overdue") {
        overTask = groupedTasks.overdue[overIndex] || null;
      } else if (overGroup === "today") {
        overTask = groupedTasks.today[overIndex] || null;
      } else if (overGroup === "upcoming") {
        overTask = groupedTasks.upcoming[overIndex] || null;
      } else if (overGroup === "noDate") {
        overTask = groupedTasks.noDate[overIndex] || null;
      }

      if (overTask && overTask.status !== activeTask.status) {
        // Task is being dragged to a different status group - update status
        updateStatusMutation.mutate({
          taskId: activeTask.id,
          status: overTask.status as TaskStatus,
        });
        toast.success(
          `Task status opdateret til ${STATUS_CONFIG[overTask.status as TaskStatus]?.label}`
        );
        return;
      }

      // If same status, just allow cross-group drag (due date change)
      // This would require updating dueDate, which is more complex
      // For now, only allow status changes via drag
    }
  };

  const getDueDateDisplay = (dueDate: Date | null | undefined) => {
    if (!dueDate) return null;

    const date = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        text: `Overdue: ${format(date, "d. MMM yyyy", { locale: da })}`,
        isOverdue: true,
      };
    } else if (diffDays === 0) {
      return { text: "Due today", isToday: true };
    } else if (diffDays === 1) {
      return { text: "Due tomorrow", isUpcoming: true };
    } else if (diffDays <= 7) {
      return {
        text: `Due ${format(date, "EEEE d. MMM", { locale: da })}`,
        isUpcoming: true,
      };
    } else {
      return {
        text: `Due ${format(date, "d. MMM yyyy", { locale: da })}`,
        isUpcoming: true,
      };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
          <p className="text-sm text-muted-foreground">Indlæser tasks...</p>
        </div>
      </div>
    );
  }

  const hasNoTasks =
    filteredTasks.length === 0 &&
    !isLoading &&
    statusFilter === "all" &&
    priorityFilter === "all" &&
    searchQuery === "";

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Filter Bar */}
      <div className="space-y-3 mb-4 shrink-0">
        {/* Bulk Actions Toolbar */}
        {isSomeSelected && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">
                {selectedTasks.size} task{selectedTasks.size !== 1 ? "s" : ""}{" "}
                valgt
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTasks(new Set())}
                className="h-7 text-xs"
              >
                Ryd valg
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Select
                onValueChange={(status: TaskStatus) => {
                  bulkUpdateStatusMutation.mutate({
                    taskIds: Array.from(selectedTasks),
                    status,
                  });
                }}
                disabled={bulkUpdateStatusMutation.isPending}
              >
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue placeholder="Opdater status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">Markér som To Do</SelectItem>
                  <SelectItem value="in_progress">
                    Markér som In Progress
                  </SelectItem>
                  <SelectItem value="done">Markér som Done</SelectItem>
                  <SelectItem value="cancelled">
                    Markér som Cancelled
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select
                onValueChange={(priority: TaskPriority) => {
                  bulkUpdatePriorityMutation.mutate({
                    taskIds: Array.from(selectedTasks),
                    priority,
                  });
                }}
                disabled={bulkUpdatePriorityMutation.isPending}
              >
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Opdater priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const selectedTasksArray = Array.from(selectedTasks);
                  const selectedTasksData = filteredTasks.filter(t =>
                    selectedTasksArray.includes(t.id)
                  );

                  // Generate CSV
                  const headers = [
                    "Titel",
                    "Beskrivelse",
                    "Status",
                    "Priority",
                    "Due Date",
                    "Created Date",
                  ];
                  const rows = selectedTasksData.map(task => [
                    task.title || "",
                    task.description || "",
                    STATUS_CONFIG[task.status as TaskStatus]?.label ||
                      task.status,
                    PRIORITY_CONFIG[task.priority as TaskPriority]?.label ||
                      task.priority,
                    task.dueDate
                      ? format(new Date(task.dueDate), "dd-MM-yyyy", {
                          locale: da,
                        })
                      : "",
                    task.createdAt
                      ? format(new Date(task.createdAt), "dd-MM-yyyy", {
                          locale: da,
                        })
                      : "",
                  ]);

                  const csvContent = [
                    headers.join(","),
                    ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
                  ].join("\n");

                  const blob = new Blob([csvContent], {
                    type: "text/csv;charset=utf-8;",
                  });
                  const link = document.createElement("a");
                  const url = URL.createObjectURL(blob);
                  link.setAttribute("href", url);
                  link.setAttribute(
                    "download",
                    `tasks-${format(new Date(), "yyyy-MM-dd")}.csv`
                  );
                  link.style.visibility = "hidden";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  toast.success("CSV eksporteret!");
                }}
                className="h-8 text-xs gap-1"
              >
                <Download className="w-3 h-3" />
                Eksportér
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsBulkDeleteDialogOpen(true)}
                className="h-8 text-xs gap-1"
                disabled={bulkDeleteMutation.isPending}
              >
                <Trash2 className="w-3 h-3" />
                Slet valgte
              </Button>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Select All Checkbox */}
          {filteredTasks.length > 0 && (
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={handleSelectAll}
              className="mr-1"
            />
          )}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Søg tasks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Select
            value={statusFilter}
            onValueChange={v => setStatusFilter(v as TaskStatus | "all")}
          >
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <Filter className="w-3 h-3 mr-1.5" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle statuser</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                <SelectItem key={status} value={status}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={priorityFilter}
            onValueChange={v => setPriorityFilter(v as TaskPriority | "all")}
          >
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle prioriteter</SelectItem>
              {Object.entries(PRIORITY_CONFIG).map(([priority, config]) => (
                <SelectItem key={priority} value={priority}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            size="sm"
            className="h-9 text-xs"
          >
            <Plus className="w-3 h-3 mr-1.5" />
            Ny Task
          </Button>
        </div>

        {/* Quick Stats */}
        {taskStats.todo > 0 ||
        taskStats.in_progress > 0 ||
        taskStats.done > 0 ? (
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              To Do: {taskStats.todo}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              In Progress: {taskStats.in_progress}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Done: {taskStats.done}
            </Badge>
          </div>
        ) : null}
      </div>

      {/* Empty State */}
      {hasNoTasks && (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center flex-1">
          <CheckSquare className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Ingen tasks endnu</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            Opret dit første task for at komme i gang. Tasks kan også oprettes
            automatisk via chat eller ved linking til leads/invoices.
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Opret Task
          </Button>
        </div>
      )}

      {/* Task List */}
      {!hasNoTasks && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredTasks.map(t => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {shouldVirtualize ? (
              <div
                ref={scrollableRef}
                className="flex-1 overflow-y-auto min-h-0"
                data-scroll-container
              >
                <div
                  style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative",
                  }}
                >
                  {virtualizer.getVirtualItems().map(virtualItem => {
                    const item = flatTaskList[virtualItem.index];
                    if (!item) return null;

                    if (item.type === "header") {
                      const { label, count, color } = item.data;
                      // Check if this header should be sticky (first item in viewport or at top)
                      const isSticky =
                        virtualItem.start <= 0 || virtualItem.index === 0;
                      return (
                        <div
                          key={`header-${item.group}`}
                          data-index={virtualItem.index}
                          ref={virtualizer.measureElement}
                          style={{
                            position: isSticky ? "sticky" : "absolute",
                            top: isSticky ? "0" : undefined,
                            left: 0,
                            width: "100%",
                            height: `${virtualItem.size}px`,
                            transform: isSticky
                              ? undefined
                              : `translateY(${virtualItem.start}px)`,
                            zIndex: 20,
                          }}
                          className="px-4 py-2 bg-background border-b flex items-center"
                        >
                          <h3
                            className={`text-sm font-semibold flex items-center gap-2 ${
                              color === "destructive"
                                ? "text-destructive"
                                : color === "yellow"
                                  ? "text-yellow-600 dark:text-yellow-400"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {color === "destructive" || color === "yellow" ? (
                              <Clock className="w-4 h-4" />
                            ) : (
                              <Calendar className="w-4 h-4" />
                            )}
                            {label} ({count})
                          </h3>
                        </div>
                      );
                    }

                    const task = item.data;
                    return (
                      <div
                        key={task.id}
                        data-index={virtualItem.index}
                        ref={virtualizer.measureElement}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: `${virtualItem.size}px`,
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                        className="px-4"
                      >
                        <SortableTaskCard
                          task={task}
                          isSelected={selectedTasks.has(task.id)}
                          onSelect={
                            isSomeSelected ? handleTaskSelect : undefined
                          }
                          onCheckboxChange={handleCheckboxChange}
                          onEditClick={handleEditClick}
                          onDeleteClick={handleDeleteClick}
                          onStatusChange={handleStatusChange}
                          getDueDateDisplay={getDueDateDisplay}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div
                ref={scrollableRef}
                className="flex-1 overflow-y-auto space-y-4"
              >
                {/* Overdue Tasks */}
                {groupedTasks.overdue.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-destructive mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Overdue ({groupedTasks.overdue.length})
                    </h3>
                    <div className="space-y-2">
                      {groupedTasks.overdue.map(task => (
                        <SortableTaskCard
                          key={task.id}
                          task={task}
                          isSelected={selectedTasks.has(task.id)}
                          onSelect={
                            isSomeSelected ? handleTaskSelect : undefined
                          }
                          onCheckboxChange={handleCheckboxChange}
                          onEditClick={handleEditClick}
                          onDeleteClick={handleDeleteClick}
                          onStatusChange={handleStatusChange}
                          getDueDateDisplay={getDueDateDisplay}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Due Today */}
                {groupedTasks.today.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Due Today ({groupedTasks.today.length})
                    </h3>
                    <div className="space-y-2">
                      {groupedTasks.today.map(task => (
                        <SortableTaskCard
                          key={task.id}
                          task={task}
                          isSelected={selectedTasks.has(task.id)}
                          onSelect={
                            isSomeSelected ? handleTaskSelect : undefined
                          }
                          onCheckboxChange={handleCheckboxChange}
                          onEditClick={handleEditClick}
                          onDeleteClick={handleDeleteClick}
                          onStatusChange={handleStatusChange}
                          getDueDateDisplay={getDueDateDisplay}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Upcoming */}
                {groupedTasks.upcoming.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Upcoming ({groupedTasks.upcoming.length})
                    </h3>
                    <div className="space-y-2">
                      {groupedTasks.upcoming.map(task => (
                        <SortableTaskCard
                          key={task.id}
                          task={task}
                          isSelected={selectedTasks.has(task.id)}
                          onSelect={
                            isSomeSelected ? handleTaskSelect : undefined
                          }
                          onCheckboxChange={handleCheckboxChange}
                          onEditClick={handleEditClick}
                          onDeleteClick={handleDeleteClick}
                          onStatusChange={handleStatusChange}
                          getDueDateDisplay={getDueDateDisplay}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* No Due Date */}
                {groupedTasks.noDate.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      No Due Date ({groupedTasks.noDate.length})
                    </h3>
                    <div className="space-y-2">
                      {groupedTasks.noDate.map(task => (
                        <SortableTaskCard
                          key={task.id}
                          task={task}
                          isSelected={selectedTasks.has(task.id)}
                          onSelect={
                            isSomeSelected ? handleTaskSelect : undefined
                          }
                          onCheckboxChange={handleCheckboxChange}
                          onEditClick={handleEditClick}
                          onDeleteClick={handleDeleteClick}
                          onStatusChange={handleStatusChange}
                          getDueDateDisplay={getDueDateDisplay}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Filtered Empty State */}
                {filteredTasks.length === 0 && !hasNoTasks && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CheckSquare className="w-10 h-10 text-muted-foreground/50 mb-3" />
                    <p className="text-sm font-medium mb-1">
                      Ingen tasks matcher dine filtre
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Prøv at justere din søgning eller filter kriterier.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchQuery("");
                        setStatusFilter("all");
                        setPriorityFilter("all");
                      }}
                    >
                      Ryd filtre
                    </Button>
                  </div>
                )}
              </div>
            )}
          </SortableContext>

          {activeTask && (
            <DragOverlay>
              <Card className="p-4 shadow-lg opacity-95 bg-background">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{activeTask.title}</p>
                    {activeTask.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {activeTask.description}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </DragOverlay>
          )}
        </DndContext>
      )}

      {/* Create Task Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Opret ny Task
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Opret en ny task for at holde styr på dine opgaver.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                placeholder="Indtast task titel..."
                value={newTaskForm.title}
                onChange={e =>
                  setNewTaskForm({ ...newTaskForm, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Beskrivelse</Label>
              <Textarea
                id="description"
                placeholder="Valgfri beskrivelse..."
                value={newTaskForm.description}
                onChange={e =>
                  setNewTaskForm({
                    ...newTaskForm,
                    description: e.target.value,
                  })
                }
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newTaskForm.dueDate}
                  onChange={e =>
                    setNewTaskForm({ ...newTaskForm, dueDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newTaskForm.priority}
                  onValueChange={v =>
                    setNewTaskForm({
                      ...newTaskForm,
                      priority: v as TaskPriority,
                    })
                  }
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_CONFIG).map(
                      ([priority, config]) => (
                        <SelectItem key={priority} value={priority}>
                          {config.label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="relatedTo">Related To (optional)</Label>
              <Input
                id="relatedTo"
                placeholder="e.g., lead:42 or invoice:123"
                value={newTaskForm.relatedTo}
                onChange={e =>
                  setNewTaskForm({ ...newTaskForm, relatedTo: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Annuller
            </Button>
            <Button
              onClick={handleCreateTask}
              disabled={createTaskMutation.isPending}
            >
              {createTaskMutation.isPending ? "Opretter..." : "Opret Task"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Rediger Task
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Opdater task detaljer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Titel *</Label>
              <Input
                id="edit-title"
                placeholder="Indtast task titel..."
                value={editTaskForm.title}
                onChange={e =>
                  setEditTaskForm({ ...editTaskForm, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Beskrivelse</Label>
              <Textarea
                id="edit-description"
                placeholder="Valgfri beskrivelse..."
                value={editTaskForm.description}
                onChange={e =>
                  setEditTaskForm({
                    ...editTaskForm,
                    description: e.target.value,
                  })
                }
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-dueDate">Due Date</Label>
                <Input
                  id="edit-dueDate"
                  type="date"
                  value={editTaskForm.dueDate}
                  onChange={e =>
                    setEditTaskForm({
                      ...editTaskForm,
                      dueDate: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-priority">Priority</Label>
                <Select
                  value={editTaskForm.priority}
                  onValueChange={v =>
                    setEditTaskForm({
                      ...editTaskForm,
                      priority: v as TaskPriority,
                    })
                  }
                >
                  <SelectTrigger id="edit-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_CONFIG).map(
                      ([priority, config]) => (
                        <SelectItem key={priority} value={priority}>
                          {config.label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-relatedTo">Related To (optional)</Label>
              <Input
                id="edit-relatedTo"
                placeholder="e.g., lead:42 or invoice:123"
                value={editTaskForm.relatedTo}
                onChange={e =>
                  setEditTaskForm({
                    ...editTaskForm,
                    relatedTo: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedTask(null);
              }}
            >
              Annuller
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateTaskMutation.isPending}
            >
              {updateTaskMutation.isPending ? "Opdaterer..." : "Gem Ændringer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
            <AlertDialogDescription>
              Denne handling kan ikke fortrydes. Dette vil permanent slette
              tasken "{selectedTask?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedTask(null)}>
              Annuller
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedTask) {
                  deleteTaskMutation.mutate({ taskId: selectedTask.id });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Slet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog
        open={isBulkDeleteDialogOpen}
        onOpenChange={setIsBulkDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
            <AlertDialogDescription>
              Denne handling kan ikke fortrydes. Dette vil permanent slette{" "}
              {selectedTasks.size} task{selectedTasks.size !== 1 ? "s" : ""}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedTasks(new Set())}>
              Annuller
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                bulkDeleteMutation.mutate({
                  taskIds: Array.from(selectedTasks),
                });
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending
                ? "Sletter..."
                : `Slet ${selectedTasks.size} task${selectedTasks.size !== 1 ? "s" : ""}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Sortable Task Card Component
function SortableTaskCard({
  task,
  isSelected,
  onSelect,
  onCheckboxChange,
  onEditClick,
  onDeleteClick,
  onStatusChange,
  getDueDateDisplay,
}: {
  task: any;
  isSelected?: boolean;
  onSelect?: (taskId: number, checked: boolean) => void;
  onCheckboxChange: (task: any, checked: boolean) => void;
  onEditClick: (task: any) => void;
  onDeleteClick: (task: any) => void;
  onStatusChange: (taskId: number, status: TaskStatus) => void;
  getDueDateDisplay: (dueDate: Date | null | undefined) => {
    text: string;
    isOverdue?: boolean;
    isToday?: boolean;
    isUpcoming?: boolean;
  } | null;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const statusConfig =
    STATUS_CONFIG[task.status as TaskStatus] || STATUS_CONFIG.todo;
  const priorityConfig =
    PRIORITY_CONFIG[task.priority as TaskPriority] || PRIORITY_CONFIG.medium;
  const dueDateDisplay = getDueDateDisplay(task.dueDate);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-4 hover:bg-accent/50 transition-colors ${
        isSelected ? "ring-2 ring-primary" : ""
      } ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
    >
      <div className="flex items-start gap-3">
        <div
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          onClick={e => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </div>
        {onSelect ? (
          <Checkbox
            checked={isSelected || false}
            onCheckedChange={checked => onSelect(task.id, checked === true)}
            className="mt-1"
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <Checkbox
            checked={task.status === "done"}
            onCheckedChange={checked =>
              onCheckboxChange(task, checked === true)
            }
            className="mt-1"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <p
                className={`font-medium ${
                  task.status === "done"
                    ? "line-through text-muted-foreground"
                    : ""
                }`}
              >
                {task.title}
              </p>
              {task.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {task.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={priorityConfig.variant} className="text-xs">
                {priorityConfig.label}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEditClick(task)}>
                    Rediger
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      onStatusChange(
                        task.id,
                        task.status === "todo" ? "in_progress" : "todo"
                      )
                    }
                  >
                    Markér som{" "}
                    {task.status === "todo" ? "In Progress" : "To Do"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onStatusChange(task.id, "done")}
                  >
                    Markér som Done
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDeleteClick(task)}
                    className="text-destructive"
                  >
                    Slet
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {statusConfig.label}
            </Badge>
            {dueDateDisplay && (
              <div
                className={`text-xs flex items-center gap-1 ${
                  dueDateDisplay.isOverdue
                    ? "text-destructive font-medium"
                    : dueDateDisplay.isToday
                      ? "text-yellow-600 dark:text-yellow-400 font-medium"
                      : "text-muted-foreground"
                }`}
              >
                <Calendar className="w-3 h-3" />
                {dueDateDisplay.text}
              </div>
            )}
            {task.relatedTo && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Link2 className="w-3 h-3" />
                {task.relatedTo}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
