import React, { useState, useMemo } from 'react';
import { Student, AttendanceRecord, AttendanceStatus, AttendanceMethod } from '../types';
import { OrgCategoryInfo } from '../utils/organizationConfig';
import { calculateStayDuration, calculateCurrentStayDuration } from '../utils/timeUtils';
import { saveAttendanceRecord, getStoredAttendance, exportAttendanceCSV } from '../utils/storage';
import { printHtmlContent, generateAttendanceStatementHtml } from '../utils/printUtils';
import { 
  X, 
  Clock, 
  LogIn, 
  LogOut, 
  Timer, 
  CheckCircle2, 
  Calendar, 
  Camera, 
  ShieldCheck, 
  Building2, 
  UserCheck, 
  AlertCircle, 
  Check, 
  Sparkles,
  MapPin,
  Fingerprint,
  Smartphone,
  History,
  Download,
  Search,
  Filter,
  BarChart3,
  ChevronRight,
  Printer,
  CalendarDays,
  Flame,
  CheckCheck,
  XCircle,
  Layers
} from 'lucide-react';

interface AttendanceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  attendanceRecord?: AttendanceRecord | null;
  selectedDate: string;
  orgInfo: OrgCategoryInfo;
  allAttendanceRecords?: AttendanceRecord[];
  onAttendanceUpdated: (record: AttendanceRecord) => void;
}

