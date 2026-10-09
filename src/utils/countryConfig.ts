export interface CountryInfo {
  nameBangla: string;
  nameEnglish: string;
  iso2: string; // ISO 3166-1 alpha-2
  iso3: string; // ISO 3166-1 alpha-3
  dialCode: string; // e.g. +880
  timezone: string; // e.g. Asia/Dhaka
  currency: string;
  flag: string;
}

export const COUNTRIES: CountryInfo[] = [
  {
    nameBangla: 'বাংলাদেশ',
    nameEnglish: 'Bangladesh',
    iso2: 'BD',
    iso3: 'BGD',
    dialCode: '+880',
    timezone: 'Asia/Dhaka',
    currency: 'BDT',
    flag: '🇧🇩'
  },
  {
    nameBangla: 'সৌদি আরব',
    nameEnglish: 'Saudi Arabia',
    iso2: 'SA',
    iso3: 'SAU',
    dialCode: '+966',
    timezone: 'Asia/Riyadh',
    currency: 'SAR',
    flag: '🇸🇦'
  },
  {
    nameBangla: 'সংযুক্ত আরব আমিরাত (ইউএই)',
    nameEnglish: 'United Arab Emirates',
    iso2: 'AE',
    iso3: 'ARE',
    dialCode: '+971',
    timezone: 'Asia/Dubai',
    currency: 'AED',
    flag: '🇦🇪'
  },
  {
    nameBangla: 'কাতার',
    nameEnglish: 'Qatar',
    iso2: 'QA',
    iso3: 'QAT',
    dialCode: '+974',
    timezone: 'Asia/Qatar',
    currency: 'QAR',
    flag: '🇶🇦'
  },
  {
    nameBangla: 'কুয়েত',
    nameEnglish: 'Kuwait',
    iso2: 'KW',
    iso3: 'KWT',
    dialCode: '+965',
    timezone: 'Asia/Kuwait',
    currency: 'KWD',
    flag: '🇰🇼'
  },
  {
    nameBangla: 'ওমান',
    nameEnglish: 'Oman',
    iso2: 'OM',
    iso3: 'OMN',
    dialCode: '+968',
    timezone: 'Asia/Muscat',
    currency: 'OMR',
    flag: '🇴🇲'
  },
  {
    nameBangla: 'মালয়েশিয়া',
    nameEnglish: 'Malaysia',
    iso2: 'MY',
    iso3: 'MYS',
    dialCode: '+60',
    timezone: 'Asia/Kuala_Lumpur',
    currency: 'MYR',
    flag: '🇲🇾'
  },
  {
    nameBangla: 'সিঙ্গাপুর',
    nameEnglish: 'Singapore',
    iso2: 'SG',
    iso3: 'SGP',
    dialCode: '+65',
    timezone: 'Asia/Singapore',
    currency: 'SGD',
    flag: '🇸🇬'
  },
  {
    nameBangla: 'ভারত',
    nameEnglish: 'India',
    iso2: 'IN',
    iso3: 'IND',
    dialCode: '+91',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    flag: '🇮🇳'
  },
  {
    nameBangla: 'যুক্তরাষ্ট্র (ইউএসএ)',
    nameEnglish: 'United States',
    iso2: 'US',
    iso3: 'USA',
    dialCode: '+1',
    timezone: 'America/New_York',
    currency: 'USD',
    flag: '🇺🇸'
  },
  {
    nameBangla: 'যুক্তরাজ্য (ইউকে)',
    nameEnglish: 'United Kingdom',
    iso2: 'GB',
    iso3: 'GBR',
    dialCode: '+44',
    timezone: 'Europe/London',
    currency: 'GBP',
    flag: '🇬🇧'
  },
  {
    nameBangla: 'কানাডা',
    nameEnglish: 'Canada',
    iso2: 'CA',
    iso3: 'CAN',
    dialCode: '+1',
    timezone: 'America/Toronto',
    currency: 'CAD',
    flag: '🇨🇦'
  },
  {
    nameBangla: 'অস্ট্রেলিয়া',
    nameEnglish: 'Australia',
    iso2: 'AU',
    iso3: 'AUS',
    dialCode: '+61',
    timezone: 'Australia/Sydney',
    currency: 'AUD',
    flag: '🇦🇺'
  },
  {
    nameBangla: 'জার্মানি',
    nameEnglish: 'Germany',
    iso2: 'DE',
    iso3: 'DEU',
    dialCode: '+49',
    timezone: 'Europe/Berlin',
    currency: 'EUR',
    flag: '🇩🇪'
  },
  {
    nameBangla: 'ফ্রান্স',
    nameEnglish: 'France',
    iso2: 'FR',
    iso3: 'FRA',
    dialCode: '+33',
    timezone: 'Europe/Paris',
    currency: 'EUR',
    flag: '🇫🇷'
  },
  {
    nameBangla: 'ইতালি',
    nameEnglish: 'Italy',
    iso2: 'IT',
    iso3: 'ITA',
    dialCode: '+39',
    timezone: 'Europe/Rome',
    currency: 'EUR',
    flag: '🇮🇹'
  },
  {
    nameBangla: 'জাপান',
    nameEnglish: 'Japan',
    iso2: 'JP',
    iso3: 'JPN',
    dialCode: '+81',
    timezone: 'Asia/Tokyo',
    currency: 'JPY',
    flag: '🇯🇵'
  },
  {
    nameBangla: 'দক্ষিণ কোরিয়া',
    nameEnglish: 'South Korea',
    iso2: 'KR',
    iso3: 'KOR',
    dialCode: '+82',
    timezone: 'Asia/Seoul',
    currency: 'KRW',
    flag: '🇰🇷'
  },
  {
    nameBangla: 'চীন',
    nameEnglish: 'China',
    iso2: 'CN',
    iso3: 'CHN',
    dialCode: '+86',
    timezone: 'Asia/Shanghai',
    currency: 'CNY',
    flag: '🇨🇳'
  },
  {
    nameBangla: 'তুরস্ক',
    nameEnglish: 'Turkey',
    iso2: 'TR',
    iso3: 'TUR',
    dialCode: '+90',
    timezone: 'Europe/Istanbul',
    currency: 'TRY',
    flag: '🇹🇷'
  },
  {
    nameBangla: 'বাহরাইন',
    nameEnglish: 'Bahrain',
    iso2: 'BH',
    iso3: 'BHR',
    dialCode: '+973',
    timezone: 'Asia/Bahrain',
    currency: 'BHD',
    flag: '🇧🇭'
  },
  {
    nameBangla: 'পাকিস্তান',
    nameEnglish: 'Pakistan',
    iso2: 'PK',
    iso3: 'PAK',
    dialCode: '+92',
    timezone: 'Asia/Karachi',
    currency: 'PKR',
    flag: '🇵🇰'
  }
];

export const DEFAULT_COUNTRY: CountryInfo = COUNTRIES[0]; // Bangladesh

export function getCountryByIso2(iso2?: string): CountryInfo {
  if (!iso2) return DEFAULT_COUNTRY;
  const found = COUNTRIES.find(c => c.iso2.toUpperCase() === iso2.toUpperCase());
  return found || DEFAULT_COUNTRY;
}

export function searchCountries(query: string): CountryInfo[] {
  const q = query.trim().toLowerCase();
  if (!q) return COUNTRIES;
  return COUNTRIES.filter(c => 
    c.nameBangla.toLowerCase().includes(q) ||
    c.nameEnglish.toLowerCase().includes(q) ||
    c.iso2.toLowerCase().includes(q) ||
    c.iso3.toLowerCase().includes(q) ||
    c.dialCode.includes(q)
  );
}
