import { useRef, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface SlideItem {
  title: Record<string, string>;
  afterImage: string;
  productName: string;
}

const slides: SlideItem[] = [
  {
    title: { fr: 'Fenêtre Colibrì 50', ar: 'نافذة Colibrì 50', tn: 'شباك Colibrì 50', en: 'Colibrì 50 Window', it: 'Finestra Colibrì 50' },
    afterImage: '/images/colibri-50.png',
    productName: 'Colibrì 50',
  },
  {
    title: { fr: 'Porte Sidney 50', ar: 'باب Sidney 50', tn: 'باب Sidney 50', en: 'Sidney 50 Door', it: 'Porta Sidney 50' },
    afterImage: '/images/sidney-50.png',
    productName: 'Sidney 50',
  },
  {
    title: { fr: 'Baie Sidney 50 AC', ar: 'شباك Sidney 50 AC', tn: 'شباك Sidney 50 AC', en: 'Sidney 50 AC Bay', it: 'Vetrata Sidney 50 AC' },
    afterImage: '/images/sidney-50-ac.png',
    productName: 'Sidney 50 AC',
  },
];

function SingleSlider({ slide, lang }: { slide: SlideItem; lang: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [splitPct, setSplitPct] = useState(40);
  const dragging = useRef(false);

  const loc = (obj: Record<string, string>) => obj[lang] ?? obj.fr;

  const updateSplit = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.max(8, Math.min(92, ((clientX - rect.left) / rect.width) * 100));
    setSplitPct(pct);
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => { if (dragging.current) updateSplit(e.clientX); };
    const onMouseUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [updateSplit]);

  return (
    <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #DBDADA', boxShadow: '0 4px 24px rgba(29,62,97,0.10)' }}>
      {/* Slide title */}
      <div style={{ background: '#1D3E61', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '14px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'white' }}>
          {loc(slide.title)}
        </span>
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
          ← glisser →
        </span>
      </div>

      {/* Comparison area */}
      <div
        ref={containerRef}
        style={{ position: 'relative', height: '220px', cursor: 'ew-resize', userSelect: 'none', overflow: 'hidden' }}
        onTouchMove={e => updateSplit(e.touches[0].clientX)}
      >
        {/* BEFORE panel (always visible, full width) */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #C8D8E8 0%, #E0EAF5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* CSS window frame */}
          <div style={{ width: '120px', height: '140px', border: '8px solid #8A9AB8', borderRadius: '4px', background: 'linear-gradient(135deg, rgba(180,210,240,0.6) 0%, rgba(200,225,245,0.6) 100%)', position: 'relative', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
            {/* Cross bars */}
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '6px', background: '#8A9AB8', transform: 'translateY(-50%)' }} />
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '6px', background: '#8A9AB8', transform: 'translateX(-50%)' }} />
            {/* Mosquito indicator */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '22px', marginTop: '-8px' }}>🦟</div>
          </div>
          {/* Before label */}
          <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(60,70,80,0.75)', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            AVANT
          </div>
        </div>

        {/* AFTER panel (clipped to right portion) */}
        <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 0 0 ${splitPct}%)`, background: '#EFF8EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img
            src={slide.afterImage}
            alt={slide.productName}
            style={{ height: '180px', width: 'auto', maxWidth: '90%', objectFit: 'contain', filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.20))' }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          {/* After label */}
          <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(129,192,99,0.90)', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            APRÈS ✓
          </div>
        </div>

        {/* Divider line */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${splitPct}%`, width: '2px', background: 'white', transform: 'translateX(-50%)', pointerEvents: 'none', boxShadow: '0 0 6px rgba(0,0,0,0.3)' }}>
          {/* Handle */}
          <div
            style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '36px', height: '36px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.25)', cursor: 'ew-resize', pointerEvents: 'auto' }}
            onMouseDown={() => { dragging.current = true; }}
            onTouchMove={e => updateSplit(e.touches[0].clientX)}
          >
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <path d="M0 6h16M5 1L0 6l5 5M11 1l5 5-5 5" stroke="#1D3E61" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

const BeforeAfterSlider = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'fr';
  const labels: Record<string, Record<string, string>> = {
    sectionLabel: { fr: 'Résultats Réels', ar: 'نتائج حقيقية', tn: 'نتائج حقيقية', en: 'Real Results', it: 'Risultati Reali' },
    sectionTitle: { fr: 'Voyez la différence', ar: 'اشوف الفرق', tn: 'شوف الفرق', en: 'See the difference', it: 'Guarda la differenza' },
    sectionSub: { fr: 'Glissez pour comparer avant et après l\'installation d\'une moustiquaire Grifo Flex.', ar: 'حرّك للمقارنة قبل وبعد تركيب مستيكار Grifo Flex.', tn: 'حرّك تشوف الفرق قبل وبعد تركيب الموستيكار.', en: 'Drag to compare before and after installing a Grifo Flex screen.', it: 'Scorri per confrontare prima e dopo l\'installazione.' },
  };
  const loc = (obj: Record<string, string>) => obj[lang] ?? obj.fr;

  return (
    <section style={{ padding: 'clamp(48px, 8vw, 80px) 0', background: '#F5F7FA' }}>
      <div className="container mx-auto px-4">
        <div className="text-center" style={{ marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', background: 'rgba(129,192,99,0.1)', color: '#81C063', borderRadius: '20px', padding: '5px 16px', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'Rajdhani, sans-serif', marginBottom: '14px' }}>
            {loc(labels.sectionLabel)}
          </div>
          <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'clamp(24px, 5vw, 40px)', letterSpacing: '3px', textTransform: 'uppercase', color: '#2F2D2C', marginBottom: '8px' }}>
            {loc(labels.sectionTitle)}
          </h2>
          <div style={{ width: '48px', height: '3px', background: '#81C063', borderRadius: '2px', margin: '0 auto 14px auto' }} />
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '15px', color: '#818181', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>
            {loc(labels.sectionSub)}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {slides.map((slide, i) => (
            <SingleSlider key={i} slide={slide} lang={lang} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default BeforeAfterSlider;
