import React, { useState, useRef, useEffect } from 'react';
import { RegisteredCompany, Student, UserRole, CompanyFingerprintMethod } from '../types';
import { OrgCategoryKey, ORG_CATEGORIES } from '../utils/organizationConfig';
import { COUNTRIES_LIST, findCountryByCode, searchCountries, CountryInfo } from '../utils/countryData';
import { signInWithGoogle, signOutUser } from '../lib/firebase';
import { User } from 'firebase/auth';
import { 
  Building2, 
  UserPlus, 
  LogIn, 
  ShieldCheck, 
  Users, 
  X, 
  GraduationCap, 
  Briefcase, 
  Factory, 
  Store, 
  Phone, 
  Mail, 
  Key, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  Shield,
  LogOut,
  Loader2,
  Zap,
  ExternalLink,
  AlertTriangle,
  Globe,
  Search,
  Fingerprint,
  Cpu,
  HardDrive,
  Smartphone,
  ChevronDown,
  Info
} from 'lucide-react';

interface AuthRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: RegisteredCompany[];
  students: Student[];
  onAddCompany: (company: RegisteredCompany) => void;
  onAddMemberToCompany?: (memberData: Partial<Student>, companyId: string) => void;
  onRoleChange: (role: UserRole) => void;
  onSelectCompany: (company: RegisteredCompany) => void;
  onSelectLoggedInStudent: (student: Student) => void;
  orgCategory: OrgCategoryKey;
  currentUser?: User | null;
  currentRole?: UserRole;
  isCompanyLoggedIn?: boolean;
  onSetCurrentUser?: (user: User) => void;
}

