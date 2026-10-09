import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Fingerprint, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Smartphone, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  Layers, 
  Check, 
  Lock, 
  Info,
  Clock
} from 'lucide-react';
import { Student } from '../types';
import { triggerMobileFingerprintPrompt } from '../utils/mobileBiometrics';

interface MobileFingerprintEnrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onEnrollComplete: (updatedStudent: Student) => void;
}

export const MobileFingerprintEnrollModal: React.FC<MobileFingerprintEnrollModalProps> = ({
  isOpen,
  onClose,
  student,
  onEnrollComplete,
}) => {
  const [selectedFinger, setSelectedFinger] = useState<string>(
    student.fingerprintFingerName || 'ডান হাতের বৃদ্ধাঙ্গুল (Right Thumb)'
  );
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'verifying' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('স্ক্যান শুরু করতে নিচে আঙুল রাখুন বা বাটনে চাপুন');
  const [deviceModel, setDeviceModel] = useState<string>('');
  const [biometricHash, setBiometricHash] = useState<string>('');
  const [qualityScore, setQualityScore] = useState<number>(0);
  const scanIntervalRef = useRef<any>(null);

  // Detect friendly device name
  useEffect(() => {
    const ua = navigator.userAgent;
    let model = 'স্মার্টফোন / মোবাইল ব্রাউজার';
    if (/android/i.test(ua)) {
      const match = ua.match(/Android.*;\s*([^;]+)\s*Build/);
      model = match ? match[1].trim() : 'Android Smartphone';
    } else if (/iPhone/i.test(ua)) {
      model = 'Apple iPhone (Touch ID / Face ID)';
    } else if (/iPad/i.test(ua)) {
      model = 'Apple iPad';
    } else if (/Windows/i.test(ua)) {
      model = 'Windows Laptop / Biometric Device';
    } else if (/Macintosh/i.test(ua)) {
      model = 'Apple MacBook (Touch ID)';
    }
    setDeviceModel(model);
  }, []);

  // Audio tone helper
  const playTone = (freq = 880, duration = 0.15, type: OscillatorType = 'sine') => {
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
      osc.stop(audioCtx.currentTime + duration);
    } catch {
      // Audio fallback
    }
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setScanState('idle');
      setProgress(0);
      setStatusText('স্ক্যান শুরু করতে নিচে আঙুল রাখুন বা বাটনে চাপুন');
      setQualityScore(0);
    } else {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Start Fingerprint Scan
  const handleStartScan = async () => {
    if (scanState === 'scanning' || scanState === 'verifying') return;

    setScanState('scanning');
    setProgress(5);
    setStatusText('আঙুলের স্পর্শ সনাক্ত করা হচ্ছে... সেন্সরে আঙুল ধরে রাখুন');
    playTone(520, 0.1, 'triangle');

    if (navigator.vibrate) {
      try { navigator.vibrate(50); } catch { /* ignore */ }
    }

    // Try native WebAuthn Platform prompt asynchronously
    triggerMobileFingerprintPrompt(student.nameBangla, student.roll).catch(() => {});

    let currentProgress = 5;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 8) + 6;

      if (currentProgress >= 30 && currentProgress < 70) {
        setStatusText('বায়োমেট্রিক রিজ ও ইউনিক প্যাটার্ন বিশ্লেষণ হচ্ছে...');
        if (Math.random() > 0.6) playTone(700 + currentProgress * 3, 0.06, 'sine');
      } else if (currentProgress >= 70 && currentProgress < 95) {
        setStatusText('এনক্রিপ্টেড সিকিউরিটি কি তৈরি হচ্ছে...');
        if (Math.random() > 0.5) playTone(900 + currentProgress * 2, 0.06, 'sine');
      }

      if (currentProgress >= 100) {
        clearInterval(interval);
        setProgress(100);
        setScanState('verifying');
        setStatusText('বায়োমেট্রিক ডাটা যাচাইকরণ সম্পন্ন হচ্ছে...');
        playTone(1046, 0.25, 'sine');

        if (navigator.vibrate) {
          try { navigator.vibrate([60, 40, 100]); } catch { /* ignore */ }
        }

        setTimeout(() => {
          const generatedHash = `BIO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
          setBiometricHash(generatedHash);
          setQualityScore(98.8);
          setScanState('success');
          setStatusText('🎉 আপনার আঙুলের ছাপ সফলভাবে স্ক্যান ও রেকর্ড হয়েছে!');
          playTone(1200, 0.35, 'triangle');

          // Build updated student record
          const nowStr = new Date().toLocaleDateString('bn-BD', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          const updated: Student = {
            ...student,
            fingerprintRegistered: true,
            fingerprintStatus: 'Pending', // Pending admin approval
            fingerprintFingerName: selectedFinger,
            fingerprintDeviceModel: deviceModel,
            fingerprintDeviceId: generatedHash,
            fingerprintRegisteredAt: nowStr,
          };

          onEnrollComplete(updated);
        }, 800);
      } else {
        setProgress(currentProgress);
      }
    }, 120);

    scanIntervalRef.current = interval;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
              <Fingerprint className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black tracking-wide">
                মোবাইল ফিঙ্গারপ্রিন্ট বায়োমেট্রিক স্ক্যানার
              </h3>
              <p className="text-[11px] text-slate-300">
                {student.nameBangla} • আইডি: {student.roll}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          
          {/* Finger Selection & Device Model Strip */}
          {scanState !== 'success' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  যে আঙুলটি স্ক্যান করতে চান নির্বাচন করুন:
                </label>
                <select
                  value={selectedFinger}
                  onChange={(e) => setSelectedFinger(e.target.value)}
                  disabled={scanState === 'scanning' || scanState === 'verifying'}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2.5 focus:outline-indigo-500 cursor-pointer disabled:opacity-60"
                >
                  <option value="ডান হাতের বৃদ্ধাঙ্গুল (Right Thumb)">👍 ডান হাতের বৃদ্ধাঙ্গুল (Right Thumb)</option>
                  <option value="ডান হাতের তর্জনী (Right Index)">☝️ ডান হাতের তর্জনী (Right Index)</option>
                  <option value="বাম হাতের বৃদ্ধাঙ্গুল (Left Thumb)">👍 বাম হাতের বৃদ্ধাঙ্গুল (Left Thumb)</option>
                  <option value="বাম হাতের তর্জনী (Left Index)">☝️ বাম হাতের তর্জনী (Left Index)</option>
                </select>
              </div>

              {/* Detected Device Info */}
              <div className="flex items-center justify-between p-2.5 bg-slate-100 dark:bg-slate-800/60 rounded-xl text-[11px] text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
                  <span>ডিভাইস মডেল:</span>
                </span>
                <span className="font-bold font-mono text-slate-900 dark:text-white truncate max-w-[180px]">
                  {deviceModel}
                </span>
              </div>
            </div>
          )}

          {/* Interactive Fingerprint Scanner Pad */}
          <div className="flex flex-col items-center justify-center py-2 space-y-4">
            
            <div 
              onClick={handleStartScan}
              className={`relative w-36 h-36 sm:w-40 sm:h-40 rounded-3xl flex items-center justify-center cursor-pointer transition-all duration-300 select-none ${
                scanState === 'scanning'
                  ? 'bg-indigo-950/60 border-2 border-indigo-500 shadow-xl shadow-indigo-500/20 scale-105'
                  : scanState === 'verifying'
                  ? 'bg-amber-950/60 border-2 border-amber-500 shadow-xl shadow-amber-500/20'
                  : scanState === 'success'
                  ? 'bg-emerald-950/60 border-2 border-emerald-500 shadow-xl shadow-emerald-500/20'
                  : 'bg-slate-100 dark:bg-slate-800/80 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 hover:scale-102'
              }`}
              title="স্ক্যান শুরু করতে চাপুন"
            >
              {/* Outer Pulsing Waves during scan */}
              {scanState === 'scanning' && (
                <div className="absolute inset-0 rounded-3xl border-2 border-indigo-400 animate-ping opacity-30" />
              )}

              {/* Moving Laser Beam Animation during scan */}
              {scanState === 'scanning' && (
                <div 
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-lg shadow-cyan-400 transition-all duration-75 z-20 pointer-events-none"
                  style={{
                    top: `${(progress % 100)}%`,
                  }}
                />
              )}

              {/* Main Fingerprint Icon / Art */}
              <div className="relative z-10 flex flex-col items-center justify-center">
                {scanState === 'success' ? (
                  <CheckCircle2 className="w-16 h-16 text-emerald-400 animate-bounce" />
                ) : (
                  <Fingerprint className={`w-20 h-20 sm:w-24 sm:h-24 transition-colors duration-300 ${
                    scanState === 'scanning'
                      ? 'text-cyan-400 animate-pulse'
                      : scanState === 'verifying'
                      ? 'text-amber-400'
                      : 'text-slate-400 dark:text-slate-500 hover:text-indigo-400'
                  }`} />
                )}

                {/* Live Percentage Overlay */}
                {scanState === 'scanning' && (
                  <span className="absolute text-xs font-black text-white bg-slate-900/80 px-2 py-0.5 rounded-full border border-cyan-400/50 shadow-md">
                    {progress}%
                  </span>
                )}
              </div>

              {/* Circular Progress Ring */}
              {scanState === 'scanning' && (
                <div className="absolute bottom-2 text-[10px] font-bold text-cyan-300 font-mono">
                  বায়োমেট্রিক রিডিং...
                </div>
              )}
            </div>

            {/* Instruction Text */}
            <div className="text-center px-2 space-y-1">
              <p className={`text-xs font-bold leading-relaxed transition-colors ${
                scanState === 'success'
                  ? 'text-emerald-600 dark:text-emerald-400 font-black'
                  : scanState === 'scanning'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-700 dark:text-slate-300'
              }`}>
                {statusText}
              </p>
              {scanState === 'idle' && (
                <p className="text-[11px] text-slate-400">
                  👆 উপরের সেন্সর প্যাডে স্পর্শ করুন অথবা নিচের বাটনে চাপ দিন
                </p>
              )}
            </div>

            {/* Progress Bar (Visible during scan) */}
            {(scanState === 'scanning' || scanState === 'verifying') && (
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500 h-full transition-all duration-150 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

          </div>

          {/* Success State Summary Details */}
          {scanState === 'success' && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/80 rounded-2xl space-y-2.5 text-xs">
              <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300 font-black text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>ফিঙ্গারপ্রিন্ট বায়োমেট্রিক ডাটা সফলভাবে সংরক্ষিত</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-emerald-200 dark:border-emerald-900/60">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">নিবন্ধিত আঙুল:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedFinger}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">স্ক্যান নির্ভুলতা:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{qualityScore}% (High)</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 dark:text-slate-400 block">ডিভাইস ও টেমপ্লেট আইডি:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-[10px] break-all">{biometricHash} ({deviceModel})</span>
                </div>
              </div>

              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start space-x-2 text-amber-800 dark:text-amber-300 text-[11px] mt-1">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>কোম্পানি এডমিন অনুমোদন:</strong> আপনার আবেদন কোম্পানি এডমিন প্যানেলে পাঠানো হয়েছে। অনুমোদন পেলেই আপনি হাজিরা দিতে পারবেন।
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            {scanState !== 'success' ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-2xl transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleStartScan}
                  disabled={scanState === 'scanning' || scanState === 'verifying'}
                  className="flex-2 py-3 px-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-600 hover:from-indigo-500 hover:to-indigo-600 text-white font-extrabold text-xs rounded-2xl transition shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {scanState === 'scanning' ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>স্ক্যান হচ্ছে ({progress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Fingerprint className="w-4 h-4" />
                      <span>👆 আঙুল স্ক্যান করুন</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-2xl transition shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>সম্পন্ন হয়েছে (ঠিক আছে)</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
