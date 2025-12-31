import { useState } from "react";
import { DayPicker, DateRange } from "react-day-picker";
import { de } from "date-fns/locale";
import { format } from "date-fns";
import "react-day-picker/dist/style.css";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface CustomDatePickerProps {
  onSelect: (range: { from: Date; to: Date } | null) => void;
  selectedRange: { from: Date; to: Date } | null;
}

export function CustomDatePicker({ onSelect, selectedRange }: CustomDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>(
    selectedRange ? { from: selectedRange.from, to: selectedRange.to } : undefined
  );

  const handleSelect = (selectedRange: DateRange | undefined) => {
    setRange(selectedRange);
    if (selectedRange?.from && selectedRange?.to) {
      onSelect({ from: selectedRange.from, to: selectedRange.to });
      setOpen(false);
    }
  };

  const displayText = selectedRange
    ? `${format(selectedRange.from, "dd. MMM yyyy", { locale: de })} - ${format(selectedRange.to, "dd. MMM yyyy", { locale: de })}`
    : "Benutzerdefiniert";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-14 px-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-[#5f2faf]/30 transition-all duration-300 justify-start text-left font-normal"
        >
          <span className="text-sm">{displayText}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card/95 backdrop-blur-xl border-white/10">
        <DialogHeader>
          <DialogTitle>Zeitraum auswählen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center">
          <DayPicker
            mode="range"
            selected={range}
            onSelect={handleSelect}
            locale={de}
            className="rdp-custom"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-medium",
              nav: "space-x-1 flex items-center",
              nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent/50 rounded-md transition-colors",
              day_selected: "bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
              day_today: "bg-accent/20 text-accent-foreground",
              day_outside: "text-muted-foreground opacity-50",
              day_disabled: "text-muted-foreground opacity-50",
              day_range_middle: "aria-selected:bg-accent/50 aria-selected:text-accent-foreground",
              day_hidden: "invisible",
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
