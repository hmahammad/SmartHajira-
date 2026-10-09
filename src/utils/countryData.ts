/**
 * Country Data, ISO Codes, Timezones and Regional Localization
 * for Smart Hazira (স্মার্ট হাজিরা)
 */

export interface CountryInfo {
  code: string; // ISO 3166-1 alpha-2 (e.g., 'BD', 'SA', 'AE')
  nameBangla: string;
  nameEnglish: string;
  dialCode: string; // e.g., '+880'
  flag: string; // Emoji flag
  timezone: string; // Primary IANA timezone (e.g., 'Asia/Dhaka')
  availableTimezones: string[];
  currencyCode: string; // e.g., 'BDT'
  currencySymbol: string; // e.g., '৳'
  addressPlaceholder: string;
  phoneFormatHint: string;
}

export const COUNTRIES_LIST: CountryInfo[] = [
  {
    code: 'BD',
    nameBangla: 'বাংলাদেশ',
    nameEnglish: 'Bangladesh',
    dialCode: '+880',
    flag: '🇧🇩',
    timezone: 'Asia/Dhaka',
    availableTimezones: ['Asia/Dhaka'],
    currencyCode: 'BDT',
    currencySymbol: '৳',
    addressPlaceholder: 'বাড়ি/রোড, ধানমন্ডি, ঢাকা-১২০৫',
    phoneFormatHint: '01XXXXXXXXX (১০ ডিজিট)'
  },
  {
    code: 'SA',
    nameBangla: 'সৌদি আরব',
    nameEnglish: 'Saudi Arabia',
    dialCode: '+966',
    flag: '🇸🇦',
    timezone: 'Asia/Riyadh',
    availableTimezones: ['Asia/Riyadh'],
    currencyCode: 'SAR',
    currencySymbol: 'ر.س',
    addressPlaceholder: 'কিং ফাহাদ রোড, রিয়াদ',
    phoneFormatHint: '5XXXXXXXX (৯ ডিজিট)'
  },
  {
    code: 'AE',
    nameBangla: 'সংযুক্ত আরব আমিরাত (ইউএই)',
    nameEnglish: 'United Arab Emirates',
    dialCode: '+971',
    flag: '🇦🇪',
    timezone: 'Asia/Dubai',
    availableTimezones: ['Asia/Dubai'],
    currencyCode: 'AED',
    currencySymbol: 'د.إ',
    addressPlaceholder: 'শেখ জায়েদ রোড, দুবাই',
    phoneFormatHint: '5XXXXXXXX (৯ ডিজিট)'
  },
  {
    code: 'QA',
    nameBangla: 'কাতার',
    nameEnglish: 'Qatar',
    dialCode: '+974',
    flag: '🇶🇦',
    timezone: 'Asia/Qatar',
    availableTimezones: ['Asia/Qatar'],
    currencyCode: 'QAR',
    currencySymbol: 'ر.ق',
    addressPlaceholder: 'ওয়েস্ট বে, দোহা',
    phoneFormatHint: 'XXXXXXXX (৮ ডিজিট)'
  },
  {
    code: 'KW',
    nameBangla: 'কুয়েত',
    nameEnglish: 'Kuwait',
    dialCode: '+965',
    flag: '🇰🇼',
    timezone: 'Asia/Kuwait',
    availableTimezones: ['Asia/Kuwait'],
    currencyCode: 'KWD',
    currencySymbol: 'د.ك',
    addressPlaceholder: 'কুয়েত সিটি',
    phoneFormatHint: 'XXXXXXXX (৮ ডিজিট)'
  },
  {
    code: 'OM',
    nameBangla: 'ওমান',
    nameEnglish: 'Oman',
    dialCode: '+968',
    flag: '🇴🇲',
    timezone: 'Asia/Muscat',
    availableTimezones: ['Asia/Muscat'],
    currencyCode: 'OMR',
    currencySymbol: 'ر.ع.',
    addressPlaceholder: 'মাস্কাট',
    phoneFormatHint: 'XXXXXXXX (৮ ডিজিট)'
  },
  {
    code: 'MY',
    nameBangla: 'মালয়েশিয়া',
    nameEnglish: 'Malaysia',
    dialCode: '+60',
    flag: '🇲🇾',
    timezone: 'Asia/Kuala_Lumpur',
    availableTimezones: ['Asia/Kuala_Lumpur', 'Asia/Kuching'],
    currencyCode: 'MYR',
    currencySymbol: 'RM',
    addressPlaceholder: 'কুয়ালালামপুর',
    phoneFormatHint: '1XXXXXXXXX'
  },
  {
    code: 'SG',
    nameBangla: 'সিঙ্গাপুর',
    nameEnglish: 'Singapore',
    dialCode: '+65',
    flag: '🇸🇬',
    timezone: 'Asia/Singapore',
    availableTimezones: ['Asia/Singapore'],
    currencyCode: 'SGD',
    currencySymbol: 'S$',
    addressPlaceholder: 'মেরিনা বে, সিঙ্গাপুর',
    phoneFormatHint: 'XXXXXXXX (৮ ডিজিট)'
  },
  {
    code: 'IN',
    nameBangla: 'ভারত',
    nameEnglish: 'India',
    dialCode: '+91',
    flag: '🇮🇳',
    timezone: 'Asia/Kolkata',
    availableTimezones: ['Asia/Kolkata'],
    currencyCode: 'INR',
    currencySymbol: '₹',
    addressPlaceholder: 'কলকাতা / নয়াদিল্লি',
    phoneFormatHint: 'XXXXXXXXXX (১০ ডিজিট)'
  },
  {
    code: 'PK',
    nameBangla: 'পাকিস্তান',
    nameEnglish: 'Pakistan',
    dialCode: '+92',
    flag: '🇵🇰',
    timezone: 'Asia/Karachi',
    availableTimezones: ['Asia/Karachi'],
    currencyCode: 'PKR',
    currencySymbol: 'Rs',
    addressPlaceholder: 'করাচি / লাহোর',
    phoneFormatHint: '3XXXXXXXXX'
  },
  {
    code: 'GB',
    nameBangla: 'যুক্তরাজ্য (ইউকে)',
    nameEnglish: 'United Kingdom',
    dialCode: '+44',
    flag: '🇬🇧',
    timezone: 'Europe/London',
    availableTimezones: ['Europe/London'],
    currencyCode: 'GBP',
    currencySymbol: '£',
    addressPlaceholder: 'লন্ডন, যুক্তরাজ্য',
    phoneFormatHint: '7XXXXXXXXX'
  },
  {
    code: 'US',
    nameBangla: 'যুক্তরাষ্ট্র (ইউএসএ)',
    nameEnglish: 'United States',
    dialCode: '+1',
    flag: '🇺🇸',
    timezone: 'America/New_York',
    availableTimezones: [
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'America/Anchorage',
      'Pacific/Honolulu'
    ],
    currencyCode: 'USD',
    currencySymbol: '$',
    addressPlaceholder: 'নিউ ইয়র্ক, এনওয়াই, ইউএসএ',
    phoneFormatHint: 'XXX-XXX-XXXX'
  },
  {
    code: 'CA',
    nameBangla: 'কানাডা',
    nameEnglish: 'Canada',
    dialCode: '+1',
    flag: '🇨🇦',
    timezone: 'America/Toronto',
    availableTimezones: [
      'America/Toronto',
      'America/Vancouver',
      'America/Edmonton',
      'America/Halifax'
    ],
    currencyCode: 'CAD',
    currencySymbol: 'CA$',
    addressPlaceholder: 'টরন্টো, ওন্টারিও',
    phoneFormatHint: 'XXX-XXX-XXXX'
  },
  {
    code: 'AU',
    nameBangla: 'অস্ট্রেলিয়া',
    nameEnglish: 'Australia',
    dialCode: '+61',
    flag: '🇦🇺',
    timezone: 'Australia/Sydney',
    availableTimezones: [
      'Australia/Sydney',
      'Australia/Melbourne',
      'Australia/Brisbane',
      'Australia/Perth'
    ],
    currencyCode: 'AUD',
    currencySymbol: 'A$',
    addressPlaceholder: 'সিডনি, নিউ সাউথ ওয়েলস',
    phoneFormatHint: '4XXXXXXXX'
  },
  {
    code: 'DE',
    nameBangla: 'জার্মানি',
    nameEnglish: 'Germany',
    dialCode: '+49',
    flag: '🇩🇪',
    timezone: 'Europe/Berlin',
    availableTimezones: ['Europe/Berlin'],
    currencyCode: 'EUR',
    currencySymbol: '€',
    addressPlaceholder: 'বার্লিন, জার্মানি',
    phoneFormatHint: '1XXXXXXXXXX'
  },
  {
    code: 'FR',
    nameBangla: 'ফ্রান্স',
    nameEnglish: 'France',
    dialCode: '+33',
    flag: '🇫🇷',
    timezone: 'Europe/Paris',
    availableTimezones: ['Europe/Paris'],
    currencyCode: 'EUR',
    currencySymbol: '€',
    addressPlaceholder: 'প্যারিস, ফ্রান্স',
    phoneFormatHint: '6XXXXXXXX'
  },
  {
    code: 'IT',
    nameBangla: 'ইতালি',
    nameEnglish: 'Italy',
    dialCode: '+39',
    flag: '🇮🇹',
    timezone: 'Europe/Rome',
    availableTimezones: ['Europe/Rome'],
    currencyCode: 'EUR',
    currencySymbol: '€',
    addressPlaceholder: 'রোম, ইতালি',
    phoneFormatHint: '3XXXXXXXXX'
  },
  {
    code: 'JP',
    nameBangla: 'জাপান',
    nameEnglish: 'Japan',
    dialCode: '+81',
    flag: '🇯🇵',
    timezone: 'Asia/Tokyo',
    availableTimezones: ['Asia/Tokyo'],
    currencyCode: 'JPY',
    currencySymbol: '¥',
    addressPlaceholder: 'টোকিও, জাপান',
    phoneFormatHint: '90XXXXXXXX'
  },
  {
    code: 'KR',
    nameBangla: 'দক্ষিণ কোরিয়া',
    nameEnglish: 'South Korea',
    dialCode: '+82',
    flag: '🇰🇷',
    timezone: 'Asia/Seoul',
    availableTimezones: ['Asia/Seoul'],
    currencyCode: 'KRW',
    currencySymbol: '₩',
    addressPlaceholder: 'সিউল, দক্ষিণ কোরিয়া',
    phoneFormatHint: '10XXXXXXXX'
  },
  {
    code: 'TR',
    nameBangla: 'তুরস্ক',
    nameEnglish: 'Turkey',
    dialCode: '+90',
    flag: '🇹🇷',
    timezone: 'Europe/Istanbul',
    availableTimezones: ['Europe/Istanbul'],
    currencyCode: 'TRY',
    currencySymbol: '₺',
    addressPlaceholder: 'ইস্তাম্বুল, তুরস্ক',
    phoneFormatHint: '5XXXXXXXXX'
  },
  {
    code: 'EG',
    nameBangla: 'মিশর',
    nameEnglish: 'Egypt',
    dialCode: '+20',
    flag: '🇪🇬',
    timezone: 'Africa/Cairo',
    availableTimezones: ['Africa/Cairo'],
    currencyCode: 'EGP',
    currencySymbol: 'E£',
    addressPlaceholder: 'কায়রো, মিশর',
    phoneFormatHint: '1XXXXXXXXX'
  }
];

