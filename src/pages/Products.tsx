import { useState, useEffect, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Ruler, Award, CheckCircle, XCircle, Link as LinkIcon, FileText, X as XIcon } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/products/ProductCard';
import HowItWorks from '../components/ui/HowItWorks';
import PageSEO from '../components/ui/PageSEO';
const DevisWizard = lazy(() => import('../components/devis/DevisWizard'));
import ItalyFlag from '../components/ui/ItalyFlag';
import { usePublicProducts } from '../hooks/usePublicProducts';

type FilterType = 'all' | 'plisse' | 'enroulable' | 'panneau';
type LangKey = 'fr' | 'ar' | 'tn' | 'en' | 'it';

const comparisonData = [
  {
    id: 'colibri-50',
    name: 'COLIBRÌ 50',
    image: '/images/colibri-50.png',
    type: { fr: 'Plissé enroulable', ar: 'قابل للطي', tn: 'قابل للطي', en: 'Roller pleated', it: 'Avvolgibile pieghevole' },
    usage: { fr: 'Fenêtre / Porte', ar: 'نافذة / باب', tn: 'شباك / بيب', en: 'Window / Door', it: 'Finestra / Porta' },
    maxW: '200 cm',
    maxH: '250 cm',
    priceFrom: '263',
    features: { cassette: true, poignee: false, doubleVantail: false, fixe: false },
  },
  {
    id: 'sidney-50',
    name: 'SIDNEY 50',
    image: '/images/sidney-50.png',
    type: { fr: 'Enroulable latéral', ar: 'لفافي جانبي', tn: 'رولو جانبي', en: 'Side roller', it: 'Avvolgibile laterale' },
    usage: { fr: 'Fenêtre / Porte', ar: 'نافذة / باب', tn: 'شباك / بيب', en: 'Window / Door', it: 'Finestra / Porta' },
    maxW: '200 cm',
    maxH: '260 cm',
    priceFrom: '611',
    features: { cassette: true, poignee: true, doubleVantail: false, fixe: false },
  },
  {
    id: 'sidney-50-ac',
    name: 'SIDNEY 50 AC',
    image: '/images/sidney-50-ac.png',
    type: { fr: 'Double enroulable', ar: 'لفافي مزدوج', tn: 'رولو مزدوج', en: 'Double roller', it: 'Doppio avvolgibile' },
    usage: { fr: 'Grande ouverture / Terrasse', ar: 'فتحة كبيرة / شرفة', tn: 'فتحة كبيرة / تراس', en: 'Large opening / Terrace', it: 'Grande apertura / Terrazza' },
    maxW: '400 cm',
    maxH: '260 cm',
    priceFrom: '1224',
    features: { cassette: true, poignee: true, doubleVantail: true, fixe: false },
  },
  {
    id: 'elba',
    name: 'ELBA',
    image: '/images/elba.png',
    type: { fr: 'Panneau fixe', ar: 'لوح ثابت', tn: 'بانو ثابت', en: 'Fixed panel', it: 'Pannello fisso' },
    usage: { fr: 'Fenêtre / Porte', ar: 'نافذة / باب', tn: 'شباك / بيب', en: 'Window / Door', it: 'Finestra / Porta' },
    maxW: '—',
    maxH: '—',
    priceFrom: '326',
    features: { cassette: false, poignee: false, doubleVantail: false, fixe: true },
  },
  {
    id: 'plisse31',
    name: 'PLISSÉ 31',
    image: '/images/plisse31.png',
    type: { fr: 'Plissé bilatéral', ar: 'مطوية ثنائية', tn: 'مطوية ثنائية', en: 'Bilateral pleated', it: 'Plissettata bilaterale' },
    usage: { fr: 'Fenêtre / Porte', ar: 'نافذة / باب', tn: 'شباك / باب', en: 'Window / Door', it: 'Finestra / Porta' },
    maxW: '500 cm',
    maxH: '300 cm',
    priceFrom: '1115',
    features: { cassette: false, poignee: false, doubleVantail: true, fixe: false },
  },
];

