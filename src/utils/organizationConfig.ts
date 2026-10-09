export type OrgCategoryKey = 'educational' | 'corporate' | 'factory' | 'medical' | 'general' | 'somity';

export interface OrgCategoryInfo {
  key: OrgCategoryKey;
  titleBangla: string;
  iconName: string;
  description: string;
  label?: string;
  categoryNameBangla?: string;
  terminology: {
    orgCategoryName: string;
    memberLabel: string;           // e.g. "শিক্ষার্থী" vs "কর্মী / কর্মকর্তা" vs "শ্রমিক"
    memberPlural: string;          // e.g. "শিক্ষার্থীবৃন্দ" vs "স্টাফবৃন্দ" vs "শ্রমিকবৃন্দ"
    adminLabel: string;            // e.g. "শিক্ষক" vs "ম্যানেজার / এডমিন" vs "সুপারভাইজার"
    groupLabel: string;            // e.g. "শ্রেণী" vs "ডিপার্টমেন্ট / টিম" vs "সেকশন / লাইন"
    idLabel: string;               // e.g. "রোল নম্বর" vs "স্টাফ আইডি" vs "কার্ড নম্বর"
    contactLabel: string;          // e.g. "অভিভাবকের ফোন" vs "জরুরী যোগাযোগ নম্বর"
    sessionLabel: string;          // e.g. "ক্লাস" vs "ডিউটি শিফট" vs "কর্মঘণ্টা"
    activityVerb: string;          // e.g. "ক্লাসে উপস্থিত" vs "অফিসে উপস্থিত" vs "কর্মক্ষেত্রে উপস্থিত"
    registerActionText: string;    // e.g. "শিক্ষার্থী নিবন্ধন" vs "কর্মী নিবন্ধন" vs "নতুন সদস্য যোগ"
    roleAdminMode: string;         // e.g. "শিক্ষক মোড" vs "ম্যানেজার মোড" vs "সুপারভাইজার মোড"
    roleMemberMode: string;        // e.g. "শিক্ষার্থী মোড" vs "স্টাফ পোর্টাল" vs "কর্মী মোড"
    roleKioskMode: string;         // e.g. "টার্মিনাল কিওস্ক"
    scannerHint: string;           // e.g. "ক্যামেরার সামনে মুখমণ্ডল রাখুন"
    lowAttendanceWarning: string;  // e.g. "উপস্থিতি ৭৫% এর নিচে"
    companySubtitle?: string;
  };
}

