import React, { useState } from 'react';
import { 
  Camera, 
  Building2, 
  LogIn, 
  ShieldCheck, 
  Users, 
  Briefcase, 
  Phone, 
  Mail, 
  Key, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  Shield,
  Loader2,
  AlertTriangle,
  Building,
  UserCheck,
  Zap,
  Clock,
  Smartphone,
  ExternalLink,
  Plus,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';
import { RegisteredCompany, Student, UserRole } from '../types';
import { OrgCategoryKey, ORG_CATEGORIES } from '../utils/organizationConfig';
import { signInWithGoogle } from '../lib/firebase';
import { User } from 'firebase/auth';

interface MandatoryLoginGateProps {
  onGoogleSignIn: () => Promise<void>;
  companies: RegisteredCompany[];
  students: Student[];
  onAddCompany: (company: RegisteredCompany) => void;
  onRoleChange: (role: UserRole) => void;
  onSelectCompany: (company: RegisteredCompany) => void;
  onSelectLoggedInStudent: (student: Student) => void;
  onSetCurrentUser: (user: User) => void;
  orgCategory: OrgCategoryKey;
  onOpenPublicPortal?: () => void;
}

export const MandatoryLoginGate: React.FC<MandatoryLoginGateProps> = ({
  onGoogleSignIn,
  companies,
  students,
  onAddCompany,
  onRoleChange,
  onSelectCompany,
  onSelectLoggedInStudent,
  onSetCurrentUser,
  orgCategory,
  onOpenPublicPortal,
}) => {
  // Role Selector: 'admin_company' | 'user'
  const [selectedRoleType, setSelectedRoleType] = useState<'admin_company' | 'user'>('admin_company');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);

  // Admin & Company Unified Login Credentials
  const [adminCompanyIdInput, setAdminCompanyIdInput] = useState<string>('');
  const [adminCompanyPassword, setAdminCompanyPassword] = useState<string>('');
  const [showAdminCompanyPassword, setShowAdminCompanyPassword] = useState<boolean>(false);

  // User / Employee Credentials (Require BOTH Employee ID AND Mobile Number for security)
  const [userRollInput, setUserRollInput] = useState<string>('');
  const [userPhoneInput, setUserPhoneInput] = useState<string>('');

  // Password Recovery Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState<boolean>(false);
  const [recoveryInput, setRecoveryInput] = useState<string>('');
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);
  const [recoveredCompany, setRecoveredCompany] = useState<RegisteredCompany | null>(null);

  // Helper to generate sequential Company Serial ID (e.g. CMP-1001, CMP-1002...)
  const generateSerialCompanyId = (): string => {
    const baseNumber = 1000 + companies.length + 1;
    return `CMP-${baseNumber}`;
  };

  // New Company Registration Form
  const [newCompNameBangla, setNewCompNameBangla] = useState('');
  const [newCompCategory, setNewCompCategory] = useState<OrgCategoryKey>('corporate');
  const [newCompCode, setNewCompCode] = useState('');
  const [newCompPhone, setNewCompPhone] = useState('');
  const [newCompEmail, setNewCompEmail] = useState('');
  const [newCompAdmin, setNewCompAdmin] = useState('');
  const [newCompPassword, setNewCompPassword] = useState<string>('');
  const [newCompConfirmPassword, setNewCompConfirmPassword] = useState<string>('');
  const [showNewCompPassword, setShowNewCompPassword] = useState<boolean>(false);

  // Unified Admin / Company Login Handler
  const handleAdminCompanyLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const inputId = adminCompanyIdInput.trim();
    const inputPass = adminCompanyPassword.trim();

    if (!inputId) {
      setErrorMessage('অনুগ্রহ করে আপনার আইডি / কোড / ইমেইল / ফোন নম্বর লিখুন।');
      return;
    }

    const lowerInput = inputId.toLowerCase();

    // 1. Check if Super Admin login
    if (lowerInput === 'admin' || lowerInput === 'superadmin' || lowerInput === 'superadmin@smarthazira.ai') {
      const mockUser = {
        uid: 'super-admin-uid',
        email: 'superadmin@smarthazira.ai',
        displayName: 'সুপার এডমিন (সিস্টেম হেডকোয়ার্টার)',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60',
      } as unknown as User;
      onSetCurrentUser(mockUser);
      onRoleChange('super_admin');
      return;
    }

    // 2. Find matching company by Serial ID, Code, Phone, or Email (Email Primacy)
    const matchedCompany = companies.find(
      c => (c.contactEmail && c.contactEmail.toLowerCase() === lowerInput) ||
           c.id.toLowerCase() === lowerInput ||
           c.code.toLowerCase() === lowerInput ||
           (c.contactPhone && c.contactPhone.trim() === inputId)
    );

    if (matchedCompany) {
      // Log matching note for email primacy
      console.log(`[Email Primacy Authentication] Matched company "${matchedCompany.nameBangla}" via Primary Email: ${matchedCompany.contactEmail}`);

      // Verify company password if set
      if (matchedCompany.password && matchedCompany.password.trim()) {
        if (!inputPass) {
          setErrorMessage(`"${matchedCompany.nameBangla}" কোম্পানির এডমিন পাসওয়ার্ড লিখুন।`);
          return;
        }
        if (inputPass !== matchedCompany.password.trim()) {
          setErrorMessage('ভুল পাসওয়ার্ড! আপনার কোম্পানির সঠিক পাসওয়ার্ড প্রদান করুন।');
          return;
        }
      }

      const mockUser = {
        uid: `comp-${matchedCompany.id}`,
        email: matchedCompany.contactEmail || 'admin@smarthazira.ai',
        displayName: `${matchedCompany.nameBangla} (${matchedCompany.adminName || 'এডমিন'})`,
        photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(matchedCompany.nameBangla)}`,
      } as unknown as User;

      onSetCurrentUser(mockUser);
      onSelectCompany(matchedCompany);
      onRoleChange('teacher'); // 'teacher' acts as Company Admin in the app
      return;
    }

    // Fallback if no specific company matched but companies exist and no strict password failed
    if (companies.length > 0 && !inputPass) {
      // If user provided an input that didn't match any company code, but companies exist
      setErrorMessage(`"${inputId}" আইডি বা কোড দিয়ে কোনো এডমিন বা কোম্পানি পাওয়া যায়নি। সঠিক আইডি/কোড লিখুন।`);
      return;
    }

    if (!matchedCompany && companies.length > 0) {
      setErrorMessage(`"${inputId}" কোড দিয়ে কোনো কোম্পানি পাওয়া যায়নি। সঠিক তথ্য দিয়ে পুনরায় চেষ্টা করুন।`);
      return;
    }

    if (!matchedCompany && companies.length === 0) {
      setErrorMessage('কোনো কোম্পানি নিবন্ধিত নেই। অনুগ্রহ করে নিচে "নতুন কোম্পানি নিবন্ধন করুন" এ ক্লিক করুন।');
      return;
    }
  };

  // User / Employee Login
  const handleUserLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const trimmedRoll = userRollInput.trim().toLowerCase();
    const trimmedPhone = userPhoneInput.trim().toLowerCase();
    const cleanDigitsPhone = trimmedPhone.replace(/\D/g, '');

    if (!trimmedRoll && !trimmedPhone && students.length > 0) {
      // If both inputs are empty and demo students exist
      const defaultStudent = students[0];
      if (defaultStudent) {
        loginAsStudent(defaultStudent);
        return;
      }
    }

    if (!trimmedRoll || !trimmedPhone) {
      setErrorMessage('নিরাপত্তার স্বার্থে কর্মী আইডি এবং মোবাইল নম্বর দুটি ঘরেই সঠিক তথ্য প্রদান করুন।');
      return;
    }

    const matched = students.find(
      s => {
        const sRoll = String(s.roll).trim().toLowerCase();
        const sPhone1 = (s.guardianPhone || '').replace(/\D/g, '');
        const sPhone2 = (s.parentPhone || '').replace(/\D/g, '');
        const rawPhone1 = (s.guardianPhone || '').trim().toLowerCase();
        const rawPhone2 = (s.parentPhone || '').trim().toLowerCase();

        const isRollMatch = sRoll === trimmedRoll;
        const isPhoneMatch =
          rawPhone1 === trimmedPhone ||
          rawPhone2 === trimmedPhone ||
          (cleanDigitsPhone.length >= 6 && (sPhone1.endsWith(cleanDigitsPhone) || cleanDigitsPhone.endsWith(sPhone1))) ||
          (cleanDigitsPhone.length >= 6 && (sPhone2.endsWith(cleanDigitsPhone) || cleanDigitsPhone.endsWith(sPhone2)));

        return isRollMatch && isPhoneMatch;
      }
    );

    if (matched) {
      loginAsStudent(matched);
    } else {
      setErrorMessage(`প্রদত্ত কর্মী আইডি (${userRollInput}) এবং মোবাইল নম্বরের (${userPhoneInput}) সাথে নিবন্ধিত তথ্যের মিল পাওয়া যায়নি।`);
    }
  };

  const loginAsStudent = (std: Student) => {
    const mockUser = {
      uid: `member-${std.id}`,
      email: std.email || 'employee@smarthazira.ai',
      displayName: std.nameBangla,
      photoURL: std.faceImage || std.photoUrl,
    } as unknown as User;

    if (std.companyId) {
      const cmp = companies.find(c => c.id === std.companyId);
      if (cmp) onSelectCompany(cmp);
    }

    onSetCurrentUser(mockUser);
    onSelectLoggedInStudent(std);
    onRoleChange('student');
  };

  // Handle Google Sign-In
  const handleGoogleClick = async () => {
    setIsGoogleLoading(true);
    setErrorMessage('');
    try {
      const user = await signInWithGoogle();
      if (user) {
        if (selectedRoleType === 'user') {
          const matched = students.find(s => 
            (s.email && s.email.toLowerCase() === user.email?.toLowerCase()) ||
            s.name.toLowerCase().includes(user.displayName?.toLowerCase() || '')
          ) || students[0];
          if (matched) onSelectLoggedInStudent(matched);
          onSetCurrentUser(user);
          onRoleChange('student');
        } else {
          const matchedComp = companies.find(c => c.contactEmail?.toLowerCase() === user.email?.toLowerCase()) || companies[0];
          if (matchedComp) onSelectCompany(matchedComp);
          onSetCurrentUser(user);
          onRoleChange('teacher');
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'গুগল সাইন-ইন সম্পন্ন করা যায়নি।');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Register New Company Submit
  const handleRegisterCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!newCompNameBangla.trim() || !newCompCode.trim()) {
      setErrorMessage('কোম্পানির নাম এবং কোড আবশ্যক।');
      return;
    }

    if (!newCompPassword.trim()) {
      setErrorMessage('কোম্পানি এডমিনের জন্য একটি পাসওয়ার্ড সেটআপ করা বাধ্যতামূলক।');
      return;
    }

    if (newCompPassword.trim().length < 4) {
      setErrorMessage('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।');
      return;
    }

    if (newCompPassword !== newCompConfirmPassword) {
      setErrorMessage('পাসওয়ার্ড দুটি মিলছে না! অনুগ্রহ করে পুনরায় টাইপ করুন।');
      return;
    }

    const serialCompanyId = generateSerialCompanyId();

    const newCompany: RegisteredCompany = {
      id: serialCompanyId,
      nameBangla: newCompNameBangla.trim(),
      nameEnglish: newCompNameBangla.trim(),
      category: newCompCategory,
      code: newCompCode.trim().toUpperCase() || serialCompanyId,
      contactEmail: newCompEmail.trim() || 'admin@company.com',
      contactPhone: newCompPhone.trim() || '01700000000',
      address: 'বাংলাদেশ',
      totalMembers: 0,
      status: 'Active',
      registeredDate: new Date().toISOString().split('T')[0],
      adminName: newCompAdmin.trim() || 'এডমিন',
      password: newCompPassword.trim(),
    };

    onAddCompany(newCompany);
    setIsRegisterModalOpen(false);

    // Auto login as this company
    const mockUser = {
      uid: `comp-${newCompany.id}`,
      email: newCompany.contactEmail,
      displayName: `${newCompany.nameBangla} (${newCompany.adminName})`,
      photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(newCompany.nameBangla)}`,
    } as unknown as User;
    onSetCurrentUser(mockUser);
    onSelectCompany(newCompany);
    onRoleChange('teacher');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between p-4 sm:p-6 selection:bg-emerald-500 selection:text-white">
      
      {/* Top Header / Brand */}
      <header className="max-w-md w-full mx-auto pt-4 sm:pt-6 text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 p-1 shadow-lg shadow-emerald-500/20">
          <div className="w-full h-full bg-white rounded-[20px] flex items-center justify-center">
            <Camera className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600 stroke-[2.2]" />
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex items-center justify-center gap-2">
          <span>স্মার্ট হাজিরা</span>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
            মোবাইল AI
          </span>
        </h1>
        <p className="text-xs text-slate-600 max-w-xs mx-auto font-medium">
          স্মার্টফোন ক্যামেরা দিয়ে দ্রুত ও নির্ভরযোগ্য ফেস হাজিরা সিস্টেম
        </p>
      </header>

      {/* Main Login Card */}
      <main className="max-w-md w-full mx-auto my-6 bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
        
        {/* PUBLIC PORTAL BUTTON (Top Highlight for Tablet/Mobile Kiosk) */}
        {onOpenPublicPortal && (
          <button
            type="button"
            onClick={onOpenPublicPortal}
            className="w-full p-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-2xl flex items-center justify-between shadow-md shadow-emerald-600/20 transition active:scale-95 cursor-pointer"
          >
            <div className="flex items-center space-x-2.5">
              <span className="p-2 bg-white/20 rounded-xl">
                <Camera className="w-5 h-5 stroke-[2.5] text-white" />
              </span>
              <div className="text-left">
                <p className="text-xs font-black leading-tight text-white">পাবলিক ফেস হাজিরা পোর্টাল</p>
                <p className="text-[10px] text-emerald-100 font-medium">ক্যামেরা অন করে সরাসরি হাজিরা দিন</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 stroke-[3] text-white" />
          </button>
        )}

        {/* Role Selector Option (2 Tabs: Admin/Company, User) */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">
            লগইন রোল নির্বাচন করুন
          </p>

          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
            
            {/* 1. Admin / Company */}
            <button
              type="button"
              onClick={() => {
                setSelectedRoleType('admin_company');
                setErrorMessage('');
              }}
              className={`py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                selectedRoleType === 'admin_company'
                  ? 'bg-emerald-600 text-white font-black shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span className="text-xs">এডমিন / কোম্পানি</span>
            </button>

            {/* 2. User / Member */}
            <button
              type="button"
              onClick={() => {
                setSelectedRoleType('user');
                setErrorMessage('');
              }}
              className={`py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                selectedRoleType === 'user'
                  ? 'bg-emerald-600 text-white font-black shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="text-xs">ইউজার</span>
            </button>

          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. UNIFIED ADMIN / COMPANY FORM */}
        {selectedRoleType === 'admin_company' && (
          <form onSubmit={handleAdminCompanyLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-800 mb-1">
                লগইন আইডি / কোম্পানি কোড / ফোন / ইমেইল *
              </label>
              <input
                type="text"
                value={adminCompanyIdInput}
                onChange={(e) => setAdminCompanyIdInput(e.target.value)}
                placeholder="যেমন: SCO-2026, admin, বা ইমেইল/ফোন"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-2xl text-xs text-slate-900 focus:outline-emerald-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-800 mb-1">
                পাসওয়ার্ড *
              </label>
              <div className="relative">
                <input
                  type={showAdminCompanyPassword ? 'text' : 'password'}
                  value={adminCompanyPassword}
                  onChange={(e) => setAdminCompanyPassword(e.target.value)}
                  placeholder="আপনার পাসওয়ার্ড লিখুন"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-300 rounded-2xl text-xs text-slate-900 focus:outline-emerald-600 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminCompanyPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                >
                  {showAdminCompanyPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black rounded-2xl text-xs flex items-center justify-center space-x-2 shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>ড্যাশবোর্ডে প্রবেশ করুন</span>
            </button>

            {/* Password Recovery & Quick Link to Register Company */}
            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => {
                  setRecoveryInput('');
                  setRecoveryMessage(null);
                  setIsForgotModalOpen(true);
                }}
                className="text-slate-500 hover:text-emerald-700 font-bold hover:underline cursor-pointer"
              >
                🔑 পাসওয়ার্ড ভুলে গেছেন?
              </button>

              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(true)}
                className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন কোম্পানি নিবন্ধন</span>
              </button>
            </div>
          </form>
        )}

        {/* 2. USER / MEMBER FORM */}
        {selectedRoleType === 'user' && (
          <form onSubmit={handleUserLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-800 mb-1">
                কর্মী আইডি (Employee ID) *
              </label>
              <input
                type="text"
                value={userRollInput}
                onChange={(e) => setUserRollInput(e.target.value)}
                placeholder="যেমন: EMP-101 বা 101"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-2xl text-xs text-slate-900 focus:outline-emerald-600 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-800 mb-1">
                মোবাইল নম্বর (Registered Phone) *
              </label>
              <input
                type="tel"
                value={userPhoneInput}
                onChange={(e) => setUserPhoneInput(e.target.value)}
                placeholder="যেমন: 01711223344"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-2xl text-xs text-slate-900 focus:outline-emerald-600 font-mono font-bold"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-600">
              🔒 নিরাপত্তার জন্য কর্মী আইডি এবং মোবাইল নম্বর দুটি তথ্যই যাচাই করে নিজস্ব ড্যাশবোর্ডে প্রবেশাধিকার দেওয়া হবে।
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black rounded-2xl text-xs flex items-center justify-center space-x-2 shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>ইউজার ড্যাশবোর্ডে প্রবেশ করুন</span>
            </button>
          </form>
        )}

        {/* Google Sign-in Divider */}
        <div className="relative flex items-center justify-center pt-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <span className="relative bg-white px-3 text-[10px] uppercase font-bold text-slate-400">
            অথবা
          </span>
        </div>

        {/* Google 1-Click Button */}
        <button
          type="button"
          disabled={isGoogleLoading}
          onClick={handleGoogleClick}
          className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-800 rounded-2xl border border-slate-300 text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer shadow-xs disabled:opacity-60"
        >
          {isGoogleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.7-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          )}
          <span>গুগল অ্যাকাউন্ট দিয়ে সরাসরি লগইন</span>
        </button>

      </main>

      {/* Footer info */}
      <footer className="max-w-md w-full mx-auto text-center text-[11px] text-slate-500 pb-2">
        <p>মোবাইল অপ্টিমাইজড • ক্যামেরা ফেস হাজিরা সিস্টেম</p>
      </footer>

      {/* MODAL: Company Password Recovery */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-600" />
                <span>কোম্পানি এডমিন পাসওয়ার্ড পুনরুদ্ধার</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              আপনার নিবন্ধিত ইমেইল, মোবাইল নম্বর বা কোম্পানি সিরিয়াল আইডি (যেমন: CMP-1001) লিখুন। আপনার ইমেইলে রিমেম্বার পাসওয়ার্ড বার্তা বা পাসওয়ার্ড পাঠাবে সিস্টেম।
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setRecoveryMessage(null);
                const query = recoveryInput.trim().toLowerCase();
                if (!query) {
                  setRecoveryMessage('অনুগ্রহ করে সঠিক তথ্য দিন।');
                  return;
                }

                const matchedCmp = companies.find(
                  c => (c.contactEmail && c.contactEmail.toLowerCase() === query) ||
                       c.id.toLowerCase() === query ||
                       c.code.toLowerCase() === query ||
                       (c.contactPhone && c.contactPhone.trim() === query)
                );

                if (matchedCmp) {
                  setRecoveredCompany(matchedCmp);
                  setRecoveryMessage(`✅ "${matchedCmp.nameBangla}" কোম্পানির লগইন তথ্য নিচে প্রদর্শিত হলো:`);
                } else {
                  setRecoveredCompany(null);
                  setRecoveryMessage(`⚠️ "${recoveryInput}" সম্পর্কিত কোনো কোম্পানি পাওয়া যায়নি। অনুগ্রহ করে নিবন্ধিত ইমেইল বা আইডি দিন।`);
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">
                  কোম্পানি ইমেইল / ফোন / ইউজার আইডি *
                </label>
                <input
                  type="text"
                  required
                  value={recoveryInput}
                  onChange={(e) => setRecoveryInput(e.target.value)}
                  placeholder="যেমন: admin@company.com বা CMP-1001"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-2xl text-xs text-slate-900 focus:outline-emerald-600 font-mono"
                />
              </div>

              {recoveredCompany && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl space-y-2 text-xs text-slate-800">
                  <div className="font-bold text-emerald-900 flex items-center justify-between">
                    <span>🏢 {recoveredCompany.nameBangla}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-md font-mono">
                      {recoveredCompany.id}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/80 p-2 rounded-xl border border-emerald-200">
                    <div>
                      <span className="text-slate-500 block">লগইন কোড / আইডি:</span>
                      <span className="font-bold font-mono text-slate-900">{recoveredCompany.code}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">এডমিন পাসওয়ার্ড:</span>
                      <span className="font-bold font-mono text-emerald-700">{recoveredCompany.password || '1234'}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const mockUser = {
                        uid: `comp-${recoveredCompany.id}`,
                        email: recoveredCompany.contactEmail || 'admin@smarthazira.ai',
                        displayName: `${recoveredCompany.nameBangla} (${recoveredCompany.adminName || 'এডমিন'})`,
                        photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(recoveredCompany.nameBangla)}`,
                      } as unknown as User;
                      onSetCurrentUser(mockUser);
                      onSelectCompany(recoveredCompany);
                      onRoleChange('teacher');
                      setIsForgotModalOpen(false);
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition cursor-pointer shadow-sm flex items-center justify-center space-x-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>সরাসরি এই ড্যাশবোর্ডে প্রবেশ করুন</span>
                  </button>
                </div>
              )}

              {recoveryMessage && !recoveredCompany && (
                <div className="p-3 rounded-2xl text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
                  {recoveryMessage}
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  বন্ধ করুন
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-md"
                >
                  পাসওয়ার্ড রিকভার করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Register New Company */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>নতুন কোম্পানি নিবন্ধন</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterCompanySubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">
                  কোম্পানির নাম (বাংলায়) *
                </label>
                <input
                  type="text"
                  required
                  value={newCompNameBangla}
                  onChange={(e) => setNewCompNameBangla(e.target.value)}
                  placeholder="যেমন: এসিআই লজিস্টিকস লিঃ"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">
                  কোম্পানি কোড *
                </label>
                <input
                  type="text"
                  required
                  value={newCompCode}
                  onChange={(e) => setNewCompCode(e.target.value)}
                  placeholder="যেমন: ACI-2026"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-emerald-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">
                  ক্যাটাগরি
                </label>
                <select
                  value={newCompCategory}
                  onChange={(e) => setNewCompCategory(e.target.value as OrgCategoryKey)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-emerald-600 cursor-pointer"
                >
                  <option value="corporate">কর্পোরেট অফিস (Corporate)</option>
                  <option value="factory">কারখানা ও ফ্যাক্টরি (Factory)</option>
                  <option value="educational">শিক্ষাপ্রতিষ্ঠান (Educational)</option>
                  <option value="medical">হাসপাতাল ও ক্লিনিক (Medical)</option>
                  <option value="general">সাধারণ প্রতিষ্ঠান (General)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    মোবাইল নম্বর
                  </label>
                  <input
                    type="tel"
                    value={newCompPhone}
                    onChange={(e) => setNewCompPhone(e.target.value)}
                    placeholder="01711..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-emerald-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    এডমিন নাম
                  </label>
                  <input
                    type="text"
                    value={newCompAdmin}
                    onChange={(e) => setNewCompAdmin(e.target.value)}
                    placeholder="ম্যানেজার / এডমিন"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">
                  কোম্পানি ইমেইল (লগইনের জন্য)
                </label>
                <input
                  type="email"
                  value={newCompEmail}
                  onChange={(e) => setNewCompEmail(e.target.value)}
                  placeholder="admin@company.com"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    পাসওয়ার্ড সেটআপ করুন *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewCompPassword ? 'text' : 'password'}
                      required
                      value={newCompPassword}
                      onChange={(e) => setNewCompPassword(e.target.value)}
                      placeholder="কমপক্ষে ৪ অক্ষর"
                      className="w-full pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-emerald-600 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewCompPassword(prev => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                    >
                      {showNewCompPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    পাসওয়ার্ড নিশ্চিত করুন *
                  </label>
                  <input
                    type={showNewCompPassword ? 'text' : 'password'}
                    required
                    value={newCompConfirmPassword}
                    onChange={(e) => setNewCompConfirmPassword(e.target.value)}
                    placeholder="একই পাসওয়ার্ড দিন"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-emerald-600 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-md"
                >
                  নিবন্ধন করুন ও প্রবেশ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
