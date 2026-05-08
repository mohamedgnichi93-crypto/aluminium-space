import { useTranslation } from 'react-i18next';
import { products } from '../../data/products';
import { motion } from 'framer-motion';

interface Props {
  selectedProductId: string;
  onSelect: (id: string) => void;
  onNext: () => void;
}

const StepProduct = ({ selectedProductId, onSelect, onNext }: Props) => {
  const { t } = useTranslation();

  return (
    <div className="animate-fade-in">
      <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '26px', letterSpacing: '2px', textTransform: 'uppercase', color: '#1D3E61', textAlign: 'center', marginBottom: '32px' }}>{t('quote.step1')}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {products.map((product, i) => {
          const isSelected = selectedProductId === product.id;
          return (
            <motion.button
              key={product.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelect(product.id)}
              className="relative flex items-center group text-left"
              style={{
                background: isSelected ? 'rgba(29,62,97,0.06)' : 'white',
                border: `2px solid ${isSelected ? '#1D3E61' : '#E2E8F0'}`,
                borderRadius: '14px',
                padding: '20px',
                cursor: 'pointer',
                gap: '16px',
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? '0 0 0 3px rgba(29,62,97,0.10)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#1D3E61';
                  e.currentTarget.style.background = 'rgba(29,62,97,0.03)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.background = 'white';
                }
              }}
            >
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  background: '#F8FAFD',
                  borderRadius: '8px',
                  padding: '8px',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} loading="lazy" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '18px', color: '#1D3E61', marginBottom: '4px', letterSpacing: '0.5px' }}>
                  {product.name}
                </h3>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#818181' }}>
                  {t(`products.category_${product.category}`)}
                </p>
              </div>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: `2px solid ${isSelected ? '#1D3E61' : '#E2E8F0'}`,
                  background: isSelected ? '#1D3E61' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {isSelected && (
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!selectedProductId}
          style={{
            background: !selectedProductId ? '#CBD5E0' : '#1D3E61',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            padding: '14px 32px',
            fontSize: '15px',
            fontWeight: 700,
            fontFamily: 'Rajdhani, sans-serif',
            cursor: !selectedProductId ? 'not-allowed' : 'pointer',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => { if (selectedProductId) { e.currentTarget.style.background = '#81C063'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(129,192,99,0.35)'; } }}
          onMouseLeave={e => { if (selectedProductId) { e.currentTarget.style.background = '#1D3E61'; e.currentTarget.style.boxShadow = 'none'; } }}
        >
          {t('quote.next')} →
        </button>
      </div>
    </div>
  );
};

export default StepProduct;
