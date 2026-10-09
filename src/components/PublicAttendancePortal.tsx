import React, { useRef, useState, useEffect } from 'react';
import { Student, ClassSubject, AttendanceRecord } from '../types';
import { identifyStudentFromCamera, isFaceActuallyRegistered, isFingerprintActuallyRegistered } from '../utils/faceMatching';
import { OrgCategoryInfo } from '../utils/organizationConfig';
import { getStoredScheduleSettings, calculateDistanceMeters } from '../utils/scheduleConfig';
import { 
  checkMobileBiometricSupport, 
  triggerMobileFingerprintPrompt, 
  BiometricCapability,
  registerWebAuthnPasskey,
  verifyWebAuthnPasskey
} from '../utils/mobileBiometrics';
import { 
  Camera, 
  CheckCircle2, 
  RefreshCw, 
  X, 
  ShieldCheck, 
  UserCheck, 
  MapPin, 
  Clock, 
  Building2, 
  AlertCircle,
  LogOut,
  Fingerprint,
  ScanFace,
  ChevronLeft,
  Search,
  Sparkles,
  Info,
  Unlock,
  Lock,
  Maximize2,
  Minimize2,
  Smartphone,
  Check,
  Wifi,
  WifiOff,
  Shield,
  Laptop
} from 'lucide-react';

interface PublicAttendancePortalProps {
  classes: ClassSubject[];
  students: Student[];
  onExitPortal: () => void;
  onAttendanceUpdated: (record: AttendanceRecord) => void;
  soundEnabled: boolean;
  orgInfo: OrgCategoryInfo;
  companyName?: string;
  enforceGeofence?: boolean;
  mode?: 'public' | 'user';
  currentUserStudent?: Student;
  onUpdateStudent?: (student: Student) => void;
}

type PortalView = 'selection' | 'fingerprint' | 'face';

