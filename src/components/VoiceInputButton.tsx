import React, { useState } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { globalVoiceInput, isVoiceSupported } from '../utils/voiceInput';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  currentValue?: string;
  append?: boolean;
  className?: string;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  currentValue = '',
  append = false,
  className = '',
  title = 'ভয়েস দিয়ে টাইপ করুন (মুখে বলুন)',
  size = 'sm'
}) => {
  const [isListening, setIsListening] = useState(false);
  const supported = isVoiceSupported();

  const handleToggleVoice = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!supported) {
      alert('আপনার ব্রাউজারে ভয়েস সার্চ চালু করতে গুগল ক্রোম ব্যবহার করুন অথবা মোবাইলের কীবোর্ডের মাইক্রোফোন বাটন ব্যবহার করুন।');
      return;
    }

    if (isListening) {
      globalVoiceInput.stop();
      setIsListening(false);
    } else {
      const started = globalVoiceInput.start(
        (transcript) => {
          if (append && currentValue.trim()) {
            onTranscript(`${currentValue.trim()} ${transcript}`);
          } else {
            onTranscript(transcript);
          }
        },
        (listening) => {
          setIsListening(listening);
        },
        'bn-BD'
      );

      if (!started) {
        // Fallback with en-US
        globalVoiceInput.start(
          (transcript) => {
            if (append && currentValue.trim()) {
              onTranscript(`${currentValue.trim()} ${transcript}`);
            } else {
              onTranscript(transcript);
            }
          },
          (listening) => {
            setIsListening(listening);
          },
          'en-US'
        );
      }
    }
  };

  const sizeClasses = size === 'sm' 
    ? 'w-7 h-7 p-1.5' 
    : size === 'md' 
    ? 'w-8 h-8 p-2' 
    : 'w-10 h-10 p-2.5';

  const iconSizes = size === 'sm' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <button
      type="button"
      onClick={handleToggleVoice}
      title={isListening ? 'ভয়েস ইনপুট বন্ধ করুন' : title}
      className={`rounded-xl transition-all flex items-center justify-center cursor-pointer shrink-0 select-none relative ${
        isListening
          ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 animate-pulse'
          : 'bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 border border-slate-300'
      } ${sizeClasses} ${className}`}
    >
      {isListening ? (
        <>
          <span className="absolute -inset-1 rounded-xl bg-rose-400/40 animate-ping" />
          <MicOff className={`${iconSizes} text-white relative z-10`} />
        </>
      ) : (
        <Mic className={iconSizes} />
      )}
    </button>
  );
};
