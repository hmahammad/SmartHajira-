import React from 'react';
import { 
  Camera, 
  Menu,
  LogOut
} from 'lucide-react';
import { OrgCategoryInfo } from '../utils/organizationConfig';
import { RegisteredCompany, UserRole } from '../types';
import { User as FirebaseUser } from 'firebase/auth';

interface CompanyAdminNavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  orgInfo: OrgCategoryInfo;
  activeCompany: RegisteredCompany | null;
  currentUser: FirebaseUser | null;
  isFirebaseConnected?: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenOrgSelector: () => void;
  onOpenFaceScanner: () => void;
  onOpenRegisterModal: () => void;
  onOpenProfileModal: () => void;
  onOpenAuditLog: () => void;
  onOpenSmsModal: () => void;
  onOpenAttendanceLinkModal: () => void;
  onOpenScheduleSettings?: () => void;
  activeShiftTitle?: string;
  onOpenNavigationMenu?: () => void;
  onSignOut: () => void;
}

export const CompanyAdminNavbar: React.FC<CompanyAdminNavbarProps> = ({
  orgInfo,
  activeCompany,
  isFirebaseConnected = true,
  onOpenNavigationMenu,
  onSignOut,
}) => {
  const { terminology } = orgInfo;

  return (
    <nav className="bg-white border-b border-slate-200 text-slate-900 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Clean, Minimal Header Row */}
        <div className="flex items-center justify-between h-15 sm:h-16 gap-3">
          
          {/* Brand Logo, Header Name & Description */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-600 p-0.5 shadow-md shadow-emerald-500/20 shrink-0">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                <Camera className="w-5 h-5 text-emerald-600" />
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 flex items-center gap-1.5">
                  <span className="text-emerald-700">
                    {activeCompany?.nameBangla || 'স্মার্ট হাজিরা AI'}
                  </span>
                  <span className="text-slate-500 text-xs font-normal hidden md:inline">
                    | {activeCompany?.nameBangla ? terminology.orgCategoryName : 'এডমিন প্যানেল'}
                  </span>
                </h1>
              </div>

              <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{terminology.companySubtitle || 'ডিজিটাল বায়োমেট্রিক ও শিফট হাজিরা ম্যানেজমেন্ট'}</span>
                {isFirebaseConnected && (
                  <span className="text-emerald-600 font-mono hidden sm:inline">&bull; ক্লাউড সিঙ্ক</span>
                )}
              </p>
            </div>
          </div>

          {/* Clean Menu and Logout Icons on Right */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={onOpenNavigationMenu}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 border border-slate-300 hover:border-emerald-500/40 transition cursor-pointer flex items-center space-x-1.5 shadow-2xs"
              title="মেইন মেনু - সকল মডিউল, শিফট, অডিট ও সেটিংস"
            >
              <Menu className="w-5 h-5 text-emerald-600" />
              <span className="hidden sm:inline font-bold text-xs">মেনু</span>
            </button>

            {onSignOut && (
              <button
                onClick={onSignOut}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 border border-rose-200 transition cursor-pointer flex items-center space-x-1.5 shadow-2xs"
                title="লগআউট / প্রস্থান করুন"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span className="hidden sm:inline font-bold text-xs">লগআউট</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </nav>
  );
};
