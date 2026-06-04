import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import PageSEO from '../components/ui/PageSEO';
import ItalyFlag from '../components/ui/ItalyFlag';
import RemiseBanner from '../components/RemiseBanner';

type LangKey = 'fr' | 'ar' | 'tn' | 'en' | 'it';

const PRODUCTS = [
  { id: 'colibri-50', name: 'Colibrì 50', image: '/images/colibri-50.png', tag: { fr: 'Fenêtres', ar: 'نوافذ', tn: 'شبابيك', en: 'Windows', it: 'Finestre' }, desc: { fr: 'Moustiquaire enroulable verticale compacte — idéale pour fenêtres', ar: 'مستيكار رأسية قابلة للطي — مثالية للنوافذ', tn: 'مستيكار رأسية تلوي — مثالية للشبابيك', en: 'Compact vertical roller screen — ideal for windows', it: 'Zanzariera avvolgibile verticale — ideale per finestre' } },
  { id: 'sidney-50', name: 'Sidney 50', image: '/images/sidney-50.png', tag: { fr: 'Portes', ar: 'أبواب', tn: 'أبواب', en: 'Doors', it: 'Porte' }, desc: { fr: 'Moustiquaire coulissante premium pour portes-fenêtres', ar: 'مستيكار منزلقة مميزة لأبواب النوافذ', tn: 'مستيكار منزلقة مميزة لبيبان الشبابيك', en: 'Premium sliding screen for French doors', it: 'Zanzariera scorrevole premium per portefinestre' } },
  { id: 'sidney-50-ac', name: 'Sidney 50 AC', image: '/images/sidney-50-ac.png', tag: { fr: 'Baies vitrées', ar: 'نوافذ زجاجية', tn: 'شبابيك زجاجية', en: 'Bay windows', it: 'Vetrate' }, desc: { fr: 'Solution grand format pour baies vitrées et terrasses', ar: 'حل للأحجام الكبيرة لنوافذ السقف والشرفات', tn: 'حل للأحجام الكبيرة للشبابيك الكبيرة والتراسات', en: 'Large format solution for bay windows and terraces', it: 'Soluzione grande formato per vetrate e terrazze' } },
  { id: 'elba', name: 'ELBA', image: '/images/elba-v2.webp', tag: { fr: 'Économique', ar: 'اقتصادي', tn: 'اقتصادي', en: 'Affordable', it: 'Economico' }, desc: { fr: 'Moustiquaire fixe ultra-légère et économique', ar: 'مستيكار ثابتة خفيفة جداً واقتصادية', tn: 'مستيكار ثابتة خفيفة جداً واقتصادية', en: 'Ultra-light and affordable fixed screen', it: 'Zanzariera fissa ultra-leggera ed economica' } },
  { id: 'plisse31', name: 'Plissé 31 Bilatérale', image: '/images/plisse31.png', tag: { fr: 'Moustiquaire plissée', ar: 'مستيكار مطوية', tn: 'مستيكار مطوية', en: 'Pleated screen', it: 'Zanzariera plissettata' }, desc: { fr: 'Protection bilatérale pour grandes ouvertures — encombrement minimal de 31mm', ar: 'حماية ثنائية للفتحات الكبيرة', tn: 'حماية ثنائية للفتحات الكبيرة', en: 'Bilateral protection for large openings', it: 'Protezione bilaterale per grandi aperture' } },
];

// ─── Home Component ────────────────────────────────────────────────────────────
const Home = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ['ar', 'tn'].includes(i18n.language);
  const lang = (i18n.language as LangKey) || 'fr';
  const loc = (obj: Record<string, string>) => obj[lang] ?? obj.fr;

  return (
    <div className="flex flex-col min-h-screen">
      <PageSEO path="/" />

      {/* ═══ HERO (Unified Responsive) ════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden flex items-center bg-[linear-gradient(180deg,_#0A1628_0%,_#1a2d4a_100%)] md:bg-[linear-gradient(135deg,_#1D3E61_0%,_#0F2444_100%)] p-[100px_16px_30px] md:p-[clamp(60px,8vw,80px)_0]"
        style={{ minHeight: 'clamp(500px, 90vh, 760px)' }}
      >
        {/* ── LAYER 1: Full-width background video ── */}
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
            willChange: 'transform',
          }}
        >
          <source src="/videos/site.mp4" type="video/mp4" />
        </video>

        {/* ── LAYER 3: Content ── */}
        <div className="container mx-auto px-4 relative" style={{ zIndex: 3 }}>
          <div className={`flex flex-col-reverse ${isRTL ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-10 lg:gap-16`}>

            <div className={`md:w-[65%] lg:w-[55%] text-center ${isRTL ? 'md:text-end' : 'md:text-start'} w-full`}>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ REMISE BANNER ═════════════════════════════════════════════════════════════ */}
      <RemiseBanner />

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

          <div className="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-6 gap-4 md:gap-5 max-w-6xl mx-auto md:auto-rows-fr">
            {PRODUCTS.map((p, i) => (
              <Link key={p.id} to={`/produits/${p.id}`} className={`block no-underline group lg:col-span-2 h-full flex flex-col ${i === 3 ? 'lg:col-start-2' : ''} ${i === 4 ? 'lg:col-start-4' : ''}`}>
                {/* Desktop Card: motion.div with animation */}
                <motion.div
                  className="hidden md:flex flex-col h-full bg-[#F5F7FA] rounded-2xl overflow-hidden border border-[#DBDADA] transition-all duration-250 group-hover:border-[#81C063] group-hover:shadow-[0_8px_32px_rgba(29,62,97,0.12)] group-hover:-translate-y-1"
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                >
                  <div className="bg-white p-6 flex items-center justify-center border-b border-[#DBDADA] h-[160px] flex-shrink-0">
                    <picture className="h-full flex items-center justify-center">
                      <source srcSet={p.image.replace('.png', '.webp')} type="image/webp" />
                      <img src={p.image} alt={p.name} loading="lazy" decoding="async" className="h-full w-auto max-h-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.12)]" />
                    </picture>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="inline-block bg-[#296788]/[0.08] text-[#296788] rounded-md px-2 py-0.5 text-[10px] font-['Rajdhani',_sans-serif] font-bold tracking-[1px] uppercase mb-2 self-start">
                      {loc(p.tag)}
                    </div>
                    <h3 className="font-['Rajdhani',_sans-serif] font-bold text-[18px] text-[#2F2D2C] tracking-[1px] mb-1.5">{p.name}</h3>
                    <p className="font-['DM_Sans',_sans-serif] text-[12px] text-[#818181] leading-relaxed flex-1">{loc(p.desc)}</p>
                    <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center gap-1 mt-auto pt-3 text-[#81C063] font-['Rajdhani',_sans-serif] font-bold text-[12px] tracking-[1px] uppercase`}>
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
                      <img src={p.image} alt={p.name} loading="lazy" decoding="async" className="w-full h-full object-contain" />
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

    </div>
  );
};

export default Home;
