import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Calculator } from 'lucide-react';
import type { Product } from '../../data/products';
import DevisModal from '../devis/DevisModal';

interface ProductCardProps {
  product: Product;
  index: number;
}

const ProductCard = ({ product, index }: ProductCardProps) => {
  const { t } = useTranslation();
  const [showDevis, setShowDevis] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        className="group flex flex-col h-full rounded-[16px] overflow-hidden transition-all duration-300 bg-white"
        style={{
          border: '1px solid #DBDADA',
          boxShadow: '0 1px 4px rgba(47,45,44,0.06)',
        }}
        whileHover={{
          y: -4,
          transition: { duration: 0.3 },
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = '#81C063';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(129,192,99,0.15)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = '#DBDADA';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(47,45,44,0.06)';
        }}
      >
        {/* Image Area */}
        <div
          className="relative flex items-center justify-center p-4 overflow-hidden"
          style={{ background: '#F5F7FA', minHeight: '200px' }}
        >
          <img
            src={product.imageUrl}
            alt={product.name}
            className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {/* Badge catégorie */}
          <div className="absolute top-4 right-4 z-10">
            <span
              className="px-2 py-1 text-[10px] font-display font-semibold rounded-[5px] uppercase"
              style={{
                letterSpacing: '1px',
                color: '#81C063',
                background: 'rgba(129,192,99,0.12)',
                fontFamily: 'Rajdhani, sans-serif',
              }}
            >
              {t(`products.category_${product.category}`)}
            </span>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-0 flex flex-col flex-grow">
          <div className="p-4 pb-3 flex-grow">
            <h3
              className="font-display font-bold text-[17px] mb-1.5 transition-colors duration-300"
              style={{ color: '#2F2D2C', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '1px' }}
            >
              {product.name}
            </h3>
            <p
              className="text-[13px] mb-1 line-clamp-2"
              style={{ color: '#818181', lineHeight: 1.55, fontFamily: 'DM Sans, sans-serif' }}
            >
              {t(product.descriptionKey)}
            </p>
          </div>

          {/* Buttons */}
          <div style={{ borderTop: '1px solid #DBDADA' }}>
            <Link
              to={`/produits/${product.id}`}
              className="block w-full text-center font-display font-semibold text-[13px] transition-all duration-200"
              style={{
                background: '#1D3E61',
                color: 'white',
                padding: '10px 16px',
                fontFamily: 'Rajdhani, sans-serif',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#0F2444'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#1D3E61'; }}
            >
              {t('products.view_details')} →
            </Link>
            <button
              onClick={() => setShowDevis(true)}
              className="flex items-center justify-center gap-2 w-full text-[13px] font-semibold transition-all duration-200"
              style={{
                background: '#81C063',
                color: 'white',
                padding: '10px 16px',
                borderRadius: '0 0 16px 16px',
                fontFamily: 'Rajdhani, sans-serif',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#5e9a43'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#81C063'; }}
            >
              <Calculator size={14} />
              {t('product_detail.cta_quote')}
            </button>
          </div>
        </div>
      </motion.div>

      <DevisModal
        isOpen={showDevis}
        onClose={() => setShowDevis(false)}
        productId={product.id}
      />
    </>
  );
};

export default ProductCard;
