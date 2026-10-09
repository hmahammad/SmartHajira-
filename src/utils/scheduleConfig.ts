import { OrganizationScheduleSettings, WorkShift, GeofenceSettings } from '../types';

export const DEFAULT_SHIFTS: WorkShift[] = [
  {
    id: 'shift-morning',
    name: 'Morning Shift',
    nameBangla: 'সকাল শিফট (মর্নিং)',
    code: 'MORNING',
    startTime: '06:00',
    endTime: '14:00',
    dutyDurationHours: 8,
    gracePeriodMinutes: 15,
    halfDayMinutes: 240,
    isOvernight: false,
    activeDays: [0, 1, 2, 3, 4, 6], // Sun, Mon, Tue, Wed, Thu, Sat
    color: 'emerald',
    isActive: true,
  },
  {
    id: 'shift-day',
    name: 'Day / General Shift',
    nameBangla: 'সাধারণ ডে শিফট (জেনারেল)',
    code: 'DAY',
    startTime: '09:00',
    endTime: '17:00',
    dutyDurationHours: 8,
    gracePeriodMinutes: 15,
    halfDayMinutes: 240,
    isOvernight: false,
    activeDays: [0, 1, 2, 3, 4], // Sun to Thu
    color: 'teal',
    isActive: true,
  },
  {
    id: 'shift-evening',
    name: 'Evening Shift',
    nameBangla: 'সন্ধ্যা শিফট (ইভনিং)',
    code: 'EVENING',
    startTime: '14:00',
    endTime: '22:00',
    dutyDurationHours: 8,
    gracePeriodMinutes: 15,
    halfDayMinutes: 240,
    isOvernight: false,
    activeDays: [0, 1, 2, 3, 4, 6],
    color: 'amber',
    isActive: true,
  },
  {
    id: 'shift-night',
    name: 'Night Shift',
    nameBangla: 'নাইট শিফট (রাতের শিফট)',
    code: 'NIGHT',
    startTime: '22:00',
    endTime: '06:00',
    dutyDurationHours: 8,
    gracePeriodMinutes: 15,
    halfDayMinutes: 240,
    isOvernight: true,
    activeDays: [0, 1, 2, 3, 4, 5, 6], // 24/7 night coverage
    color: 'indigo',
    isActive: true,
  }
];

export const DEFAULT_GEOFENCE: GeofenceSettings = {
  latitude: 23.777176,
  longitude: 90.399452,
  radiusMeters: 200,
  locationName: 'প্রধান কার্যালয় / কেন্দ্রীয় ক্যাম্পাস',
  address: 'ধানমন্ডি / ঢাকা জোন, বাংলাদেশ',
  enforceGeofence: true,
  allowRemoteCheckIn: false,
  wifiSsid: 'Office_Staff_5G',
  ipWhitelist: '103.145.0.0/16'
};

export const DEFAULT_SCHEDULE_SETTINGS: OrganizationScheduleSettings = {
  autoDetectShift: true,
  activeShiftId: 'auto',
  shifts: DEFAULT_SHIFTS,
  geofence: DEFAULT_GEOFENCE,
  overtimeEnabled: true,
  overtimeThresholdMinutes: 30,
  overtimeHourlyMultiplier: 1.5,
  weeklyHolidays: [5], // Friday
  autoCheckoutEnabled: true,
  autoCheckoutTime: '23:59',
};

const SCHEDULE_STORAGE_KEY = 'smart_hazira_schedule_settings_v1';

export const getStoredScheduleSettings = (): OrganizationScheduleSettings => {
  try {
    const raw = localStorage.getItem(SCHEDULE_STORAGE_KEY);
    if (!raw) return DEFAULT_SCHEDULE_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SCHEDULE_SETTINGS,
      ...parsed,
      shifts: parsed.shifts && parsed.shifts.length > 0 ? parsed.shifts : DEFAULT_SHIFTS,
      geofence: { ...DEFAULT_GEOFENCE, ...(parsed.geofence || {}) }
    };
  } catch (error) {
    console.error('Error loading schedule settings:', error);
    return DEFAULT_SCHEDULE_SETTINGS;
  }
};

export const saveScheduleSettings = (settings: OrganizationScheduleSettings): void => {
  try {
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving schedule settings:', error);
  }
};

/**
 * Parses "HH:MM" (24h) to total minutes from midnight
 */
