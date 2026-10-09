import React, { useRef, useState, useEffect } from 'react';
import { Student, ClassSubject, AttendanceRecord } from '../types';
import { identifyStudentFromCamera, speakBengaliAttendance, speakBengaliAlreadyAttended } from '../utils/faceMatching';
import { saveAttendanceRecord, getStoredAttendance } from '../utils/storage';
import { OrgCategoryInfo } from '../utils/organizationConfig';
import { getStoredScheduleSettings, getCurrentActiveShift } from '../utils/scheduleConfig';
import { Camera, CheckCircle2, RefreshCw, X, Sparkles, Volume2, ShieldCheck, UserCheck, Info, Layers } from 'lucide-react';

interface KioskModeProps {
  classes: ClassSubject[];
  students: Student[];
  onExitKiosk: () => void;
  onAttendanceUpdated: (record: AttendanceRecord) => void;
  soundEnabled: boolean;
  orgInfo: OrgCategoryInfo;
}

const ATTENDANCE_COOLDOWN_MS = 5 * 60 * 1000;

export const KioskMode: React.FC<KioskModeProps> = ({
  classes,
  students,
  onExitKiosk,
  onAttendanceUpdated,
  soundEnabled,
  orgInfo,
}) => {
  const { terminology } = orgInfo;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Map to track the timestamp of recent attendance per student
  const recentAttendanceMap = useRef<{ [studentId: string]: { timestamp: number; timeStr: string } }>({});
  const lastAlertTimestampMap = useRef<{ [studentId: string]: number }>({});

  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [lastDetectedStudent, setLastDetectedStudent] = useState<Student | null>(null);
  const [isAlreadyAttended, setIsAlreadyAttended] = useState<boolean>(false);
  const [detectionTimestamp, setDetectionTimestamp] = useState<string>('');
  const [detectedCountToday, setDetectedCountToday] = useState<number>(0);

  const classStudents = students.filter(s => s.classId === selectedClassId);

  // Prepopulate recentAttendanceMap from stored records of today on mount
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const records = getStoredAttendance();
    const todayRecords = records.filter(r => r.date === todayStr);
    todayRecords.forEach(r => {
      if (!recentAttendanceMap.current[r.studentId]) {
        recentAttendanceMap.current[r.studentId] = {
          timestamp: Date.now() - 60000,
          timeStr: r.time || '',
        };
      }
    });
  }, []);

  // Play audio feedback
  const playSuccessSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {
      // Audio fallback
    }
  };

  // Start Camera Stream
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    const initCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false,
        });
        activeStream = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Kiosk camera error:", err);
      }
    };

    initCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Continuous Auto Scan Loop every 3.2 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || isScanning || classStudents.length === 0) return;

      setIsScanning(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const snapshot = canvas.toDataURL('image/jpeg', 0.8);

        const scanResult = await identifyStudentFromCamera(classStudents, snapshot);

        if (scanResult.matchedStudent) {
          const matched = scanResult.matchedStudent;
          const now = new Date();
          const currentTimeMs = Date.now();
          const timeStr = now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const dateStr = now.toISOString().split('T')[0];

          // Check 5-Minute Cooldown
          const lastRecordInfo = recentAttendanceMap.current[matched.id];
          const hasRecent = lastRecordInfo && (currentTimeMs - lastRecordInfo.timestamp < ATTENDANCE_COOLDOWN_MS);

          if (hasRecent) {
            // Already attended within 5 minutes
            const lastAlert = lastAlertTimestampMap.current[matched.id] || 0;
            if (currentTimeMs - lastAlert > 8000) {
              speakBengaliAlreadyAttended(matched.nameBangla);
              lastAlertTimestampMap.current[matched.id] = currentTimeMs;
            }

            setLastDetectedStudent(matched);
            setIsAlreadyAttended(true);
            setDetectionTimestamp(lastRecordInfo.timeStr || timeStr);
          } else {
            // Fresh attendance recording
            recentAttendanceMap.current[matched.id] = {
              timestamp: currentTimeMs,
              timeStr: timeStr,
            };
            lastAlertTimestampMap.current[matched.id] = currentTimeMs;

            setLastDetectedStudent(matched);
            setIsAlreadyAttended(false);
            setDetectionTimestamp(timeStr);
            setDetectedCountToday(prev => prev + 1);
            playSuccessSound();
            speakBengaliAttendance(matched.nameBangla);

            const record = saveAttendanceRecord({
              studentId: matched.id,
              studentName: matched.nameBangla,
              roll: matched.roll,
              classId: selectedClassId,
              className: classes.find(c => c.id === selectedClassId)?.classNameBangla || '',
              date: dateStr,
              time: timeStr,
              status: scanResult.status,
              method: 'Self Kiosk',
              confidenceScore: scanResult.confidence,
              snapshotUrl: snapshot,
              verifiedByAI: true,
              notes: `প্রবেশদ্বারে অটোমেটিক ফেস কিওস্ক চিহ্নিতকরণ`,
            });

            onAttendanceUpdated(record);
          }
        }
      }
      setIsScanning(false);
    }, 3200);

    return () => clearInterval(interval);
  }, [classStudents, selectedClassId, isScanning]);

  const selectedClass = classes.find(c => c.id === selectedClassId);

  return (
    <div className="min-h-[85vh] bg-slate-950 text-white rounded-3xl p-6 border border-slate-800 shadow-2xl flex flex-col justify-between space-y-6">
      
      {/* Kiosk Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              {terminology.roleKioskMode} (প্রবেশদ্বার অটোনোমাস ক্যামেরা)
            </h2>
            <p className="text-xs text-slate-400">
              {terminology.scannerHint}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Department Select */}
          <select
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs font-bold text-emerald-300 rounded-2xl px-3 py-2 focus:outline-none"
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                {c.classNameBangla} ({c.subjectName})
              </option>
            ))}
          </select>

          <button
            onClick={onExitKiosk}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-2xl transition-colors border border-slate-700 flex items-center space-x-1"
          >
            <X className="w-4 h-4" />
            <span>প্রস্থান</span>
          </button>
        </div>
      </div>

      {/* Main Kiosk Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 items-center">
        
        {/* Camera Viewport (2 Columns) */}
        <div className="lg:col-span-2 relative aspect-video bg-slate-900 rounded-3xl overflow-hidden border-2 border-slate-800 shadow-inner flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Target Reticle */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className={`w-56 h-72 rounded-3xl border-2 border-dashed transition-all duration-300 flex items-center justify-center ${
              lastDetectedStudent ? 'border-emerald-400 bg-emerald-500/10' : 'border-emerald-500/50'
            }`}>
              <div className="text-xs font-bold text-emerald-400 bg-slate-950/80 px-4 py-1.5 rounded-full border border-emerald-500/30 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                <span>স্বয়ংক্রিয় ফেস স্ক্যানার সক্রিয় (৫ মিনিটে ১ বার)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Realtime Attendance Result Side Panel */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-5 flex flex-col justify-between h-full">
          <div>
            <h3 className="text-sm font-bold text-slate-300 border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>সর্বশেষ উপস্থিত {terminology.memberLabel}</span>
              <span className="text-xs font-normal text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full">
                আজ মোট: {detectedCountToday} জন
              </span>
            </h3>

            {lastDetectedStudent ? (
              <div className={`mt-4 bg-slate-950 p-4 rounded-2xl border text-center space-y-3 animate-in zoom-in-95 duration-200 ${
                isAlreadyAttended ? 'border-amber-500/50' : 'border-emerald-500/40'
              }`}>
                <div className={`w-24 h-24 rounded-2xl overflow-hidden mx-auto border-2 shadow-lg ${
                  isAlreadyAttended ? 'border-amber-400 shadow-amber-500/20' : 'border-emerald-500 shadow-emerald-500/20'
                }`}>
                  <img src={lastDetectedStudent.photoUrl} alt={lastDetectedStudent.nameBangla} className="w-full h-full object-cover" />
                </div>

                <div>
                  <h4 className={`text-lg font-bold ${isAlreadyAttended ? 'text-amber-300' : 'text-emerald-300'}`}>
                    {lastDetectedStudent.nameBangla}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    {terminology.idLabel}: {lastDetectedStudent.roll} | {lastDetectedStudent.className}
                  </p>
                  <div className="mt-2 flex justify-center">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                      <Layers className="w-3 h-3 text-emerald-400" />
                      <span>{getCurrentActiveShift(getStoredScheduleSettings(), new Date())?.nameBangla || 'ডে শিফট'}</span>
                    </span>
                  </div>
                </div>

                {isAlreadyAttended ? (
                  <div className="bg-amber-950/80 text-amber-300 font-bold text-xs py-2 px-3 rounded-xl border border-amber-500/40 flex items-center justify-center space-x-1.5">
                    <Info className="w-4 h-4 text-amber-400" />
                    <span>হাজিরা ইতিমধ্যে গ্রহণ করা হয়েছে ({detectionTimestamp})</span>
                  </div>
                ) : (
                  <div className="bg-emerald-950/80 text-emerald-300 font-bold text-xs py-2 px-3 rounded-xl border border-emerald-500/30 flex items-center justify-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>উপস্থিতি সফল! ({detectionTimestamp})</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-8 text-center text-slate-500 space-y-2">
                <Camera className="w-12 h-12 mx-auto text-slate-700" />
                <p className="text-xs">ক্যামেরার সামনে মুখমণ্ডল আনলেই স্বয়ংক্রিয়ভাবে হাজিরা রেকর্ড হবে</p>
              </div>
            )}
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80 text-[11px] text-slate-400 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>নিরাপদ বায়োমেট্রিক সিস্টেম ডাটা অন-ডিভাইসে যাচাইকৃত</span>
          </div>

        </div>

      </div>

    </div>
  );
};