const Products = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ['ar', 'tn'].includes(i18n.language);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showDevis, setShowDevis] = useState(false);
  const [devisProductId, setDevisProductId] = useState<string | undefined>(undefined);
  const [searchParams] = useSearchParams();
  const { products } = usePublicProducts();
  const lang = (i18n.language as LangKey) || 'fr';
  const loc = (obj: Record<string, string>) => obj[lang] ?? obj.fr;

  useEffect(() => {
    const pid = searchParams.get('produit');
    if (pid && (pid !== devisProductId || !showDevis)) { 
      setDevisProductId(pid); 
      setShowDevis(true); 
    }
  }, [searchParams, devisProductId, showDevis]);

  useEffect(() => {
    if (showDevis) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [showDevis]);

  const filteredProducts = activeFilter === 'all'
    ? products
    : products.filter(p => p.category === activeFilter);
  const visibleProductIds = new Set(products.map(product => product.id));
  const filteredComparisonData = comparisonData.filter(item => visibleProductIds.has(item.id));

  const filters: { key: FilterType; label: Record<LangKey, string> }[] = [
    { key: 'all', label: { fr: 'Tous', ar: 'الكل', tn: 'الكل', en: 'All', it: 'Tutti' } },
    { key: 'plisse', label: { fr: 'Plissés', ar: 'مطوية', tn: 'بليسي', en: 'Pleated', it: 'Pieghevoli' } },
    { key: 'enroulable', label: { fr: 'Enroulables', ar: 'دوارة', tn: 'رولو', en: 'Rollers', it: 'Avvolgibili' } },
    { key: 'panneau', label: { fr: 'Panneaux', ar: 'لوحية', tn: 'بانو', en: 'Panels', it: 'Pannelli' } },
  ];

  const featureLabels: Record<string, Record<LangKey, string>> = {
    cassette: { fr: 'Caisson', ar: 'صندوق', tn: 'بيت', en: 'Cassette', it: 'Cassonetto' },
    poignee: { fr: 'Poignée ext.', ar: 'مقبض خارجي', tn: 'مقبض خارجي', en: 'Ext. handle', it: 'Maniglia est.' },
    doubleVantail: { fr: 'Double vantail', ar: 'ثنائي', tn: 'ثنائي', en: 'Double leaf', it: 'Doppio anta' },
    fixe: { fr: 'Panneau fixe', ar: 'لوح ثابت', tn: 'بانو ثابت', en: 'Fixed panel', it: 'Pannello fisso' },
  };

  return (
    <div className="pb-24" style={{ background: '#F5F7FA', minHeight: '100vh' }}>
      <PageSEO
        path="/produits"
        titleFr="Produits — Moustiquaires Grifo Flex | Aluminium Space Tunisie"
        titleAr="المنتجات — مستيكارات Grifo Flex | Aluminium Space تونس"
        titleEn="Products — Grifo Flex Screens | Aluminium Space Tunisia"
        descFr="Découvrez les 5 modèles Grifo Flex : Colibrì 50, Sidney 50, Sidney 50 AC, ELBA, Plissé 31. Moustiquaires sur mesure installées par Aluminium Space à Mghira."
        descAr="اكتشف 5 موديلات Grifo Flex : Colibrì 50، Sidney 50، Sidney 50 AC، ELBA، بليسي 31. مستيكارات على المقاس تُركّب من قبل Aluminium Space."
        descEn="Discover 5 Grifo Flex models: Colibrì 50, Sidney 50, Sidney 50 AC, ELBA, Plissé 31. Custom screens installed by Aluminium Space in Mghira."
      />

      {/* Hero banner */}
      <div style={{ background: '#1D3E61', paddingTop: '80px', paddingBottom: '48px' }}>
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'inline-block', background: 'rgba(129,192,99,0.15)', color: '#81C063', borderRadius: '20px', padding: '5px 16px', fontSize: '12px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'Rajdhani, sans-serif', marginBottom: '14px' }}>
              <ItalyFlag /> Grifo Flex — 5 {loc({ fr: 'modèles disponibles', ar: 'موديلات متوفرة', tn: 'موديلات متوفرة', en: 'models available', it: 'modelli disponibili' })}
            </div>
            <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'clamp(28px, 7vw, 48px)', color: '#FFFFFF', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '14px' }}>
              {t('products_page.title')}
            </h1>
            <div style={{ width: '52px', height: '3px', background: '#81C063', margin: '0 auto 16px auto', borderRadius: '2px' }} />
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 'clamp(14px, 2.5vw, 17px)', color: 'rgba(255,255,255,0.85)', maxWidth: '520px', margin: '0 auto 24px', lineHeight: 1.7 }}>
              {t('products_page.why_desc')}
            </p>
            <button
              onClick={() => { setDevisProductId(undefined); setShowDevis(true); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#81C063', color: 'white', borderRadius: '10px', padding: '13px 28px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '14px', letterSpacing: '1.5px', textTransform: 'uppercase', border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(129,192,99,0.35)', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#6aaa4f'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#81C063'; e.currentTarget.style.transform = 'none'; }}
            >
              <FileText size={15} />
              {loc({ fr: 'Faire un devis gratuit', ar: 'إعداد ديفيس مجاني', tn: 'Amel devis bla7sab', en: 'Get a free quote', it: 'Preventivo gratuito' })}
            </button>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-10">

        {/* Filter tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="scroll-x snap-x flex md:justify-center pr-[70px] md:pr-0"
          style={{ gap: '8px', marginBottom: '24px', flexWrap: 'nowrap' }}
        >
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className="snap-item"
              style={{
                padding: '8px 20px',
                borderRadius: '22px',
                border: `1.5px solid ${activeFilter === f.key ? '#81C063' : '#DBDADA'}`,
                background: activeFilter === f.key ? '#81C063' : 'white',
                color: activeFilter === f.key ? 'white' : '#2F2D2C',
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 700,
                fontSize: '13px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {loc(f.label)}
            </button>
          ))}
        </motion.div>

        {/* Grille produits Desktop */}
        <div className={`hidden md:grid gap-5 max-w-[1200px] mx-auto ${
          filteredProducts.length === 5 ? 'grid-cols-2 lg:grid-cols-6' :
          filteredProducts.length === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' :
          filteredProducts.length === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
          filteredProducts.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
          'grid-cols-1 sm:grid-cols-2 max-w-[320px]'
        }`}>
          {filteredProducts.map((product, index) => (
            <div
              key={product.id}
              className={filteredProducts.length === 5
                ? index < 3
                  ? 'lg:col-span-2'
                  : index === 3
                    ? 'lg:col-span-2 lg:col-start-2'
                    : 'lg:col-span-2 lg:col-start-4'
                : ''
              }
            >
              <ProductCard product={product} index={index} />
            </div>
          ))}
        </div>

        {/* Liste produits Mobile */}
        <div className="flex flex-col gap-4 md:hidden">
          {filteredProducts.map((p) => (
            <Link to={`/produits/${p.id}`} key={p.id} className="mobile-card" style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', height: '160px', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #DBDADA', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
              <div style={{ width: '35%', background: '#F5F7FA', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', [isRTL ? 'borderLeft' : 'borderRight']: '1px solid #DBDADA' }}>
                <img src={p.imageUrl} alt={p.name} className="no-rtl-flip" style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'none' }} />
              </div>
              <div style={{ width: '65%', padding: '16px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: isRTL ? 'right' : 'left' }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#296788', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', textTransform: 'uppercase', marginBottom: '4px' }}>{t(`products.category_${p.category}`)}</div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#2F2D2C', fontFamily: 'Rajdhani, sans-serif', marginBottom: '2px' }}>{p.name}</h3>
                  <p style={{ fontSize: '11px', color: '#818181', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.3, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t(p.descriptionKey)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Tableau comparatif ─────────────────────────────────────────── */}
        <section style={{ marginTop: '64px', maxWidth: '1200px', margin: '64px auto 0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'clamp(20px, 4vw, 30px)', color: '#2F2D2C', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
              {loc({ fr: 'Comparatif des modèles', ar: 'مقارنة الموديلات', tn: 'مقارنة الموديلات', en: 'Model comparison', it: 'Confronto modelli' })}
            </h2>
            <div style={{ width: '40px', height: '3px', background: '#81C063', margin: '0 auto', borderRadius: '2px' }} />
          </motion.div>

          <div className="table-scroll-hint">
            {isRTL ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(180deg)' }}><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>}
            {t('products_page.compare_hint', 'Faites glisser pour voir tout le tableau')}
          </div>
          <motion.div
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #DBDADA', boxShadow: '0 4px 20px rgba(47,45,44,0.07)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead>
                <tr style={{ background: '#0D1B2A' }}>
                  <th style={{ padding: '16px 20px', textAlign: isRTL ? 'right' : 'left', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '13px', color: 'rgba(255,255,255,0.85)', letterSpacing: '1px', textTransform: 'uppercase', width: '180px' }}>
                    {loc({ fr: 'Modèle', ar: 'الموديل', tn: 'الموديل', en: 'Model', it: 'Modello' })}
                  </th>
                  <th style={{ padding: '16px 20px', textAlign: isRTL ? 'right' : 'left', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '13px', color: 'rgba(255,255,255,0.85)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    {loc({ fr: 'Type', ar: 'النوع', tn: 'النوع', en: 'Type', it: 'Tipo' })}
                  </th>
                  <th style={{ padding: '16px 20px', textAlign: isRTL ? 'right' : 'left', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '13px', color: 'rgba(255,255,255,0.85)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    {loc({ fr: 'Usage', ar: 'الاستخدام', tn: 'الاستخدام', en: 'Usage', it: 'Uso' })}
                  </th>
                  <th style={{ padding: '16px 20px', textAlign: 'center', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '13px', color: 'rgba(255,255,255,0.85)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    {loc({ fr: 'Larg. max', ar: 'أقصى عرض', tn: 'أقصى عرض', en: 'Max width', it: 'Largh. max' })}
                  </th>
                  <th style={{ padding: '16px 20px', textAlign: 'center', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '13px', color: 'rgba(255,255,255,0.85)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    {loc({ fr: 'Haut. max', ar: 'أقصى ارتفاع', tn: 'أقصى ارتفاع', en: 'Max height', it: 'Alt. max' })}
                  </th>
                  {Object.keys(featureLabels).map(fk => (
                    <th key={fk} style={{ padding: '16px 12px', textAlign: 'center', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '12px', color: 'rgba(255,255,255,0.85)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                      {loc(featureLabels[fk])}
                    </th>
                  ))}
                  <th style={{ padding: '16px 20px', textAlign: 'center', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '13px', color: 'rgba(255,255,255,0.85)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    {loc({ fr: 'À partir de', ar: 'ابتداءً من', tn: 'ابتداءً من', en: 'From', it: 'Da' })}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredComparisonData.map((item, i) => (
                  <tr key={item.id} style={{ borderBottom: i < filteredComparisonData.length - 1 ? '1px solid #E8EDF5' : 'none', background: i % 2 === 0 ? 'white' : '#F8FAFD' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: '12px' }}>
                        <img src={item.image} alt={item.name} className="no-rtl-flip" style={{ width: '44px', height: '44px', objectFit: 'contain', background: '#F5F7FA', borderRadius: '8px', padding: '4px', transform: 'none' }} />
                        <Link to={`/produits/${item.id}`} style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '15px', color: '#1A5DA8', textDecoration: 'none', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#81C063'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#1A5DA8'}
                        >
                          {item.name} <LinkIcon size={12} className="no-rtl-flip" style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} />
                        </Link>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#4A5568' }}>{loc(item.type)}</td>
                    <td style={{ padding: '16px 20px', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#4A5568' }}>{loc(item.usage)}</td>
                    <td style={{ padding: '16px 20px', textAlign: 'center', fontFamily: 'monospace', fontSize: '13px', fontWeight: 600, color: '#2F2D2C' }}>{item.maxW}</td>
                    <td style={{ padding: '16px 20px', textAlign: 'center', fontFamily: 'monospace', fontSize: '13px', fontWeight: 600, color: '#2F2D2C' }}>{item.maxH}</td>
                    {Object.keys(featureLabels).map(fk => (
                      <td key={fk} style={{ padding: '16px 12px', textAlign: 'center' }}>
                        {(item.features as Record<string, boolean>)[fk]
                          ? <CheckCircle size={16} color="#81C063" style={{ display: 'inline' }} />
                          : <XCircle size={16} color="#DBDADA" style={{ display: 'inline' }} />
                        }
                      </td>
                    ))}
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '15px', color: '#27AE60' }}>{item.priceFrom}</span>
                      <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: '#818181', [isRTL ? 'marginRight' : 'marginLeft']: '3px' }}>DT HT</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
          <p style={{ textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#818181', marginTop: '12px' }}>
            {loc({ fr: '* Prix indicatifs HT. TVA 19% + remise commerciale selon volume.', ar: '* أسعار تقريبية قبل الضريبة. ض.ق.م 19% + خصم تجاري حسب الكمية.', tn: '* أسعار تقريبية قبل الأداء. ض.ق.م 19% + خصم تجاري حسب الكمية.', en: '* Indicative prices excl. tax. 19% VAT + commercial discount by volume.', it: '* Prezzi indicativi IVA esclusa. IVA 19% + sconto commerciale in base al volume.' })}
          </p>
          <p style={{ textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: '#818181', marginTop: '4px' }}>
            {loc({ 
              fr: '** Colibrì 50 : largeur max 200 cm pour H ≤ 170 cm, 160 cm pour H > 170 cm.', 
              ar: '** Colibrì 50: أقصى عرض 200 سم للارتفاع ≤ 170 سم، و160 سم للارتفاع > 170 سم.',
              tn: '** Colibrì 50: 200 cm max width lil toul ≤ 170 cm, 160 cm lil toul > 170 cm.',
              en: '** Colibrì 50: max width 200 cm for H ≤ 170 cm, 160 cm for H > 170 cm.',
              it: '** Colibrì 50: larghezza max 200 cm per H ≤ 170 cm, 160 cm per H > 170 cm.'
            })}
          </p>
        </section>

        {/* Section Qualité */}
        <section style={{
          marginTop: '64px',
          background: '#FFFFFF',
          borderRadius: '20px',
          padding: 'clamp(20px, 4vw, 48px)',
          border: '1px solid #DBDADA',
          boxShadow: '0 4px 20px rgba(47,45,44,0.07)',
          maxWidth: '1200px',
          margin: '64px auto 0 auto'
        }}>
          <div style={{
            background: 'rgba(129,192,99,0.1)',
            color: '#81C063',
            borderRadius: '20px',
            padding: '6px 16px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'inline-block',
            marginBottom: '12px',
            fontFamily: 'Rajdhani, sans-serif',
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}>
            <ItalyFlag /> {t('products_page.quality_badge')}
          </div>
          <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'clamp(20px, 5vw, 30px)', color: '#2F2D2C', margin: '0 0 16px 0', letterSpacing: '2px', textTransform: 'uppercase' }}>
            {t('products_page.why_title')}
          </h2>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '15px', color: '#818181', lineHeight: 1.75, maxWidth: '700px', marginBottom: '24px' }}>
            {t('products_page.why_desc')}
          </p>
          <div style={{ borderTop: '1px solid #DBDADA', margin: '24px 0' }} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Shield, titleKey: 'products_page.feat1_title', descKey: 'products_page.feat1_desc' },
              { icon: Ruler, titleKey: 'products_page.feat2_title', descKey: 'products_page.feat2_desc' },
              { icon: Award, titleKey: 'products_page.feat3_title', descKey: 'products_page.feat3_desc' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', gap: '14px', alignItems: 'flex-start', textAlign: isRTL ? 'right' : 'left' }}>
                <div style={{ background: 'rgba(41,103,136,0.08)', padding: '10px', borderRadius: '10px', flexShrink: 0 }}>
                  <item.icon color="#296788" size={28} />
                </div>
                <div>
                  <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '16px', color: '#2F2D2C', marginBottom: '4px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    {t(item.titleKey)}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#818181', lineHeight: 1.6, fontFamily: 'DM Sans, sans-serif' }}>
                    {t(item.descKey)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
      <HowItWorks />

      {/* ── Devis Modal Overlay ───────────────────────────────────────── */}
      <AnimatePresence>
        {showDevis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(13,27,42,0.65)', overflowY: 'auto', padding: 'clamp(16px, 4vw, 40px) 16px' }}
            onClick={e => { if (e.target === e.currentTarget) setShowDevis(false); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ duration: 0.22 }}
              style={{ maxWidth: '900px', margin: '0 auto', position: 'relative' }}
            >
              <button
                onClick={() => setShowDevis(false)}
                style={{ position: 'absolute', top: '8px', [isRTL ? 'left' : 'right']: '8px', zIndex: 10, width: '40px', height: '40px', borderRadius: '50%', background: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
                aria-label={t('common.close', 'Fermer')}
              >
                <XIcon size={18} color="#1D3E61" />
              </button>
              <Suspense fallback={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                  <div style={{ width: '40px', height: '40px', border: '3px solid #81C063', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                </div>
              }>
                <DevisWizard initialProductId={devisProductId} onClose={() => setShowDevis(false)} />
              </Suspense>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Products;
