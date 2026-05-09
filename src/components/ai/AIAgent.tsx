import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Mic, MicOff,
  Send, RotateCcw, Loader2, Bot, ChevronDown, ThumbsUp, ThumbsDown, Camera,
} from 'lucide-react';
import { useAIAgentContext } from '../../context/AIAgentContext';
import { useAIAgentLogic } from '../../hooks/useAIAgent';
import type { Lang } from '../../context/AIAgentContext';

// ── Markdown-lite renderer ────────────────────────────────────────
function renderText(text: string) {
  return text.split('\n').map((line, i, arr) => {
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <span key={i}>
        {parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
        {i < arr.length - 1 && <br />}
      </span>
    );
  });
}

// ── Quick actions ─────────────────────────────────────────────────
const QUICK_ACTIONS: Record<Lang, { label: string; message: string }[]> = {
  fr: [
    { label: '🪟 Voir les produits', message: 'Je veux voir les produits' },
    { label: '💰 Calculer un prix', message: 'Je veux calculer le prix' },
    { label: '📋 Faire un devis', message: 'Je veux faire un devis' },
    { label: '📞 Nous contacter', message: 'Comment vous contacter ?' },
  ],
  ar: [
    { label: '🪟 عرض المنتجات', message: 'أريد رؤية المنتجات' },
    { label: '💰 حساب السعر', message: 'أريد حساب السعر' },
    { label: '📋 طلب عرض سعر', message: 'أريد عرض أسعار' },
    { label: '📞 التواصل معنا', message: 'كيف يمكنني التواصل معكم؟' },
  ],
  tn: [
    { label: '🪟 Chouf les produits', message: 'N7eb nchouf les produits' },
    { label: '💰 9der el thmen', message: 'N7eb n9der el thmen' },
    { label: '📋 Amel devis', message: 'N7eb namel devis' },
    { label: '📞 Atsalna', message: 'Kfeh netsalu bikom?' },
  ],
  en: [
    { label: '🪟 View products', message: 'I want to see the products' },
    { label: '💰 Calculate price', message: 'I want to calculate a price' },
    { label: '📋 Get a quote', message: 'I want to get a quote' },
    { label: '📞 Contact us', message: 'How can I contact you?' },
  ],
  it: [
    { label: '🪟 Vedi prodotti', message: 'Voglio vedere i prodotti' },
    { label: '💰 Calcola prezzo', message: 'Voglio calcolare il prezzo' },
    { label: '📋 Richiedi preventivo', message: 'Voglio un preventivo' },
    { label: '📞 Contattaci', message: 'Come posso contattarvi?' },
  ],
};


const PLACEHOLDER_NORMAL: Record<Lang, string> = {
  fr: 'Tapez votre message...', ar: 'اكتب رسالتك...', tn: 'Ekteb 7na...',
  en: 'Type your message...', it: 'Scrivi il tuo messaggio...',
};

const PLACEHOLDER_DIMS: Record<Lang, string> = {
  fr: 'Ex: 150×120 (largeur × hauteur en cm)',
  ar: 'مثال: 150×120 (عرض × ارتفاع)',
  tn: 'Ex: 150×120 (3ardh × toul b cm)',
  en: 'E.g: 150×120 (width × height in cm)',
  it: 'Es: 150×120 (larghezza × altezza in cm)',
};

