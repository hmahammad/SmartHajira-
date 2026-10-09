import React, { useState, useRef } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  Filter, 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  Phone, 
  Mail, 
  Building2, 
  ShieldCheck, 
  Camera, 
  ChevronRight, 
  Download,
  Calendar,
  Sparkles,
  Layers,
  ArrowUpDown,
  Fingerprint,
  Edit3,
  Trash2,
  Zap,
  Clock,
  Check,
  X,
  Smartphone,
  ShieldAlert,
  FileSpreadsheet,
  UploadCloud,
  ArrowRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Student, ClassSubject } from '../types';
import { OrgCategoryInfo } from '../utils/organizationConfig';
import { isFaceActuallyRegistered, isFingerprintActuallyRegistered, isFingerprintPendingApproval, isFingerprintApproved } from '../utils/faceMatching';

interface UserDirectoryViewProps {
  students: Student[];
  classes: ClassSubject[];
  orgInfo: OrgCategoryInfo;
  onOpenRegisterModal: () => void;
  onOpenSmartIdCard?: () => void;
  onOpenFaceScanner?: () => void;
  onOpenBiometricsModal?: (student: Student) => void;
  onOpenMemberProfile?: (student: Student) => void;
  onEditStudent?: (student: Student) => void;
  onDeleteStudent?: (studentId: string) => void;
  onApproveBiometrics?: (studentId: string, status: 'Approved' | 'Rejected' | 'None') => void;
  onBulkStudentsAdded?: (newStudents: Student[]) => void;
}