export const timeStringToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return 0;
  return parts[0] * 60 + parts[1];
};

/**
 * Calculates current active shift based on current time or fixed selection
 */
export const getCurrentActiveShift = (
  settings: OrganizationScheduleSettings,
  date: Date = new Date()
): WorkShift => {
  const activeShifts = settings.shifts.filter(s => s.isActive);
  if (activeShifts.length === 0) {
    return DEFAULT_SHIFTS[1]; // Fallback to day shift
  }

  // If specific manual shift is selected instead of 'auto'
  if (settings.activeShiftId && settings.activeShiftId !== 'auto') {
    const found = activeShifts.find(s => s.id === settings.activeShiftId);
    if (found) return found;
  }

  const currentMinutes = date.getHours() * 60 + date.getMinutes();

  for (const shift of activeShifts) {
    const startM = timeStringToMinutes(shift.startTime);
    const endM = timeStringToMinutes(shift.endTime);

    if (shift.isOvernight || startM > endM) {
      // Crosses midnight: active if >= startM OR < endM
      if (currentMinutes >= startM || currentMinutes < endM) {
        return shift;
      }
    } else {
      // Standard daytime shift
      if (currentMinutes >= startM && currentMinutes < endM) {
        return shift;
      }
    }
  }

  // If between shifts or exact boundary, return the closest matching or first active shift
  return activeShifts[0];
};

/**
 * Formats 24h time ("09:00", "17:00") into Bengali 12h display ("সকাল ০৯:০০", "বিকাল ০৫:০০")
 */
export const formatTimeInBangla = (time24: string): string => {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const m = mStr || '00';
  if (isNaN(h)) return time24;

  let period = '';
  if (h >= 4 && h < 12) period = 'সকাল';
  else if (h >= 12 && h < 15) period = 'দুপুর';
  else if (h >= 15 && h < 18) period = 'বিকাল';
  else if (h >= 18 && h < 20) period = 'সন্ধ্যা';
  else period = 'রাত';

  const h12 = h % 12 === 0 ? 12 : h % 12;
  const hDisplay = h12 < 10 ? `০${h12}` : `${h12}`.replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[+d]);
  const mDisplay = `${m}`.replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[+d]);

  return `${period} ${hDisplay}:${mDisplay}`;
};

/**
 * Calculates Great-Circle Distance between two coordinates in meters (Haversine formula)
 */
export const calculateDistanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
};

/**
 * Verifies if user position is within configured geofence radius
 */
export const checkGeofenceStatus = (
  userLat: number,
  userLng: number,
  geofence: GeofenceSettings,
  userWifiSSID?: string
): { isWithin: boolean; distanceMeters: number; message: string; wifiValid?: boolean } => {
  if (!geofence.enforceGeofence) {
    return {
      isWithin: true,
      distanceMeters: 0,
      message: 'ম্যানেজমেন্ট এরিয়া বাধ্যবাধকতা বন্ধ রয়েছে (Remote Attendance Allowed)',
      wifiValid: true
    };
  }

  const distance = calculateDistanceMeters(
    userLat,
    userLng,
    geofence.latitude,
    geofence.longitude
  );

  const isWithinGps = distance <= geofence.radiusMeters;
  
  // Wi-Fi validation if specified or required
  const allowedWifis = [
    geofence.wifiSSID,
    geofence.wifiSsid,
    ...(geofence.wifiNetworks || [])
  ].filter(Boolean) as string[];

  let wifiValid = true;
  if (geofence.requireWifi && allowedWifis.length > 0 && userWifiSSID) {
    wifiValid = allowedWifis.some(w => w.toLowerCase() === userWifiSSID.toLowerCase());
  }

  const isWithin = isWithinGps && wifiValid;

  let message = '';
  if (!isWithinGps) {
    message = `সতর্কতা: অফিসের অনুমোদিত সীমার বাইরে (দূরত্ব: ${distance} মি., সর্বোচ্চ অনুমোদিত: ${geofence.radiusMeters} মি.)`;
  } else if (!wifiValid) {
    message = `সতর্কতা: অনুমোদিত অফিস Wi-Fi-তে কানেক্টেড নন (প্রয়োজনীয়: ${allowedWifis.join(', ')})`;
  } else {
    message = `অনুমোদিত ম্যানেজমেন্ট এরিয়া ও Wi-Fi রেঞ্জে অবস্থান করছেন (দূরত্ব: ${distance} মি.)`;
  }

  return { isWithin, distanceMeters: distance, message, wifiValid };
};

