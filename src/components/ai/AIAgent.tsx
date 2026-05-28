import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send, RotateCcw, Loader2, Bot, ChevronDown,
} from 'lucide-react';
import { useAIAgentContext } from '../../context/AIAgentContext';
import { useAIAgentLogic } from '../../hooks/useAIAgent';
import type { Lang } from '../../context/AIAgentContext';

// ── Markdown-lite renderer ────────────────────────────────────────
function renderText(text: string) {
  // Strip lang tag if present (safety net)
  const clean = text.replace(/^\[lang:(fr|ar|en|it)\]\n?/, '').trim();
  
  return clean.split('\n').map((line, i, arr) => {
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
  en: 'Type your message...', it: 'Scrivi il tuo message...',
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
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages, isLoading, loadingMessage, streamingMessage, sendMessage,
    clearHistory, executeAction,
  } = useAIAgentLogic(
    currentLanguage, pendingMessage, clearPendingMessage, closeAgent, setLanguage,
  );

  const quickActions = QUICK_ACTIONS[currentLanguage] || QUICK_ACTIONS.fr;

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, streamingMessage]);

  // Auto-focus when chat opens (desktop only)
  useEffect(() => {
    if (!isOpen) return;
    if (isMobile) return;
    
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.click();
      }
    }, 350);
    
    return () => clearTimeout(timer);
  }, [isOpen, isMobile]);

  // Focus input when AI response completes
  useEffect(() => {
    if (!isLoading && isOpen && !isMobile) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isLoading, isOpen, isMobile]);


  // Track if waiting for dimensions (from OpenAI tag)
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === 'assistant') {
      setAwaitingDimensions(lastMsg.awaitingDimensions === true);
    }
  }, [messages]);

  const handleSend = useCallback((overrideText?: string) => {
    const textToSanitize = overrideText || inputValue;
    if (!textToSanitize.trim() || isLoading) return;

    const sanitizedMessage = textToSanitize
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // remove script injections
      .replace(/<[^>]*>/g, '') // remove HTML tags
      .trim()
      .slice(0, 500);

    sendMessage(sanitizedMessage);
    setInputValue('');
    setTimeout(() => {
      if (!isMobile) {
        inputRef.current?.focus();
      }
    }, 50);
    setShowQuickActions(false);
  }, [inputValue, isLoading, isMobile, sendMessage]);


  const handleQuickAction = (msg: string) => {
    handleSend(msg);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isMobile) { e.preventDefault(); handleSend(); }
  };

  const statusText = () => {
    return { fr: '● En ligne', ar: '● متصل', tn: '● موجود', en: '● Online', it: '● Online' }[currentLanguage] ?? '● En ligne';
  };

  const statusColor = '#4ADE80';

  return (
    <>
      {/* FAB Button */}
      <motion.button
        onClick={() => { toggleAgent(); }}
        className={`ai-fab-button fixed right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center ${isMobile ? 'bottom-[80px]' : 'bottom-6'}`}
        style={{ background: '#1A5DA8', boxShadow: '0 8px 32px rgba(26,93,168,0.45)' }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Ouvrir l'assistant Asmos"
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
                  alt="Asmos"
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

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: isMobile ? 30 : 20, scale: isMobile ? 1 : 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isMobile ? 30 : 20, scale: isMobile ? 1 : 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              if (!isMobile) inputRef.current?.focus();
            }}
            className={`fixed z-50 flex flex-col overflow-hidden ${isMobile ? 'bottom-0 right-0 left-0 rounded-t-2xl w-full' : 'bottom-24 right-6 rounded-[20px]'}`}
            style={{
              width: isMobile ? '100%' : '380px',
              height: isMobile ? 'min(82svh, calc(100vh - 3.5rem))' : '580px',
              maxHeight: isMobile ? 'calc(100vh - 3.5rem)' : 'calc(100vh - 7rem)',
              background: '#FFFFFF',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            {/* HEADER */}
            <div
              className="flex items-center gap-2 px-3 py-2.5 flex-shrink-0"
              style={{ background: '#0D1B2A', minHeight: '56px' }}
            >
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#1A5DA8', border: '2px solid #4ADE80' }}>
                  {avatarError ? (
                    <Bot className="w-5 h-5 text-white" />
                  ) : (
                    <img
                      src="/images/alu-avatar.png"
                      alt="Asmos"
                      className="w-9 h-9 rounded-full object-cover"
                      onError={() => setAvatarError(true)}
                    />
                  )}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2" style={{ borderColor: '#0D1B2A' }} />
              </div>

              <div className="flex-1 min-w-0">
                <p style={{ color: 'white', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '1px', lineHeight: 1.1 }}>
                  Asmos — Assistant Aluminium Space
                </p>
                <p style={{ fontSize: '10px', fontFamily: 'DM Sans, sans-serif', color: statusColor }}>
                  {statusText()}
                </p>
              </div>

              <button
                onClick={clearHistory}
                className="p-1 rounded"
                style={{ color: 'rgba(255,255,255,0.4)' }}
                title="Réinitialiser"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={closeAgent}
                className="p-1 rounded"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* MESSAGES */}
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
                      dir="auto"
                      className="px-3.5 py-2.5 text-sm leading-relaxed"
                      style={
                        msg.role === 'user'
                          ? {
                            background: '#1A5DA8',
                            color: 'white',
                            borderRadius: '18px 18px 4px 18px',
                            fontFamily: 'DM Sans, sans-serif',
                            unicodeBidi: 'plaintext' as const,
                          }
                          : {
                            background: 'white',
                            color: '#0D1B2A',
                            borderRadius: '18px 18px 18px 4px',
                            border: '1px solid #E8EDF5',
                            fontFamily: 'DM Sans, sans-serif',
                            unicodeBidi: 'plaintext' as const,
                          }
                      }
                    >
                      {renderText(msg.content)}

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

                    {msg.role === 'assistant' && (
                      <div className="mt-1.5 space-y-1.5">
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



                        {msg.suggestions && msg.suggestions.length > 0 && msgIdx === messages.length - 1 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                            {msg.suggestions.map((s, i) => (
                              <button
                                key={i}
                                onClick={() => { handleSend(s); }}
                                style={{
                                  background: 'white', color: '#1A5DA8',
                                  border: '1px solid #C8D9F0',
                                  borderRadius: 20, padding: '4px 10px',
                                  fontSize: 11, cursor: 'pointer',
                                  fontFamily: 'DM Sans, sans-serif', fontWeight: 500,
                                  transition: 'all 0.15s',
                                }}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}


                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Streaming message */}
              {streamingMessage && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mr-1.5 mt-0.5" style={{ background: '#1A5DA8' }}>
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex flex-col max-w-[80%]">
                    <div
                      className="px-3.5 py-2.5 text-sm leading-relaxed"
                      style={{
                        background: 'white',
                        color: '#0D1B2A',
                        borderRadius: '18px 18px 18px 4px',
                        border: '1px solid #E8EDF5',
                        fontFamily: 'DM Sans, sans-serif',
                      }}
                    >
                      {renderText(streamingMessage)}
                      <motion.span
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        style={{ display: 'inline-block', width: '2px', height: '14px', background: '#1A5DA8', marginLeft: '2px', verticalAlign: 'middle' }}
                      >|</motion.span>
                    </div>
                  </div>
                </div>
              )}

              {showQuickActions && messages.length <= 1 && !isLoading && !streamingMessage && (
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
                      }}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}

              {isLoading && !streamingMessage && (
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

            {/* INPUT ZONE */}
            <div style={{ background: 'white', borderTop: '1px solid #E8EDF5', flexShrink: 0 }}>

              <div className="flex items-end gap-2 p-3">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  dir="auto"
                  placeholder={awaitingDimensions
                    ? (PLACEHOLDER_DIMS[currentLanguage] || PLACEHOLDER_DIMS.fr)
                    : (PLACEHOLDER_NORMAL[currentLanguage] || PLACEHOLDER_NORMAL.fr)
                  }
                  rows={1}
                  maxLength={500}
                  style={{
                    flex: 1, resize: 'none', border: '1px solid #E8EDF5',
                    borderRadius: 12, padding: '8px 12px',
                    fontSize: 14, fontFamily: 'DM Sans, sans-serif',
                    outline: 'none', maxHeight: '96px', overflowY: 'auto',
                    lineHeight: 1.5, color: '#0D1B2A',
                    unicodeBidi: 'plaintext' as const,
                  }}
                  onInput={e => {
                    const el = e.currentTarget;
                    el.style.height = 'auto';
                    el.style.height = Math.min(el.scrollHeight, 96) + 'px';
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#1A5DA8';
                    setTimeout(() => {
                      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                  }}
                  onBlur={e => (e.currentTarget.style.borderColor = '#E8EDF5')}
                  disabled={isLoading}
                />


                <button
                  onClick={() => handleSend()}
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
