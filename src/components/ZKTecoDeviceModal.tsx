import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Cpu, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Fingerprint, 
  Clock, 
  Search, 
  Download, 
  Wifi, 
  HelpCircle, 
  Check, 
  Database,
  Calendar,
  Layers,
  Sparkles,
  ArrowDownToLine,
  HardDrive,
  CreditCard,
  Hash,
  Eye,
  Camera,
  Globe,
  Copy,
  Zap,
  Battery,
  ShieldCheck,
  Server,
  FileSpreadsheet,
  Users,
  FileUp,
  ArrowRight,
  UserPlus,
  UserCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Student, AttendanceRecord, AuditLogItem } from '../types';
import { OrgCategoryInfo } from '../utils/organizationConfig';
import { saveAttendanceRecord } from '../utils/storage';
import { saveAttendanceToFirestore, saveAuditLogToFirestore } from '../lib/firebase';

export interface ZKTecoLogItem {
  id: string;
  userId: string; // Machine Enrollment ID / Roll
  studentName?: string;
  studentPhoto?: string;
  timestamp: string; // 'YYYY-MM-DD HH:mm:ss'
  date: string;
  time: string;
  verifyType: 'Visible Light Face' | 'Fingerprint' | 'RFID Card' | 'Password';
  punchType: 'Check-In' | 'Check-Out' | 'Break';
  deviceModel: string;
  deviceIp?: string;
  deviceSn?: string;
  status: 'Synced' | 'Processed';
}

interface ZKTecoDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  onAttendanceUpdated: (record: AttendanceRecord) => void;
  orgInfo: OrgCategoryInfo;
  onBulkStudentsAdded?: (newStudents: Student[]) => void;
}

