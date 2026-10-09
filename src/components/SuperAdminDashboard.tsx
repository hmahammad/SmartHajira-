import React, { useState } from 'react';
import { RegisteredCompany, Student, AuditLogItem } from '../types';
import { OrgCategoryKey, ORG_CATEGORIES } from '../utils/organizationConfig';
import { 
  Building2, 
  Plus, 
  Users, 
  Search, 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  Building, 
  GraduationCap, 
  Briefcase, 
  Factory, 
  Store, 
  Sparkles, 
  Phone, 
  Mail, 
  MapPin, 
  ExternalLink, 
  UserPlus, 
  Activity, 
  Database,
  Filter,
  Check,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';

interface SuperAdminDashboardProps {
  companies: RegisteredCompany[];
  onAddCompany: (newCompany: RegisteredCompany) => void;
  onUpdateCompanyStatus: (companyId: string, newStatus: 'Active' | 'Pending' | 'Suspended') => void;
  onSelectCompanyToManage: (company: RegisteredCompany) => void;
  onAddMemberToCompany: (member: Partial<Student>, companyId: string) => void;
  totalMembersCount: number;
  auditLogs: AuditLogItem[];
}

const CATEGORY_ICONS: Record<OrgCategoryKey, React.FC<{ className?: string }>> = {
  educational: GraduationCap,
  corporate: Briefcase,
  factory: Factory,
  medical: Building2,
  general: Store,
  somity: Users,
};

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  companies,
  onAddCompany,
  onUpdateCompanyStatus,
  onSelectCompanyToManage,
  onAddMemberToCompany,
  totalMembersCount,
  auditLogs,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  
  // Registration Modal State
  const [isRegisterCompanyModalOpen, setIsRegisterCompanyModalOpen] = useState(false);
  const [newCompanyNameBangla, setNewCompanyNameBangla] = useState('');
  const [newCompanyNameEnglish, setNewCompanyNameEnglish] = useState('');
  const [newCategory, setNewCategory] = useState<OrgCategoryKey>('corporate');
  const [newCode, setNewCode] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newConfirmPassword, setNewConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Add Member Modal State
  const [selectedCompanyForMember, setSelectedCompanyForMember] = useState<RegisteredCompany | null>(null);
  const [memberName, setMemberName] = useState('');
  const [memberNameBangla, setMemberNameBangla] = useState('');
  const [memberRoll, setMemberRoll] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [memberDepartment, setMemberDepartment] = useState('');
  const [memberDesignation, setMemberDesignation] = useState('');

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.nameBangla.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          company.nameEnglish.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          company.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'all' || company.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleRegisterCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (!newCompanyNameBangla || !newCode) return;

    if (newPassword && newPassword.length < 4) {
      setPasswordError('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।');
      return;
    }

    if (newPassword && newPassword !== newConfirmPassword) {
      setPasswordError('পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড মিলছে না!');
      return;
    }

    const companyObj: RegisteredCompany = {
      id: `cmp-${Date.now()}`,
      nameBangla: newCompanyNameBangla,
      nameEnglish: newCompanyNameEnglish || newCompanyNameBangla,
      category: newCategory,
      code: newCode,
      contactEmail: newEmail || 'info@company.com',
      contactPhone: newPhone || '01700000000',
      address: newAddress || 'ঢাকা, বাংলাদেশ',
      totalMembers: 0,
      status: 'Active',
      registeredDate: new Date().toISOString().split('T')[0],
      adminName: newAdminName || 'প্রধান এডমিন',
      password: newPassword.trim() || '123456'
    };

    onAddCompany(companyObj);
    setIsRegisterCompanyModalOpen(false);

    // Reset Form
    setNewCompanyNameBangla('');
    setNewCompanyNameEnglish('');
    setNewCode('');
    setNewEmail('');
    setNewPhone('');
    setNewAddress('');
    setNewAdminName('');
    setNewPassword('');
    setNewConfirmPassword('');
    setPasswordError('');
  };

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyForMember || !memberNameBangla) return;

    onAddMemberToCompany(
      {
        name: memberName || memberNameBangla,
        nameBangla: memberNameBangla,
        roll: memberRoll || `EMP-${Math.floor(100 + Math.random() * 900)}`,
        guardianPhone: memberPhone || '01700000000',
        department: memberDepartment || 'সাধারণ বিভাগ',
        designation: memberDesignation || 'কর্মকর্তা',
        companyId: selectedCompanyForMember.id,
        companyName: selectedCompanyForMember.nameBangla,
      },
      selectedCompanyForMember.id
    );

    setSelectedCompanyForMember(null);
    setMemberName('');
    setMemberNameBangla('');
    setMemberRoll('');
    setMemberPhone('');
    setMemberDepartment('');
    setMemberDesignation('');
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-extrabold border border-indigo-500/30">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>সুপার এডমিন কন্ট্রোল সেন্টার</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              মাল্টি-টেন্যান্ট কোম্পানি ও প্রতিষ্ঠান সেন্ট্রাল হাব
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl">
              বিভিন্ন কোম্পানি/প্রতিষ্ঠান রেজিস্ট্রেশন করুন, তাদের কর্মী বা স্টুডেন্ট সংযুক্ত করুন এবং প্রতিটি কোম্পানির পৃথক ড্যাশবোর্ড পরিচালনা করুন।
            </p>
          </div>

          <button
            onClick={() => setIsRegisterCompanyModalOpen(true)}
            className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span>নতুন কোম্পানি রেজিস্ট্রেশন করুন</span>
          </button>
        </div>

        {/* Global Key Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-indigo-900/60">
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-indigo-900/50 backdrop-blur-sm">
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold mb-1">
              <Building2 className="w-4 h-4" />
              <span>মোট নিবন্ধিত কোম্পানি</span>
            </div>
            <div className="text-2xl font-black text-white">{companies.length} টি</div>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-2xl border border-indigo-900/50 backdrop-blur-sm">
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold mb-1">
              <Users className="w-4 h-4" />
              <span>মোট কর্মী ও স্টুডেন্ট</span>
            </div>
            <div className="text-2xl font-black text-white">{totalMembersCount} জন</div>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-2xl border border-indigo-900/50 backdrop-blur-sm">
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold mb-1">
              <Activity className="w-4 h-4" />
              <span>সক্রিয় বায়োমেট্রিক ক্লাউড</span>
            </div>
            <div className="text-2xl font-black text-white">১০০% অনলাইন</div>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-2xl border border-indigo-900/50 backdrop-blur-sm">
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold mb-1">
              <Database className="w-4 h-4" />
              <span>ডেটা আইসোলেশন সিকিউরিটি</span>
            </div>
            <div className="text-2xl font-black text-white">এনক্রিপ্টেড</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="কোম্পানি বা কোড লিখে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedCategoryFilter === 'all'
                ? 'bg-slate-900 dark:bg-emerald-500 text-white dark:text-slate-950 font-extrabold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            সব কোম্পানি ({companies.length})
          </button>

          {Object.entries(ORG_CATEGORIES).map(([key, info]) => {
            const Icon = CATEGORY_ICONS[key as OrgCategoryKey];
            const count = companies.filter(c => c.category === key).length;
            return (
              <button
                key={key}
                onClick={() => setSelectedCategoryFilter(key)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
                  selectedCategoryFilter === key
                    ? 'bg-emerald-600 text-white font-extrabold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{info.terminology.orgCategoryName} ({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCompanies.map((company) => {
          const categoryMeta = ORG_CATEGORIES[company.category] || ORG_CATEGORIES.corporate;
          const CategoryIcon = CATEGORY_ICONS[company.category] || Building2;

          return (
            <div
              key={company.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4 relative group overflow-hidden"
            >
              <div className="space-y-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl group-hover:scale-110 transition-transform">
                      <CategoryIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-extrabold mb-1">
                        {categoryMeta.categoryNameBangla || categoryMeta.titleBangla}
                      </span>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                        {company.nameBangla}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono font-medium">
                        {company.code}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                      company.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                    }`}
                  >
                    {company.status === 'Active' ? 'সক্রিয়' : 'স্থগিত'}
                  </span>
                </div>

                {/* Info List */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">অ্যাডমিন ইনচার্জ:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{company.adminName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">সংযুক্ত সদস্য/কর্মী:</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{company.totalMembers} জন</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">যোগাযোগ:</span>
                    <span className="font-mono text-[11px]">{company.contactPhone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">ঠিকানা:</span>
                    <span className="truncate max-w-[180px] text-[11px]">{company.address}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => onSelectCompanyToManage(company)}
                  className="w-full py-2.5 bg-slate-900 dark:bg-emerald-500 hover:bg-slate-800 dark:hover:bg-emerald-600 text-white dark:text-slate-950 font-bold text-xs rounded-2xl transition flex items-center justify-center space-x-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>এই কোম্পানির ড্যাশবোর্ডে প্রবেশ করুন</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedCompanyForMember(company)}
                    className="py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 font-bold text-[11px] rounded-xl transition flex items-center justify-center space-x-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ কর্মী/স্টুডেন্ট</span>
                  </button>

                  <button
                    onClick={() => onUpdateCompanyStatus(company.id, company.status === 'Active' ? 'Suspended' : 'Active')}
                    className={`py-2 border font-bold text-[11px] rounded-xl transition flex items-center justify-center space-x-1 ${
                      company.status === 'Active'
                        ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                        : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    {company.status === 'Active' ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    <span>{company.status === 'Active' ? 'স্থগিত করুন' : 'সক্রিয় করুন'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Audit Logs Preview */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-500" />
          <span>সেন্ট্রাল এডমিন অ্যাক্টিভিটি ও রেজিস্ট্রি লগ</span>
        </h3>

        <div className="divide-y dark:divide-slate-800 text-xs">
          {auditLogs.slice(0, 5).map((log) => (
            <div key={log.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">{log.action} - <span className="text-emerald-500">{log.targetMember}</span></p>
                <p className="text-slate-400 text-[11px] mt-0.5">{log.details}</p>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
            </div>
          ))}
        </div>
      </div>

      {/* REGISTER COMPANY MODAL */}
      {isRegisterCompanyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-fadeIn">
            
            <div className="flex items-center justify-between border-b dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-500" />
                <span>নতুন কোম্পানি/প্রতিষ্ঠান রেজিস্ট্রেশন ফরম</span>
              </h3>
              <button
                onClick={() => setIsRegisterCompanyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterCompanySubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    কোম্পানি নাম (বাংলা)*
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: গ্রীন ফ্যাশন লিঃ"
                    value={newCompanyNameBangla}
                    onChange={(e) => setNewCompanyNameBangla(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    কোম্পানি কোড / আইডি*
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: GFL-FCT-01"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  প্রতিষ্ঠানের ক্যাটাগরি/ধরন*
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as OrgCategoryKey)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                >
                  {Object.entries(ORG_CATEGORIES).map(([key, meta]) => (
                    <option key={key} value={key}>
                      {meta.terminology.orgCategoryName} ({meta.terminology.memberPlural} উপস্থিতি)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    অ্যাডমিন ইনচার্জের নাম
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: জহিরুল ইসলাম (GM)"
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    মোবাইল নাম্বার
                  </label>
                  <input
                    type="text"
                    placeholder="01711223344"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ইমেইল এড্রেস
                </label>
                <input
                  type="email"
                  placeholder="admin@company.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  অফিস/প্রতিষ্ঠানের ঠিকানা
                </label>
                <input
                  type="text"
                  placeholder="যেমন: লেভেল-৩, ইএফসি টাওয়ার, সাভার"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    এডমিন পাসওয়ার্ড সেটআপ
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="ডিফল্ট: 123456"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-2.5 pr-8 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(prev => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    পাসওয়ার্ড নিশ্চিত করুন
                  </label>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="একই পাসওয়ার্ড দিন"
                    value={newConfirmPassword}
                    onChange={(e) => setNewConfirmPassword(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono text-xs"
                  />
                </div>
              </div>

              {passwordError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
                  {passwordError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl transition shadow-lg shadow-emerald-600/30"
              >
                কোম্পানি রেজিস্ট্রেশন সম্পন্ন করুন
              </button>
            </form>

          </div>
        </div>
      )}

      {/* ADD MEMBER TO COMPANY MODAL */}
      {selectedCompanyForMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  কর্মী/স্টুডেন্ট যুক্ত করুন
                </h3>
                <p className="text-xs text-emerald-500 font-bold">
                  কোম্পানি: {selectedCompanyForMember.nameBangla}
                </p>
              </div>
              <button
                onClick={() => setSelectedCompanyForMember(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMemberSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  সদস্য/কর্মীর নাম (বাংলা)*
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: কামরুল হাসান"
                  value={memberNameBangla}
                  onChange={(e) => setMemberNameBangla(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    রোল / কার্ড আইডি
                  </label>
                  <input
                    type="text"
                    placeholder="EMP-501"
                    value={memberRoll}
                    onChange={(e) => setMemberRoll(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    মোবাইল নাম্বার
                  </label>
                  <input
                    type="text"
                    placeholder="01700000000"
                    value={memberPhone}
                    onChange={(e) => setMemberPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    বিভাগ / সেকশন
                  </label>
                  <input
                    type="text"
                    placeholder="আইটি সেকশন"
                    value={memberDepartment}
                    onChange={(e) => setMemberDepartment(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    পদবী / ডেজিগনেশন
                  </label>
                  <input
                    type="text"
                    placeholder="সফটওয়্যার ইঞ্জিনিয়ার"
                    value={memberDesignation}
                    onChange={(e) => setMemberDesignation(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl transition mt-2 shadow-lg shadow-emerald-600/30"
              >
                সদস্য যুক্তকরণ সম্পন্ন করুন
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
