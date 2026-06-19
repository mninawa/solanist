export interface BookingCalendarDay {
  day: number | null;
  dateKey: string | null;
  available: boolean;
}

export interface BookingCalendarMonth {
  year: number;
  month: number;
  label: string;
  days: BookingCalendarDay[];
}

/** Build a month grid for booking/reschedule pickers (Mon–Sun, skips weekends, min N days ahead). */
export function buildBookingCalendarMonth(
  monthOffset = 0,
  minDaysAhead = 3,
): BookingCalendarMonth {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + minDaysAhead);

  const anchor = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;

  const days: BookingCalendarDay[] = [];
  for (let i = 0; i < firstWeekday; i++) {
    days.push({ day: null, dateKey: null, available: false });
  }
  for (let d = 1; d <= lastDate; d++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const date = new Date(year, month, d);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    days.push({
      day: d,
      dateKey,
      available: date >= minDate && !isWeekend,
    });
  }

  return {
    year,
    month,
    label: anchor.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' }),
    days,
  };
}

export function firstAvailableBookingDate(minDaysAhead = 3): string {
  for (let offset = 0; offset < 3; offset++) {
    const hit = buildBookingCalendarMonth(offset, minDaysAhead).days.find((d) => d.available);
    if (hit?.dateKey) return hit.dateKey;
  }
  const fallback = new Date();
  fallback.setDate(fallback.getDate() + minDaysAhead);
  return fallback.toISOString().split('T')[0];
}

export function daysUntilDate(date: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date + 'T00:00:00');
  return Math.max(0, Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
}
