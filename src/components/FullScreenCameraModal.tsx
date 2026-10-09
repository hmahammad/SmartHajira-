import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, X, CheckCircle2, AlertTriangle, Zap, AlertCircle, Lock, Maximize2, Minimize2 } from 'lucide-react';
import {
  analyzeVideoFrameForFace,
  extractFaceImage,
  verifyFaceOnline,
  FaceFrameAnalysis
} from '../utils/faceDetectionEngine';

interface FullScreenCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (photoDataUrl: string) => void;
  title?: string;
  subtitle?: string;
  memberName?: string;
}

export const FullScreenCameraModal: React.FC<FullScreenCameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  memberName,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const cameraFacing = 'user'; // Strictly Front/Selfie Camera (Back camera disabled)
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
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

  // Real-time Face Detection Analysis State
  const [faceAnalysis, setFaceAnalysis] = useState<FaceFrameAnalysis>({
    hasFace: false,
    isReady: false,
    status: 'no_face',
    guidanceText: 'মুখমণ্ডল ফ্রেমের ভেতরে সোজা রাখুন',
    guidanceColor: 'red',
    confidence: 0,
  });

  // Play audio confirmation chime using Web Audio API
  const playChime = (success: boolean) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = success ? 'sine' : 'sawtooth';
        osc.frequency.setValueAtTime(success ? 880 : 320, ctx.currentTime);
        if (success) {
          osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
        }
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      // Audio fallback
    }
  };

  const startCamera = async (facing: 'user' | 'environment') => {
    setCameraError(null);
    setAlertMessage(null);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('আপনার ব্রাউজার বা ডিভাইসে ক্যামেরা API সাপোর্ট করছে না। অনুগ্রহ করে Chrome বা Safari ব্রাউজার ব্যবহার করুন।');
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280, min: 320 },
          height: { ideal: 720, min: 240 },
        },
        audio: false,
      });
      setStream(mediaStream);
    } catch (err: any) {
      console.warn('Initial registration camera attempt failed, trying fallback 1...', err);
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing },
          audio: false,
        });
        setStream(fallbackStream);
      } catch (err2) {
        console.warn('Fallback 1 failed, trying fallback 2...', err2);
        try {
          const basicStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
          setStream(basicStream);
        } catch (fallbackErr: any) {
          console.error('Camera access error:', fallbackErr);
          if (fallbackErr.name === 'NotAllowedError' || fallbackErr.name === 'PermissionDeniedError') {
            setCameraError('ক্যামেরা পারমিশন ব্লক করা আছে। ব্রাউজারের অ্যাড্রেস বারের তালা (Lock) আইকনে ক্লিক করে ক্যামেরার অনুমতি দিন।');
          } else {
            setCameraError('ক্যামেরা চালু করা সম্ভব হয়নি। ডিভাইসে ক্যামেরা সংযুক্ত আছে কি না তা পরীক্ষা করুন।');
          }
        }
      }
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
      video.play().catch(err => {
        console.warn('Auto-play blocked on camera register modal:', err);
      });
    }
  }, [stream]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsCapturing(false);
      setAlertMessage(null);
      startCamera(cameraFacing);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, cameraFacing]);

  // Continuous real-time face detection loop
  useEffect(() => {
    if (!isOpen || !stream || cameraError || isCapturing) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      if (videoRef.current && analysisCanvasRef.current && videoRef.current.readyState >= 2) {
        const result = await analyzeVideoFrameForFace(videoRef.current, analysisCanvasRef.current);
        if (isMounted) {
          setFaceAnalysis(result);
        }
      }
    }, 180);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen, stream, cameraError, isCapturing]);

  // Strictly handles capture - rejects anything without a verified face
  const handleCapture = async () => {
    if (!videoRef.current) return;

    // Strict validation: Reject if no face or bad pose
    if (!faceAnalysis.isReady && !faceAnalysis.hasFace) {
      playChime(false);
      setAlertMessage('❌ কোনো মানুষের মুখমণ্ডল শনাক্ত করা যায়নি! অন্য কোনো অংশ গ্রহণযোগ্য নয়। অনুগ্রহ করে ক্যামেরার সামনে সোজা হয়ে দাঁড়ান।');
      setTimeout(() => setAlertMessage(null), 4000);
      return;
    }

    if (!faceAnalysis.isReady) {
      playChime(false);
      setAlertMessage(`⚠️ ${faceAnalysis.guidanceText}। মুখমণ্ডল ফ্রেমের মাঝে সোজা রেখে স্থির থাকুন।`);
      setTimeout(() => setAlertMessage(null), 3500);
      return;
    }

    setIsCapturing(true);
    setAlertMessage(null);

    // Extract specifically cropped face (isolating human face from unwanted background/objects)
    const croppedFaceDataUrl = extractFaceImage(
      videoRef.current,
      cameraFacing,
      faceAnalysis.boundingBox
    );

    if (!croppedFaceDataUrl || croppedFaceDataUrl.length < 100) {
      setIsCapturing(false);
      playChime(false);
      setAlertMessage('ছবি প্রসেসিংয়ে সমস্যা হয়েছে, পুনরায় চেষ্টা করুন।');
      return;
    }

    // Verify online with AI Face Detection API
    try {
      const verifyResult = await verifyFaceOnline(croppedFaceDataUrl);
      if (!verifyResult.hasFace) {
        setIsCapturing(false);
        playChime(false);
        setAlertMessage(`❌ ${verifyResult.message || 'মুখমণ্ডল শনাক্ত করা যায়নি। অন্য কোনো ছবি গ্রহণযোগ্য নয়।'}`);
        return;
      }
    } catch (e) {
      // Continue if local score was already high
    }

    playChime(true);

    // Brief confirmation animation then return clean cropped face
    setTimeout(() => {
      onCapture(croppedFaceDataUrl);
      stopCamera();
      onClose();
    }, 450);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black text-white select-none overflow-hidden h-[100dvh] w-full animate-in fade-in duration-200">
      
      {/* Hidden Analysis Canvas */}
      <canvas ref={analysisCanvasRef} className="hidden" />

      {/* Top Floating Controls - Clean and Minimalist */}
      <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center space-x-2">
          {memberName && (
            <div className="px-3.5 py-2 rounded-full bg-slate-950/80 backdrop-blur-md border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-lg">
              {memberName}
            </div>
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

            {/* Dark Vignette Overlay to focus on face */}
            <div className="absolute inset-0 bg-radial from-transparent via-black/20 to-black/70 pointer-events-none" />

            {/* Interactive Futuristic Face Reticle & Real-time Directional Guidance */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
              
              {/* Guidance Badge directly above face frame */}
              <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div
                  className={`px-4 py-2 rounded-full backdrop-blur-md text-xs sm:text-sm font-black border shadow-2xl transition-all duration-300 flex items-center space-x-2 ${
                    faceAnalysis.guidanceColor === 'emerald'
                      ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.5)] scale-105'
                      : faceAnalysis.guidanceColor === 'amber'
                      ? 'bg-amber-950/90 border-amber-400 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                      : 'bg-rose-950/90 border-rose-500 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.4)]'
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                      faceAnalysis.guidanceColor === 'emerald'
                        ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                        : faceAnalysis.guidanceColor === 'amber'
                        ? 'bg-amber-400'
                        : 'bg-rose-500'
                    }`}
                  />
                  <span>{faceAnalysis.guidanceText}</span>
                </div>
              </div>

              {/* Oval Face Guide Reticle with dynamic border colors & laser scan */}
              <div
                className={`relative w-64 h-80 sm:w-72 sm:h-96 rounded-[50%] transition-all duration-300 flex flex-col items-center justify-between p-6 ${
                  faceAnalysis.guidanceColor === 'emerald'
                    ? 'border-4 border-emerald-400 shadow-[0_0_60px_rgba(16,185,129,0.6)]'
                    : faceAnalysis.guidanceColor === 'amber'
                    ? 'border-3 border-dashed border-amber-400/80 shadow-[0_0_35px_rgba(245,158,11,0.4)]'
                    : 'border-3 border-dashed border-rose-500/70 shadow-[0_0_30px_rgba(244,63,94,0.3)]'
                }`}
              >
                {/* 4 Corner Targeting Brackets for biometric lock look */}
                <div className={`absolute -top-3 -left-3 w-6 h-6 border-t-4 border-l-4 rounded-tl-xl transition-colors ${
                  faceAnalysis.guidanceColor === 'emerald' ? 'border-emerald-400' : 'border-slate-500/40'
                }`} />
                <div className={`absolute -top-3 -right-3 w-6 h-6 border-t-4 border-r-4 rounded-tr-xl transition-colors ${
                  faceAnalysis.guidanceColor === 'emerald' ? 'border-emerald-400' : 'border-slate-500/40'
                }`} />
                <div className={`absolute -bottom-3 -left-3 w-6 h-6 border-b-4 border-l-4 rounded-bl-xl transition-colors ${
                  faceAnalysis.guidanceColor === 'emerald' ? 'border-emerald-400' : 'border-slate-500/40'
                }`} />
                <div className={`absolute -bottom-3 -right-3 w-6 h-6 border-b-4 border-r-4 rounded-br-xl transition-colors ${
                  faceAnalysis.guidanceColor === 'emerald' ? 'border-emerald-400' : 'border-slate-500/40'
                }`} />

                {/* Laser scan line animation */}
                <div className="w-full flex-1 flex items-center justify-center">
                  <div
                    className={`w-full h-0.5 bg-gradient-to-r from-transparent via-current to-transparent transition-all duration-300 ${
                      faceAnalysis.guidanceColor === 'emerald'
                        ? 'text-emerald-400 shadow-[0_0_20px_#10b981] animate-pulse'
                        : faceAnalysis.guidanceColor === 'amber'
                        ? 'text-amber-400 shadow-[0_0_15px_#f59e0b]'
                        : 'text-rose-500 shadow-[0_0_15px_#f43f5e]'
                    }`}
                  />
                </div>

                {/* Face Lock Status in Reticle */}
                {faceAnalysis.isReady && (
                  <div className="px-3 py-1 bg-emerald-950/80 backdrop-blur-md rounded-full border border-emerald-400 text-emerald-300 text-[11px] font-black shadow-lg animate-bounce">
                    ✓ ফেস লক করা হয়েছে
                  </div>
                )}

              </div>
            </div>

            {/* Error / Alert Toast Notification */}
            {alertMessage && (
              <div className="absolute top-20 left-4 right-4 z-50 flex justify-center pointer-events-none animate-in fade-in zoom-in-95 duration-200">
                <div className="max-w-md px-5 py-3.5 bg-rose-950/95 backdrop-blur-md border-2 border-rose-500 rounded-2xl text-white text-xs sm:text-sm font-black shadow-2xl flex items-center space-x-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>{alertMessage}</span>
                </div>
              </div>
            )}

            {/* Capture Flash Overlay */}
            {isCapturing && (
              <div className="absolute inset-0 bg-white/70 animate-in fade-in duration-100 flex items-center justify-center z-50 pointer-events-none">
                <div className="p-5 bg-slate-950/90 rounded-3xl border border-emerald-400 text-emerald-400 flex items-center space-x-3 shadow-2xl">
                  <CheckCircle2 className="w-7 h-7 animate-bounce" />
                  <span className="font-black text-base">ফেস স্ক্যান ও সংগ্রহ সম্পন্ন হয়েছে...</span>
                </div>
              </div>
            )}
          </>
        )}

      </div>

      {/* Bottom Floating Bar - ONLY the Capture Button as explicitly requested */}
      <div className="absolute bottom-6 left-0 right-0 z-40 flex flex-col items-center justify-center px-4 pointer-events-auto">
        <button
          type="button"
          onClick={handleCapture}
          disabled={isCapturing || Boolean(cameraError)}
          className={`w-full max-w-sm px-8 py-4.5 rounded-full font-black text-sm sm:text-base transition-all duration-200 active:scale-95 flex items-center justify-center space-x-3 cursor-pointer shadow-2xl ${
            faceAnalysis.isReady
              ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-[0_0_35px_rgba(16,185,129,0.7)] border-2 border-white/60 animate-pulse'
              : faceAnalysis.hasFace
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.5)] border-2 border-amber-300'
              : 'bg-slate-900/90 hover:bg-slate-800 text-slate-400 border border-slate-700 shadow-xl'
          }`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${
            faceAnalysis.isReady ? 'bg-black/20 scale-110 text-slate-950' : 'bg-white/10 text-white'
          }`}>
            <Camera className="w-5 h-5" />
          </div>
          <span>
            {faceAnalysis.isReady 
              ? '📸 ফেস স্ক্যান ও ছবি সংগ্রহ করুন' 
              : faceAnalysis.hasFace 
              ? '⚠️ নির্দেশনা অনুযায়ী প্রস্তুত হন' 
              : 'ক্যামেরায় মুখমণ্ডল রাখুন'}
          </span>
        </button>
      </div>

    </div>
  );
};