export default function AIAgent() {
  const {
    isOpen, closeAgent, toggleAgent,
    currentLanguage, setLanguage,
    pendingMessage, clearPendingMessage,
  } = useAIAgentContext();

  const [inputValue, setInputValue] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [avatarError, setAvatarError] = useState(false);
  const [awaitingDimensions, setAwaitingDimensions] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    messages, isLoading, loadingMessage, sendMessage,
    handleVoiceInput, isListening, interimTranscript,
    voiceSupported, clearHistory, executeAction, transcript, rateMessage,
  } = useAIAgentLogic(
    currentLanguage, pendingMessage, clearPendingMessage, closeAgent, setLanguage,
  );

  const quickActions = QUICK_ACTIONS[currentLanguage] || QUICK_ACTIONS.fr;

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus on open
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  // Sync voice transcript to input
  useEffect(() => {
    if (isListening) {
      const combined = [transcript, interimTranscript].filter(Boolean).join(' ').trim();
      if (combined) setInputValue(combined);
    }
  }, [isListening, transcript, interimTranscript]);

  // Auto-send when voice stops
  const prevListeningRef = useRef(isListening);
  useEffect(() => {
    if (prevListeningRef.current && !isListening) {
      const toSend = transcript.trim();
      if (toSend) {
        sendMessage(toSend);
        setInputValue('');
        setShowQuickActions(false);
      }
    }
    prevListeningRef.current = isListening;
  }, [isListening, transcript, sendMessage]);

  // Track if waiting for dimensions
  useEffect(() => {
    if (messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.role === 'assistant') {
        setAwaitingDimensions(
          /dimensions|largeur|hauteur|envoyez|ba3ath|أرسل|send.*dim|invia/i.test(last.content)
        );
      }
    }
  }, [messages]);


  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const IMAGE_PROMPTS: Record<Lang, string> = {
    fr: "J'ai partagé une photo de mon ouverture (fenêtre/porte/terrasse). Quelle moustiquaire me recommandez-vous ?",
    ar: "التقطت صورة لفتحتي (نافذة/باب/شرفة). ما الناموسية التي تنصحني بها؟",
    tn: "عندي صورة للفتحة متاعتي (شباك/باب/تراس). شنية الموستيكارة اللي تنصحني بيها؟",
    en: "I shared a photo of my opening (window/door/terrace). Which mosquito screen do you recommend?",
    it: "Ho condiviso una foto della mia apertura (finestra/porta/terrazza). Quale zanzariera mi consiglia?",
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("La taille de l'image ne doit pas dépasser 5MB.");
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
      if (!inputValue.trim()) {
        setInputValue(IMAGE_PROMPTS[currentLanguage] || IMAGE_PROMPTS.fr);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return;
    sendMessage(inputValue.trim(), imagePreview);
    setInputValue('');
    setImagePreview(null);
    setShowQuickActions(false);
  };

  const handleQuickAction = (msg: string) => {
    sendMessage(msg);
    setShowQuickActions(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const statusText = () => {
    if (isListening) return { fr: '🎤 Écoute...', ar: '🎤 أسمعك...', tn: '🎤 سامعك...', en: '🎤 Listening...', it: '🎤 Ascolto...' }[currentLanguage] ?? '🎤 Écoute...';
    return { fr: '● En ligne', ar: '● متصل', tn: '● موجود', en: '● Online', it: '● Online' }[currentLanguage] ?? '● En ligne';
  };

  const statusColor = isListening ? '#F87171' : '#4ADE80';

  return (
    <>
      {/* Proactive bubble — removed to prevent content overlap on all screens */}

      {/* ── FAB Button ──────────────────────────────────────────── */}
      <motion.button
        onClick={() => { toggleAgent(); }}
        className="ai-fab-button fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center"
        style={{ background: '#1A5DA8', boxShadow: '0 8px 32px rgba(26,93,168,0.45)' }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Ouvrir l'assistant ALU"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div key="bot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              {avatarError ? (
                <Bot className="w-6 h-6 text-white" />
              ) : (
                <img
                  src="/images/alu-avatar.png"
                  alt="ALU"
                  className="w-10 h-10 rounded-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
        {!isOpen && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
        )}
      </motion.button>

      {/* ── Chat Panel ──────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: isMobile ? 30 : 20, scale: isMobile ? 1 : 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isMobile ? 30 : 20, scale: isMobile ? 1 : 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed z-50 flex flex-col overflow-hidden ${isMobile ? 'bottom-0 right-0 left-0 rounded-t-2xl w-full' : 'bottom-24 right-6 rounded-[20px]'}`}
            style={{
              width: isMobile ? '100%' : '380px',
              height: isMobile ? 'min(82svh, calc(100vh - 3.5rem))' : '580px',
              maxHeight: isMobile ? 'calc(100vh - 3.5rem)' : 'calc(100vh - 7rem)',
              background: '#FFFFFF',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            {/* ── HEADER ──────────────────────────────────────────── */}
            <div
              className="flex items-center gap-2 px-3 py-2.5 flex-shrink-0"
              style={{ background: '#0D1B2A', minHeight: '56px' }}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#1A5DA8', border: '2px solid #4ADE80' }}>
                  {avatarError ? (
                    <Bot className="w-5 h-5 text-white" />
                  ) : (
                    <img
                      src="/images/alu-avatar.png"
                      alt="ALU"
                      className="w-9 h-9 rounded-full object-cover"
                      onError={() => setAvatarError(true)}
                    />
                  )}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2" style={{ borderColor: '#0D1B2A' }} />
              </div>

              {/* Name + status */}
              <div className="flex-1 min-w-0">
                <p style={{ color: 'white', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '1px', lineHeight: 1.1 }}>
                  ALU — Assistant Aluminium Space
                </p>
                <p style={{ fontSize: '10px', fontFamily: 'DM Sans, sans-serif', color: statusColor }}>
                  {statusText()}
                </p>
              </div>

              {/* Reset */}
              <button
                onClick={clearHistory}
                className="p-1 rounded"
                style={{ color: 'rgba(255,255,255,0.4)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
                title="Réinitialiser"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Close */}
              <button
                onClick={closeAgent}
                className="p-1 rounded"
                style={{ color: 'rgba(255,255,255,0.4)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* ── MESSAGES ──────────────────────────────────────────── */}
            <div
              className="flex-1 overflow-y-auto p-3 space-y-3"
              style={{ background: '#F8FAFC' }}
            >
              {messages.map((msg, msgIdx) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mr-1.5 mt-0.5" style={{ background: '#1A5DA8' }}>
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div className="flex flex-col max-w-[80%]">
                    <div
                      className="px-3.5 py-2.5 text-sm leading-relaxed"
                      style={
                        msg.role === 'user'
                          ? {
                            background: '#1A5DA8',
                            color: 'white',
                            borderRadius: '18px 18px 4px 18px',
                            fontFamily: 'DM Sans, sans-serif',
                          }
                          : {
                            background: 'white',
                            color: '#0D1B2A',
                            borderRadius: '18px 18px 18px 4px',
                            border: '1px solid #E8EDF5',
                            fontFamily: 'DM Sans, sans-serif',
                          }
                      }
                    >
                      {renderText(msg.content)}

                      {/* Action button */}
                      {msg.actionLabel && msg.action && (
                        <button
                          onClick={() => executeAction(msg.action!)}
                          style={{
                            background: '#1A5DA8', color: 'white',
                            border: 'none', borderRadius: 8,
                            padding: '8px 14px', fontSize: 12,
                            cursor: 'pointer', marginTop: 8,
                            display: 'block', width: '100%',
                            fontFamily: 'DM Sans, sans-serif', fontWeight: 600,
                          }}
                        >
                          {msg.actionLabel}
                        </button>
                      )}
                    </div>

                    {/* Assistant extra content */}
                    {msg.role === 'assistant' && (
                      <div className="mt-1.5 space-y-1.5">
                        {/* Product image */}
                        {msg.productImage && (
                          <div style={{ background: '#F4F7FB', borderRadius: 10, padding: 6, border: '1px solid #E8EDF5' }}>
                            <img
                              src={msg.productImage}
                              alt="Produit"
                              style={{ maxHeight: 80, objectFit: 'contain', width: '100%', borderRadius: 6 }}
                              onError={e => { e.currentTarget.style.display = 'none'; }}
                            />
                          </div>
                        )}

                        {/* Comparison table */}
                        {msg.comparisonTable && (
                          <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #E8EDF5' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'DM Sans, sans-serif' }}>
                              <thead>
                                <tr style={{ background: '#1A5DA8', color: 'white' }}>
                                  {msg.comparisonTable.headers.map((h, i) => (
                                    <th key={i} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {msg.comparisonTable.rows.map((row, ri) => (
                                  <tr key={ri} style={{ borderBottom: '1px solid #F0F4F8', background: ri % 2 === 0 ? 'white' : '#F8FAFC' }}>
                                    <td style={{ padding: '5px 8px', color: '#7A8FA6', fontWeight: 600, whiteSpace: 'nowrap' }}>{row.label}</td>
                                    <td style={{ padding: '5px 8px', color: '#0D1B2A' }}>{row.colibri}</td>
                                    <td style={{ padding: '5px 8px', color: '#0D1B2A' }}>{row.sidney}</td>
                                    <td style={{ padding: '5px 8px', color: '#0D1B2A' }}>{row.sidneyAC}</td>
                                    <td style={{ padding: '5px 8px', color: '#0D1B2A' }}>{row.elba}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Devis button */}
                        {msg.devisButton?.show && (
                          <button
                            onClick={() => executeAction({ type: 'open_devis_wizard', params: { productId: msg.devisButton!.productId, width: msg.devisButton!.width, height: msg.devisButton!.height } })}
                            style={{
                              width: '100%', background: '#1A5DA8', color: 'white',
                              border: 'none', borderRadius: 8, padding: '10px 14px',
                              fontSize: 12, cursor: 'pointer',
                              fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
                              textAlign: 'center',
                            }}
                          >
                            {msg.devisButton.label || `➕ Ajouter au devis`}
                          </button>
                        )}

                        {/* Suggestions (only on last assistant message) */}
                        {msg.suggestions && msg.suggestions.length > 0 && msgIdx === messages.length - 1 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                            {msg.suggestions.map((s, i) => (
                              <button
                                key={i}
                                onClick={() => { sendMessage(s); setShowQuickActions(false); }}
                                style={{
                                  background: 'white', color: '#1A5DA8',
                                  border: '1px solid #C8D9F0',
                                  borderRadius: 20, padding: '4px 10px',
                                  fontSize: 11, cursor: 'pointer',
                                  fontFamily: 'DM Sans, sans-serif', fontWeight: 500,
                                  transition: 'all 0.15s',
                                }}
                                onMouseEnter={e => {
                                  (e.currentTarget as HTMLElement).style.background = '#1A5DA8';
                                  (e.currentTarget as HTMLElement).style.color = 'white';
                                }}
                                onMouseLeave={e => {
                                  (e.currentTarget as HTMLElement).style.background = 'white';
                                  (e.currentTarget as HTMLElement).style.color = '#1A5DA8';
                                }}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Rating buttons */}
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => rateMessage(msg.id, 'up')}
                            style={{
                              background: msg.rating === 'up' ? '#D1FAE5' : 'transparent',
                              border: '1px solid',
                              borderColor: msg.rating === 'up' ? '#27AE60' : '#E8EDF5',
                              borderRadius: 6, padding: '2px 6px', cursor: 'pointer',
                              color: msg.rating === 'up' ? '#27AE60' : '#AABBCC',
                              transition: 'all 0.15s',
                            }}
                            title="Utile"
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => rateMessage(msg.id, 'down')}
                            style={{
                              background: msg.rating === 'down' ? '#FEE2E2' : 'transparent',
                              border: '1px solid',
                              borderColor: msg.rating === 'down' ? '#EF4444' : '#E8EDF5',
                              borderRadius: 6, padding: '2px 6px', cursor: 'pointer',
                              color: msg.rating === 'down' ? '#EF4444' : '#AABBCC',
                              transition: 'all 0.15s',
                            }}
                            title="Pas utile"
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Quick actions after welcome */}
              {showQuickActions && messages.length <= 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}>
                  {quickActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickAction(action.message)}
                      style={{
                        background: 'white', color: '#1A5DA8',
                        border: '1px solid #C8D9F0',
                        borderRadius: 10, padding: '8px 6px',
                        fontSize: 12, cursor: 'pointer',
                        fontFamily: 'DM Sans, sans-serif', fontWeight: 500,
                        textAlign: 'center', lineHeight: 1.3,
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = '#EEF4FF';
                        (e.currentTarget as HTMLElement).style.borderColor = '#1A5DA8';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = 'white';
                        (e.currentTarget as HTMLElement).style.borderColor = '#C8D9F0';
                      }}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mr-1.5" style={{ background: '#1A5DA8' }}>
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div
                    className="px-3.5 py-2.5 flex items-center gap-2"
                    style={{ background: 'white', borderRadius: '18px 18px 18px 4px', border: '1px solid #E8EDF5' }}
                  >
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: '#1A5DA8' }}
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                    {loadingMessage && (
                      <span style={{ fontSize: 11, color: '#7A8FA6', fontFamily: 'DM Sans, sans-serif' }}>
                        {loadingMessage}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── INPUT ZONE ──────────────────────────────────────────── */}
            <div style={{ background: 'white', borderTop: '1px solid #E8EDF5', flexShrink: 0 }}>
              {/* Voice listening bar */}
              {isListening && (
                <div
                  className="flex items-center gap-2 px-3 py-2"
                  style={{ background: '#FEF2F2', borderBottom: '1px solid #FECACA' }}
                >
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span style={{ fontSize: 12, color: '#DC2626', fontFamily: 'DM Sans, sans-serif', flex: 1 }}>
                    {({ fr: 'Parlez maintenant... (silence → envoi auto)', ar: 'تكلم الآن... (سكوت = إرسال تلقائي)', tn: 'Hka taw... (soket = yeb3ath wahdou)', en: 'Speak now... (silence → auto send)', it: 'Parla ora... (silenzio = invio auto)' } as Record<Lang, string>)[currentLanguage] ?? 'Parlez maintenant...'}
                  </span>
                  {interimTranscript && (
                    <span style={{ fontSize: 11, color: '#7A8FA6', fontStyle: 'italic', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {interimTranscript}
                    </span>
                  )}
                </div>
              )}

              {/* Image preview */}
              {imagePreview && (
                <div style={{ padding: '8px 12px 0', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={imagePreview} alt="Preview" style={{ height: '60px', width: '60px', objectFit: 'cover', borderRadius: '8px', border: '1.5px solid #E8EDF5' }} />
                    <button
                      onClick={() => { setImagePreview(null); setInputValue(''); }}
                      style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', background: '#EF4444', border: 'none', borderRadius: '50%', color: 'white', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >✕</button>
                  </div>
                  <span style={{ fontSize: '11px', color: '#81C063', fontFamily: 'DM Sans, sans-serif', alignSelf: 'center', fontWeight: 600 }}>
                    {({ fr: '📸 Photo prête', ar: '📸 الصورة جاهزة', tn: '📸 Tsawra 7adra', en: '📸 Photo ready', it: '📸 Foto pronta' } as Record<string, string>)[currentLanguage] ?? '📸 Photo prête'}
                  </span>
                </div>
              )}

              <div className="flex items-end gap-2 p-3">
                {/* Mic button — pulsing ring when active */}
                {voiceSupported && (
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    {isListening && (
                      <span className="animate-ping" style={{
                        position: 'absolute', inset: '-4px', borderRadius: '50%',
                        border: '2px solid #EF4444', opacity: 0.5,
                        pointerEvents: 'none',
                      }} />
                    )}
                    <button
                      onClick={handleVoiceInput}
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                      style={{
                        background: isListening ? '#EF4444' : '#F1F5F9',
                        color: isListening ? 'white' : '#64748B',
                        border: 'none', cursor: 'pointer',
                      }}
                      title={isListening ? 'Arrêter l\'enregistrement' : 'Envoyer un message vocal'}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                  </div>
                )}

                {/* Camera / image upload */}
                {/* Hidden camera input — capture="environment" opens camera directly on mobile */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture={isMobile ? 'environment' : undefined}
                  style={{ display: 'none' }}
                  onChange={handleImageSelect}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center transition-all"
                  style={{
                    background: imagePreview ? 'rgba(129,192,99,0.15)' : 'transparent',
                    color: imagePreview ? '#81C063' : '#94A3B8',
                    border: imagePreview ? '1px solid rgba(129,192,99,0.4)' : 'none',
                  }}
                  title={isMobile ? 'Prendre une photo' : 'Partager une photo'}
                >
                  <Camera className="w-4 h-4" />
                </button>

                {/* Textarea */}
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={awaitingDimensions
                    ? (PLACEHOLDER_DIMS[currentLanguage] || PLACEHOLDER_DIMS.fr)
                    : (PLACEHOLDER_NORMAL[currentLanguage] || PLACEHOLDER_NORMAL.fr)
                  }
                  rows={1}
                  style={{
                    flex: 1, resize: 'none', border: '1px solid #E8EDF5',
                    borderRadius: 12, padding: '8px 12px',
                    fontSize: 14, fontFamily: 'DM Sans, sans-serif',
                    outline: 'none', maxHeight: '96px', overflowY: 'auto',
                    lineHeight: 1.5, color: '#0D1B2A',
                  }}
                  onInput={e => {
                    const el = e.currentTarget;
                    el.style.height = 'auto';
                    el.style.height = Math.min(el.scrollHeight, 96) + 'px';
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#1A5DA8')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#E8EDF5')}
                  disabled={isLoading}
                />

                {/* Send button */}
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading}
                  className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center transition-all"
                  style={{
                    background: inputValue.trim() && !isLoading ? '#1A5DA8' : '#E8EDF5',
                    color: inputValue.trim() && !isLoading ? 'white' : '#AABBCC',
                    cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  }}
                >
                  {isLoading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
