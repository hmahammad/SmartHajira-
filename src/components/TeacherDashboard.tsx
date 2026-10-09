import React, { useState, useRef, useEffect } from 'react';
import { Student, ClassSubject, AttendanceRecord, AttendanceStatus } from '../types';
import { exportAttendanceCSV, saveAttendanceRecord } from '../utils/storage';
import { OrgCategoryInfo } from '../utils/organizationConfig';
import { isFaceActuallyRegistered, isFingerprintActuallyRegistered, isFingerprintPendingApproval } from '../utils/faceMatching';
import { getStoredScheduleSettings, getCurrentActiveShift } from '../utils/scheduleConfig';
import { AttendanceDetailsModal } from './AttendanceDetailsModal';
import { EditAttendanceHistoryModal } from './EditAttendanceHistoryModal';
import { parseTimeToMinutes } from '../utils/timeUtils';
import { 
  Camera, 
  UserPlus, 
  Download, 
  Search, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Check, 
  Sparkles, 
  Filter, 
  ChevronDown, 
  CheckCheck, 
  MapPin, 
  MessageSquare, 
  QrCode, 
  Lock, 
  Fingerprint,
  SlidersHorizontal,
  Layers,
  ChevronRight,
  Users,
  Zap,
  Edit3,
  LogIn,
  LogOut,
  Timer,
  Info,
  Eye,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Cpu,
  HardDrive,
  Smartphone,
  RefreshCw,
  Wifi,
  ExternalLink
} from 'lucide-react';
import { RegisteredCompany } from '../types';

