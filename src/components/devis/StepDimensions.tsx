import type { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { calculatePrice } from '../../utils/priceCalculator';
import { getSettings } from '../../store/settingsStore';
import { useEffect, useState, useRef } from 'react';
import { Minus, Plus } from 'lucide-react';
import { products } from '../../data/products';

interface Props {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  onNext: () => void;
  onPrev: () => void;
  productId: string;
  onAddAnother: () => void;
}

const StepDimensions = ({ register, errors, watch, setValue, onNext, onPrev, productId, onAddAnother }: Props) => {
  const width = watch('width');
  const height = watch('height');
  const quantity = watch('quantity') || 1;
  const meshType = watch('meshType');
  const color = watch('color') || 'Blanc';
  const unitPrice = watch('unitPrice');
  const totalPrice = watch('totalPrice');

  const [isMinimumPrice, setIsMinimumPrice] = useState(false);
  const [outOfBounds, setOutOfBounds] = useState(false);
  const [needsCustomQuote, setNeedsCustomQuote] = useState(false);
  const [autoSwitched, setAutoSwitched] = useState(false);
  const originalProductId = useRef<string>('');

  useEffect(() => {
    if (productId !== 'sidney-50') return;
    const w = parseFloat(width);
    const h = parseFloat(height);
    if (isNaN(w) || isNaN(h)) return;

    if (w > 200) {
      originalProductId.current = 'sidney-50';
      setValue('productId', 'sidney-50-ac');
      setAutoSwitched(true);
    }
  }, [width, height, productId, setValue]);

  useEffect(() => {
    if (productId !== 'sidney-50-ac') return;
    if (originalProductId.current !== 'sidney-50') return;

    const w = parseFloat(width);
    if (isNaN(w)) return;

    if (w <= 200) {
      setValue('productId', 'sidney-50');
      originalProductId.current = '';
      setAutoSwitched(false);
    }
  }, [width, height, productId, setValue]);

  useEffect(() => {
    if (!autoSwitched) return;
    const timer = setTimeout(() => setAutoSwitched(false), 4000);
    return () => clearTimeout(timer);
  }, [autoSwitched]);

  useEffect(() => {
    if (!quantity || quantity < 1) {
      setValue('quantity', 1);
    }

    if (width > 0 && height > 0) {
      let maxW = 0, maxH = 0, minW = 0, minH = 0;

      if (productId === 'colibri-50') {
        const isTable1 = height <= 170;
        minW = isTable1 ? 60 : 80;
        maxW = isTable1 ? 200 : 160;
        minH = 35;
        maxH = 250;
      } else if (productId === 'sidney-50') {
        minW = 35; maxW = 200; minH = 70; maxH = 260;
      } else if (productId === 'sidney-50-ac') {
        minW = 70; maxW = 400; minH = 70; maxH = 260;
      } else if (productId === 'elba') {
        minW = 30; maxW = 120; minH = 30; maxH = 250;
      }

      // Check if exceeds maximum (Error)
      if (width > maxW || height > maxH) {
        setOutOfBounds(true);
        setIsMinimumPrice(false);
        setNeedsCustomQuote(false);
        setValue('unitPrice', 0);
        setValue('totalPrice', 0);
        return;
      } else {
        setOutOfBounds(false);
      }

      // Check if below minimum (Info)
      let currentIsMin = false;
      if (productId === 'elba') {
        if ((width / 100) * (height / 100) < 1) currentIsMin = true;
      } else if (productId === 'colibri-50') {
        if (width < minW || height < minH) currentIsMin = true;
      } else {
        // For Sidney, table starts at H=220
        if (height < 220) currentIsMin = true;
      }
      setIsMinimumPrice(currentIsMin);

      const price = calculatePrice({
        productId,
        width: Number(width),
        height: Number(height),
        meshType
      });

      if (price !== null && price > 0) {
        setValue('unitPrice', price);
        setValue('totalPrice', price * Number(quantity));
        setNeedsCustomQuote(false);
      } else {
        setValue('unitPrice', 0);
        setValue('totalPrice', 0);
        setNeedsCustomQuote(true);
      }
    } else {
      setOutOfBounds(false);
      setIsMinimumPrice(false);
      setNeedsCustomQuote(false);
      setValue('unitPrice', 0);
      setValue('totalPrice', 0);
    }
  }, [width, height, quantity, meshType, productId, setValue]);

  // SVG Visualizer calculations
  const getMinMax = () => {
    switch (productId) {
      case 'colibri-50': {
        const h = Number(height) || 0;
        const isTable1 = h <= 170;
        return {
          minW: isTable1 ? 60 : 80,
          maxW: isTable1 ? 200 : 160,
          minH: 35,
          maxH: 250
        };
      }
      case 'sidney-50': return { minW: 35, maxW: 200, minH: 70, maxH: 260 };
      case 'sidney-50-ac': return { minW: 70, maxW: 400, minH: 70, maxH: 260 };
      case 'elba': return { minW: 30, maxW: 120, minH: 30, maxH: 250 };
      default: return { minW: 30, maxW: 200, minH: 30, maxH: 250 };
    }
  };

  const { minW, maxW, minH, maxH } = getMinMax();
  const product = products.find(p => p.id === productId);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = '#1D3E61';
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(29,62,97,0.10)';
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>, hasError: boolean) => {
    e.currentTarget.style.borderColor = hasError ? '#EF4444' : '#E2E8F0';
    e.currentTarget.style.boxShadow = 'none';
  };

  const updateQuantity = (newQty: number) => {
    if (newQty >= 1 && newQty <= 20) {
      setValue('quantity', newQty);
    }
  };

  const cfg = getSettings();
  const remise20 = totalPrice * (cfg.remisePercent / 100);
  const priceAfterRemise = totalPrice - remise20;
  const fodec = priceAfterRemise * (cfg.fodecPercent / 100);
  const baseTva = priceAfterRemise + fodec;
  const tva = baseTva * (cfg.tvaPercent / 100);
  const timbre = cfg.timbreFiscal * 1000;
  const ttc = baseTva + tva + timbre;

  return (
    <div className="animate-fade-in w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-8">

        {/* Left Column: Inputs & SVG */}
        <div className="space-y-8">
          <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '22px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#1D3E61', marginBottom: '24px' }}>
            Dimensions de votre ouverture
          </h3>

          {autoSwitched && (
            <div style={{
              background: 'rgba(29,62,97,0.05)',
              border: '1.5px solid #1D3E61',
              borderRadius: '10px',
              padding: '14px 16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              animation: 'fadeIn 0.3s ease'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1D3E61" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: '2px' }}><circle cx="12" cy="12" r="10"/><polyline points="20 6 9 17 4 12"/></svg>
              <div>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '14px', color: '#1D3E61', letterSpacing: '0.5px' }}>
                  Produit mis à jour : Sidney 50 AC
                </div>
                <div style={{ fontSize: '12px', color: '#4A5568', marginTop: '3px', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.5 }}>
                  Vos dimensions dépassent 200cm. Le Sidney 50 AC prend en charge jusqu'à 400×260 cm.
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Width Input */}
            <div>
              <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4A5568', marginBottom: '6px' }}>
                Largeur (cm)
              </label>
              <input
                type="number"
                {...register('width', { valueAsNumber: true })}
                style={{
                  border: `1px solid ${errors.width ? '#EF4444' : '#E2E8F0'}`,
                  borderRadius: '10px',
                  padding: '14px 16px',
                  fontSize: '18px',
                  width: '100%',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  background: 'white'
                }}
                placeholder={`Ex: ${Math.round((minW + maxW) / 2)}`}
                onFocus={handleFocus}
                onBlur={(e) => handleBlur(e, !!errors.width)}
              />
              <div style={{ fontSize: '12px', color: '#8896A5', marginTop: '6px' }}>
                Min: {minW}cm — Max: {maxW}cm
              </div>
              {errors.width && <span style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.width.message as string}</span>}
            </div>

            {/* Height Input */}
            <div>
              <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4A5568', marginBottom: '6px' }}>
                Hauteur (cm)
              </label>
              <input
                type="number"
                {...register('height', { valueAsNumber: true })}
                style={{
                  border: `1px solid ${errors.height ? '#EF4444' : '#E2E8F0'}`,
                  borderRadius: '10px',
                  padding: '14px 16px',
                  fontSize: '18px',
                  width: '100%',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  background: 'white'
                }}
                placeholder={`Ex: ${Math.round((minH + maxH) / 2)}`}
                onFocus={handleFocus}
                onBlur={(e) => handleBlur(e, !!errors.height)}
              />
              <div style={{ fontSize: '12px', color: '#8896A5', marginTop: '6px' }}>
                Min: {minH}cm — Max: {maxH}cm
              </div>
              {errors.height && <span style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.height.message as string}</span>}
            </div>

            {/* Quantity Selector */}
            <div>
              <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4A5568', marginBottom: '6px' }}>
                Quantité
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => updateQuantity((quantity || 1) - 1)}
                  disabled={quantity <= 1}
                  style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    border: '1px solid #E2E8F0', background: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                    opacity: quantity <= 1 ? 0.5 : 1,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { if (quantity > 1) { e.currentTarget.style.background = 'rgba(29,62,97,0.08)'; e.currentTarget.style.borderColor = '#1D3E61'; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                >
                  <Minus size={16} color="#0D1B2A" />
                </button>

                <div style={{ width: '60px', textAlign: 'center', fontSize: '20px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#0D1B2A' }}>
                  {quantity}
                </div>

                <button
                  type="button"
                  onClick={() => updateQuantity((quantity || 1) + 1)}
                  disabled={quantity >= 20}
                  style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    border: '1px solid #E2E8F0', background: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: quantity >= 20 ? 'not-allowed' : 'pointer',
                    opacity: quantity >= 20 ? 0.5 : 1,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { if (quantity < 20) { e.currentTarget.style.background = 'rgba(29,62,97,0.08)'; e.currentTarget.style.borderColor = '#1D3E61'; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                >
                  <Plus size={16} color="#0D1B2A" />
                </button>
              </div>
            </div>

            {/* Color Picker */}
            <div>
              <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4A5568', marginBottom: '6px' }}>
                Couleur du cadre
              </label>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8896A5', marginBottom: '10px' }}>
                Sélectionné : <strong style={{ color: '#1D3E61' }}>{color}</strong>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[
                  { value: 'Blanc', label: 'Blanc', bg: '#FFFFFF', swatchBorder: '#D0D9E8' },
                  { value: 'Noir', label: 'Noir', bg: '#1A1A1A', swatchBorder: '#1A1A1A' },
                ].map(opt => {
                  const isSelected = color === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setValue('color', opt.value)}
                      style={{
                        flex: 1,
                        padding: '12px 8px',
                        borderRadius: '12px',
                        border: `2px solid ${isSelected ? '#1D3E61' : '#E2E8F0'}`,
                        background: isSelected ? 'rgba(29,62,97,0.06)' : 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? '0 0 0 3px rgba(29,62,97,0.12)' : '0 1px 4px rgba(0,0,0,0.05)',
                        position: 'relative',
                      }}
                    >
                      {isSelected && (
                        <span style={{ position: 'absolute', top: '6px', right: '6px', width: '18px', height: '18px', background: '#1D3E61', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </span>
                      )}
                      <span style={{
                        display: 'block',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: opt.bg,
                        border: `2px solid ${opt.swatchBorder}`,
                        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.10)',
                      }} />
                      <span style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: isSelected ? '#1D3E61' : '#4A5568', fontWeight: isSelected ? 700 : 500 }}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {productId === 'elba' && (
              <div>
                <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4A5568', marginBottom: '6px' }}>
                  Type de Toile
                </label>
                <select
                  {...register('meshType')}
                  style={{
                    border: `1px solid ${errors.meshType ? '#EF4444' : '#E2E8F0'}`,
                    borderRadius: '10px',
                    padding: '14px 16px',
                    fontSize: '15px',
                    width: '100%',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    background: 'white',
                    appearance: 'none'
                  }}
                  onFocus={handleFocus}
                  onBlur={(e) => handleBlur(e, !!errors.meshType)}
                >
                  <option value="fibre">Fibre de verre</option>
                  <option value="aluminium">Aluminium</option>
                  <option value="inox">Acier inox</option>
                </select>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Price Display */}
        <div>
          <div style={{ position: 'sticky', top: '100px' }}>
            {(!width || !height) ? (
              <div style={{ border: '1px solid #E8EDF5', borderRadius: '16px', overflow: 'hidden', background: 'white' }}>
                <div style={{ background: 'linear-gradient(160deg, rgba(29,62,97,0.05), rgba(29,62,97,0.09))', padding: '36px 24px 28px', textAlign: 'center', borderBottom: '1px solid #E8EDF5' }}>
                  <img
                    src={product?.imageUrl || '/images/colibri-50.png'}
                    alt={product?.name}
                    style={{ width: '140px', height: '140px', objectFit: 'contain', display: 'block', margin: '0 auto', filter: 'drop-shadow(0 6px 16px rgba(29,62,97,0.14))' }}
                  />
                </div>
                <div style={{ padding: '20px 24px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '18px', color: '#1D3E61', marginBottom: '6px', letterSpacing: '0.5px' }}>
                    {product?.name}
                  </div>
                  <p style={{ color: '#818181', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', margin: 0, lineHeight: 1.6 }}>
                    Entrez vos dimensions ci-contre pour voir l'estimation du prix
                  </p>
                </div>
              </div>
            ) : outOfBounds ? (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                <p style={{ color: '#DC2626', fontSize: '14px', fontFamily: 'Inter, sans-serif', display: 'flex', gap: '8px' }}>
                  <span>⚠️</span> Dimensions dépassent le maximum autorisé.
                </p>
              </div>
            ) : (
              <>
                {/* Product info strip */}
                <div style={{ border: '1px solid #E8EDF5', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', background: 'white' }}>
                  <img src={product?.imageUrl || '/images/colibri-50.png'} alt="" style={{ width: '48px', height: '48px', objectFit: 'contain', background: 'rgba(29,62,97,0.04)', borderRadius: '8px', padding: '4px', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '15px', color: '#1D3E61', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product?.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#818181' }}>{width > 0 && height > 0 ? `${width} × ${height} cm · ×${quantity}` : 'Dimensions en cours...'}</span>
                      {color && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(29,62,97,0.06)', border: '1px solid #D0D9E8', borderRadius: '20px', padding: '1px 8px 1px 4px' }}>
                          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: color === 'Noir' ? '#1A1A1A' : '#FFFFFF', border: color === 'Blanc' ? '1.5px solid #C0CAD6' : '1.5px solid #1A1A1A', flexShrink: 0 }} />
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#1D3E61', fontFamily: 'Inter, sans-serif' }}>{color}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {isMinimumPrice && (
                  <div style={{ background: 'rgba(29,62,97,0.05)', border: '1px solid rgba(29,62,97,0.18)', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                    <p style={{ color: '#1D3E61', fontSize: '14px', fontFamily: 'Inter, sans-serif', display: 'flex', gap: '8px' }}>
                      <span>ℹ️</span> Prix calculé pour la dimension minimale disponible.
                    </p>
                  </div>
                )}
                {needsCustomQuote ? (
                  <div>
                    <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                      <p style={{ color: '#D97706', fontSize: '14px', fontFamily: 'Inter, sans-serif', display: 'flex', gap: '8px' }}>
                        <span>📞</span> Contactez-nous pour un devis personnalisé.
                      </p>
                    </div>
                    <a
                      href="https://wa.me/21657099070"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        background: '#25D366', color: 'white', padding: '14px', borderRadius: '10px',
                        fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, textDecoration: 'none'
                      }}
                    >
                      Contacter sur WhatsApp →
                    </a>
                  </div>
                ) : (
                  <div style={{ background: 'rgba(29,62,97,0.04)', border: '1px solid rgba(29,62,97,0.15)', borderRadius: '16px', padding: '28px' }}>
                    <h4 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '16px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#1D3E61', marginBottom: '16px' }}>
                      Estimation du Prix
                    </h4>

                    <div style={{ height: '1px', background: 'rgba(29,62,97,0.18)', marginBottom: '20px' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <div style={{ fontSize: '14px', color: '#4A5568', fontFamily: 'Inter, sans-serif' }}>Prix unitaire (HT):</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '18px', color: '#1D3E61', lineHeight: 1 }}>
                          {unitPrice > 0 ? (unitPrice / 1000).toFixed(3) : '0.000'}
                        </span>
                        <span style={{ fontSize: '16px', color: '#1D3E61', fontWeight: 600 }}>DT</span>
                      </div>
                    </div>

                    {quantity > 1 && (
                      <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4A5568' }}>
                        <span>Sous-total HT (×{quantity}):</span>
                        <span style={{ color: '#0D1B2A', fontWeight: 500 }}>{(totalPrice / 1000).toFixed(3)} DT</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#EF4444' }}>
                      <span>Remise {cfg.remisePercent}%:</span>
                      <span style={{ fontWeight: 600 }}>-{(remise20 / 1000).toFixed(3)} DT</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#0D1B2A', fontWeight: 600 }}>
                      <span>Prix après remise:</span>
                      <span>{(priceAfterRemise / 1000).toFixed(3)} DT</span>
                    </div>

                    <div style={{ height: '1px', background: 'rgba(29,62,97,0.18)', marginBottom: '20px' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4A5568' }}>
                      <span>FODEC (1%):</span>
                      <span>{(fodec / 1000).toFixed(3)} DT</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4A5568' }}>
                      <span>TVA (19%):</span>
                      <span>{(tva / 1000).toFixed(3)} DT</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4A5568' }}>
                      <span>Timbre fiscal:</span>
                      <span>1.000 DT</span>
                    </div>

                    <div style={{ background: '#1D3E61', borderRadius: '10px', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(29,62,97,0.20)' }}>
                      <span style={{ color: 'white', fontSize: '11px', letterSpacing: '2px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL TTC</span>
                      <span style={{ color: 'white', fontSize: '28px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>{(ttc / 1000).toFixed(3)} DT</span>
                    </div>
                  </div>
                )}
              </>
            )}


          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="devis-nav-buttons" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #E2E8F0' }}>
        <button
          onClick={onPrev}
          type="button"
          style={{
            background: 'transparent',
            color: '#4A5568',
            border: '1px solid #D0D9E8',
            padding: '14px 24px',
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 600,
            fontSize: '15px',
            cursor: 'pointer',
            borderRadius: '10px',
            transition: 'background 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#F5F7FA'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          ← Retour
        </button>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button
            onClick={() => { if (width > 0 && height > 0 && unitPrice > 0 && !outOfBounds && !needsCustomQuote) onAddAnother(); }}
            type="button"
            disabled={!width || !height || unitPrice === 0 || outOfBounds || needsCustomQuote}
            style={{
              background: 'transparent',
              color: (!width || !height || unitPrice === 0 || outOfBounds || needsCustomQuote) ? '#CBD5E0' : '#1D3E61',
              border: `1px solid ${(!width || !height || unitPrice === 0 || outOfBounds || needsCustomQuote) ? '#E2E8F0' : '#1D3E61'}`,
              borderRadius: '10px',
              padding: '14px 24px',
              fontSize: '15px',
              fontWeight: 700,
              fontFamily: 'Rajdhani, sans-serif',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: (!width || !height || unitPrice === 0 || outOfBounds || needsCustomQuote) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { if (!(!width || !height || unitPrice === 0 || outOfBounds || needsCustomQuote)) { e.currentTarget.style.background = 'rgba(29,62,97,0.06)'; } }}
            onMouseLeave={e => { if (!(!width || !height || unitPrice === 0 || outOfBounds || needsCustomQuote)) e.currentTarget.style.background = 'transparent'; }}
          >
            <Plus size={18} />
            Ajouter un autre article
          </button>
          <button
            onClick={() => { if (width > 0 && height > 0 && unitPrice > 0 && !outOfBounds && !needsCustomQuote) onNext(); }}
            type="button"
            disabled={!width || !height || unitPrice === 0 || outOfBounds || needsCustomQuote}
            style={{
              background: (!width || !height || unitPrice === 0 || outOfBounds || needsCustomQuote) ? '#CBD5E0' : '#1D3E61',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '14px 32px',
              fontSize: '15px',
              fontWeight: 700,
              fontFamily: 'Rajdhani, sans-serif',
              cursor: (!width || !height || unitPrice === 0 || outOfBounds || needsCustomQuote) ? 'not-allowed' : 'pointer',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { if (!(!width || !height || unitPrice === 0 || outOfBounds || needsCustomQuote)) { e.currentTarget.style.background = '#81C063'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(129,192,99,0.35)'; } }}
            onMouseLeave={e => { if (!(!width || !height || unitPrice === 0 || outOfBounds || needsCustomQuote)) { e.currentTarget.style.background = '#1D3E61'; e.currentTarget.style.boxShadow = 'none'; } }}
          >
            Suivant →
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepDimensions;
