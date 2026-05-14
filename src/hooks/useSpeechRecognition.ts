import { useState, useRef, useCallback, useEffect } from 'react';

export const SPEECH_LANGUAGES: Record<string, string> = {
  fr: 'fr-FR',
  ar: 'ar-MA',
  tn: 'ar-SA',
  en: 'en-US',
  it: 'it-IT',
};

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  startListening: (language?: string) => void;
  stopListening: () => void;
  isSupported: boolean;
  error: string | null;
  sttError: string | null;
}

const SILENCE_TIMEOUT = 4000;

export function useSpeechRecognition(): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sttError, setSttError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const startListening = useCallback(
    (language = 'fr-FR') => {
      if (!isSupported) {
        setSttError('Reconnaissance vocale non supportée sur ce navigateur.');
        return;
      }

      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }

      const SpeechRecognitionAPI =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
        setInterimTranscript('');
        setSttError(null);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let finalText = '';
        let interimText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalText += result[0].transcript;
          } else {
            interimText += result[0].transcript;
          }
        }

        if (finalText) {
          setTranscript(prev => (prev + ' ' + finalText).trim());
          setInterimTranscript('');
        } else {
          setInterimTranscript(interimText);
        }

        clearSilenceTimer();
        silenceTimerRef.current = setTimeout(() => {
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
        }, SILENCE_TIMEOUT);
      };

      recognition.onerror = (event: any) => {
        let msg = '';
        switch (event.error) {
          case 'no-speech': msg = "Je n'ai rien entendu, réessayez"; break;
          case 'not-allowed': msg = "Accès micro refusé. Vérifiez les permissions"; break;
          case 'network': msg = "Problème réseau avec la reconnaissance vocale"; break;
          case 'aborted': break;
          default: msg = `Erreur : ${event.error}`;
        }
        if (msg) setSttError(msg);
        
        setIsListening(false);
        setInterimTranscript('');
        clearSilenceTimer();
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
        clearSilenceTimer();
      };

      recognitionRef.current = recognition;
      recognition.start();
    },
    [isSupported]
  );

  const stopListening = useCallback(() => {
    clearSilenceTimer();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  useEffect(() => {
    return () => {
      clearSilenceTimer();
      recognitionRef.current?.abort();
    };
  }, []);

  return { 
    isListening, 
    transcript, 
    interimTranscript, 
    startListening, 
    stopListening, 
    isSupported, 
    error,
    sttError
  };
}
