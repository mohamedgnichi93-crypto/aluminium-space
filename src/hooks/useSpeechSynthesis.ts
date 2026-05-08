import { useState, useCallback } from 'react';

const VOICE_PREFERENCES: Record<string, string[]> = {
  fr: ['fr-FR', 'fr-BE', 'fr-CA', 'fr'],
  ar: ['ar-SA', 'ar-EG', 'ar'],
  tn: ['ar-TN', 'ar-SA', 'ar'],
  en: ['en-US', 'en-GB', 'en'],
  it: ['it-IT', 'it'],
};

interface SpeechSynthesisHook {
  speak: (text: string, lang?: string) => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

const loadVoices = (): Promise<SpeechSynthesisVoice[]> =>
  new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) { resolve(voices); return; }
    window.speechSynthesis.onvoiceschanged = () => resolve(window.speechSynthesis.getVoices());
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1000);
  });

const getBestVoice = async (langKey: string): Promise<SpeechSynthesisVoice | null> => {
  const voices = await loadVoices();
  const preferred = VOICE_PREFERENCES[langKey] || ['fr-FR'];

  for (const pref of preferred) {
    const m = voices.find(v => v.lang === pref && !v.localService);
    if (m) return m;
  }
  for (const pref of preferred) {
    const m = voices.find(v => v.lang === pref);
    if (m) return m;
  }
  for (const pref of preferred) {
    const prefix = pref.split('-')[0];
    const m = voices.find(v => v.lang.startsWith(prefix));
    if (m) return m;
  }
  return voices[0] || null;
};

const cleanTextForSpeech = (text: string): string =>
  text
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/`{1,3}[\s\S]*?`{1,3}/g, '')
    .replace(/━+/g, '')
    .replace(/[•→←|]/g, '')
    .replace(/\n+/g, '. ')
    .trim();

export function useSpeechSynthesis(): SpeechSynthesisHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const speak = useCallback(
    async (text: string, lang?: string) => {
      if (!isSupported) return;
      window.speechSynthesis.cancel();

      const cleanText = cleanTextForSpeech(text);
      if (!cleanText) return;

      const langKey = lang ?? detectLangFromText(cleanText);
      const voice = await getBestVoice(langKey);

      const utterance = new SpeechSynthesisUtterance(cleanText);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        const langCodes: Record<string, string> = {
          tn: 'ar-TN', ar: 'ar-SA', en: 'en-US', it: 'it-IT', fr: 'fr-FR',
        };
        utterance.lang = langCodes[langKey] || 'fr-FR';
      }

      const rates: Record<string, number> = { fr: 0.95, ar: 0.85, tn: 0.85, en: 0.95, it: 0.95 };
      utterance.rate = rates[langKey] ?? 0.95;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      return new Promise<void>((resolve, reject) => {
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => { setIsSpeaking(false); resolve(); };
        utterance.onerror = (e) => { setIsSpeaking(false); reject(e); };
        window.speechSynthesis.speak(utterance);
      });
    },
    [isSupported]
  );

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  return { speak, stop, isSpeaking, isSupported };
}

function detectLangFromText(text: string): string {
  if (/[؀-ۿ]/.test(text)) return 'ar';
  if (/(ciao|grazie|prego|zanzariera|finestra|preventivo|buongiorno)/i.test(text)) return 'it';
  if (/(hello|hi\b|thank|mosquito|screen|quote|window|door|welcome)/i.test(text)) return 'en';
  return 'fr';
}
