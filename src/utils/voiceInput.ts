/**
 * Voice-to-Text Speech Recognition Utility
 * Supports Bengali ('bn-BD') with fallback to English ('en-US')
 */

export interface VoiceRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export const isVoiceSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as any).SpeechRecognition || 
    (window as any).webkitSpeechRecognition
  );
};

export class VoiceInputManager {
  private recognition: any = null;
  private isListening: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionClass = 
        (window as any).SpeechRecognition || 
        (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognitionClass) {
        this.recognition = new SpeechRecognitionClass();
      }
    }
  }

  public start(
    onResult: (text: string) => void,
    onStatusChange?: (listening: boolean) => void,
    lang: string = 'bn-BD'
  ): boolean {
    if (!this.recognition) {
      return false;
    }

    try {
      if (this.isListening) {
        this.stop();
      }

      this.recognition.lang = lang;
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListening = true;
        if (onStatusChange) onStatusChange(true);
      };

      this.recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript.trim()) {
          onResult(finalTranscript.trim());
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        this.isListening = false;
        if (onStatusChange) onStatusChange(false);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (onStatusChange) onStatusChange(false);
      };

      this.recognition.start();
      return true;
    } catch (e) {
      console.warn('Could not start speech recognition:', e);
      this.isListening = false;
      if (onStatusChange) onStatusChange(false);
      return false;
    }
  }

  public stop(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }
    this.isListening = false;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

export const globalVoiceInput = new VoiceInputManager();
