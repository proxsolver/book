
// Fix: Use individual imports from sub-modules for better compatibility with different date-fns versions
import format from 'date-fns/format';
import differenceInDays from 'date-fns/differenceInDays';
import parseISO from 'date-fns/parseISO';
import addDays from 'date-fns/addDays';
import ko from 'date-fns/locale/ko';

/**
 * Calculates the number of days since a start date (Day 1 is the start date itself)
 */
export const calculateDayCount = (startDate: string, targetDate: Date = new Date()): number => {
  const start = parseISO(startDate);
  // differenceInDays returns 0 for the same day, so we add 1 for "Day 1"
  return differenceInDays(targetDate, start) + 1;
};

/**
 * Formats a date to YYMMDD(DayOfWeek) e.g., 240520(월)
 */
export const formatNalDuDate = (date: Date): string => {
  return format(date, 'yyMMdd(eee)', { locale: ko });
};

/**
 * Calculates current page range for a book based on the current day
 */
export const calculatePageRange = (startPage: number, dayCount: number, pagesPerDay: number) => {
  const currentStart = startPage + (dayCount - 1) * pagesPerDay;
  const currentEnd = currentStart + pagesPerDay - 1;
  return { start: currentStart, end: currentEnd };
};

/**
 * Standard date string YYYY-MM-DD for storage
 */
export const getTodayStr = (): string => {
  return format(new Date(), 'yyyy-MM-dd');
};