import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { products } from '../../data/products';
import { useTranslation } from 'react-i18next';

const SearchModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const filtered = query.trim()
    ? products.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase())
      )
    : products;

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleSelect = (id: string) => {
    setIsOpen(false);
    navigate(`/produits/${id}`);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors hover:bg-[var(--bg-tertiary)]"
        aria-label="Rechercher"
      >
        <Search className="w-4 h-4 text-[var(--text-secondary)]" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]"
            style={{ background: 'rgba(13, 27, 42, 0.4)', backdropFilter: 'blur(8px)' }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-[600px] mx-4 rounded-[16px] overflow-hidden bg-white shadow-2xl"
              style={{ border: '1px solid var(--border)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <Search className="w-5 h-5 text-[var(--text-muted)] shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Rechercher un produit..."
                  className="flex-1 bg-transparent border-none outline-none text-[var(--text-primary)] text-lg font-display placeholder:text-[var(--text-muted)]"
                />
                <button onClick={() => setIsOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-[400px] overflow-y-auto p-2">
                {filtered.length > 0 ? (
                  filtered.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleSelect(product.id)}
                      className="w-full flex items-center gap-4 p-3 rounded-xl text-left transition-colors hover:bg-[var(--bg-tertiary)]"
                    >
                      <div
                        className="w-14 h-14 rounded-xl p-2 shrink-0 flex items-center justify-center"
                        style={{ background: '#F8FAFD', border: '1px solid var(--border)' }}
                      >
                        <img src={product.imageUrl} alt={product.name} className="max-w-full max-h-full object-contain" loading="lazy" />
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-[var(--text-primary)] text-sm">{product.name}</h4>
                        <p className="text-[var(--text-muted)] text-xs">{t(`products.category_${product.category}`)}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-[var(--text-muted)] text-sm">
                    Aucun produit trouvé pour "{query}"
                  </div>
                )}
              </div>

              <div className="px-5 py-3 text-xs text-[var(--text-muted)]" style={{ borderTop: '1px solid var(--border)' }}>
                <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[10px] font-mono text-[var(--text-secondary)]">ESC</kbd> pour fermer
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SearchModal;
