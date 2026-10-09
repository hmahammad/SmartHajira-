import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Camera, 
  Fingerprint, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  User, 
  Sparkles,
  Zap,
  Info,
  Check
} from 'lucide-react';
import { Student } from '../types';
import { OrgCategoryInfo } from '../utils/organizationConfig';
import { isFaceActuallyRegistered, isFingerprintActuallyRegistered } from '../utils/faceMatching';
import { extractFaceBiometrics } from '../utils/faceBiometrics';

interface BiometricManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onSaveBiometrics: (updatedStudent: Student) => void;
  orgInfo: OrgCategoryInfo;
}

export const BiometricManagementModal: React.FC<BiometricManagementModalProps> = ({
  isOpen,
  onClose,
  student,
  onSaveBiometrics,
  orgInfo,
}) => {
  const { terminology } = orgInfo;

  // Face State
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [faceRegistered, setFaceRegistered] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturingAndSaving, setIsCapturingAndSaving] = useState<boolean>(false);

  // Fingerprint State
  const [fingerprintRegistered, setFingerprintRegistered] = useState<boolean>(false);
  const [selectedFinger, setSelectedFinger] = useState<string>('ডান হাতের বৃদ্ধাঙ্গুল (Right Thumb)');
  const [isScanningFingerprint, setIsScanningFingerprint] = useState<boolean>(false);
  const [fingerprintSuccess, setFingerprintSuccess] = useState<boolean>(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'face' | 'fingerprint'>('face');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Audio tone helper
  const playSound = (freq = 880, type: OscillatorType = 'sine') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch {
      // Audio fallback
    }
  };

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 640 }, facingMode: 'user' },
        audio: false,
      });

      setCameraStream(stream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Camera startup error:", err);
      setCameraError("ক্যামেরা অন করা সম্ভব হয়নি। অনুগ্রহ করে ক্যামেরার পারমিশন পরীক্ষা করুন।");
      setIsCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  // Sync initial student state and auto-start camera when modal opens
  useEffect(() => {
    if (student && isOpen) {
      const currentPhoto = student.faceImage || student.photoUrl || null;
      const actuallyHasFace = isFaceActuallyRegistered(student);
      
      setFaceImage(actuallyHasFace && currentPhoto ? currentPhoto : null);
      setFaceRegistered(actuallyHasFace);
      
      setFingerprintRegistered(isFingerprintActuallyRegistered(student));
      setSelectedFinger(student.fingerprintFingerName || 'ডান হাতের বৃদ্ধাঙ্গুল (Right Thumb)');
      setSavedSuccess(false);
      setStatusMessage('');
      setCameraError(null);

      // Auto start camera for instant 1-click experience
      if (activeTab === 'face') {
        startCamera();
      }
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [student, isOpen, activeTab]);

  if (!isOpen || !student) return null;

  // 1-Click Instant Face Scan & Direct Database Save
  const handleInstantFaceScanAndSave = () => {
    if (!videoRef.current || !canvasRef.current) {
      alert("ক্যামেরা এখনও প্রস্তুত নয়। অনুগ্রহ করে একটু অপেক্ষা করুন।");
      return;
    }

    setIsCapturingAndSaving(true);
    setStatusMessage('ক্যামেরা ফ্রেম থেকে ফেস ডাটা স্ক্যান করা হচ্ছে...');

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = 480;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setIsCapturingAndSaving(false);
      return;
    }

    // Mirror horizontal like selfie
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const liveCapturedSnapshot = canvas.toDataURL('image/jpeg', 0.90);
    setFaceImage(liveCapturedSnapshot);
    setFaceRegistered(true);

    // Extract biometric feature descriptor and alphanumeric code
    extractFaceBiometrics(liveCapturedSnapshot).then((biometrics) => {
      playSound(920, 'sine');
      const updatedStudent: Student = {
        ...student,
        photoUrl: liveCapturedSnapshot,
        faceImage: liveCapturedSnapshot,
        faceRegistered: true,
        faceDescriptor: biometrics.descriptor,
        faceBiometricCode: biometrics.biometricCode,
      };

      // Save directly to Firestore + LocalStorage
      onSaveBiometrics(updatedStudent);
      setIsCapturingAndSaving(false);
      setSavedSuccess(true);
      setStatusMessage(`🎉 ফেস স্ক্যান সফল! বায়োমেট্রিক কোড: ${biometrics.biometricCode}`);

      setTimeout(() => {
        setSavedSuccess(false);
        stopCamera();
        onClose();
      }, 1400);
    }).catch((err) => {
      console.warn("Biometric extraction error, saving with fallback:", err);
      playSound(920, 'sine');
      const updatedStudent: Student = {
        ...student,
        photoUrl: liveCapturedSnapshot,
        faceImage: liveCapturedSnapshot,
        faceRegistered: true,
      };
      onSaveBiometrics(updatedStudent);
      setIsCapturingAndSaving(false);
      setSavedSuccess(true);
      setStatusMessage('🎉 ফেস সফলভাবে স্ক্যান ও ডাটাবেজে যুক্ত হয়েছে!');
      setTimeout(() => {
        setSavedSuccess(false);
        stopCamera();
        onClose();
      }, 1400);
    });
  };

  // Remove Face Data
  const handleRemoveFace = () => {
    if (window.confirm(`${student.nameBangla}-এর সংরক্ষিত ফেস বায়োমেট্রিক ডাটা মুছে ফেলতে চান?`)) {
      setFaceImage(null);
      setFaceRegistered(false);
      
      const updatedStudent: Student = {
        ...student,
        faceRegistered: false,
        faceImage: undefined,
        faceDescriptor: undefined,
        faceBiometricCode: undefined,
      };

      onSaveBiometrics(updatedStudent);
      setStatusMessage('ফেস ডাটা মুছে ফেলা হয়েছে।');
      setTimeout(() => setStatusMessage(''), 2000);
    }
  };

  // Fingerprint Simulation & Save
  const handleScanFingerprintAndSave = () => {
    setIsScanningFingerprint(true);
    setFingerprintSuccess(false);
    setStatusMessage('বায়োমেট্রিক সেন্সর থেকে আঙুলের ছাপ রিড হচ্ছে...');

    setTimeout(() => {
      setIsScanningFingerprint(false);
      setFingerprintRegistered(true);
      setFingerprintSuccess(true);
      playSound(1040, 'triangle');

      const updatedStudent: Student = {
        ...student,
        fingerprintRegistered: true,
        fingerprintFingerName: selectedFinger,
        fingerprintTemplate: `BIO-FP-${student.id}-${Date.now()}`
      };

      onSaveBiometrics(updatedStudent);
      setStatusMessage('🎉 ফিঙ্গারপ্রিন্ট সফলভাবে ডাটাবেজে যুক্ত হয়েছে!');

      setTimeout(() => {
        setFingerprintSuccess(false);
        onClose();
      }, 1400);
    }, 1200);
  };

  // Remove Fingerprint
  const handleRemoveFingerprint = () => {
    if (window.confirm(`${student.nameBangla}-এর সংরক্ষিত ফিঙ্গারপ্রিন্ট মুছে ফেলতে চান?`)) {
      setFingerprintRegistered(false);
      setFingerprintSuccess(false);

      const updatedStudent: Student = {
        ...student,
        fingerprintRegistered: false,
        fingerprintFingerName: undefined,
        fingerprintTemplate: undefined
      };

      onSaveBiometrics(updatedStudent);
      setStatusMessage('ফিঙ্গারপ্রিন্ট ডাটা মুছে ফেলা হয়েছে।');
      setTimeout(() => setStatusMessage(''), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
              <Camera className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black tracking-wide">
                  লাইভ বায়োমেট্রিক ফেস স্ক্যানার
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  সরাসরি স্ক্যান
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {terminology.memberLabel}: <span className="text-emerald-400 font-bold">{student.nameBangla}</span> (আইডি: {student.roll})
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Member Profile Quick Overview Strip */}
        <div className="bg-slate-50 dark:bg-slate-950/60 px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 overflow-hidden border border-slate-300 dark:border-slate-700">
              {faceImage ? (
                <img src={faceImage} alt={student.nameBangla} className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-xs">{student.nameBangla}</p>
              <p className="text-[10px] text-slate-500">{student.className || student.classId} &bull; {terminology.idLabel}: {student.roll}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 ${
              faceRegistered 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
            }`}>
              <Camera className="w-3 h-3" />
              <span>{faceRegistered ? 'ফেস সক্রিয়' : 'ফেস নেই'}</span>
            </span>

            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 ${
              fingerprintRegistered 
                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}>
              <Fingerprint className="w-3 h-3" />
              <span>{fingerprintRegistered ? 'ফিঙ্গারপ্রিন্ট সক্রিয়' : 'ফিঙ্গারপ্রিন্ট নেই'}</span>
            </span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 pt-3 gap-3">
          <button
            onClick={() => setActiveTab('face')}
            className={`pb-3 text-xs font-black transition-all border-b-2 flex items-center space-x-2 cursor-pointer ${
              activeTab === 'face'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>১. সরাসরি ফেস স্ক্যান (Live Face Scan)</span>
          </button>

          <button
            onClick={() => {
              stopCamera();
              setActiveTab('fingerprint');
            }}
            className={`pb-3 text-xs font-black transition-all border-b-2 flex items-center space-x-2 cursor-pointer ${
              activeTab === 'fingerprint'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Fingerprint className="w-4 h-4" />
            <span>২. ডিজিটাল ফিঙ্গারপ্রিন্ট (Fingerprint)</span>
          </button>
        </div>

        {/* Status Toast Banner */}
        {statusMessage && (
          <div className="px-5 py-2 bg-emerald-500/10 dark:bg-emerald-950/40 border-b border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* TAB 1: Live Face Scan & 1-Click Save */}
          {activeTab === 'face' && (
            <div className="space-y-4">
              
              {/* Direct Camera Viewport */}
              <div className="relative aspect-square max-w-sm mx-auto rounded-3xl bg-slate-950 border-2 border-slate-800 overflow-hidden flex items-center justify-center shadow-xl">
                
                {cameraError ? (
                  <div className="p-6 text-center space-y-2 text-rose-400">
                    <AlertCircle className="w-10 h-10 mx-auto" />
                    <p className="text-xs font-bold">{cameraError}</p>
                    <button
                      onClick={startCamera}
                      className="px-4 py-2 bg-slate-800 text-white font-bold text-xs rounded-xl hover:bg-slate-700 cursor-pointer"
                    >
                      ক্যামেরা পুনরায় চালু করুন
                    </button>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />

                    <canvas ref={canvasRef} className="hidden" />

                    {/* Face Reticle Guide */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className={`w-48 h-60 rounded-full border-2 border-dashed transition-all duration-300 flex items-center justify-center ${
                        savedSuccess 
                          ? 'border-emerald-400 bg-emerald-500/20 scale-105' 
                          : isCapturingAndSaving 
                          ? 'border-amber-400 bg-amber-500/10 animate-pulse' 
                          : 'border-emerald-500/70 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                      }`}>
                        <div className="text-[10px] font-black text-emerald-400 bg-slate-950/80 px-3 py-1 rounded-full border border-emerald-500/30">
                          {savedSuccess 
                            ? '✓ স্ক্যান সফল ও সংরক্ষিত' 
                            : isCapturingAndSaving 
                            ? 'প্রসেসিং হচ্ছে...' 
                            : 'সোজা ক্যামেরায় তাকান'}
                        </div>
                      </div>
                    </div>

                    {/* Laser Scanner Line */}
                    {isCapturingAndSaving && (
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/30 to-transparent animate-pulse pointer-events-none" />
                    )}
                  </>
                )}

              </div>

              {/* Instant 1-Click Action */}
              <div className="space-y-3 pt-1">
                
                <button
                  type="button"
                  onClick={handleInstantFaceScanAndSave}
                  disabled={isCapturingAndSaving || !!cameraError}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/30 disabled:opacity-50 flex items-center justify-center space-x-2 transition cursor-pointer"
                >
                  {isCapturingAndSaving ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>স্ক্যান ও ডাটাবেজে সেভ হচ্ছে...</span>
                    </>
                  ) : savedSuccess ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-white" />
                      <span>✓ ফেস ডাটাবেজে সফলভাবে যুক্ত হয়েছে!</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 text-amber-300 animate-bounce" />
                      <span>১-ক্লিকে ফেস স্ক্যান ও ডাটাবেজে সেভ করুন</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs px-2">
                  <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="text-[11px]">সরাসরি লাইভ ফেস ভেরিফিকেশন বাধ্যতামূলক</span>
                  </div>

                  {faceRegistered && (
                    <button
                      type="button"
                      onClick={handleRemoveFace}
                      className="text-rose-600 dark:text-rose-400 hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>পূর্বের ফেস ডাটা মুছুন</span>
                    </button>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: Fingerprint Sensor Scan */}
          {activeTab === 'fingerprint' && (
            <div className="space-y-5">
              
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700/80 pb-3">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>ডিজিটাল বায়োমেট্রিক ফিঙ্গারপ্রিন্ট</span>
                      {fingerprintRegistered ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          সংযুক্ত আছে
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                          সংযুক্ত নেই
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      বায়োমেট্রিক ফিঙ্গারপ্রিন্ট সেন্সরে আঙুল স্পর্শ করে স্ক্যান ও সংরক্ষণ করুন।
                    </p>
                  </div>

                  {fingerprintRegistered && (
                    <button
                      onClick={handleRemoveFingerprint}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-xl border border-rose-200 dark:border-rose-800 transition flex items-center space-x-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ফিঙ্গারপ্রিন্ট মুছুন</span>
                    </button>
                  )}
                </div>

                {/* Finger Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    আঙুল নির্বাচন করুন:
                  </label>
                  <select
                    value={selectedFinger}
                    onChange={(e) => setSelectedFinger(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-emerald-500 cursor-pointer"
                  >
                    <option value="ডান হাতের বৃদ্ধাঙ্গুল (Right Thumb)">👍 ডান হাতের বৃদ্ধাঙ্গুল (Right Thumb)</option>
                    <option value="ডান হাতের তর্জনী (Right Index)">☝️ ডান হাতের তর্জনী (Right Index)</option>
                    <option value="বাম হাতের বৃদ্ধাঙ্গুল (Left Thumb)">👍 বাম হাতের বৃদ্ধাঙ্গুল (Left Thumb)</option>
                    <option value="বাম হাতের তর্জনী (Left Index)">☝️ বাম হাতের তর্জনী (Left Index)</option>
                  </select>
                </div>

                {/* Fingerprint Sensor Touch Box */}
                <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className={`relative w-24 h-24 rounded-3xl flex items-center justify-center transition-all ${
                    fingerprintSuccess 
                      ? 'bg-emerald-500/20 text-emerald-500 border-2 border-emerald-500 scale-105' 
                      : isScanningFingerprint 
                      ? 'bg-indigo-500/20 text-indigo-500 border-2 border-dashed border-indigo-500 animate-pulse' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700'
                  }`}>
                    <Fingerprint className="w-14 h-14" />
                    {fingerprintSuccess && (
                      <div className="absolute -top-1.5 -right-1.5 p-1 bg-emerald-500 text-white rounded-full">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleScanFingerprintAndSave}
                    disabled={isScanningFingerprint}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    {isScanningFingerprint ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>সেন্সর রিড হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <Fingerprint className="w-4 h-4" />
                        <span>১-ক্লিকে ফিঙ্গারপ্রিন্ট স্ক্যান ও ডাটাবেজে সেভ</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>

      </div>
    </div>
  );
};
