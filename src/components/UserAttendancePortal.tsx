import React, { useRef, useState, useEffect } from 'react';
import { Student, ClassSubject, AttendanceRecord, OrganizationScheduleSettings } from '../types';
import { identifyStudentFromCamera, isFaceActuallyRegistered } from '../utils/faceMatching';
import { OrgCategoryInfo } from '../utils/organizationConfig';
import { getStoredScheduleSettings, calculateDistanceMeters } from '../utils/scheduleConfig';
import { triggerMobileFingerprintPrompt } from '../utils/mobileBiometrics';
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
  Fingerprint,
  ScanFace,
  ChevronLeft,
  Sparkles,
  Wifi,
  WifiOff,
  Lock,
  Maximize2,
  Minimize2,
  Smartphone,
  Check
} from 'lucide-react';

interface UserAttendancePortalProps {
  student: Student;
  classes: ClassSubject[];
  onExitPortal: () => void;
  onAttendanceUpdated: (record: AttendanceRecord) => void;
  soundEnabled: boolean;
  orgInfo: OrgCategoryInfo;
  companyName?: string;
  enforceGeofence?: boolean;
  scheduleSettings?: OrganizationScheduleSettings;
  onUpdateStudent?: (student: Student) => void;
}

export const UserAttendancePortal: React.FC<UserAttendancePortalProps> = ({
  student,
  classes,
  onExitPortal,
  onAttendanceUpdated,
  soundEnabled,
  orgInfo,
  companyName,
  enforceGeofence = false,
  scheduleSettings: propScheduleSettings,
  onUpdateStudent,
}) => {
  const { terminology } = orgInfo;

  const [activeView, setActiveView] = useState<'selection' | 'fingerprint' | 'face'>('selection');
  const [isBiometricProcessing, setIsBiometricProcessing] = useState<boolean>(false);
  const [biometricMessage, setBiometricMessage] = useState<string | null>(null);

  // Success Overlay State
  const [detectionSuccess, setDetectionSuccess] = useState<boolean>(false);
  const [detectionTimestamp, setDetectionTimestamp] = useState<string>('');

  // Audio & Speech
  const playSuccessSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {}
  };

  const speakBengali = (text: string) => {
    if (!soundEnabled) return;
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'bn-BD';
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch {}
  };

  // Location / Geofence State
  const scheduleSettings = propScheduleSettings || getStoredScheduleSettings();
  const geofence = scheduleSettings.geofence;
  const isLocationEnforced = enforceGeofence || Boolean(geofence?.enforceGeofence);

  const [gpsVerified, setGpsVerified] = useState<boolean>(!isLocationEnforced);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);

  const verifyLocation = () => {
    if (!isLocationEnforced) {
      setGpsVerified(true);
      return;
    }
    setGpsLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLoading(false);
          const userLat = pos.coords.latitude;
          const userLng = pos.coords.longitude;
          const officeLat = geofence?.latitude || 23.8103;
          const officeLng = geofence?.longitude || 90.4125;
          const radius = geofence?.radiusMeters || 100;

          const dist = calculateDistanceMeters(userLat, userLng, officeLat, officeLng);
          setDistanceMeters(Math.round(dist));

          if (dist <= radius) {
            setGpsVerified(true);
          } else {
            setGpsVerified(false);
          }
        },
        (err) => {
          setGpsLoading(false);
          setGpsVerified(true);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      setGpsLoading(false);
      setGpsVerified(true);
    }
  };

  useEffect(() => {
    verifyLocation();
  }, []);

  const isDeviceLocked = student?.isDeviceLocked === true;

  // Fingerprint / Biometric Click Handler
  const handleFingerprintClick = async () => {
    if (isDeviceLocked) {
      alert('❌ আপনার ডিভাইসটি অনুমোদিত নয়। হাজিরা দেওয়া সম্ভব নয়।');
      return;
    }

    if (isLocationEnforced && !gpsVerified) {
      alert('⚠️ অফিস লোকেশন যাচাই করা যায়নি। দয়া করে লোকেশন অন করুন এবং রিফ্রেশ করুন।');
      verifyLocation();
      return;
    }

    setIsBiometricProcessing(true);
    setBiometricMessage(null);

    // Trigger native mobile fingerprint / biometric prompt
    const result = await triggerMobileFingerprintPrompt(student.nameBangla, student.id);
    setIsBiometricProcessing(false);

    if (result.success) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
      const updated = {
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        studentId: student.id,
        studentName: student.nameBangla,
        roll: student.roll,
        classId: student.classId || 'default-class',
        className: student.className || orgInfo.terminology.groupLabel,
        date: now.toISOString().split('T')[0],
        time: timeStr,
        entryTime: timeStr,
        status: 'Present' as any,
        method: 'User Portal Mobile Fingerprint',
        notes: 'ইউজার মোড বায়োমেট্রিক ফিঙ্গারপ্রিন্ট সফল',
        updatedAt: Date.now(),
      };
      onAttendanceUpdated(updated);
      setDetectionTimestamp(timeStr);
      setDetectionSuccess(true);
      playSuccessSound();
      speakBengali(`${student.nameBangla}, আপনার ফিঙ্গারপ্রিন্ট হাজিরা সফলভাবে গ্রহণ করা হয়েছে।`);
      setTimeout(() => {
        setDetectionSuccess(false);
        onExitPortal();
      }, 2000);
    } else {
      setBiometricMessage(result.error || 'বায়োমেট্রিক ফিঙ্গারপ্রিন্ট যাচাই ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।');
    }
  };

  // Face Scan Camera State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [faceScanMessage, setFaceScanMessage] = useState<string>('ক্যামেরার দিকে সোজা তাকিয়ে থাকুন...');

  const startCamera = async () => {
    setActiveView('face');
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (err) {
      setFaceScanMessage('ক্যামেরা পারমিশন পাওয়া যায়নি বা ব্রাউজার ব্লক করেছে।');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    setActiveView('selection');
  };

  useEffect(() => {
    let interval: any = null;
    if (activeView === 'face' && stream) {
      interval = setInterval(() => {
        if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (video.videoWidth === 0 || video.videoHeight === 0) return;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = canvas.toDataURL('image/jpeg', 0.85);

            const checkFace = async () => {
              const matched = await identifyStudentFromCamera(imageData, [student]);
              if (matched && matched.matchedStudent) {
                clearInterval(interval);
                stopCamera();
                const now = new Date();
                const timeStr = now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
                const updated = {
                  id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
                  studentId: student.id,
                  studentName: student.nameBangla,
                  roll: student.roll,
                  classId: student.classId || 'default-class',
                  className: student.className || orgInfo.terminology.groupLabel,
                  date: now.toISOString().split('T')[0],
                  time: timeStr,
                  entryTime: timeStr,
                  status: 'Present' as any,
                  method: 'User Portal AI Face Scan',
                  notes: 'ইউজার মোড ফেস স্ক্যান সফল',
                  updatedAt: Date.now(),
                };
                onAttendanceUpdated(updated);
                setDetectionTimestamp(timeStr);
                setDetectionSuccess(true);
                playSuccessSound();
                speakBengali(`${student.nameBangla}, আপনার ফেস স্ক্যান হাজিরা সফলভাবে গ্রহণ করা হয়েছে।`);
                setTimeout(() => {
                  setDetectionSuccess(false);
                  onExitPortal();
                }, 2000);
              }
            };
            checkFace();
          }
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeView, stream, student]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col font-sans select-none overflow-hidden h-[100dvh]">
      
      {/* Top Header */}
      <header className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-gradient-to-tr from-teal-500 to-emerald-500 text-slate-950 rounded-xl shadow-md">
            <Building2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white">
              {companyName || orgInfo.label || orgInfo.titleBangla}
            </h1>
            <p className="text-[11px] text-emerald-400 font-bold">
              ⚡ ইউজার মোড (দ্রুত হাজিরা) • {student.nameBangla}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            stopCamera();
            onExitPortal();
          }}
          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white transition cursor-pointer flex items-center space-x-1.5 text-xs font-black shadow-lg"
        >
          <X className="w-4 h-4" />
          <span>ক্লোজ</span>
        </button>
      </header>

      {/* Main Container */}
      {detectionSuccess ? (
        <main className="flex-1 max-w-md w-full mx-auto p-4 flex flex-col justify-center items-center z-30">
          <div className="w-full bg-slate-900 border-2 border-emerald-500 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl shadow-emerald-500/25 animate-in zoom-in-95">
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-800">
                উপস্থিতি সফলভাবে রেকর্ড হয়েছে
              </span>
              <h2 className="text-2xl font-black text-white pt-2">
                {student.nameBangla}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                {terminology.memberLabel} আইডি: <span className="font-mono text-emerald-400 font-bold">{student.roll}</span>
              </p>
            </div>

            <div className="p-3.5 bg-slate-800 rounded-2xl border border-slate-700 text-xs text-slate-300 flex items-center justify-between">
              <span>রেকর্ড সময়:</span>
              <span className="font-mono font-bold text-emerald-400">{detectionTimestamp}</span>
            </div>
          </div>
        </main>
      ) : activeView === 'face' ? (
        <main className="relative flex-1 w-full bg-black flex flex-col items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
          />
          <canvas ref={canvasRef} className="hidden" />

          <div className="absolute top-4 left-4 z-20">
            <button
              type="button"
              onClick={stopCamera}
              className="px-3.5 py-2 rounded-full bg-slate-950/80 text-white border border-white/20 text-xs font-bold flex items-center space-x-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>ফিরে যান</span>
            </button>
          </div>

          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
            <div className="relative w-64 h-80 sm:w-72 sm:h-96 rounded-[48px] border-2 border-dashed border-teal-400 flex flex-col items-center justify-between p-4 shadow-[0_0_50px_rgba(20,184,166,0.25)] animate-pulse">
              <span className="text-xs font-bold bg-teal-950/80 text-teal-300 px-3 py-1 rounded-full border border-teal-500/50">
                {faceScanMessage}
              </span>
            </div>
          </div>
        </main>
      ) : (
        <main className="flex-1 w-full max-w-lg mx-auto p-4 sm:p-6 flex flex-col justify-center items-center overflow-y-auto space-y-6">
          
          {/* User Info Card */}
          <div className="w-full p-4 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border-2 border-emerald-500/60 rounded-3xl shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ⚡ ইউজার মোড (দ্রুত হাজিরা পোর্টাল)
              </span>
              <span className="text-[10px] font-mono text-emerald-400">ID: {student.roll}</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-800 shrink-0 border border-emerald-500/40">
                {student.photoUrl || student.faceImage ? (
                  <img src={student.photoUrl || student.faceImage} alt={student.nameBangla} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-emerald-400">{student.nameBangla?.charAt(0)}</div>
                )}
              </div>
              <div>
                <h4 className="text-sm font-black text-white">{student.nameBangla}</h4>
                <p className="text-[11px] text-slate-300">{student.designation || student.className || 'কর্মী'}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const timeStr = now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
                const updated = {
                  id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
                  studentId: student.id,
                  studentName: student.nameBangla,
                  roll: student.roll,
                  classId: student.classId || 'default-class',
                  className: student.className || orgInfo.terminology.groupLabel,
                  date: now.toISOString().split('T')[0],
                  time: timeStr,
                  entryTime: timeStr,
                  status: 'Present' as any,
                  method: 'User Portal Quick Punch',
                  notes: 'ইউজার মোড ফাস্ট পাঞ্চ সফল',
                  updatedAt: Date.now(),
                };
                onAttendanceUpdated(updated);
                setDetectionTimestamp(timeStr);
                setDetectionSuccess(true);
                playSuccessSound();
                speakBengali(`${student.nameBangla}, আপনার হাজিরা সফলভাবে গ্রহণ করা হয়েছে।`);
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

          {/* Biometric Message Toast */}
          {biometricMessage && (
            <div className="w-full p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-bold flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{biometricMessage}</span>
            </div>
          )}

          {/* Two Primary Action Buttons */}
          <div className="w-full grid grid-cols-2 gap-4">
            
            {/* Button 1: Face Scan */}
            <button
              type="button"
              onClick={startCamera}
              className="group relative p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 hover:from-teal-950/80 hover:to-slate-900 border-2 border-teal-500/50 hover:border-teal-400 text-center transition-all duration-200 shadow-xl cursor-pointer active:scale-95 flex flex-col items-center justify-center space-y-3"
            >
              <div className="w-16 h-16 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/40 flex items-center justify-center shadow-inner group-hover:scale-110 transition-all">
                <ScanFace className="w-9 h-9 stroke-[2.2]" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-white group-hover:text-teal-300 transition-colors">
                ফেস স্ক্যান
              </h3>
            </button>

            {/* Button 2: Fingerprint / Biometric */}
            <button
              type="button"
              onClick={handleFingerprintClick}
              disabled={isBiometricProcessing}
              className="group relative p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 hover:from-emerald-950/80 hover:to-slate-900 border-2 border-emerald-500/50 hover:border-emerald-400 text-center transition-all duration-200 shadow-xl cursor-pointer active:scale-95 flex flex-col items-center justify-center space-y-3 disabled:opacity-50"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-inner group-hover:scale-110 transition-all">
                {isBiometricProcessing ? (
                  <RefreshCw className="w-9 h-9 animate-spin text-emerald-400" />
                ) : (
                  <Fingerprint className="w-9 h-9 stroke-[2.2]" />
                )}
              </div>
              <h3 className="text-base sm:text-lg font-black text-white group-hover:text-emerald-300 transition-colors">
                ফিঙ্গারপ্রিন্ট
              </h3>
            </button>

          </div>

          {/* Status indicators */}
          <div className="w-full space-y-2.5">
            {isLocationEnforced && (
              <div className={`w-full p-3.5 rounded-2xl border flex items-center justify-between ${
                gpsVerified ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-200' : 'bg-rose-950/70 border-rose-500/60 text-rose-200'
              }`}>
                <div className="flex items-center space-x-3">
                  <MapPin className="w-4 h-4" />
                  <span className="text-xs font-bold">{gpsVerified ? 'আপনি অফিসের সীমানার মধ্যে আছেন' : 'আপনি অফিসের বাহিরে আছেন'}</span>
                </div>
                <button type="button" onClick={verifyLocation} className="p-1.5 rounded-lg bg-slate-900 border border-slate-700">
                  <RefreshCw className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            )}
          </div>

        </main>
      )}

    </div>
  );
};
