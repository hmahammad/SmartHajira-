import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Student, AttendanceRecord, CameraScanResult, OrganizationScheduleSettings, GeofenceSettings } from '../types';
import {
  compareFaceWithStudent,
  identifyStudentFromCamera,
  speakBengaliAttendance,
  speakBengaliAlreadyAttended,
  isFaceActuallyRegistered
} from '../utils/faceMatching';
import { saveAttendanceRecord, getStoredAttendance } from '../utils/storage';
import { getStoredScheduleSettings, getCurrentActiveShift, calculateDistanceMeters } from '../utils/scheduleConfig';
import { OrgCategoryInfo } from '../utils/organizationConfig';
import {
  analyzeVideoFrameForFace,
  extractFaceImage,
  FaceFrameAnalysis
} from '../utils/faceDetectionEngine';
import {
  Camera,
  X,
  CheckCircle2,
  AlertTriangle,
  SwitchCamera,
  Sparkles,
  Volume2,
  UserCheck,
  Zap,
  Clock,
  ShieldCheck,
  AlertCircle,
  Info,
  Layers,
  MapPin,
  Radio,
  Compass,
  Lock,
  Unlock,
  RefreshCw,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface FaceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  selectedClassId: string;
  selectedClassName: string;
  onAttendanceUpdated: (newRecord: AttendanceRecord) => void;
  soundEnabled: boolean;
  orgInfo: OrgCategoryInfo;
  scheduleSettings?: OrganizationScheduleSettings;
  onOpenGeofenceModal?: () => void;
}

// 5 Minutes in Milliseconds
const ATTENDANCE_COOLDOWN_MS = 5 * 60 * 1000;

