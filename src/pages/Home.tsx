import { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShieldCheck, Ruler, Wrench, ChevronDown, ArrowRight, CheckCircle } from 'lucide-react';
import PageSEO from '../components/ui/PageSEO';

// ─── Animated Counter ──────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '', duration = 1600 }: { target: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-30px' });
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setCount(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target, duration]);
  return <span ref={ref}>{count}{suffix}</span>;
}

type LangKey = 'fr' | 'ar' | 'tn' | 'en' | 'it';

const products = [
  { id: 'colibri-50', name: 'Colibrì 50', image: '/images/colibri-50.png', tag: { fr: 'Fenêtres', ar: 'نوافذ', tn: 'شبابيك', en: 'Windows', it: 'Finestre' }, desc: { fr: 'Moustiquaire enroulable verticale compacte — idéale pour fenêtres', ar: 'مستيكار رأسية قابلة للطي — مثالية للنوافذ', tn: 'موستيكار رأسية تلوي — مثالية للشبابيك', en: 'Compact vertical roller screen — ideal for windows', it: 'Zanzariera avvolgibile verticale — ideale per finestre' } },
  { id: 'sidney-50', name: 'Sidney 50', image: '/images/sidney-50.png', tag: { fr: 'Portes', ar: 'أبواب', tn: 'أبواب', en: 'Doors', it: 'Porte' }, desc: { fr: 'Moustiquaire coulissante premium pour portes-fenêtres', ar: 'مستيكار منزلقة مميزة لأبواب النوافذ', tn: 'موستيكار منزلقة مميزة لبيبان الشبابيك', en: 'Premium sliding screen for French doors', it: 'Zanzariera scorrevole premium per portefinestre' } },
  { id: 'sidney-50-ac', name: 'Sidney 50 AC', image: '/images/sidney-50-ac.png', tag: { fr: 'Baies vitrées', ar: 'نوافذ زجاجية', tn: 'شبابيك زجاجية', en: 'Bay windows', it: 'Vetrate' }, desc: { fr: 'Solution grand format pour baies vitrées et terrasses', ar: 'حل للأحجام الكبيرة لنوافذ السقف والشرفات', tn: 'حل للأحجام الكبيرة للشبابيك الكبيرة والتراسات', en: 'Large format solution for bay windows and terraces', it: 'Soluzione grande formato per vetrate e terrazze' } },
  { id: 'elba', name: 'ELBA', image: '/images/elba.png', tag: { fr: 'Économique', ar: 'اقتصادي', tn: 'اقتصادي', en: 'Affordable', it: 'Economico' }, desc: { fr: 'Moustiquaire fixe ultra-légère et économique', ar: 'مستيكار ثابتة خفيفة جداً واقتصادية', tn: 'موستيكار ثابتة خفيفة جداً واقتصادية', en: 'Ultra-light and affordable fixed screen', it: 'Zanzariera fissa ultra-leggera ed economica' } },
];