export const AttendanceDetailsModal: React.FC<AttendanceDetailsModalProps> = ({
  isOpen,
  onClose,
  student,
  attendanceRecord,
  selectedDate,
  orgInfo,
  allAttendanceRecords,
  onAttendanceUpdated,
}) => {
  if (!isOpen || !student) return null;

  const { terminology } = orgInfo;
  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const [activeViewTab, setActiveViewTab] = useState<'today' | 'history'>('today');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('All');
  const [historyMonthFilter, setHistoryMonthFilter] = useState<string>('All');

  const entryTime = attendanceRecord?.entryTime || attendanceRecord?.time;
  const exitTime = attendanceRecord?.exitTime;

  // Calculate duration for the selected day
  const stayCalculation = exitTime 
    ? calculateStayDuration(entryTime, exitTime)
    : (entryTime && isToday ? calculateCurrentStayDuration(entryTime) : { durationText: 'অনির্ধারিত', totalMinutes: 0 });

  const [isManualCheckoutOpen, setIsManualCheckoutOpen] = useState(false);
  const [manualTime, setManualTime] = useState('');

  // Fetch all attendance records for this student
  const studentAllRecords = useMemo(() => {
    const recordsPool = allAttendanceRecords && allAttendanceRecords.length > 0
      ? allAttendanceRecords
      : getStoredAttendance();

    return recordsPool
      .filter(r => r.studentId === student.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [student.id, allAttendanceRecords, attendanceRecord]);

  // Filtered history records
  const filteredHistoryRecords = useMemo(() => {
    return studentAllRecords.filter(rec => {
      const matchesSearch = !historySearchQuery || 
        rec.date.includes(historySearchQuery) || 
        (rec.time && rec.time.includes(historySearchQuery)) ||
        (rec.notes && rec.notes.toLowerCase().includes(historySearchQuery.toLowerCase()));

      const matchesStatus = historyStatusFilter === 'All' || rec.status === historyStatusFilter;

      const matchesMonth = historyMonthFilter === 'All' || rec.date.startsWith(historyMonthFilter);

      return matchesSearch && matchesStatus && matchesMonth;
    });
  }, [studentAllRecords, historySearchQuery, historyStatusFilter, historyMonthFilter]);

  // Overall Statistics for this member
  const totalRecordedDays = studentAllRecords.length;
  const totalPresentDays = studentAllRecords.filter(r => r.status === 'Present').length;
  const totalLateDays = studentAllRecords.filter(r => r.status === 'Late').length;
  const totalAbsentDays = studentAllRecords.filter(r => r.status === 'Absent').length;
  const attendanceRate = totalRecordedDays > 0 
    ? Math.round(((totalPresentDays + totalLateDays) / totalRecordedDays) * 100) 
    : 100;

  // Bengali Day Name helper
  const getBengaliDayName = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const days = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
      return days[d.getDay()] || '';
    } catch {
      return '';
    }
  };

  // Handle Manual Check-Out
  const handleMarkManualCheckout = () => {
    const now = new Date();
    const timeStr = manualTime || now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const updated = saveAttendanceRecord({
      studentId: student.id,
      studentName: student.nameBangla,
      roll: student.roll,
      classId: student.classId,
      className: student.className,
      date: selectedDate,
      time: timeStr,
      entryTime: entryTime || timeStr,
      exitTime: timeStr,
      status: attendanceRecord?.status || 'Present',
      method: 'Manual',
      notes: `${terminology.adminLabel} কর্তৃক প্রস্থান (বাহির) হাজিরা নথিভুক্ত করা হয়েছে`,
    });

    onAttendanceUpdated(updated);
    setIsManualCheckoutOpen(false);
  };

  // Export this member's history to CSV
  const handleExportMemberHistory = () => {
    exportAttendanceCSV(studentAllRecords, `${student.nameBangla}_হাজিরা_হিস্টোরি.csv`);
  };

  const getMethodIcon = (method?: AttendanceMethod) => {
    switch (method) {
      case 'Face AI':
      case 'Automated AI':
      case 'Self Kiosk':
        return <Camera className="w-3.5 h-3.5 text-emerald-600" />;
      case 'Fingerprint':
        return <Fingerprint className="w-3.5 h-3.5 text-blue-600" />;
      case 'GPS Selfie':
        return <MapPin className="w-3.5 h-3.5 text-purple-600" />;
      case 'QR Scan':
        return <Smartphone className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <UserCheck className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150 text-slate-900 dark:text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 sm:p-5 px-5 sm:px-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-800 border-2 border-emerald-500/60 shrink-0 shadow-md flex items-center justify-center font-black text-emerald-400 text-lg">
              {student.faceImage || student.photoUrl ? (
                <img 
                  src={student.faceImage || student.photoUrl} 
                  alt={student.nameBangla} 
                  className="w-full h-full object-cover"
                />
              ) : (
                student.nameBangla.charAt(0)
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white truncate">{student.nameBangla}</h3>
                {attendanceRecord?.verifiedByAI && (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 shrink-0">
                    <ShieldCheck className="w-3 h-3" />
                    <span>AI ভেরিফায়েড</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 font-mono flex items-center space-x-2 mt-0.5 truncate">
                <span>{terminology.idLabel}: <strong className="text-emerald-400">{student.roll}</strong></span>
                <span>•</span>
                <span className="truncate">{student.designation || student.className || terminology.memberLabel}</span>
                {student.guardianPhone && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline text-slate-400">{student.guardianPhone}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer border border-slate-700 shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-2.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveViewTab('today')}
              className={`px-4 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center space-x-1.5 ${
                activeViewTab === 'today'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>আজকের বিশদ ({selectedDate})</span>
            </button>

            <button
              onClick={() => setActiveViewTab('history')}
              className={`px-4 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center space-x-1.5 ${
                activeViewTab === 'history'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>সম্পূর্ণ ইতিহাস টেবিল ({studentAllRecords.length})</span>
            </button>
          </div>

          <button
            onClick={handleExportMemberHistory}
            className="hidden sm:flex items-center space-x-1 px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 shadow-2xs transition cursor-pointer"
            title="এই সদস্যের সকল হাজিরা রেকর্ড CSV ফাইলে ডাউনলোড করুন"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>CSV হিস্টোরি ডাউনলোড</span>
          </button>
        </div>

        {/* Modal Body with Tab Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">

          {/* TAB 1: TODAY'S DETAILED VIEW */}
          {activeViewTab === 'today' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Date & Overall Status Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-bold">তারিখ:</span>
                    <span className="font-mono bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white">
                      {selectedDate} ({getBengaliDayName(selectedDate)})
                    </span>
                  </div>

                  {attendanceRecord?.shiftName && (
                    <div className="flex items-center space-x-1.5 ml-1">
                      <span className="font-bold text-slate-500">শিফট:</span>
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-bold text-xs">
                        <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{attendanceRecord.shiftName}</span>
                        {attendanceRecord.shiftTiming && (
                          <span className="text-[10px] opacity-75 font-mono ml-1">({attendanceRecord.shiftTiming})</span>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">উপস্থিতি স্থিতি:</span>
                  {attendanceRecord?.status === 'Present' && (
                    <span className="inline-flex items-center text-xs font-bold px-3 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                      <Check className="w-3.5 h-3.5 mr-1 text-emerald-600 dark:text-emerald-400" /> উপস্থিত
                    </span>
                  )}
                  {attendanceRecord?.status === 'Late' && (
                    <span className="inline-flex items-center text-xs font-bold px-3 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                      <Clock className="w-3.5 h-3.5 mr-1 text-amber-600 dark:text-amber-400" /> বিলম্ব (Late)
                    </span>
                  )}
                  {(!attendanceRecord || attendanceRecord.status === 'Absent') && (
                    <span className="inline-flex items-center text-xs font-bold px-3 py-1 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
                      <AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-600 dark:text-rose-400" /> অনুপস্থিত
                    </span>
                  )}
                </div>
              </div>

              {/* 3 Key Metrics Cards (Entry, Exit & Stay Duration) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Card 1: প্রথম হাজিরা (প্রবেশ / Check-In) */}
                <div className="bg-emerald-50/70 dark:bg-emerald-950/20 rounded-2xl p-4 border border-emerald-200/80 dark:border-emerald-800/60 space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                      <LogIn className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>প্রথম প্রবেশ (Check-In)</span>
                    </div>
                    <span className="bg-emerald-200/70 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      প্রবেশ
                    </span>
                  </div>

                  <div className="pt-1">
                    {entryTime ? (
                      <div>
                        <div className="text-xl font-extrabold text-emerald-950 dark:text-emerald-200 font-mono">
                          {entryTime}
                        </div>
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center space-x-1 mt-1">
                          {getMethodIcon(attendanceRecord?.method)}
                          <span>{attendanceRecord?.method || 'স্বয়ংক্রিয় ফেস স্ক্যান'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-400 text-xs italic py-2">
                        এখনো কোনো প্রবেশ হাজিরা পাওয়া যায়নি
                      </div>
                    )}
                  </div>
                </div>

                {/* Card 2: পরবর্তী হাজিরা (বাহির / Check-Out) */}
                <div className={`rounded-2xl p-4 border space-y-2 relative overflow-hidden ${
                  exitTime 
                    ? 'bg-blue-50/70 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-800/60 text-blue-900 dark:text-blue-200' 
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 font-bold text-xs">
                      <LogOut className={`w-4 h-4 ${exitTime ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                      <span>পরবর্তী প্রস্থান (Check-Out)</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      exitTime ? 'bg-blue-200/70 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      বাহির
                    </span>
                  </div>

                  <div className="pt-1">
                    {exitTime ? (
                      <div>
                        <div className="text-xl font-extrabold text-blue-950 dark:text-blue-200 font-mono">
                          {exitTime}
                        </div>
                        <div className="text-[11px] text-blue-700 dark:text-blue-400 flex items-center space-x-1 mt-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>প্রস্থান সম্পন্ন</span>
                        </div>
                      </div>
                    ) : entryTime ? (
                      <div>
                        <div className="text-sm font-bold text-amber-700 dark:text-amber-400">
                          এখনো অবস্থান করছেন
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                          পরবর্তী স্ক্যানে প্রস্থান সময় স্বয়ংক্রিয়ভাবে নথিভুক্ত হবে
                        </p>
                      </div>
                    ) : (
                      <div className="text-slate-400 text-xs italic py-2">
                        প্রবেশ করেননি
                      </div>
                    )}
                  </div>
                </div>

                {/* Card 3: মোট অবস্থিত সময় (Stay / Presence Duration) */}
                <div className="bg-amber-50/80 dark:bg-amber-950/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-800/60 space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-amber-900 dark:text-amber-300 font-bold text-xs">
                      <Timer className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>মোট অবস্থিত সময়</span>
                    </div>
                    <span className="bg-amber-200/80 dark:bg-amber-900/60 text-amber-950 dark:text-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      কর্মঘণ্টা
                    </span>
                  </div>

                  <div className="pt-1">
                    {entryTime ? (
                      <div>
                        <div className="text-lg font-extrabold text-amber-950 dark:text-amber-200 font-mono leading-tight">
                          {stayCalculation.durationText || '০ মিনিট'}
                        </div>
                        <div className="text-[11px] text-amber-800 dark:text-amber-400 flex items-center space-x-1 mt-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>{exitTime ? 'কার্যকাল সমাপ্ত' : 'চলমান উপস্থিতি'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-400 text-xs italic py-2">
                        হাজিরা নেই
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Detailed Timeline & Punch History */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>আজকের স্ক্যান ইতিহাস ও টাইমলাইন (Scan Timeline)</span>
                  </h4>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 font-mono">
                    মোট স্ক্যান: {attendanceRecord?.punchCount || (attendanceRecord?.punches?.length || (entryTime ? 1 : 0))} বার
                  </span>
                </div>

                {(!attendanceRecord || (!entryTime && !exitTime)) ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    আজকে এই সদস্যের কোনো হাজিরা বা স্ক্যান তথ্য পাওয়া যায়নি।
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {attendanceRecord.punches && attendanceRecord.punches.length > 0 ? (
                      attendanceRecord.punches.map((punch, idx) => (
                        <div 
                          key={punch.id || idx}
                          className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs shadow-2xs hover:border-emerald-300 dark:hover:border-emerald-600 transition"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                              punch.type === 'Entry' 
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                                : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            }`}>
                              {punch.type === 'Entry' ? <LogIn className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                                <span>{punch.type === 'Entry' ? 'প্রথম প্রবেশ হাজিরা' : 'বাহির / প্রস্থান হাজিরা'}</span>
                                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                                  {punch.method}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{punch.notes || 'স্বয়ংক্রিয় স্ক্যানার'}</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-mono font-bold text-slate-900 dark:text-white text-sm block">
                              {punch.time}
                            </span>
                            {punch.confidenceScore && (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                AI এক্যুরেসি: {Math.round(punch.confidenceScore * 100)}%
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <>
                        {entryTime && (
                          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
                                <LogIn className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white">১ম প্রবেশ হাজিরা (Check-In)</div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">{attendanceRecord.method}</p>
                              </div>
                            </div>
                            <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{entryTime}</span>
                          </div>
                        )}

                        {exitTime && (
                          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center justify-center">
                                <LogOut className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white">২য় প্রস্থান হাজিরা (Check-Out)</div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">{attendanceRecord.method}</p>
                              </div>
                            </div>
                            <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{exitTime}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Admin Actions (Manual Check-Out or Time Correction) */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">অ্যাডমিন অ্যাকশন ও সময় সমন্বয়</h4>
                
                {isManualCheckoutOpen ? (
                  <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 dark:text-white">
                        প্রস্থান (Check-Out) সময় নির্ধারণ করুন:
                      </label>
                      <button 
                        onClick={() => setIsManualCheckoutOpen(false)}
                        className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                      >
                        বাতিল
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="time"
                        onChange={e => {
                          if (e.target.value) {
                            const [h, m] = e.target.value.split(':');
                            const d = new Date();
                            d.setHours(parseInt(h), parseInt(m), 0);
                            setManualTime(d.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
                          }
                        }}
                        className="p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-xl text-xs font-mono font-bold"
                      />
                      <button
                        onClick={handleMarkManualCheckout}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        সংরক্ষণ করুন
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {!exitTime && entryTime && (
                      <button
                        onClick={() => handleMarkManualCheckout()}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>এখনই প্রস্থান (Check-Out) নথিভুক্ত করুন</span>
                      </button>
                    )}

                    <button
                      onClick={() => setIsManualCheckoutOpen(true)}
                      className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-xs rounded-xl transition cursor-pointer flex items-center space-x-1.5"
                    >
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span>কাস্টম সময় সেট করুন</span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: FULL ATTENDANCE HISTORY TABLE */}
          {activeViewTab === 'history' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* Summary Stats Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">মোট কার্যদিবস</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">{totalRecordedDays} দিন</span>
                </div>

                <div className="bg-emerald-50/80 dark:bg-emerald-950/30 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800/60">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block">মোট উপস্থিত</span>
                  <span className="text-lg font-black text-emerald-800 dark:text-emerald-300 font-mono mt-0.5">{totalPresentDays} দিন</span>
                </div>

                <div className="bg-amber-50/80 dark:bg-amber-950/30 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-800/60">
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block">বিলম্বে উপস্থিতি (Late)</span>
                  <span className="text-lg font-black text-amber-800 dark:text-amber-300 font-mono mt-0.5">{totalLateDays} দিন</span>
                </div>

                <div className="bg-indigo-50/80 dark:bg-indigo-950/30 p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-800/60">
                  <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 block">উপস্থিতির শতকরা হার</span>
                  <span className="text-lg font-black text-indigo-800 dark:text-indigo-300 font-mono mt-0.5">{attendanceRate}%</span>
                </div>
              </div>

              {/* History Search and Filters */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="তারিখ (YYYY-MM-DD) বা নোট দিয়ে খুঁজুন..."
                    value={historySearchQuery}
                    onChange={e => setHistorySearchQuery(e.target.value)}
                    className="w-full pl-8.5 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={historyStatusFilter}
                    onChange={e => setHistoryStatusFilter(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
                  >
                    <option value="All">সকল স্ট্যাটাস</option>
                    <option value="Present">উপস্থিত</option>
                    <option value="Late">বিলম্ব</option>
                    <option value="Absent">অনুপস্থিত</option>
                  </select>

                  <button
                    onClick={() => {
                      const html = generateAttendanceStatementHtml(
                        student,
                        orgInfo.label || orgInfo.titleBangla,
                        filteredHistoryRecords
                      );
                      printHtmlContent(html, `${student.nameBangla}_উপস্থিতি_রিপোর্ট`);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
                    title="এই সদস্যের উপস্থিতি বিবরণী প্রিন্ট করুন"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>রিপোর্ট প্রিন্ট</span>
                  </button>
                </div>
              </div>

              {/* Comprehensive Attendance History Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                      <th className="p-3 pl-4 whitespace-nowrap">তারিখ ও বার</th>
                      <th className="p-3 whitespace-nowrap">শিফট</th>
                      <th className="p-3 whitespace-nowrap">১ম প্রবেশ (In)</th>
                      <th className="p-3 whitespace-nowrap">২য় প্রস্থান (Out)</th>
                      <th className="p-3 whitespace-nowrap">মোট অবস্থান</th>
                      <th className="p-3 whitespace-nowrap">পদ্ধতি</th>
                      <th className="p-3 whitespace-nowrap">স্ট্যাটাস</th>
                      <th className="p-3 pr-4 whitespace-nowrap">নোটস / বিশদ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredHistoryRecords.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                          কোনো হিস্টোরি রেকর্ড পাওয়া যায়নি।
                        </td>
                      </tr>
                    ) : (
                      filteredHistoryRecords.map((rec) => {
                        const recIn = rec.entryTime || rec.time;
                        const recOut = rec.exitTime;
                        const duration = recOut ? calculateStayDuration(recIn, recOut).durationText : (recIn ? 'চলমান' : '-');

                        return (
                          <tr 
                            key={rec.id}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                          >
                            {/* Date & Day */}
                            <td className="p-3 pl-4 whitespace-nowrap font-mono">
                              <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                                <CalendarDays className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>{rec.date}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-sans">
                                {getBengaliDayName(rec.date)}
                              </div>
                            </td>

                            {/* Shift */}
                            <td className="p-3 whitespace-nowrap">
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                <Layers className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                <span>{rec.shiftName || 'সাধারণ শিফট'}</span>
                              </span>
                            </td>

                            {/* In Time */}
                            <td className="p-3 whitespace-nowrap font-mono font-bold text-emerald-700 dark:text-emerald-400">
                              {recIn ? (
                                <span className="inline-flex items-center space-x-1 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                                  <LogIn className="w-3 h-3" />
                                  <span>{recIn}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 font-normal">-</span>
                              )}
                            </td>

                            {/* Out Time */}
                            <td className="p-3 whitespace-nowrap font-mono font-bold text-blue-700 dark:text-blue-400">
                              {recOut ? (
                                <span className="inline-flex items-center space-x-1 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                                  <LogOut className="w-3 h-3" />
                                  <span>{recOut}</span>
                                </span>
                              ) : recIn ? (
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                                  অবস্থানরত
                                </span>
                              ) : (
                                <span className="text-slate-400 font-normal">-</span>
                              )}
                            </td>

                            {/* Total Duration */}
                            <td className="p-3 whitespace-nowrap font-mono text-slate-800 dark:text-slate-200 font-semibold">
                              {duration}
                            </td>

                            {/* Method */}
                            <td className="p-3 whitespace-nowrap">
                              <span className="inline-flex items-center space-x-1 text-slate-600 dark:text-slate-300 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                                {getMethodIcon(rec.method)}
                                <span>{rec.method || 'ম্যানুয়াল'}</span>
                              </span>
                            </td>

                            {/* Status */}
                            <td className="p-3 whitespace-nowrap">
                              {rec.status === 'Present' && (
                                <span className="inline-flex items-center font-bold px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px]">
                                  <Check className="w-3 h-3 mr-1" /> উপস্থিত
                                </span>
                              )}
                              {rec.status === 'Late' && (
                                <span className="inline-flex items-center font-bold px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px]">
                                  <Clock className="w-3 h-3 mr-1" /> বিলম্ব
                                </span>
                              )}
                              {rec.status === 'Absent' && (
                                <span className="inline-flex items-center font-bold px-2 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-[11px]">
                                  <XCircle className="w-3 h-3 mr-1" /> অনুপস্থিত
                                </span>
                              )}
                            </td>

                            {/* Notes / Details */}
                            <td className="p-3 pr-4 text-slate-500 dark:text-slate-400 text-[11px]">
                              {rec.notes || '-'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 px-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            * যে কোনো সদস্যের লাইভ উপস্থিতি ও ইতিহাস সার্বক্ষণিকভাবে ক্লাউডে সংরক্ষিত থাকে।
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>

      </div>
    </div>
  );
};