export const ORG_CATEGORIES: Record<OrgCategoryKey, OrgCategoryInfo> = {
  educational: {
    key: 'educational',
    titleBangla: 'শিক্ষা প্রতিষ্ঠান (স্কুল, কলেজ, বিশ্ববিদ্যালয়, মাদরাসা)',
    iconName: 'GraduationCap',
    description: 'শিক্ষার্থী ও শিক্ষকবৃন্দের উপস্থিতি অটোমেশন',
    terminology: {
      orgCategoryName: 'শিক্ষা প্রতিষ্ঠান',
      memberLabel: 'শিক্ষার্থী',
      memberPlural: 'শিক্ষার্থীবৃন্দ',
      adminLabel: 'শিক্ষক',
      groupLabel: 'শ্রেণী / সেকশন',
      idLabel: 'রোল নম্বর',
      contactLabel: 'অভিভাবকের ফোন',
      sessionLabel: 'ক্লাস ও বিষয়',
      activityVerb: 'ক্লাসে উপস্থিত',
      registerActionText: 'নতুন শিক্ষার্থী নিবন্ধন',
      roleAdminMode: 'শিক্ষক মোড',
      roleMemberMode: 'শিক্ষার্থী মোড',
      roleKioskMode: 'হাজিরা কিওস্ক',
      scannerHint: 'শ্রেণীকক্ষ বা গেটে ফেস স্ক্যান করুন',
      lowAttendanceWarning: 'আপনার উপস্থিতি ৭৫% এর নিচে। নিয়মিত ক্লাসে উপস্থিতি প্রয়োজন।',
    },
  },
  corporate: {
    key: 'corporate',
    titleBangla: 'ব্যবসায়ী প্রতিষ্ঠান / কর্পোরেট অফিস / IT কোম্পানি',
    iconName: 'Briefcase',
    description: 'কর্মকর্তা ও কর্মচারীদের স্মার্ট ফেস ইন/আউট ট্র্যাকিং',
    terminology: {
      orgCategoryName: 'কর্পোরেট অফিস / প্রতিষ্ঠান',
      memberLabel: 'কর্মী / কর্মকর্তা',
      memberPlural: 'স্টাফ ও কর্মীবৃন্দ',
      adminLabel: 'ব্যবস্থাপক / এইচআর',
      groupLabel: 'ডিপার্টমেন্ট / টিম',
      idLabel: 'স্টাফ আইডি',
      contactLabel: 'জরুরী নম্বর',
      sessionLabel: 'ডিউটি শিফট',
      activityVerb: 'অফিসে উপস্থিত',
      registerActionText: 'নতুন কর্মকর্তা/স্টাফ যোগ করুন',
      roleAdminMode: 'এডমিন / এইচআর মোড',
      roleMemberMode: 'স্টাফ পোর্টাল',
      roleKioskMode: 'অফিস গেট কিওস্ক',
      scannerHint: 'অফিসের প্রবেশদ্বারে ফেস স্ক্যান করুন',
      lowAttendanceWarning: 'আপনার উপস্থিতি নির্ধারিত লক্ষ্যের নিচে রয়েছে।',
    },
  },
  factory: {
    key: 'factory',
    titleBangla: 'শিল্প কারখানা / গার্মেন্টস / টেক্সটাইল / এম্ব্রয়ডারি',
    iconName: 'Factory',
    description: 'ফ্লোর শ্রমিক ও কারিগরদের দ্রুত শিফট হাজিরা',
    terminology: {
      orgCategoryName: 'গার্মেন্টস / ফ্যাক্টরি',
      memberLabel: 'শ্রমিক / কারিগর',
      memberPlural: 'ফ্লোর শ্রমিকবৃন্দ',
      adminLabel: 'সুপারভাইজার',
      groupLabel: 'সেকশন / ফ্লোর লাইন',
      idLabel: 'কার্ড / টোকেন নম্বর',
      contactLabel: 'যোগাযোগের মোবাইল',
      sessionLabel: 'কর্মঘণ্টা / শিফট',
      activityVerb: 'ফ্লোরে উপস্থিত',
      registerActionText: 'নতুন শ্রমিক অন্তর্ভুক্ত করুন',
      roleAdminMode: 'সুপারভাইজার মোড',
      roleMemberMode: 'শ্রমিক প্রোফাইল',
      roleKioskMode: 'ফ্লোর কিওস্ক',
      scannerHint: 'ফ্লোর এন্ট্রিতে ফেস দেখিয়ে হাজিরা দিন',
      lowAttendanceWarning: 'আপনার শিফট উপস্থিতির হার কম। সুপারভাইজারের সাথে কথা বলুন।',
    },
  },
  medical: {
    key: 'medical',
    titleBangla: 'হাসপাতাল / ক্লিনিক / ডায়াগনস্টিক সেন্টার',
    iconName: 'Building2',
    description: 'ডাক্তার, নার্স ও স্বাস্থ্যকর্মীদের ডিউটি ট্র্যাকিং',
    terminology: {
      orgCategoryName: 'হাসপাতাল / ক্লিনিক',
      memberLabel: 'স্বাস্থ্যকর্মী / নার্স / ডাক্তার',
      memberPlural: 'স্বাস্থ্যকর্মীবৃন্দ',
      adminLabel: 'ইনচার্জ / এডমিন',
      groupLabel: 'ওয়ার্ড / ইউনিট / ডিপার্টমেন্ট',
      idLabel: 'এমপ্লয়ি আইডি',
      contactLabel: 'জরুরী যোগাযোগ',
      sessionLabel: 'রোস্টার / ডিউটি সময়',
      activityVerb: 'ডিউটিতে উপস্থিত',
      registerActionText: 'নতুন স্টাফ নিবন্ধন',
      roleAdminMode: 'ইনচার্জ মোড',
      roleMemberMode: 'স্টাফ পোর্টাল',
      roleKioskMode: 'হাসপাতাল কিওস্ক',
      scannerHint: 'ডিউটিতে প্রবেশের সময় ফেস স্ক্যান করুন',
      lowAttendanceWarning: 'ডিউটি উপস্থিতির হার নির্ধারিত মানের নিচে।',
    },
  },
  general: {
    key: 'general',
    titleBangla: 'দোকান / শোরুম / অন্যান্য ব্যবসা প্রতিষ্ঠান',
    iconName: 'Store',
    description: 'কর্মচারী ও বিক্রয়কর্মীদের দৈনন্দিন হাজিরা',
    terminology: {
      orgCategoryName: 'ব্যবসা প্রতিষ্ঠান / শোরুম',
      memberLabel: 'কর্মচারী / স্টাফ',
      memberPlural: 'কর্মচারীবৃন্দ',
      adminLabel: 'স্বত্বাধিকারী / ম্যানেজার',
      groupLabel: 'শাখা / কাউন্টার',
      idLabel: 'স্টাফ আইডি',
      contactLabel: 'ফোন নম্বর',
      sessionLabel: 'কর্মঘণ্টা',
      activityVerb: 'প্রতিষ্ঠানে উপস্থিত',
      registerActionText: 'নতুন কর্মচারী যুক্ত করুন',
      roleAdminMode: 'ম্যানেজার মোড',
      roleMemberMode: 'কর্মচারী মোড',
      roleKioskMode: 'হাজিরা টার্মিনাল',
      scannerHint: 'প্রবেশ মুখে ফেস স্ক্যান করুন',
      lowAttendanceWarning: 'আপনার উপস্থিতি দিনসমূহ হিসাব করা হচ্ছে।',
    },
  },
  somity: {
    key: 'somity',
    titleBangla: 'নাগরিক সমিতি / সমবায় / বহুমুখী সঞ্চয় ও ঋণ সমিতি',
    iconName: 'Users',
    description: 'সদস্যদের সভা হাজিরা, সঞ্চয় জমা, ঋণ কিস্তি ও জরিমানার হিসাব',
    terminology: {
      orgCategoryName: 'নাগরিক সমিতি ও সমবায়',
      memberLabel: 'সমিতি সদস্য',
      memberPlural: 'সমিতির সদস্যবৃন্দ',
      adminLabel: 'সভাপতি / সাধারণ সম্পাদক / কোষাধ্যক্ষ',
      groupLabel: 'সমিতি শাখা / জোন',
      idLabel: 'সদস্য বই নং / পাসবুক',
      contactLabel: 'মোবাইল নম্বর',
      sessionLabel: 'সাধারণ সভা / কিস্তি আদায়',
      activityVerb: 'সভায় উপস্থিত',
      registerActionText: 'নতুন সদস্য ভর্তি করুন',
      roleAdminMode: 'সমিতি এডমিন মোড',
      roleMemberMode: 'সদস্য পাসবুক পোর্টাল',
      roleKioskMode: 'সভা হাজিরা ডেস্ক',
      scannerHint: 'সভায় উপস্থিতির জন্য ফেস/QR স্ক্যান করুন',
      lowAttendanceWarning: 'আপনার সমিতির সাধারণ সভায় উপস্থিতি নির্দেশিকা অনুযায়ী নিশ্চিত করুন।',
    },
  },
};

// Ensure backwards compatibility properties are populated
Object.keys(ORG_CATEGORIES).forEach((k) => {
  const cat = ORG_CATEGORIES[k as OrgCategoryKey];
  cat.label = cat.titleBangla;
  cat.categoryNameBangla = cat.titleBangla;
  if (!cat.terminology.companySubtitle) {
    cat.terminology.companySubtitle = cat.description;
  }
});

const ORG_STORAGE_KEY = 'smart_hazira_selected_org_category_v1';

export const getStoredOrgCategory = (): OrgCategoryKey => {
  const stored = localStorage.getItem(ORG_STORAGE_KEY) as OrgCategoryKey | null;
  if (stored && ORG_CATEGORIES[stored]) {
    return stored;
  }
  return 'educational'; // Default
};

export const saveOrgCategory = (categoryKey: OrgCategoryKey) => {
  localStorage.setItem(ORG_STORAGE_KEY, categoryKey);
};