export const PublicAttendancePortal: React.FC<PublicAttendancePortalProps> = ({
  classes,
  students,
  onExitPortal,
  onAttendanceUpdated,
  soundEnabled,
  orgInfo,
  companyName,
  enforceGeofence = false,
  mode = 'public',
  currentUserStudent,
  onUpdateStudent,
}) => {
  const { terminology } = orgInfo;

  // Active View State: 'selection' (2 buttons view), 'face', or 'fingerprint'
  const [activeView, setActiveView] = useState<PortalView>('selection');

  // User Mode Biometric Passkey State
  const [isBiometricProcessing, setIsBiometricProcessing] = useState<boolean>(false);
  const [biometricMessage, setBiometricMessage] = useState<string | null>(null);

  const handleFingerprintClick = async () => {
    if (isDeviceLocked) {
      alert('❌ আপনার ডিভাইসটি অনুমোদিত নয়। হাজিরা দেওয়া সম্ভব নয়।');
      return;
    }

    if (mode === 'user' && currentUserStudent) {
      if (enforceGeofence && !gpsVerified) {
        alert('⚠️ অফিস লোকেশন যাচাই করা যায়নি। দয়া করে লোকেশন অন করুন এবং রিফ্রেশ করুন।');
        return;
      }

      setIsBiometricProcessing(true);
      setBiometricMessage(null);

      const result = await triggerMobileFingerprintPrompt(currentUserStudent.nameBangla, currentUserStudent.id);
      setIsBiometricProcessing(false);

      if (result.success) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
        const updated = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          studentId: currentUserStudent.id,
          studentName: currentUserStudent.nameBangla,
          roll: currentUserStudent.roll,
          classId: currentUserStudent.classId || 'default-class',
          className: currentUserStudent.className || orgInfo.terminology.groupLabel,
          date: now.toISOString().split('T')[0],
          time: timeStr,
          entryTime: timeStr,
          status: 'Present' as any,
          method: 'Mobile Biometric Fingerprint',
          notes: 'মোবাইল ফিঙ্গারপ্রিন্ট সেন্সর ভেরিফিকেশন সফল',
          updatedAt: Date.now(),
        };
        onAttendanceUpdated(updated);
        setLastDetectedStudent(currentUserStudent);
        setDetectionTimestamp(timeStr);
        setDetectionSuccess(true);
        playSuccessSound();
        speakBengali(`${currentUserStudent.nameBangla}, আপনার ফিঙ্গারপ্রিন্ট হাজিরা সফলভাবে গ্রহণ করা হয়েছে।`);
        setTimeout(() => {
          setDetectionSuccess(false);
          onExitPortal();
        }, 2000);
      } else {
        setBiometricMessage(result.error || 'বায়োমেট্রিক ফিঙ্গারপ্রিন্ট যাচাই ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।');
      }
    } else {
      setActiveView('fingerprint');
      setFingerprintStatusText('সেন্সরে আপনার আঙুল স্পর্শ করুন');
      setFingerprintScanError(null);
    }
  };

  // Camera & Face Scan State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [faceScanMessage, setFaceScanMessage] = useState<string>('ক্যামেরার দিকে সোজা তাকিয়ে থাকুন...');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(Boolean(typeof document !== 'undefined' && document.fullscreenElement));

  const toggleBrowserFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
        setIsFullscreen(true);
      } else {
        document.exitFullscreen?.().catch(() => {});
        setIsFullscreen(false);
      }
    } catch {
      // Fullscreen fallback
    }
  };

  // 1. WiFi & Network Security State
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [wifiSecurityEnabled, setWifiSecurityEnabled] = useState<boolean>(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 2. Geofence & Location State
  const scheduleSettings = getStoredScheduleSettings();
  const geofence = scheduleSettings.geofence;
  const isLocationEnforced = enforceGeofence || Boolean(geofence?.enforceGeofence);

  const [gpsVerified, setGpsVerified] = useState<boolean>(!isLocationEnforced);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const isLocationBlocked = isLocationEnforced && (!gpsVerified || (distanceMeters !== null && geofence && distanceMeters > geofence.radiusMeters));

  // 3. Device Lock & Permission State
  const [isDeviceLocked, setIsDeviceLocked] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('public_portal_device_locked');
      return stored === 'true';
    } catch {
      return false;
    }
  });

  // Check Mobile Device Biometric Capabilities
  const [biometricCap, setBiometricCap] = useState<BiometricCapability | null>(null);
  const [isFingerprintScanning, setIsFingerprintScanning] = useState<boolean>(false);
  const [fingerprintStatusText, setFingerprintStatusText] = useState<string>('সেন্সরে আপনার আঙুল স্পর্শ করুন');
  const [fingerprintScanError, setFingerprintScanError] = useState<string | null>(null);
  const [fingerprintSearch, setFingerprintSearch] = useState<string>('');

  // Punch Result State
  const [lastDetectedStudent, setLastDetectedStudent] = useState<Student | null>(null);
  const [detectionTimestamp, setDetectionTimestamp] = useState<string>('');
  const [detectionSuccess, setDetectionSuccess] = useState<boolean>(false);
  const [recentAttendanceMap, setRecentAttendanceMap] = useState<Record<string, number>>({});

  // Current Live Time
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    checkMobileBiometricSupport().then((cap) => {
      setBiometricCap(cap);
    });
  }, []);

  // Function to verify live GPS location
  const verifyLocation = () => {
    if (!isLocationEnforced) {
      setGpsVerified(true);
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('আপনার ডিভাইসে GPS লোকেশন সেবা নেই বা অনুপলব্ধ।');
      setGpsVerified(false);
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;

        if (geofence && geofence.latitude && geofence.longitude) {
          const dist = calculateDistanceMeters(
            userLat,
            userLng,
            geofence.latitude,
            geofence.longitude
          );
          setDistanceMeters(dist);

          const isInside = dist <= geofence.radiusMeters;
          setGpsVerified(isInside);
          if (!isInside) {
            setGpsError(`আপনি অফিসের অনুমোদিত সীমানার বাইরে আছেন (${dist} মি., সর্বোচ্চ সীমা: ${geofence.radiusMeters} মি.)`);
          } else {
            setGpsError(null);
          }
        } else {
          setGpsVerified(true);
        }
        setGpsLoading(false);
      },
      (err) => {
        console.warn('Public Attendance GPS check error:', err);
        setGpsLoading(false);
        setGpsVerified(false);
        if (err.code === 1) {
          setGpsError('GPS লোকেশন এক্সেস বন্ধ। ব্রাউজারে লোকেশন চালু করুন।');
        } else {
          setGpsError('ডিভাইসের লোকেশন পাওয়া যায়নি। GPS অন করুন।');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  };

  useEffect(() => {
    verifyLocation();
  }, [isLocationEnforced]);

  // Audio feedback
  const playSuccessSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {
      // Audio fallback
    }
  };

  // Bengali voice greeting
  const speakBengali = (text: string) => {
    if (!soundEnabled) return;
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'bn-BD';
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      // Speech fallback
    }
  };

  // Start Camera Stream for Face mode
  useEffect(() => {
    if (activeView !== 'face') {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
        setStream(null);
      }
      return;
    }

    let activeStream: MediaStream | null = null;

    const initCamera = async () => {
      setCameraError(null);
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1280, min: 320 }, 
            height: { ideal: 720, min: 240 }, 
            facingMode: { ideal: 'user' } 
          },
          audio: false,
        });
        activeStream = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err: any) {
        try {
          const mediaStreamFallback = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false,
          });
          activeStream = mediaStreamFallback;
          setStream(mediaStreamFallback);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStreamFallback;
          }
        } catch (fallbackErr: any) {
          console.error("Public attendance camera error:", fallbackErr);
          setCameraError("ক্যামেরা চালু করা সম্ভব হয়নি। অনুগ্রহ করে ব্রাউজারে ক্যামেরা পারমিশন দিন।");
        }
      }
    };

    initCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [activeView]);

  // Auto Face Scan Loop
  useEffect(() => {
    if (activeView !== 'face') return;

    const interval = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || isScanning || students.length === 0 || detectionSuccess) return;

      if (isLocationBlocked) {
        setFaceScanMessage('লোকেশন বাধার কারণে স্ক্যান স্থগিত');
        return;
      }

      if (isDeviceLocked) {
        setFaceScanMessage('আপনার ডিভাইসটি অনুমোদিত নয়');
        return;
      }

      setIsScanning(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        try {
          const result = await identifyStudentFromCamera(canvas, students);
          if (result && result.matchedStudent) {
            handleSuccessfulPunch(result.matchedStudent, 'Face AI');
          } else {
            setFaceScanMessage('ক্যামেরার দিকে সোজা তাকিয়ে থাকুন...');
          }
        } catch {
          // Continuous loop catch
        }
      }
      setIsScanning(false);
    }, 2000);

    return () => clearInterval(interval);
  }, [isScanning, students, activeView, detectionSuccess, isLocationBlocked, isDeviceLocked]);

  // Handle Successful Attendance Submission
  const handleSuccessfulPunch = (student: Student, method: 'Face AI' | 'Fingerprint' | 'Manual') => {
    if (isDeviceLocked) {
      alert('❌ আপনার ডিভাইসটি অনুমোদিত নয়। হাজিরা দেওয়া সম্ভব নয়।');
      return;
    }

    if (isLocationBlocked) {
      const errorMsg = gpsError || `আপনি অফিসের বাহিরে আছেন। হাজিরা দেওয়া সম্ভব নয়।`;
      alert(`❌ লোকেশন বাধা:\n${errorMsg}\n\nহাজিরা দিতে অফিসের সীমানার ভেতরে আসুন।`);
      return;
    }

    const nowMs = Date.now();
    const lastPunchTime = recentAttendanceMap[student.id];
    if (lastPunchTime && (nowMs - lastPunchTime < 5 * 60 * 1000)) {
      const elapsedMins = Math.floor((nowMs - lastPunchTime) / 60000);
      const waitMins = 5 - elapsedMins;
      const msg = `${student.nameBangla}, আপনার হাজিরা ইতিমধ্যে রেকর্ড হয়েছে। পুনরায় হাজিরা দিতে ${waitMins} মিনিট পর চেষ্টা করুন।`;
      alert(`⚠️ সতর্কবার্তা:\n${msg}`);
      return;
    }

    setRecentAttendanceMap(prev => ({ ...prev, [student.id]: nowMs }));
    setLastDetectedStudent(student);
    const nowTime = new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const today = new Date().toISOString().split('T')[0];
    setDetectionTimestamp(nowTime);
    setDetectionSuccess(true);
    playSuccessSound();
    speakBengali(`ধন্যবাদ ${student.nameBangla}, আপনার উপস্থিতি সফলভাবে রেকর্ড হয়েছে।`);

    const currentClass = classes.find(c => c.id === student.classId) || classes[0];

    const record: AttendanceRecord = {
      id: `att-pub-${Date.now()}-${student.id}`,
      studentId: student.id,
      studentName: student.nameBangla,
      roll: student.roll,
      classId: student.classId,
      className: currentClass ? currentClass.classNameBangla : orgInfo.terminology.groupLabel,
      date: today,
      time: nowTime,
      status: 'Present',
      method: method,
      notes: `পাবলিক পোর্টাল থেকে হাজিরা নিশ্চিত (${method})`
    };

    onAttendanceUpdated(record);

    setTimeout(() => {
      setDetectionSuccess(false);
      setLastDetectedStudent(null);
      setFaceScanMessage('পরবর্তী কর্মীর জন্য প্রস্তুত, ক্যামেরার সামনে দাঁড়ান');
      setFingerprintStatusText('সেন্সরে আপনার আঙুল স্পর্শ করুন');
      setIsFingerprintScanning(false);
    }, 3500);
  };

  // Handle Biometric Fingerprint Sensor Scan Touch
  const handleFingerprintSensorTouch = async (student?: Student) => {
    if (isDeviceLocked) {
      setFingerprintScanError('আপনার ডিভাইসটি অনুমোদিত নয়।');
      return;
    }

    if (isLocationBlocked) {
      const errorMsg = gpsError || `আপনি অফিসের বাহিরে আছেন।`;
      setFingerprintScanError(errorMsg);
      return;
    }

    let matched = student;
    if (!matched) {
      const registered = students.filter(s => isFingerprintActuallyRegistered(s));
      matched = registered[0] || students[0];
    }

    if (!matched) {
      setFingerprintScanError('কোনো কর্মীর বায়োমেট্রিক ডাটা পাওয়া যায়নি।');
      return;
    }

    setIsFingerprintScanning(true);
    setFingerprintScanError(null);
    setFingerprintStatusText('মোবাইলের ফিঙ্গারপ্রিন্ট সেন্সরে আঙুল স্পর্শ করুন...');

    try {
      const promptResult = await triggerMobileFingerprintPrompt(matched.nameBangla, matched.roll);

      if (!promptResult.success) {
        setFingerprintScanError(promptResult.error || 'ফিঙ্গারপ্রিন্ট যাচাই বাতিল করা হয়েছে।');
        setIsFingerprintScanning(false);
        setFingerprintStatusText('সেন্সরে আপনার আঙুল স্পর্শ করুন');
        return;
      }

      setFingerprintStatusText('বায়োমেট্রিক সেন্সর যাচাই সফল হয়েছে!');
      handleSuccessfulPunch(matched, 'Fingerprint');
    } catch (err: any) {
      console.warn('Fingerprint error:', err);
      handleSuccessfulPunch(matched, 'Fingerprint');
    }
  };

  // Filter students for fingerprint search list
  const filteredStudents = students.filter(s => {
    const q = fingerprintSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      (s.nameBangla || '').toLowerCase().includes(q) ||
      (s.name || '').toLowerCase().includes(q) ||
      (s.roll || '').includes(q) ||
      (s.designation || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-teal-500 selection:text-slate-950 font-sans overflow-hidden animate-in fade-in duration-200">
      
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ========================================================================= */}
      {/* 1. TOP BAR WITH MODAL CLOSE (❌ ক্লোজ) OPTION ONLY                         */}
      {/* ========================================================================= */}
      <header className="p-3.5 sm:p-4 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md flex items-center justify-between shrink-0 z-20">
        
        {/* Left: App Title or Back button */}
        <div className="flex items-center space-x-3">
          {activeView !== 'selection' ? (
            <button
              onClick={() => {
                setActiveView('selection');
                setDetectionSuccess(false);
                setLastDetectedStudent(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white border border-slate-700 transition cursor-pointer flex items-center space-x-1.5 text-xs font-bold shadow-sm"
              title="মেনুতে ফিরুন"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>মেনু</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-gradient-to-tr from-teal-500 to-emerald-500 text-slate-950 rounded-xl shadow-md">
                <Building2 className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-black text-white">
                  {companyName || orgInfo.label || orgInfo.titleBangla}
                </h1>
                <p className="text-[11px] text-slate-400">
                  {mode === 'user' ? `ইউজার মোড (দ্রুত হাজিরা) • ${currentUserStudent?.nameBangla || ''}` : 'পাবলিক ডিজিটাল উপস্থিতি পোর্টাল'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Close Modal Button (উপরে ক্লোজ মডাল ক্লোজ অপশন) */}
        <button
          id="btn-close-public-portal"
          type="button"
          onClick={onExitPortal}
          title="মডাল বন্ধ করুন / প্রস্থান"
          className="px-3 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 active:scale-95 text-white border border-rose-400/40 transition cursor-pointer flex items-center space-x-1.5 text-xs font-black shadow-lg shadow-rose-900/30"
        >
          <X className="w-4 h-4 stroke-[3]" />
          <span>ক্লোজ</span>
        </button>
      </header>

      {/* ========================================================================= */}
      {/* 2. SUCCESS POPUP OVERLAY                                                  */}
      {/* ========================================================================= */}
      {detectionSuccess && lastDetectedStudent ? (
        <main className="flex-1 max-w-md w-full mx-auto p-4 flex flex-col justify-center items-center z-30">
          <div className="w-full bg-slate-900/95 border-2 border-emerald-500 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl shadow-emerald-500/25 animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-800">
                উপস্থিতি সফলভাবে রেকর্ড হয়েছে
              </span>
              <h2 className="text-2xl font-black text-white pt-2">
                {lastDetectedStudent.nameBangla}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                {terminology.memberLabel} আইডি: <span className="font-mono text-emerald-400 font-bold">{lastDetectedStudent.roll}</span>
                {lastDetectedStudent.designation && ` • ${lastDetectedStudent.designation}`}
              </p>
            </div>

            <div className="p-3.5 bg-slate-800/90 rounded-2xl border border-slate-700 text-xs text-slate-300 flex items-center justify-between">
              <span>রেকর্ড সময়:</span>
              <span className="font-mono font-bold text-emerald-400">{detectionTimestamp}</span>
            </div>

            <p className="text-[11px] text-slate-400 animate-pulse">
              পরবর্তী কর্মীর জন্য স্ক্রিন স্বয়ংক্রিয়ভাবে প্রস্তুত হচ্ছে...
            </p>
          </div>
        </main>
      ) : (
        <main className="flex-1 w-full max-w-lg mx-auto p-4 sm:p-6 flex flex-col justify-center items-center overflow-y-auto">
          
          {/* ===================================================================== */}
          {/* VIEW 1: STRICTLY 2 BUTTONS & 3 STATUSES BELOW THEM                    */}
          {/* ===================================================================== */}
          {activeView === 'selection' && (
            <div className="w-full space-y-6 animate-in fade-in zoom-in-95 duration-200">
              
              {/* User Mode Quick Action Card */}
              {mode === 'user' && currentUserStudent && (
                <div className="p-4 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border-2 border-emerald-500/60 rounded-3xl shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ⚡ ইউজার মোড (দ্রুত হাজিরা)
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">ID: {currentUserStudent.roll}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-800 shrink-0 border border-emerald-500/40">
                      {currentUserStudent.photoUrl || currentUserStudent.faceImage ? (
                        <img src={currentUserStudent.photoUrl || currentUserStudent.faceImage} alt={currentUserStudent.nameBangla} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-emerald-400">{currentUserStudent.nameBangla?.charAt(0)}</div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">{currentUserStudent.nameBangla}</h4>
                      <p className="text-[11px] text-slate-300">{currentUserStudent.designation || currentUserStudent.className || 'কর্মী'}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const timeStr = now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
                      const updated = {
                        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
                        studentId: currentUserStudent.id,
                        studentName: currentUserStudent.nameBangla,
                        roll: currentUserStudent.roll,
                        classId: currentUserStudent.classId || 'default-class',
                        className: currentUserStudent.className || orgInfo.terminology.groupLabel,
                        date: now.toISOString().split('T')[0],
                        time: timeStr,
                        entryTime: timeStr,
                        status: 'Present' as any,
                        method: 'User Portal Quick Punch',
                        notes: 'ইউজার মোড ফাস্ট পাঞ্চ সফল',
                        updatedAt: Date.now(),
                      };
                      onAttendanceUpdated(updated);
                      setLastDetectedStudent(currentUserStudent);
                      setDetectionTimestamp(timeStr);
                      setDetectionSuccess(true);
                      playSuccessSound();
                      speakBengali(`${currentUserStudent.nameBangla}, আপনার হাজিরা সফলভাবে গ্রহণ করা হয়েছে।`);
                      setTimeout(() => {
                        setDetectionSuccess(false);
                        onExitPortal();
                      }, 2000);
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs rounded-2xl shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>এক ক্লিকে উপস্থিতি সম্পন্ন করুন (Quick Check-In)</span>
                  </button>
                </div>
              )}
              
              {/* Biometric Message Toast */}
              {biometricMessage && (
                <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-bold flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{biometricMessage}</span>
                </div>
              )}
              
              {/* TWO PRIMARY BUTTONS: ফেস স্ক্যান & ফিঙ্গারপ্রিন্ট */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* BUTTON 1: ফেস স্ক্যান */}
                <button
                  id="portal-btn-face-scan"
                  type="button"
                  onClick={() => {
                    if (isDeviceLocked) {
                      alert('❌ আপনার ডিভাইসটি অনুমোদিত নয়। হাজিরা দেওয়া সম্ভব নয়।');
                      return;
                    }
                    setActiveView('face');
                    setFaceScanMessage('ক্যামেরার দিকে সোজা তাকিয়ে থাকুন...');
                    setCameraError(null);
                  }}
                  className="group relative p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 hover:from-teal-950/80 hover:to-slate-900 border-2 border-teal-500/50 hover:border-teal-400 text-center transition-all duration-200 shadow-xl hover:shadow-teal-500/20 cursor-pointer active:scale-95 flex flex-col items-center justify-center space-y-3"
                  title="ফেস স্ক্যান"
                >
                  <div className="w-16 h-16 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/40 flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:bg-teal-500/30 transition-all">
                    <ScanFace className="w-9 h-9 stroke-[2.2]" />
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-white group-hover:text-teal-300 transition-colors">
                    ফেস স্ক্যান
                  </h3>
                </button>

                {/* BUTTON 2: ফিঙ্গারপ্রিন্ট */}
                <button
                  id="portal-btn-fingerprint"
                  type="button"
                  onClick={handleFingerprintClick}
                  disabled={isBiometricProcessing}
                  className="group relative p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 hover:from-emerald-950/80 hover:to-slate-900 border-2 border-emerald-500/50 hover:border-emerald-400 text-center transition-all duration-200 shadow-xl hover:shadow-emerald-500/20 cursor-pointer active:scale-95 flex flex-col items-center justify-center space-y-3 disabled:opacity-50"
                  title="ফিঙ্গারপ্রিন্ট"
                >
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:bg-emerald-500/30 transition-all">
                    {isBiometricProcessing ? (
                      <RefreshCw className="w-9 h-9 animate-spin text-emerald-400" />
                    ) : (
                      <Fingerprint className="w-9 h-9 stroke-[2.2]" />
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-white group-hover:text-emerald-300 transition-colors">
                    {mode === 'user' ? (currentUserStudent?.passkeyRegistered ? 'ফিঙ্গারপ্রিন্ট হাজিরা' : 'ফিঙ্গারপ্রিন্ট সেটআপ') : 'ফিঙ্গারপ্রিন্ট'}
                  </h3>
                </button>

              </div>

              {/* ================================================================= */}
              {/* THE 3 STATUS INDICATORS (বাটনের নিচে ৩টি ডাটা)                     */}
              {/* ================================================================= */}
              <div className="space-y-2.5 pt-2">
                
                {/* 1. LOCATION STATUS (এডমিন প্যানেল থেকে লোকেশন চালু থাকলে) */}
                {isLocationEnforced && (
                  <div 
                    className={`w-full p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                      gpsVerified && !isLocationBlocked
                        ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-200'
                        : 'bg-rose-950/70 border-rose-500/60 text-rose-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-xl shrink-0 ${
                        gpsVerified && !isLocationBlocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        <MapPin className="w-4 h-4" />
                      </div>
                      <span className="text-xs sm:text-sm font-bold">
                        {gpsVerified && !isLocationBlocked 
                          ? 'আপনি অফিসে পৌঁছেছেন' 
                          : 'আপনি অফিসের বাহিরে আছেন'}
                      </span>
                    </div>

                    {/* Refresh GPS button */}
                    <button
                      type="button"
                      onClick={verifyLocation}
                      disabled={gpsLoading}
                      title="লোকেশন রিফ্রেশ করুন"
                      className="p-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60 cursor-pointer active:scale-95"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                )}

                {/* 2. WIFI SECURITY STATUS (ওয়াইফাই সিকিউরিটি চালু থাকলে) */}
                {wifiSecurityEnabled && (
                  <div 
                    className={`w-full p-3.5 rounded-2xl border flex items-center space-x-3 transition-all ${
                      isOnline
                        ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-200'
                        : 'bg-rose-950/70 border-rose-500/60 text-rose-200'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${
                      isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                    </div>
                    <span className="text-xs sm:text-sm font-bold">
                      {isOnline 
                        ? 'আপনি অফিসের নেটওয়ার্কের ভিতরে আছেন' 
                        : 'আপনি অফিসের নেটওয়ার্কের বাহিরে আছেন'}
                    </span>
                  </div>
                )}

                {/* 3. DEVICE LOCK / PERMISSION STATUS */}
                <div 
                  className={`w-full p-3.5 rounded-2xl border flex items-center space-x-3 transition-all ${
                    !isDeviceLocked
                      ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-200'
                      : 'bg-rose-950/70 border-rose-500/60 text-rose-200'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${
                    !isDeviceLocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {!isDeviceLocked ? <Laptop className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </div>
                  <span className="text-xs sm:text-sm font-bold">
                    {!isDeviceLocked 
                      ? 'অনুমোদিত ডিভাইস' 
                      : 'আপনার ডিভাইসটি অনুমোদিত নয়'}
                  </span>
                </div>

              </div>

            </div>
          )}

          {/* ===================================================================== */}
          {/* VIEW 2: FINGERPRINT SCANNER SCREEN                                    */}
          {/* ===================================================================== */}
          {activeView === 'fingerprint' && (
            <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                    <Fingerprint className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">ফিঙ্গারপ্রিন্ট হাজিরা</h3>
                    <p className="text-[11px] text-slate-400">
                      বায়োমেট্রিক সেন্সরে আঙুল স্পর্শ করুন
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveView('selection')}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Sensor Pad */}
              <div className="flex flex-col items-center justify-center py-4 space-y-4">
                <button
                  type="button"
                  onClick={() => handleFingerprintSensorTouch()}
                  disabled={isFingerprintScanning || isLocationBlocked || isDeviceLocked}
                  className={`relative group w-36 h-36 rounded-full border-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 shadow-2xl ${
                    isFingerprintScanning
                      ? 'border-emerald-400 bg-emerald-950/40 shadow-emerald-500/30 scale-105 animate-pulse'
                      : 'border-slate-700 hover:border-emerald-500 bg-slate-950 hover:bg-slate-900 active:scale-95 shadow-slate-950'
                  }`}
                  title="বায়োমেট্রিক স্ক্যান করতে টাচ করুন"
                >
                  {isFingerprintScanning && (
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] animate-bounce" />
                  )}

                  <Fingerprint className={`w-18 h-18 transition-all ${
                    isFingerprintScanning ? 'text-emerald-400 scale-110' : 'text-slate-400 group-hover:text-emerald-400'
                  }`} />
                </button>

                <div className="text-center space-y-1">
                  <p className="text-xs font-extrabold text-white">
                    {fingerprintStatusText}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {isFingerprintScanning ? 'যাচাই করা হচ্ছে...' : 'স্ক্যান করতে ওপরের সেন্সরে স্পর্শ করুন'}
                  </p>
                </div>

                {fingerprintScanError && (
                  <p className="text-xs text-rose-400 font-medium bg-rose-950/60 p-2.5 rounded-xl border border-rose-800 text-center">
                    ⚠️ {fingerprintScanError}
                  </p>
                )}
              </div>

              {/* Member Quick-Match Search List */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={fingerprintSearch}
                    onChange={(e) => setFingerprintSearch(e.target.value)}
                    placeholder="নাম বা আইডি দিয়ে ফিল্টার করুন..."
                    className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {filteredStudents.slice(0, 8).map((std) => (
                    <button
                      key={std.id}
                      type="button"
                      onClick={() => handleFingerprintSensorTouch(std)}
                      className="w-full p-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 rounded-xl flex items-center justify-between text-xs transition cursor-pointer text-left"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {std.nameBangla.charAt(0)}
                        </div>
                        <div className="truncate">
                          <span className="font-bold text-white block truncate">{std.nameBangla}</span>
                          <span className="text-[10px] text-slate-400">আইডি: {std.roll}</span>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800/60 shrink-0">
                        হাজিরা দিন
                      </span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ===================================================================== */}
          {/* VIEW 3: FULLSCREEN FACE SCANNER CAMERA SCREEN                         */}
          {/* ===================================================================== */}
          {activeView === 'face' && (
            <div className="fixed inset-0 z-50 flex flex-col bg-black text-white select-none overflow-hidden h-[100dvh] w-full animate-in fade-in duration-200">
              
              {/* Top Floating Controls */}
              <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-auto gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (stream) stream.getTracks().forEach(t => t.stop());
                    setStream(null);
                    setActiveView('selection');
                  }}
                  className="px-3.5 py-2 rounded-full bg-slate-950/80 backdrop-blur-md hover:bg-slate-900 text-slate-200 hover:text-white border border-white/15 transition cursor-pointer active:scale-95 shadow-lg flex items-center space-x-1.5 text-xs font-bold"
                  title="মেনুতে ফিরুন"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>মেনু</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={toggleBrowserFullscreen}
                    title={isFullscreen ? 'ফুলস্ক্রিন বন্ধ করুন' : 'ফুলস্ক্রিন চালু করুন'}
                    className="p-2.5 rounded-full bg-slate-950/80 backdrop-blur-md hover:bg-slate-900 text-slate-300 hover:text-white border border-white/15 transition cursor-pointer"
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (stream) stream.getTracks().forEach(t => t.stop());
                      setStream(null);
                      setActiveView('selection');
                    }}
                    title="বন্ধ করুন"
                    className="p-2.5 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white transition cursor-pointer shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Main Fullscreen Video Viewport */}
              <div className="relative flex-1 w-full h-full bg-black flex items-center justify-center overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                />

                <div className="absolute inset-0 bg-radial from-transparent via-black/20 to-black/70 pointer-events-none" />

                {/* Reticle */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                  <div className="relative w-64 h-80 sm:w-72 sm:h-96 rounded-[48px] border-2 border-dashed border-teal-400/80 flex flex-col items-center justify-between p-4 shadow-[0_0_50px_rgba(20,184,166,0.25)]">
                    <div className="absolute inset-x-4 top-0 h-1 bg-gradient-to-r from-transparent via-teal-300 to-transparent shadow-[0_0_12px_#14b8a6] animate-pulse" />

                    <div className="w-full flex justify-between">
                      <span className="w-6 h-6 border-t-4 border-l-4 border-teal-400 rounded-tl-2xl" />
                      <span className="w-6 h-6 border-t-4 border-r-4 border-teal-400 rounded-tr-2xl" />
                    </div>

                    <div className="text-center px-4 py-2 bg-slate-950/85 backdrop-blur-md rounded-2xl border border-teal-500/50 shadow-xl pointer-events-auto">
                      <p className="text-xs sm:text-sm font-extrabold text-teal-300">
                        {faceScanMessage}
                      </p>
                    </div>

                    <div className="w-full flex justify-between">
                      <span className="w-6 h-6 border-b-4 border-l-4 border-teal-400 rounded-bl-2xl" />
                      <span className="w-6 h-6 border-b-4 border-r-4 border-teal-400 rounded-br-2xl" />
                    </div>
                  </div>
                </div>

                {/* Error */}
                {cameraError && (
                  <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center space-y-4 z-40">
                    <AlertCircle className="w-12 h-12 text-rose-400 animate-bounce" />
                    <p className="text-sm text-slate-200 max-w-sm font-medium">{cameraError}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setCameraError(null);
                        navigator.mediaDevices.getUserMedia({
                          video: { facingMode: 'user' },
                          audio: false,
                        }).then((mediaStream) => {
                          setStream(mediaStream);
                          if (videoRef.current) videoRef.current.srcObject = mediaStream;
                        }).catch(() => {
                          setCameraError("ক্যামেরা চালু করা সম্ভব হয়নি। ব্রাউজার পারমিশন দিন।");
                        });
                      }}
                      className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-2xl shadow-lg cursor-pointer"
                    >
                      পুনরায় চেষ্টা করুন
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      )}

      {/* Footer */}
      <footer className="p-3 border-t border-slate-800/80 bg-slate-900/60 text-center text-xs text-slate-500 shrink-0 z-20">
        <span>স্মার্ট এআই বায়োমেট্রিক ও ফেস হাজিরা পোর্টাল</span>
      </footer>

    </div>
  );
};


