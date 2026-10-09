import React from 'react';
import { 
  Camera, 
  MapPin, 
  UserPlus, 
  QrCode, 
  MessageSquare, 
  ShieldAlert, 
  Download, 
  CheckCheck, 
  Users, 
  BarChart3, 
  LayoutDashboard, 
  Building2, 
  Layers, 
  ChevronRight, 
  X, 
  SlidersHorizontal,
  Clock,
  Contact2,
  LogOut,
  Cpu,
  Fingerprint
} from 'lucide-react';
import { OrgCategoryInfo } from '../utils/organizationConfig';
import { UserRole } from '../types';

interface NavigationMenuProps {
  currentRole: UserRole;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  orgInfo: OrgCategoryInfo;
  onOpenFaceScanner?: () => void;
  onOpenGeofenceModal?: () => void;
  onOpenRegisterModal?: () => void;
  onOpenSmartIdCard?: () => void;
  onOpenSmsModal?: () => void;
  onOpenAuditLog?: () => void;
  onOpenAttendanceLinkModal?: () => void;
  onOpenScheduleSettings?: () => void;
  onOpenZKTecoDeviceModal?: () => void;
  onOpenFingerprintScanner?: () => void;
  onExportCSV?: () => void;
  onMarkAllPresent?: () => void;
  onOpenOrgSelector?: () => void;
  onRoleChange?: (role: UserRole) => void;
  onSignOut?: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const NavigationMenu: React.FC<NavigationMenuProps> = ({
  currentRole,
  activeTab = 'dashboard',
  onSelectTab,
  orgInfo,
  onOpenFaceScanner,
  onOpenGeofenceModal,
  onOpenRegisterModal,
  onOpenSmartIdCard,
  onOpenSmsModal,
  onOpenAuditLog,
  onOpenAttendanceLinkModal,
  onOpenScheduleSettings,
  onOpenZKTecoDeviceModal,
  onOpenFingerprintScanner,
  onExportCSV,
  onMarkAllPresent,
  onOpenOrgSelector,
  onRoleChange,
  onSignOut,
  isOpen,
  onClose,
}) => {
  const { terminology, key: orgKey } = orgInfo;

  if (!isOpen) return null;

  const handleAction = (callback?: () => void) => {
    if (callback) {
      callback();
      onClose();
    }
  };

  const handleTabSwitch = (tab: string) => {
    if (onSelectTab) {
      onSelectTab(tab);
      onClose();
    }
  };

  const isStudentRole = currentRole === 'student';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      {/* Overlay click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Menu Drawer Container */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col z-10 animate-slideLeft overflow-hidden">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-2xl text-slate-950 shadow-md">
              {isStudentRole ? <Contact2 className="w-5 h-5 stroke-[2.5]" /> : <Layers className="w-5 h-5 stroke-[2.5]" />}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{isStudentRole ? 'কর্মী মেনু ও সুবিধা' : 'অ্যাপ্লিকেশন মেনু ও টুলস'}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isStudentRole ? 'ব্যক্তিগত হাজিরা, আইডি কার্ড ও বায়োমেট্রিক টুলস' : 'সকল মডিউল ও ফিচার (একবারই তালিকাভুক্ত)'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body Scroll Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* STUDENT EXCLUSIVE VIEW */}
          {isStudentRole ? (
            <div className="space-y-4">
              
              <div className="space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  আমার প্রয়োজনীয় মেনু ও হাজিরা
                </span>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      if (onSelectTab) onSelectTab('dashboard');
                      onClose();
                    }}
                    className="w-full p-3.5 bg-slate-900 dark:bg-emerald-600 text-white rounded-2xl flex items-center justify-between shadow-md transition cursor-pointer text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white/20 rounded-xl">
                        <LayoutDashboard className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-xs">আমার উপস্থিতি ড্যাশবোর্ড</p>
                        <p className="text-[11px] text-emerald-100">আজকের হাজিরা ও উপস্থিতি সামারি</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/70" />
                  </button>

                  {onOpenFaceScanner && (
                    <button
                      onClick={() => handleAction(onOpenFaceScanner)}
                      className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-emerald-500 text-slate-950 rounded-xl shadow-xs">
                          <Camera className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-900 dark:text-white">AI ফেস ক্যামেরা হাজিরা</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">ক্যামেরা দিয়ে তাৎক্ষণিক ফেস স্ক্যান</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  )}

                  {onOpenGeofenceModal && (
                    <button
                      onClick={() => handleAction(onOpenGeofenceModal)}
                      className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 rounded-xl">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-900 dark:text-white">GPS অফিস লোকেশন হাজিরা</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">অফিস সীমানা ও লোকেশন ভেরিফিকেশন</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  )}

                  {onOpenSmartIdCard && (
                    <button
                      onClick={() => handleAction(onOpenSmartIdCard)}
                      className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl">
                          <Contact2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-900 dark:text-white">আমার ডিজিটাল আইডি কার্ড</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">QR কোড ও বারকোড সহ ডিজিটাল কার্ড</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* Sign out section for employee */}
              {onSignOut && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => handleAction(onSignOut)}
                    className="w-full p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 rounded-2xl flex items-center justify-center space-x-2 font-bold text-xs hover:bg-red-100 dark:hover:bg-red-900/50 transition cursor-pointer"
                  >
                    <span>লগআউট / প্রস্থান করুন</span>
                  </button>
                </div>
              )}

            </div>
          ) : (
            <>
              {/* COMPANY ADMIN EXCLUSIVE VIEW */}
              {/* Section 1: Main Views & Tabs */}
              {currentRole === 'teacher' && onSelectTab && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      প্রধান ড্যাশবোর্ড ও শিফট
                    </span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                      {activeTab}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleTabSwitch('dashboard')}
                      className={`p-3 rounded-2xl border text-left transition flex items-center space-x-2.5 cursor-pointer ${
                        activeTab === 'dashboard'
                          ? 'bg-slate-900 dark:bg-emerald-600 text-white border-transparent shadow-md'
                          : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-500/40'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4 shrink-0 text-emerald-400" />
                      <div className="truncate">
                        <p className="font-bold text-xs">উপস্থিতি ড্যাশবোর্ড</p>
                        <p className="text-[10px] opacity-70">দৈনিক লাইভ হাজিরা</p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleTabSwitch('users')}
                      className={`p-3 rounded-2xl border text-left transition flex items-center space-x-2.5 cursor-pointer ${
                        activeTab === 'users'
                          ? 'bg-slate-900 dark:bg-emerald-600 text-white border-transparent shadow-md'
                          : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-500/40'
                      }`}
                    >
                      <Users className="w-4 h-4 shrink-0 text-teal-400" />
                      <div className="truncate">
                        <p className="font-bold text-xs">{terminology.memberLabel} তালিকা</p>
                        <p className="text-[10px] opacity-70">প্রোফাইল ও ফেস ডাটা</p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleTabSwitch('schedule')}
                      className={`p-3 rounded-2xl border text-left transition flex items-center space-x-2.5 cursor-pointer ${
                        activeTab === 'schedule'
                          ? 'bg-slate-900 dark:bg-emerald-600 text-white border-transparent shadow-md'
                          : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-500/40'
                      }`}
                    >
                      <Clock className="w-4 h-4 shrink-0 text-emerald-400" />
                      <div className="truncate">
                        <p className="font-bold text-xs">শিফট ও লোকেশন সেটিংস</p>
                        <p className="text-[10px] opacity-70">কাজের সময় ও অফিস সীমানা</p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleTabSwitch('analytics')}
                      className={`p-3 rounded-2xl border text-left transition flex items-center space-x-2.5 cursor-pointer ${
                        activeTab === 'analytics'
                          ? 'bg-slate-900 dark:bg-emerald-600 text-white border-transparent shadow-md'
                          : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-500/40'
                      }`}
                    >
                      <BarChart3 className="w-4 h-4 shrink-0 text-cyan-400" />
                      <div className="truncate">
                        <p className="font-bold text-xs">রিপোর্ট ও এনালিটিক্স</p>
                        <p className="text-[10px] opacity-70">উপস্থিতি পরিসংখ্যান</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Section 2: Mobile Face Attendance Tools */}
              <div className="space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  মোবাইল ফেস হাজিরা
                </span>

                <div className="space-y-1.5">
                  {onOpenFaceScanner && (
                    <button
                      onClick={() => handleAction(onOpenFaceScanner)}
                      className="w-full p-3.5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-500/40 rounded-2xl flex items-center justify-between hover:bg-emerald-500/20 transition cursor-pointer text-left shadow-xs"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2.5 bg-emerald-500 text-slate-950 rounded-xl shadow-xs font-bold">
                          <Camera className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-900 dark:text-slate-100">মোবাইল ফেস স্ক্যানার</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">ক্যামেরা ধরে তাৎক্ষণিক স্বয়ংক্রিয় হাজিরা</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-emerald-500" />
                    </button>
                  )}

                  {onOpenZKTecoDeviceModal && (
                    <button
                      onClick={() => handleAction(onOpenZKTecoDeviceModal)}
                      className="w-full p-3 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-teal-500/10 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-500/30 rounded-2xl flex items-center justify-between hover:bg-blue-500/20 transition cursor-pointer text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
                          <Cpu className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-900 dark:text-slate-100">ZKTeco ডিভাইস ও ক্লাউড ADMS</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">মেশিন স্ট্যাটাস, পুশ সংযোগ ও পাঞ্চ লগ সিঙ্ক</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-blue-500" />
                    </button>
                  )}

                  {onOpenFingerprintScanner && (
                    <button
                      onClick={() => handleAction(onOpenFingerprintScanner)}
                      className="w-full p-3 bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-teal-500/10 dark:from-teal-950/40 dark:to-emerald-950/40 border border-teal-500/30 rounded-2xl flex items-center justify-between hover:bg-teal-500/20 transition cursor-pointer text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-teal-600 text-white rounded-xl shadow-xs">
                          <Fingerprint className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-900 dark:text-slate-100">ফিঙ্গারপ্রিন্ট ও বায়োমেট্রিক সেন্সর</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">USB অপটিক্যাল স্ক্যানার ও পাসকি বায়োমেট্রিক</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-teal-500" />
                    </button>
                  )}

                  {onOpenAttendanceLinkModal && (
                    <button
                      onClick={() => handleAction(onOpenAttendanceLinkModal)}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                          <QrCode className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-900 dark:text-slate-100">পাবলিক হাজিরা কিউআর ও পোর্টাল</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">কর্মীদের নিজের মোবাইলে হাজিরা দেওয়ার লিংক</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  )}

                  {onMarkAllPresent && (
                    <button
                      onClick={() => handleAction(onMarkAllPresent)}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                          <CheckCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-900 dark:text-slate-100">এক ক্লিকে সবাইকে উপস্থিত করুন</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">বর্তমান শিফটের সবাইকে প্রেজেন্ট মার্ক করুন</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* Section 3: Management & Utilities */}
              <div className="space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  কর্মী ও ইউটিলিটি টুলস
                </span>

                <div className="space-y-1.5">
                  {onOpenRegisterModal && (
                    <button
                      onClick={() => handleAction(onOpenRegisterModal)}
                      className="w-full p-3 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl flex items-center justify-between hover:bg-slate-800 dark:hover:bg-slate-700 transition cursor-pointer text-left shadow-sm"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-emerald-500 text-slate-950 rounded-xl">
                          <UserPlus className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-xs">{terminology.registerActionText}</p>
                          <p className="text-[11px] text-slate-400">নতুন স্টাফ বা কর্মী নিবন্ধন ও ফেস আইডি</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  )}

                  {onOpenSmartIdCard && (
                    <button
                      onClick={() => handleAction(onOpenSmartIdCard)}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                          <Contact2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-900 dark:text-slate-100">ডিজিটাল স্মার্ট আইডি কার্ড</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">QR কোড ও বারকোড সহ প্রিন্টযোগ্য আইডি</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  )}

                  {onOpenSmsModal && (
                    <button
                      onClick={() => handleAction(onOpenSmsModal)}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-900 dark:text-slate-100">WhatsApp ও SMS নোটিফিকেশন</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">উপস্থিতি ও অনুপস্থিতির এসএমএস এলার্ট</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  )}

                  {onOpenAuditLog && (
                    <button
                      onClick={() => handleAction(onOpenAuditLog)}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl">
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-900 dark:text-slate-100">সিকিউরিটি অডিট ও লগস</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">সিস্টেমের সকল পরিবর্তন ও লগইন ট্রেইল</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  )}

                  {onExportCSV && (
                    <button
                      onClick={() => handleAction(onExportCSV)}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-slate-500/20 text-slate-700 dark:text-slate-300 rounded-xl">
                          <Download className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-900 dark:text-slate-100">হাজিরা রিপোর্ট CSV ডাউনলোড</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">এক্সেল ফরম্যাটে ডাটা এক্সপোর্ট করুন</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* Section 4: Role Switcher & System Settings */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  সিস্টেম ও রোল নেভিগেশন
                </span>

                <div className="grid grid-cols-2 gap-2">
                  {onOpenOrgSelector && (
                    <button
                      onClick={() => handleAction(onOpenOrgSelector)}
                      className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-left flex items-center space-x-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                    >
                      <Building2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div className="truncate">
                        <p className="font-bold text-xs text-slate-900 dark:text-white">প্রতিষ্ঠানের ধরণ</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{terminology.orgCategoryName}</p>
                      </div>
                    </button>
                  )}

                  {onRoleChange && (
                    <button
                      onClick={() => { onRoleChange('kiosk'); onClose(); }}
                      className="p-3 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 rounded-2xl text-left flex items-center space-x-2 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 transition cursor-pointer"
                    >
                      <SlidersHorizontal className="w-4 h-4 text-cyan-500 shrink-0" />
                      <div className="truncate">
                        <p className="font-bold text-xs text-cyan-900 dark:text-cyan-200">কিয়স্ক মোড</p>
                        <p className="text-[10px] text-cyan-600 dark:text-cyan-400">ফুল-স্ক্রিন হাজিরা</p>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

        </div>

        {/* Drawer Footer with Universal Logout Button */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col gap-2.5">
          {onSignOut && (
            <button
              type="button"
              onClick={() => handleAction(onSignOut)}
              className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl flex items-center justify-center space-x-2 font-bold text-xs shadow-md shadow-rose-600/20 transition cursor-pointer active:scale-98"
            >
              <LogOut className="w-4 h-4 text-white shrink-0" />
              <span>লগআউট (Log Out)</span>
            </button>
          )}
          <div className="text-center text-xs text-slate-400">
            {isStudentRole ? 'স্মার্ট হাজিরা AI • কর্মী এক্সেস পোর্টাল' : 'স্মার্ট হাজিরা AI • প্রতিষ্ঠান ব্যবস্থাপনা'}
          </div>
        </div>

      </div>
    </div>
  );
};

