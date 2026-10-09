import React, { useState, useRef, useEffect } from 'react';
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Calendar, 
  Users, 
  Database, 
  X, 
  Edit3, 
  Check, 
  LogOut, 
  Key, 
  Sparkles,
  Sliders,
  ExternalLink,
  Clock,
  Globe,
  Fingerprint,
  Cpu,
  HardDrive,
  Smartphone,
  ChevronDown,
  Search,
  Info,
  AlertCircle
} from 'lucide-react';
import { RegisteredCompany, UserRole, CompanyFingerprintMethod } from '../types';
import { OrgCategoryInfo } from '../utils/organizationConfig';
import { COUNTRIES_LIST, findCountryByCode, searchCountries, CountryInfo } from '../utils/countryData';
import { User as FirebaseUser } from 'firebase/auth';

interface CompanyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: RegisteredCompany | null;
  currentUser: FirebaseUser | null;
  orgInfo: OrgCategoryInfo;
  totalMembersCount: number;
  onUpdateCompany?: (updated: RegisteredCompany) => void;
  onOpenOrgSelector?: () => void;
  onOpenScheduleSettings?: () => void;
  onSignOut?: () => void;
  onOpenAuditLogs?: () => void;
}

export const CompanyProfileModal: React.FC<CompanyProfileModalProps> = ({
  isOpen,
  onClose,
  company,
  currentUser,
  orgInfo,
  totalMembersCount,
  onUpdateCompany,
  onOpenOrgSelector,
  onOpenScheduleSettings,
  onSignOut,
  onOpenAuditLogs,
}) => {
  const { terminology } = orgInfo;

  const [isEditing, setIsEditing] = useState(false);
  const [nameBangla, setNameBangla] = useState(company?.nameBangla || 'স্মার্ট এন্টারপ্রাইজ');
  const [adminName, setAdminName] = useState(company?.adminName || currentUser?.displayName || 'কোম্পানি এডমিন');
  const [adminEmail, setAdminEmail] = useState(company?.adminEmail || currentUser?.email || 'admin@smartenterprise.bd');
  const [phone, setPhone] = useState(company?.phone || company?.contactPhone || '০১৭xxxxxxxx');
  const [address, setAddress] = useState(company?.address || 'ঢাকা, বাংলাদেশ');

  // Country & Timezone States
  const [countryCode, setCountryCode] = useState<string>(company?.countryCode || 'BD');
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  // Biometric Attendance System Configuration States
  const [fingerprintMethod, setFingerprintMethod] = useState<CompanyFingerprintMethod>(
    company?.biometricConfig?.primaryMethod || 'zkteco'
  );
  const [zktecoSn, setZktecoSn] = useState(
    company?.biometricConfig?.zktecoSerialNumber || 'UFS2254700071'
  );
  const [zktecoModel, setZktecoModel] = useState(
    company?.biometricConfig?.zktecoDeviceModel || 'SenseFace M2F-LR'
  );
  const [usbModel, setUsbModel] = useState<'mantra_mfs100' | 'secugen_hamster' | 'zkteco_slk20r' | 'digitalpersona_4500' | 'generic'>(
    company?.biometricConfig?.usbScannerModel || 'mantra_mfs100'
  );

  // Sync state if company changes
  useEffect(() => {
    if (company) {
      setNameBangla(company.nameBangla || '');
      setAdminName(company.adminName || '');
      setAdminEmail(company.adminEmail || company.contactEmail || '');
      setPhone(company.phone || company.contactPhone || '');
      setAddress(company.address || '');
      setCountryCode(company.countryCode || 'BD');
      if (company.biometricConfig) {
        setFingerprintMethod(company.biometricConfig.primaryMethod || 'zkteco');
        if (company.biometricConfig.zktecoSerialNumber) {
          setZktecoSn(company.biometricConfig.zktecoSerialNumber);
        }
        if (company.biometricConfig.zktecoDeviceModel) {
          setZktecoModel(company.biometricConfig.zktecoDeviceModel);
        }
        if (company.biometricConfig.usbScannerModel) {
          setUsbModel(company.biometricConfig.usbScannerModel);
        }
      }
    }
  }, [company]);

  // Click outside listener for country dropdown
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

  const currentCountry = findCountryByCode(countryCode);

  const handleSave = () => {
    if (company && onUpdateCompany) {
      const countryObj = findCountryByCode(countryCode);
      const updated: RegisteredCompany = {
        ...company,
        nameBangla,
        adminName,
        adminEmail,
        phone,
        address,
        country: countryObj.nameBangla,
        countryCode: countryObj.code,
        dialCode: countryObj.dialCode,
        timezone: countryObj.timezone,
        biometricConfig: {
          ...(company.biometricConfig || {}),
          primaryMethod: fingerprintMethod,
          allowedMethods: fingerprintMethod === 'all_methods'
            ? ['zkteco', 'usb_scanner', 'webauthn_passkey']
            : [fingerprintMethod],
          enableZKTecoPush: fingerprintMethod === 'zkteco' || fingerprintMethod === 'all_methods',
          enableUsbOptical: fingerprintMethod === 'usb_scanner' || fingerprintMethod === 'all_methods',
          enableWebAuthnPasskey: fingerprintMethod === 'webauthn_passkey' || fingerprintMethod === 'all_methods',
          zktecoDeviceModel: zktecoModel,
          zktecoSerialNumber: zktecoSn,
          zktecoDeviceName: `${nameBangla} টার্মিনাল`,
          usbScannerModel: usbModel,
          usbOpticalEnabled: fingerprintMethod === 'usb_scanner' || fingerprintMethod === 'all_methods',
          webAuthnEnabled: fingerprintMethod === 'webauthn_passkey' || fingerprintMethod === 'all_methods',
        }
      };
      onUpdateCompany(updated);
    }
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Cover & Avatar */}
        <div className="relative bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-end space-y-4 sm:space-y-0 sm:space-x-4 pt-2">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-1 shadow-xl shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-2xl font-black text-emerald-400">
                {nameBangla.charAt(0) || 'ক'}
              </div>
            </div>

            <div className="text-center sm:text-left flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl font-black text-white truncate">
                  {nameBangla}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {terminology.orgCategoryName}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  ভেরিফাইড এডমিন
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 flex items-center justify-center sm:justify-start gap-2">
                <span>কোম্পানি কোড: <strong className="text-emerald-400 font-mono">{company?.code || 'CMP-8802'}</strong></span>
                <span>&bull;</span>
                <span>স্টাফ: <strong>{totalMembersCount} জন</strong></span>
              </p>
            </div>

            <div className="shrink-0">
              {isEditing ? (
                <button
                  onClick={handleSave}
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-md cursor-pointer transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>সংরক্ষণ করুন</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center space-x-1.5 shadow-sm cursor-pointer transition"
                >
                  <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>তথ্য এডিট</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
              <Users className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
              <p className="text-lg font-black text-slate-900 dark:text-white">{totalMembersCount}</p>
              <p className="text-[11px] text-slate-500 font-medium">নিবন্ধিত {terminology.memberLabel}</p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
              <Database className="w-5 h-5 text-teal-500 mx-auto mb-1" />
              <p className="text-lg font-black text-teal-600 dark:text-teal-400">সক্রিয়</p>
              <p className="text-[11px] text-slate-500 font-medium">ক্লাউড ফায়ারস্টোর</p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
              <ShieldCheck className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
              <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">নিরাপদ</p>
              <p className="text-[11px] text-slate-500 font-medium">বায়োমেট্রিক সিস্টেম</p>
            </div>
          </div>

          {/* Detailed Info Form */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              কোম্পানি ও এডমিন প্রোফাইল বিবরণ
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  প্রতিষ্ঠানের নাম
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={nameBangla}
                    onChange={(e) => setNameBangla(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-emerald-500"
                  />
                ) : (
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-emerald-500" />
                    <span>{nameBangla}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  প্রধান এডমিন নাম
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-emerald-500"
                  />
                ) : (
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <User className="w-4 h-4 text-indigo-500" />
                    <span>{adminName}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  অফিসিয়াল ইমেইল
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-emerald-500"
                  />
                ) : (
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2 truncate">
                    <Mail className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="truncate">{adminEmail}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  মোবাইল নম্বর
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-emerald-500"
                  />
                ) : (
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-teal-500" />
                    <span>{phone}</span>
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  অফিস ঠিকানা
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-emerald-500"
                  />
                ) : (
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{address}</span>
                  </div>
                )}
              </div>

            </div>

            {/* Country, Regional Localization & Timezone Section */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-emerald-500" />
                  <span>প্রতিষ্ঠানের দেশ ও সময় অঞ্চল (Country & Timezone)</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
                  {currentCountry.timezone}
                </span>
              </div>

              {isEditing ? (
                <div className="relative" ref={countryDropdownRef}>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    দেশ নির্বাচন করুন (Searchable ISO Country List):
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-xl leading-none">{currentCountry.flag}</span>
                      <span>{currentCountry.nameBangla} ({currentCountry.nameEnglish})</span>
                      <span className="text-emerald-600 font-mono text-[11px]">{currentCountry.dialCode}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isCountryDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isCountryDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 space-y-2 max-h-60 flex flex-col">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="দেশ খুঁজুন (বাংলাদেশ, Saudi, +971, US)..."
                          value={countrySearchQuery}
                          onChange={(e) => setCountrySearchQuery(e.target.value)}
                          className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                          autoFocus
                        />
                      </div>
                      <div className="overflow-y-auto space-y-1 flex-1 pr-1 max-h-44">
                        {searchCountries(countrySearchQuery).map((c) => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => {
                              setCountryCode(c.code);
                              setIsCountryDropdownOpen(false);
                              setCountrySearchQuery('');
                            }}
                            className={`w-full px-2.5 py-2 rounded-xl text-left flex items-center justify-between text-xs transition cursor-pointer ${
                              countryCode === c.code
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <span className="flex items-center space-x-2">
                              <span>{c.flag}</span>
                              <span>{c.nameBangla} ({c.nameEnglish})</span>
                            </span>
                            <span className="font-mono text-[11px] font-bold text-emerald-600">{c.dialCode}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center space-x-2">
                    <span className="text-xl">{currentCountry.flag}</span>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{currentCountry.nameBangla}</p>
                      <p className="text-[10px] text-slate-500">ISO কোড: {currentCountry.code} ({currentCountry.dialCode})</p>
                    </div>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white font-mono">{currentCountry.timezone}</p>
                      <p className="text-[10px] text-slate-500">লোকাল অফিস টাইমজোন</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Country & Timezone Change Safety Rule Notice */}
              <div className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-900 dark:text-emerald-300 flex items-start space-x-2">
                <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>ঐতিহাসিক হাজিরা সুরক্ষা নীতি:</strong> ভবিষ্যতে দেশ বা সময় অঞ্চল পরিবর্তন করা হলে পূর্ববর্তী সকল হাজিরা রেকর্ড ও সময় অপরিবর্তিত থাকে (ইউটিসি টাইমস্ট্যাম্প সুরক্ষিত), এবং নতুন হাজিরাসমূহ নতুন সময় অঞ্চলের সাপেক্ষে যথানিয়মে হিসাব হয়।
                </p>
              </div>
            </div>

            {/* Biometric & Fingerprint Attendance System Configuration Section */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Fingerprint className="w-4 h-4 text-emerald-500" />
                  <span>কোম্পানির ফিঙ্গারপ্রিন্ট ও বায়োমেট্রিক সিস্টেম কনফিগারেশন</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 font-bold">
                  {fingerprintMethod === 'zkteco' ? 'ZKTeco মেশিন' : fingerprintMethod === 'usb_scanner' ? 'USB স্ক্যানার' : fingerprintMethod === 'webauthn_passkey' ? 'WebAuthn Passkey' : 'হাইব্রিড মোড'}
                </span>
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {/* ZKTeco Method */}
                    <label className={`p-2.5 rounded-xl border flex items-start space-x-2 cursor-pointer transition ${
                      fingerprintMethod === 'zkteco'
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 font-bold'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="primaryFingerprint"
                        value="zkteco"
                        checked={fingerprintMethod === 'zkteco'}
                        onChange={() => setFingerprintMethod('zkteco')}
                        className="mt-0.5 text-emerald-600"
                      />
                      <div>
                        <p className="font-bold text-xs flex items-center gap-1">
                          <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                          <span>ZKTeco হাজিরা মেশিন</span>
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                          মেশিনের নিজস্ব ফেস ও ফিঙ্গারপ্রিন্ট সেন্সরে যাচাই; ADMS পুশ প্রোটোকল।
                        </p>
                      </div>
                    </label>

                    {/* USB Scanner Method */}
                    <label className={`p-2.5 rounded-xl border flex items-start space-x-2 cursor-pointer transition ${
                      fingerprintMethod === 'usb_scanner'
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 font-bold'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="primaryFingerprint"
                        value="usb_scanner"
                        checked={fingerprintMethod === 'usb_scanner'}
                        onChange={() => setFingerprintMethod('usb_scanner')}
                        className="mt-0.5 text-emerald-600"
                      />
                      <div>
                        <p className="font-bold text-xs flex items-center gap-1">
                          <HardDrive className="w-3.5 h-3.5 text-teal-500" />
                          <span>USB অপটিক্যাল স্ক্যানার</span>
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                          Mantra MFS100 / SecuGen / ZKTeco SLK20R ইউএসবি ডিভাইস ও লোকাল ড্রাইভার।
                        </p>
                      </div>
                    </label>

                    {/* WebAuthn Passkey Method */}
                    <label className={`p-2.5 rounded-xl border flex items-start space-x-2 cursor-pointer transition ${
                      fingerprintMethod === 'webauthn_passkey'
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 font-bold'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="primaryFingerprint"
                        value="webauthn_passkey"
                        checked={fingerprintMethod === 'webauthn_passkey'}
                        onChange={() => setFingerprintMethod('webauthn_passkey')}
                        className="mt-0.5 text-emerald-600"
                      />
                      <div>
                        <p className="font-bold text-xs flex items-center gap-1">
                          <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
                          <span>WebAuthn / Passkey</span>
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                          ডিভাইসের বিল্ট-ইন ক্রিপ্টোগ্রাফিক বায়োমেট্রিক (র টেমপ্লেট নয়)।
                        </p>
                      </div>
                    </label>

                    {/* All Methods */}
                    <label className={`p-2.5 rounded-xl border flex items-start space-x-2 cursor-pointer transition ${
                      fingerprintMethod === 'all_methods'
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 font-bold'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="primaryFingerprint"
                        value="all_methods"
                        checked={fingerprintMethod === 'all_methods'}
                        onChange={() => setFingerprintMethod('all_methods')}
                        className="mt-0.5 text-emerald-600"
                      />
                      <div>
                        <p className="font-bold text-xs flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>সকল পদ্ধতি (হাইব্রিড)</span>
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                          ZKTeco মেশিন, USB স্ক্যানার ও পাসকি—সবগুলো অপশন একসঙ্গে সক্রিয়।
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Sub-inputs */}
                  {fingerprintMethod === 'zkteco' && (
                    <div className="grid grid-cols-2 gap-2 p-2.5 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800/60 text-xs">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">ZKTeco মডেল</span>
                        <input
                          type="text"
                          value={zktecoModel}
                          onChange={(e) => setZktecoModel(e.target.value)}
                          className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">মেশিন সিরিয়াল নম্বর (SN)</span>
                        <input
                          type="text"
                          value={zktecoSn}
                          onChange={(e) => setZktecoSn(e.target.value)}
                          className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {fingerprintMethod === 'usb_scanner' && (
                    <div className="p-2.5 bg-teal-50/50 dark:bg-teal-950/30 rounded-xl border border-teal-200 dark:border-teal-800/60 text-xs">
                      <span className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">USB স্ক্যানার মডেল</span>
                      <select
                        value={usbModel}
                        onChange={(e) => setUsbModel(e.target.value as any)}
                        className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold"
                      >
                        <option value="mantra_mfs100">Mantra MFS100 (RD Service 11100)</option>
                        <option value="zkteco_slk20r">ZKTeco SLK20R USB Scanner</option>
                        <option value="digitalpersona_4500">DigitalPersona U.are.U 4500</option>
                        <option value="generic">অন্যান্য অপটিক্যাল স্ক্যানার</option>
                      </select>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      {fingerprintMethod === 'zkteco' && <Cpu className="w-4 h-4 text-emerald-500" />}
                      {fingerprintMethod === 'usb_scanner' && <HardDrive className="w-4 h-4 text-teal-500" />}
                      {fingerprintMethod === 'webauthn_passkey' && <Smartphone className="w-4 h-4 text-indigo-500" />}
                      {fingerprintMethod === 'all_methods' && <Sparkles className="w-4 h-4 text-amber-500" />}
                      <span>
                        {fingerprintMethod === 'zkteco' ? 'ZKTeco বায়োমেট্রিক হাজিরা মেশিন' : fingerprintMethod === 'usb_scanner' ? 'USB অপটিক্যাল স্ক্যানার' : fingerprintMethod === 'webauthn_passkey' ? 'WebAuthn / Passkey বায়োমেট্রিক' : 'হাইব্রিড মোড (সকল পদ্ধতি)'}
                      </span>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      সক্রিয়
                    </span>
                  </div>

                  {fingerprintMethod === 'zkteco' && (
                    <p className="text-[11px] text-slate-500 font-mono">
                      মডেল: <strong className="text-slate-800 dark:text-slate-200">{zktecoModel}</strong> • SN: <strong className="text-emerald-600">{zktecoSn}</strong> • ক্লাউড ADMS পুশ
                    </p>
                  )}
                  {fingerprintMethod === 'usb_scanner' && (
                    <p className="text-[11px] text-slate-500">
                      মডেল: <strong className="text-slate-800 dark:text-slate-200">{usbModel}</strong> • লোকাল ড্রাইভার সার্ভিস পোর্ট রেসপন্স
                    </p>
                  )}
                  {fingerprintMethod === 'webauthn_passkey' && (
                    <p className="text-[11px] text-slate-500">
                      প্ল্যাটফর্ম বায়োমেট্রিক ক্রেডেনশিয়াল (FIDO2 / W3C WebAuthn স্ট্যান্ডার্ড)
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Settings & Security Shortcuts */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              সিস্টেম ও সিকিউরিটি অ্যাকশন
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {onOpenScheduleSettings && (
                <button
                  onClick={() => { onOpenScheduleSettings(); onClose(); }}
                  className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/30 rounded-2xl border border-emerald-500/30 flex items-center space-x-3 text-left transition cursor-pointer"
                >
                  <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-xs">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">সিডিউল, শিফট ও জিওফেন্স</p>
                    <p className="text-[10px] text-slate-500">২৪ ঘণ্টা শিফট ও GPS লোকেশন কোড</p>
                  </div>
                </button>
              )}

              {onOpenOrgSelector && (
                <button
                  onClick={() => { onOpenOrgSelector(); onClose(); }}
                  className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center space-x-3 text-left transition cursor-pointer"
                >
                  <div className="p-2 bg-teal-500/20 text-teal-600 rounded-xl">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">প্রতিষ্ঠানের ধরণ বদলান</p>
                    <p className="text-[10px] text-slate-500">{terminology.orgCategoryName}</p>
                  </div>
                </button>
              )}

              {onOpenAuditLogs && (
                <button
                  onClick={() => { onOpenAuditLogs(); onClose(); }}
                  className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center space-x-3 text-left transition cursor-pointer"
                >
                  <div className="p-2 bg-amber-500/20 text-amber-600 rounded-xl">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">সিকিউরিটি অডিট ট্রেইল</p>
                    <p className="text-[10px] text-slate-500">লগইন ও কার্যক্রম হিস্টোরি</p>
                  </div>
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          {onSignOut ? (
            <button
              onClick={() => { onSignOut(); onClose(); }}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200 flex items-center space-x-1.5 cursor-pointer transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>লগআউট করুন</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer transition"
          >
            বন্ধ করুন
          </button>
        </div>

      </div>
    </div>
  );
};