// ─── Home Component ────────────────────────────────────────────────────────────
const Home = () => {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language as LangKey) || 'fr';
  const loc = (obj: Record<string, string>) => obj[lang] ?? obj.fr;

  const stats = [
    { count: 4, suffix: '', label: { fr: 'Modèles Grifo Flex', ar: 'موديلات Grifo Flex', tn: 'موديلات Grifo Flex', en: 'Grifo Flex Models', it: 'Modelli Grifo Flex' } },
    { count: 100, suffix: '%', label: { fr: 'Sur mesure', ar: 'على المقاس', tn: 'على المقاس', en: 'Custom made', it: 'Su misura' } },
    { count: 3, suffix: ' ans', label: { fr: 'De garantie', ar: 'سنوات ضمان', tn: 'سنوات ضمان', en: 'Year warranty', it: 'Anni di garanzia' } },
    { count: 10, suffix: ' ans', label: { fr: 'Mécanisme garanti', ar: 'ضمان الميكانيزم', tn: 'ضمان الميكانيزم', en: 'Mechanism warranty', it: 'Garanzia meccanismo' } },
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

      {/* ═══ HERO ═══════════════════════════════════════════════════════════════ */}
      <section
        style={{ background: 'linear-gradient(135deg, #1D3E61 0%, #0F2444 100%)', position: 'relative', overflow: 'hidden', minHeight: 'clamp(520px, 80vh, 760px)', display: 'flex', alignItems: 'center', padding: 'clamp(60px, 8vw, 80px) 0' }}
      >
        {/* Background decorations */}
        <div style={{ position: 'absolute', top: '-15%', right: '-5%', width: '600px', height: '600px', borderRadius: '50%', background: '#81C063', filter: 'blur(120px)', opacity: 0.06 }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-8%', width: '500px', height: '500px', borderRadius: '50%', background: '#296788', filter: 'blur(100px)', opacity: 0.10 }} />

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col-reverse lg:flex-row items-center gap-10 lg:gap-16">

            {/* Left: Text content */}
            <div className="lg:w-[55%] text-center lg:text-start w-full">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(129,192,99,0.12)', border: '1px solid rgba(129,192,99,0.3)', borderRadius: '20px', padding: '6px 16px', marginBottom: '20px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#81C063', display: 'inline-block' }} />
                  <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', color: '#81C063' }}>
                    🇮🇹 {t('home.quality_badge')}
                  </span>
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
                style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'clamp(34px, 7vw, 64px)', lineHeight: 1.04, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '16px' }}
              >
                <span style={{ color: 'rgba(255,255,255,0.95)', display: 'block' }}>{t('home.title_line1')}</span>
                <span style={{ background: 'linear-gradient(135deg, #81C063, #296788)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', display: 'block' }}>
                  {t('home.title_line2')}
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 'clamp(14px, 2.5vw, 17px)', color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, marginBottom: '28px', maxWidth: '520px' }}
                className="mx-auto lg:mx-0"
              >
                {t('home.description')}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }}
                className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-10"
              >
                <Link
                  to="/produits"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#81C063', color: 'white', borderRadius: '10px', padding: '14px 28px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '15px', letterSpacing: '2px', textTransform: 'uppercase', textDecoration: 'none', boxShadow: '0 4px 20px rgba(129,192,99,0.35)', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#5e9a43'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#81C063'; e.currentTarget.style.transform = 'none'; }}
                >
                  {t('home.cta_products')}
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/devis"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'transparent', color: 'rgba(255,255,255,0.85)', borderRadius: '10px', padding: '14px 28px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '15px', letterSpacing: '2px', textTransform: 'uppercase', textDecoration: 'none', border: '2px solid rgba(255,255,255,0.3)', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#81C063'; e.currentTarget.style.color = '#81C063'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
                >
                  {t('home.cta_quote')}
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
                className="flex flex-wrap gap-x-4 gap-y-2 justify-center lg:justify-start"
              >
                {[t('home.trust_custom'), t('home.trust_install'), t('home.trust_free')].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={14} color="#81C063" />
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>{item}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right: Product image */}
            <div className="lg:w-[45%] flex items-center justify-center w-full">
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.8 }}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(129,192,99,0.2)', borderRadius: '24px', padding: 'clamp(24px, 4vw, 40px)', backdropFilter: 'blur(8px)', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', maxWidth: '380px', width: '100%' }}
                className="animate-float"
              >
                <img src="/images/colibri-hero.png" alt="Grifo Flex Colibrì 50"
                  style={{ width: '100%', height: 'auto', maxHeight: '280px', objectFit: 'contain', filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.3))' }}
                  onError={e => { (e.currentTarget as HTMLImageElement).src = '/images/colibri-50.png'; }}
                />
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px', gap: '6px' }}>
                  <div style={{ background: 'rgba(129,192,99,0.15)', border: '1px solid rgba(129,192,99,0.25)', borderRadius: '20px', padding: '5px 14px', display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ color: '#81C063', fontSize: '10px' }}>★★★★★</span>
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Distributeur officiel</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-2"
        >
          <ChevronDown className="animate-bounce" style={{ color: 'rgba(129,192,99,0.6)', width: '20px', height: '20px' }} />
        </motion.div>
      </section>

      {/* ═══ STATS STRIP ════════════════════════════════════════════════════════ */}
      <section style={{ background: '#1D3E61', padding: 'clamp(32px, 5vw, 48px) 0' }}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
            {stats.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{ background: '#1D3E61', padding: 'clamp(20px, 4vw, 32px) 16px', textAlign: 'center' }}
              >
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'clamp(28px, 5vw, 44px)', color: '#81C063', letterSpacing: '2px', lineHeight: 1 }}>
                  <AnimatedCounter target={s.count} suffix={s.suffix} />
                </div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.55)', marginTop: '6px', letterSpacing: '0.5px' }}>
                  {loc(s.label)}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRODUCTS PREVIEW ════════════════════════════════════════════════ */}
      <section style={{ background: '#FFFFFF', padding: 'clamp(48px, 8vw, 80px) 0' }}>
        <div className="container mx-auto px-4">
          <div className="text-center" style={{ marginBottom: '40px' }}>
            <div style={{ display: 'inline-flex', background: 'rgba(129,192,99,0.1)', color: '#81C063', borderRadius: '20px', padding: '5px 16px', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'Rajdhani, sans-serif', marginBottom: '14px' }}>
              🇮🇹 Grifo Flex
            </div>
            <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'clamp(24px, 5vw, 40px)', letterSpacing: '3px', textTransform: 'uppercase', color: '#2F2D2C', marginBottom: '8px' }}>
              {loc({ fr: 'Nos Modèles', ar: 'موديلاتنا', tn: 'موديلاتنا', en: 'Our Models', it: 'I Nostri Modelli' })}
            </h2>
            <div style={{ width: '48px', height: '3px', background: '#81C063', borderRadius: '2px', margin: '0 auto' }} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {products.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{ background: '#F5F7FA', borderRadius: '16px', overflow: 'hidden', border: '1px solid #DBDADA', transition: 'all 0.25s', cursor: 'pointer' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#81C063'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(29,62,97,0.12)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#DBDADA'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
              >
                <Link to={`/produits/${p.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{ background: '#FFFFFF', padding: '24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #DBDADA', minHeight: '160px' }}>
                    <img src={p.image} alt={p.name} style={{ height: '130px', width: 'auto', maxWidth: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.12))' }} />
                  </div>
                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'inline-block', background: 'rgba(41,103,136,0.08)', color: '#296788', borderRadius: '6px', padding: '2px 8px', fontSize: '10px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
                      {loc(p.tag)}
                    </div>
                    <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '18px', color: '#2F2D2C', letterSpacing: '1px', marginBottom: '6px' }}>
                      {p.name}
                    </h3>
                    <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#818181', lineHeight: 1.6 }}>
                      {loc(p.desc)}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px', color: '#81C063', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                      {loc({ fr: 'Voir le produit', ar: 'رؤية المنتج', tn: 'شوف المنتوج', en: 'View product', it: 'Vedi prodotto' })}
                      <ArrowRight size={13} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              to="/produits"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#1D3E61', color: 'white', borderRadius: '10px', padding: '13px 28px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase', textDecoration: 'none', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#296788'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#1D3E61'; e.currentTarget.style.transform = 'none'; }}
            >
              {t('home.cta_products')}
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ════════════════════════════════════════════════════ */}
      <section style={{ background: '#1D3E61', padding: 'clamp(48px, 8vw, 80px) 0' }}>
        <div className="container mx-auto px-4">
          <div className="text-center" style={{ marginBottom: '40px' }}>
            <div style={{ display: 'inline-flex', background: 'rgba(129,192,99,0.15)', color: '#81C063', borderRadius: '20px', padding: '5px 16px', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'Rajdhani, sans-serif', marginBottom: '14px' }}>
              {loc({ fr: 'Simple & Rapide', ar: 'بسيط وسريع', tn: 'بسيط وسريع', en: 'Simple & Fast', it: 'Semplice e Veloce' })}
            </div>
            <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'clamp(24px, 5vw, 40px)', letterSpacing: '3px', textTransform: 'uppercase', color: '#FFFFFF', marginBottom: '8px' }}>
              {loc({ fr: 'Comment ça marche', ar: 'كيف يعمل', tn: 'كيفاش يتعمل', en: 'How it works', it: 'Come funziona' })}
            </h2>
            <div style={{ width: '48px', height: '3px', background: '#81C063', borderRadius: '2px', margin: '0 auto' }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {processSteps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '16px', padding: 'clamp(20px, 3vw, 28px)', position: 'relative', overflow: 'hidden' }}
              >
                <div style={{ position: 'absolute', top: '12px', right: '16px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '42px', color: 'rgba(129,192,99,0.12)', lineHeight: 1 }}>
                  {step.num}
                </div>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(129,192,99,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <step.icon size={22} color="#81C063" />
                </div>
                <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '17px', color: '#FFFFFF', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
                  {loc(step.title)}
                </h3>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.60)', lineHeight: 1.7 }}>
                  {loc(step.desc)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA BANNER ══════════════════════════════════════════════════════ */}
      <section style={{ background: 'linear-gradient(135deg, #1D3E61 0%, #296788 100%)', padding: 'clamp(40px, 7vw, 72px) 0' }}>
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'clamp(22px, 5vw, 38px)', color: '#FFFFFF', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>
              {loc({ fr: 'Prêt pour cet été ?', ar: 'جاهز لهذا الصيف؟', tn: 'حاضر لهذا الصيف؟', en: 'Ready for this summer?', it: 'Pronto per questa estate?' })}
            </h2>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '16px', color: 'rgba(255,255,255,0.7)', marginBottom: '28px', maxWidth: '500px', margin: '0 auto 28px' }}>
              {loc({ fr: 'Obtenez votre devis gratuit en ligne en moins de 2 minutes.', ar: 'احصل على عرض سعر مجاني عبر الإنترنت في أقل من دقيقتين.', tn: 'خذ دوفيسك المجاني أونلاين في أقل من دقيقتين.', en: 'Get your free quote online in less than 2 minutes.', it: 'Ottieni il tuo preventivo gratuito online in meno di 2 minuti.' })}
            </p>
            <Link
              to="/devis"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#81C063', color: 'white', borderRadius: '12px', padding: '15px 36px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '16px', letterSpacing: '2px', textTransform: 'uppercase', textDecoration: 'none', boxShadow: '0 4px 20px rgba(129,192,99,0.4)', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#5e9a43'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#81C063'; e.currentTarget.style.transform = 'none'; }}
            >
              {t('home.cta_quote')}
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>

    </div>
  );
};

export default Home;
