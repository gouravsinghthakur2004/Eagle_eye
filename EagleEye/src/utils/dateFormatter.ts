/**
 * Centralized Date Formatter Utility for EagleEye
 * Formats dates consistently across the entire app into DD MMM YYYY format.
 * Examples: '15 May 1992', '31 Dec 2030', '12 Aug 2027'
 */

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const formatDate = (rawDate?: string | Date | null): string => {
  if (!rawDate) return '';

  let d: Date;
  if (rawDate instanceof Date) {
    d = rawDate;
  } else {
    const cleanStr = String(rawDate).trim();
    if (!cleanStr || cleanStr === '17' || /^\d{1,2}$/.test(cleanStr)) return '';

    // Check if string is already formatted as DD MMM YYYY (e.g. '15 May 1992')
    const ddMmmYyyyRegex = /^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}$/;
    if (ddMmmYyyyRegex.test(cleanStr)) {
      return cleanStr;
    }

    // Extract only date portion if date-time string (e.g. '2026-09-10 17:00:00' -> '2026-09-10')
    const dateOnlyStr = cleanStr.includes('T') ? cleanStr.split('T')[0] : cleanStr.split(' ')[0];
    const parts = dateOnlyStr.split(/[-/]/);
    if (parts.length === 3) {
      let year: number;
      let month: number;
      let day: number;

      if (parts[0].length === 4) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
      } else {
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        year = parseInt(parts[2], 10);
      }

      if (!isNaN(year) && !isNaN(month) && !isNaN(day) && month >= 0 && month < 12 && day >= 1 && day <= 31) {
        const dayStr = day.toString().padStart(2, '0');
        const monthStr = MONTHS[month];
        return `${dayStr} ${monthStr} ${year}`;
      }
    }

    // Try parsing ISO or standard date formats
    const timestamp = Date.parse(cleanStr.replace(/-/g, '/'));
    if (!isNaN(timestamp)) {
      d = new Date(timestamp);
    } else {
      d = new Date(cleanStr);
    }
  }

  if (isNaN(d.getTime())) {
    return '';
  }

  const year = d.getFullYear();
  if (year < 1920 || year > 2100) return '';

  const day = d.getDate().toString().padStart(2, '0');
  const month = MONTHS[d.getMonth()];

  return `${day} ${month} ${year}`;
};

export const parseFormattedDate = (formattedStr: string): Date | null => {
  if (!formattedStr) return null;
  const d = new Date(formattedStr);
  return isNaN(d.getTime()) ? null : d;
};