export const DEFAULT_COUNTRY: CountryInfo = COUNTRIES_LIST[0]; // Bangladesh

export function findCountryByCode(code?: string): CountryInfo {
  if (!code) return DEFAULT_COUNTRY;
  const match = COUNTRIES_LIST.find(
    (c) => c.code.toUpperCase() === code.toUpperCase()
  );
  return match || DEFAULT_COUNTRY;
}

export function searchCountries(query: string): CountryInfo[] {
  const q = query.trim().toLowerCase();
  if (!q) return COUNTRIES_LIST;

  return COUNTRIES_LIST.filter(
    (c) =>
      c.nameBangla.toLowerCase().includes(q) ||
      c.nameEnglish.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.dialCode.toLowerCase().includes(q) ||
      c.timezone.toLowerCase().includes(q)
  );
}

/**
 * Format a Date or timestamp string in the company's designated timezone.
 * Underlying timestamps are stored as ISO/UTC; this guarantees that changing
 * timezone does not corrupt or shift the true instant of historical punches.
 */
export function formatInCompanyTimezone(
  dateOrIso: Date | string | number,
  timezone: string = 'Asia/Dhaka',
  formatOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }
): string {
  try {
    const d = typeof dateOrIso === 'string' || typeof dateOrIso === 'number' 
      ? new Date(dateOrIso) 
      : dateOrIso;
    
    if (isNaN(d.getTime())) return '';

    return new Intl.DateTimeFormat('bn-BD', {
      timeZone: timezone,
      ...formatOptions,
    }).format(d);
  } catch (err) {
    // Fallback if browser does not recognize the timezone string
    return new Date(dateOrIso).toLocaleTimeString('bn-BD');
  }
}

/**
 * Get current date string (YYYY-MM-DD) in the specified timezone
 */
export function getCurrentDateInTimezone(timezone: string = 'Asia/Dhaka'): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(now); // Produces YYYY-MM-DD
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}
