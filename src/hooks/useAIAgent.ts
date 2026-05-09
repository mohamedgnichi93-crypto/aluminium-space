import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  processLocalMessage,
  resetSessionCount,
  type Message,
  type AgentAction,
} from '../services/aiAgentService';
import { useSpeechRecognition, SPEECH_LANGUAGES } from './useSpeechRecognition';
import { useTranslation } from 'react-i18next';

type Lang = 'fr' | 'ar' | 'tn' | 'en' | 'it';

const WELCOME_MESSAGES: Record<Lang, string> = {
  fr: "Bonjour ! 👋 Je suis **ALU**, votre assistant Aluminium Space.\n\nJe peux calculer vos prix, vous conseiller sur nos moustiquaires Grifo Flex et créer votre devis. Comment puis-je vous aider ?",
  ar: "مرحباً! 👋 أنا **ALU**، مساعد Aluminium Space.\n\nأستطيع حساب الأسعار، تقديم النصائح حول مستيكارات Grifo Flex وإعداد عرض الأسعار. كيف يمكنني مساعدتك اليوم؟",
  tn: "Aslema! 👋 Ana **ALU**, el-mosa3ed mte3 Aluminium Space.\n\nNajem n7seblek el thmen, nansahek fi moustika Grifo Flex w namel devis. Kfeh n3awnek lyoum?",
  en: "Hello! 👋 I'm **ALU**, your Aluminium Space assistant.\n\nI can calculate prices, advise you on Grifo Flex mosquito screens and prepare your quote. How can I help you today?",
  it: "Ciao! 👋 Sono **ALU**, il tuo assistente Aluminium Space.\n\nPosso calcolare i prezzi, consigliarti sulle zanzariere Grifo Flex e preparare il tuo preventivo. Come posso aiutarti oggi?",
};

const LOADING_MESSAGES: Record<Lang, string[]> = {
  fr: ['Réflexion...', 'Recherche...', 'Calcul...', 'Préparation...'],
  tn: ['Nfaker...', 'Nfataesh...', 'N7eseb...', 'Nhader...'],
  ar: ['تفكير...', 'بحث...', 'حساب...', 'تحضير...'],
  en: ['Thinking...', 'Searching...', 'Calculating...', 'Preparing...'],
  it: ['Pensando...', 'Cercando...', 'Calcolando...', 'Preparando...'],
};

