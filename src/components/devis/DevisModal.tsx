import { useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
const DevisWizard = lazy(() => import('./DevisWizard'));

interface DevisModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId?: string;
}

const DevisModal = ({ isOpen, onClose, productId }: DevisModalProps) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
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
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="modal-viewport-height"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9000,
            background: 'rgba(15,36,68,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '80px 16px 32px',
            overflowY: 'auto',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{
              background: '#F5F7FA',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '940px',
              padding: '40px 24px',
              position: 'relative',
              boxShadow: '0 24px 64px rgba(15,36,68,0.25)',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '28px',
              paddingBottom: '20px',
              borderBottom: '1px solid #DBDADA',
            }}>
              <div>
                <h2 style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: 700,
                  fontSize: 'clamp(20px, 4vw, 28px)',
                  color: '#2F2D2C',
                  letterSpacing: '3px',
                  textTransform: 'uppercase',
                  margin: 0,
                }}>
                  {t('devis_page.title')}
                </h2>
                <p style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '14px',
                  color: '#818181',
                  margin: '4px 0 0 0',
                }}>
                  {t('devis_page.subtitle')}
                </p>
              </div>

              <button
                onClick={onClose}
                aria-label="Fermer"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(47,45,44,0.07)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(47,45,44,0.15)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(47,45,44,0.07)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <X size={18} color="#2F2D2C" />
              </button>
            </div>

            <Suspense fallback={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid #81C063', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            }>
              <DevisWizard initialProductId={productId} onClose={onClose} />
            </Suspense>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DevisModal;