export const AuthRegistrationModal: React.FC<AuthRegistrationModalProps> = ({
  isOpen,
  onClose,
  companies,
  students,
  onAddCompany,
  onRoleChange,
  onSelectCompany,
  onSelectLoggedInStudent,
  currentUser,
  onSetCurrentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register_company'>('login');
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);

  // Login Form States
  const [loginType, setLoginType] = useState<'admin_company' | 'member'>('admin_company');
  const [adminCompanyIdInput, setAdminCompanyIdInput] = useState<string>('');
  const [adminCompanyPassword, setAdminCompanyPassword] = useState<string>('');
  const [memberLoginPhoneOrRoll, setMemberLoginPhoneOrRoll] = useState<string>('');
  const [loginMessage, setLoginMessage] = useState<string>('');

  // Register Company Form States
  const [compNameBangla, setCompNameBangla] = useState('');
  const [compNameEnglish, setCompNameEnglish] = useState('');
  const [compCategory, setCompCategory] = useState<OrgCategoryKey>('corporate');
  const [compCode, setCompCode] = useState('');
  const [compPhone, setCompPhone] = useState('');
  const [compEmail, setCompEmail] = useState('');
  const [compAddress, setCompAddress] = useState('');
  const [compAdminName, setCompAdminName] = useState('');
  const [compPassword, setCompPassword] = useState('');

  // Country & Regional Localization States
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('BD');
  const [countrySearchQuery, setCountrySearchQuery] = useState<string>('');
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState<boolean>(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  // Biometric & Fingerprint Attendance Method States
  const [selectedFingerprintMethod, setSelectedFingerprintMethod] = useState<CompanyFingerprintMethod>('zkteco');
  const [zktecoModel, setZktecoModel] = useState<string>('SenseFace M2F-LR');
  const [zktecoSn, setZktecoSn] = useState<string>('UFS2254700071');
  const [usbModel, setUsbModel] = useState<'mantra_mfs100' | 'zkteco_slk20r' | 'digitalpersona_4500' | 'generic'>('mantra_mfs100');

  // Close country dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
    };
    if (isCountryDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isCountryDropdownOpen]);

  if (!isOpen) return null;

  // Handle Google Login
  const handleGoogleLogin = async (targetRole?: UserRole) => {
    try {
      setIsGoogleLoading(true);
      setLoginMessage('');
      const user = await signInWithGoogle();
      if (user) {
        const effectiveRole = targetRole || (loginType === 'member' ? 'student' : 'teacher');
        
        if (effectiveRole === 'student') {
          const matched = students.find(s => 
            (s.email && s.email.toLowerCase() === user.email?.toLowerCase()) ||
            s.name.toLowerCase().includes(user.displayName?.toLowerCase() || '')
          );
          if (matched) {
            onSelectLoggedInStudent(matched);
          }
        }
        
        if (onSetCurrentUser) {
          onSetCurrentUser(user);
        }
        onRoleChange(effectiveRole);
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      setLoginMessage(err?.message || 'গুগল সাইন-ইন সম্পন্ন করা যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setLoginMessage('সফলভাবে লগআউট সম্পন্ন হয়েছে');
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDirectBypassLogin = (role: 'super_admin' | 'teacher' | 'student') => {
    if (role === 'super_admin') {
      const mockUser = {
        uid: 'super-admin-uid',
        email: 'superadmin@smarthazira.ai',
        displayName: 'সুপার এডমিন (সেন্ট্রাল হেডকোয়ার্টার)',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60',
      } as unknown as User;
      if (onSetCurrentUser) onSetCurrentUser(mockUser);
      onRoleChange('super_admin');
      onClose();
    } else if (role === 'teacher') {
      const company = companies[0] || {
        id: 'cmp-default',
        nameBangla: 'স্মার্ট কর্পোরেট অফিস',
        nameEnglish: 'Smart Corporate Office',
        category: 'corporate',
        code: 'SCO-2026',
        contactEmail: 'admin@smarthazira.ai',
        contactPhone: '01711002233',
        address: 'ঢাকা, বাংলাদেশ',
        totalMembers: 5,
        status: 'Active',
        registeredDate: new Date().toISOString().split('T')[0],
        adminName: 'প্রধান এডমিন'
      };
      const mockUser = {
        uid: `comp-${company.id}`,
        email: company.contactEmail || 'admin@smarthazira.ai',
        displayName: `${company.nameBangla} (${company.adminName || 'এডমিন'})`,
        photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(company.nameBangla)}`,
      } as unknown as User;
      if (onSetCurrentUser) onSetCurrentUser(mockUser);
      onSelectCompany(company);
      onRoleChange('teacher');
      onClose();
    } else if (role === 'student') {
      const defaultStudent = students[0] || {
        id: 'std-default',
        nameBangla: 'মোঃ রফিকুল ইসলাম',
        roll: 'EMP-101',
        guardianPhone: '01711223344',
        email: 'employee@smarthazira.ai',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        cardNo: 'CRD-101',
        designation: 'কর্মকর্তা',
        department: 'অপারেশনস',
        companyId: companies[0]?.id || 'cmp-default'
      };
      const mockUser = {
        uid: `member-${defaultStudent.id}`,
        email: defaultStudent.email || 'employee@smarthazira.ai',
        displayName: defaultStudent.nameBangla,
        photoURL: defaultStudent.photoUrl,
      } as unknown as User;
      if (onSetCurrentUser) onSetCurrentUser(mockUser);
      onSelectLoggedInStudent(defaultStudent);
      onRoleChange('student');
      onClose();
    }
  };

  const handleOpenNewWindow = () => {
    window.open(window.location.href, '_blank');
  };

  // Handle Traditional Login Action
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginMessage('');

    if (loginType === 'admin_company') {
      const inputId = adminCompanyIdInput.trim().toLowerCase();
      const inputPass = adminCompanyPassword.trim();

      if (inputId === 'admin' || inputId === 'superadmin' || inputId === 'superadmin@smarthazira.ai') {
        const mockUser = {
          uid: 'super-admin-uid',
          email: 'superadmin@smarthazira.ai',
          displayName: 'সুপার এডমিন (সেন্ট্রাল হেডকোয়ার্টার)',
          photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60',
        } as unknown as User;
        if (onSetCurrentUser) onSetCurrentUser(mockUser);
        onRoleChange('super_admin');
        onClose();
        return;
      }

      const matchedCompany = companies.find(
        c => c.id.toLowerCase() === inputId ||
             c.code.toLowerCase() === inputId ||
             (c.contactEmail && c.contactEmail.toLowerCase() === inputId) ||
             (c.contactPhone && c.contactPhone.trim() === adminCompanyIdInput.trim())
      ) || companies[0];

      if (matchedCompany) {
        if (matchedCompany.password && matchedCompany.password.trim() && inputPass !== matchedCompany.password.trim()) {
          setLoginMessage('ভুল পাসওয়ার্ড! আপনার কোম্পানির সঠিক পাসওয়ার্ড প্রদান করুন।');
          return;
        }

        const mockUser = {
          uid: `comp-${matchedCompany.id}`,
          email: matchedCompany.contactEmail || 'admin@smarthazira.ai',
          displayName: `${matchedCompany.nameBangla} (${matchedCompany.adminName || 'এডমিন'})`,
          photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(matchedCompany.nameBangla)}`,
        } as unknown as User;
        if (onSetCurrentUser) onSetCurrentUser(mockUser);
        onSelectCompany(matchedCompany);
        onRoleChange('teacher');
        onClose();
        return;
      }

      setLoginMessage('কোনো কোম্পানি বা এডমিন পাওয়া যায়নি।');
    } else if (loginType === 'member') {
      const trimmed = memberLoginPhoneOrRoll.trim();
      const matchedStudent = students.find(s => 
        (trimmed && s.roll.toLowerCase() === trimmed.toLowerCase()) ||
        (trimmed && s.guardianPhone === trimmed)
      ) || students[0] || {
        id: 'std-default',
        nameBangla: trimmed ? `কর্মী (${trimmed})` : 'মোঃ রফিকুল ইসলাম',
        roll: trimmed || 'EMP-101',
        guardianPhone: '01711223344',
        email: 'employee@smarthazira.ai',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        cardNo: 'CRD-101',
        designation: 'কর্মকর্তা',
        department: 'অপারেশনস',
        companyId: companies[0]?.id || 'cmp-default'
      };

      const mockUser = {
        uid: `member-${matchedStudent.id}`,
        email: matchedStudent.email || `${matchedStudent.roll.toLowerCase()}@company.com`,
        displayName: matchedStudent.nameBangla,
        photoURL: matchedStudent.photoUrl,
      } as unknown as User;
      if (onSetCurrentUser) onSetCurrentUser(mockUser);
      onSelectLoggedInStudent(matchedStudent);
      onRoleChange('student');
      onClose();
    }
  };

  // Handle Company Registration
  const handleRegisterCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compNameBangla || !compCode) return;

    const countryObj = findCountryByCode(selectedCountryCode);
    const formattedPhone = compPhone 
      ? (compPhone.startsWith('+') ? compPhone : `${countryObj.dialCode} ${compPhone}`)
      : `${countryObj.dialCode} 1700000000`;

    const newCompany: RegisteredCompany = {
      id: `cmp-${Date.now()}`,
      nameBangla: compNameBangla,
      nameEnglish: compNameEnglish || compNameBangla,
      category: compCategory,
      code: compCode,
      contactEmail: compEmail || currentUser?.email || 'info@company.com',
      contactPhone: formattedPhone,
      phone: formattedPhone,
      address: compAddress || countryObj.addressPlaceholder,
      country: countryObj.nameBangla,
      countryCode: countryObj.code,
      dialCode: countryObj.dialCode,
      timezone: countryObj.timezone,
      biometricConfig: {
        primaryMethod: selectedFingerprintMethod,
        allowedMethods: selectedFingerprintMethod === 'all_methods' 
          ? ['zkteco', 'usb_scanner', 'webauthn_passkey'] 
          : [selectedFingerprintMethod],
        enableZKTecoPush: selectedFingerprintMethod === 'zkteco' || selectedFingerprintMethod === 'all_methods',
        enableUsbOptical: selectedFingerprintMethod === 'usb_scanner' || selectedFingerprintMethod === 'all_methods',
        enableWebAuthnPasskey: selectedFingerprintMethod === 'webauthn_passkey' || selectedFingerprintMethod === 'all_methods',
        zktecoDeviceModel: zktecoModel,
        zktecoSerialNumber: zktecoSn,
        zktecoDeviceName: `${compNameBangla} টার্মিনাল`,
        zktecoAllowedIp: '',
        zktecoPort: '4370',
        zktecoConnectionStatus: 'Unregistered',
        usbScannerModel: usbModel,
        usbOpticalEnabled: selectedFingerprintMethod === 'usb_scanner' || selectedFingerprintMethod === 'all_methods',
        webAuthnEnabled: selectedFingerprintMethod === 'webauthn_passkey' || selectedFingerprintMethod === 'all_methods',
      },
      totalMembers: 0,
      status: 'Active',
      registeredDate: new Date().toISOString().split('T')[0],
      adminName: compAdminName || currentUser?.displayName || 'কোম্পানি এডমিন',
      password: compPassword || '1234'
    };

    const mockUser = {
      uid: `comp-${newCompany.id}`,
      email: newCompany.contactEmail,
      displayName: `${newCompany.nameBangla} (${newCompany.adminName})`,
      photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(newCompany.nameBangla)}`,
    } as unknown as User;

    if (onSetCurrentUser) onSetCurrentUser(mockUser);
    onAddCompany(newCompany);
    onSelectCompany(newCompany);
    onRoleChange('teacher');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 relative animate-fadeIn my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                স্মার্ট হাজিরা AI - অথেনটিকেশন পোর্টাল
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                গুগল অথবা আইডি দিয়ে নিরাপদে সাইন-ইন ও রেজিস্ট্রেশন করুন
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Instant Login Shortcuts */}
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs">
              <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>১-ক্লিকে সরাসরি ড্যাশবোর্ডে প্রবেশ</span>
            </div>
            <button
              onClick={handleOpenNewWindow}
              title="নতুন ট্যাবে অ্যাপ খুলুন"
              className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" />
              <span>নতুন উইন্ডো</span>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDirectBypassLogin('teacher')}
              className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-center flex flex-col items-center justify-center space-y-0.5 transition cursor-pointer shadow-sm"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold">কোম্পানি ড্যাশবোর্ড</span>
            </button>
            <button
              type="button"
              onClick={() => handleDirectBypassLogin('student')}
              className="p-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-center flex flex-col items-center justify-center space-y-0.5 transition cursor-pointer shadow-sm"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold">ইউজার ড্যাশবোর্ড</span>
            </button>
            <button
              type="button"
              onClick={() => handleDirectBypassLogin('super_admin')}
              className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-center flex flex-col items-center justify-center space-y-0.5 transition cursor-pointer shadow-sm"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold">সুপার এডমিন</span>
            </button>
          </div>
        </div>

        {/* Google Authentication Quick Action Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-4 rounded-2xl border border-slate-800 text-white space-y-3 shadow-lg">
          {currentUser ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3 min-w-0">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full border-2 border-emerald-500 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center shrink-0">
                    {currentUser.displayName?.charAt(0) || 'G'}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="font-bold text-xs truncate">{currentUser.displayName || 'Google User'}</p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      লগইনকৃত
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 text-slate-400 text-xs font-semibold border border-slate-700 transition flex items-center space-x-1 shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>লগআউট</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>ওয়ান-ক্লিক নিরাপদ গুগল লগইন</span>
                </span>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60">
                  Firebase Verified
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleGoogleLogin()}
                disabled={isGoogleLoading}
                className="w-full py-3 bg-white hover:bg-slate-100 text-slate-800 font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-3 cursor-pointer disabled:opacity-50"
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-4 h-4 text-slate-800 animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                )}
                <span>Google অ্যাকাউন্ট দিয়ে সাইন ইন করুন</span>
              </button>
            </div>
          )}
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('login')}
            className={`py-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'login'
                ? 'bg-slate-900 dark:bg-emerald-500 text-white dark:text-slate-950 font-black shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>লগইন পোর্টাল</span>
          </button>

          <button
            onClick={() => setActiveTab('register_company')}
            className={`py-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'register_company'
                ? 'bg-slate-900 dark:bg-emerald-500 text-white dark:text-slate-950 font-black shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>কোম্পানি রেজিস্ট্রেশন</span>
          </button>
        </div>

        {/* TAB 1: LOGIN PORTAL */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            
            <div className="space-y-2">
              <label className="block font-extrabold text-slate-800 dark:text-slate-200">
                লগইন এর ভূমিকা (Role) নির্বাচন করুন:
              </label>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLoginType('admin_company')}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center space-y-1 ${
                    loginType === 'admin_company'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-extrabold'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600'
                  }`}
                >
                  <Building2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-[11px]">এডমিন / কোম্পানি</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLoginType('member')}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center space-y-1 ${
                    loginType === 'member'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-extrabold'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600'
                  }`}
                >
                  <Users className="w-5 h-5 text-teal-500" />
                  <span className="text-[11px]">ইউজার</span>
                </button>
              </div>
            </div>

            {/* Dynamic Inputs Based on Role */}
            {loginType === 'admin_company' && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    লগইন আইডি / কোম্পানি কোড / ইমেইল / ফোন *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: SCO-2026 বা admin"
                    value={adminCompanyIdInput}
                    onChange={(e) => setAdminCompanyIdInput(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    পাসওয়ার্ড *
                  </label>
                  <input
                    type="password"
                    placeholder="আপনার পাসওয়ার্ড লিখুন"
                    value={adminCompanyPassword}
                    onChange={(e) => setAdminCompanyPassword(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {loginType === 'member' && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ইউজার আইডি বা মোবাইল নম্বর *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: EMP-101 অথবা 01711223344"
                    value={memberLoginPhoneOrRoll}
                    onChange={(e) => setMemberLoginPhoneOrRoll(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {loginMessage && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl font-bold">
                {loginMessage}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-xs rounded-2xl shadow-xl transition flex items-center justify-center space-x-2 mt-4 cursor-pointer"
            >
              <span>ড্যাশবোর্ডে প্রবেশ করুন</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* TAB 2: COMPANY REGISTRATION */}
        {activeTab === 'register_company' && (
          <form onSubmit={handleRegisterCompany} className="space-y-4 text-xs">
            
            {/* 1. Country Selection (Searchable Country Dropdown with ISO code) */}
            <div className="relative" ref={countryDropdownRef}>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-500" />
                  <span>প্রতিষ্ঠানের দেশ নির্বাচন (Country & Timezone)*</span>
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                  ISO: {findCountryByCode(selectedCountryCode).code} | {findCountryByCode(selectedCountryCode).timezone}
                </span>
              </label>

              {/* Selected Country Trigger Button */}
              <button
                type="button"
                onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl font-bold flex items-center justify-between hover:border-emerald-500 transition cursor-pointer"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="text-xl leading-none">{findCountryByCode(selectedCountryCode).flag}</span>
                  <div className="text-left">
                    <span className="font-extrabold text-xs">{findCountryByCode(selectedCountryCode).nameBangla}</span>
                    <span className="text-slate-400 text-[11px] ml-1.5">({findCountryByCode(selectedCountryCode).nameEnglish})</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold">
                    {findCountryByCode(selectedCountryCode).dialCode}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isCountryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Searchable Dropdown Popup */}
              {isCountryDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 space-y-2 max-h-64 flex flex-col">
                  {/* Search input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="দেশের নাম, কোড বা ডায়াল কোড খুঁজুন (যেমন: বাংলাদেশ, BD, +966)..."
                      value={countrySearchQuery}
                      onChange={(e) => setCountrySearchQuery(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                      autoFocus
                    />
                  </div>

                  {/* Countries scrollable list */}
                  <div className="overflow-y-auto space-y-1 flex-1 pr-1 max-h-48">
                    {searchCountries(countrySearchQuery).map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          setSelectedCountryCode(c.code);
                          setIsCountryDropdownOpen(false);
                          setCountrySearchQuery('');
                        }}
                        className={`w-full px-2.5 py-2 rounded-xl text-left flex items-center justify-between transition cursor-pointer ${
                          selectedCountryCode === c.code
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <span className="text-lg leading-none">{c.flag}</span>
                          <div>
                            <span className="font-bold text-xs">{c.nameBangla}</span>
                            <span className="text-[10px] text-slate-400 ml-1.5">({c.nameEnglish})</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-right">
                          <span className="text-[10px] font-mono text-slate-400">{c.code}</span>
                          <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{c.dialCode}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Company Name and Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  প্রতিষ্ঠানের নাম (বাংলা)*
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: বেঙ্গল টেকনোলজিস লিমিটেড"
                  value={compNameBangla}
                  onChange={(e) => setCompNameBangla(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 border border-slate-300 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  কোম্পানি কোড*
                </label>
                <input
                  type="text"
                  required
                  placeholder="BTL-CORP-01"
                  value={compCode}
                  onChange={(e) => setCompCode(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Organization Category */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                প্রতিষ্ঠানের ধরণ বা ক্যাটাগরি*
              </label>
              <select
                value={compCategory}
                onChange={(e) => setCompCategory(e.target.value as OrgCategoryKey)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {Object.entries(ORG_CATEGORIES).map(([key, meta]) => (
                  <option key={key} value={key} className="text-slate-900 bg-white dark:bg-slate-800 dark:text-white">
                    {meta.terminology.orgCategoryName} ({meta.terminology.memberPlural})
                  </option>
                ))}
              </select>
            </div>

            {/* Admin and Phone (with Country Dial Code) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  অ্যাডমিন ইনচার্জের নাম
                </label>
                <input
                  type="text"
                  placeholder="মোঃ শরিফুল ইসলাম (HR)"
                  value={compAdminName || currentUser?.displayName || ''}
                  onChange={(e) => setCompAdminName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 border border-slate-300 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  মোবাইল নম্বর ({findCountryByCode(selectedCountryCode).phoneFormatHint})
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-r-0 border-slate-300 dark:border-slate-700 rounded-l-xl font-mono font-bold text-xs">
                    {findCountryByCode(selectedCountryCode).dialCode}
                  </span>
                  <input
                    type="text"
                    placeholder="1711002233"
                    value={compPhone}
                    onChange={(e) => setCompPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 border border-slate-300 dark:border-slate-700 rounded-r-xl font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                ঠিকানা ও অবস্থান
              </label>
              <input
                type="text"
                placeholder={findCountryByCode(selectedCountryCode).addressPlaceholder}
                value={compAddress}
                onChange={(e) => setCompAddress(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 border border-slate-300 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* 2. Fingerprint & Biometric Attendance Method Selection */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Fingerprint className="w-4 h-4 text-emerald-500" />
                  <span>ফিঙ্গারপ্রিন্ট ও বায়োমেট্রিক হাজিরা পদ্ধতি নির্বাচন*</span>
                </span>
                <span className="text-[10px] text-slate-500">পরবর্তীতে সেটিংস থেকেও পরিবর্তন করা যাবে</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Method 1: ZKTeco Machine */}
                <label className={`p-2.5 rounded-xl border flex items-start space-x-2.5 cursor-pointer transition ${
                  selectedFingerprintMethod === 'zkteco'
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="fingerprintMethod"
                    value="zkteco"
                    checked={selectedFingerprintMethod === 'zkteco'}
                    onChange={() => setSelectedFingerprintMethod('zkteco')}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                      <span>ZKTeco হাজিরা মেশিন</span>
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                      মেশিনের নিজস্ব হার্ডওয়্যারে ফেস ও ফিঙ্গারপ্রিন্ট অটোমেটিক যাচাই; ADMS পুশ দিয়ে ক্লাউডে সিঙ্ক।
                    </p>
                  </div>
                </label>

                {/* Method 2: USB Optical Scanner */}
                <label className={`p-2.5 rounded-xl border flex items-start space-x-2.5 cursor-pointer transition ${
                  selectedFingerprintMethod === 'usb_scanner'
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="fingerprintMethod"
                    value="usb_scanner"
                    checked={selectedFingerprintMethod === 'usb_scanner'}
                    onChange={() => setSelectedFingerprintMethod('usb_scanner')}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                      <HardDrive className="w-3.5 h-3.5 text-teal-500" />
                      <span>USB অপটিক্যাল স্ক্যানার</span>
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                      Mantra MFS100 / SecuGen / ZKTeco SLK20R ইউএসবি ডিভাইস ও লোকাল ড্রাইভার সার্ভিস।
                    </p>
                  </div>
                </label>

                {/* Method 3: WebAuthn / Passkey Platform Biometric */}
                <label className={`p-2.5 rounded-xl border flex items-start space-x-2.5 cursor-pointer transition ${
                  selectedFingerprintMethod === 'webauthn_passkey'
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="fingerprintMethod"
                    value="webauthn_passkey"
                    checked={selectedFingerprintMethod === 'webauthn_passkey'}
                    onChange={() => setSelectedFingerprintMethod('webauthn_passkey')}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
                      <span>WebAuthn / Passkey</span>
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                      মোবাইল/ল্যাপটপের বিল্ট-ইন ফেস/টাচ সেন্সর দিয়ে ডিজিটাল পরিচয় যাচাই (এটি র ছবি বা টেমপ্লেট পড়ে না)।
                    </p>
                  </div>
                </label>

                {/* Method 4: All Methods */}
                <label className={`p-2.5 rounded-xl border flex items-start space-x-2.5 cursor-pointer transition ${
                  selectedFingerprintMethod === 'all_methods'
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="fingerprintMethod"
                    value="all_methods"
                    checked={selectedFingerprintMethod === 'all_methods'}
                    onChange={() => setSelectedFingerprintMethod('all_methods')}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>সকল পদ্ধতি (হাইব্রিড মোড)</span>
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                      জেডকেটেকো মেশিন, ইউএসবি স্ক্যানার ও পাসকি—সবগুলো অপশন একসঙ্গে ব্যবহারের সুবিধা।
                    </p>
                  </div>
                </label>
              </div>

              {/* Sub-inputs for selected method */}
              {selectedFingerprintMethod === 'zkteco' && (
                <div className="p-2.5 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800/60 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                        ZKTeco মডেল
                      </span>
                      <input
                        type="text"
                        placeholder="SenseFace M2F-LR / MB20 / K40"
                        value={zktecoModel}
                        onChange={(e) => setZktecoModel(e.target.value)}
                        className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-[11px] font-semibold"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                        ডিভাইস সিরিয়াল নম্বর (SN)
                      </span>
                      <input
                        type="text"
                        placeholder="UFS2254700071"
                        value={zktecoSn}
                        onChange={(e) => setZktecoSn(e.target.value)}
                        className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-[11px] font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                পাসওয়ার্ড সেটআপ করুন *
              </label>
              <input
                type="password"
                required
                placeholder="কমপক্ষে ৪ অক্ষর"
                value={compPassword}
                onChange={(e) => setCompPassword(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 border border-slate-300 dark:border-slate-700 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl transition shadow-lg shadow-emerald-600/30 mt-2 cursor-pointer"
            >
              কোম্পানি রেজিস্ট্রেশন করুন ও এডমিন ড্যাশবোর্ডে প্রবেশ করুন
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