export function useAIAgentLogic(
  language: Lang,
  pendingMessage: string | null,
  clearPendingMessage: () => void,
  onAutoNavigate?: () => void,
  onLanguageDetected?: (lang: Lang) => void,
) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const isInitialized = useRef(false);
  const messagesRef = useRef<Message[]>([]);
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loadingIndexRef = useRef(0);

  const { isListening, transcript, interimTranscript, startListening, stopListening, isSupported: voiceSupported } =
    useSpeechRecognition();

  const { i18n } = useTranslation();

  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // ── Loading message cycling ─────────────────────────────────────
  useEffect(() => {
    if (isLoading) {
      const msgs = LOADING_MESSAGES[language] || LOADING_MESSAGES.fr;
      loadingIndexRef.current = 0;
      setLoadingMessage(msgs[0]);
      loadingIntervalRef.current = setInterval(() => {
        loadingIndexRef.current = (loadingIndexRef.current + 1) % msgs.length;
        setLoadingMessage(msgs[loadingIndexRef.current]);
      }, 400);
    } else {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
        loadingIntervalRef.current = null;
      }
      setLoadingMessage('');
    }
    return () => {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    };
  }, [isLoading, language]);

  // ── Welcome message / restore from session ────────────────────
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const saved = sessionStorage.getItem('alu_chat_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      } catch { /* ignore */ }
    }

    const siteLang = (i18n.language as Lang) || 'fr';
    const welcomeContent = WELCOME_MESSAGES[siteLang] || WELCOME_MESSAGES[language] || WELCOME_MESSAGES.fr;

    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: welcomeContent,
      timestamp: new Date(),
    }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persist messages ──────────────────────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem('alu_chat_history', JSON.stringify(messages.slice(-50)));
    }
  }, [messages]);

  // ── Execute site actions ──────────────────────────────────────
  const executeAction = useCallback(
    (action: AgentAction) => {
      switch (action.type) {
        case 'navigate_to_page':
          if (action.params?.path) navigate(String(action.params.path));
          break;
        case 'open_3d_viewer':
          if (action.params?.productId) {
            navigate(`/produits/${action.params.productId}`);
            setTimeout(() => {
              (document.querySelector('[data-action="open-3d"]') as HTMLButtonElement | null)?.click();
            }, 800);
          }
          break;
        case 'open_devis_wizard':
          navigate('/devis');
          if (action.params?.productId) {
            localStorage.setItem('preselected_product', String(action.params.productId));
          }
          break;
        case 'scroll_to_section':
          if (action.params?.sectionId) {
            document.getElementById(String(action.params.sectionId))?.scrollIntoView({ behavior: 'smooth' });
          }
          break;
        default:
          break;
      }
    },
    [navigate]
  );

  // ── Send message ──────────────────────────────────────────────
  const sendMessage = useCallback(
    async (userText: string, base64Image?: string | null) => {
      if (!userText.trim() || isLoading) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: userText,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const response = await processLocalMessage(userText, messagesRef.current, language, base64Image);
        const { text, action, actionLabel, suggestions, navigating, detectedLang, productImage, devisButton, comparisonTable } = response;

        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: text,
          timestamp: new Date(),
          action,
          actionLabel,
          suggestions,
          detectedLang,
          productImage,
          devisButton,
          comparisonTable,
          rating: null,
        };

        setMessages(prev => [...prev, assistantMsg]);

        if (detectedLang && onLanguageDetected) onLanguageDetected(detectedLang);

        if (action && !actionLabel) {
          setTimeout(() => {
            executeAction(action);
            if (navigating && onAutoNavigate) {
              setTimeout(onAutoNavigate, 500);
            }
          }, 700);
        }
      } catch {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "Désolé, une erreur s'est produite. Veuillez réessayer ou nous appeler au (+216) 53 186 611.",
          timestamp: new Date(),
        }]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, language, executeAction, onLanguageDetected, onAutoNavigate]
  );

  // ── Handle pending message ────────────────────────────────────
  useEffect(() => {
    if (pendingMessage) {
      clearPendingMessage();
      sendMessage(pendingMessage);
    }
  }, [pendingMessage, clearPendingMessage, sendMessage]);

  // ── Voice input ──────────────────────────────────────────────
  const handleVoiceInput = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening(SPEECH_LANGUAGES[language] ?? 'fr-FR');
    }
  }, [isListening, language, startListening, stopListening]);

  // ── Rate message ──────────────────────────────────────────────
  const rateMessage = useCallback((id: string, rating: 'up' | 'down') => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, rating } : m));
  }, []);

  // ── Reset ─────────────────────────────────────────────────────
  const clearHistory = useCallback(() => {
    sessionStorage.removeItem('alu_chat_history');
    resetSessionCount(language);
    isInitialized.current = false;
    const siteLang = (i18n.language as Lang) || 'fr';
    setMessages([{
      id: 'welcome-' + Date.now(),
      role: 'assistant',
      content: WELCOME_MESSAGES[siteLang] || WELCOME_MESSAGES[language] || WELCOME_MESSAGES.fr,
      timestamp: new Date(),
    }]);
    isInitialized.current = true;
  }, [language, i18n.language]);

  return {
    messages,
    isLoading,
    loadingMessage,
    sendMessage,
    handleVoiceInput,
    isListening,
    interimTranscript,
    voiceSupported,
    clearHistory,
    executeAction,
    transcript,
    rateMessage,
  };
}