interface TeacherDashboardProps {
  classes: ClassSubject[];
  selectedClassId: string;
  onSelectClass: (classId: string) => void;
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  onOpenFaceScanner: () => void;
  onOpenRegisterModal: () => void;
  onAttendanceUpdated: (record: AttendanceRecord) => void;
  orgInfo: OrgCategoryInfo;
  activeCompany?: RegisteredCompany | null;
  onOpenGeofenceModal?: () => void;
  onOpenSmsModal?: () => void;
  onOpenSmartIdCard?: () => void;
  onOpenAuditLog?: () => void;
  onOpenFingerprintScanner?: () => void;
  onOpenAttendanceLinkModal?: () => void;
  onOpenZKTecoDeviceModal?: () => void;
  onOpenBiometricsModal?: (student: Student) => void;
  onOpenEditModal?: (student: Student) => void;
  onNavigateToUsers?: () => void;
  onOpenMemberProfile?: (student: Student) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  classes,
  selectedClassId,
  onSelectClass,
  students,
  attendanceRecords,
  onOpenFaceScanner,
  onOpenRegisterModal,
  onAttendanceUpdated,
  orgInfo,
  activeCompany,
  onOpenGeofenceModal,
  onOpenSmsModal,
  onOpenSmartIdCard,
  onOpenAuditLog,
  onOpenFingerprintScanner,
  onOpenAttendanceLinkModal,
  onOpenZKTecoDeviceModal,
  onOpenBiometricsModal,
  onOpenEditModal,
  onNavigateToUsers,
  onOpenMemberProfile,
}) => {
  const { terminology } = orgInfo;

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Present' | 'Late' | 'Absent'>('All');
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState<boolean>(false);
  const toolsDropdownRef = useRef<HTMLDivElement>(null);

  // Attendance Details Modal State
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<Student | null>(null);
  const [selectedRecordForDetails, setSelectedRecordForDetails] = useState<AttendanceRecord | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);

  // Attendance History Edit Modal State
  const [selectedStudentForHistoryEdit, setSelectedStudentForHistoryEdit] = useState<Student | null>(null);
  const [selectedRecordForHistoryEdit, setSelectedRecordForHistoryEdit] = useState<AttendanceRecord | null>(null);
  const [isHistoryEditModalOpen, setIsHistoryEditModalOpen] = useState<boolean>(false);

  const handleOpenDetails = (student: Student, record?: AttendanceRecord) => {
    setSelectedStudentForDetails(student);
    setSelectedRecordForDetails(record || null);
    setIsDetailsModalOpen(true);
  };

  const handleOpenHistoryEdit = (student: Student, record?: AttendanceRecord) => {
    setSelectedStudentForHistoryEdit(student);
    setSelectedRecordForHistoryEdit(record || null);
    setIsHistoryEditModalOpen(true);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(event.target as Node)) {
        setIsToolsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentClass = classes.find(c => c.id === selectedClassId) || classes[0];
  const classStudents = (!selectedClassId || selectedClassId === 'all' || !students.some(s => s.classId === selectedClassId))
    ? students
    : students.filter(s => s.classId === selectedClassId);

  const scheduleSettings = getStoredScheduleSettings();
  const currentActiveShift = getCurrentActiveShift(scheduleSettings, new Date());
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<string>('All');

  // Real ZKTeco Hardware Terminal Status polling
  const [zktecoStatusData, setZktecoStatusData] = useState<{
    isOnline: boolean;
    lastHeartbeatTime: string | null;
    totalLogs: number;
    activeOnlineCount: number;
  }>({
    isOnline: false,
    lastHeartbeatTime: null,
    totalLogs: 0,
    activeOnlineCount: 0
  });
  const [isTestingZkConnection, setIsTestingZkConnection] = useState(false);
  const [zkTestFeedback, setZkTestFeedback] = useState<string | null>(null);

  // Poll real ZKTeco connection status
  useEffect(() => {
    const fetchZkStatus = async () => {
      try {
        const res = await fetch('/api/zkteco/status');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            const hasOnline = (data.devices || []).some((d: any) => d.isOnline) || data.activeOnlineCount > 0;
            const latestHb = data.devices?.[0]?.lastHeartbeatTime || null;
            setZktecoStatusData({
              isOnline: hasOnline,
              lastHeartbeatTime: latestHb,
              totalLogs: data.totalLogs || 0,
              activeOnlineCount: data.activeOnlineCount || 0
            });
          }
        }
      } catch {
        // silent
      }
    };

    fetchZkStatus();
    const interval = setInterval(fetchZkStatus, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleManualZkPing = async () => {
    setIsTestingZkConnection(true);
    setZkTestFeedback(null);
    try {
      const targetSn = activeCompany?.biometricConfig?.zktecoSerialNumber || 'UFS2254700071';
      const targetIp = activeCompany?.biometricConfig?.zktecoAllowedIp || '';
      const res = await fetch('/api/zkteco/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serialNumber: targetSn, ipAddress: targetIp })
      });
      const data = await res.json();
      setZkTestFeedback(data.message);
      setZktecoStatusData(prev => ({
        ...prev,
        isOnline: Boolean(data.isOnline)
      }));
    } catch {
      setZkTestFeedback('নেটওয়ার্ক পরীক্ষা ব্যর্থ হয়েছে।');
    } finally {
      setIsTestingZkConnection(false);
    }
  };

  const currentBiometricMethod = activeCompany?.biometricConfig?.primaryMethod || 'zkteco';

  const getShiftBadgeStyle = (code?: string, name?: string) => {
    const text = ((code || '') + ' ' + (name || '')).toLowerCase();
    if (text.includes('morning') || text.includes('মর্নিং') || text.includes('সকাল')) {
      return 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700';
    }
    if (text.includes('night') || text.includes('নাইট') || text.includes('রাত')) {
      return 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700';
    }
    if (text.includes('evening') || text.includes('ইভনিং') || text.includes('সন্ধ্যা')) {
      return 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700';
    }
    return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700';
  };

  const getShiftIcon = (code?: string, name?: string) => {
    const text = ((code || '') + ' ' + (name || '')).toLowerCase();
    if (text.includes('morning') || text.includes('মর্নিং') || text.includes('সকাল')) {
      return <Sunrise className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />;
    }
    if (text.includes('night') || text.includes('নাইট') || text.includes('রাত')) {
      return <Moon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />;
    }
    if (text.includes('evening') || text.includes('ইভনিং') || text.includes('সন্ধ্যা')) {
      return <Sunset className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />;
    }
    return <Sun className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
  };

  // Map students with their attendance record for the selected date
  // Sort so that the latest entry/punch appears at the very top of the table
  const studentRows = classStudents.map(student => {
    const record = attendanceRecords.find(
      r => r.studentId === student.id && r.date === selectedDate
    );
    return {
      student,
      record,
      status: record ? record.status : ('Absent' as AttendanceStatus),
    };
  }).sort((a, b) => {
    // 1. If both have attendance records on selected date: sort by latest timestamp/time in descending order (latest first)
    if (a.record && b.record) {
      if (a.record.updatedAt && b.record.updatedAt) {
        return b.record.updatedAt - a.record.updatedAt;
      }
      const timeA = parseTimeToMinutes(a.record.exitTime || a.record.time || a.record.entryTime || '') ?? 0;
      const timeB = parseTimeToMinutes(b.record.exitTime || b.record.time || b.record.entryTime || '') ?? 0;
      if (timeB !== timeA) return timeB - timeA;
    }
    // 2. An attended member appears before an unattended member
    if (a.record && !b.record) return -1;
    if (!a.record && b.record) return 1;

    // 3. Otherwise sort by ID / Roll
    return (a.student.roll || '').localeCompare(b.student.roll || '', undefined, { numeric: true });
  });

  // Filter rows with resilient name and shift check
  const filteredRows = studentRows.filter(({ student, record, status }) => {
    const displayName = student.nameBangla || student.name || student.nameEnglish || student.roll || '';
    const matchesSearch =
      displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.nameBangla || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.roll || '').includes(searchQuery);
    const matchesStatus = statusFilter === 'All' || status === statusFilter;

    const studentShift = (student as any).shiftId || (student as any).assignedShiftId;
    const matchesShift = selectedShiftFilter === 'All'
      ? true
      : selectedShiftFilter === 'active'
        ? (record 
            ? (record.shiftId === currentActiveShift.id || record.shiftCode === currentActiveShift.code) 
            : (studentShift ? studentShift === currentActiveShift.id : true))
        : (record 
            ? (record.shiftId === selectedShiftFilter || record.shiftCode === selectedShiftFilter) 
            : (studentShift ? studentShift === selectedShiftFilter : true));

    return matchesSearch && matchesStatus && matchesShift;
  });

  // Quick manual status change
  const handleStatusChange = (student: Student, newStatus: AttendanceStatus) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
    const displayName = student.nameBangla || student.name || student.nameEnglish || 'সদস্য';

    const updated = saveAttendanceRecord({
      studentId: student.id,
      studentName: displayName,
      roll: student.roll,
      classId: selectedClassId,
      className: currentClass ? currentClass.classNameBangla : '',
      date: selectedDate,
      time: timeStr,
      status: newStatus,
      method: 'Manual',
      shiftId: currentActiveShift?.id || 'shift-day',
      shiftName: currentActiveShift?.nameBangla || 'সাধারণ ডে শিফট',
      shiftCode: currentActiveShift?.code || 'DAY',
      shiftTiming: currentActiveShift ? `${currentActiveShift.startTime} - ${currentActiveShift.endTime}` : '09:00 - 17:00',
      notes: `${terminology.adminLabel} কর্তৃক ম্যানুয়ালি হালনাগাদ করা হয়েছে (${newStatus})`,
    });

    onAttendanceUpdated(updated);
  };

  // Quick shift selection change after attendance is given
  const handleShiftChange = (student: Student, record: AttendanceRecord | undefined, newShiftId: string) => {
    const targetShift = (scheduleSettings.shifts || []).find(s => s.id === newShiftId) || currentActiveShift;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
    const displayName = student.nameBangla || student.name || student.nameEnglish || 'সদস্য';

    const updated = saveAttendanceRecord({
      ...(record || {}),
      studentId: student.id,
      studentName: displayName,
      roll: student.roll,
      classId: student.classId || selectedClassId,
      className: student.className || (currentClass ? currentClass.classNameBangla : ''),
      date: selectedDate,
      time: record?.time || timeStr,
      entryTime: record?.entryTime || record?.time || timeStr,
      exitTime: record?.exitTime,
      status: record?.status || 'Present',
      method: record?.method || 'Manual',
      shiftId: targetShift.id,
      shiftName: targetShift.nameBangla,
      shiftCode: targetShift.code,
      shiftTiming: `${targetShift.startTime} - ${targetShift.endTime}`,
      notes: record?.notes 
        ? `${record.notes} (শিফট পরিবর্তন: ${targetShift.nameBangla})` 
        : `শিফট নির্ধারণ: ${targetShift.nameBangla}`,
    });

    onAttendanceUpdated(updated);
  };

  // Mark All Present Shortcut
  const handleMarkAllPresent = () => {
    if (confirm(`${currentClass?.classNameBangla || ''} এর সকলকে 'উপস্থিত' হিসেবে এনট্রি করতে চান?`)) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });

      classStudents.forEach(student => {
        const displayName = student.nameBangla || student.name || student.nameEnglish || 'সদস্য';
        const updated = saveAttendanceRecord({
          studentId: student.id,
          studentName: displayName,
          roll: student.roll,
          classId: selectedClassId,
          className: currentClass ? currentClass.classNameBangla : '',
          date: selectedDate,
          time: timeStr,
          status: 'Present',
          method: 'Manual',
          notes: `${terminology.adminLabel} কর্তৃক এক ক্লিকে সকল ${terminology.memberLabel} উপস্থিত চিহ্নিত`,
        });
        onAttendanceUpdated(updated);
      });
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const recordsToExport = attendanceRecords.filter(r => r.classId === selectedClassId);
    exportAttendanceCSV(recordsToExport, `${currentClass?.classNameBangla || 'attendance'}_report.csv`);
  };

  const pendingApprovalsCount = students.filter(isFingerprintPendingApproval).length;

  return (
    <div className="space-y-4">
      {/* 0. DYNAMIC BIOMETRIC METHOD GATEWAY WIDGET (Based on Selected Company Method) */}
      {(currentBiometricMethod === 'zkteco' || currentBiometricMethod === 'all_methods') ? (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-4 text-white border border-indigo-500/30 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-500/20 text-blue-400 border border-blue-500/40 rounded-xl shrink-0">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-white">
                    ZKTeco বায়োমেট্রিক গেটওয়ে (মডেল: {activeCompany?.biometricConfig?.zktecoDeviceModel || 'SenseFace M2F-LR'})
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1.5 ${
                    zktecoStatusData.isOnline
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${zktecoStatusData.isOnline ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
                    <span>{zktecoStatusData.isOnline ? 'সক্রিয় (Connected)' : 'অফলাইন / অপেক্ষমাণ'}</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  SN: <strong className="font-mono text-emerald-400">{activeCompany?.biometricConfig?.zktecoSerialNumber || 'UFS2254700071'}</strong> &bull; ADMS পুশ: <code className="bg-slate-950 px-1 py-0.5 rounded text-blue-300">/iclock/cdata</code> &bull; কর্মীরা মেশিনে ফেস/আঙুল প্রদর্শন করলেই অটোমেটিক ক্লাউডে হাজিরা যুক্ত হয়।
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleManualZkPing}
                disabled={isTestingZkConnection}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
                title="ডিভাইসের রিয়েল নেটওয়ার্ক হার্টবিট পরীক্ষা করুন"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingZkConnection ? 'animate-spin' : ''}`} />
                <span>{isTestingZkConnection ? 'যাচাই হচ্ছে...' : 'কানেকশন টেস্ট'}</span>
              </button>

              {onOpenZKTecoDeviceModal && (
                <button
                  type="button"
                  onClick={onOpenZKTecoDeviceModal}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>ZKTeco প্যানেল</span>
                </button>
              )}
            </div>
          </div>

          {zkTestFeedback && (
            <div className="mt-2.5 p-2 bg-slate-950/80 rounded-xl text-xs font-medium border border-slate-800 text-slate-300 flex items-center justify-between">
              <span>{zkTestFeedback}</span>
              <button onClick={() => setZkTestFeedback(null)} className="text-slate-500 hover:text-white ml-2 text-[10px]">✕</button>
            </div>
          )}
        </div>
      ) : currentBiometricMethod === 'usb_scanner' ? (
        <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-teal-950 rounded-2xl p-4 text-white border border-teal-500/30 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-teal-500/20 text-teal-400 border border-teal-500/40 rounded-xl shrink-0">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                USB অপটিক্যাল ফিঙ্গারপ্রিন্ট স্ক্যানার (Mantra MFS100 / SecuGen)
              </h3>
              <p className="text-[11px] text-teal-200">
                কম্পিউটারের ইউএসবি পোর্টে কানেক্টেড ডিভাইসের লোকাল ড্রাইভার সার্ভিস (Port 11100 / 8033) সক্রিয় রেখে হাজিরা গ্রহণ করুন।
              </p>
            </div>
          </div>
          {onOpenFingerprintScanner && (
            <button
              onClick={onOpenFingerprintScanner}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-black flex items-center space-x-1.5 transition shadow-sm cursor-pointer shrink-0"
            >
              <Fingerprint className="w-3.5 h-3.5" />
              <span>USB স্ক্যানার চালু করুন</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 rounded-2xl p-4 text-white border border-indigo-500/30 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 rounded-xl shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                WebAuthn / Passkey ডিভাইস বায়োমেট্রিক সিস্টেম
              </h3>
              <p className="text-[11px] text-indigo-200">
                মোবাইল বা ল্যাপটপের বিল্ট-ইন ফেস/টাচ সেন্সর দিয়ে ক্রিপ্টোগ্রাফিক পরিচয় যাচাই (র ছবি বা ফিঙ্গারপ্রিন্ট টেমপ্লেট পড়ে না)।
              </p>
            </div>
          </div>
          {onOpenFingerprintScanner && (
            <button
              onClick={onOpenFingerprintScanner}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black flex items-center space-x-1.5 transition shadow-sm cursor-pointer shrink-0"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>পাসকি প্রম্পট চালু করুন</span>
            </button>
          )}
        </div>
      )}

      {/* Unified Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Filter and Search Sub-bar */}
        <div className="p-3 sm:p-3.5 border-b border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          
          {/* Left: Date Picker (Real-time automatic default) + Shift Filter + Search */}
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* 1. Date Picker (Real-time default) */}
            <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs shadow-2xs shrink-0" title="তারিখ অনুযায়ী ফিল্টার (ডিফল্ট: আজকের রিয়েল-টাইম)">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="font-bold text-slate-900 focus:outline-none bg-transparent cursor-pointer text-xs"
                title="তারিখ পরিবর্তন করতে ক্লিক করুন"
              />
              {selectedDate === new Date().toISOString().split('T')[0] && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  <span>রিয়েল-টাইম</span>
                </span>
              )}
            </div>

            {/* Jump to Today button if not today */}
            {selectedDate !== new Date().toISOString().split('T')[0] && (
              <button
                type="button"
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-xl transition cursor-pointer shrink-0 shadow-2xs"
                title="আজকের রিয়েল-টাইম তারিখে ফিরে যান"
              >
                আজকে (রিয়েল-টাইম)
              </button>
            )}

            {/* 2. Shift Filter Dropdown */}
            <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs shadow-2xs shrink-0" title="শিফট অনুযায়ী ফিল্টার করুন">
              <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <select
                value={selectedShiftFilter}
                onChange={e => setSelectedShiftFilter(e.target.value)}
                className="font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer text-xs pr-1"
                title="শিফট অনুযায়ী ফিল্টার করুন"
              >
                <option value="All">সকল শিফট (All)</option>
                <option value="active">
                  চলমান শিফট: {currentActiveShift.nameBangla}
                </option>
                {scheduleSettings.shifts.map(shift => (
                  <option key={shift.id} value={shift.id}>
                    {shift.nameBangla} ({shift.startTime} - {shift.endTime})
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Search Box */}
            <div className="relative flex-1 min-w-[140px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                placeholder={`${terminology.memberLabel}-এর নাম বা আইডি খুঁজুন...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

        </div>

        {/* Member List Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[880px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                <th className="p-3 pl-4 whitespace-nowrap min-w-[220px]">প্রোফাইল ফটো ও নাম</th>
                <th className="p-3 whitespace-nowrap min-w-[180px]">ডিউটি শিফট (নির্বাচন করুন)</th>
                <th className="p-3 whitespace-nowrap min-w-[130px]">প্রবেশ করার সময়</th>
                <th className="p-3 whitespace-nowrap min-w-[140px]">বাহির হওয়ার সময়</th>
                <th className="p-3 text-center whitespace-nowrap min-w-[150px]">স্ট্যাটাস</th>
                <th className="p-3 text-right pr-4 whitespace-nowrap w-24">এডিট</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 bg-white">
                    <div className="flex flex-col items-center justify-center space-y-2.5 max-w-sm mx-auto">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <UserPlus className="w-5 h-5" />
                      </div>
                      <p className="font-bold text-slate-800">কোনো {terminology.memberLabel} পাওয়া যায়নি</p>
                      <button
                        onClick={onOpenRegisterModal}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>{terminology.registerActionText}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRows.map(({ student, record, status }) => {
                  const hasFace = isFaceActuallyRegistered(student);
                  const displayName = student.nameBangla || student.name || student.nameEnglish || (student.roll ? `সদস্য #${student.roll}` : 'সদস্য');
                  const secondaryName = (student.name && student.name !== displayName) ? student.name : (student.nameEnglish && student.nameEnglish !== displayName ? student.nameEnglish : null);

                  return (
                  <tr 
                    key={student.id} 
                    onClick={() => handleOpenDetails(student, record)}
                    className="cursor-pointer transition-all duration-150 group hover:bg-emerald-50/40 dark:hover:bg-slate-800/50 hover:shadow-2xs"
                    title={`ক্লিক করে ${displayName}-এর সকল তথ্য ও বিস্তারিত হাজিরা হিস্টোরি দেখুন`}
                  >
                    
                    {/* 1. Profile Photo & Name */}
                    <td className="p-3 pl-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div 
                          onClick={(e) => {
                            if (onOpenMemberProfile) {
                              e.stopPropagation();
                              onOpenMemberProfile(student);
                            }
                          }}
                          className="w-9 h-9 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group-hover:border-emerald-500 overflow-hidden shrink-0 flex items-center justify-center font-bold text-emerald-700 dark:text-emerald-400 transition relative shadow-2xs hover:scale-105"
                          title="সদস্য প্রোফাইল ও ফেস ক্যামেরা দেখতে ক্লিক করুন"
                        >
                          {hasFace && (student.faceImage || student.photoUrl) ? (
                            <img
                              src={student.faceImage || student.photoUrl}
                              alt={displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            displayName.charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 flex items-center space-x-1.5 transition">
                            <span className="text-xs font-black">{displayName}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[160px] flex items-center space-x-1.5 font-mono">
                            <span>ID: <strong className="text-slate-600 dark:text-slate-300">{student.roll || 'N/A'}</strong></span>
                            {secondaryName && <span>• {secondaryName}</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 3. Shift (শিফট নির্বাচন ও প্রদর্শন) */}
                    <td className="p-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex flex-col gap-1 min-w-[155px]">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border shadow-2xs ${getShiftBadgeStyle(record?.shiftCode || currentActiveShift?.code, record?.shiftName || currentActiveShift?.nameBangla)}`}>
                            {getShiftIcon(record?.shiftCode || currentActiveShift?.code, record?.shiftName || currentActiveShift?.nameBangla)}
                            <span>{record?.shiftName || currentActiveShift?.nameBangla || 'সাধারণ ডে শিফট'}</span>
                          </span>
                        </div>

                        {/* Interactive Shift Selector Dropdown */}
                        <select
                          value={record?.shiftId || currentActiveShift?.id || 'shift-day'}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleShiftChange(student, record, e.target.value);
                          }}
                          className="text-[11px] font-semibold py-1 px-2 rounded-lg bg-white border border-slate-300 text-slate-800 hover:border-emerald-500 focus:outline-emerald-600 cursor-pointer shadow-2xs w-full max-w-[170px]"
                          title="হাজিরার পর ডিউটি শিফট পরিবর্তন বা নির্বাচন করুন"
                        >
                          {(scheduleSettings.shifts || []).map(shift => (
                            <option key={shift.id} value={shift.id}>
                              {shift.nameBangla} ({shift.startTime}-{shift.endTime})
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>

                    {/* 4. Entry Time (প্রবেশ করার সময়) */}
                    <td className="p-3 whitespace-nowrap">
                      {record && (record.entryTime || record.time) ? (
                        <div className="space-y-1">
                          <div className="inline-flex items-center space-x-1 font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs">
                            <LogIn className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>{record.entryTime || record.time}</span>
                          </div>
                          {record.method === 'ZKTeco Device (Hardware)' ? (
                            <div className="text-[10px] text-blue-700 dark:text-blue-300 font-bold flex items-center gap-1 font-mono">
                              <Cpu className="w-3 h-3 text-blue-500 shrink-0" />
                              <span>ZKTeco ({record.verifySubMethod || 'Device Recorded'})</span>
                            </div>
                          ) : record.method === 'USB Optical Fingerprint' ? (
                            <div className="text-[10px] text-teal-700 dark:text-teal-300 font-bold flex items-center gap-1">
                              <HardDrive className="w-3 h-3 text-teal-500 shrink-0" />
                              <span>USB স্ক্যানার</span>
                            </div>
                          ) : record.method === 'Device WebAuthn Passkey' ? (
                            <div className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold flex items-center gap-1">
                              <Smartphone className="w-3 h-3 text-indigo-500 shrink-0" />
                              <span>Passkey বায়োমেট্রিক</span>
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 font-mono text-xs">—</span>
                      )}
                    </td>

                    {/* 5. Exit Time (বাহির হওয়ার সময়) */}
                    <td className="p-3 whitespace-nowrap">
                      {record?.exitTime ? (
                        <div className="inline-flex items-center space-x-1 font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800 text-xs">
                          <LogOut className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span>{record.exitTime}</span>
                        </div>
                      ) : (status === 'Present' || status === 'Late') && record ? (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>অবস্থান করছেন</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 font-mono text-xs">—</span>
                      )}
                    </td>

                    {/* 6. Status Dropdown (স্ট্যাটাস ড্রপ ডাউন) */}
                    <td className="p-3 text-center whitespace-nowrap">
                      <div 
                        className="inline-block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          value={status}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleStatusChange(student, e.target.value as AttendanceStatus);
                          }}
                          className={`px-2.5 py-1 rounded-xl font-bold text-xs border shadow-2xs cursor-pointer transition focus:outline-none ${
                            status === 'Present'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700'
                              : status === 'Late'
                              ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700'
                              : 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700'
                          }`}
                          title="হাজিরা স্ট্যাটাস পরিবর্তন করুন"
                        >
                          <option value="Present">✓ উপস্থিত (Present)</option>
                          <option value="Late">⏱ বিলম্ব (Late)</option>
                          <option value="Absent">✕ অনুপস্থিত (Absent)</option>
                        </select>
                      </div>
                    </td>

                    {/* 7. Edit Attendance History Button (হিস্টোরি এডিট) */}
                    <td className="p-3 text-right pr-4 whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenHistoryEdit(student, record);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white dark:bg-slate-800 dark:hover:bg-emerald-600 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all shadow-2xs flex items-center space-x-1 cursor-pointer"
                          title="এই সদস্যের হাজিরা ও হিস্টোরি এডিট করুন"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:text-white transition-colors" />
                          <span>এডিট</span>
                        </button>
                      </div>
                    </td>

                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Attendance & Stay Duration Breakdown Modal with Full History Table */}
      <AttendanceDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        student={selectedStudentForDetails}
        attendanceRecord={selectedRecordForDetails}
        selectedDate={selectedDate}
        orgInfo={orgInfo}
        allAttendanceRecords={attendanceRecords}
        onAttendanceUpdated={(updated) => {
          onAttendanceUpdated(updated);
          setSelectedRecordForDetails(updated);
        }}
      />

      {/* Attendance History Edit Modal */}
      <EditAttendanceHistoryModal
        isOpen={isHistoryEditModalOpen}
        onClose={() => setIsHistoryEditModalOpen(false)}
        student={selectedStudentForHistoryEdit}
        currentRecord={selectedRecordForHistoryEdit}
        selectedDate={selectedDate}
        orgInfo={orgInfo}
        onAttendanceUpdated={(updated) => {
          onAttendanceUpdated(updated);
          setSelectedRecordForHistoryEdit(updated);
        }}
      />

    </div>
  );
};
