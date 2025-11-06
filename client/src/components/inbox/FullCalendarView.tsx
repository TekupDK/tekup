import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { useMemo } from "react";

interface FullCalendarViewProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  events: any[] | undefined;
}

const getEventTimes = (event: any) => {
  const startTime = event.start?.dateTime || event.start?.date || event.start;
  const endTime =
    event.end?.dateTime || event.end?.date || event.end || startTime;
  return { startTime, endTime };
};

const isAllDayEvent = (event: any) => {
  const { startTime, endTime } = getEventTimes(event);
  return (
    typeof startTime === "string" &&
    typeof endTime === "string" &&
    !startTime.includes("T") &&
    !endTime.includes("T")
  );
};

export default function FullCalendarView({
  selectedDate,
  onSelectDate,
  events,
}: FullCalendarViewProps) {
  const dayEvents = useMemo(() => {
    if (!events) return [] as any[];
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);
    return events.filter((event: any) => {
      const { startTime, endTime } = getEventTimes(event);
      if (!startTime) return false;
      const eventStart = new Date(startTime);
      const eventEnd = new Date(endTime);
      return eventStart < endOfDay && eventEnd > startOfDay;
    });
  }, [events, selectedDate]);

  const allDayEvents = useMemo(
    () => dayEvents.filter(isAllDayEvent),
    [dayEvents]
  );
  const timedEvents = useMemo(
    () => dayEvents.filter(e => !isAllDayEvent(e)),
    [dayEvents]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="border rounded-lg p-3 bg-background">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={d => d && onSelectDate(d)}
          showOutsideDays
        />
        <div className="flex justify-end mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelectDate(new Date())}
          >
            I dag
          </Button>
        </div>
      </div>

      <div className="border rounded-lg p-3 bg-background">
        <div className="text-sm font-medium mb-2">
          Begivenheder for den valgte dag
        </div>

        {allDayEvents.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-muted-foreground mb-1">
              Heldagsbegivenheder
            </div>
            <div className="flex flex-wrap gap-2">
              {allDayEvents.map((e: any) => (
                <span key={e.id} className="text-xs px-2 py-1 rounded border">
                  {e.summary || "(uden titel)"}
                </span>
              ))}
            </div>
          </div>
        )}

        <Separator className="my-2" />

        <div className="space-y-2">
          {timedEvents.length === 0 && allDayEvents.length === 0 && (
            <div className="text-sm text-muted-foreground">
              Ingen events på denne dag
            </div>
          )}
          {timedEvents
            .map(e => {
              const { startTime, endTime } = getEventTimes(e);
              return { e, startTime, endTime };
            })
            .sort(
              (a, b) =>
                new Date(a.startTime).getTime() -
                new Date(b.startTime).getTime()
            )
            .map(({ e, startTime, endTime }) => (
              <div
                key={e.id}
                className="flex items-center justify-between text-sm p-2 rounded border"
              >
                <div className="truncate">
                  <div className="font-medium truncate">
                    {e.summary || "(uden titel)"}
                  </div>
                  <div className="text-muted-foreground">
                    {new Date(startTime).toLocaleTimeString("da-DK", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" - "}
                    {new Date(endTime).toLocaleTimeString("da-DK", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
