import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  LogIn, 
  LogOut, 
  Check, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  Save, 
  Trash2,
  AlertCircle,
  Layers
} from 'lucide-react';
import { Student, AttendanceRecord, AttendanceStatus, AttendanceMethod } from '../types';
import { OrgCategoryInfo } from '../utils/organizationConfig';
import { updateAttendanceHistoryRecord, getStoredAttendance } from '../utils/storage';
import { getStoredScheduleSettings, getCurrentActiveShift } from '../utils/scheduleConfig';

interface EditAttendanceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  currentRecord: AttendanceRecord | null;
  selectedDate: string;
  orgInfo: OrgCategoryInfo;
  onAttendanceUpdated: (record: AttendanceRecord) => void;
}

export const EditAttendanceHistoryModal: React.FC<EditAttendanceHistoryModalProps> = ({
  isOpen,
  onClose,
  student,
  currentRecord,
  selectedDate,
  orgInfo,
  onAttendanceUpdated,
}) => {
  const [recordDate, setRecordDate] = useState<string>(selectedDate);
  const [status, setStatus] = useState<AttendanceStatus>('Present');
  const [entryTime, setEntryTime] = useState<string>('');
  const [exitTime, setExitTime] = useState<string>('');
  const [method, setMethod] = useState<AttendanceMethod>('Manual');
  const [notes, setNotes] = useState<string>('');
  const [shiftId, setShiftId] = useState<string>('shift-day');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const scheduleSettings = getStoredScheduleSettings();
  const activeShiftNow = getCurrentActiveShift(scheduleSettings, new Date());
  const shiftsList = scheduleSettings.shifts || [];

  // Sync state when modal opens or date/student/record changes
  useEffect(() => {
    if (student && isOpen) {
      setRecordDate(selectedDate);
      
      // Find existing record for this date if any
      const allRecords = getStoredAttendance();
      const existing = currentRecord?.date === selectedDate 
        ? currentRecord 
        : allRecords.find(r => r.studentId === student.id && r.date === selectedDate);

      if (existing) {
        setStatus(existing.status);
        setEntryTime(existing.entryTime || existing.time || '');
        setExitTime(existing.exitTime || '');
        setMethod(existing.method || 'Manual');
        setNotes(existing.notes || '');
        setShiftId(existing.shiftId || activeShiftNow?.id || 'shift-day');
      } else {
        setStatus('Present');
        setEntryTime('09:00 AM');
        setExitTime('');
        setMethod('Manual');
        setNotes('অ্যাডমিন কর্তৃক সংরক্ষিত হাজিরা');
        setShiftId(activeShiftNow?.id || 'shift-day');
      }
      setSaveSuccess(false);
    }
  }, [student, currentRecord, selectedDate, isOpen]);

  // When date changes in modal input, reload that date's data
  const handleDateChange = (newDate: string) => {
    setRecordDate(newDate);
    if (!student) return;
    const allRecords = getStoredAttendance();
    const existing = allRecords.find(r => r.studentId === student.id && r.date === newDate);
    if (existing) {
      setStatus(existing.status);
      setEntryTime(existing.entryTime || existing.time || '');
      setExitTime(existing.exitTime || '');
      setMethod(existing.method || 'Manual');
      setNotes(existing.notes || '');
      setShiftId(existing.shiftId || activeShiftNow?.id || 'shift-day');
    } else {
      setStatus('Present');
      setEntryTime('09:00 AM');
      setExitTime('');
      setMethod('Manual');
      setNotes('');
      setShiftId(activeShiftNow?.id || 'shift-day');
    }
  };

  if (!isOpen || !student) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedShiftObj = shiftsList.find(s => s.id === shiftId) || activeShiftNow;

    const updated = updateAttendanceHistoryRecord(student, recordDate, {
      entryTime: entryTime.trim() || undefined,
      exitTime: exitTime.trim() || undefined,
      status: status,
      method: method,
      notes: notes.trim() || undefined,
      shiftId: selectedShiftObj?.id || shiftId,
      shiftName: selectedShiftObj?.nameBangla || 'সাধারণ ডে শিফট',
      shiftCode: selectedShiftObj?.code || 'DAY',
      shiftTiming: selectedShiftObj ? `${selectedShiftObj.startTime} - ${selectedShiftObj.endTime}` : '09:00 - 17:00'
    });

    onAttendanceUpdated(updated);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  const handleSetCurrentTimeForEntry = () => {
    const now = new Date();
    setEntryTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
  };

  const handleSetCurrentTimeForExit = () => {
    const now = new Date();
    setExitTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150 text-slate-900 dark:text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 sm:p-5 px-5 sm:px-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl overflow-hidden bg-slate-800 border-2 border-emerald-500/60 shrink-0 shadow-md flex items-center justify-center font-black text-emerald-400">
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
              <h3 className="text-base font-bold text-white truncate flex items-center space-x-1.5">
                <span>হাজিরা ও হিস্টোরি এডিট</span>
              </h3>
              <p className="text-xs text-slate-300 font-mono flex items-center space-x-2 mt-0.5 truncate">
                <strong className="text-white">{student.nameBangla}</strong>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">{student.designation || student.className}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer border border-slate-700 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {/* 1. Date Selection */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>তারিখ (Date):</span>
            </label>
            <input
              type="date"
              value={recordDate}
              onChange={e => handleDateChange(e.target.value)}
              required
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Shift Selection */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>শিফট নির্ধারণ (Work Shift):</span>
            </label>
            <select
              value={shiftId}
              onChange={e => setShiftId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              {shiftsList.map(s => (
                <option key={s.id} value={s.id}>
                  {s.nameBangla} ({s.startTime} - {s.endTime})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Status Dropdown */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>হাজিরা স্ট্যাটাস (Status):</span>
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as AttendanceStatus)}
              className={`w-full p-2.5 rounded-xl font-bold border transition focus:outline-none ${
                status === 'Present' 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300' 
                  : status === 'Late'
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-300'
              }`}
            >
              <option value="Present">✓ উপস্থিত (Present)</option>
              <option value="Late">⏱ বিলম্ব (Late)</option>
              <option value="Absent">✕ অনুপস্থিত (Absent)</option>
            </select>
          </div>

          {/* 3. Entry & Exit Time Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            
            {/* Entry Time */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1 text-[11px]">
                  <LogIn className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>প্রবেশ করার সময় (In):</span>
                </label>
                <button
                  type="button"
                  onClick={handleSetCurrentTimeForEntry}
                  className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                >
                  বর্তমান সময়
                </button>
              </div>
              <input
                type="text"
                placeholder="যেমন: 09:15 AM"
                value={entryTime}
                onChange={e => setEntryTime(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Exit Time */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1 text-[11px]">
                  <LogOut className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>বাহির হওয়ার সময় (Out):</span>
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleSetCurrentTimeForExit}
                    className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline"
                  >
                    বর্তমান সময়
                  </button>
                  {exitTime && (
                    <button
                      type="button"
                      onClick={() => setExitTime('')}
                      className="text-[10px] text-rose-500 font-bold hover:underline"
                    >
                      মুছুন
                    </button>
                  )}
                </div>
              </div>
              <input
                type="text"
                placeholder="যেমন: 05:30 PM (ঐচ্ছিক)"
                value={exitTime}
                onChange={e => setExitTime(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

          </div>

          {/* 4. Attendance Method */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>হাজিরা গ্রহণের পদ্ধতি (Method):</span>
            </label>
            <select
              value={method}
              onChange={e => setMethod(e.target.value as AttendanceMethod)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="Manual">ম্যানুয়াল / অ্যাডমিন এন্ট্রি (Manual Entry)</option>
              <option value="Face AI">স্মার্ট ফেস এআই (Face AI)</option>
              <option value="GPS Selfie">সেলফি ও জিপিএস হাজিরা (GPS Selfie)</option>
              <option value="QR Scan">কিউআর কোড স্ক্যান (QR Scan)</option>
              <option value="Self Kiosk">সেলফ সার্ভিস কিওস্ক (Self Kiosk)</option>
              <option value="Fingerprint">ফিঙ্গারপ্রিন্ট বায়োমেট্রিক (Fingerprint)</option>
            </select>
          </div>

          {/* 5. Notes / Remarks */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-slate-500" />
              <span>মন্তব্য / কারণ (Notes):</span>
            </label>
            <input
              type="text"
              placeholder="যেমন: জরুরি ছুটি, সময় সংশোধন, ইত্যাদি..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition cursor-pointer"
            >
              বাতিল
            </button>

            <button
              type="submit"
              className={`px-5 py-2.5 rounded-xl text-white font-bold transition flex items-center space-x-1.5 shadow-md cursor-pointer ${
                saveSuccess 
                  ? 'bg-emerald-700' 
                  : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>সংরক্ষিত হয়েছে!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>হিস্টোরি সংরক্ষণ করুন</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