export const ZKTecoDeviceModal: React.FC<ZKTecoDeviceModalProps> = ({
  isOpen,
  onClose,
  students,
  attendanceRecords,
  onAttendanceUpdated,
  orgInfo,
  onBulkStudentsAdded,
}) => {
  const { terminology } = orgInfo;

  // Tabs: 'cloud_adms', 'history', 'workers', 'import', 'network', 'guide'
  const [activeTab, setActiveTab] = useState<'cloud_adms' | 'history' | 'workers' | 'import' | 'network' | 'guide'>('cloud_adms');

  // Device Specs
  const deviceModelName = 'ZKTeco SenseFace M2F-LR';
  const deviceSerialNumber = 'UFS2254700071';

  // Network Config State
  const [deviceIp, setDeviceIp] = useState<string>('192.168.1.201');
  const [devicePort, setDevicePort] = useState<string>('4370');
  const [deviceCommKey, setDeviceCommKey] = useState<string>('0');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Worker Excel/ZK Import State
  const [workerImportNotice, setWorkerImportNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [importedWorkersPreview, setImportedWorkersPreview] = useState<{
    roll: string;
    name: string;
    department: string;
    phone?: string;
    isExisting: boolean;
  }[]>([]);
  const workerFileInputRef = useRef<HTMLInputElement | null>(null);

  // Device Logs State (Persisted in localStorage)
  const [deviceLogs, setDeviceLogs] = useState<ZKTecoLogItem[]>(() => {
    try {
      const saved = localStorage.getItem('zkteco_device_logs_v2');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }

    // Default sample logs matched with initial students
    const today = new Date().toISOString().split('T')[0];
    const initialLogs: ZKTecoLogItem[] = [];

    students.slice(0, 6).forEach((s, idx) => {
      const baseHour = 8 + Math.floor(idx / 3);
      const baseMin = 15 + (idx * 7) % 40;
      const timeStr = `${String(baseHour).padStart(2, '0')}:${String(baseMin).padStart(2, '0')}:12`;
      let verifyType: 'Visible Light Face' | 'Fingerprint' | 'RFID Card' = 'Visible Light Face';
      if (idx % 3 === 1) verifyType = 'Fingerprint';
      else if (idx % 3 === 2) verifyType = 'RFID Card';

      initialLogs.push({
        id: `zk-init-${s.id}-${idx}`,
        userId: s.roll || String(idx + 101),
        studentName: s.nameBangla || s.name,
        studentPhoto: s.photoUrl,
        timestamp: `${today} ${timeStr}`,
        date: today,
        time: timeStr,
        verifyType: verifyType,
        punchType: 'Check-In',
        deviceModel: 'SenseFace M2F-LR',
        deviceIp: '192.168.1.201',
        deviceSn: 'UFS2254700071',
        status: 'Synced',
      });
    });

    return initialLogs;
  });

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [verifyTypeFilter, setVerifyTypeFilter] = useState<string>('All');
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [fileNotice, setFileNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Poll backend for real incoming push logs every 5 seconds when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const fetchLivePushedLogs = async () => {
      try {
        const res = await fetch('/api/zkteco/live-logs');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.logs) && data.logs.length > 0) {
            setDeviceLogs(prev => {
              const existingIds = new Set(prev.map(p => p.id));
              const newlyArrived: ZKTecoLogItem[] = [];

              data.logs.forEach((log: any) => {
                if (!existingIds.has(log.id)) {
                  // Find student matching roll
                  let matchedStudent = students.find(s => String(s.roll).trim() === String(log.userId).trim());

                  if (!matchedStudent && onBulkStudentsAdded) {
                    const autoWorker: Student = {
                      id: `std-zk-auto-${log.userId}-${Date.now()}`,
                      name: `Worker #${log.userId}`,
                      nameBangla: `কর্মী #${log.userId}`,
                      roll: String(log.userId).trim(),
                      classId: 'default',
                      className: 'জেনারেল ওয়ার্কার্স',
                      department: 'জেনারেল ওয়ার্কার্স',
                      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                      gender: 'Male',
                      guardianPhone: '',
                      parentPhone: '',
                      attendanceStreak: 0,
                      active: true,
                      faceRegistered: log.verifyType === 'Visible Light Face',
                      fingerprintRegistered: log.verifyType === 'Fingerprint',
                      designation: 'ওয়ার্কার',
                      joinDate: new Date().toISOString().split('T')[0]
                    };
                    onBulkStudentsAdded([autoWorker]);
                    matchedStudent = autoWorker;
                  }

                  newlyArrived.push({
                    id: log.id,
                    userId: log.userId,
                    studentName: matchedStudent ? (matchedStudent.nameBangla || matchedStudent.name) : `কর্মী #${log.userId}`,
                    studentPhoto: matchedStudent?.photoUrl,
                    timestamp: log.timestamp,
                    date: log.date,
                    time: log.time,
                    verifyType: log.verifyType || 'Visible Light Face',
                    punchType: log.punchType || 'Check-In',
                    deviceModel: log.deviceModel || 'SenseFace M2F-LR',
                    deviceSn: log.deviceSn || 'UFS2254700071',
                    status: 'Synced'
                  });

                  if (matchedStudent) {
                    const record = saveAttendanceRecord({
                      studentId: matchedStudent.id,
                      studentName: matchedStudent.nameBangla || matchedStudent.name,
                      roll: matchedStudent.roll,
                      classId: matchedStudent.classId || 'default',
                      className: matchedStudent.className || '',
                      date: log.date,
                      time: log.time.slice(0, 5),
                      status: 'Present',
                      method: 'ZKTeco Device (Hardware)',
                      verifySubMethod: log.verifyType || 'Device Recorded',
                      deviceSn: log.deviceSn || 'UFS2254700071',
                      deviceModel: log.deviceModel || 'SenseFace M2F-LR',
                      hardwareVerified: true,
                      notes: `${log.deviceModel || 'ZKTeco'} (SN: ${log.deviceSn || 'UFS2254700071'}) - ${log.verifyType || 'Device Recorded'} [হার্ডওয়্যার পাঞ্চ: ${log.punchType || 'Check-In'}]`,
                    });
                    onAttendanceUpdated(record);
                    saveAttendanceToFirestore(record);
                  }
                }
              });

              if (newlyArrived.length > 0) {
                const combined = [...newlyArrived, ...prev];
                try {
                  localStorage.setItem('zkteco_device_logs_v2', JSON.stringify(combined));
                } catch {
                  // quota safe
                }
                return combined;
              }
              return prev;
            });
          }
        }
      } catch {
        // network polling silent catch
      }
    };

    fetchLivePushedLogs();
    const interval = setInterval(fetchLivePushedLogs, 4000);
    return () => clearInterval(interval);
  }, [isOpen, students, onAttendanceUpdated]);

  if (!isOpen) return null;

  // Save logs to localStorage
  const persistLogs = (newLogs: ZKTecoLogItem[]) => {
    setDeviceLogs(newLogs);
    try {
      localStorage.setItem('zkteco_device_logs_v2', JSON.stringify(newLogs));
    } catch {
      // storage quota fallback
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Helper to parse a single ZKTeco DAT or TXT line
  // Standard ZKTeco attlog format:
  // Tab-separated or space-separated:
  // "PIN \t Timestamp \t VerifyType \t PunchType \t WorkCode \t Reserved"
  // Example: "101\t2026-09-24 09:15:20\t15\t0\t0\t0" (15 = Visible Light Face)
  const parseZKTecoLine = (line: string): { roll: string; date: string; time: string; verifyType: 'Visible Light Face' | 'Fingerprint' | 'RFID Card' | 'Password'; punchType: 'Check-In' | 'Check-Out' | 'Break' } | null => {
    const trimmed = line.trim();
    if (!trimmed) return null;

    const parts = trimmed.split(/[\t,;]+|\s{2,}/);
    if (parts.length < 2) return null;

    const roll = parts[0].trim();
    const dateTimeStr = parts[1].trim();

    let date = '';
    let time = '';

    if (dateTimeStr.includes('-') || dateTimeStr.includes('/')) {
      if (dateTimeStr.includes(' ')) {
        const [d, t] = dateTimeStr.split(' ');
        date = d.replace(/\//g, '-');
        time = t || '09:00:00';
      } else if (parts.length >= 3 && (parts[2].includes(':') || parts[2].length === 8)) {
        date = dateTimeStr.replace(/\//g, '-');
        time = parts[2].trim();
      } else {
        date = dateTimeStr;
        time = '09:00:00';
      }
    } else {
      date = new Date().toISOString().split('T')[0];
      time = dateTimeStr.includes(':') ? dateTimeStr : '09:00:00';
    }

    // Verify type (ZKTeco numeric codes: 15: Face / Visible Light, 1: Fingerprint, 2: Password, 3: RFID Card)
    let verifyType: 'Visible Light Face' | 'Fingerprint' | 'RFID Card' | 'Password' = 'Visible Light Face';
    const verifyCode = parts[2]?.trim();
    if (verifyCode === '1' || verifyCode === 'Finger') {
      verifyType = 'Fingerprint';
    } else if (verifyCode === '3' || verifyCode === 'Card' || verifyCode === 'RFID') {
      verifyType = 'RFID Card';
    } else if (verifyCode === '2' || verifyCode === 'Password') {
      verifyType = 'Password';
    } else if (verifyCode === '15' || verifyCode === 'Face') {
      verifyType = 'Visible Light Face';
    }

    // Punch type (0: Check-In, 1: Check-Out, 2: Break-Out, 3: Break-In)
    let punchType: 'Check-In' | 'Check-Out' | 'Break' = 'Check-In';
    const punchCode = parts[3]?.trim();
    if (punchCode === '1' || punchCode === 'Out' || punchCode === 'Exit') {
      punchType = 'Check-Out';
    } else if (punchCode === '2' || punchCode === '3') {
      punchType = 'Break';
    }

    return { roll, date, time, verifyType, punchType };
  };

  // Process raw text content from USB DAT/TXT/CSV file
  const processRawZKTecoData = (content: string, fileName: string) => {
    const lines = content.split(/\r?\n/);
    let importedCount = 0;
    let matchedStudentsCount = 0;
    const newLogs: ZKTecoLogItem[] = [];

    lines.forEach((line) => {
      const parsed = parseZKTecoLine(line);
      if (!parsed) return;

      importedCount++;
      const matchedStudent = students.find((s) => String(s.roll).trim() === String(parsed.roll).trim());

      const logItem: ZKTecoLogItem = {
        id: `zk-pen-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId: parsed.roll,
        studentName: matchedStudent ? (matchedStudent.nameBangla || matchedStudent.name) : undefined,
        studentPhoto: matchedStudent?.photoUrl,
        timestamp: `${parsed.date} ${parsed.time}`,
        date: parsed.date,
        time: parsed.time,
        verifyType: parsed.verifyType,
        punchType: parsed.punchType,
        deviceModel: 'SenseFace M2F-LR',
        deviceSn: deviceSerialNumber,
        status: 'Synced',
      };

      newLogs.unshift(logItem);

      let effectiveStudent = matchedStudent;
      if (!effectiveStudent && onBulkStudentsAdded) {
        const autoWorker: Student = {
          id: `std-zk-usb-${parsed.roll}-${Date.now()}`,
          name: `Worker #${parsed.roll}`,
          nameBangla: `কর্মী #${parsed.roll}`,
          roll: String(parsed.roll).trim(),
          classId: 'default',
          className: 'জেনারেল ওয়ার্কার্স',
          department: 'জেনারেল ওয়ার্কার্স',
          photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          gender: 'Male',
          guardianPhone: '',
          parentPhone: '',
          attendanceStreak: 0,
          active: true,
          faceRegistered: parsed.verifyType === 'Visible Light Face',
          fingerprintRegistered: parsed.verifyType === 'Fingerprint',
          designation: 'ওয়ার্কার',
          joinDate: new Date().toISOString().split('T')[0]
        };
        onBulkStudentsAdded([autoWorker]);
        effectiveStudent = autoWorker;
      }

      if (effectiveStudent) {
        matchedStudentsCount++;
        const record = saveAttendanceRecord({
          studentId: effectiveStudent.id,
          studentName: effectiveStudent.nameBangla || effectiveStudent.name,
          roll: effectiveStudent.roll,
          classId: effectiveStudent.classId || 'default',
          className: effectiveStudent.className || '',
          date: parsed.date,
          time: parsed.time.slice(0, 5),
          status: 'Present',
          method: parsed.verifyType === 'Fingerprint' ? 'Fingerprint' : parsed.verifyType === 'RFID Card' ? 'Automated AI' : 'Face AI',
          notes: `SenseFace M2F-LR (${fileName}) পেনড্রাইভ থেকে সিঙ্ক`,
        });
        onAttendanceUpdated(record);
        saveAttendanceToFirestore(record);
      }
    });

    if (importedCount > 0) {
      const updatedLogs = [...newLogs, ...deviceLogs];
      persistLogs(updatedLogs);

      setFileNotice({
        type: 'success',
        message: `SenseFace M2F-LR এর মোট ${importedCount} টি পাঞ্চ রেকর্ড সফলভাবে ইমপোর্ট হয়েছে (${matchedStudentsCount} জন কর্মীর হাজিরা সাথে সাথে আপডেট হয়েছে)।`,
      });
      setActiveTab('history');
    } else {
      setFileNotice({
        type: 'error',
        message: 'ফাইলের ভিতর কোনো বৈধ ZKTeco পাঞ্চ ডাটা পাওয়া যায়নি। ফাইলের ফরম্যাট চেক করুন।',
      });
    }
  };

  // Handle worker Excel/CSV/DAT file upload from PC ZKTeco Software
  const handleWorkerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        if (!buffer) return;

        let rows: any[] = [];

        if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
          const workbook = XLSX.read(buffer, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        } else {
          // CSV, TXT, or user.dat
          const text = typeof buffer === 'string' ? buffer : new TextDecoder().decode(buffer as ArrayBuffer);
          
          if (fileName.includes('.dat') || fileName.includes('user')) {
            const lines = text.split(/\r?\n/);
            lines.forEach((l) => {
              const parts = l.trim().split(/[\t,;]+/);
              if (parts.length >= 2 && parts[0] && !isNaN(Number(parts[0]))) {
                rows.push({
                  'User ID': parts[0].trim(),
                  'Name': parts[1]?.trim() || `Worker #${parts[0]}`,
                  'Card': parts[3]?.trim() || '',
                });
              }
            });
          } else {
            const workbook = XLSX.read(buffer, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], { defval: '' });
          }
        }

        if (rows.length === 0) {
          setWorkerImportNotice({
            type: 'error',
            message: 'ফাইলের ভেতর কোনো কর্মীর তথ্য পাওয়া যায়নি। সঠিক এক্সেল বা CSV ফাইল নির্বাচন করুন।'
          });
          return;
        }

        const existingRolls = new Set(students.map((s) => String(s.roll).trim()));
        const parsedList: {
          roll: string;
          name: string;
          department: string;
          phone?: string;
          isExisting: boolean;
        }[] = [];

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
            return lk.includes('dept') || lk.includes('department') || lk.includes('title') || lk.includes('designation') || lk.includes('বিভাগ');
          });

          const phoneKey = keys.find(k => {
            const lk = k.toLowerCase().replace(/[^a-z0-9]/g, '');
            return lk.includes('phone') || lk.includes('mobile') || lk.includes('contact');
          });

          const roll = String(row[idKey] ?? '').trim() || String(idx + 101);
          const name = String(row[nameKey] ?? '').trim() || `কর্মী #${roll}`;
          const department = deptKey ? String(row[deptKey] ?? '').trim() : 'জেনারেল ওয়ার্কার্স';
          const phone = phoneKey ? String(row[phoneKey] ?? '').trim() : '';

          parsedList.push({
            roll,
            name,
            department: department || 'জেনারেল ওয়ার্কার্স',
            phone,
            isExisting: existingRolls.has(roll)
          });
        });

        setImportedWorkersPreview(parsedList);
        const newCount = parsedList.filter(p => !p.isExisting).length;
        setWorkerImportNotice({
          type: 'success',
          message: `কম্পিউটার সফটওয়্যার থেকে মোট ${parsedList.length} জন কর্মী রিড করা হয়েছে (${newCount} জন একদম নতুন কর্মী)।`
        });
      } catch (err) {
        console.error(err);
        setWorkerImportNotice({
          type: 'error',
          message: 'ফাইলটি পড়তে ত্রুটি হয়েছে। অনুগ্রহ করে সঠিক ফরম্যাট যাচাই করুন।'
        });
      }
    };

    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  // Confirm Worker Import
  const handleConfirmWorkerImport = () => {
    if (!onBulkStudentsAdded || importedWorkersPreview.length === 0) return;

    const newWorkers = importedWorkersPreview.filter(w => !w.isExisting);
    if (newWorkers.length === 0) {
      setWorkerImportNotice({
        type: 'info',
        message: 'সব কর্মীর তথ্য ইতোমধ্যে ডাটাবেজে উপস্থিত আছে!'
      });
      return;
    }

    const createdStudents: Student[] = newWorkers.map(w => ({
      id: `std-zk-${Date.now()}-${w.roll}-${Math.random().toString(36).substring(2, 6)}`,
      name: w.name,
      nameBangla: w.name,
      roll: w.roll,
      classId: 'default',
      className: w.department || 'জেনারেল ওয়ার্কার্স',
      department: w.department || 'জেনারেল ওয়ার্কার্স',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      gender: 'Male',
      guardianPhone: w.phone || '',
      parentPhone: w.phone || '',
      attendanceStreak: 0,
      active: true,
      faceRegistered: true,
      fingerprintRegistered: true,
      designation: w.department || 'ওয়ার্কার',
      joinDate: new Date().toISOString().split('T')[0]
    }));

    onBulkStudentsAdded(createdStudents);
    setWorkerImportNotice({
      type: 'success',
      message: `অভিনন্দন! মোট ${createdStudents.length} জন কর্মীর প্রোফাইল সফলভাবে ওয়েবসাইটে যুক্ত হয়েছে। পুনরায় আর কাউকে এন্ট্রি করতে হবে না!`
    });
    setImportedWorkersPreview([]);
  };

  // Demo sample worker load
  const handleLoadDemoZKWorkers = () => {
    const sampleZKWorkers = [
      { roll: '101', name: 'মোঃ রফিকুল ইসলাম', department: 'প্রোডাকশন সেকশন', isExisting: students.some(s => s.roll === '101') },
      { roll: '102', name: 'আব্দুল করিম', department: 'কাটিং ও সুইং', isExisting: students.some(s => s.roll === '102') },
      { roll: '103', name: 'সেলিনা আক্তার', department: 'কোয়ালিটি কন্ট্রোল', isExisting: students.some(s => s.roll === '103') },
      { roll: '104', name: 'জাহিদুল হাসান', department: 'মেইনটেন্যান্স', isExisting: students.some(s => s.roll === '104') },
      { roll: '105', name: 'ফারজানা ইয়াসমিন', department: 'প্যাকেজিং ইউনিট', isExisting: students.some(s => s.roll === '105') },
      { roll: '106', name: 'তারেক মাহমুদ', department: 'স্টোর ও ইনভেন্টরি', isExisting: students.some(s => s.roll === '106') },
      { roll: '107', name: 'নাসরিন জাহান', department: 'অফিস প্রশাসন', isExisting: students.some(s => s.roll === '107') },
      { roll: '108', name: 'কামরুল আহসান', department: 'ডেলিভারি ও লজিস্টিকস', isExisting: students.some(s => s.roll === '108') },
    ];
    setImportedWorkersPreview(sampleZKWorkers);
    const newCount = sampleZKWorkers.filter(w => !w.isExisting).length;
    setWorkerImportNotice({
      type: 'info',
      message: `ডেমো ZKTeco কম্পিউটার সফটওয়্যারের ৮ জন কর্মীর তালিকা লোড করা হয়েছে (${newCount} জন নতুন)। নিচে "সকল নতুন কর্মী যুক্ত করুন" চাপুন।`
    });
  };

  // Handle file input change
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setFileNotice(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        processRawZKTecoData(content, file.name);
      } catch (err) {
        console.error(err);
        setFileNotice({ type: 'error', message: 'ফাইলটি পড়তে সমস্যা হয়েছে।' });
      } finally {
        setIsProcessingFile(false);
      }
    };
    reader.onerror = () => {
      setFileNotice({ type: 'error', message: 'ফাইল রিডিং এরর।' });
      setIsProcessingFile(false);
    };
    reader.readAsText(file);
  };

  // Load Built-in Demo SenseFace M2F-LR Log File
  const handleLoadDemoZKTecoFile = () => {
    const today = new Date().toISOString().split('T')[0];
    let demoText = '';

    students.forEach((s, idx) => {
      const hour = 8 + (idx % 2);
      const minute = 10 + (idx * 6) % 45;
      const second = 15 + (idx * 3) % 40;
      const timeFormatted = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
      // ZKTeco code 15: Visible Light Face, 1: Fingerprint, 3: RFID Card
      const verifyCode = idx % 3 === 0 ? '15' : idx % 3 === 1 ? '1' : '3';
      demoText += `${s.roll || idx + 101}\t${today} ${timeFormatted}\t${verifyCode}\t0\t0\t0\n`;
    });

    processRawZKTecoData(demoText, 'SenseFace_M2F_LR_attlog.dat');
  };

  // Test Simulation of a live SenseFace M2F-LR Facial/Fingerprint Recognition punch
  const handleSimulateSenseFacePunch = async (preferredVerifyType: 'Visible Light Face' | 'Fingerprint' | 'RFID Card') => {
    setIsSimulating(true);
    const targetStudent = students.length > 0 ? students[Math.floor(Math.random() * students.length)] : null;
    const studentRoll = targetStudent ? targetStudent.roll : '101';

    try {
      const res = await fetch('/api/zkteco/simulate-punch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: studentRoll,
          verifyType: preferredVerifyType,
          punchType: 'Check-In',
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.log) {
          const newLog: ZKTecoLogItem = {
            id: data.log.id,
            userId: data.log.userId,
            studentName: targetStudent ? (targetStudent.nameBangla || targetStudent.name) : `ইউজার #${data.log.userId}`,
            studentPhoto: targetStudent?.photoUrl,
            timestamp: data.log.timestamp,
            date: data.log.date,
            time: data.log.time,
            verifyType: data.log.verifyType,
            punchType: data.log.punchType,
            deviceModel: 'SenseFace M2F-LR',
            deviceSn: deviceSerialNumber,
            status: 'Synced'
          };

          const updated = [newLog, ...deviceLogs];
          persistLogs(updated);

          if (targetStudent) {
            const record = saveAttendanceRecord({
              studentId: targetStudent.id,
              studentName: targetStudent.nameBangla || targetStudent.name,
              roll: targetStudent.roll,
              classId: targetStudent.classId || 'default',
              className: targetStudent.className || '',
              date: data.log.date,
              time: data.log.time.slice(0, 5),
              status: 'Present',
              method: preferredVerifyType === 'Fingerprint' ? 'Fingerprint' : preferredVerifyType === 'RFID Card' ? 'Automated AI' : 'Face AI',
              notes: `SenseFace M2F-LR (SN: ${deviceSerialNumber}) লাইভ পুশ টেস্ট`,
            });
            onAttendanceUpdated(record);
            saveAttendanceToFirestore(record);
          }

          setFileNotice({
            type: 'success',
            message: `SenseFace M2F-LR থেকে ${targetStudent ? (targetStudent.nameBangla || targetStudent.name) : 'ইউজার'}-এর ${preferredVerifyType} পাঞ্চ ক্লাউডে তাৎক্ষণিক গ্রহণ করা হয়েছে!`
          });
        }
      }
    } catch {
      // fallback
    } finally {
      setIsSimulating(false);
    }
  };

  // Test Network Connection & Fetch Live Logs
  const handleFetchFromNetwork = async () => {
    setIsConnecting(true);
    setStatusMessage(`SenseFace M2F-LR (${deviceIp}:${devicePort}) এর সাথে বাস্তবিক নেটওয়ার্ক যোগাযোগ যাচাই করা হচ্ছে...`);

    try {
      // 1. Verify real connection via backend test-connection endpoint
      const testRes = await fetch('/api/zkteco/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serialNumber: deviceSerialNumber,
          ipAddress: deviceIp,
          port: devicePort
        })
      });

      const testData = await testRes.json();

      if (testData.isOnline) {
        // Register / update device record on server
        await fetch('/api/zkteco/register-device', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serialNumber: deviceSerialNumber,
            name: 'ZKTeco SenseFace M2F-LR',
            model: 'SenseFace M2F-LR',
            ipAddress: deviceIp,
            port: devicePort
          })
        }).catch(() => {});

        // Fetch real logs from device push store
        const logsRes = await fetch(`/api/zkteco/live-logs?sn=${deviceSerialNumber}`);
        const logsData = await logsRes.json();

        setStatusMessage(`✅ ${testData.message}`);
        
        if (logsData.success && Array.isArray(logsData.logs) && logsData.logs.length > 0) {
          // Sync real incoming records
          const existingIds = new Set(deviceLogs.map(l => l.id));
          const newRealLogs: ZKTecoLogItem[] = [];

          logsData.logs.forEach((log: any) => {
            if (!existingIds.has(log.id)) {
              const matchedStudent = students.find(s => String(s.roll).trim() === String(log.userId).trim());
              newRealLogs.push({
                id: log.id,
                userId: log.userId,
                studentName: matchedStudent ? (matchedStudent.nameBangla || matchedStudent.name) : `কর্মী #${log.userId}`,
                studentPhoto: matchedStudent?.photoUrl,
                timestamp: log.timestamp,
                date: log.date,
                time: log.time,
                verifyType: log.verifyType || 'Visible Light Face',
                punchType: log.punchType || 'Check-In',
                deviceModel: log.deviceModel || 'SenseFace M2F-LR',
                deviceIp: deviceIp,
                deviceSn: deviceSerialNumber,
                status: 'Synced',
              });

              if (matchedStudent) {
                const record = saveAttendanceRecord({
                  studentId: matchedStudent.id,
                  studentName: matchedStudent.nameBangla || matchedStudent.name,
                  roll: matchedStudent.roll,
                  classId: matchedStudent.classId || 'default',
                  className: matchedStudent.className || '',
                  date: log.date,
                  time: log.time.slice(0, 5),
                  status: 'Present',
                  method: 'ZKTeco Device (Hardware)',
                  verifySubMethod: log.verifyType || 'Device Recorded',
                  deviceSn: deviceSerialNumber,
                  deviceModel: 'SenseFace M2F-LR',
                  hardwareVerified: true,
                  notes: `SenseFace M2F-LR (SN: ${deviceSerialNumber}) - ${log.verifyType || 'Device Recorded'} [হার্ডওয়্যার পাঞ্চ]`,
                });
                onAttendanceUpdated(record);
                saveAttendanceToFirestore(record);
              }
            }
          });

          if (newRealLogs.length > 0) {
            persistLogs([...newRealLogs, ...deviceLogs]);
          }
        }
      } else {
        // Real verification failed - STRICT OFFLINE! (No fake connected state!)
        setStatusMessage(`❌ ${testData.message || 'ডিভাইসের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি (অফলাইন)।'}`);
      }
    } catch (err: any) {
      console.warn("ZKTeco network fetch error:", err);
      setStatusMessage('❌ সার্ভার বা লোকাল নেটওয়ার্কের সাথে যোগাযোগ ব্যর্থ হয়েছে। আইপি ও পোর্ট সঠিক কি না তা যাচাই করুন।');
    } finally {
      setIsConnecting(false);
    }
  };

  // Export CSV of device attendance history
  const handleExportDeviceCsv = () => {
    if (deviceLogs.length === 0) return;
    let csv = 'ID,User Roll,Employee Name,Date,Time,Verification Mode,Punch Type,Device Model,Device Serial\n';
    deviceLogs.forEach(l => {
      csv += `"${l.id}","${l.userId}","${l.studentName || ''}","${l.date}","${l.time}","${l.verifyType}","${l.punchType}","${l.deviceModel}","${l.deviceSn || deviceSerialNumber}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SenseFace_M2F_LR_Attendance_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Clear all device logs
  const handleClearLogs = () => {
    if (confirm('আপনি কি SenseFace M2F-LR ডিভাইসের সংরক্ষিত সকল লগ মুছে ফেলতে চান?')) {
      persistLogs([]);
      setFileNotice({ type: 'info', message: 'সকল ডিভাইস লগ মুছে ফেলা হয়েছে।' });
    }
  };

  // Filtered Logs
  const filteredLogs = deviceLogs.filter(log => {
    const matchesSearch = 
      (log.studentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(log.userId).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = !dateFilter || log.date === dateFilter;
    const matchesType = verifyTypeFilter === 'All' || log.verifyType === verifyTypeFilter;
    return matchesSearch && matchesDate && matchesType;
  });

  // Current Server Host & Port for ADMS Cloud Setup
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const currentPort = typeof window !== 'undefined' && window.location.port ? window.location.port : (window.location.protocol === 'https:' ? '443' : '80');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* MODAL HEADER WITH SENSEFACE M2F-LR IDENTITY */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 p-0.5 shadow-lg shadow-emerald-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Camera className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide text-white">
                  ZKTeco SenseFace M2F-LR
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  SN: {deviceSerialNumber}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Visible Light Face + Fingerprint + ID
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 flex flex-wrap items-center gap-2">
                <span>লং-রেঞ্জ এআই ফেস রিকগনিশন ও স্মার্ট ক্লাউড সিঙ্ক টার্মিনাল</span>
                <span className="text-emerald-400 font-mono text-[11px]">&bull; মোট সংরক্ষিত লগ: {deviceLogs.length} টি</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition cursor-pointer"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* DEVICE STATUS BAR (SENSEFACE SPECIFICATIONS) */}
        <div className="px-4 py-3 bg-slate-950 text-white border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center space-x-3 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold text-slate-200">মডেল: <span className="text-emerald-400">SenseFace M2F-LR</span></span>
            </div>
            <span className="text-slate-700 hidden sm:inline">|</span>
            <div className="flex items-center space-x-1.5 text-slate-300">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Visible Light Face (0.3m-2m)</span>
            </div>
            <span className="text-slate-700 hidden sm:inline">|</span>
            <div className="flex items-center space-x-1.5 text-slate-300">
              <Fingerprint className="w-3.5 h-3.5 text-teal-400" />
              <span>SilkID Fingerprint</span>
            </div>
            <span className="text-slate-700 hidden sm:inline">|</span>
            <div className="flex items-center space-x-1.5 text-slate-300">
              <Battery className="w-3.5 h-3.5 text-amber-400" />
              <span>Backup Battery Built-in</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-700/60 rounded-lg text-[10px] font-bold">
              সার্ভার ADMS সক্রিয়
            </span>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 sm:px-6 pt-3 gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('cloud_adms')}
            className={`pb-3 text-xs font-black transition-all border-b-2 flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'cloud_adms'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>সরাসরি ক্লাউড সার্ভার কানেকশন (ADMS)</span>
            <span className="px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 rounded text-[9px] font-bold">লাইভ</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 text-xs font-black transition-all border-b-2 flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'history'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>ডিভাইস পাঞ্চ লগ হিস্টোরি ({deviceLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('workers')}
            className={`pb-3 text-xs font-black transition-all border-b-2 flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'workers'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>কম্পিউটার সফটওয়্যার কর্মী ইমপোর্ট (Excel / CSV)</span>
            <span className="px-1.5 py-0.2 bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 rounded text-[9px] font-bold">নতুন এন্ট্রি মুক্ত</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`pb-3 text-xs font-black transition-all border-b-2 flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'import'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>USB পেনড্রাইভ ডাটা ইমপোর্ট</span>
          </button>

          <button
            onClick={() => setActiveTab('network')}
            className={`pb-3 text-xs font-black transition-all border-b-2 flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'network'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Wifi className="w-4 h-4" />
            <span>Wi-Fi ও LAN লোকাল সিঙ্ক</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-3 text-xs font-black transition-all border-b-2 flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'guide'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>SenseFace কানেক্ট গাইড</span>
          </button>
        </div>

        {/* NOTIFICATION MESSAGE */}
        {fileNotice && (
          <div className={`p-3 text-xs flex items-center justify-between border-b ${
            fileNotice.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800' 
              : fileNotice.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
              : 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800'
          }`}>
            <div className="flex items-center space-x-2">
              {fileNotice.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
              <span className="font-semibold">{fileNotice.message}</span>
            </div>
            <button onClick={() => setFileNotice(null)} className="p-1 hover:opacity-75">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* MODAL CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">

          {/* ========================================================================= */}
          {/* TAB 1: CLOUD SERVER / ADMS DIRECT LIVE SYNC (সেরা পদ্ধতি)                */}
          {/* ========================================================================= */}
          {activeTab === 'cloud_adms' && (
            <div className="space-y-5">
              
              {/* Highlight Hero Banner */}
              <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 border border-indigo-500/30 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start space-x-3.5">
                    <div className="p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl shrink-0">
                      <Zap className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-black text-white">
                          SenseFace M2F-LR লাইভ ক্লাউড পুশ (ADMS)
                        </h3>
                        <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 font-black text-[10px] rounded-full">
                          স্বয়ংক্রিয় লাইভ সিঙ্ক
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        SenseFace M2F-LR টার্মিনালের টাচস্ক্রিন মেনু থেকে <b>Cloud Server (ADMS)</b> সেটিংসে নিচের তথ্যগুলো বসিয়ে দিলে কর্মী ডিভাইসে মুখ বা আঙুল দেখানোর সাথে সাথে (১-২ সেকেন্ডে) ওয়েবসাইটে লাইভ হাজিরা চলে আসবে।
                      </p>
                    </div>
                  </div>
                </div>

                {/* Direct Server Values for SenseFace M2F-LR */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                  
                  {/* Field 1: Domain Name (Recommended for Vercel) */}
                  <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-emerald-500/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-emerald-400">ডোমেন নাম (সেরা):</span>
                      <button
                        onClick={() => copyToClipboard('smarthazira.vercel.app', 'domain')}
                        className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedField === 'domain' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedField === 'domain' ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm font-mono font-bold text-emerald-400 truncate select-all">
                      smarthazira.vercel.app
                    </p>
                    <p className="text-[10px] text-slate-400">Domain Name = ON করে এটি লিখুন</p>
                  </div>

                  {/* Field 2: Numeric Server IP */}
                  <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-amber-400">সরাসরি সার্ভার আইপি (IP):</span>
                      <button
                        onClick={() => copyToClipboard('216.198.79.131', 'ip')}
                        className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedField === 'ip' ? <Check className="w-3 h-3 text-amber-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedField === 'ip' ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm font-mono font-bold text-amber-300 truncate select-all">
                      216.198.79.131
                    </p>
                    <p className="text-[10px] text-slate-400">অথবা: 76.76.21.21</p>
                  </div>

                  {/* Field 3: Server Port */}
                  <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Server Port:</span>
                      <button
                        onClick={() => copyToClipboard('443', 'port')}
                        className="text-[10px] font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedField === 'port' ? <Check className="w-3 h-3 text-teal-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedField === 'port' ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm font-mono font-bold text-teal-400 select-all">
                      443 <span className="text-[10px] font-normal text-slate-400">(বা 80)</span>
                    </p>
                    <p className="text-[10px] text-slate-500">HTTPS এর জন্য 443, HTTP এর জন্য 80</p>
                  </div>

                  {/* Field 4: Device Serial Number */}
                  <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Device SN:</span>
                      <button
                        onClick={() => copyToClipboard(deviceSerialNumber, 'sn')}
                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedField === 'sn' ? <Check className="w-3 h-3 text-indigo-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedField === 'sn' ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm font-mono font-bold text-indigo-300 select-all">
                      {deviceSerialNumber}
                    </p>
                    <p className="text-[10px] text-slate-500">ডিভাইস লেবেলে মুদ্রিত SN</p>
                  </div>

                </div>

                {/* Instant Live Test Simulator */}
                <div className="bg-indigo-950/40 p-4 rounded-2xl border border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>মেশিন কানেকশন সিমুলেটর (এখনই টেস্ট করুন):</span>
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      ডিভাইস থেকে ফেস বা ফিঙ্গারপ্রিন্ট পাঞ্চ পাঠালে ওয়েবসাইটে কীভাবে সাথে সাথে হাজিরার হিসাব হয় তা পরীক্ষা করুন
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      disabled={isSimulating}
                      onClick={() => handleSimulateSenseFacePunch('Visible Light Face')}
                      className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md active:scale-95 transition cursor-pointer disabled:opacity-50"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{isSimulating ? 'প্রসেস হচ্ছে...' : 'ফেস পাঞ্চ টেস্ট'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSimulating}
                      onClick={() => handleSimulateSenseFacePunch('Fingerprint')}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 border border-slate-700 active:scale-95 transition cursor-pointer disabled:opacity-50"
                    >
                      <Fingerprint className="w-3.5 h-3.5 text-teal-400" />
                      <span>ফিঙ্গার টেস্ট</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* 4 Quick Steps for SenseFace M2F-LR Touchscreen */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>SenseFace M2F-LR মেশিনে ADMS চালু করার ৪টি সহজ ধাপ:</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">ধাপ ১: মেশিনে ইন্টারনেট সংযুক্ত করুন</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      SenseFace মেশিনের টাচস্ক্রিনে <b>Menu (M/OK) &gt; Comm. &gt; Wireless Network (Wi-Fi)</b>-এ গিয়ে আপনার অফিসের ওয়াইফাই পাসওয়ার্ড দিয়ে কানেক্ট করুন (অথবা পেছনে ল্যান ক্যাবল লাগান)।
                    </p>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <p className="font-bold text-teal-600 dark:text-teal-400">ধাপ ২: ক্লাউড সার্ভার সেটিংসে যান</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      মেনু থেকে <b>Comm. &gt; Cloud Server Setting</b> (বা ADMS)-এ প্রবেশ করুন। <b>Enable Domain Name</b> অপশনটি <b>ON</b> করুন।
                    </p>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <p className="font-bold text-indigo-600 dark:text-indigo-400">ধাপ ৩: সার্ভার এড্রেস ও পোর্ট লিখুন</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Server Address ঘরে ওপরের ডোমেইন এবং Server Port ঘরে <span className="font-mono font-bold text-slate-900 dark:text-white">{currentPort}</span> লিখুন। Enable Proxy Server অপশনটি <b>OFF</b> রাখুন।
                    </p>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <p className="font-bold text-cyan-600 dark:text-cyan-400">ধাপ ৪: সেভ করে টেস্ট করুন</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      <b>OK</b> চেপে সেভ করে বের হয়ে আসুন। মেশিনের স্ক্রিনের উপরে ক্লাউড (☁️) আইকন সবুজ হয়ে যাবে। এবার মুখে বা আঙুলে পাঞ্চ করলেই এই ওয়েবসাইটে সাথে সাথে নাম উঠবে!
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: DEVICE ATTENDANCE LOG HISTORY (লগ হিস্টোরি টেবিল)                   */}
          {/* ========================================================================= */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              
              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 flex-1">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="কর্মী বা আইডি / রোল দিয়ে খুঁজুন..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none shrink-0"
                  />
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <select
                    value={verifyTypeFilter}
                    onChange={(e) => setVerifyTypeFilter(e.target.value)}
                    className="p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold"
                  >
                    <option value="All">সব মাধ্যম</option>
                    <option value="Visible Light Face">Visible Light Face</option>
                    <option value="Fingerprint">ফিঙ্গারপ্রিন্ট</option>
                    <option value="RFID Card">RFID কার্ড</option>
                  </select>

                  <button
                    onClick={handleExportDeviceCsv}
                    disabled={deviceLogs.length === 0}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    title="এক্সেল / CSV ডাউনলোড করুন"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">CSV রিপোর্ট</span>
                  </button>

                  <button
                    onClick={handleClearLogs}
                    className="px-2.5 py-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold transition cursor-pointer"
                    title="সকল লগ খালি করুন"
                  >
                    মুছুন
                  </button>
                </div>
              </div>

              {/* Table of Machine Logs */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                <div className="overflow-x-auto max-h-[46vh]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 sticky top-0 z-10 text-slate-600 dark:text-slate-300 font-black">
                      <tr>
                        <th className="py-2.5 px-3">ইউজার আইডি / রোল</th>
                        <th className="py-2.5 px-3">কর্মীর নাম ও ছবি</th>
                        <th className="py-2.5 px-3">পাঞ্চের তারিখ ও সময়</th>
                        <th className="py-2.5 px-3">যাচাইয়ের মাধ্যম</th>
                        <th className="py-2.5 px-3">পাঞ্চ টাইপ</th>
                        <th className="py-2.5 px-3">মেশিন মডেল</th>
                        <th className="py-2.5 px-3">ক্লাউড স্ট্যাটাস</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                      {filteredLogs.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-slate-400">
                            কোনো পাঞ্চ লগ রেকর্ড পাওয়া যায়নি।
                          </td>
                        </tr>
                      ) : (
                        filteredLogs.map((log) => {
                          const isFace = log.verifyType === 'Visible Light Face';
                          const isCard = log.verifyType === 'RFID Card';
                          return (
                            <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                              
                              {/* Roll / User ID */}
                              <td className="py-2 px-3 font-mono font-bold text-slate-900 dark:text-white">
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                                  {log.userId}
                                </span>
                              </td>

                              {/* Student / Member Info */}
                              <td className="py-2 px-3">
                                <div className="flex items-center space-x-2">
                                  {log.studentPhoto ? (
                                    <img
                                      src={log.studentPhoto}
                                      alt={log.studentName || 'Student'}
                                      className="w-7 h-7 rounded-full object-cover border border-slate-300 dark:border-slate-700 shrink-0"
                                    />
                                  ) : (
                                    <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300 shrink-0">
                                      {log.studentName ? log.studentName.charAt(0) : '#'}
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-bold text-slate-900 dark:text-white text-xs">
                                      {log.studentName || (
                                        <span className="text-amber-500 font-normal italic">
                                          ডাটাবেজে অনিবন্ধিত
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* Timestamp */}
                              <td className="py-2 px-3">
                                <div className="text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                                  <span>{log.date}</span>{' '}
                                  <span className="font-bold text-slate-900 dark:text-white">{log.time}</span>
                                </div>
                              </td>

                              {/* Verify Mode */}
                              <td className="py-2 px-3">
                                <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isFace
                                    ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800'
                                    : isCard
                                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                }`}>
                                  {isFace ? <Camera className="w-3 h-3" /> : isCard ? <CreditCard className="w-3 h-3" /> : <Fingerprint className="w-3 h-3" />}
                                  <span>{log.verifyType}</span>
                                </span>
                              </td>

                              {/* Punch Type */}
                              <td className="py-2 px-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                  log.punchType === 'Check-In'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                                }`}>
                                  {log.punchType === 'Check-In' ? 'প্রবেশ (IN)' : 'প্রস্থান (OUT)'}
                                </span>
                              </td>

                              {/* Device Model */}
                              <td className="py-2 px-3 text-[11px] text-slate-500 font-mono">
                                {log.deviceModel || 'SenseFace M2F-LR'}
                              </td>

                              {/* Cloud Sync Status */}
                              <td className="py-2 px-3">
                                <span className="inline-flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>সিঙ্কড</span>
                                </span>
                              </td>

                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: WORKER IMPORT FROM PC ZKTECO SOFTWARE (NO RE-ENTRY NEEDED)           */}
          {/* ========================================================================= */}
          {activeTab === 'workers' && (
            <div className="space-y-6">

              {/* REASSURANCE HERO CARD */}
              <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 p-6 rounded-3xl border border-emerald-500/30 text-white space-y-4 shadow-xl relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start space-x-3.5">
                    <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30 shrink-0">
                      <ShieldCheck className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          আপনার প্রশ্নের পরিষ্কার উত্তর
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-teal-500/20 text-teal-300">
                          ১০০% স্বয়ংক্রিয় সিঙ্ক
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                        না, পুনরায় কাউকে নতুন করে এন্ট্রি করতে হবে না!
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed max-w-2xl">
                        আপনার কম্পিউটারে থাকা <span className="font-bold text-emerald-300">ZKTeco সফটওয়্যার (ZKTime.Net / ZKBioTime / ZKAccess / Att2008)</span> এ যেহেতু সমস্ত কর্মী অলরেডি এন্ট্রি করা আছে, তাই আপনাকে কোনো কর্মীর তথ্য দ্বিতীয়বার হাতে টাইপ করতে হবে না।
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleLoadDemoZKWorkers}
                    className="px-4 py-2 bg-slate-800/90 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 border border-slate-700/80 cursor-pointer shadow-md shrink-0 self-start sm:self-auto active:scale-95 transition"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>নমুনা ডাটা দিয়ে এখনই টেস্ট করুন</span>
                  </button>
                </div>

                {/* TWO EASY WAYS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>পদ্ধতি ১: এক্সেল বা CSV ফাইল আপলোড (সবচেয়ে দ্রুত)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      পিসির ZKTeco সফটওয়্যার থেকে এক ক্লিকে কর্মী তালিকাটি Excel (.xlsx) হিসেবে সেভ করে নিচে আপলোড করুন। সাথে সাথে শত শত কর্মীর নাম, আইডি ও পদবি ওয়েবসাইটে চলে আসবে।
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center space-x-2 text-teal-400 font-bold text-xs">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>পদ্ধতি ২: পাঞ্চের সাথে অটো-এনরোলমেন্ট (ফাইল ছাড়াও)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      আপনি কোনো ফাইল আপলোড না করলেও, মেশিনে ফেস বা ফিঙ্গারপ্রিন্ট পাঞ্চ দেওয়ার সাথে সাথে তার User ID (যেমন: #105) দিয়ে স্বয়ংক্রিয়ভাবে হাজিরা ও প্রোফাইল তৈরি হয়ে যাবে!
                    </p>
                  </div>
                </div>
              </div>

              {/* STEP BY STEP GUIDE ON EXPORTING FROM PC SOFTWARE */}
              <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-500" />
                  <span>কম্পিউটারের ZKTeco সফটওয়্যার থেকে যেভাবে এক্সেল বের করবেন:</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black text-[11px] flex items-center justify-center">১</span>
                      <span className="font-bold text-slate-900 dark:text-white">সফটওয়্যার ওপেন করুন</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      আপনার কম্পিউটারে থাকা <b>ZKTime</b> বা <b>ZKBioTime</b> ওপেন করে <b>Personnel / Employee</b> মেনুতে ক্লিক করুন।
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black text-[11px] flex items-center justify-center">২</span>
                      <span className="font-bold text-slate-900 dark:text-white">Export বাটনে ক্লিক করুন</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      উপরে <b>Export</b> বাটনে চাপ দিয়ে <b>Microsoft Excel (*.xlsx, *.xls)</b> বা <b>CSV</b> ফরম্যাটে ফাইলটি আপনার কম্পিউটারে সেভ করুন।
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black text-[11px] flex items-center justify-center">৩</span>
                      <span className="font-bold text-slate-900 dark:text-white">নিচে ফাইলটি আপলোড দিন</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      নিচের ড্রপজোনে ফাইলটি সিলেক্ট করলেই সমস্ত কর্মীর নাম ও আইডি চলে আসবে। "ইমপোর্ট করুন" চাপলে কাজ শেষ!
                    </p>
                  </div>
                </div>
              </div>

              {/* FILE UPLOAD DROPZONE */}
              <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-3xl border-2 border-dashed border-emerald-500/30 hover:border-emerald-500/70 transition space-y-4">
                <input
                  type="file"
                  ref={workerFileInputRef}
                  accept=".xlsx,.xls,.csv,.txt,.dat"
                  onChange={handleWorkerFileUpload}
                  className="hidden"
                />

                <div 
                  onClick={() => workerFileInputRef.current?.click()}
                  className="cursor-pointer text-center space-y-2 py-4"
                >
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
                    <FileUp className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    কম্পিউটারের ZK সফটওয়্যার থেকে এক্সপোর্ট করা Excel (.xlsx, .xls) বা CSV ফাইল এখানে আপলোড করুন
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    অথবা পেনড্রাইভের <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">user.dat</span> ফাইলও সাপোর্ট করে
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      workerFileInputRef.current?.click();
                    }}
                    className="mt-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer inline-flex items-center space-x-2"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>ফাইল ব্রাউজ করুন</span>
                  </button>
                </div>

                {workerImportNotice && (
                  <div className={`p-3.5 rounded-2xl text-xs flex items-center justify-between border ${
                    workerImportNotice.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                      : workerImportNotice.type === 'error'
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
                      : 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800'
                  }`}>
                    <span>{workerImportNotice.message}</span>
                    <button
                      type="button"
                      onClick={() => setWorkerImportNotice(null)}
                      className="text-slate-400 hover:text-slate-600 ml-2"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* PREVIEW OF WORKERS FROM FILE */}
              {importedWorkersPreview.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-500" />
                        <span>ফাইলে পাওয়া কর্মীদের তালিকা ({importedWorkersPreview.length} জন)</span>
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        নিচের তালিকাটি মিলিয়ে নিন। অলরেডি যুক্ত থাকা কর্মীরা ডুপ্লিকেট হবে না।
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        নতুন কর্মী: {importedWorkersPreview.filter(w => !w.isExisting).length} জন
                      </span>
                      <button
                        type="button"
                        onClick={handleConfirmWorkerImport}
                        disabled={importedWorkersPreview.filter(w => !w.isExisting).length === 0}
                        className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 flex items-center space-x-2 active:scale-95 transition"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>সকল নতুন কর্মী ওয়েবসাইটে যুক্ত করুন ({importedWorkersPreview.filter(w => !w.isExisting).length} জন)</span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-72 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-800">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold sticky top-0">
                        <tr>
                          <th className="py-2.5 px-3">কর্মীর আইডি / Badgenumber</th>
                          <th className="py-2.5 px-3">নাম</th>
                          <th className="py-2.5 px-3">বিভাগ / পদবি</th>
                          <th className="py-2.5 px-3">স্ট্যাটাস</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                        {importedWorkersPreview.map((w, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                            <td className="py-2 px-3 font-mono font-bold text-slate-900 dark:text-white">
                              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                                #{w.roll}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
                              {w.name}
                            </td>
                            <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                              {w.department}
                            </td>
                            <td className="py-2 px-3">
                              {w.isExisting ? (
                                <span className="inline-flex items-center space-x-1 text-slate-400 font-bold text-[10px]">
                                  <Check className="w-3 h-3 text-slate-400" />
                                  <span>অলরেডি সিস্টেমে আছে</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                  <span>নতুন যুক্ত হবে</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}
          {activeTab === 'import' && (
            <div className="space-y-5">
              
              <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-900/10 p-5 rounded-3xl border border-emerald-500/20 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                      <HardDrive className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        SenseFace M2F-LR পেনড্রাইভ ডাটা ইমপোর্ট
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        মেশিনের USB পোর্ট থেকে ডাউনলোড করা <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">attlog.dat</span> বা <span className="font-mono font-bold">1_attlog.dat</span> ফাইল সিলেক্ট করুন
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleLoadDemoZKTecoFile}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>SenseFace ডেমো ফাইল দিয়ে টেস্ট</span>
                  </button>
                </div>

                {/* Upload Box */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".dat,.txt,.csv,.log"
                  className="hidden"
                />

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 rounded-2xl p-8 text-center cursor-pointer bg-white/50 dark:bg-slate-900/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition group"
                >
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white">
                        পেনড্রাইভের হাজিরা ফাইল আপলোড করতে এখানে ক্লিক করুন
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        সমর্থিত ফরম্যাট: .dat, .txt, .csv (যেমন: attlog.dat)
                      </p>
                    </div>
                    {isProcessingFile && (
                      <div className="flex items-center space-x-2 text-xs text-emerald-600 font-bold">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>ফাইল প্রসেস ও উপস্থিতি সিঙ্ক হচ্ছে...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick instructions for SenseFace USB */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <h4 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>SenseFace M2F-LR থেকে কীভাবে পেনড্রাইভে লগ ফাইল নেবেন:</span>
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 pl-1 leading-relaxed">
                  <li>যেকোনো সাধারণ পেনড্রাইভ (FAT32) SenseFace ডিভাইসের USB পোর্টে লাগান।</li>
                  <li>মেশিনের টাচস্ক্রিনে <b>Menu (M/OK)</b> চেপে <b>USB Manager</b> (বা U-Disk Manager) এ যান।</li>
                  <li><b>Download</b> অপশনে ট্যাপ করে <b>Download Attendance Data</b> নির্বাচন করুন।</li>
                  <li>পেনড্রাইভে <span className="font-mono font-bold text-emerald-500">attlog.dat</span> ফাইল সেভ হবে। এবার পেনড্রাইভটি এই কম্পিউটারে এনে এখানে আপলোড দিন।</li>
                </ol>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: WI-FI & LAN LOCAL NETWORK SYNC                                     */}
          {/* ========================================================================= */}
          {activeTab === 'network' && (
            <div className="space-y-5">
              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-teal-500/20 text-teal-600 dark:text-teal-400 rounded-2xl">
                      <Wifi className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        SenseFace M2F-LR Wi-Fi ও LAN লোকাল সংযোগ
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        ডিভাইসের লোকাল IP এড্রেসের সাথে TCP/IP (Port 4370) দিয়ে কানেক্ট করুন
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-xs font-bold">
                    TCP Port 4370
                  </span>
                </div>

                {/* Network Form */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      ডিভাইস Wi-Fi / LAN IP
                    </label>
                    <input
                      type="text"
                      value={deviceIp}
                      onChange={(e) => setDeviceIp(e.target.value)}
                      placeholder="192.168.1.201"
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      কমিউনিকেশন পোর্ট (Port)
                    </label>
                    <input
                      type="text"
                      value={devicePort}
                      onChange={(e) => setDevicePort(e.target.value)}
                      placeholder="4370"
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      কমিউনিকেশন কি (Comm Key)
                    </label>
                    <input
                      type="text"
                      value={deviceCommKey}
                      onChange={(e) => setDeviceCommKey(e.target.value)}
                      placeholder="0"
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Connect Action Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="text-xs">
                    {statusMessage && (
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        <span>{statusMessage}</span>
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleFetchFromNetwork}
                    disabled={isConnecting}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-emerald-600/25 active:scale-95 transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isConnecting ? 'animate-spin' : ''}`} />
                    <span>{isConnecting ? 'ডাটা ফেচ হচ্ছে...' : 'ডিভাইস থেকে লগ ফেচ করুন'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: STEP-BY-STEP SENSEFACE M2F-LR SETUP GUIDE                          */}
          {/* ========================================================================= */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs">
              
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-500" />
                  <span>ZKTeco SenseFace M2F-LR (SN: {deviceSerialNumber}) পরিচিতি ও স্পেসিফিকেশন:</span>
                </h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  আপনার ডিভাইসটি হলো ZKTeco-এর অত্যাধুনিক <b>SenseFace M2F-LR</b> টার্মিনাল। এতে রয়েছে লং-রেঞ্জ (০.৩ মিটার থেকে ২+ মিটার দূরত্বে) লাইভ ভিজিবল লাইট ফেস রিকগনিশন অ্যালগরিদম, হাই-স্পিড ফিঙ্গারপ্রিন্ট সেন্সর, আরএফআইডি কার্ড রিডার এবং বিল্ট-ইন ব্যাকআপ ব্যাটারি।
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <h5 className="font-bold text-amber-500 flex items-center gap-1.5">
                    <Zap className="w-4 h-4" />
                    <span>পদ্ধতি ১: ADMS ক্লাউড পুশ (সেরা)</span>
                  </h5>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    মেশিনের <b>Comm. &gt; Cloud Server</b>-এ ডোমেইন ও পোর্ট বসিয়ে দিন। কর্মী মুখ দেখালে লাইভ সেকেন্ডের মধ্যে ওয়েবসাইটে হাজিরার নোটিফিকেশন আসবে।
                  </p>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <h5 className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4" />
                    <span>পদ্ধতি ২: পেনড্রাইভ (অফলাইন)</span>
                  </h5>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    কোনো ইন্টারনেট না থাকলেও যেকোনো সাধারণ পেনড্রাইভে <span className="font-mono">attlog.dat</span> ফাইল নামিয়ে সফটওয়্যারে আপলোড করলে নিমেষেই হাজিরা আপডেট হবে।
                  </p>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <h5 className="font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                    <Wifi className="w-4 h-4" />
                    <span>পদ্ধতি ৩: Wi-Fi ও LAN</span>
                  </h5>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    রাউটারের ওয়াইফাই দিয়ে একই নেটওয়ার্কে থাকলে আইপি দিয়ে ১ ক্লিকে মেশিনের সকল লগ সরাসরি সফটওয়্যারে রিড করা যায়।
                  </p>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>গুরুত্বপূর্ণ আইডি ম্যাচিং টিপস:</span>
                </p>
                <p className="text-[11px] opacity-90 leading-relaxed">
                  SenseFace মেশিনে কর্মী বা শিক্ষার্থীর ফেস এবং ফিঙ্গারপ্রিন্ট রেজিস্টার করার সময় যে <b>User ID / Enroll ID</b> (যেমন: 101, 102) দেওয়া হবে, আপনার এই ওয়েবসাইটে সেই ব্যক্তির <b>রোল / আইডি</b> হুবহু একই রাখবেন। তাহলে মেশিন থেকে যেভাবেই পাঞ্চ আসুক না কেন, সফটওয়্যার সাথে সাথে সঠিক ব্যক্তির প্রোফাইল ও ছবির সাথে হাজিরা জমা করে নেবে।
                </p>
              </div>

            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Database className="w-3.5 h-3.5 text-emerald-500" />
            <span>SenseFace M2F-LR এর সকল পাঞ্চ ক্লাউড ফায়ারবেসে স্থায়ীভাবে সংরক্ষিত থাকে</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
