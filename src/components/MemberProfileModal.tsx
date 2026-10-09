import React, { useState, useRef, useEffect } from 'react';
import { Student, ClassSubject, AttendanceRecord, OrganizationScheduleSettings } from '../types';
import { OrgCategoryInfo } from '../utils/organizationConfig';
import { isFaceActuallyRegistered, speakBengaliAttendance } from '../utils/faceMatching';
import { getStoredScheduleSettings } from '../utils/scheduleConfig';
import { extractFaceBiometrics } from '../utils/faceBiometrics';
import {
  X,
  Camera,
  CheckCircle2,
  AlertTriangle,
  User,
  Phone,
  Mail,
  Building,
  Calendar,
  Trash2,
  Save,
  Sparkles,
  Zap,
  RefreshCw,
  Clock,
  ShieldCheck,
  Check,
  Smartphone
} from 'lucide-react';

interface MemberProfileModalProps {
  isOpen?: boolean;
  onClose: () => void;
  student: Student | null;
  classes: ClassSubject[];
  orgInfo: OrgCategoryInfo;
  scheduleSettings?: OrganizationScheduleSettings;
  onSaveMember?: (updatedStudent: Student) => void;
  onUpdateStudent?: (updatedStudent: Student) => void;
  onDeleteMember?: (studentId: string) => void;
  attendanceRecords?: AttendanceRecord[];
}

