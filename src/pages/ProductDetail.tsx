import { useState, Suspense, lazy } from 'react';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, ChevronDown, Ruler, Bot } from 'lucide-react';
import { products, priceTables } from '../data/products';
import { useAIAgentContext } from '../context/AIAgentContext';
import DevisModal from '../components/devis/DevisModal';
import PageSEO from '../components/ui/PageSEO';



const MeasurementGuide = lazy(() => import('../components/products/MeasurementGuide'));

const PriceTable1D = ({ title, columns, prices, prefix, tooltipTemplate }: {
  title: string;
  columns: number[];
  prices: number[];
  prefix: string;
  tooltipTemplate: (val: number) => string;
}) => {
  const { t } = useTranslation();
  return (
    <div className="mb-4">
      <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#296788', marginBottom: '8px', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '1px', textTransform: 'uppercase' }}>{title}</h4>
      <div style={{
        overflowX: 'scroll',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        marginBottom: '16px',
      }}>
        <table style={{
          borderCollapse: 'collapse',
          tableLayout: 'auto',
          whiteSpace: 'nowrap',
        }}>
          <thead>
            <tr style={{ background: '#1A5DA8' }}>
              <th style={{ padding: '12px 16px', color: 'white', textAlign: 'left', fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                {prefix}
              </th>
              {columns.map(col => (
                <th key={col} style={{ padding: '12px 16px', color: 'white', textAlign: 'center', fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap', minWidth: '100px' }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '14px 16px', fontSize: '13px', color: '#3D5166', fontWeight: 500, whiteSpace: 'nowrap', borderRight: '1px solid #E8EDF5', background: 'white' }}>
                {t('product_detail.price_unit_ht')}
              </td>
              {prices.map((price, i) => (
                <td key={i} className="group relative" style={{ padding: '14px 16px', textAlign: 'center', whiteSpace: 'nowrap', background: i % 2 === 0 ? 'white' : '#F8FAFD' }}>
                  <span style={{ color: '#27AE60', fontWeight: 700, fontSize: '15px' }}>
                    {(price / 1000).toFixed(3)}
                  </span>
                  <span style={{ color: '#7A8FA6', fontSize: '11px', marginLeft: '3px' }}>DT</span>
                  <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none z-10 shadow-lg">
                    {tooltipTemplate(columns[i])}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

type HeightRange = '120-180' | '180-240' | '240-300';
type Plisse31Prices = Record<HeightRange, number>;

const ProductDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { sendMessageToAgent } = useAIAgentContext();


  const [showMeasure, setShowMeasure] = useState(false);
  const [showPrices, setShowPrices] = useState(false);
  const [showDevis, setShowDevis] = useState(false);


  const product = products.find(p => p.id === id);

  if (!product) {
    return <Navigate to="/produits" replace />;
  }

  return (
    <>
      <PageSEO
        path={`/produits/${product.id}`}
        titleFr={`${product.name} — Moustiquaire sur mesure | Aluminium Space`}
        descFr={`Découvrez ${product.name} : moustiquaire sur mesure Grifo Flex à Mghira, Tunis. Qualité italienne, pose rapide, devis gratuit.`}
        titleEn={`${product.name} — Custom mosquito net | Aluminium Space`}
        descEn={`Discover ${product.name}: custom Grifo Flex mosquito net in Mghira, Tunis. Italian quality, fast installation, free quote.`}
      />

      {/* Dark hero banner */}
      <div style={{ background: '#1D3E61', paddingTop: '80px', paddingBottom: '40px' }}>
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {/* Breadcrumb */}
            <nav style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', marginBottom: '20px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px', fontFamily: 'DM Sans, sans-serif' }}>
              <Link to="/" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }} onMouseEnter={(e) => e.currentTarget.style.color = '#81C063'} onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.85)')}>
                {t('product_detail.breadcrumb_home')}
              </Link>
              <span>›</span>
              <Link to="/produits" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }} onMouseEnter={(e) => e.currentTarget.style.color = '#81C063'} onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.85)')}>
                {t('product_detail.breadcrumb_products')}
              </Link>
              <span>›</span>
              <span style={{ color: '#81C063', fontWeight: 600 }}>{product.name}</span>
            </nav>
            <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'clamp(28px, 6vw, 48px)', color: '#FFFFFF', letterSpacing: '2px', textTransform: 'uppercase', margin: 0, marginBottom: '12px' }}>
              {product.name}
            </h1>
            <div style={{ width: '48px', height: '3px', background: '#81C063', borderRadius: '2px' }} />
          </motion.div>
        </div>
      </div>

      <div className="pb-[88px] md:pb-0" style={{ background: '#F5F7FA', minHeight: '100vh' }}>
        <div className="product-detail-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(32px, 4vw, 48px) clamp(16px, 3vw, 24px)' }}>

          {/* TWO COLUMN LAYOUT */}
          <div className="flex flex-col lg:flex-row items-start" style={{ gap: 'clamp(16px, 3vw, 40px)' }}>

            {/* Left Column — Image (45%) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full lg:w-[45%]"
              style={{ minWidth: 0 }}
            >
              <div style={{ background: '#FFFFFF', border: '1px solid #DBDADA', borderRadius: '20px', padding: 'clamp(16px, 4vw, 32px)', boxShadow: '0 4px 20px rgba(47,45,44,0.07)' }}>
                <div style={{ background: '#F5F7FA', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-[280px] md:h-auto md:max-h-[420px]"
                    style={{ width: '100%', objectFit: 'contain' }}
                    loading="lazy"
                  />
                </div>

                {/* Boutons viewers */}
                <div style={{ marginTop: '16px', gap: '10px' }} className="flex flex-col gap-3 w-full">




                  <button
                    onClick={() => setShowMeasure(true)}
                    className="w-full"
                    style={{
                      background: '#81C063',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      height: '54px',
                      fontFamily: 'Rajdhani, sans-serif',
                      fontWeight: 700,
                      fontSize: '16px',
                      letterSpacing: '2px',
                      textTransform: 'uppercase',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                      boxShadow: '0 6px 20px rgba(129,192,99,0.3)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#5e9a43'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#81C063'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <Ruler className="w-4 h-4" />
                    <span className="hidden md:inline">{t('product_detail.btn_measure')}</span>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Right Column — Info produit (55%) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="w-full lg:w-[55%]"
              style={{ minWidth: 0 }}
            >
              <div style={{ background: '#FFFFFF', border: '1px solid #DBDADA', borderRadius: '20px', padding: 'clamp(16px, 4vw, 32px)', boxShadow: '0 4px 20px rgba(47,45,44,0.07)' }}>

                {/* Badge catégorie */}
                <div style={{
                  background: 'rgba(129,192,99,0.1)',
                  color: '#81C063',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  display: 'inline-block',
                  marginBottom: '12px',
                  fontFamily: 'Rajdhani, sans-serif',
                  textTransform: 'uppercase',
                }}>
                  {t(`products.category_${product.category}`)}
                </div>

                {/* Nom produit */}
                <h1 className="product-detail-name" style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  fontSize: 'clamp(24px, 5vw, 38px)',
                  fontWeight: 700,
                  color: '#2F2D2C',
                  lineHeight: 1.1,
                  marginBottom: '16px',
                  letterSpacing: '3px',
                  textTransform: 'uppercase',
                }}>
                  {product.name}
                </h1>

                {/* Description */}
                <p style={{ fontSize: '15px', color: '#818181', lineHeight: 1.75, marginBottom: '24px', fontFamily: 'DM Sans, sans-serif' }}>
                  {t(product.descriptionKey)}
                </p>

                {/* Divider */}
                <div style={{ borderTop: '1px solid #DBDADA', margin: '0 0 24px' }} />



                {/* Toggle tarif */}
                <button
                  onClick={() => setShowPrices(!showPrices)}
                  style={{
                    background: 'white',
                    border: `1px solid ${showPrices ? '#81C063' : '#DBDADA'}`,
                    color: showPrices ? '#81C063' : '#296788',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: 700,
                    fontFamily: 'Rajdhani, sans-serif',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '16px',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#81C063'; e.currentTarget.style.color = '#81C063'; }}
                  onMouseLeave={(e) => { if (!showPrices) { e.currentTarget.style.borderColor = '#DBDADA'; e.currentTarget.style.color = '#296788'; } }}
                >
                  📋 {t('product_detail.see_price')}
                  <ChevronDown className="w-4 h-4 transition-transform duration-300" style={{ transform: showPrices ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                </button>

                <AnimatePresence>
                  {showPrices && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ paddingBottom: '16px' }}>
                        {product.id === 'colibri-50' && (
                          <>
                            <PriceTable1D
                              title={t('product_detail.colibri_h170')}
                              prefix={t('product_detail.col_width')}
                              columns={priceTables.colibri50.height170.widths}
                              prices={priceTables.colibri50.height170.prices}
                              tooltipTemplate={(w) => t('product_detail.tooltip_wh', { w, h: 170 })}
                            />
                            <PriceTable1D
                              title={t('product_detail.colibri_h250')}
                              prefix={t('product_detail.col_width')}
                              columns={priceTables.colibri50.height250.widths}
                              prices={priceTables.colibri50.height250.prices}
                              tooltipTemplate={(w) => t('product_detail.tooltip_wh', { w, h: 250 })}
                            />
                          </>
                        )}
                        {product.id === 'sidney-50' && (
                          <>
                            <PriceTable1D
                              title={t('product_detail.sidney_w160')}
                              prefix={t('product_detail.col_height')}
                              columns={priceTables.sidney50.width160.heights}
                              prices={priceTables.sidney50.width160.prices}
                              tooltipTemplate={(h) => t('product_detail.tooltip_max_wh', { maxW: 160, h })}
                            />
                            <PriceTable1D
                              title={t('product_detail.sidney_w200')}
                              prefix={t('product_detail.col_height')}
                              columns={priceTables.sidney50.width200.heights}
                              prices={priceTables.sidney50.width200.prices}
                              tooltipTemplate={(h) => t('product_detail.tooltip_exact_wh', { w: 200, h })}
                            />
                            <div style={{ background: 'rgba(41,103,136,0.06)', border: '1px solid rgba(41,103,136,0.2)', borderRadius: '12px', padding: '16px', marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: '#1D3E61', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <span style={{ color: 'white', fontSize: '16px' }}>💡</span>
                                </div>
                                <div>
                                  <p style={{ fontSize: '13px', color: '#2F2D2C', fontWeight: 600, margin: 0, fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.5px' }}>
                                    {t('product_detail.large_openings_title')}
                                  </p>
                                  <p style={{ fontSize: '12px', color: '#818181', margin: '2px 0 0 0', fontFamily: 'DM Sans, sans-serif' }}>
                                    {t('product_detail.large_openings_desc')}
                                  </p>
                                </div>
                              </div>
                              <Link
                                to="/produits/sidney-50-ac"
                                style={{ background: '#81C063', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', letterSpacing: '1px', textDecoration: 'none', whiteSpace: 'nowrap', transition: 'all 0.2s ease', textTransform: 'uppercase' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#5e9a43'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#81C063'}
                              >
                                {t('product_detail.see_sidney_ac')}
                              </Link>
                            </div>
                          </>
                        )}
                        {product.id === 'sidney-50-ac' && (
                          <>
                            <PriceTable1D
                              title={t('product_detail.sidney_ac_w320')}
                              prefix={t('product_detail.col_height')}
                              columns={priceTables.sidney50ac.width320.heights}
                              prices={priceTables.sidney50ac.width320.prices}
                              tooltipTemplate={(h) => t('product_detail.tooltip_max_wh', { maxW: 320, h })}
                            />
                            <PriceTable1D
                              title={t('product_detail.sidney_ac_w400')}
                              prefix={t('product_detail.col_height')}
                              columns={priceTables.sidney50ac.width400.heights}
                              prices={priceTables.sidney50ac.width400.prices}
                              tooltipTemplate={(h) => t('product_detail.tooltip_max_wh', { maxW: 400, h })}
                            />
                          </>
                        )}
                        {product.id === 'plisse31' && (
                          <div className="mb-4">
                            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#296788', marginBottom: '8px', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '1px', textTransform: 'uppercase' }}>
                              {t('product_detail.plisse31_prices')}
                            </h4>
                            <div style={{ overflowX: 'scroll', width: '100%', maxWidth: '100%', minWidth: 0, marginBottom: '16px' }}>
                              <table style={{ borderCollapse: 'collapse', tableLayout: 'auto', whiteSpace: 'nowrap' }}>
                                <thead>
                                  <tr style={{ background: '#1A5DA8' }}>
                                    <th style={{ padding: '12px 16px', color: 'white', textAlign: 'left', fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                                      {t('product_detail.col_width')}
                                    </th>
                                    <th style={{ padding: '12px 16px', color: 'white', textAlign: 'center', fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.2)' }}>H: 120–180</th>
                                    <th style={{ padding: '12px 16px', color: 'white', textAlign: 'center', fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.2)' }}>H: 180–240</th>
                                    <th style={{ padding: '12px 16px', color: 'white', textAlign: 'center', fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap' }}>H: 240–300</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(Object.entries(priceTables.plisse31) as [string, Plisse31Prices][]).map(([w, hPrices], i) => (
                                    <tr key={w} style={{ background: i % 2 === 0 ? 'white' : '#F8FAFD' }}>
                                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#3D5166', fontWeight: 500, whiteSpace: 'nowrap', borderRight: '1px solid #E8EDF5' }}>
                                        {w} cm
                                      </td>
                                      <td style={{ padding: '14px 16px', textAlign: 'center', whiteSpace: 'nowrap', borderRight: '1px solid #E8EDF5' }}>
                                        <span style={{ color: '#27AE60', fontWeight: 700, fontSize: '15px' }}>
                                          {(hPrices['120-180'] / 1000).toFixed(3)}
                                        </span>
                                        <span style={{ color: '#7A8FA6', fontSize: '11px', marginLeft: '3px' }}>DT</span>
                                      </td>
                                      <td style={{ padding: '14px 16px', textAlign: 'center', whiteSpace: 'nowrap', borderRight: '1px solid #E8EDF5' }}>
                                        <span style={{ color: '#27AE60', fontWeight: 700, fontSize: '15px' }}>
                                          {(hPrices['180-240'] / 1000).toFixed(3)}
                                        </span>
                                        <span style={{ color: '#7A8FA6', fontSize: '11px', marginLeft: '3px' }}>DT</span>
                                      </td>
                                      <td style={{ padding: '14px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                        <span style={{ color: '#27AE60', fontWeight: 700, fontSize: '15px' }}>
                                          {(hPrices['240-300'] / 1000).toFixed(3)}
                                        </span>
                                        <span style={{ color: '#7A8FA6', fontSize: '11px', marginLeft: '3px' }}>DT</span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                        {product.id === 'elba' && (
                          <div className="mb-4">
                            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#296788', marginBottom: '8px', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '1px', textTransform: 'uppercase' }}>{t('product_detail.price_per_sqm')}</h4>
                            <div style={{
                              overflowX: 'scroll',
                              width: '100%',
                              maxWidth: '100%',
                              minWidth: 0,
                              marginBottom: '16px',
                            }}>
                              <table style={{
                                borderCollapse: 'collapse',
                                tableLayout: 'auto',
                                whiteSpace: 'nowrap',
                              }}>
                                <thead>
                                  <tr style={{ background: '#1A5DA8' }}>
                                    <th style={{ padding: '12px 16px', color: 'white', textAlign: 'center', fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap', minWidth: '100px', borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                                      {t('product_detail.elba_glass')}
                                    </th>
                                    <th style={{ padding: '12px 16px', color: 'white', textAlign: 'center', fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap', minWidth: '100px', borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                                      {t('product_detail.elba_alu')}
                                    </th>
                                    <th style={{ padding: '12px 16px', color: 'white', textAlign: 'center', fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap', minWidth: '100px' }}>
                                      {t('product_detail.elba_inox')}
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td style={{ padding: '14px 16px', textAlign: 'center', whiteSpace: 'nowrap', background: 'white', borderRight: '1px solid #E8EDF5' }}>
                                      <span style={{ color: '#27AE60', fontWeight: 700, fontSize: '15px' }}>
                                        {(priceTables.elba.fibre / 1000).toFixed(3)}
                                      </span>
                                      <span style={{ color: '#7A8FA6', fontSize: '11px', marginLeft: '3px' }}>DT</span>
                                    </td>
                                    <td style={{ padding: '14px 16px', textAlign: 'center', whiteSpace: 'nowrap', background: '#F8FAFD', borderRight: '1px solid #E8EDF5' }}>
                                      <span style={{ color: '#27AE60', fontWeight: 700, fontSize: '15px' }}>
                                        {(priceTables.elba.aluminium / 1000).toFixed(3)}
                                      </span>
                                      <span style={{ color: '#7A8FA6', fontSize: '11px', marginLeft: '3px' }}>DT</span>
                                    </td>
                                    <td style={{ padding: '14px 16px', textAlign: 'center', whiteSpace: 'nowrap', background: 'white' }}>
                                      <span style={{ color: '#27AE60', fontWeight: 700, fontSize: '15px' }}>
                                        {(priceTables.elba.inox / 1000).toFixed(3)}
                                      </span>
                                      <span style={{ color: '#7A8FA6', fontSize: '11px', marginLeft: '3px' }}>DT</span>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Info TVA */}
                        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', color: '#92400E', fontFamily: 'DM Sans, sans-serif' }}>
                          ⚠️ {t('product_detail.tva_notice')}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>



                {/* Bouton CTA Devis Desktop */}
                <button
                  onClick={() => setShowDevis(true)}
                  className="hidden md:flex"
                  style={{
                    background: '#81C063',
                    color: 'white',
                    borderRadius: '10px',
                    height: '54px',
                    width: '100%',
                    fontFamily: 'Rajdhani, sans-serif',
                    fontSize: '16px',
                    fontWeight: 700,
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    boxShadow: '0 6px 20px rgba(129,192,99,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '20px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#5e9a43'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#81C063'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <Calculator className="w-5 h-5" />
                  {t('product_detail.cta_quote')}
                </button>

                {/* Bouton Demander à ALU */}
                <button
                  onClick={() => sendMessageToAgent(`Je veux en savoir plus sur le ${product.name} et son prix. Peux-tu m'aider ?`)}
                  style={{
                    background: 'rgba(29,62,97,0.06)',
                    color: '#1D3E61',
                    border: '1px solid rgba(29,62,97,0.2)',
                    borderRadius: '10px',
                    height: '44px',
                    width: '100%',
                    fontFamily: 'Rajdhani, sans-serif',
                    fontSize: '14px',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(29,62,97,0.1)'; e.currentTarget.style.borderColor = '#1D3E61'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(29,62,97,0.06)'; e.currentTarget.style.borderColor = 'rgba(29,62,97,0.2)'; }}
                >
                  <Bot className="w-4 h-4" />
                  {t('product_detail.ask_alu')}
                </button>

              </div>
            </motion.div>
          </div>
        </div>





        {/* Guide mesures */}
        {showMeasure && (
          <Suspense fallback={null}>
            <MeasurementGuide 
              productId={product.id} 
              productName={product.name} 
              onClose={() => setShowMeasure(false)}
              onCommande={(l: number, h: number) => {
                setShowMeasure(false);
                navigate('/devis', { 
                  state: { 
                    productId: product.id,
                    width: Math.round(l / 10), // mm → cm
                    height: Math.round(h / 10)
                  } 
                });
              }}
            />
          </Suspense>
        )}

        {/* Modal Devis */}
        <DevisModal
          isOpen={showDevis}
          onClose={() => setShowDevis(false)}
          productId={product.id}
        />
      </div>
    </>
  );
};

export default ProductDetail;
