import type { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { calculatePrice, formatPrice } from '../../utils/priceCalculator';
import { getSettings } from '../../store/settingsStore';
import { useEffect, useState, useRef } from 'react';
import { Minus, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { products } from '../../data/products';
import { STANDARD_COLORS, EXTENDED_COLORS, ALL_COLORS } from '../../data/colors';
import { Portal } from '../ui/Portal';
import type { DevisFormData } from './DevisWizard';

interface Props {
  register: UseFormRegister<DevisFormData>;
  errors: FieldErrors<DevisFormData>;
  watch: UseFormWatch<DevisFormData>;
  setValue: UseFormSetValue<DevisFormData>;
  onNext: () => void;
  onPrev: () => void;
  productId: string;
  onAddAnother: () => void;
}

const StepDimensions = ({ register, errors, watch, setValue, onNext, onPrev, productId, onAddAnother }: Props) => {
  const { t, i18n } = useTranslation();
  const isRTL = ['ar', 'tn'].includes(i18n.language);
  const width = watch('width');
  const height = watch('height');
  const { ref: widthRef, onBlur: widthOnBlur, ...widthRegisterProps } = register('width', { valueAsNumber: true });
  const { ref: heightRef, onBlur: heightOnBlur, ...heightRegisterProps } = register('height', { valueAsNumber: true });
  const hauteurRef = useRef<HTMLInputElement>(null);
  const quantity = watch('quantity') || 1;
  const meshType = watch('meshType');
  const color = watch('color') || 'Blanc';
  const unitPrice = watch('unitPrice');
  const totalPrice = watch('totalPrice');
  const openingType = watch('openingType');
  const setOpeningType = (val: 'fenetre' | 'porte') => setValue('openingType', val);

  const product = products.find(p => p.id === productId);
  const showSelector = true;

  const [showOpeningTypeError, setShowOpeningTypeError] = useState(false);

  const [isMinimumPrice, setIsMinimumPrice] = useState(false);
  const [outOfBounds, setOutOfBounds] = useState(false);
  const [needsCustomQuote, setNeedsCustomQuote] = useState(false);
  const [autoSwitched, setAutoSwitched] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const colorBtnRef = useRef<HTMLDivElement>(null);
  const originalProductId = useRef<string>('');
  const sheetRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    if (productId === 'sidney-50-ac') {
      setValue('openingType', 'porte');
    }
  }, [productId, setValue]);

  useEffect(() => {
    if (productId !== 'sidney-50') return;
    const w = Number(width);
    const h = Number(height);
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

    const w = Number(width);
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
        minW = 10; maxW = 9999; minH = 10; maxH = 9999;
      } else if (productId === 'plisse31') {
        minW = 125; maxW = 500; minH = 120; maxH = 300;
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
      const priceResult = calculatePrice({
        productId,
        width: Number(width),
        height: Number(height),
        meshType: meshType as any,
        color
      });

      if (priceResult !== null && priceResult.unitPrice > 0) {
        setValue('unitPrice', priceResult.unitPrice);
        setValue('totalPrice', priceResult.unitPrice * Number(quantity));
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
  }, [width, height, quantity, meshType, productId, color, setValue]);

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
      case 'elba': return { minW: 10, maxW: 9999, minH: 10, maxH: 9999 };
      case 'plisse31': return { minW: 125, maxW: 500, minH: 120, maxH: 300 };
      default: return { minW: 30, maxW: 200, minH: 30, maxH: 250 };
    }
  };

  const { minW, maxW, minH, maxH } = getMinMax();

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
  const ttc = Math.round(baseTva + tva + timbre);

  const fenetreColor = openingType === 'fenetre' ? '#1D3E61' : '#9CA3AF';
  const porteColor = openingType === 'porte' ? '#1D3E61' : '#9CA3AF';

  return (
    <>
      <div className="animate-fade-in w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-8">

          {/* Left Column: Inputs & SVG */}
          <div className="space-y-8">
            <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '22px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#1D3E61', marginBottom: '24px' }}>
              {t('quote.dimensions_title', 'Dimensions de votre ouverture')}
            </h3>

            {autoSwitched && productId !== 'elba' && (
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1D3E61" strokeWidth="2.5" strokeLinecap="round" className="no-rtl-flip" style={{ flexShrink: 0, marginTop: '2px', transform: isRTL ? 'scaleX(-1)' : 'none' }}><circle cx="12" cy="12" r="10" /><polyline points="20 6 9 17 4 12" /></svg>
                <div>
                  <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '14px', color: '#1D3E61', letterSpacing: '0.5px' }}>
                    {t('quote.updated_product', 'Produit mis à jour : {{name}}', { name: 'Sidney 50 AC' })}
                  </div>
                  <div style={{ fontSize: '12px', color: '#4A5568', marginTop: '3px', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.5 }}>
                    {t('quote.dimensions_notice', "Vos dimensions dépassent 200cm. Le Sidney 50 AC prend en charge jusqu'à 400×260 cm.")}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {showSelector && (
                <div id="opening-type-selector" style={{ marginBottom: 24 }}>
                  
                  <p style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#1D3E61',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 10,
                  }}>
                    Type d'ouverture
                  </p>

                  <div style={{ display: 'flex', gap: 12 }}>
                    
                    <button
                      type="button"
                      disabled={productId === 'sidney-50-ac'}
                      onClick={() => {
                        setOpeningType('fenetre');
                        setShowOpeningTypeError(false);
                      }}
                      style={{
                        flex: 1,
                        padding: '14px',
                        borderRadius: 10,
                        border: openingType === 'fenetre'
                          ? '2px solid #1D3E61'
                          : '1.5px solid #E5E7EB',
                        background: openingType === 'fenetre'
                          ? '#EEF2FF' : '#FFFFFF',
                        opacity: productId === 'sidney-50-ac' ? 0.4 : 1,
                        cursor: productId === 'sidney-50-ac' ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'all 0.2s',
                      }}
                    >
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="2" y="2" width="28" height="28" rx="2" stroke={fenetreColor} strokeWidth="2.5" fill="#F3F4F6"/>
                        <rect x="2" y="2" width="13" height="28" rx="0" stroke={fenetreColor} strokeWidth="1.5" fill="none"/>
                        <line x1="16" y1="2" x2="16" y2="30" stroke={fenetreColor} strokeWidth="1.5"/>
                        <line x1="2" y1="16" x2="30" y2="16" stroke={fenetreColor} strokeWidth="1.5"/>
                      </svg>
                      <span style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: openingType === 'fenetre'
                          ? '#1D3E61' : '#6B7280',
                      }}>Fenêtre</span>
                      {openingType === 'fenetre' && (
                        <span style={{ 
                          fontSize: 10, 
                          color: '#81C063',
                          fontWeight: 600,
                        }}>✓ Sélectionné</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setOpeningType('porte');
                        setShowOpeningTypeError(false);
                      }}
                      style={{
                        flex: 1,
                        padding: '14px',
                        borderRadius: 10,
                        border: openingType === 'porte'
                          ? '2px solid #1D3E61'
                          : '1.5px solid #E5E7EB',
                        background: openingType === 'porte'
                          ? '#EEF2FF' : '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'all 0.2s',
                      }}
                    >
                      <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="2" y="2" width="24" height="32" rx="2" stroke={porteColor} strokeWidth="2.5" fill="#F3F4F6"/>
                        <line x1="14" y1="2" x2="14" y2="34" stroke={porteColor} strokeWidth="1.5"/>
                        <circle cx="11" cy="18" r="1.5" fill={porteColor}/>
                        <circle cx="17" cy="18" r="1.5" fill={porteColor}/>
                      </svg>
                      <span style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: openingType === 'porte'
                          ? '#1D3E61' : '#6B7280',
                      }}>Porte</span>
                      {openingType === 'porte' && (
                        <span style={{ 
                          fontSize: 10, 
                          color: '#81C063',
                          fontWeight: 600,
                        }}>✓ Sélectionné</span>
                      )}
                    </button>

                  </div>

                  {productId === 'sidney-50-ac' && (
                    <p style={{
                      fontSize: 11,
                      color: '#6B7280',
                      marginTop: 6,
                      fontStyle: 'italic',
                      fontFamily: 'DM Sans, sans-serif'
                    }}>
                      * Le Sidney 50 AC est conçu pour les portes uniquement.
                    </p>
                  )}

                  {showOpeningTypeError && !openingType && (
                    <p style={{
                      color: '#EF4444',
                      fontSize: 12,
                      marginTop: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontWeight: 500,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      <span style={{ fontSize: 14 }}>⚠️</span> Veuillez sélectionner le type d'ouverture avant de continuer.
                    </p>
                  )}
                </div>
              )}

              {/* Width Input */}
              <div>
                <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4A5568', marginBottom: '6px' }}>
                  {t('quote.width_cm', 'Largeur (cm)')}
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  {...widthRegisterProps}
                  ref={widthRef}
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
                  onBlur={(e) => {
                    widthOnBlur(e);
                    handleBlur(e, !!errors.width);
                    if (e.relatedTarget && e.relatedTarget instanceof HTMLElement) {
                      return;
                    }
                    hauteurRef.current?.focus();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      hauteurRef.current?.focus();
                    }
                  }}
                />
                {productId !== 'elba' ? (
                  <div style={{ fontSize: '12px', color: '#8896A5', marginTop: '6px' }}>
                    Min: {minW}cm — Max: {maxW}cm
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#81C063', marginTop: '6px', fontWeight: 600 }}>
                    Sur mesure — sans limite
                  </div>
                )}
                {errors.width && <span style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.width.message as string}</span>}
              </div>

              {/* Height Input */}
              <div>
                <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4A5568', marginBottom: '6px' }}>
                  {t('quote.height_cm', 'Hauteur (cm)')}
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  {...heightRegisterProps}
                  ref={(el) => {
                    heightRef(el);
                    (hauteurRef as any).current = el;
                  }}
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
                  onBlur={(e) => {
                    heightOnBlur(e);
                    handleBlur(e, !!errors.height);
                  }}
                />
                {productId !== 'elba' ? (
                  <div style={{ fontSize: '12px', color: '#8896A5', marginTop: '6px' }}>
                    Min: {minH}cm — Max: {maxH}cm
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#81C063', marginTop: '6px', fontWeight: 600 }}>
                    Sur mesure — sans limite
                  </div>
                )}
                {errors.height && <span style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.height.message as string}</span>}
              </div>

              {/* Quantity Selector */}
              <div>
                <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4A5568', marginBottom: '6px' }}>
                  {t('quote.quantity', 'Quantité')}
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
                  {t('common.color_frame', 'Couleur du cadre')}
                </label>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8896A5', marginBottom: '10px' }}>
                  {t('common.selected', 'Sélectionné')} : <strong style={{ color: '#1D3E61' }}>{t(`common.${color.toLowerCase()}`, color) as string}</strong>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {STANDARD_COLORS.map(opt => {
                    const isSelected = color === opt.name;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setValue('color', opt.name)}
                        style={{
                          width: '72px',
                          height: '72px',
                          borderRadius: '10px',
                          border: isSelected ? '2.5px solid #1D3E61' : '1.5px solid #E2E8F0',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          background: isSelected ? 'rgba(29,62,97,0.06)' : 'white',
                          position: 'relative',
                          transition: 'all 0.15s',
                          padding: '8px',
                          boxShadow: isSelected ? '0 0 0 3px rgba(29,62,97,0.12)' : '0 1px 4px rgba(0,0,0,0.05)',
                        }}
                      >
                        {isSelected && (
                          <span style={{ position: 'absolute', top: '4px', [isRTL ? 'left' : 'right']: '4px', width: '16px', height: '16px', background: '#1D3E61', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                          </span>
                        )}
                        <span style={{
                          display: 'block',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: opt.hex,
                          border: '1px solid rgba(0,0,0,0.1)',
                          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.10)',
                        }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif', color: isSelected ? '#1D3E61' : '#475569', fontWeight: isSelected ? 700 : 500 }}>
                            {t(`common.${opt.name.toLowerCase()}`, opt.name) as string}
                          </span>
                          {opt.name === 'Noir' && (
                            <span style={{
                              fontSize: 9,
                              background: '#FEF3C7',
                              color: '#92400E',
                              padding: '1px 4px',
                              borderRadius: 4,
                              fontWeight: 700,
                            }}>+10%</span>
                          )}
                        </div>
                      </button>
                    );
                  })}

                  {/* CUSTOM COLOR CARD */}
                  <div style={{ position: 'relative' }} ref={colorBtnRef}>
                    {(() => {
                      const isCustom = color && !['Blanc', 'Noir'].includes(color);
                      const customHex = ALL_COLORS.find(c => c.name === color)?.hex || '#81C063';
                      
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            if (!showColorPicker && colorBtnRef.current) {
                              const rect = colorBtnRef.current.getBoundingClientRect();
                              const spaceBelow = window.innerHeight - rect.bottom;
                              const dropdownHeight = 140;
                              
                              setDropdownPos({
                                top: spaceBelow > dropdownHeight 
                                  ? rect.bottom + 8 
                                  : rect.top - dropdownHeight - 8,
                                left: rect.left,
                                width: rect.width,
                              });
                            }
                            setShowColorPicker(prev => !prev);
                          }}
                          style={{
                            width: '72px',
                            height: '72px',
                            borderRadius: '10px',
                            border: isCustom ? '2.5px solid #1D3E61' : '1.5px solid #E2E8F0',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            background: isCustom ? 'rgba(29,62,97,0.06)' : 'white',
                            position: 'relative',
                            transition: 'all 0.15s',
                            padding: '8px',
                            boxShadow: isCustom ? '0 0 0 3px rgba(29,62,97,0.12)' : '0 1px 4px rgba(0,0,0,0.05)',
                          }}
                        >
                          {isCustom && (
                            <span style={{ position: 'absolute', top: '4px', [isRTL ? 'left' : 'right']: '4px', width: '16px', height: '16px', background: '#1D3E61', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                            </span>
                          )}
                          
                          {isCustom ? (
                            <span style={{
                              display: 'block',
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: customHex,
                              border: '1px solid rgba(0,0,0,0.1)',
                              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.10)',
                            }} />
                          ) : (
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #FF6B6B, #4ECDC4, #FFE66D, #81C063)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.10)',
                            }}>
                              <span style={{ fontSize: '16px' }}>🎨</span>
                            </div>
                          )}

                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif', color: isCustom ? '#1D3E61' : '#475569', fontWeight: isCustom ? 700 : 500 }}>
                              {isCustom ? color : (t('common.colors', 'Couleurs') as string)}
                            </span>
                            <span style={{
                              fontSize: 9,
                              background: '#FEF3C7',
                              color: '#92400E',
                              padding: '1px 4px',
                              borderRadius: 4,
                              fontWeight: 700,
                            }}>+15%</span>
                          </div>
                        </button>
                      );
                    })()}

                    {/* COMPACT COLOR PICKER POPOVER VIA PORTAL */}
                    {showColorPicker && !isMobile && (
                      <Portal>
                        {/* Backdrop */}
                        <div 
                          style={{ position: 'fixed', inset: 0, zIndex: 9998 }} 
                          onClick={() => setShowColorPicker(false)} 
                        />
                        <div style={{
                          position: 'fixed',
                          top: dropdownPos.top,
                          left: dropdownPos.left,
                          width: 'max-content',
                          minWidth: dropdownPos.width,
                          zIndex: 9999,
                          background: '#ffffff',
                          border: '1px solid #E2E8F0',
                          borderRadius: '10px',
                          padding: '10px',
                          boxShadow: '0 12px 48px rgba(0,0,0,0.18)',
                          animation: 'fadeIn 0.2s ease-out',
                        }}>
                          <p style={{ fontSize: '10px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px 0', textAlign: isRTL ? 'right' : 'left' }}>
                            Grifo Flex — {EXTENDED_COLORS.length} {t('common.colors', 'couleurs')}
                          </p>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 22px)', gap: '4px' }}>
                            {EXTENDED_COLORS.map(colorOpt => (
                              <button
                                key={colorOpt.id}
                                type="button"
                                title={colorOpt.name}
                                onClick={() => { setValue('color', colorOpt.name); setShowColorPicker(false); }}
                                style={{
                                  width: '22px',
                                  height: '22px',
                                  borderRadius: '4px',
                                  background: colorOpt.hex,
                                  border: color === colorOpt.name ? '2px solid #81C063' : '1.5px solid rgba(0,0,0,0.08)',
                                  cursor: 'pointer',
                                  padding: 0,
                                  position: 'relative',
                                  transition: 'transform 0.1s',
                                  flexShrink: 0,
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                              >
                                {color === colorOpt.name && (
                                  <span style={{
                                    position: 'absolute', inset: 0, display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    fontSize: '11px', fontWeight: '700', color: '#fff',
                                    textShadow: '0 1px 2px rgba(0,0,0,0.6)'
                                  }}>✓</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      </Portal>
                    )}

                    {/* MOBILE BOTTOM SHEET */}
                    {showColorPicker && isMobile && (
                      <Portal>
                        {/* Backdrop */}
                        <div
                          onClick={() => setShowColorPicker(false)}
                          style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.4)',
                            zIndex: 9998,
                            animation: 'fadeIn 0.2s ease-out',
                          }}
                        />

                        {/* BOTTOM SHEET */}
                        <div
                          ref={sheetRef}
                          onTouchStart={(e) => { touchStartY.current = e.touches[0].clientY; }}
                          onTouchEnd={(e) => {
                            const delta = e.changedTouches[0].clientY - touchStartY.current;
                            if (delta > 80) setShowColorPicker(false);
                          }}
                          style={{
                            position: 'fixed',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            zIndex: 9999,
                            background: '#ffffff',
                            borderRadius: '20px 20px 0 0',
                            padding: '16px 16px 30px',
                            maxHeight: '70vh',
                            overflowY: 'auto',
                            boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
                            animation: 'slideUp 0.3s ease-out',
                          }}
                        >
                          {/* HANDLE BAR */}
                          <div style={{
                            width: 40, height: 4,
                            background: '#9CA3AF',
                            borderRadius: 2,
                            margin: '0 auto 16px',
                          }} />

                          {/* TITLE */}
                          <p style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#1D3E61',
                            marginBottom: '16px',
                            textAlign: 'center',
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase'
                          }}>
                            Grifo Flex — {EXTENDED_COLORS.length} {t('common.colors', 'couleurs')}
                          </p>

                          {/* COLOR GRID — 5 columns for touch space */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(5, 1fr)',
                            gap: '12px',
                            padding: '0 4px',
                          }}>
                            {EXTENDED_COLORS.map(colorOpt => (
                              <button
                                key={colorOpt.id}
                                type="button"
                                title={colorOpt.name}
                                onClick={() => {
                                  setValue('color', colorOpt.name);
                                  setShowColorPicker(false);
                                }}
                                style={{
                                  width: '100%',
                                  aspectRatio: '1',
                                  minHeight: '44px',
                                  minWidth: '44px',
                                  borderRadius: '8px',
                                  background: colorOpt.hex,
                                  border: color === colorOpt.name
                                    ? '3px solid #1D3E61'
                                    : '1.5px solid rgba(0,0,0,0.1)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: 0,
                                }}
                              >
                                {color === colorOpt.name && (
                                  <span style={{
                                    fontSize: '18px',
                                    fontWeight: '700',
                                    color: '#fff',
                                    textShadow: '0 1px 2px rgba(0,0,0,0.6)'
                                  }}>✓</span>
                                )}
                              </button>
                            ))}
                          </div>

                          {/* CANCEL BUTTON */}
                          <button
                            type="button"
                            onClick={() => setShowColorPicker(false)}
                            style={{
                              width: '100%',
                              marginTop: '20px',
                              padding: '14px',
                              borderRadius: '12px',
                              border: '1px solid #E2E8F0',
                              background: '#F8FAFC',
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#64748B',
                              cursor: 'pointer',
                            }}
                          >
                            {t('common.cancel', 'Annuler')}
                          </button>
                        </div>
                      </Portal>
                    )}
                  </div>
                </div>

                {color && !['Blanc', 'Noir'].includes(color) && (
                  <div style={{
                    marginTop: '12px',
                    padding: '10px 12px',
                    background: '#F8FAFC',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '13px',
                    color: '#475569'
                  }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      background: ALL_COLORS.find(c => c.name === color)?.hex || '#888',
                      border: '1px solid rgba(0,0,0,0.1)',
                      flexShrink: 0
                    }} />
                    <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                      <span style={{ color: '#94A3B8', fontSize: '11px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('devis.colorSelected', 'Couleur choisie')}</span>
                      <strong style={{ color: '#1D3E61' }}>{color}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setValue('color', 'Blanc'); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: '20px', padding: '0 4px' }}
                    >×</button>
                  </div>
                )}
              </div>


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
                      className="no-rtl-flip"
                      style={{ width: '140px', height: '140px', objectFit: 'contain', display: 'block', margin: '0 auto', filter: 'drop-shadow(0 6px 16px rgba(29,62,97,0.14))', transform: 'none' }}
                    />
                  </div>
                  <div style={{ padding: '20px 24px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '18px', color: '#1D3E61', marginBottom: '6px', letterSpacing: '0.5px' }}>
                      {product?.name}
                    </div>
                    <p style={{ color: '#818181', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', margin: 0, lineHeight: 1.6 }}>
                      {t('quote.placeholder_wh', "Entrez vos dimensions ci-contre pour voir l'estimation du prix")}
                    </p>
                  </div>
                </div>
              ) : outOfBounds ? (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                  <p style={{ color: '#DC2626', fontSize: '14px', fontFamily: 'Inter, sans-serif', display: 'flex', gap: '8px' }}>
                    <span>⚠️</span> {t('quote.dimensions_notice', "Dimensions dépassent le maximum autorisé.")}
                  </p>
                </div>
              ) : (
                <>
                  {/* Product info strip */}
                  <div style={{ border: '1px solid #E8EDF5', borderRadius: '12px', padding: '12px 16px', display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: '12px', marginBottom: '16px', background: 'white' }}>
                    <img src={product?.imageUrl || '/images/colibri-50.webp'} alt={product?.name || 'Produit'} className="no-rtl-flip" style={{ width: '48px', height: '48px', objectFit: 'contain', background: 'rgba(29,62,97,0.04)', borderRadius: '8px', padding: '4px', flexShrink: 0, transform: 'none' }} />
                    <div style={{ minWidth: 0, textAlign: isRTL ? 'right' : 'left' }}>
                      <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '15px', color: '#1D3E61', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product?.name}</div>
                      <div style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#818181' }}>{width > 0 && height > 0 ? `${width} × ${height} cm · ×${quantity}` : 'Dimensions en cours...'}</span>
                        {color && (
                          <span style={{
                            display: 'inline-flex',
                            flexDirection: isRTL ? 'row-reverse' : 'row',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(29,62,97,0.06)',
                            border: '1px solid #D0D9E8',
                            borderRadius: '20px',
                            padding: isRTL ? '1px 4px 1px 8px' : '1px 8px 1px 4px'
                          }}>
                            <span style={{
                              display: 'inline-block',
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: ALL_COLORS.find(c => c.name === color)?.hex || '#888',
                              border: '1px solid rgba(0,0,0,0.1)',
                              flexShrink: 0
                            }} />
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#1D3E61', fontFamily: 'Inter, sans-serif' }}>{color}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isMinimumPrice && productId !== 'elba' && (
                    <div style={{ background: 'rgba(29,62,97,0.05)', border: '1px solid rgba(29,62,97,0.18)', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                      <p style={{ color: '#1D3E61', fontSize: '14px', fontFamily: 'Inter, sans-serif', display: 'flex', gap: '8px' }}>
                        <span>ℹ️</span> {t('quote.min_price_notice', "Prix calculé pour la dimension minimale disponible.")}
                      </p>
                    </div>
                  )}
                  {productId === 'elba' && Number(width) > 0 && Number(height) > 0 && !needsCustomQuote && (
                    <div style={{ background: 'rgba(29,62,97,0.05)', border: '1px solid rgba(29,62,97,0.18)', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                      <p style={{ color: '#1D3E61', fontSize: '14px', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ display: 'flex', gap: '8px' }}>
                          <span>ℹ️</span> Surface : {((Number(width) / 100) * (Number(height) / 100)).toFixed(2)} m² → Facturé : {Math.max(1, Math.ceil((Number(width) / 100) * (Number(height) / 100)))} m²
                        </span>
                        {isMinimumPrice && (
                          <span style={{ marginLeft: '24px', fontSize: '13px', color: '#64748B' }}>
                            Minimum 1 m² facturé — Prix: 326 TND
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                  {needsCustomQuote ? (
                    <div>
                      <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                        <p style={{ color: '#D97706', fontSize: '14px', fontFamily: 'Inter, sans-serif', display: 'flex', gap: '8px' }}>
                          <span>📞</span> {t('quote.custom_quote_notice', "Contactez-nous pour un devis personnalisé.")}
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
                        {isRTL ? `→ ${t('quote.whatsapp_contact', 'تواصل معنا عبر واتساب')}` : `${t('quote.whatsapp_contact', 'Contacter sur WhatsApp')} →`}
                      </a>
                    </div>
                  ) : (
                    <div style={{ background: 'rgba(29,62,97,0.04)', border: '1px solid rgba(29,62,97,0.15)', borderRadius: '16px', padding: '24px' }}>
                      <h4 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '16px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#1D3E61', marginBottom: '16px' }}>
                        {t('quote.estimation_title', 'Estimation du Prix')}
                      </h4>

                      <div style={{ height: '1px', background: 'rgba(29,62,97,0.18)', marginBottom: '16px' }} />

                      <div style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '8px' }}>
                        <div style={{ fontSize: '14px', color: '#4A5568', fontFamily: 'Inter, sans-serif', fontWeight: 500, maxWidth: '50%' }}>{t('quote.unit_price_ht', 'Prix unitaire (HT)')} :</div>
                        <div style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'baseline', gap: '4px', flexShrink: 0 }}>
                          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '16px', color: '#1D3E61', lineHeight: 1 }}>
                            {unitPrice > 0 ? (unitPrice / 1000).toFixed(3) : '0.000'}
                          </span>
                          <span style={{ fontSize: 14, color: '#1D3E61', fontWeight: 600 }}>DT</span>
                        </div>
                      </div>

                      {(() => {
                        const priceResult = calculatePrice({
                          productId,
                          width: Number(width),
                          height: Number(height),
                          meshType: meshType as any,
                          color
                        });

                        if (priceResult && (priceResult.colorSurchargePct ?? 0) > 0) {
                          return (
                            <div style={{
                              display: 'flex',
                              flexDirection: isRTL ? 'row-reverse' : 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              color: '#92400E',
                              background: '#FEF3C7',
                              padding: '6px 10px',
                              borderRadius: 8,
                              fontSize: 13,
                              marginTop: -4,
                              marginBottom: 12,
                              fontFamily: 'Inter, sans-serif',
                              fontWeight: 500,
                              gap: '8px'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', maxWidth: '50%' }}>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Supplément couleur</span>
                                <span style={{
                                  fontSize: 10,
                                  background: '#FEF3C7',
                                  color: '#92400E',
                                  padding: '1px 4px',
                                  borderRadius: 4,
                                  fontWeight: 600,
                                  border: '1px solid #FDE68A',
                                  flexShrink: 0
                                }}>+{priceResult.colorSurchargePct}%</span>
                              </div>
                              <span style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                                + {formatPrice((priceResult.colorSurchargeAmount ?? 0) * quantity)} DT
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {quantity > 1 && (
                        <div style={{ marginBottom: '12px', display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4A5568', gap: '8px' }}>
                          <span style={{ maxWidth: '50%' }}>{t('quote.subtotal_ht', 'Sous-total HT')} (×{quantity}):</span>
                          <span style={{ color: '#1D3E61', fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap' }}>{(totalPrice / 1000).toFixed(3)} DT</span>
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#EF4444', fontWeight: 600, gap: '8px' }}>
                        <span style={{ maxWidth: '50%' }}>{t('quote.remise_label', 'Remise {{percent}}%', { percent: cfg.remisePercent })}:</span>
                        <span style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>-{(remise20 / 1000).toFixed(3)} DT</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#1D3E61', fontWeight: 700, gap: '8px' }}>
                        <span style={{ maxWidth: '50%' }}>Après remise :</span>
                        <span style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>{(priceAfterRemise / 1000).toFixed(3)} DT</span>
                      </div>

                      <div style={{ height: '1px', background: 'rgba(29,62,97,0.18)', marginBottom: '16px' }} />

                      <div style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#64748B', gap: '8px' }}>
                        <span style={{ maxWidth: '50%' }}>{t('quote.fodec', 'FODEC ({{percent}}%)', { percent: 1 })}:</span>
                        <span style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>{(fodec / 1000).toFixed(3)} DT</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#64748B', gap: '8px' }}>
                        <span style={{ maxWidth: '50%' }}>{t('quote.tva', 'TVA ({{percent}}%)', { percent: 19 })}:</span>
                        <span style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>{(tva / 1000).toFixed(3)} DT</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#64748B', gap: '8px' }}>
                        <span style={{ maxWidth: '50%' }}>{t('quote.timbre', 'Timbre fiscal')} :</span>
                        <span style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>1.000 DT</span>
                      </div>

                      <div style={{ background: '#1D3E61', borderRadius: '12px', padding: '14px 20px', display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'center', alignItems: 'center', gap: '8px', flexWrap: 'wrap', boxShadow: '0 4px 12px rgba(29,62,97,0.20)' }}>
                        <span style={{ color: 'white', fontSize: '11px', letterSpacing: '2px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, textTransform: 'uppercase', flexShrink: 0 }}>{t('quote.total_ttc', 'TOTAL TTC')}</span>
                        <span style={{ color: 'white', fontSize: '28px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }}>{(ttc / 1000).toFixed(3)} DT</span>
                      </div>
                    </div>
                  )}
                </>
              )}


            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="devis-nav-buttons" style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #E2E8F0' }}>
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
              flexDirection: isRTL ? 'row-reverse' : 'row',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F5F7FA'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            {isRTL ? `→ ${t('common.back', 'Retour')}` : `← ${t('common.back', 'Retour')}`}
          </button>
          <div style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', gap: '16px' }}>
            <button
              onClick={() => { 
                if (!openingType) {
                  setShowOpeningTypeError(true);
                  document.getElementById('opening-type-selector')?.scrollIntoView({ behavior: 'smooth' });
                  return;
                }
                if (width > 0 && height > 0 && unitPrice > 0 && !outOfBounds && !needsCustomQuote) onAddAnother(); 
              }}
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
                flexDirection: isRTL ? 'row-reverse' : 'row',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { if (!(!width || !height || unitPrice === 0 || outOfBounds || needsCustomQuote)) { e.currentTarget.style.background = 'rgba(29,62,97,0.06)'; } }}
              onMouseLeave={e => { if (!(!width || !height || unitPrice === 0 || outOfBounds || needsCustomQuote)) e.currentTarget.style.background = 'transparent'; }}
            >
              <Plus size={18} />
              {t('quote.add_another', 'Ajouter un autre article')}
            </button>
            <button
              onClick={() => { 
                if (!openingType) {
                  setShowOpeningTypeError(true);
                  document.getElementById('opening-type-selector')?.scrollIntoView({ behavior: 'smooth' });
                  return;
                }
                if (width > 0 && height > 0 && unitPrice > 0 && !outOfBounds && !needsCustomQuote) onNext(); 
              }}
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
                flexDirection: isRTL ? 'row-reverse' : 'row',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { if (!(!width || !height || unitPrice === 0 || outOfBounds || needsCustomQuote)) { e.currentTarget.style.background = '#81C063'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(129,192,99,0.35)'; } }}
              onMouseLeave={e => { if (!(!width || !height || unitPrice === 0 || outOfBounds || needsCustomQuote)) { e.currentTarget.style.background = '#1D3E61'; e.currentTarget.style.boxShadow = 'none'; } }}
            >
              {isRTL ? `← ${t('common.next', 'التالي')}` : `${t('common.next', 'Suivant')} →`}
            </button>
          </div>
        </div>
      </div>

    </>
  );
};

export default StepDimensions;
