import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Ruler, CheckCircle2 } from 'lucide-react';
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
  onCommande?: (largeur: number, hauteur: number) => void;
}

const MeasurementGuide: React.FC<Props> = ({ productId, productName, onClose }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [reference, setReference] = useState('');
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

  const gotoStep = useCallback((n: number) => {
    setStep(n);
    setAnimKey(k => k + 1);
  }, []);

  const next = useCallback(() => gotoStep(Math.min(step + 1, TOTAL_STEPS - 1)), [step, gotoStep]);
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
      doc.text(`DIMENSIONS : ${minL ?? '—'} mm × ${minH ?? '—'} cm`, 105, 183, { align: 'center' });

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
      svg: submitSuccess ? <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><CheckCircle2 size={64} color="#16A34A" /><p style={{ fontSize: 18, fontWeight: 'bold', color: '#16A34A', marginTop: 12 }}>{reference}</p></div> : <TipsSVG k={animKey} />,
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
        background: 'rgba(13,27,42,0.85)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes subtlePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(37,99,235,0.3); }
          50%       { box-shadow: 0 0 0 6px rgba(37,99,235,0); }
        }
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>

        <div
          style={{
            background: '#fff',
            borderRadius: 24,
            width: '100%',
            maxWidth: 480,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
            position: 'relative',
            overflow: 'hidden',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Always-visible absolute Close Button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              zIndex: 100,
              background: 'white',
              border: '1px solid #E5E7EB',
              cursor: 'pointer',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6B7280',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.color = '#EF4444'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.color = '#6B7280'; }}
          >
            <X size={20} />
          </button>
        {/* HEADER — fixed */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid #F3F4F6',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EEF4FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ruler size={18} color="#2563EB" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#111827', letterSpacing: '0.02em' }}>{t('measureGuide.badge')}</div>
              <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 500 }}>{productName} — {t('measureGuide.stepOf', { current: step + 1, total: TOTAL_STEPS })}</div>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12,
            overflowX: 'auto',
            paddingBottom: '4px',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch'
          }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'nowrap' }}>
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => gotoStep(i)}
                  style={{
                    width: 'clamp(26px, 6vw, 32px)', 
                    height: 'clamp(26px, 6vw, 32px)',
                    borderRadius: '50%',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 'clamp(10px, 3vw, 12px)',
                    fontWeight: 800,
                    background: i < step
                      ? '#16A34A'
                      : i === step
                        ? '#2563EB'
                        : '#F3F4F6',
                    color: i <= step ? '#fff' : '#9CA3AF',
                    transition: 'all 0.2s',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {i < step ? <CheckCircle2 size={16} /> : i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              style={{ background: '#F3F4F6', border: 'none', cursor: 'pointer', width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#E5E7EB'}
              onMouseLeave={e => e.currentTarget.style.background = '#F3F4F6'}
            >
              <X size={18} />
            </button>
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
            background: cur.warning ? 'linear-gradient(to bottom, #FEF2F2, #fff)' : 'linear-gradient(160deg, #F8FAFC 0%, #EFF6FF 100%)',
            padding: '24px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #F3F4F6',
            minHeight: 210,
          }}>
            {cur.svg}
          </div>

          <div key={step} style={{
            padding: '24px 24px 0',
            animation: 'slideIn 0.3s ease-out',
            borderLeft: cur.warning ? '4px solid #EF4444' : 'none',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: cur.warning ? '#EF4444' : '#2563EB', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
              {cur.sub}
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 12px', lineHeight: 1.2 }}>
              {cur.title}
            </h3>
            <p style={{ fontSize: 14, color: '#4B5563', lineHeight: 1.6, whiteSpace: 'pre-line', margin: 0 }}>
              {cur.desc}
            </p>

            {/* Interactive inputs for Step 3 (Largeur) */}
            {step === 3 && (
              <div style={{
                background: '#F8FAFF',
                border: '1.5px solid #E0E7FF',
                borderRadius: 14,
                padding: '16px',
                marginTop: 16,
              }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', letterSpacing: '0.08em', marginBottom: 10, textTransform: 'uppercase' }}>
                  {t('measureGuide.inputLabel')}
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['l1', 'l2', 'l3'] as const).map((key, i) => (
                    <div key={key} style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, color: '#9CA3AF', display: 'block', marginBottom: 4, textAlign: 'center' }}>L{i + 1}</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder="ex: 120"
                        value={measL[key]}
                        onChange={e => setMeasL((p: any) => ({ ...p, [key]: e.target.value }))}
                        style={{
                          width: '100%', padding: '10px 8px', borderRadius: 10, border: '1.5px solid #D1D5DB',
                          fontSize: 15, textAlign: 'center', fontWeight: 600, outline: 'none', boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  ))}
                </div>
                {minL && (
                  <div style={{ marginTop: 12, padding: '10px 14px', background: '#ECFDF5', border: '1.5px solid #6EE7B7', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>✅</span>
                    <div>
                      <p style={{ fontSize: 11, color: '#065F46', fontWeight: 600 }}>{t('measureGuide.yourDimension', { dim: 'LARGEUR L' })}</p>
                      <p style={{ fontSize: 22, fontWeight: 800, color: '#059669' }}>{minL} cm</p>
                    </div>
                  </div>
                )}
                {(measL.l1 || measL.l2 || measL.l3) && (
                  <p style={{ fontSize: 11, color: '#16A34A', textAlign: 'right', marginTop: 4 }}>
                    {t('measureGuide.saved')}
                  </p>
                )}
              </div>
            )}

            {/* Interactive inputs for Step 4 (Hauteur) */}
            {step === 4 && (
              <div style={{
                background: '#F8FAFF',
                border: '1.5px solid #E0E7FF',
                borderRadius: 14,
                padding: '16px',
                marginTop: 16,
              }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', letterSpacing: '0.08em', marginBottom: 10, textTransform: 'uppercase' }}>
                  {t('measureGuide.inputLabel')}
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['h1', 'h2', 'h3'] as const).map((key, i) => (
                    <div key={key} style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, color: '#9CA3AF', display: 'block', marginBottom: 4, textAlign: 'center' }}>H{i + 1}</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder="ex: 150"
                        value={measH[key]}
                        onChange={e => setMeasH((p: any) => ({ ...p, [key]: e.target.value }))}
                        style={{
                          width: '100%', padding: '10px 8px', borderRadius: 10, border: '1.5px solid #D1D5DB',
                          fontSize: 15, textAlign: 'center', fontWeight: 600, outline: 'none', boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  ))}
                </div>
                {minH && (
                  <div style={{ marginTop: 12, padding: '10px 14px', background: '#ECFDF5', border: '1.5px solid #6EE7B7', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>✅</span>
                    <div>
                      <p style={{ fontSize: 11, color: '#065F46', fontWeight: 600 }}>{t('measureGuide.yourDimension', { dim: 'HAUTEUR H' })}</p>
                      <p style={{ fontSize: 22, fontWeight: 800, color: '#059669' }}>{minH} cm</p>
                    </div>
                  </div>
                )}
                {(measH.h1 || measH.h2 || measH.h3) && (
                  <p style={{ fontSize: 11, color: '#16A34A', textAlign: 'right', marginTop: 4 }}>
                    {t('measureGuide.saved')}
                  </p>
                )}
              </div>
            )}

            {/* Final Step placeholder/Recap SVG is handled in SVG section above */}
            {step === 5 && !minL && !minH && (
              <p style={{ textAlign: 'center', color: '#9CA3AF', marginTop: 20, fontSize: 14 }}>
                {t('measureGuide.noMeasures')}
              </p>
            )}

            {/* Step 6: Client details */}
            {step === 6 && !submitSuccess && (
              <div style={{ marginTop: 20 }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>{t('measureGuide.clientStep.nameLabel')}</label>
                  <input
                    type="text"
                    placeholder={t('measureGuide.clientStep.namePlaceholder')}
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1.5px solid #D1D5DB', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>{t('measureGuide.clientStep.phoneLabel')}</label>
                  <input
                    type="tel"
                    placeholder={t('measureGuide.clientStep.phonePlaceholder')}
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    pattern="[0-9]{8}"
                    style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1.5px solid #D1D5DB', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER — fixed */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #F3F4F6',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          background: '#fff',
        }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={prev}
              disabled={step === 0}
              style={{
                flex: 1,
                height: 48,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: step === 0 ? '#F9FAFB' : '#fff',
                border: '1.5px solid #E5E7EB',
                color: step === 0 ? '#9CA3AF' : '#374151',
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
                  background: '#2563EB',
                  border: 'none',
                  color: 'white',
                  borderRadius: 14,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(37,99,235,0.2)',
                  animation: step !== 3 && step !== 4 ? 'subtlePulse 2s ease infinite' : 'none',
                }}
              >
                {t('measureGuide.next')}
                <ChevronRight size={18} />
              </button>
            ) : !submitSuccess ? (
              <button
                onClick={async () => {
                  if (clientName && clientPhone.match(/^\d{8}$/)) {
                    const req = await saveMeasureRequest({
                      productId,
                      productName,
                      width: minL,
                      height: minH,
                      clientName,
                      clientPhone
                    });
                    setReference(req.id.split('-')[0].toUpperCase());
                    setSubmitSuccess(true);
                  }
                }}
                disabled={!clientName || !clientPhone.match(/^\d{8}$/)}
                style={{
                  flex: 2,
                  height: 48,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: clientName && clientPhone.match(/^\d{8}$/) ? 'linear-gradient(135deg, #16A34A, #22C55E)' : '#9CA3AF',
                  border: 'none',
                  color: 'white',
                  borderRadius: 14,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: clientName && clientPhone.match(/^\d{8}$/) ? 'pointer' : 'not-allowed',
                  boxShadow: clientName && clientPhone.match(/^\d{8}$/) ? '0 4px 12px rgba(22,163,74,0.2)' : 'none',
                }}
              >
                {t('measureGuide.clientStep.submitBtn')}
              </button>
            ) : (
              <button
                onClick={onClose}
                style={{ flex: 2, height: 48, background: '#F3F4F6', border: 'none', borderRadius: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                {t('common.close')}
              </button>
            )}
          </div>

          {/* UPGRADE 4 — PDF Button */}
          {step === 5 && (
            <button
              onClick={downloadMemoPDF}
              style={{
                width: '100%',
                padding: '13px',
                background: 'transparent',
                color: '#1B3A6B',
                border: '1.5px solid #1B3A6B',
                borderRadius: 14,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#EFF6FF';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {t('measureGuide.downloadMemo')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeasurementGuide;