/**
 * Preset shift templates for quick 24-hour setup
 */
export const PRESET_SHIFT_TEMPLATES = [
  {
    id: 'tpl-3-shifts',
    name: '৩-শিফট ২৪ ঘণ্টা সিস্টেম (ইন্ডাস্ট্রিয়াল / ফ্যাক্টরি)',
    description: '৮ ঘণ্টা করে ৩টি শিফট: মর্নিং (০৬-১৪), ইভনিং (১৪-২২), নাইট (২২-০৬)',
    shifts: [
      {
        id: 'shift-m-tpl',
        name: 'Morning Shift',
        nameBangla: 'সকাল শিফট',
        code: 'MORNING',
        startTime: '06:00',
        endTime: '14:00',
        dutyDurationHours: 8,
        gracePeriodMinutes: 15,
        halfDayMinutes: 240,
        isOvernight: false,
        activeDays: [0, 1, 2, 3, 4, 5, 6],
        color: 'emerald',
        isActive: true
      },
      {
        id: 'shift-e-tpl',
        name: 'Evening Shift',
        nameBangla: 'সন্ধ্যা শিফট',
        code: 'EVENING',
        startTime: '14:00',
        endTime: '22:00',
        dutyDurationHours: 8,
        gracePeriodMinutes: 15,
        halfDayMinutes: 240,
        isOvernight: false,
        activeDays: [0, 1, 2, 3, 4, 5, 6],
        color: 'amber',
        isActive: true
      },
      {
        id: 'shift-n-tpl',
        name: 'Night Shift',
        nameBangla: 'নাইট শিফট',
        code: 'NIGHT',
        startTime: '22:00',
        endTime: '06:00',
        dutyDurationHours: 8,
        gracePeriodMinutes: 15,
        halfDayMinutes: 240,
        isOvernight: true,
        activeDays: [0, 1, 2, 3, 4, 5, 6],
        color: 'indigo',
        isActive: true
      }
    ]
  },
  {
    id: 'tpl-2-shifts',
    name: '২-শিফট ১২ ঘণ্টা সিস্টেম (সিকিউরিটি / হাসপাতাল)',
    description: '১২ ঘণ্টা করে ২টি শিফট: ডে শিফট (০৮-২০) ও নাইট শিফট (২০-০৮)',
    shifts: [
      {
        id: 'shift-day-12',
        name: 'Day Shift (12h)',
        nameBangla: 'ডে শিফট (১২ ঘণ্টা)',
        code: 'DAY',
        startTime: '08:00',
        endTime: '20:00',
        dutyDurationHours: 12,
        gracePeriodMinutes: 15,
        halfDayMinutes: 360,
        isOvernight: false,
        activeDays: [0, 1, 2, 3, 4, 5, 6],
        color: 'teal',
        isActive: true
      },
      {
        id: 'shift-night-12',
        name: 'Night Shift (12h)',
        nameBangla: 'নাইট শিফট (১২ ঘণ্টা)',
        code: 'NIGHT',
        startTime: '20:00',
        endTime: '08:00',
        dutyDurationHours: 12,
        gracePeriodMinutes: 15,
        halfDayMinutes: 360,
        isOvernight: true,
        activeDays: [0, 1, 2, 3, 4, 5, 6],
        color: 'indigo',
        isActive: true
      }
    ]
  },
  {
    id: 'tpl-1-standard',
    name: 'স্ট্যান্ডার্ড অফিস / স্কুল শিফট (৯টা - ৫টা)',
    description: 'সাধারণ এক শিফট: রবিবার থেকে বৃহস্পতিবার (০৯:০০ - ১৭:০০)',
    shifts: [
      {
        id: 'shift-standard',
        name: 'Standard Office Shift',
        nameBangla: 'সাধারণ ডে শিফট',
        code: 'DAY',
        startTime: '09:00',
        endTime: '17:00',
        dutyDurationHours: 8,
        gracePeriodMinutes: 15,
        halfDayMinutes: 240,
        isOvernight: false,
        activeDays: [0, 1, 2, 3, 4],
        color: 'emerald',
        isActive: true
      }
    ]
  }
];
