import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Ruler, CheckCircle2, Loader2, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { saveMeasureRequest } from '../../store/measureRequestsStore';
import {
  ToolsSVG, EmbrasureSVG, LargeurSVG,
  HauteurSVG, TipsSVG, MistakesSVG, RecapSVG
} from './MeasureIllustrations';

const MEASURE_EXAMPLES: Record<string, { l: string, h: string, type: string }> = {
  'colibri-50': { l: '1 200', h: '1 500', type: 'fenêtre' },
  'sidney-50': { l: '1 400', h: '2 100', type: 'porte ou fenêtre' },
  'sidney-50-ac': { l: '2 800', h: '2 200', type: 'grande baie' },
  'elba': { l: '800', h: '1 200', type: 'fenêtre' },
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
interface Props {
  productId: string;
  productName: string;
  onClose: () => void;
}

const MeasurementGuide: React.FC<Props> = ({ productId, productName, onClose }) => {
  const { t, i18n } = useTranslation();
  const l1Ref = useRef<HTMLInputElement>(null);
  const l2Ref = useRef<HTMLInputElement>(null);
  const l3Ref = useRef<HTMLInputElement>(null);
  const h1Ref = useRef<HTMLInputElement>(null);
  const h2Ref = useRef<HTMLInputElement>(null);
  const h3Ref = useRef<HTMLInputElement>(null);
  const clientNameRef = useRef<HTMLInputElement>(null);
  const clientPhoneRef = useRef<HTMLInputElement>(null);
  const clientEmailRef = useRef<HTMLInputElement>(null);
  const clientAddressRef = useRef<HTMLInputElement>(null);
  const quantityRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const [step, setStep] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [reference, setReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const isAr = i18n.language === 'ar' || i18n.language === 'tn';
  const isDoor = productId.startsWith('sidney');
  const TOTAL_STEPS = 7;

  // UPGRADE 2 — localStorage PERSISTENCE
  const STORAGE_KEY = `measure_${productId}`;

  const [measL, setMeasLState] = useState<{ l1: string; l2: string; l3: string }>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.l ?? { l1: '', l2: '', l3: '' };
      }
    } catch { }
    return { l1: '', l2: '', l3: '' };
  });

  const [measH, setMeasHState] = useState<{ h1: string; h2: string; h3: string }>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.h ?? { h1: '', h2: '', h3: '' };
      }
    } catch { }
    return { h1: '', h2: '', h3: '' };
  });

  const setMeasL = (updater: any) => {
    setMeasLState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const existing = saved ? JSON.parse(saved) : {};
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, l: next }));
      } catch { }
      return next;
    });
  };

  const setMeasH = (updater: any) => {
    setMeasHState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const existing = saved ? JSON.parse(saved) : {};
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, h: next }));
      } catch { }
      return next;
    });
  };

  // Computed min values
  const filteredL = [measL.l1, measL.l2, measL.l3].map(Number).filter(v => v > 0);
  const minL = filteredL.length > 0 ? Math.min(...filteredL) : null;
  const filteredH = [measH.h1, measH.h2, measH.h3].map(Number).filter(v => v > 0);
  const minH = filteredH.length > 0 ? Math.min(...filteredH) : null;

  const example = MEASURE_EXAMPLES[productId] ?? MEASURE_EXAMPLES['colibri-50'];

  // Step validation gating
  const gotoStep = useCallback((n: number) => {
    setSlideDirection(n > step ? 'right' : 'left');
    setStep(n);
    setAnimKey(k => k + 1);
  }, [step]);

  const next = useCallback(() => {
    gotoStep(Math.min(step + 1, TOTAL_STEPS - 1));
  }, [step, gotoStep]);
  const prev = useCallback(() => gotoStep(Math.max(step - 1, 0)), [step, gotoStep]);

  // Keyboard navigation
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [step, next, prev, onClose]);

  // UPGRADE 4 — PDF MEMO EXPORT
  const downloadMemoPDF = () => {
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF();

      // Header
      doc.setFillColor(27, 58, 107); // dark blue
      doc.rect(0, 0, 210, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('ALUMINIUM SPACE', 15, 15);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Mémo de mesures — ' + productName, 15, 25);

      // Date
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(9);
      doc.text('Généré le ' + new Date().toLocaleDateString('fr-TN'), 15, 32);

      // Product info
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Produit : ' + productName, 15, 50);

      // Measurements table
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      // L values
      doc.setFillColor(239, 246, 255);
      doc.rect(15, 60, 180, 45, 'F');
      doc.setTextColor(37, 99, 235);
      doc.setFont('helvetica', 'bold');
      doc.text('LARGEUR (L)', 20, 72);
      doc.setTextColor(30, 30, 30);
      doc.setFont('helvetica', 'normal');
      doc.text(`L1 = ${measL.l1 || '—'} cm`, 20, 83);
      doc.text(`L2 = ${measL.l2 || '—'} cm`, 75, 83);
      doc.text(`L3 = ${measL.l3 || '—'} cm`, 130, 83);
      doc.setTextColor(37, 99, 235);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(`→ L à commander : ${minL ?? '—'} cm`, 20, 97);

      // H values
      doc.setFontSize(11);
      doc.setFillColor(236, 253, 245);
      doc.rect(15, 112, 180, 45, 'F');
      doc.setTextColor(5, 150, 105);
      doc.setFont('helvetica', 'bold');
      doc.text('HAUTEUR (H)', 20, 124);
      doc.setTextColor(30, 30, 30);
      doc.setFont('helvetica', 'normal');
      doc.text(`H1 = ${measH.h1 || '—'} cm`, 20, 135);
      doc.text(`H2 = ${measH.h2 || '—'} cm`, 75, 135);
      doc.text(`H3 = ${measH.h3 || '—'} cm`, 130, 135);
      doc.setTextColor(5, 150, 105);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(`→ H à commander : ${minH ?? '—'} cm`, 20, 149);

      // Final dimensions box
      doc.setFillColor(27, 58, 107);
      doc.rect(15, 165, 180, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`DIMENSIONS : ${minL ?? '—'} cm × ${minH ?? '—'} cm`, 105, 183, { align: 'center' });

      // Footer
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('aluminium-space.tn — Ce mémo est valable 30 jours', 105, 285, { align: 'center' });

      doc.save(`mesures-${productId}-${Date.now()}.pdf`);
    });
  };

  // UPGRADE 5 — i18n EXTERNALIZATION
  const steps = [
    {
      sub: t('measureGuide.steps.tools.sub'),
      title: t('measureGuide.steps.tools.title'),
      desc: t('measureGuide.steps.tools.desc'),
      svg: <ToolsSVG k={animKey} />,
    },
    {
      sub: t('measureGuide.steps.embrasure.sub'),
      title: isDoor ? t('measureGuide.steps.embrasure.title_porte', "Identifier l'embrasure de porte") : t('measureGuide.steps.embrasure.title_fenetre', "Identifier l'embrasure de fenêtre"),
      desc: t('measureGuide.steps.embrasure.desc'),
      svg: <EmbrasureSVG k={animKey} isDoor={isDoor} />,
    },
    {
      sub: t('measureGuide.steps.mistakes.sub'),
      title: t('measureGuide.steps.mistakes.title'),
      desc: t('measureGuide.steps.mistakes.desc'),
      svg: <MistakesSVG k={animKey} />,
      warning: true
    },
    {
      sub: t('measureGuide.steps.largeur.sub'),
      title: t('measureGuide.steps.largeur.title'),
      desc: t('measureGuide.steps.largeur.desc', { type: example.type, example: example.l }),
      svg: <LargeurSVG k={animKey} isDoor={isDoor} />,
    },
    {
      sub: t('measureGuide.steps.hauteur.sub'),
      title: t('measureGuide.steps.hauteur.title'),
      desc: t('measureGuide.steps.hauteur.desc', { example: example.h }),
      svg: <HauteurSVG k={animKey} isDoor={isDoor} />,
    },
    {
      sub: t('measureGuide.steps.recap.sub'),
      title: t('measureGuide.steps.recap.title'),
      desc: step === 5 ? t('measureGuide.steps.recap.desc', { l: minL || '—', h: minH || '—' }) : '',
      svg: step === 5 ? (
        minL || minH ? (
          <RecapSVG L={minL} H={minH} productType={isDoor ? 'porte' : 'fenetre'} />
        ) : (
          <TipsSVG k={animKey} />
        )
      ) : <TipsSVG k={animKey} />,
    },
    {
      sub: t('measureGuide.clientStep.sub'),
      title: submitSuccess ? t('measureGuide.clientStep.successTitle') : t('measureGuide.clientStep.title'),
      desc: submitSuccess ? t('measureGuide.clientStep.successDesc') : t('measureGuide.clientStep.desc'),
      svg: submitSuccess ? <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #D4AF37, #B8963E)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(212,175,55,0.4)' }}><CheckCircle2 size={40} color="#0F172A" /></div>
        <div style={{ marginTop: 16, padding: '8px 20px', background: 'rgba(212,175,55,0.15)', border: '1px solid #D4AF37', borderRadius: 20, fontSize: 16, fontWeight: 800, color: '#D4AF37', letterSpacing: '2px' }}>{reference}</div>
        <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 20px', width: '100%', maxWidth: 260 }}>
          <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Résumé</p>
          <p style={{ fontSize: 14, color: '#fff', margin: '0 0 4px', fontWeight: 600 }}>{productName}</p>
          <p style={{ fontSize: 13, color: '#D4AF37', margin: 0, fontWeight: 700 }}>{minL ?? '—'} × {minH ?? '—'} cm — Qté: {quantity}</p>
        </div>
      </div> : <TipsSVG k={animKey} />,
    },
  ];

  const cur = steps[step];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(12px)',
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes goldPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212,175,55,0.3); }
          50%       { box-shadow: 0 0 0 6px rgba(212,175,55,0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes successPop {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .mg-input:focus { border-color: #D4AF37 !important; box-shadow: 0 0 0 3px rgba(212,175,55,0.2) !important; }
        .mg-header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 52px 14px 24px; /* 52px right padding to prevent overlapping with absolute close button */
          gap: 16px;
        }
        .mg-steps-container {
          display: flex;
          gap: 6px;
          align-items: center;
          flex-wrap: nowrap;
          overflow-x: auto;
          overflow-y: visible;
          scrollbar-width: none;
          -ms-overflow-style: none;
          padding: 4px 44px 4px 4px; /* 44px right padding to make room for X button */
        }
        .mg-steps-container::-webkit-scrollbar {
          display: none;
        }
        .mg-modal-header {
          padding: 0;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          flex-shrink: 0;
        }
        .mg-modal-body {
          padding: 24px 24px 0;
          box-sizing: border-box;
          width: 100%;
        }
        .mg-modal-footer {
          padding: 16px 24px;
          border-top: 1px solid rgba(255,255,255,0.08);
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: rgba(15,23,42,0.6);
        }
        .mg-footer-buttons {
          display: flex;
          gap: 12px;
          align-items: center;
          width: 100%;
        }
        .mg-step-circle {
          width: 26px;
          height: 26px;
          min-width: 26px;
          min-height: 26px;
          font-size: 11px;
          border-radius: 50%;
          cursor: pointer;
          font-weight: 800;
          transition: all 0.2s;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        @media (max-width: 480px) {
          .mg-header-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
            padding: 16px 48px 14px 16px; /* 48px right padding to clear absolute close button */
          }
          .mg-steps-container {
            width: 100%;
          }
          .mg-modal-body {
            padding: 16px 16px 0;
          }
          .mg-modal-footer {
            padding: 12px 16px;
          }
        }
        @media (max-width: 360px) {
          .mg-footer-buttons {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
          }
        }
      `}</style>

      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 24,
          width: '100%',
          maxWidth: 'min(480px, 95vw)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          position: 'relative',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 10,
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            cursor: 'pointer',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.6)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
        >
          <X size={20} />
        </button>
        {/* HEADER */}
        <div className="mg-modal-header">
          {/* Gold accent line */}
          <div style={{ height: 3, background: 'linear-gradient(90deg, #D4AF37, #B8963E, #D4AF37)' }} />
          <div className="mg-header-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Ruler size={18} color="#D4AF37" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.02em' }}>{t('measureGuide.badge')}</div>
                <div style={{ fontSize: 11, color: '#D4AF37', fontWeight: 500 }}>{productName} — {t('measureGuide.stepOf', { current: step + 1, total: TOTAL_STEPS })}</div>
              </div>
            </div>

            <div className="mg-steps-container">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => gotoStep(i)}
                  className="mg-step-circle"
                  style={{
                    border: i === step ? '2px solid #D4AF37' : i < step ? 'none' : '1.5px solid rgba(255,255,255,0.25)',
                    background: i < step ? '#D4AF37' : i === step ? '#FFFFFF' : 'transparent',
                    color: i < step ? '#0F172A' : i === step ? '#0F172A' : 'rgba(255,255,255,0.4)',
                    boxShadow: i === step ? '0 0 0 3px rgba(212,175,55,0.25)' : 'none',
                  }}
                >
                  {i < step ? <CheckCircle2 size={14} /> : i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* BODY — scrollable */}
        <div style={{
          overflowY: 'auto',
          flex: 1,
          padding: '0 0 24px',
        }}>
          {/* SVG illustration */}
          <div style={{
            background: cur.warning ? 'rgba(220,38,38,0.08)' : 'rgba(255,255,255,0.03)',
            padding: '24px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            minHeight: 210,
          }}>
            {cur.svg}
          </div>

          <div key={step} className="mg-modal-body" style={{
            animation: slideDirection === 'right' ? 'slideInRight 0.3s ease-out' : 'slideInLeft 0.3s ease-out',
            borderLeft: cur.warning ? '4px solid #EF4444' : 'none',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: cur.warning ? '#EF4444' : '#D4AF37', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
              {cur.sub}
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', margin: '0 0 12px', lineHeight: 1.2 }}>
              {cur.title}
            </h3>
            <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.6, whiteSpace: 'pre-line', margin: 0 }}>
              {cur.desc}
            </p>

            {/* Interactive inputs for Step 3 (Largeur) */}
            {step === 3 && (
              <div style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 14,
                padding: '16px',
                marginTop: 16,
              }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', marginBottom: 10, textTransform: 'uppercase' }}>
                  {t('measureGuide.inputLabel')}
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['l1', 'l2', 'l3'] as const).map((key, i) => (
                    <div key={key} style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, color: '#D4AF37', display: 'block', marginBottom: 4, textAlign: 'center', fontWeight: 700 }}>L{i + 1}</label>
                      <input
                        className="mg-input"
                        ref={i === 0 ? l1Ref : i === 1 ? l2Ref : l3Ref}
                        type="number"
                        inputMode="numeric"
                        placeholder="ex: 120"
                        value={measL[key]}
                        onChange={e => setMeasL((p: any) => ({ ...p, [key]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (i === 0) l2Ref.current?.focus();
                            else if (i === 1) l3Ref.current?.focus();
                            else if (i === 2) next();
                          }
                        }}
                        style={{
                          width: '100%', padding: '10px 8px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)',
                          fontSize: 15, textAlign: 'center', fontWeight: 600, outline: 'none', boxSizing: 'border-box',
                          background: 'rgba(255,255,255,0.05)', color: '#FFFFFF',
                        }}
                      />
                    </div>
                  ))}
                </div>
                {minL && (
                  <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(212,175,55,0.15)', border: '1px solid #D4AF37', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>✅</span>
                    <div>
                      <p style={{ fontSize: 11, color: '#D4AF37', fontWeight: 600 }}>{t('measureGuide.yourDimension', { dim: 'LARGEUR L' })}</p>
                      <p style={{ fontSize: 22, fontWeight: 800, color: '#D4AF37' }}>{minL} cm</p>
                    </div>
                  </div>
                )}
                {(measL.l1 || measL.l2 || measL.l3) && (
                  <p style={{ fontSize: 11, color: '#D4AF37', textAlign: 'right', marginTop: 4 }}>
                    {t('measureGuide.saved')}
                  </p>
                )}
              </div>
            )}

            {/* Interactive inputs for Step 4 (Hauteur) */}
            {step === 4 && (
              <div style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 14,
                padding: '16px',
                marginTop: 16,
              }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', marginBottom: 10, textTransform: 'uppercase' }}>
                  {t('measureGuide.inputLabel')}
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['h1', 'h2', 'h3'] as const).map((key, i) => (
                    <div key={key} style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, color: '#D4AF37', display: 'block', marginBottom: 4, textAlign: 'center', fontWeight: 700 }}>H{i + 1}</label>
                      <input
                        className="mg-input"
                        ref={i === 0 ? h1Ref : i === 1 ? h2Ref : h3Ref}
                        type="number"
                        inputMode="numeric"
                        placeholder="ex: 150"
                        value={measH[key]}
                        onChange={e => setMeasH((p: any) => ({ ...p, [key]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (i === 0) h2Ref.current?.focus();
                            else if (i === 1) h3Ref.current?.focus();
                            else if (i === 2) next();
                          }
                        }}
                        style={{
                          width: '100%', padding: '10px 8px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)',
                          fontSize: 15, textAlign: 'center', fontWeight: 600, outline: 'none', boxSizing: 'border-box',
                          background: 'rgba(255,255,255,0.05)', color: '#FFFFFF',
                        }}
                      />
                    </div>
                  ))}
                </div>
                {minH && (
                  <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(212,175,55,0.15)', border: '1px solid #D4AF37', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>✅</span>
                    <div>
                      <p style={{ fontSize: 11, color: '#D4AF37', fontWeight: 600 }}>{t('measureGuide.yourDimension', { dim: 'HAUTEUR H' })}</p>
                      <p style={{ fontSize: 22, fontWeight: 800, color: '#D4AF37' }}>{minH} cm</p>
                    </div>
                  </div>
                )}
                {(measH.h1 || measH.h2 || measH.h3) && (
                  <p style={{ fontSize: 11, color: '#D4AF37', textAlign: 'right', marginTop: 4 }}>
                    {t('measureGuide.saved')}
                  </p>
                )}
              </div>
            )}

            {/* Validation warning */}
            {((step === 3 && filteredL.length < 3) || (step === 4 && filteredH.length < 3)) && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(212,175,55,0.15)', border: '1px solid #D4AF37', borderRadius: 10, fontSize: 13, color: '#D4AF37', fontWeight: 600 }}>
                ⚠️ Dimensions non saisies - vous pourrez les compléter plus tard
              </div>
            )}

            {/* Step 5: Recap empty state */}
            {step === 5 && !minL && !minH && (
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <p style={{ color: '#94A3B8', fontSize: 14, marginBottom: 16 }}>
                  ⚠️ Vous n'avez pas saisi vos dimensions. Retournez aux étapes 4 et 5 pour mesurer.
                </p>
                <button
                  onClick={() => gotoStep(3)}
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37, #B8963E)',
                    color: '#0F172A',
                    border: 'none',
                    borderRadius: 10,
                    padding: '10px 24px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  Retour aux mesures
                </button>
              </div>
            )}

            {/* Step 6: Client details */}
            {step === 6 && !submitSuccess && (
              <div style={{ marginTop: 20 }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>{t('measureGuide.clientStep.nameLabel')} <span style={{ color: '#D4AF37' }}>*</span></label>
                  <input
                    ref={clientNameRef}
                    className="mg-input"
                    type="text"
                    inputMode="text"
                    autoCapitalize="words"
                    autoComplete="name"
                    placeholder={t('measureGuide.clientStep.namePlaceholder')}
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        clientPhoneRef.current?.focus();
                      }
                    }}
                    style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', fontSize: 15, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', color: '#FFFFFF' }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>{t('measureGuide.clientStep.phoneLabel')} <span style={{ color: '#D4AF37' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      ref={clientPhoneRef}
                      className="mg-input"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder={t('measureGuide.clientStep.phonePlaceholder')}
                      value={clientPhone}
                      onChange={e => { setClientPhone(e.target.value); setSubmitError(''); }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          clientEmailRef.current?.focus();
                        }
                      }}
                      pattern="[0-9]{8}"
                      style={{ width: '100%', padding: '12px', paddingRight: 40, borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', fontSize: 15, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', color: '#FFFFFF' }}
                    />
                    {clientPhone && (
                      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>
                        {clientPhone.match(/^\d{8}$/) ? <CheckCircle2 size={18} color="#D4AF37" /> : <span style={{ color: '#EF4444', fontSize: 12, fontWeight: 600 }}>8 chiffres</span>}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                    {isAr ? 'البريد الإلكتروني' : 'Email'}
                  </label>
                  <input
                    ref={clientEmailRef}
                    className="mg-input"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="votre@email.com"
                    value={clientEmail}
                    onChange={e => setClientEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        clientAddressRef.current?.focus();
                      }
                    }}
                    style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', fontSize: 15, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', color: '#FFFFFF' }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                    {isAr ? 'العنوان' : 'Adresse'}
                  </label>
                  <input
                    ref={clientAddressRef}
                    className="mg-input"
                    type="text"
                    inputMode="text"
                    autoCapitalize="words"
                    autoComplete="street-address"
                    placeholder={isAr ? 'العنوان الكامل' : 'Votre adresse complète'}
                    value={clientAddress}
                    onChange={e => setClientAddress(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        quantityRef.current?.focus();
                      }
                    }}
                    style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', fontSize: 15, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', color: '#FFFFFF' }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                    {isAr ? 'الكمية' : 'Quantité'} <span style={{ color: '#D4AF37' }}>*</span>
                  </label>
                  <input
                    ref={quantityRef}
                    className="mg-input"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="50"
                    value={quantity}
                    onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        notesRef.current?.focus();
                      }
                    }}
                    required
                    style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', fontSize: 15, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', color: '#FFFFFF' }}
                  />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                    {isAr ? 'ملاحظات' : 'Commentaires / Remarques'}
                  </label>
                  <textarea
                    ref={notesRef}
                    className="mg-input"
                    rows={3}
                    placeholder={isAr ? 'اللون المفضل، تفاصيل إضافية...' : 'Couleur souhaitée, contraintes particulières...'}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        submitButtonRef.current?.click();
                      }
                    }}
                    style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', background: 'rgba(255,255,255,0.05)', color: '#FFFFFF' }}
                  />
                </div>
                {submitError && (
                  <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: 13, color: '#FCA5A5', fontWeight: 600, marginBottom: 12 }}>
                    ❌ {submitError}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="mg-modal-footer">
          <div className="mg-footer-buttons">
            <button
              onClick={prev}
              disabled={step === 0}
              style={{
                flex: 1,
                height: 48,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: 'transparent',
                border: step === 0 ? '1.5px solid rgba(255,255,255,0.1)' : '1.5px solid rgba(255,255,255,0.3)',
                color: step === 0 ? 'rgba(255,255,255,0.2)' : '#FFFFFF',
                borderRadius: 14,
                fontWeight: 700,
                fontSize: 14,
                cursor: step === 0 ? 'default' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <ChevronLeft size={18} />
              {t('measureGuide.prev')}
            </button>

            {step < TOTAL_STEPS - 1 ? (
              <button
                onClick={next}
                style={{
                  flex: 1.5,
                  height: 48,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  background: 'linear-gradient(135deg, #D4AF37, #B8963E)',
                  border: 'none',
                  color: '#0F172A',
                  borderRadius: 14,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(212,175,55,0.3)',
                  animation: step !== 3 && step !== 4 ? 'goldPulse 2s ease infinite' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {t('measureGuide.next')}
                <ChevronRight size={18} />
              </button>
            ) : !submitSuccess ? (
              <button
                ref={submitButtonRef}
                onClick={async () => {
                  if (clientName && clientPhone.match(/^\d{8}$/) && !isSubmitting) {
                    downloadMemoPDF();
                    setIsSubmitting(true);
                    setSubmitError('');
                    try {
                      const req = await saveMeasureRequest({
                        productId,
                        productName,
                        width: minL,
                        height: minH,
                        quantity,
                        clientName,
                        clientPhone,
                        clientEmail,
                        clientAddress,
                        notes
                      });
                      setReference(req.id.split('-')[0].toUpperCase());
                      setSubmitSuccess(true);
                    } catch (err: any) {
                      setSubmitError(err?.message || 'Erreur lors de l\'envoi. Veuillez réessayer.');
                    } finally {
                      setIsSubmitting(false);
                    }
                  }
                }}
                disabled={!clientName || !clientPhone.match(/^\d{8}$/) || isSubmitting}
                style={{
                  flex: 2,
                  height: 48,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: clientName && clientPhone.match(/^\d{8}$/) && !isSubmitting ? 'linear-gradient(135deg, #D4AF37, #B8963E)' : 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: clientName && clientPhone.match(/^\d{8}$/) && !isSubmitting ? '#0F172A' : 'rgba(255,255,255,0.3)',
                  borderRadius: 14,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: clientName && clientPhone.match(/^\d{8}$/) && !isSubmitting ? 'pointer' : 'not-allowed',
                  boxShadow: clientName && clientPhone.match(/^\d{8}$/) && !isSubmitting ? '0 4px 15px rgba(212,175,55,0.3)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {isSubmitting ? (
                  <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Envoi...</>
                ) : (
                  t('measureGuide.clientStep.submitBtn')
                )}
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8, flex: 2 }}>
                <button
                  onClick={onClose}
                  style={{ flex: 1, height: 48, background: 'linear-gradient(135deg, #D4AF37, #B8963E)', border: 'none', borderRadius: 14, fontWeight: 700, cursor: 'pointer', color: '#0F172A', fontSize: 14, transition: 'all 0.2s' }}
                >
                  {t('common.close')}
                </button>
                <a
                  href="https://wa.me/21657099070"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ flex: 1, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'transparent', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 14, fontWeight: 700, fontSize: 13, color: '#FFFFFF', textDecoration: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <MessageCircle size={16} />
                  WhatsApp
                </a>
              </div>
            )}
          </div>


        </div>
      </div>
    </div>
  );
};

export default MeasurementGuide;
