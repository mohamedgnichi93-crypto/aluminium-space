import { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShieldCheck, Ruler, Wrench, ChevronDown, ArrowRight, CheckCircle } from 'lucide-react';
import PageSEO from '../components/ui/PageSEO';
import ItalyFlag from '../components/ui/ItalyFlag';

// ─── Animated Counter ──────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '', duration = 1600 }: { target: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-30px' });
  const hasRun = useRef(false);

  useEffect(() => {
    if (!inView) return;
    if (hasRun.current) return;
    hasRun.current = true;

    const start = performance.now();
    let animationFrame: number;

    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const currentCount = Math.round((1 - Math.pow(1 - p, 3)) * target);
      if (ref.current) {
        ref.current.textContent = String(currentCount);
      }
      if (p < 1) {
        animationFrame = requestAnimationFrame(step);
      }
    };

    animationFrame = requestAnimationFrame(step);

    return () => cancelAnimationFrame(animationFrame);
  }, [inView, target, duration]);

  return (
    <span aria-label={`${target}${suffix}`}>
      <span ref={ref} aria-hidden="true">0</span>
      <span aria-hidden="true">{suffix}</span>
    </span>
  );
}

type LangKey = 'fr' | 'ar' | 'tn' | 'en' | 'it';

const products = [
  { id: 'colibri-50', name: 'Colibrì 50', image: '/images/colibri-50.png', tag: { fr: 'Fenêtres', ar: 'نوافذ', tn: 'شبابيك', en: 'Windows', it: 'Finestre' }, desc: { fr: 'Moustiquaire enroulable verticale compacte — idéale pour fenêtres', ar: 'مستيكار رأسية قابلة للطي — مثالية للنوافذ', tn: 'موستيكار رأسية تلوي — مثالية للشبابيك', en: 'Compact vertical roller screen — ideal for windows', it: 'Zanzariera avvolgibile verticale — ideale per finestre' } },
  { id: 'sidney-50', name: 'Sidney 50', image: '/images/sidney-50.png', tag: { fr: 'Portes', ar: 'أبواب', tn: 'أبواب', en: 'Doors', it: 'Porte' }, desc: { fr: 'Moustiquaire coulissante premium pour portes-fenêtres', ar: 'مستيكار منزلقة مميزة لأبواب النوافذ', tn: 'موستيكار منزلقة مميزة لبيبان الشبابيك', en: 'Premium sliding screen for French doors', it: 'Zanzariera scorrevole premium per portefinestre' } },
  { id: 'sidney-50-ac', name: 'Sidney 50 AC', image: '/images/sidney-50-ac.png', tag: { fr: 'Baies vitrées', ar: 'نوافذ زجاجية', tn: 'شبابيك زجاجية', en: 'Bay windows', it: 'Vetrate' }, desc: { fr: 'Solution grand format pour baies vitrées et terrasses', ar: 'حل للأحجام الكبيرة لنوافذ السقف والشرفات', tn: 'حل للأحجام الكبيرة للشبابيك الكبيرة والتراسات', en: 'Large format solution for bay windows and terraces', it: 'Soluzione grande formato per vetrate e terrazze' } },
  { id: 'elba', name: 'ELBA', image: '/images/elba.png', tag: { fr: 'Économique', ar: 'اقتصادي', tn: 'اقتصادي', en: 'Affordable', it: 'Economico' }, desc: { fr: 'Moustiquaire fixe ultra-légère et économique', ar: 'مستيكار ثابتة خفيفة جداً واقتصادية', tn: 'موستيكار ثابتة خفيفة جداً واقتصادية', en: 'Ultra-light and affordable fixed screen', it: 'Zanzariera fissa ultra-leggera ed economica' } },
  { id: 'plisse31', name: 'Plissé 31 Bilatérale', image: '/images/plisse31.png', tag: { fr: 'Moustiquaire plissée', ar: 'مستيكار مطوية', tn: 'موستيكار مطوية', en: 'Pleated screen', it: 'Zanzariera plissettata' }, desc: { fr: 'Protection bilatérale pour grandes ouvertures — encombrement minimal de 31mm', ar: 'حماية ثنائية للفتحات الكبيرة', tn: 'حماية ثنائية للفتحات الكبيرة', en: 'Bilateral protection for large openings', it: 'Protezione bilaterale per grandi aperture' } },
];