export const MemberProfileModal: React.FC<MemberProfileModalProps> = ({
  isOpen = true,
  onClose,
  student,
  classes,
  orgInfo,
  scheduleSettings,
  onSaveMember,
  onUpdateStudent,
  onDeleteMember,
  attendanceRecords = []
}) => {
  const { terminology } = orgInfo;
  const activeSettings = scheduleSettings || getStoredScheduleSettings();

  const notifySave = (updated: Student) => {
    if (onSaveMember) {
      onSaveMember(updated);
    } else if (onUpdateStudent) {
      onUpdateStudent(updated);
    }
  };

  // Form States
  const [nameBangla, setNameBangla] = useState('');
  const [nameEnglish, setNameEnglish] = useState('');
  const [roll, setRoll] = useState('');
  const [classId, setClassId] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [shiftId, setShiftId] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [faceRegistered, setFaceRegistered] = useState(false);
  const [faceImage, setFaceImage] = useState<string>('');

  // Camera & Face Enrollment state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (student) {
      setNameBangla(student.nameBangla || student.name || '');
      setNameEnglish(student.nameEnglish || '');
      setRoll(student.roll || '');
      setClassId(student.classId || classes[0]?.id || '');
      setDesignation(student.designation || '');
      setDepartment(student.department || '');
      setPhone(student.guardianPhone || student.parentPhone || '');
      setEmail(student.email || '');
      setShiftId(student.preferredShiftId || activeSettings.shifts[0]?.id || '');
      setPhotoUrl(student.photoUrl || '');
      
      const hasFace = isFaceActuallyRegistered(student);
      setFaceRegistered(hasFace);
      setFaceImage(hasFace ? (student.faceImage || student.photoUrl || '') : '');
      setIsCameraActive(false);
      setSaveSuccessMessage(null);
    }
  }, [student, classes]);

  // Clean up camera stream when modal closes
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  if (!isOpen || !student) return null;

  // Web Audio Tone
  const playChime = (success = true) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = success ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(success ? 880 : 330, ctx.currentTime);
        if (success) {
          osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
        }
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch {
      // Audio fallback
    }
  };

  // Start mobile front camera
  const handleStartCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'user' },
          width: { ideal: 640 },
          height: { ideal: 640 }
        },
        audio: false
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.setAttribute('muted', 'true');
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Initial camera failed, trying fallback:', err);
      try {
        const streamFallback = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        setCameraStream(streamFallback);
        if (videoRef.current) {
          videoRef.current.srcObject = streamFallback;
          videoRef.current.play().catch(() => {});
        }
      } catch (fallbackErr) {
        setCameraError('ক্যামেরা চালু করা সম্ভব হয়নি। ডিভাইসে ক্যামেরা পারমিশন এলাউ (Allow) আছে কিনা চেক করুন।');
        setIsCameraActive(false);
      }
    }
  };

  const handleStopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  // Capture face photo from mobile camera and register immediately
  const handleCaptureAndSaveFace = () => {
    if (!videoRef.current) return;
    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement('canvas');
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 640;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw frame
        ctx.drawImage(video, 0, 0, width, height);
        const capturedDataUrl = canvas.toDataURL('image/jpeg', 0.88);

        setFaceImage(capturedDataUrl);
        setPhotoUrl(capturedDataUrl);
        setFaceRegistered(true);

        // Stop camera stream
        handleStopCamera();

        // Audio & Speech
        playChime(true);
        if ('speechSynthesis' in window) {
          try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(`${nameBangla} এর ফেস ডাটা সফলভাবে সংরক্ষিত হয়েছে`);
            utterance.lang = 'bn-BD';
            utterance.rate = 1.0;
            window.speechSynthesis.speak(utterance);
          } catch {
            // Speech fallback
          }
        }

        // Auto save to database with biometric descriptor and code
        const selectedClass = classes.find(c => c.id === classId);
        extractFaceBiometrics(capturedDataUrl).then((bio) => {
          const updatedStudent: Student = {
            ...student,
            nameBangla: nameBangla.trim(),
            name: nameBangla.trim(),
            nameEnglish: nameEnglish.trim() || undefined,
            roll: roll.trim(),
            classId: classId || student.classId,
            className: selectedClass ? selectedClass.classNameBangla : student.className,
            designation: designation.trim() || undefined,
            department: department.trim() || undefined,
            guardianPhone: phone.trim() || '01700000000',
            parentPhone: phone.trim() || undefined,
            email: email.trim() || undefined,
            preferredShiftId: shiftId || undefined,
            photoUrl: capturedDataUrl,
            faceImage: capturedDataUrl,
            faceRegistered: true,
            faceDescriptor: bio.descriptor,
            faceBiometricCode: bio.biometricCode,
          };
          notifySave(updatedStudent);
          setSaveSuccessMessage(`🎉 ফেস ছবি ও বায়োমেট্রিক কোড [${bio.biometricCode}] সফলভাবে সংরক্ষিত হয়েছে!`);
          setTimeout(() => setSaveSuccessMessage(null), 4000);
        }).catch(() => {
          const updatedStudent: Student = {
            ...student,
            nameBangla: nameBangla.trim(),
            name: nameBangla.trim(),
            nameEnglish: nameEnglish.trim() || undefined,
            roll: roll.trim(),
            classId: classId || student.classId,
            className: selectedClass ? selectedClass.classNameBangla : student.className,
            designation: designation.trim() || undefined,
            department: department.trim() || undefined,
            guardianPhone: phone.trim() || '01700000000',
            parentPhone: phone.trim() || undefined,
            email: email.trim() || undefined,
            preferredShiftId: shiftId || undefined,
            photoUrl: capturedDataUrl,
            faceImage: capturedDataUrl,
            faceRegistered: true,
          };
          notifySave(updatedStudent);
          setSaveSuccessMessage('🎉 ফেস ছবি ও ডাটা সফলভাবে মোবাইল থেকে সংরক্ষিত হয়েছে!');
          setTimeout(() => setSaveSuccessMessage(null), 4000);
        });
      }
    } catch (e) {
      console.error('Face capture error:', e);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRemoveFace = () => {
    setFaceRegistered(false);
    setFaceImage('');
    const defaultPlaceholder = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" fill="%23334155"/><circle cx="80" cy="65" r="32" fill="%2394a3b8"/><text x="80" y="145" font-size="14" font-family="sans-serif" text-anchor="middle" fill="white">${encodeURIComponent(nameBangla || 'সদস্য')}</text></svg>`;
    setPhotoUrl(defaultPlaceholder);

    const updatedStudent: Student = {
      ...student,
      faceRegistered: false,
      faceImage: undefined,
      photoUrl: defaultPlaceholder
    };
    notifySave(updatedStudent);
    playChime(false);
    setSaveSuccessMessage('ফেস ডাটা সফলভাবে মুছে ফেলা হয়েছে।');
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameBangla.trim() || !roll.trim()) {
      alert(`অনুগ্রহ করে নাম এবং ${terminology.idLabel} দিন।`);
      return;
    }

    const selectedClass = classes.find(c => c.id === classId);
    const updatedStudent: Student = {
      ...student,
      nameBangla: nameBangla.trim(),
      name: nameBangla.trim(),
      nameEnglish: nameEnglish.trim() || undefined,
      roll: roll.trim(),
      classId: classId || student.classId,
      className: selectedClass ? selectedClass.classNameBangla : student.className,
      designation: designation.trim() || undefined,
      department: department.trim() || undefined,
      guardianPhone: phone.trim() || '01700000000',
      parentPhone: phone.trim() || undefined,
      email: email.trim() || undefined,
      preferredShiftId: shiftId || undefined,
      photoUrl: photoUrl || student.photoUrl,
      faceImage: faceImage || student.faceImage,
      faceRegistered: faceRegistered
    };

    notifySave(updatedStudent);
    playChime(true);
    setSaveSuccessMessage('সদস্যের তথ্য সফলভাবে আপডেট হয়েছে!');
    setTimeout(() => {
      setSaveSuccessMessage(null);
      onClose();
    }, 1000);
  };

  // Recent attendance for this student
  const memberAttendance = attendanceRecords.filter(r => r.studentId === student.id);
  const totalPunches = memberAttendance.length;
  const recentPunch = memberAttendance[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-400">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                <span>{nameBangla || 'সদস্য প্রোফাইল'}</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-emerald-400">
                  #{roll}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {terminology.memberLabel} প্রোফাইল বিবরণ ও মোবাইল ফেস এনরোলমেন্ট
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              handleStopCamera();
              onClose();
            }}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Toast */}
        {saveSuccessMessage && (
          <div className="p-3 bg-emerald-500 text-slate-950 text-xs font-black text-center flex items-center justify-center space-x-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
            <span>{saveSuccessMessage}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="p-4 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* PRIMARY SECTION: FACE REGISTRATION & CAMERA (User Goal) */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-4 sm:p-5 border border-slate-700 text-white space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <Camera className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-sm text-white flex items-center gap-2">
                    <span>মোবাইল ফেস হাজিরা ডাটা</span>
                    {faceRegistered ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>সক্রিয় ও সংরক্ষিত</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        <span>ফেস ছবি বাকি</span>
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    মোবাইলের ফ্রন্ট ক্যামেরা দিয়ে কর্মীর ছবি তুললেই স্বয়ংক্রিয়ভাবে ফেস হাজিরা গ্রহণ করা হবে
                  </p>
                </div>
              </div>
            </div>

            {/* Active Camera Viewfinder or Face Preview */}
            {isCameraActive ? (
              <div className="space-y-3">
                <div className="relative w-full max-w-sm mx-auto aspect-square bg-black rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-xl">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  {/* Oval Face Guide Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-60 border-2 border-dashed border-emerald-400/80 rounded-[50%] shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] flex items-center justify-center">
                      <span className="text-[11px] font-bold text-white bg-slate-900/80 px-2 py-0.5 rounded-md mt-44">
                        মুখ সোজা রাখুন
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-3 pt-1">
                  <button
                    type="button"
                    onClick={handleStopCamera}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    ক্যামেরা বন্ধ করুন
                  </button>
                  <button
                    type="button"
                    disabled={isCapturing}
                    onClick={handleCaptureAndSaveFace}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-500/30 flex items-center space-x-2 transition cursor-pointer"
                  >
                    <Camera className="w-4 h-4 stroke-[2.5]" />
                    <span>{isCapturing ? 'সংরক্ষণ হচ্ছে...' : 'ছবি তুলুন ও ফেস সেভ করুন'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700">
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-700 border-2 border-emerald-500/40 shrink-0 shadow-md">
                  {faceImage || photoUrl ? (
                    <img
                      src={faceImage || photoUrl}
                      alt={nameBangla}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                      <User className="w-8 h-8" />
                      <span className="text-[9px] mt-1">ছবি নেই</span>
                    </div>
                  )}
                  {faceRegistered && (
                    <span className="absolute bottom-1 right-1 p-1 bg-emerald-500 rounded-full text-slate-950 shadow-md">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>

                <div className="space-y-2 flex-1 text-center sm:text-left">
                  <div>
                    <h4 className="font-bold text-xs text-white">
                      {faceRegistered ? 'ফেস ডাটা সক্রিয় ও হাজিরা নিতে প্রস্তুত' : 'ফেস ডাটা এখনও সংরক্ষণ করা হয়নি'}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {faceRegistered
                        ? 'এই কর্মীর ছবি ফ্রেমের ভেতরে আসলে স্বয়ংক্রিয়ভাবে হাজিরা রেকর্ড করা হবে।'
                        : 'মোবাইলের ক্যামেরা দিয়ে ১ ক্লিকেই ফেস ছবি তুলুন ও ডাটাবেজে সংরক্ষণ করুন।'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
                    <button
                      type="button"
                      onClick={handleStartCamera}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-500/20 transition cursor-pointer"
                    >
                      <Camera className="w-4 h-4 stroke-[2.5]" />
                      <span>{faceRegistered ? 'নতুন ফেস ছবি স্ক্যান করুন' : 'মোবাইল ক্যামেরা দিয়ে ফেস স্ক্যান করুন'}</span>
                    </button>

                    {faceRegistered && (
                      <button
                        type="button"
                        onClick={handleRemoveFace}
                        className="px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        ফেস মুছুন
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {cameraError && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-bold flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}
          </div>

          {/* SECTION: MEMBER DETAILS & SHIFT ASSIGNMENT */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              সদস্যের সাধারণ তথ্য ও শিফট নির্ধারণ
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Name Bangla */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  নাম (বাংলায়) *
                </label>
                <input
                  type="text"
                  required
                  value={nameBangla}
                  onChange={(e) => setNameBangla(e.target.value)}
                  placeholder="যেমন: মোঃ কামরুল হাসান"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-emerald-500 font-medium"
                />
              </div>

              {/* ID / Roll */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {terminology.idLabel} / রোল নম্বর *
                </label>
                <input
                  type="text"
                  required
                  value={roll}
                  onChange={(e) => setRoll(e.target.value)}
                  placeholder="যেমন: EMP-101"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-emerald-500 font-mono font-bold"
                />
              </div>

              {/* Assigned Shift (কয়টা থেকে কয়টা) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>নির্ধারিত কর্ম শিফট</span>
                  <Clock className="w-3.5 h-3.5 text-emerald-500" />
                </label>
                <select
                  value={shiftId}
                  onChange={(e) => setShiftId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-emerald-500 font-medium cursor-pointer"
                >
                  {activeSettings.shifts.map(shift => (
                    <option key={shift.id} value={shift.id}>
                      {shift.nameBangla} ({shift.startTime} - {shift.endTime})
                    </option>
                  ))}
                </select>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  মোবাইল নম্বর
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="যেমন: 01700000000"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-emerald-500 font-mono"
                />
              </div>

            </div>
          </div>

          {/* Quick Attendance Stats */}
          {totalPunches > 0 && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-emerald-900 dark:text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="font-bold">মোট হাজিরা রেকর্ড: {totalPunches} দিন</span>
              </div>
              {recentPunch && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  সর্বশেষ: {recentPunch.date} ({recentPunch.time})
                </span>
              )}
            </div>
          )}

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
            <div>
              {onDeleteMember && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`আপনি কি "${nameBangla}" এর প্রোফাইল মুছে ফেলতে চান?`)) {
                      handleStopCamera();
                      onDeleteMember(student.id);
                      onClose();
                    }
                  }}
                  className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition cursor-pointer flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>সদস্য মুছুন</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2.5">
              <button
                type="button"
                onClick={() => {
                  handleStopCamera();
                  onClose();
                }}
                className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center space-x-1.5 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>পরিবর্তন সংরক্ষণ করুন</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
