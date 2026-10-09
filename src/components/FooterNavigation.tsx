import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  QrCode, 
  BarChart3, 
  User,
  Camera,
  Fingerprint,
  Menu,
  Clock
} from 'lucide-react';
import { OrgCategoryInfo } from '../utils/organizationConfig';
import { UserRole } from '../types';

interface FooterNavigationProps {
  currentRole: UserRole;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  orgInfo: OrgCategoryInfo;
  onOpenFaceScanner?: () => void;
  onOpenNavMenu?: () => void;
  onOpenProfileModal?: () => void;
  onOpenFingerprintScanner?: () => void;
  onOpenRegisterModal?: () => void;
  onOpenAttendanceLinkModal?: () => void;
  onOpenSmartIdCard?: () => void;
}

export const FooterNavigation: React.FC<FooterNavigationProps> = ({
  currentRole,
  activeTab,
  onSelectTab,
  orgInfo,
  onOpenFaceScanner,
  onOpenFingerprintScanner,
  onOpenNavMenu,
  onOpenProfileModal,
  onOpenAttendanceLinkModal,
  onOpenSmartIdCard,
}) => {
  const { terminology } = orgInfo;
  const isStudentRole = currentRole === 'student';

  if (isStudentRole) {
    return (
      <footer 
        id="bottom-footer-navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] transition-all"
      >
        <div className="max-w-xl sm:max-w-2xl mx-auto px-3 sm:px-6">
          <div className="grid grid-cols-5 items-center h-16 sm:h-18">
            
            {/* Item 1: আমার হাজিরা */}
            <button
              id="footer-nav-student-dashboard"
              onClick={() => onSelectTab('dashboard')}
              title="আমার উপস্থিতি ও হাজিরা কার্ড"
              className={`group relative flex flex-col items-center justify-center py-1 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'text-emerald-700 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {activeTab === 'dashboard' && (
                <span className="absolute inset-x-2 inset-y-0.5 bg-emerald-50 border border-emerald-200 rounded-xl shadow-2xs" />
              )}
              <div className="relative z-10 flex items-center justify-center">
                <LayoutDashboard className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                  activeTab === 'dashboard' ? 'text-emerald-700 stroke-[2.4]' : 'text-slate-500 stroke-[1.8]'
                }`} />
              </div>
              <span className={`text-[11px] leading-tight mt-1 z-10 truncate ${
                activeTab === 'dashboard' ? 'text-emerald-800 font-bold' : 'text-slate-500'
              }`}>
                আমার হাজিরা
              </span>
            </button>

            {/* Item 2: ফেস ক্যামেরা */}
            <button
              id="footer-nav-student-face"
              onClick={onOpenFaceScanner}
              title="AI ফেস ক্যামেরা হাজিরা"
              className="group relative flex flex-col items-center justify-center py-1 rounded-2xl transition-all cursor-pointer text-slate-500 hover:text-emerald-700"
            >
              <div className="relative z-10 flex items-center justify-center">
                <Camera className="w-5 h-5 transition-transform group-hover:scale-110 stroke-[1.8]" />
              </div>
              <span className="text-[11px] leading-tight mt-1 z-10 truncate text-slate-500 group-hover:text-emerald-700 font-medium">
                ফেস ক্যামেরা
              </span>
            </button>

            {/* Item 3 (CENTER): মোবাইল ফেস হাজিরা অ্যাকশন বাটন */}
            <div className="flex items-center justify-center -mt-5 sm:-mt-6 relative">
              <button
                id="footer-action-face-attendance"
                type="button"
                onClick={onOpenFaceScanner}
                title="মোবাইল ফেস হাজিরা দিন"
                className="relative group p-3.5 sm:p-4 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black shadow-lg shadow-emerald-600/30 border-4 border-white transition-all duration-200 cursor-pointer active:scale-95 flex flex-col items-center justify-center"
              >
                <span className="absolute -inset-1 rounded-full bg-emerald-500/20 animate-pulse" />
                <div className="relative z-10 flex items-center justify-center">
                  <Camera className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.6] text-white" />
                </div>
              </button>
              <span className="absolute -bottom-4 text-[10px] font-black text-emerald-700 tracking-tight whitespace-nowrap">
                হাজিরা দিন
              </span>
            </div>

            {/* Item 4: ডিজিটাল স্মার্ট আইডি কার্ড */}
            <button
              id="footer-nav-student-idcard"
              onClick={onOpenSmartIdCard}
              title="আমার ডিজিটাল আইডি কার্ড"
              className="group relative flex flex-col items-center justify-center py-1 rounded-2xl transition-all cursor-pointer text-slate-500 hover:text-emerald-700"
            >
              <div className="relative z-10 flex items-center justify-center">
                <QrCode className="w-5 h-5 transition-transform group-hover:scale-110 stroke-[1.8]" />
              </div>
              <span className="text-[11px] leading-tight mt-1 z-10 truncate text-slate-500 group-hover:text-emerald-700 font-medium">
                আইডি কার্ড
              </span>
            </button>

            {/* Item 5: কর্মী মেনু */}
            <button
              id="footer-action-student-menu"
              type="button"
              onClick={onOpenNavMenu}
              title="কর্মী মেনু ও অপশন"
              className="group relative flex flex-col items-center justify-center py-1 rounded-2xl transition-all cursor-pointer text-slate-500 hover:text-slate-900"
            >
              <div className="relative z-10 flex items-center justify-center">
                <div className="p-1 rounded-full group-hover:bg-slate-100 transition">
                  <Menu className="w-5 h-5 transition-transform group-hover:scale-110 text-slate-500 group-hover:text-emerald-700 stroke-[1.8]" />
                </div>
              </div>
              <span className="text-[11px] leading-tight mt-0.5 z-10 truncate text-slate-500 group-hover:text-emerald-700 font-medium">
                মেনু
              </span>
            </button>

          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer 
      id="bottom-footer-navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] transition-all"
    >
      <div className="max-w-xl sm:max-w-2xl mx-auto px-3 sm:px-6">
        {/* Exactly 5 balanced Navigation Columns */}
        <div className="grid grid-cols-5 items-center h-16 sm:h-18">
          
          {/* Item 1: ড্যাশবোর্ড / হাজিরা */}
          <button
            id="footer-nav-dashboard"
            onClick={() => onSelectTab('dashboard')}
            title="হাজিরা ও ড্যাশবোর্ড"
            className={`group relative flex flex-col items-center justify-center py-1 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'text-emerald-700 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {activeTab === 'dashboard' && (
              <span className="absolute inset-x-2 inset-y-0.5 bg-emerald-50 border border-emerald-200 rounded-xl shadow-2xs" />
            )}
            <div className="relative z-10 flex items-center justify-center">
              <LayoutDashboard className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                activeTab === 'dashboard' ? 'text-emerald-700 stroke-[2.4]' : 'text-slate-500 stroke-[1.8]'
              }`} />
            </div>
            <span className={`text-[11px] leading-tight mt-1 z-10 truncate ${
              activeTab === 'dashboard' ? 'text-emerald-800 font-bold' : 'text-slate-500'
            }`}>
              হাজিরা
            </span>
          </button>

          {/* Item 2: সদস্য তালিকা */}
          <button
            id="footer-nav-users"
            onClick={() => onSelectTab('users')}
            title={`${terminology.memberLabel} ও বায়োমেট্রিক ডিরেক্টরি`}
            className={`group relative flex flex-col items-center justify-center py-1 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'text-emerald-700 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {activeTab === 'users' && (
              <span className="absolute inset-x-2 inset-y-0.5 bg-emerald-50 border border-emerald-200 rounded-xl shadow-2xs" />
            )}
            <div className="relative z-10 flex items-center justify-center">
              <Users className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                activeTab === 'users' ? 'text-emerald-700 stroke-[2.4]' : 'text-slate-500 stroke-[1.8]'
              }`} />
            </div>
            <span className={`text-[11px] leading-tight mt-1 z-10 truncate ${
              activeTab === 'users' ? 'text-emerald-800 font-bold' : 'text-slate-500'
            }`}>
              {terminology.memberLabel}
            </span>
          </button>

          {/* Item 3 (CENTER): লাইভ ফেস স্ক্যানার বাটন */}
          <div className="flex items-center justify-center -mt-5 sm:-mt-6 relative">
            <button
              id="footer-action-face-scanner"
              type="button"
              onClick={onOpenFaceScanner}
              title="মোবাইল ক্যামেরা দিয়ে লাইভ ফেস হাজিরা গ্রহণ"
              className="relative group p-3.5 sm:p-4 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black shadow-lg shadow-emerald-600/30 border-4 border-white transition-all duration-200 cursor-pointer active:scale-95 flex flex-col items-center justify-center"
            >
              {/* Pulsing ring */}
              <span className="absolute -inset-1 rounded-full bg-emerald-500/20 animate-pulse" />
              
              <div className="relative z-10 flex items-center justify-center">
                <Camera className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.6] text-white" />
              </div>
            </button>
            <span className="absolute -bottom-4 text-[10px] font-black text-emerald-700 tracking-tight whitespace-nowrap">
              ফেস স্ক্যান
            </span>
          </div>

          {/* Item 4: শিফট সেটিংস (কয়টা থেকে কয়টা) */}
          <button
            id="footer-nav-schedule"
            onClick={() => onSelectTab('schedule')}
            title="শিফট তৈরি ও কাজের সময় সেটিংস"
            className={`group relative flex flex-col items-center justify-center py-1 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'schedule'
                ? 'text-emerald-700 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {activeTab === 'schedule' && (
              <span className="absolute inset-x-2 inset-y-0.5 bg-emerald-50 border border-emerald-200 rounded-xl shadow-2xs" />
            )}
            <div className="relative z-10 flex items-center justify-center">
              <Clock className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                activeTab === 'schedule' ? 'text-emerald-700 stroke-[2.4]' : 'text-slate-500 stroke-[1.8]'
              }`} />
            </div>
            <span className={`text-[11px] leading-tight mt-1 z-10 truncate ${
              activeTab === 'schedule' ? 'text-emerald-800 font-bold' : 'text-slate-500'
            }`}>
              শিফট
            </span>
          </button>

          {/* Item 5: মেনু */}
          <button
            id="footer-action-menu"
            type="button"
            onClick={onOpenNavMenu}
            title="মেনু ও অন্যান্য টুলস"
            className="group relative flex flex-col items-center justify-center py-1 rounded-2xl transition-all cursor-pointer text-slate-500 hover:text-slate-900"
          >
            <div className="relative z-10 flex items-center justify-center">
              <div className="p-1 rounded-full group-hover:bg-slate-100 transition">
                <Menu className="w-5 h-5 transition-transform group-hover:scale-110 text-slate-500 group-hover:text-emerald-700 stroke-[1.8]" />
              </div>
            </div>
            <span className="text-[11px] leading-tight mt-0.5 z-10 truncate text-slate-500 group-hover:text-emerald-700 font-medium">
              মেনু
            </span>
          </button>

        </div>
      </div>
    </footer>
  );
};