// ─── Home Component ────────────────────────────────────────────────────────────
const Home = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ['ar', 'tn'].includes(i18n.language);
  const lang = (i18n.language as LangKey) || 'fr';
  const loc = (obj: Record<string, string>) => obj[lang] ?? obj.fr;

  const stats = [
    { count: 5, suffix: '', labelKey: 'home.stats.models' },
    { count: 100, suffix: '%', labelKey: 'home.stats.custom' },
    { count: 3, suffix: '', labelKey: 'home.stats.warranty' },
    { count: 10, suffix: '', labelKey: 'home.stats.mechanism' },
  ];

  const processSteps = [
    {
      icon: Ruler,
      num: '01',
      title: { fr: 'Prise de mesures', ar: 'أخذ القياسات', tn: 'خذ القياسات', en: 'Measurements', it: 'Presa misure' },
      desc: { fr: 'Nos techniciens viennent chez vous pour mesurer avec précision chaque ouverture.', ar: 'تقنيونا يأتون إليكم لقياس كل فتحة بدقة.', tn: 'تقنيينا يجيوا عندكم يقيسوا كل فتحة بدقة.', en: 'Our technicians come to your home to precisely measure each opening.', it: 'I nostri tecnici vengono da voi per misurare ogni apertura.' },
    },
    {
      icon: Wrench,
      num: '02',
      title: { fr: 'Fabrication sur mesure', ar: 'تصنيع على المقاس', tn: 'تصنيع على المقاس', en: 'Custom manufacturing', it: 'Produzione su misura' },
      desc: { fr: 'Votre moustiquaire est fabriquée selon vos mesures exactes avec les matériaux Grifo Flex.', ar: 'مستيكارتكم تُصنع وفق قياساتكم الدقيقة بمواد Grifo Flex.', tn: 'موستيكاركم تتصنع حسب قياساتكم الدقيقة.', en: 'Your screen is made to your exact measurements with Grifo Flex materials.', it: 'La vostra zanzariera è prodotta sulle vostre misure esatte.' },
    },
    {
      icon: ShieldCheck,
      num: '03',
      title: { fr: 'Installation & garantie', ar: 'تركيب وضمان', tn: 'تركيب وضمان', en: 'Install & warranty', it: 'Installazione e garanzia' },
      desc: { fr: 'Installation professionnelle par nos techniciens certifiés. Garantie 3 ans incluse.', ar: 'تركيب احترافي من قبل تقنيينا المعتمدين. ضمان 3 سنوات مشمول.', tn: 'تركيب احترافي من تقنيينا المعتمدين. ضمان 3 سنوات مشمول.', en: 'Professional installation by our certified technicians. 3-year warranty included.', it: 'Installazione professionale. Garanzia 3 anni inclusa.' },
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <PageSEO path="/" />

      {/* ═══ HERO (Unified Responsive) ════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden flex items-center bg-[linear-gradient(180deg,_#0A1628_0%,_#1a2d4a_100%)] md:bg-[linear-gradient(135deg,_#1D3E61_0%,_#0F2444_100%)] min-h-[100svh] md:min-h-[clamp(520px,80vh,760px)] p-[100px_16px_30px] md:p-[clamp(60px,8vw,80px)_0]"
      >
        {/* Background decorations (Desktop only) */}
        <div className="hidden md:block absolute top-[-15%] right-[-5%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(ellipse_at_center,_rgba(129,192,99,0.15)_0%,_transparent_70%)] pointer-events-none" />
        <div className="hidden md:block absolute bottom-[-10%] left-[-8%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(ellipse_at_center,_rgba(41,103,136,0.2)_0%,_transparent_70%)] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className={`flex flex-col-reverse ${isRTL ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-10 lg:gap-16`}>

            {/* Text content */}
            <div className={`md:w-[55%] text-center ${isRTL ? 'md:text-end' : 'md:text-start'} w-full`}>
              {/* Badge (Desktop only) */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="hidden md:block">
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(129,192,99,0.12)', border: '1px solid rgba(129,192,99,0.3)', borderRadius: '20px', padding: '6px 16px', marginBottom: '20px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#81C063', display: 'inline-block' }} />
                  <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', color: '#81C063' }}>
                    <ItalyFlag /> {t('home.quality_badge')}
                  </span>
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
                style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'clamp(32px, 7vw, 64px)', lineHeight: 1.1, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '16px' }}
                className="md:leading-[1.04]"
              >
                <span className="md:hidden block">{t('home.mobile_title', 'MOUSTIQUAIRES DE QUALITÉ')}</span>
                <div className="hidden md:block">
                  <span style={{ color: 'rgba(255,255,255,0.95)', display: 'block' }}>{t('home.title_line1')}</span>
                  <span style={{ background: 'linear-gradient(135deg, #81C063, #296788)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', display: 'block' }}>
                    {t('home.title_line2')}
                  </span>
                </div>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 'clamp(14px, 2.5vw, 17px)', color: 'rgba(255,255,255,0.85)', lineHeight: 1.75, marginBottom: '28px', maxWidth: '520px' }}
                className="mx-auto md:mx-0 text-ellipsis-2 md:text-clip"
              >
                {t('home.description')}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }}
                className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-10"
              >
                <Link
                  to="/produits"
                  className="h-[52px] md:h-auto"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#81C063', color: 'white', borderRadius: '12px', padding: '14px 28px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '15px', letterSpacing: '2px', textTransform: 'uppercase', textDecoration: 'none', boxShadow: '0 4px 20px rgba(129,192,99,0.35)', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#5e9a43'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#81C063'; e.currentTarget.style.transform = 'none'; }}
                >
                  <span className="hidden md:inline">{t('home.cta_products')}</span>
                  <span className="md:hidden">{t('home.mobile_cta_products', 'VOIR NOS PRODUITS')}</span>
                  <ArrowRight size={16} className="no-rtl-flip hidden md:block" />
                </Link>
                <Link
                  to="/devis"
                  className="h-[52px] md:h-auto border-[1px] md:border-[2px] border-[rgba(255,255,255,0.6)] md:border-[rgba(255,255,255,0.3)]"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'transparent', color: 'rgba(255,255,255,0.85)', borderRadius: '12px', padding: '14px 28px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '15px', letterSpacing: '2px', textTransform: 'uppercase', textDecoration: 'none', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#81C063'; e.currentTarget.style.color = '#81C063'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
                >
                  <span className="hidden md:inline">{t('home.cta_quote')}</span>
                  <span className="md:hidden">{t('home.mobile_cta_quote', 'DEMANDER UN DEVIS')}</span>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
                className={`flex flex-wrap md:flex-nowrap gap-x-4 gap-y-2 justify-between md:justify-start ${isRTL ? 'md:justify-end' : 'md:justify-start'}`}
              >
                {[t('home.trust_custom'), t('home.trust_install'), t('home.trust_free')].map((item, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={14} color="#81C063" className="no-rtl-flip" />
                    <span className="font-['DM_Sans',_sans-serif] text-[rgba(255,255,255,0.85)] text-xs md:text-sm">{item}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right: Product image */}
            <div className="md:w-[45%] flex items-center justify-center w-full mt-4 md:mt-0">
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.8 }}
                className="md:animate-float w-full max-w-[380px] flex flex-col items-center"
              >
                {/* Desktop Styled Wrapper */}
                <div className="hidden md:block w-full" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(129,192,99,0.2)', borderRadius: '24px', padding: 'clamp(24px, 4vw, 40px)', backdropFilter: 'blur(8px)', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
                  <picture className="no-rtl-flip w-full">
                    <source srcSet="/images/colibri-hero.webp" type="image/webp" />
                    <img src="/images/colibri-hero.png" alt="Grifo Flex Colibrì 50"
                      className="no-rtl-flip mx-auto"
                      style={{ width: '100%', height: 'auto', maxHeight: '280px', objectFit: 'contain', filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.3))', transform: 'none' }}
                    />
                  </picture>
                  <div className="flex justify-center mt-16 gap-6 w-full">
                    <div style={{ background: 'rgba(129,192,99,0.15)', border: '1px solid rgba(129,192,99,0.25)', borderRadius: '20px', padding: '5px 14px', display: 'inline-flex', gap: '6px', alignItems: 'center', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                      <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.85)' }}>{t('home.distributeur_officiel')}</span>
                    </div>
                  </div>
                </div>

                {/* Mobile Plain Wrapper */}
                <div className="md:hidden w-full">
                  <picture className="no-rtl-flip w-full">
                    <source srcSet="/images/colibri-hero.webp" type="image/webp" />
                    <img src="/images/colibri-hero.png" alt="Grifo Flex" className="no-rtl-flip mx-auto" style={{ width: '100%', maxHeight: '250px', objectFit: 'contain', transform: 'none' }} />
                  </picture>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Scroll icon (Desktop only) */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2"
        >
          <ChevronDown className="animate-bounce" style={{ color: 'rgba(129,192,99,0.6)', width: '20px', height: '20px' }} />
        </motion.div>
      </section>

      {/* ═══ STATS STRIP (Unified Responsive) ════════════════════════════════════════ */}
      <section className="bg-[#112038] md:bg-[#1D3E61] p-[24px_16px] md:p-[clamp(32px,5vw,48px)_0]">
        <div className="container mx-auto md:px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-px md:bg-white/10 md:rounded-2xl md:overflow-hidden">
            {stats.map((s, i) => {
              const content = (
                <>
                  <div className="font-['Rajdhani',_sans-serif] font-bold text-[#81C063] tracking-[2px] leading-none text-[28px] md:text-[clamp(28px,5vw,44px)]">
                    <AnimatedCounter target={s.count} suffix={s.suffix} />
                  </div>
                  <div className="font-['DM_Sans',_sans-serif] text-white/[0.85] mt-1 md:mt-1.5 tracking-[0.5px] text-[11px] md:text-[12px]">
                    {t(s.labelKey)}
                  </div>
                </>
              );
              return (
                <div key={i}>
                  {/* Desktop: motion.div with animation */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="hidden md:block text-center bg-[#1D3E61] p-[clamp(20px,4vw,32px)_16px]"
                  >
                    {content}
                  </motion.div>
                  {/* Mobile: simple div (no animation) */}
                  <div className="md:hidden text-center bg-white/5 rounded-xl p-[16px_12px]">
                    {content}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ PRODUCTS PREVIEW (Unified Responsive) ═══════════════════════════════════ */}
      <section className="bg-white p-[40px_16px] md:p-[clamp(48px,8vw,80px)_0]">
        <div className="container mx-auto md:px-4">
          <div className="text-center mb-6 md:mb-10">
            <div className="hidden md:inline-flex bg-[#81C063]/10 text-[#81C063] rounded-full px-4 py-1.5 text-[11px] font-bold tracking-[2px] uppercase font-['Rajdhani',_sans-serif] mb-3.5">
              <ItalyFlag /> Grifo Flex
            </div>
            <h2 className="font-['Rajdhani',_sans-serif] font-bold text-[24px] md:text-[clamp(24px,5vw,40px)] tracking-[2px] md:tracking-[3px] uppercase text-[#2F2D2C] mb-2 md:mb-2">
              <span className="md:hidden">{loc({ fr: 'Nos Modèles', ar: 'موديلاتنا', tn: 'موديلاتنا', en: 'Our Models', it: 'I Nostri Modelli' })}</span>
              <span className="hidden md:block">{t('home.products_title')}</span>
            </h2>
            <div className="hidden md:block w-12 h-[3px] bg-[#81C063] rounded-sm mx-auto" />
          </div>

          <div className="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-6 gap-4 md:gap-5 max-w-6xl mx-auto">
            {products.map((p, i) => (
              <Link key={p.id} to={`/produits/${p.id}`} className={`block no-underline group lg:col-span-2 ${i === 3 ? 'lg:col-start-2' : ''} ${i === 4 ? 'lg:col-start-4' : ''}`}>
                {/* Desktop Card: motion.div with animation */}
                <motion.div
                  className="hidden md:block bg-[#F5F7FA] rounded-2xl overflow-hidden border border-[#DBDADA] transition-all duration-250 group-hover:border-[#81C063] group-hover:shadow-[0_8px_32px_rgba(29,62,97,0.12)] group-hover:-translate-y-1"
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                >
                  <div className="bg-white p-6 flex items-center justify-center border-b border-[#DBDADA] min-h-[160px]">
                    <picture>
                      <source srcSet={p.image.replace('.png', '.webp')} type="image/webp" />
                      <img src={p.image} alt={p.name} className="h-[130px] w-auto max-w-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.12)]" />
                    </picture>
                  </div>
                  <div className="p-4">
                    <div className="inline-block bg-[#296788]/[0.08] text-[#296788] rounded-md px-2 py-0.5 text-[10px] font-['Rajdhani',_sans-serif] font-bold tracking-[1px] uppercase mb-2">
                      {loc(p.tag)}
                    </div>
                    <h3 className="font-['Rajdhani',_sans-serif] font-bold text-[18px] text-[#2F2D2C] tracking-[1px] mb-1.5">{p.name}</h3>
                    <p className="font-['DM_Sans',_sans-serif] text-[12px] text-[#818181] leading-relaxed">{loc(p.desc)}</p>
                    <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center gap-1 mt-3 text-[#81C063] font-['Rajdhani',_sans-serif] font-bold text-[12px] tracking-[1px] uppercase`}>
                      {t('home.view_product')}
                      <ArrowRight size={13} className="no-rtl-flip" />
                    </div>
                  </div>
                </motion.div>

                {/* Mobile Card: simple div (no animation) */}
                <div className={`md:hidden flex h-[200px] bg-[#F5F7FA] rounded-2xl border border-[#DBDADA] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.05)] ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-[40%] bg-white flex items-center justify-center p-3 border-[#DBDADA] ${isRTL ? 'border-l' : 'border-r'}`}>
                    <picture>
                      <source srcSet={p.image.replace('.png', '.webp')} type="image/webp" />
                      <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                    </picture>
                  </div>
                  <div className={`w-[60%] p-4 flex flex-col justify-center relative ${isRTL ? 'text-right' : 'text-left'}`}>
                    <div className="text-[10px] text-[#296788] font-bold font-['Rajdhani',_sans-serif] uppercase mb-1">{loc(p.tag)}</div>
                    <h3 className="text-[16px] font-bold text-[#2F2D2C] font-['Rajdhani',_sans-serif] mb-1.5">{p.name}</h3>
                    <p className="text-[12px] text-[#818181] font-['DM_Sans',_sans-serif] leading-tight m-0 line-clamp-2">{loc(p.desc)}</p>
                    <div className={`absolute bottom-4 ${isRTL ? 'left-4' : 'right-4'} bg-[#81C063] w-7 h-7 rounded-full flex items-center justify-center`}>
                      <ArrowRight size={14} color="white" className="no-rtl-flip" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="hidden md:block text-center mt-8">
            <Link
              to="/produits"
              className={`inline-flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center gap-2 bg-[#1D3E61] text-white rounded-xl px-7 py-3 font-['Rajdhani',_sans-serif] font-bold text-[14px] tracking-[2px] uppercase no-underline transition-all hover:bg-[#296788] hover:-translate-y-0.5`}
            >
              {t('home.cta_products')}
              <ArrowRight size={15} className="no-rtl-flip" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ════════════════════════════════════════════════════ */}
      <section style={{ background: '#1D3E61', padding: 'clamp(48px, 8vw, 80px) 0' }} className="hidden md:block">
        <div className="container mx-auto px-4">
          <div className="text-center" style={{ marginBottom: '40px' }}>
            <div style={{ display: 'inline-flex', background: 'rgba(129,192,99,0.15)', color: '#81C063', borderRadius: '20px', padding: '5px 16px', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'Rajdhani, sans-serif', marginBottom: '14px' }}>
              {loc({ fr: 'Simple & Rapide', ar: 'بسيط وسريع', tn: 'بسيط وسريع', en: 'Simple & Fast', it: 'Semplice e Veloce' })}
            </div>
            <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'clamp(24px, 5vw, 40px)', letterSpacing: '3px', textTransform: 'uppercase', color: '#FFFFFF', marginBottom: '8px' }}>
              {t('home.how_it_works_title')}
            </h2>
            <div style={{ width: '48px', height: '3px', background: '#81C063', borderRadius: '2px', margin: '0 auto' }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            {processSteps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '16px', padding: 'clamp(20px, 3vw, 28px)', position: 'relative', overflow: 'hidden' }}
              >
                <div style={{
                  display: 'flex',
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '16px'
                }}>
                  {/* LEFT — Icon */}
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(129, 192, 99, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <step.icon size={22} color="#81C063" />
                  </div>

                  {/* RIGHT — Step number */}
                  <span style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    fontSize: '28px',
                    fontWeight: '700',
                    color: 'rgba(255,255,255,0.15)',
                    lineHeight: 1,
                    flexShrink: 0
                  }}>
                    {step.num}
                  </span>
                </div>
                <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '17px', color: '#FFFFFF', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px', textAlign: isRTL ? 'right' : 'left' }}>
                  {loc(step.title)}
                </h3>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, textAlign: isRTL ? 'right' : 'left' }}>
                  {loc(step.desc)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA BANNER ══════════════════════════════════════════════════════ */}
      <section style={{ background: 'linear-gradient(135deg, #1D3E61 0%, #296788 100%)', padding: 'clamp(40px, 7vw, 72px) 0' }} className="hidden md:block">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'clamp(22px, 5vw, 38px)', color: '#FFFFFF', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>
              {loc({ fr: 'Prêt pour cet été ?', ar: 'جاهز لهذا الصيف؟', tn: 'حاضر لهذا الصيف؟', en: 'Ready for this summer?', it: 'Pronto per questa estate?' })}
            </h2>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '16px', color: 'rgba(255,255,255,0.85)', marginBottom: '28px', maxWidth: '500px', margin: '0 auto 28px' }}>
              {loc({ fr: 'Obtenez votre devis gratuit en ligne en moins de 2 minutes.', ar: 'احصل على عرض سعر مجاني عبر الإنترنت في أقل من دقيقتين.', tn: 'خذ دوفيسك المجاني أونلاين في أقل من دقيقتين.', en: 'Get your free quote online in less than 2 minutes.', it: 'Ottieni il tuo preventivo gratuito online in meno di 2 minuti.' })}
            </p>
            <Link
              to="/devis"
              style={{ display: 'inline-flex', flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: '10px', background: '#81C063', color: 'white', borderRadius: '12px', padding: '15px 36px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '16px', letterSpacing: '2px', textTransform: 'uppercase', textDecoration: 'none', boxShadow: '0 4px 20px rgba(129,192,99,0.4)', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#5e9a43'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#81C063'; e.currentTarget.style.transform = 'none'; }}
            >
              {t('home.cta_quote')}
              <ArrowRight size={18} className="no-rtl-flip" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════════
          MOBILE SPECIFIC SECTIONS (< 768px)
          ══════════════════════════════════════════════════════════════════════════ */}





      {/* MOBILE COMMENT ÇA MARCHE */}
      <section className="md:hidden" style={{ background: '#1D3E61', padding: '40px 16px' }}>
        <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '24px', textAlign: 'center', color: 'white', marginBottom: '32px', letterSpacing: '2px', textTransform: 'uppercase' }}>
          {loc({ fr: 'Comment ça marche', ar: 'كيف يعمل', tn: 'كيفاش يتعمل', en: 'How it works', it: 'Come funziona' })}
        </h2>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', [isRTL ? 'right' : 'left']: '19px', top: '20px', bottom: '20px', width: '2px', background: 'rgba(129,192,99,0.3)', zIndex: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', zIndex: 1 }}>
            {processSteps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#81C063', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'white', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '16px' }}>
                  {step.num}
                </div>
                <div style={{ paddingTop: '8px', textAlign: isRTL ? 'right' : 'left' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'white', fontFamily: 'Rajdhani, sans-serif', textTransform: 'uppercase', marginBottom: '6px' }}>{loc(step.title)}</h3>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.5, margin: 0 }}>{loc(step.desc)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MOBILE CTA BANNER */}
      <section className="md:hidden" style={{ background: '#81C063', padding: '40px 16px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '22px', color: 'white', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px', lineHeight: 1.2 }}>
          {loc({ fr: 'Prêt pour cet été ?', ar: 'جاهز لهذا الصيف؟', tn: 'حاضر لهذا الصيف؟', en: 'Ready for this summer?', it: 'Pronto per questa estate?' })}
        </h2>
        <Link
          to="/devis"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'white', color: '#81C063', height: '52px', borderRadius: '12px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '15px', textTransform: 'uppercase', letterSpacing: '1px', textDecoration: 'none', width: '100%' }}
        >
          {t('home.cta_quote')}
          <ArrowRight size={16} className="no-rtl-flip" />
        </Link>
      </section>

    </div>
  );
};

export default Home;