export const UserDirectoryView: React.FC<UserDirectoryViewProps> = ({
  students,
  classes,
  orgInfo,
  onOpenRegisterModal,
  onOpenSmartIdCard,
  onOpenFaceScanner,
  onOpenBiometricsModal,
  onOpenMemberProfile,
  onEditStudent,
  onDeleteStudent,
  onApproveBiometrics,
  onBulkStudentsAdded,
}) => {
  const { terminology } = orgInfo;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [isBulkExcelModalOpen, setIsBulkExcelModalOpen] = useState(false);
  const [excelPreviewWorkers, setExcelPreviewWorkers] = useState<{ roll: string; name: string; dept: string; isExisting: boolean }[]>([]);
  const [excelNotice, setExcelNotice] = useState<string | null>(null);
  const excelInputRef = useRef<HTMLInputElement | null>(null);

  const handleExcelFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        if (!buffer) return;

        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

        if (rows.length === 0) {
          setExcelNotice('এক্সেলে কোনো কর্মীর তথ্য পাওয়া যায়নি।');
          return;
        }

        const existingRolls = new Set(students.map(s => String(s.roll).trim()));
        const parsed: typeof excelPreviewWorkers = [];

        rows.forEach((row, idx) => {
          const keys = Object.keys(row);
          const idKey = keys.find(k => {
            const lk = k.toLowerCase().replace(/[^a-z0-9]/g, '');
            return lk.includes('id') || lk.includes('badgenumber') || lk.includes('acno') || lk.includes('enroll') || lk.includes('roll');
          }) || keys[0];

          const nameKey = keys.find(k => {
            const lk = k.toLowerCase().replace(/[^a-z0-9]/g, '');
            return lk.includes('name') || lk.includes('employee') || lk.includes('worker') || lk.includes('নাম');
          }) || keys[1];

          const deptKey = keys.find(k => {
            const lk = k.toLowerCase().replace(/[^a-z0-9]/g, '');
            return lk.includes('dept') || lk.includes('department') || lk.includes('title') || lk.includes('designation');
          });

          const roll = String(row[idKey] ?? '').trim() || String(idx + 101);
          const name = String(row[nameKey] ?? '').trim() || `কর্মী #${roll}`;
          const dept = deptKey ? String(row[deptKey] ?? '').trim() : 'জেনারেল ওয়ার্কার্স';

          parsed.push({
            roll,
            name,
            dept: dept || 'জেনারেল ওয়ার্কার্স',
            isExisting: existingRolls.has(roll)
          });
        });

        setExcelPreviewWorkers(parsed);
        const newCount = parsed.filter(p => !p.isExisting).length;
        setExcelNotice(`মোট ${parsed.length} জন কর্মী চিহ্নিত (${newCount} জন একদম নতুন)`);
      } catch {
        setExcelNotice('ফাইলটি পড়তে সমস্যা হয়েছে। সঠিক এক্সেল বা CSV ফাইল দিন।');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = () => {
    if (!onBulkStudentsAdded || excelPreviewWorkers.length === 0) return;
    const newWorkersOnly = excelPreviewWorkers.filter(w => !w.isExisting);
    if (newWorkersOnly.length === 0) {
      alert('সকল কর্মী ইতোমধ্যে সিস্টেমে অন্তর্ভুক্ত রয়েছে।');
      setIsBulkExcelModalOpen(false);
      return;
    }

    const newStudentObjects: Student[] = newWorkersOnly.map(w => ({
      id: `std-zk-${Date.now()}-${w.roll}-${Math.random().toString(36).substring(2, 6)}`,
      name: w.name,
      nameBangla: w.name,
      roll: w.roll,
      classId: 'default',
      className: w.dept || 'জেনারেল ওয়ার্কার্স',
      department: w.dept || 'জেনারেল ওয়ার্কার্স',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      gender: 'Male',
      guardianPhone: '',
      parentPhone: '',
      attendanceStreak: 0,
      active: true,
      faceRegistered: false,
      fingerprintRegistered: true,
      designation: w.dept || 'ওয়ার্কার',
      joinDate: new Date().toISOString().split('T')[0]
    }));

    onBulkStudentsAdded(newStudentObjects);
    setIsBulkExcelModalOpen(false);
    setExcelPreviewWorkers([]);
    setExcelNotice(null);
  };

  // Pending biometric approvals
  const pendingBiometricStudents = students.filter(isFingerprintPendingApproval);

  // Filter students
  const filteredStudents = students.filter(student => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !query ||
      student.nameBangla.toLowerCase().includes(query) ||
      (student.nameEnglish && student.nameEnglish.toLowerCase().includes(query)) ||
      student.roll.toLowerCase().includes(query) ||
      ((student.guardianPhone || student.parentPhone) && (student.guardianPhone || student.parentPhone || '').includes(query)) ||
      (student.email && student.email.toLowerCase().includes(query)) ||
      (student.designation && student.designation.toLowerCase().includes(query));

    const matchesClass = selectedClassFilter === 'All' || student.classId === selectedClassFilter;
    
    let matchesStatus = true;
    if (selectedStatusFilter === 'Active') matchesStatus = student.active !== false;
    if (selectedStatusFilter === 'Inactive') matchesStatus = student.active === false;
    if (selectedStatusFilter === 'PendingBio') matchesStatus = isFingerprintPendingApproval(student);

    return matchesSearch && matchesClass && matchesStatus;
  });

  const enrolledBiometricsCount = students.filter(isFaceActuallyRegistered).length;
  const enrolledFingerprintCount = students.filter(isFingerprintApproved).length;
  const activeCount = students.filter(s => s.active !== false).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Banner & Action Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-2xl text-slate-950 shadow-md">
            <Users className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>{terminology.memberLabel} তালিকা ও ডিরেক্টরি</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                মোট {students.length} জন
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              সকল {terminology.memberLabel}দের প্রোফাইল, মোবাইল বায়োমেট্রিক ফিঙ্গারপ্রিন্ট অনুমোদন, ফেস ডাটা ও তথ্য নিয়ন্ত্রণ করুন
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {onBulkStudentsAdded && (
            <button
              onClick={() => setIsBulkExcelModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs rounded-2xl border border-emerald-300 dark:border-emerald-700/60 transition flex items-center space-x-2 cursor-pointer shadow-xs"
              title="কম্পিউটারের ZK সফটওয়্যার বা Excel থেকে সকল কর্মী ইমপোর্ট করুন"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>কম্পিউটার/Excel থেকে কর্মী আনুন</span>
            </button>
          )}

          {onOpenSmartIdCard && (
            <button
              onClick={onOpenSmartIdCard}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-2xl border border-slate-300 dark:border-slate-700 transition flex items-center space-x-2 cursor-pointer shadow-xs"
            >
              <QrCode className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              <span>আইডি কার্ডসমূহ</span>
            </button>
          )}

          <button
            onClick={onOpenRegisterModal}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-2xl transition flex items-center space-x-2 shadow-md cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ নতুন {terminology.memberLabel} যোগ</span>
          </button>
        </div>
      </div>

      {/* Bulk Excel Import Modal */}
      {isBulkExcelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">কম্পিউটার সফটওয়্যার / Excel থেকে কর্মী ইমপোর্ট</h3>
                  <p className="text-[11px] text-slate-500">আপনাকে পুনরায় নতুন করে কারো তথ্য হাতে এন্ট্রি করতে হবে না</p>
                </div>
              </div>
              <button onClick={() => setIsBulkExcelModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs space-y-2">
              <p className="font-bold text-emerald-900 dark:text-emerald-300">💡 কীভাবে কম্পিউটার সফটওয়্যার থেকে ফাইল পাবেন?</p>
              <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                আপনার পিসির <b>ZKTime / ZKBio Time / Att2008</b> সফটওয়্যার ওপেন করুন &gt; <b>Personnel / Employee</b> লিস্টে যান &gt; <b>Export</b> বাটনে ক্লিক করে <b>Excel (.xlsx)</b> বা <b>CSV</b> ফরম্যাটে সেভ করুন।
              </p>
            </div>

            <input
              type="file"
              ref={excelInputRef}
              accept=".xlsx,.xls,.csv"
              onChange={handleExcelFileUpload}
              className="hidden"
            />

            <div 
              onClick={() => excelInputRef.current?.click()}
              className="border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/40 hover:bg-emerald-50/20 transition rounded-2xl p-6 text-center cursor-pointer space-y-2"
            >
              <UploadCloud className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">এক্সেল (.xlsx, .xls) বা CSV ফাইল সিলেক্ট করতে ক্লিক করুন</p>
              <p className="text-[10px] text-slate-500">মেশিন বা কম্পিউটার সফটওয়্যারের এক্সপোর্টকৃত ফাইল</p>
            </div>

            {excelNotice && (
              <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 text-center">
                {excelNotice}
              </div>
            )}

            {excelPreviewWorkers.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50 dark:bg-slate-950">
                <p className="text-[11px] font-bold text-slate-500 px-2">কর্মীদের প্রিভিউ ({excelPreviewWorkers.length} জন):</p>
                <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {excelPreviewWorkers.slice(0, 10).map((w, idx) => (
                    <div key={idx} className="p-1.5 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">#{w.roll}</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{w.name}</span>
                        <span className="text-[10px] text-slate-400">({w.dept})</span>
                      </div>
                      {w.isExisting ? (
                        <span className="text-[10px] text-slate-400">অলরেডি আছে</span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-500">নতুন</span>
                      )}
                    </div>
                  ))}
                  {excelPreviewWorkers.length > 10 && (
                    <p className="text-[10px] text-center text-slate-400 py-1">... এবং আরো {excelPreviewWorkers.length - 10} জন</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkExcelModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={excelPreviewWorkers.length === 0}
                onClick={handleConfirmImport}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
              >
                সকল নতুন কর্মী যোগ করুন ({excelPreviewWorkers.filter(w => !w.isExisting).length} জন)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Mini-Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">মোট {terminology.memberLabel}</p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{students.length} জন</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">ফেস ডাটা সক্রিয়</p>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{enrolledBiometricsCount} জন</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs col-span-2 sm:col-span-1">
          <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400">ফেস ডাটা বাকি</p>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">{students.length - enrolledBiometricsCount} জন</p>
        </div>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`নাম, ${terminology.idLabel} বা মোবাইল দিয়ে খুঁজুন...`}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-emerald-500 transition"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          
          {/* Class Filter */}
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-emerald-500 transition cursor-pointer"
          >
            <option value="All">সকল {terminology.groupLabel}</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                {c.classNameBangla} ({c.section})
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-emerald-500 transition cursor-pointer"
          >
            <option value="All">সকল স্ট্যাটাস</option>
            <option value="Active">সক্রিয় (Active)</option>
            <option value="PendingBio">⏳ ফিঙ্গারপ্রিন্ট আবেদন ({pendingBiometricStudents.length})</option>
            <option value="Inactive">নিষ্ক্রিয় (Inactive)</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-xs font-bold">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              টেবিল ভিউ
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              কার্ড ভিউ
            </button>
          </div>

        </div>
      </div>

      {/* Directory Content */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
          <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">কোন {terminology.memberLabel} পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            আপনার অনুসন্ধান বা ফিল্টারের সাথে মিলে এমন কোনো তথ্য নেই। নতুন সদস্য যোগ করতে নিচের বাটনে ক্লিক করুন।
          </p>
          <button
            onClick={onOpenRegisterModal}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl inline-flex items-center space-x-1.5 cursor-pointer shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{terminology.registerActionText}</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          {/* Table Container with safe min-width and horizontal scrolling */}
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[880px] text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[200px]">{terminology.memberLabel} ও প্রোফাইল</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[100px]">{terminology.idLabel}</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[150px]">যোগাযোগ</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[160px]">মোবাইল ফেস স্ট্যাটাস</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[90px]">স্ট্যাটাস</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[200px]">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredStudents.map(student => {
                  const hasFace = isFaceActuallyRegistered(student);

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div 
                          className="flex items-center space-x-3 cursor-pointer group"
                          onClick={() => onOpenMemberProfile ? onOpenMemberProfile(student) : (onOpenBiometricsModal && onOpenBiometricsModal(student))}
                        >
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-700 dark:text-emerald-300 font-black flex items-center justify-center border border-emerald-500/30 shrink-0 overflow-hidden shadow-xs group-hover:scale-105 transition">
                            {(student.photoUrl || student.faceImage) ? (
                              <img src={student.photoUrl || student.faceImage} alt={student.nameBangla} className="w-full h-full object-cover" />
                            ) : (
                              student.nameBangla.charAt(0)
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-500 transition">{student.nameBangla}</p>
                            {student.nameEnglish && (
                              <p className="text-[10px] text-slate-400 truncate">
                                {student.nameEnglish}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* ID / Roll */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {student.roll}
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          {(student.guardianPhone || student.parentPhone) ? (
                            <p className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                              <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                              <span>{student.guardianPhone || student.parentPhone}</span>
                            </p>
                          ) : (
                            <span className="text-[10px] text-slate-400">নম্বর নেই</span>
                          )}
                          {student.email && (
                            <p className="flex items-center space-x-1.5 text-slate-400 text-[10px] truncate max-w-[150px]">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{student.email}</span>
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Face Biometric Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {hasFace ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" title="ফেস সক্রিয়">
                              <Camera className="w-3.5 h-3.5 text-emerald-500" />
                              <span>ফেস সক্রিয়</span>
                            </span>
                            {student.faceBiometricCode && (
                              <p className="text-[9px] font-mono text-slate-400 pl-1">
                                {student.faceBiometricCode}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800" title="ক্যামেরা দিয়ে ফেস ছবি নেওয়া বাকি">
                            <span>ফেস বাকি</span>
                          </span>
                        )}
                      </td>

                      {/* Active Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          student.active !== false 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                            : 'bg-red-500/10 text-red-600 border border-red-500/20'
                        }`}>
                          {student.active !== false ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          
                          {/* 1. Member Profile & Face Enrollment (PRIMARY) */}
                          <button
                            onClick={() => onOpenMemberProfile ? onOpenMemberProfile(student) : (onOpenBiometricsModal && onOpenBiometricsModal(student))}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                            title="সদস্যের প্রোফাইল ও ক্যামেরা দিয়ে ফেস এনরোল করুন"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>প্রোফাইল ও ফেস</span>
                          </button>

                          {/* 2. Edit Profile Button */}
                          {onEditStudent && (
                            <button
                              onClick={() => onEditStudent(student)}
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                              title="তথ্য এডিট করুন"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* 3. Delete Option */}
                          {onDeleteStudent && (
                            <button
                              onClick={() => {
                                if (confirm(`আপনি কি "${student.nameBangla}" এর প্রোফাইল মুছে ফেলতে চান?`)) {
                                  onDeleteStudent(student.id);
                                }
                              }}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                              title="প্রোফাইল মুছুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map(student => {
            const studentClass = classes.find(c => c.id === student.classId);
            const hasFace = isFaceActuallyRegistered(student);
            const isPending = isFingerprintPendingApproval(student);
            const isApproved = isFingerprintApproved(student);

            return (
              <div key={student.id} className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition ${isPending ? 'border-amber-400 dark:border-amber-600/80 bg-amber-50/20' : 'border-slate-200 dark:border-slate-800'}`}>
                
                <div className="flex items-start space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-700 dark:text-emerald-300 font-black text-lg flex items-center justify-center border border-emerald-500/30 shrink-0 overflow-hidden shadow-xs">
                    {(student.photoUrl || student.faceImage) ? (
                      <img src={student.photoUrl || student.faceImage} alt={student.nameBangla} className="w-full h-full object-cover" />
                    ) : (
                      student.nameBangla.charAt(0)
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {student.nameBangla}
                      </h4>
                      {onEditStudent && (
                        <button
                          onClick={() => onEditStudent(student)}
                          className="p-1 text-slate-400 hover:text-amber-600 transition cursor-pointer"
                          title="তথ্য এডিট করুন"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {terminology.idLabel}: {student.roll}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {studentClass?.classNameBangla || student.classId}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-1.5 text-xs">
                  {(student.guardianPhone || student.parentPhone) && (
                    <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                      <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{student.guardianPhone || student.parentPhone}</span>
                    </div>
                  )}
                  {student.fingerprintDeviceModel && (
                    <div className="flex items-center space-x-2 text-slate-500 text-[11px] truncate font-mono">
                      <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{student.fingerprintDeviceModel}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 gap-2">
                  <div>
                    {hasFace ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                        <Camera className="w-3 h-3 text-emerald-500" />
                        <span>ফেস সক্রিয়</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                        <span>ফেস বাকি</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => onOpenMemberProfile ? onOpenMemberProfile(student) : (onOpenBiometricsModal && onOpenBiometricsModal(student))}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1 cursor-pointer transition shadow-xs"
                      title="প্রোফাইল ও ফেস এনরোলমেন্ট"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>প্রোফাইল ও ফেস</span>
                    </button>

                    {onEditStudent && (
                      <button
                        onClick={() => onEditStudent(student)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl transition cursor-pointer"
                        title="এডিট"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
