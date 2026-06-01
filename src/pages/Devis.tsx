import { useEffect, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
const DevisWizard = lazy(() => import('../components/devis/DevisWizard'));
import PageSEO from '../components/ui/PageSEO';

const Devis = () => {
  const { t } = useTranslation();

  useEffect(() => {
    const preselected = localStorage.getItem('preselected_product');
    if (preselected) {
      localStorage.removeItem('preselected_product');
      window.dispatchEvent(new CustomEvent('ai-preselect-product', { detail: preselected }));
    }
  }, []);

  return (
    <>
      <PageSEO
        path="/devis"
        titleFr="Devis Gratuit — Moustiquaire sur mesure | Aluminium Space"
        descFr="Obtenez votre devis gratuit en ligne pour une moustiquaire sur mesure Grifo Flex. Configurez dimensions et modèle en quelques clics."
        titleEn="Free Quote — Custom mosquito net | Aluminium Space"
        descEn="Get your free online quote for a custom Grifo Flex mosquito net. Configure dimensions and model in just a few clicks."
      />

      {/* Dark hero */}
      <div style={{ background: '#1D3E61', paddingTop: '80px', paddingBottom: '48px', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(129,192,99,0.12)', border: '1px solid rgba(129,192,99,0.3)', borderRadius: '20px', padding: '6px 16px', marginBottom: '20px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#81C063' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2.5px', color: '#81C063', textTransform: 'uppercase', fontFamily: 'Rajdhani, sans-serif' }}>GRATUIT &amp; SANS ENGAGEMENT</span>
          </div>
          <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'clamp(28px, 7vw, 48px)', color: '#FFFFFF', letterSpacing: '3px', textTransform: 'uppercase', margin: '0 0 12px' }}>
            {t('devis_page.title')}
          </h1>
          <div style={{ width: '48px', height: '3px', background: '#81C063', margin: '0 auto 16px', borderRadius: '2px' }} />
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '15px', color: 'rgba(255,255,255,0.85)', maxWidth: '480px', margin: '0 auto' }}>
            {t('devis_page.subtitle')}
          </p>
        </motion.div>
      </div>

      <div className="pb-24" style={{ background: '#F5F7FA', minHeight: '60vh' }}>
        <div className="container mx-auto px-4 pt-10">
          <div className="max-w-4xl mx-auto">
            <Suspense fallback={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid #81C063', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            }>
              <DevisWizard />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
};

export default Devis;
