/**
 * Utility functions for Bengali digits, time conversions, and stay duration calculations
 */

export function toEnglishDigits(str: string): string {
  if (!str) return '';
  return str.replace(/[০-৯]/g, d => "০১২৩৪৫৬৭৮৯".indexOf(d).toString());
}

export function toBanglaDigits(numOrStr: number | string): string {
  if (numOrStr === undefined || numOrStr === null) return '';
  return numOrStr.toString().replace(/[0-9]/g, d => "০১২৩৪৫৬৭৮৯"[parseInt(d)]);
}

/**
 * Parses a time string (e.g., "09:30:00 AM", "০৯:৩০ AM", "17:45", "05:15 PM") to minutes from midnight
 */
export function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  const eng = toEnglishDigits(timeStr).trim();
  
  const isPM = /pm|অপরাহ্ন|বিকাল|সন্ধ্যা|রাত/i.test(eng);
  const isAM = /am|পূর্বাহ্ন|সকাল|ভোর/i.test(eng);

  // Extract digits and colons
  const match = eng.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  if (isNaN(hours) || isNaN(minutes)) return null;

  if (isPM && hours < 12) {
    hours += 12;
  } else if (isAM && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

/**
 * Formats a duration in minutes into a clean Bengali string like "৭ ঘণ্টা ৩০ মিনিট" or "৪৫ মিনিট"
 */
export function formatDurationBangla(diffMinutes: number): string {
  if (diffMinutes < 0) diffMinutes = 0;
  const hrs = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;

  if (hrs > 0 && mins > 0) {
    return `${toBanglaDigits(hrs)} ঘণ্টা ${toBanglaDigits(mins)} মিনিট`;
  } else if (hrs > 0) {
    return `${toBanglaDigits(hrs)} ঘণ্টা`;
  } else {
    return `${toBanglaDigits(mins)} মিনিট`;
  }
}

/**
 * Calculates the stay duration between entryTime and exitTime
 */
export function calculateStayDuration(entryTime?: string, exitTime?: string): { durationText: string; totalMinutes: number } {
  if (!entryTime || !exitTime) {
    return { durationText: '', totalMinutes: 0 };
  }

  const startMin = parseTimeToMinutes(entryTime);
  const endMin = parseTimeToMinutes(exitTime);

  if (startMin === null || endMin === null) {
    return { durationText: '', totalMinutes: 0 };
  }

  let diffMin = endMin - startMin;
  if (diffMin < 0) {
    // Handled cross-day shift
    diffMin += 24 * 60;
  }

  return {
    durationText: formatDurationBangla(diffMin),
    totalMinutes: diffMin,
  };
}

/**
 * Calculates current live stay duration from entryTime until now
 */
export function calculateCurrentStayDuration(entryTime?: string): { durationText: string; totalMinutes: number } {
  if (!entryTime) {
    return { durationText: '০ মিনিট', totalMinutes: 0 };
  }

  const startMin = parseTimeToMinutes(entryTime);
  if (startMin === null) {
    return { durationText: '০ মিনিট', totalMinutes: 0 };
  }

  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();

  let diffMin = currentMin - startMin;
  if (diffMin < 0) {
    diffMin += 24 * 60;
  }

  return {
    durationText: formatDurationBangla(diffMin),
    totalMinutes: diffMin,
  };
}
