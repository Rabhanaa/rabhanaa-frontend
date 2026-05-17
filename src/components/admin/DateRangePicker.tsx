import { DatePicker } from './DatePicker';

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onStartChange: (d: Date | null) => void;
  onEndChange: (d: Date | null) => void;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
}: DateRangePickerProps) {
  function handleEndChange(date: Date | null) {
    if (date && startDate && date < startDate) {
      onEndChange(startDate);
    } else {
      onEndChange(date);
    }
  }

  return (
    <div className="flex gap-2">
      <DatePicker value={startDate} onChange={onStartChange} placeholder="تاريخ البداية" />
      <DatePicker value={endDate} onChange={handleEndChange} placeholder="تاريخ النهاية" />
    </div>
  );
}