export const FaceScannerModal: React.FC<FaceScannerModalProps> = ({
  isOpen,
  onClose,
  students,
  selectedClassId,
  selectedClassName,
  onAttendanceUpdated,
  soundEnabled,
  orgInfo,
  scheduleSettings,
  onOpenGeofenceModal,
}) => {
  const { terminology } = orgInfo;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Active Schedule & Geofence Configuration
  const activeSettings = scheduleSettings || getStoredScheduleSettings();
  const geofence: GeofenceSettings = activeSettings.geofence;
  const isGeofenceEnforced = Boolean(geofence?.enforceGeofence);

  // GPS Geofence Verification State
  const [gpsState, setGpsState] = useState<{
    isLocating: boolean;
    isWithin: boolean;
    distanceMeters: number | null;
    error: string | null;
    userCoords: { lat: number; lng: number } | null;
    adminOverride: boolean;
  }>({
    isLocating: false,
    isWithin: !isGeofenceEnforced,
    distanceMeters: null,
    error: null,
    userCoords: null,
    adminOverride: false,
  });

  // Map to track the timestamp of recent attendance per student to enforce 5-minute cooldown
  const recentAttendanceMap = useRef<{ [studentId: string]: { timestamp: number; timeStr: string } }>({});
  const lastAlertTimestampMap = useRef<{ [studentId: string]: number }>({});

  const [stream, setStream] = useState<MediaStream | null>(null);
  const cameraFacing = 'user'; // Strictly Front/Selfie Camera (Back camera disabled)
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraStarting, setIsCameraStarting] = useState<boolean>(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
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

  // Auto-scanning state
  const [isProcessingMatch, setIsProcessingMatch] = useState<boolean>(false);
  const [lastMatchedStudent, setLastMatchedStudent] = useState<Student | null>(null);
  const [matchDetails, setMatchDetails] = useState<{
    time: string;
    date: string;
    confidence: number;
    snapshotUrl?: string;
    isAlreadyAttended?: boolean;
    remainingCooldownMins?: number;
  } | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [consecutiveReadyFrames, setConsecutiveReadyFrames] = useState<number>(0);

  // Real-time Face Detection Analysis State
  const [faceAnalysis, setFaceAnalysis] = useState<FaceFrameAnalysis>({
    hasFace: false,
    isReady: false,
    status: 'no_face',
    guidanceText: 'মুখমণ্ডল ফ্রেমের ভেতরে সোজা রাখুন',
    guidanceColor: 'red',
    confidence: 0,
  });

  const [scanFailureMessage, setScanFailureMessage] = useState<string | null>(null);
  const [showManualSelection, setShowManualSelection] = useState<boolean>(false);

  // Geofence Location Verification Function
  const checkLiveLocation = useCallback(() => {
    if (!isGeofenceEnforced) {
      setGpsState({
        isLocating: false,
        isWithin: true,
        distanceMeters: 0,
        error: null,
        userCoords: null,
        adminOverride: false,
      });
      return;
    }

    if (!('geolocation' in navigator)) {
      setGpsState(prev => ({
        ...prev,
        isLocating: false,
        isWithin: false,
        error: 'আপনার ডিভাইস বা ব্রাউজারে GPS লোকেশন সেবা সাপোর্ট করছে না।'
      }));
      return;
    }

    setGpsState(prev => ({ ...prev, isLocating: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const uLat = parseFloat(pos.coords.latitude.toFixed(6));
        const uLng = parseFloat(pos.coords.longitude.toFixed(6));
        const dist = Math.round(calculateDistanceMeters(uLat, uLng, geofence.latitude, geofence.longitude));
        const inside = dist <= geofence.radiusMeters;

        setGpsState({
          isLocating: false,
          isWithin: inside,
          distanceMeters: dist,
          error: null,
          userCoords: { lat: uLat, lng: uLng },
          adminOverride: false,
        });
      },
      (err) => {
        console.warn('Geofence check GPS error:', err);
        setGpsState(prev => ({
          ...prev,
          isLocating: false,
          isWithin: false,
          error: 'GPS লোকেশন পাওয়া যায়নি। ব্রাউজারের অ্যাড্রেস বার থেকে লোকেশন পারমিশন অন করুন।'
        }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [isGeofenceEnforced, geofence.latitude, geofence.longitude, geofence.radiusMeters]);

  // Run GPS Check when modal opens
  useEffect(() => {
    if (isOpen) {
      checkLiveLocation();
    }
  }, [isOpen, checkLiveLocation]);

  // Is attendance currently blocked due to geofence violation?
  const isLocationBlocked = isGeofenceEnforced && !gpsState.adminOverride && (!gpsState.isWithin || Boolean(gpsState.error));

  // Play audio chime
  const playAttendanceChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      }
    } catch {
      // Audio fallback
    }
  }, [soundEnabled]);

  const startCamera = async (facing: 'user' | 'environment') => {
    setCameraError(null);
    setIsCameraStarting(true);
    setIsVideoPlaying(false);

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    // Check if mediaDevices API exists
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('আপনার ব্রাউজার বা ডিভাইসে ক্যামেরা API সাপোর্ট করছে না। অনুগ্রহ করে Chrome বা Safari ব্রাউজার ব্যবহার করুন এবং HTTPS সংযোগ নিশ্চিত করুন।');
      setIsCameraStarting(false);
      return;
    }

    let mediaStream: MediaStream | null = null;

    try {
      // First attempt: ideal facingMode and dimensions
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280, min: 320 },
          height: { ideal: 720, min: 240 },
        },
        audio: false,
      });
    } catch (err) {
      console.warn('Initial camera attempt with facingMode failed, attempting fallback 1...', err);
      try {
        // Fallback 1: facingMode without resolution constraints
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing },
          audio: false,
        });
      } catch (err2) {
        console.warn('Fallback 1 failed, attempting basic video...', err2);
        try {
          // Fallback 2: Any available video camera without strict constraints
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch (fallbackErr: any) {
          console.error('Camera access error:', fallbackErr);
          setIsCameraStarting(false);
          if (fallbackErr.name === 'NotAllowedError' || fallbackErr.name === 'PermissionDeniedError') {
            setCameraError('ক্যামেরা পারমিশন ব্লক করা আছে। ব্রাউজারের অ্যাড্রেস বারে তালা (Lock) আইকনে ক্লিক করে ক্যামেরার অনুমতি (Allow) দিন এবং পেজটি রিফ্রেশ করুন।');
          } else if (fallbackErr.name === 'NotFoundError' || fallbackErr.name === 'DevicesNotFoundError') {
            setCameraError('কোনো ক্যামেরা ডিভাইস পাওয়া যায়নি। অনুগ্রহ করে আপনার ডিভাইসে ক্যামেরা সংযুক্ত আছে কি না তা পরীক্ষা করুন।');
          } else if (fallbackErr.name === 'NotReadableError' || fallbackErr.name === 'TrackStartError') {
            setCameraError('ক্যামেরা অন্য কোনো অ্যাপ (যেমন Zoom, Meet বা অন্য ট্যাব) ব্যবহার করছে। অনুগ্রহ করে অন্য অ্যাপটি বন্ধ করে পুনরায় চেষ্টা করুন।');
          } else {
            setCameraError('ক্যামেরা চালু করা সম্ভব হয়নি। অনুগ্রহ করে ব্রাউজার পারমিশন পরীক্ষা করুন বা সরাসরি তালিকা থেকে সদস্য বেছে নিয়ে হাজিরা দিন।');
          }
          return;
        }
      }
    }

    if (mediaStream) {
      setStream(mediaStream);
      setIsCameraStarting(false);
    }
  };

  // Dedicated effect to bind stream to video element and trigger play
  useEffect(() => {
    if (videoRef.current && stream) {
      const video = videoRef.current;
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('autoplay', 'true');
      video.setAttribute('muted', 'true');

      const handlePlaying = () => {
        setIsVideoPlaying(true);
      };

      video.addEventListener('playing', handlePlaying);
      video.addEventListener('loadeddata', handlePlaying);

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsVideoPlaying(true);
          })
          .catch((err) => {
            console.warn('Auto-play was prevented by browser policy:', err);
          });
      }

      return () => {
        video.removeEventListener('playing', handlePlaying);
        video.removeEventListener('loadeddata', handlePlaying);
      };
    }
  }, [stream]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsVideoPlaying(false);
  };

  const handleManualPlay = () => {
    if (videoRef.current) {
      videoRef.current.play().then(() => {
        setIsVideoPlaying(true);
      }).catch(err => {
        console.error('Manual play failed:', err);
        startCamera(cameraFacing);
      });
    } else {
      startCamera(cameraFacing);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsProcessingMatch(false);
      setLastMatchedStudent(null);
      setMatchDetails(null);
      setScanFailureMessage(null);
      setConsecutiveReadyFrames(0);
      startCamera(cameraFacing);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, cameraFacing]);

  // Real-time video frame face detection loop
  useEffect(() => {
    if (!isOpen || !stream || cameraError || isProcessingMatch || lastMatchedStudent || scanFailureMessage) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      if (videoRef.current && analysisCanvasRef.current && videoRef.current.readyState >= 2) {
        const result = await analyzeVideoFrameForFace(videoRef.current, analysisCanvasRef.current);
        if (isMounted) {
          setFaceAnalysis(result);
          if (result.isReady) {
            setConsecutiveReadyFrames(prev => prev + 1);
          } else {
            setConsecutiveReadyFrames(0);
          }
        }
      }
    }, 180);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen, stream, cameraError, isProcessingMatch, lastMatchedStudent, scanFailureMessage]);

  // Automatic Face Match Trigger when face is steadily centered (No buttons required!)
  useEffect(() => {
    if (
      consecutiveReadyFrames >= 2 &&
      !isProcessingMatch &&
      !lastMatchedStudent &&
      !scanFailureMessage &&
      videoRef.current
    ) {
      handleAutoProcessAttendance();
    }
  }, [consecutiveReadyFrames, isProcessingMatch, lastMatchedStudent, scanFailureMessage]);

  // Helper to record attendance for a student
  const recordAttendanceForStudent = (
    matched: Student,
    snapshot: string,
    confidence: number = 0.96,
    forceNew: boolean = false
  ) => {
    const now = new Date();
    const currentTimeMs = Date.now();
    const timeStr = now.toLocaleTimeString('bn-BD', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const dateStr = now.toISOString().split('T')[0];

    // CHECK COOLDOWN (Within 2 minutes in current session)
    const lastRecordInfo = recentAttendanceMap.current[matched.id];
    const hasRecentAttendance = !forceNew && lastRecordInfo && (currentTimeMs - lastRecordInfo.timestamp < 120000);

    if (hasRecentAttendance) {
      // Already attended in this active session
      const elapsedMs = currentTimeMs - lastRecordInfo.timestamp;
      const remainingMinutes = Math.max(1, Math.ceil((120000 - elapsedMs) / 60000));

      const lastAlert = lastAlertTimestampMap.current[matched.id] || 0;
      if (currentTimeMs - lastAlert > 8000) {
        speakBengaliAlreadyAttended(matched.nameBangla);
        lastAlertTimestampMap.current[matched.id] = currentTimeMs;
      }

      setLastMatchedStudent(matched);
      setMatchDetails({
        time: lastRecordInfo.timeStr || timeStr,
        date: dateStr,
        confidence: confidence,
        snapshotUrl: snapshot,
        isAlreadyAttended: true,
        remainingCooldownMins: remainingMinutes,
      });

      let remainingSec = 3;
      setCooldownRemaining(remainingSec);
      const countdownTimer = setInterval(() => {
        remainingSec -= 1;
        setCooldownRemaining(remainingSec);
        if (remainingSec <= 0) {
          clearInterval(countdownTimer);
          setLastMatchedStudent(null);
          setMatchDetails(null);
          setIsProcessingMatch(false);
          setConsecutiveReadyFrames(0);
        }
      }, 1000);

      return;
    }

    // NEW ATTENDANCE RECORDING
    // Check if location is blocked by geofence policy
    if (isLocationBlocked) {
      const errMsg = gpsState.error || `আপনি অফিসের অনুমোদিত ভৌগোলিক সীমানার বাইরে আছেন (দূরত্ব: ${gpsState.distanceMeters || 'অজ্ঞাত'} মি., অনুমোদিত পরিধি: ${geofence.radiusMeters} মি.)। হাজিরা গ্রহণ করা সম্ভব নয়।`;
      setScanFailureMessage(errMsg);
      if (soundEnabled) {
        try {
          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance('আপনি অফিসের অনুমোদিত লোকেশনের বাইরে অবস্থান করছেন।');
            utterance.lang = 'bn-BD';
            window.speechSynthesis.speak(utterance);
          }
        } catch {
          // Voice fallback
        }
      }
      return;
    }

    recentAttendanceMap.current[matched.id] = {
      timestamp: currentTimeMs,
      timeStr: timeStr,
    };
    lastAlertTimestampMap.current[matched.id] = currentTimeMs;

    // 1. Play sound chime
    playAttendanceChime();

    // 2. Speak aloud in Bengali: "[নাম]-এর হাজিরা সফলভাবে সম্পন্ন হয়েছে"
    speakBengaliAttendance(matched.nameBangla);

    // 3. Save attendance record to Firestore & Local storage
    const record = saveAttendanceRecord({
      studentId: matched.id,
      studentName: matched.nameBangla,
      roll: matched.roll,
      classId: matched.classId || selectedClassId,
      className: matched.className || selectedClassName,
      date: dateStr,
      time: timeStr,
      status: 'Present',
      method: 'Face AI',
      confidenceScore: confidence,
      snapshotUrl: snapshot,
      verifiedByAI: true,
      notes: `স্বয়ংক্রিয় AI ফেস স্ক্যান সফল (কনফিডেন্স: ${Math.round(confidence * 100)}%)`,
    });

    onAttendanceUpdated(record);

    // 4. Show the visual recognition card on screen
    setLastMatchedStudent(matched);
    setMatchDetails({
      time: timeStr,
      date: dateStr,
      confidence: confidence,
      snapshotUrl: snapshot,
      isAlreadyAttended: false,
    });

    // 5. Automatic countdown for continuous kiosk scanning (next person after 3.5 seconds)
    let remainingSec = 4;
    setCooldownRemaining(remainingSec);
    const countdownTimer = setInterval(() => {
      remainingSec -= 1;
      setCooldownRemaining(remainingSec);
      if (remainingSec <= 0) {
        clearInterval(countdownTimer);
        setLastMatchedStudent(null);
        setMatchDetails(null);
        setIsProcessingMatch(false);
        setConsecutiveReadyFrames(0);
      }
    }, 1000);
  };

  const handleAutoProcessAttendance = async () => {
    if (!videoRef.current || isProcessingMatch) return;

    if (isLocationBlocked) {
      setIsProcessingMatch(false);
      return;
    }

    setIsProcessingMatch(true);
    setScanFailureMessage(null);

    try {
      // Extract high-quality centered face snapshot
      const snapshot = extractFaceImage(
        videoRef.current,
        cameraFacing,
        faceAnalysis.boundingBox
      );

      const candidateStudents = students.length > 0 ? students : [];

      let matchResult: CameraScanResult;
      
      if (candidateStudents.length > 0) {
        matchResult = await identifyStudentFromCamera(candidateStudents, snapshot);
      } else {
        matchResult = {
          matchedStudent: null,
          confidence: 0,
          status: 'Absent',
          message: 'ডাটাবেজে কোনো সদস্য পাওয়া যায়নি। প্রথমে সদস্য নিবন্ধন করুন।',
          capturedSnapshot: snapshot,
        };
      }

      if (matchResult.matchedStudent) {
        recordAttendanceForStudent(matchResult.matchedStudent, snapshot, matchResult.confidence || 0.96);
      } else {
        // No match found - show on-screen message and pause for 2.5s
        setScanFailureMessage(matchResult.message || 'ডাটাবেজের নিবন্ধিত ছবির সাথে ফেস মেলেনি');
        setTimeout(() => {
          setScanFailureMessage(null);
          setIsProcessingMatch(false);
          setConsecutiveReadyFrames(0);
        }, 2500);
      }
    } catch (err) {
      console.error('Error during auto face attendance:', err);
      setIsProcessingMatch(false);
      setConsecutiveReadyFrames(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black text-white select-none overflow-hidden h-[100dvh] w-full animate-in fade-in duration-200">
      
      {/* Hidden Analysis Canvas */}
      <canvas ref={analysisCanvasRef} className="hidden" />

      {/* Top Floating Header Bar */}
      <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-auto gap-2">
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {/* GPS Geofence Real-time Status Badge */}
          {isGeofenceEnforced && (
            <button
              type="button"
              onClick={checkLiveLocation}
              title="GPS লোকেশন স্ট্যাটাস (রিফ্রেশ করতে ক্লিক করুন)"
              className={`px-3 py-2 rounded-full backdrop-blur-md border text-xs font-bold shadow-lg flex items-center space-x-1.5 transition cursor-pointer active:scale-95 shrink-0 ${
                gpsState.isLocating
                  ? 'bg-slate-900/90 border-slate-700 text-slate-300'
                  : gpsState.adminOverride
                  ? 'bg-amber-950/90 border-amber-500 text-amber-300'
                  : gpsState.isWithin
                  ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300'
                  : 'bg-rose-950/90 border-rose-500 text-rose-300 animate-pulse'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>
                {gpsState.isLocating
                  ? 'GPS যাচাই...'
                  : gpsState.adminOverride
                  ? 'এডমিন এক্সেস'
                  : gpsState.isWithin
                  ? `জোন ভেরিফাইড (${gpsState.distanceMeters ?? 0} মি.)`
                  : `বাইরে (${gpsState.distanceMeters ?? 'অজ্ঞাত'} মি.)`}
              </span>
              <RefreshCw className={`w-3 h-3 ${gpsState.isLocating ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* Fullscreen Toggle Button */}
          <button
            type="button"
            onClick={toggleBrowserFullscreen}
            title={isFullscreen ? 'ফুলস্ক্রিন বন্ধ করুন' : 'ফুলস্ক্রিন মোড চালু করুন'}
            className="p-3 rounded-full bg-slate-950/80 backdrop-blur-md hover:bg-slate-900 text-slate-300 hover:text-white border border-white/15 transition cursor-pointer active:scale-95 shadow-lg flex items-center justify-center"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            title="বন্ধ করুন"
            className="p-3 rounded-full bg-slate-950/80 backdrop-blur-md hover:bg-rose-950/90 text-slate-300 hover:text-rose-300 border border-white/15 transition cursor-pointer active:scale-95 shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Fullscreen Video Viewport */}
      <div className="relative flex-1 w-full h-full bg-black flex items-center justify-center overflow-hidden">
        
        {cameraError ? (
          <div className="max-w-sm p-6 bg-slate-950/90 rounded-3xl border border-rose-500/50 text-center space-y-4 m-4 z-30">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <AlertCircle className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-rose-200">{cameraError}</p>
            <button
              type="button"
              onClick={() => startCamera(cameraFacing)}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl shadow-lg cursor-pointer"
            >
              পুনরায় চেষ্টা করুন
            </button>
          </div>
        ) : (
          <>
            {/* Live Video Feed spanning entire screen */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover ${
                cameraFacing === 'user' ? 'scale-x-[-1]' : ''
              }`}
            />

            {/* Tap to start / Loading camera state */}
            {(!isVideoPlaying || isCameraStarting) && (
              <div 
                onClick={handleManualPlay}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/85 p-6 text-center cursor-pointer select-none"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400/80 flex items-center justify-center text-emerald-400 mb-4 animate-pulse shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-white mb-1.5">
                  {isCameraStarting ? 'ক্যামেরা চালু হচ্ছে...' : 'ক্যামেরা লাইভ ভিউ শুরু করতে ট্যাপ করুন'}
                </h3>
                <p className="text-xs text-slate-300 max-w-xs mb-4">
                  মোবাইল ব্রাউজার সুরক্ষার জন্য স্ক্রিনে যেকোনো স্থানে ট্যাপ করে লাইভ ক্যামেরা চালু করুন
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleManualPlay();
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl shadow-lg cursor-pointer flex items-center space-x-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>ক্যামেরা চালু করুন</span>
                </button>
              </div>
            )}

            {/* Dark Vignette Overlay for aesthetic biometric focus */}
            <div className="absolute inset-0 bg-radial from-transparent via-black/25 to-black/75 pointer-events-none" />

            {/* Biometric Reticle & Real-time Live Guidance Overlay */}
            {!lastMatchedStudent && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                
                {/* Live Real-time Directional Guidance Badge */}
                <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div
                    className={`px-4 py-2 rounded-full backdrop-blur-md text-xs sm:text-sm font-black border shadow-2xl transition-all duration-300 flex items-center space-x-2 ${
                      isProcessingMatch
                        ? 'bg-teal-950/95 border-teal-400 text-teal-300 shadow-[0_0_30px_rgba(20,184,166,0.6)] scale-105'
                        : faceAnalysis.guidanceColor === 'emerald'
                        ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.5)] scale-105'
                        : faceAnalysis.guidanceColor === 'amber'
                        ? 'bg-amber-950/90 border-amber-400 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                        : 'bg-rose-950/90 border-rose-500 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.4)]'
                    }`}
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                        isProcessingMatch
                          ? 'bg-teal-400 shadow-[0_0_10px_#2dd4bf]'
                          : faceAnalysis.guidanceColor === 'emerald'
                          ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                          : faceAnalysis.guidanceColor === 'amber'
                          ? 'bg-amber-400'
                          : 'bg-rose-500'
                      }`}
                    />
                    <span>
                      {isProcessingMatch
                        ? '⚡ মুখমণ্ডল স্ক্যান ও উপস্থিতি যাচাই চলছে...'
                        : faceAnalysis.guidanceText}
                    </span>
                  </div>
                </div>

                {/* Oval Face Guide Reticle with dynamic border colors & laser scan */}
                <div
                  className={`relative w-64 h-80 sm:w-72 sm:h-96 rounded-[50%] transition-all duration-300 flex flex-col items-center justify-between p-6 ${
                    isProcessingMatch || faceAnalysis.guidanceColor === 'emerald'
                      ? 'border-4 border-emerald-400 shadow-[0_0_60px_rgba(16,185,129,0.65)]'
                      : faceAnalysis.guidanceColor === 'amber'
                      ? 'border-3 border-dashed border-amber-400/80 shadow-[0_0_35px_rgba(245,158,11,0.4)]'
                      : 'border-3 border-dashed border-rose-500/70 shadow-[0_0_30px_rgba(244,63,94,0.3)]'
                  }`}
                >
                  {/* 4 Corner Targeting Brackets for biometric lock look */}
                  <div className={`absolute -top-3 -left-3 w-6 h-6 border-t-4 border-l-4 rounded-tl-xl transition-colors ${
                    faceAnalysis.guidanceColor === 'emerald' || isProcessingMatch ? 'border-emerald-400' : 'border-slate-500/40'
                  }`} />
                  <div className={`absolute -top-3 -right-3 w-6 h-6 border-t-4 border-r-4 rounded-tr-xl transition-colors ${
                    faceAnalysis.guidanceColor === 'emerald' || isProcessingMatch ? 'border-emerald-400' : 'border-slate-500/40'
                  }`} />
                  <div className={`absolute -bottom-3 -left-3 w-6 h-6 border-b-4 border-l-4 rounded-bl-xl transition-colors ${
                    faceAnalysis.guidanceColor === 'emerald' || isProcessingMatch ? 'border-emerald-400' : 'border-slate-500/40'
                  }`} />
                  <div className={`absolute -bottom-3 -right-3 w-6 h-6 border-b-4 border-r-4 rounded-br-xl transition-colors ${
                    faceAnalysis.guidanceColor === 'emerald' || isProcessingMatch ? 'border-emerald-400' : 'border-slate-500/40'
                  }`} />

                  {/* Animated Laser scanning beam */}
                  <div className="w-full flex-1 flex items-center justify-center">
                    <div
                      className={`w-full h-0.5 bg-gradient-to-r from-transparent via-current to-transparent transition-all duration-300 ${
                        isProcessingMatch
                          ? 'text-teal-400 shadow-[0_0_25px_#2dd4bf] animate-bounce'
                          : faceAnalysis.guidanceColor === 'emerald'
                          ? 'text-emerald-400 shadow-[0_0_20px_#10b981] animate-pulse'
                          : faceAnalysis.guidanceColor === 'amber'
                          ? 'text-amber-400 shadow-[0_0_15px_#f59e0b]'
                          : 'text-rose-500 shadow-[0_0_15px_#f43f5e]'
                      }`}
                    />
                  </div>

                  {/* Lock Indicator */}
                  {faceAnalysis.isReady && (
                    <div className="px-3.5 py-1 bg-emerald-950/90 backdrop-blur-md rounded-full border border-emerald-400 text-emerald-300 text-[11px] font-black shadow-lg animate-bounce flex items-center space-x-1.5">
                      <Zap className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                      <span>ফেস লক — স্বয়ংক্রিয় স্ক্যানিং...</span>
                    </div>
                  )}

                </div>

                {/* Subtitle guidance & Quick Manual Select trigger */}
                <div className="mt-5 text-center space-y-2 pointer-events-auto">
                  <p className="text-slate-300 text-xs font-semibold drop-shadow-md">
                    কোনো বাটন চাপার প্রয়োজন নেই — ক্যামেরার সামনে দাঁড়ালেই স্বয়ংক্রিয়ভাবে হাজিরা গ্রহণ হবে
                  </p>
                  
                  {/* Manual fallback button */}
                  {students.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowManualSelection(true)}
                      className="px-4 py-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 text-[11px] font-bold rounded-full border border-slate-700 backdrop-blur-md transition cursor-pointer flex items-center space-x-1.5 mx-auto"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>তালিকা থেকে সদস্য বেছে নিন</span>
                    </button>
                  )}
                </div>

              </div>
            )}

            {/* GEOFENCE RESTRICTION WARNING OVERLAY */}
            {isLocationBlocked && !lastMatchedStudent && (
              <div className="absolute top-20 left-4 right-4 z-30 max-w-md mx-auto p-4 bg-slate-950/95 border-2 border-rose-500 rounded-3xl text-white shadow-2xl backdrop-blur-md space-y-3 pointer-events-auto animate-in slide-in-from-top-4 duration-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-2xl shrink-0">
                      <MapPin className="w-6 h-6 animate-bounce" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-rose-300">
                        লোকেশন বাধা: অফিসের বাইরে আছেন!
                      </h4>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        অফিস জোন: <span className="font-semibold text-white">{geofence.locationName}</span>
                      </p>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={checkLiveLocation}
                    disabled={gpsState.isLocating}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shrink-0 cursor-pointer shadow transition active:scale-95"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${gpsState.isLocating ? 'animate-spin' : ''}`} />
                    <span>রিফ্রেশ</span>
                  </button>
                </div>

                {/* Distance comparison metric */}
                <div className="grid grid-cols-2 gap-2 bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">আপনার বর্তমান দূরত্ব</span>
                    <span className="font-mono font-bold text-rose-400 text-sm">
                      {gpsState.distanceMeters !== null ? `${gpsState.distanceMeters} মিটার` : 'অজ্ঞাত'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">সর্বোচ্চ অনুমোদিত সীমা</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {geofence.radiusMeters} মিটার
                    </span>
                  </div>
                </div>

                {gpsState.error && (
                  <p className="text-xs text-amber-300 bg-amber-950/50 p-2 rounded-xl border border-amber-800/50">
                    ⚠️ {gpsState.error}
                  </p>
                )}

                {/* Admin override & settings actions */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                  {onOpenGeofenceModal && (
                    <button
                      type="button"
                      onClick={onOpenGeofenceModal}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold underline cursor-pointer"
                    >
                      লোকেশন বা পরিধি পরিবর্তন
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setGpsState(prev => ({ ...prev, adminOverride: true }))}
                    className="text-[11px] text-slate-400 hover:text-amber-300 font-semibold cursor-pointer ml-auto flex items-center gap-1"
                  >
                    <Unlock className="w-3 h-3" />
                    <span>জরুরি এডমিন এক্সেস</span>
                  </button>
                </div>
              </div>
            )}

            {/* SCAN FAILURE OR UNRECOGNIZED ALERT OVERLAY */}
            {scanFailureMessage && !lastMatchedStudent && (
              <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in zoom-in-95 duration-150 pointer-events-auto">
                <div className="bg-slate-900 border-2 border-amber-500/80 rounded-3xl p-5 max-w-sm w-full text-center shadow-2xl space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-base text-white">উপস্থিতি গৃহীত হয়নি</h3>
                  <p className="text-xs text-amber-200">{scanFailureMessage}</p>
                  
                  {students.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setScanFailureMessage(null);
                        setShowManualSelection(true);
                      }}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>তালিকা থেকে সদস্য নির্বাচন করে হাজিরা দিন</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* MANUAL MEMBER SELECTION DRAWER / MODAL OVERLAY */}
            {showManualSelection && (
              <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150 pointer-events-auto">
                <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 max-w-md w-full shadow-2xl flex flex-col max-h-[80vh]">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
                    <div className="flex items-center space-x-2">
                      <UserCheck className="w-5 h-5 text-emerald-400" />
                      <h3 className="font-bold text-sm text-white">সদস্য নির্বাচন করে হাজিরা নিন</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowManualSelection(false)}
                      className="p-1 rounded-full text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="overflow-y-auto py-3 space-y-2 flex-1 no-scrollbar">
                    {students.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">কোনো সদস্য পাওয়া যায়নি।</p>
                    ) : (
                      students.map(std => (
                        <button
                          key={std.id}
                          type="button"
                          onClick={() => {
                            if (isLocationBlocked) {
                              alert(`❌ লোকেশন বাধা:\nআপনি অফিসের অনুমোদিত সীমানার বাইরে অবস্থান করছেন!\n\nবর্তমান দূরত্ব: ${gpsState.distanceMeters ?? 'অজ্ঞাত'} মিটার\nসর্বোচ্চ অনুমোদিত সীমা: ${geofence.radiusMeters} মিটার\nঅফিস: ${geofence.locationName}\n\nহাজিরা দিতে অফিসের নির্ধারিত সীমানার মধ্যে আসুন অথবা এডমিন এক্সেস নিন।`);
                              return;
                            }
                            setShowManualSelection(false);
                            const snapshot = videoRef.current
                              ? extractFaceImage(videoRef.current, cameraFacing, faceAnalysis.boundingBox)
                              : std.faceImage || std.photoUrl || '';
                            recordAttendanceForStudent(std, snapshot, 0.99, true);
                          }}
                          className="w-full p-2.5 rounded-2xl bg-slate-800/80 hover:bg-emerald-950/60 border border-slate-700/80 hover:border-emerald-500/60 text-left flex items-center justify-between transition cursor-pointer group"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-700 text-white font-bold flex items-center justify-center overflow-hidden shrink-0 border border-slate-600">
                              {std.faceImage || std.photoUrl ? (
                                <img src={std.faceImage || std.photoUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                std.nameBangla.charAt(0)
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-slate-100 group-hover:text-emerald-300">
                                {std.nameBangla}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {terminology.idLabel}: {std.roll}
                              </div>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 bg-emerald-600/30 text-emerald-300 text-[11px] font-bold rounded-lg border border-emerald-500/30 group-hover:bg-emerald-600 group-hover:text-white transition">
                            হাজিরা দিন
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* INSTANT RECOGNITION POPUP OVERLAY ON MATCH */}
            {lastMatchedStudent && matchDetails && (
              <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in zoom-in-95 duration-200">
                <div
                  className={`max-w-md w-full rounded-3xl border-2 p-6 text-center text-white relative overflow-hidden transition-all ${
                    matchDetails.isAlreadyAttended
                      ? 'bg-gradient-to-b from-slate-900 via-amber-950/40 to-slate-950 border-amber-400/90 shadow-[0_0_80px_rgba(245,158,11,0.35)]'
                      : 'bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-emerald-400 shadow-[0_0_80px_rgba(16,185,129,0.45)]'
                  }`}
                >
                  
                  {/* Decorative Glow */}
                  <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
                    matchDetails.isAlreadyAttended ? 'bg-amber-500/20' : 'bg-emerald-500/20'
                  }`} />
                  <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

                  {/* Top Status Badge */}
                  {matchDetails.isAlreadyAttended ? (
                    <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-black mb-5 shadow-lg animate-pulse">
                      <Info className="w-4 h-4 text-amber-400" />
                      <span>আপনার হাজিরা ইতিমধ্যে গ্রহণ করা হয়েছে</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black mb-5 shadow-lg animate-pulse">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>উপস্থিতি সফলভাবে রেকর্ড হয়েছে</span>
                    </div>
                  )}

                  {/* Member Photo Avatar */}
                  <div className="relative w-28 h-28 mx-auto mb-4">
                    <img
                      src={matchDetails.snapshotUrl || lastMatchedStudent.faceImage || lastMatchedStudent.photoUrl}
                      alt={lastMatchedStudent.nameBangla}
                      className={`w-28 h-28 rounded-full object-cover border-4 shadow-2xl ring-4 ${
                        matchDetails.isAlreadyAttended
                          ? 'border-amber-400 ring-amber-500/30'
                          : 'border-emerald-400 ring-emerald-500/30'
                      }`}
                    />
                    <div
                      className={`absolute bottom-0 right-0 p-1.5 rounded-full shadow-md ${
                        matchDetails.isAlreadyAttended ? 'bg-amber-400 text-slate-950' : 'bg-emerald-500 text-slate-950'
                      }`}
                    >
                      <ShieldCheck className="w-5 h-5 fill-slate-950 text-current" />
                    </div>
                  </div>

                  {/* Member Bangla Name */}
                  <h3 className="text-2xl font-black text-white tracking-wide mb-1">
                    {lastMatchedStudent.nameBangla}
                  </h3>
                  
                  <p className={`text-sm font-semibold ${lastMatchedStudent.faceBiometricCode ? 'mb-1.5' : 'mb-4'} ${matchDetails.isAlreadyAttended ? 'text-amber-300' : 'text-emerald-400'}`}>
                    {terminology.idLabel}: {lastMatchedStudent.roll}
                  </p>

                  {lastMatchedStudent.faceBiometricCode && (
                    <div className="inline-block px-3 py-0.5 bg-emerald-950/80 border border-emerald-500/40 rounded-full text-[10px] font-mono text-emerald-300 font-bold mb-4 shadow">
                      বায়োমেট্রিক কোড: {lastMatchedStudent.faceBiometricCode}
                    </div>
                  )}

                  {/* Attendance Info Grid */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-950/70 p-3 rounded-2xl border border-slate-800 text-xs mb-4">
                    <div className="flex items-center space-x-2 text-left p-1">
                      <Clock className={`w-4 h-4 shrink-0 ${matchDetails.isAlreadyAttended ? 'text-amber-400' : 'text-emerald-400'}`} />
                      <div className="min-w-0">
                        <div className="text-[10px] text-slate-400 truncate">হাজিরার সময়</div>
                        <div className="font-bold text-slate-200 truncate font-mono">{matchDetails.time}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-left p-1 border-x border-slate-800 px-2">
                      <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] text-slate-400 truncate">কার্যকর শিফট</div>
                        <div className="font-bold text-emerald-300 truncate">
                          {getCurrentActiveShift(getStoredScheduleSettings(), new Date())?.nameBangla || 'ডে শিফট'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-left p-1">
                      <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] text-slate-400 truncate">স্ট্যাটাস</div>
                        <div className={`font-bold truncate ${matchDetails.isAlreadyAttended ? 'text-amber-300' : 'text-emerald-400'}`}>
                          {matchDetails.isAlreadyAttended ? 'উপস্থিত' : 'সফল'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bengali Voice Announcement Notice Bar */}
                  <div
                    className={`flex items-center justify-center space-x-2 text-xs font-bold py-2.5 px-3 rounded-xl border mb-4 ${
                      matchDetails.isAlreadyAttended
                        ? 'bg-amber-950/40 text-amber-200 border-amber-800/60'
                        : 'bg-slate-800/60 text-slate-200 border-slate-700/60'
                    }`}
                  >
                    <Volume2 className={`w-4 h-4 animate-pulse shrink-0 ${matchDetails.isAlreadyAttended ? 'text-amber-400' : 'text-emerald-400'}`} />
                    <span>
                      {matchDetails.isAlreadyAttended
                        ? `ভয়েস: "${lastMatchedStudent.nameBangla}, আপনার হাজিরা ইতিমধ্যে গ্রহণ করা হয়েছে"`
                        : `ভয়েস: "${lastMatchedStudent.nameBangla}-এর হাজিরা সফলভাবে সম্পন্ন হয়েছে"`}
                    </span>
                  </div>

                  {/* Cooldown notice & instant force punch button */}
                  {matchDetails.isAlreadyAttended && (
                    <div className="space-y-2 mb-4">
                      <div className="text-[11px] font-semibold text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
                        ⏱️ একবার হাজিরা দেওয়ার পর ২ মিনিটের মধ্যে স্বয়ংক্রিয় এন্ট্রি সংরক্ষিত থাকে।
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          recordAttendanceForStudent(
                            lastMatchedStudent,
                            matchDetails.snapshotUrl || '',
                            matchDetails.confidence || 0.98,
                            true
                          );
                        }}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition flex items-center justify-center space-x-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>পুনরায় নিশ্চিত করুন (Force Record)</span>
                      </button>
                    </div>
                  )}

                  {/* Kiosk Next Person Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
                      <span>পরবর্তী স্ক্যানের জন্য প্রস্তুত হচ্ছে...</span>
                      <span className={`${matchDetails.isAlreadyAttended ? 'text-amber-400' : 'text-emerald-400'} font-bold`}>
                        {cooldownRemaining}s
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                          matchDetails.isAlreadyAttended
                            ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        }`}
                        style={{ width: `${(cooldownRemaining / 4) * 100}%` }}
                      />
                    </div>
                  </div>

                </div>
              </div>
            )}

          </>
        )}

      </div>

    </div>
  );
};
