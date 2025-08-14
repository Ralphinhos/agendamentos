import { useBookings } from "@/context/BookingsContext";
import { format } from "date-fns";
import { BookingActions } from "./BookingActions";
import { BookingDialog } from "./BookingDialog";

interface TimeSlotItemProps {
  slot: { period: string; start: string; end: string; label: string };
  date: Date;
}

function formatDateISO(d: Date) {
    return format(d, "yyyy-MM-dd");
}

export function TimeSlotItem({ slot, date }: TimeSlotItemProps) {
  const { getBySlot } = useBookings();
  const dateISO = formatDateISO(date);
  const booked = getBySlot(dateISO, slot.period);

  return (
    <div className="flex items-end justify-between rounded-md border p-3">
      <div className="flex-1">
        <div className="text-xs text-muted-foreground">{slot.label}</div>
        <div className="font-medium">
          {slot.start} – {slot.end}
        </div>
        {booked && (
          <div className="text-xs text-muted-foreground mt-1 space-y-1">
            <p>
              Reservado por <strong>{booked.teacher}</strong>
            </p>
            <p>
              {booked.course} / {booked.discipline}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center">
        {booked ? (
          <BookingActions booking={booked} />
        ) : (
          <BookingDialog slot={slot} date={date} dateISO={dateISO} />
        )}
      </div>
    </div>
  );
}
