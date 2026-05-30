import { useTranslation } from 'react-i18next';
import { products } from '../../data/products';
import { ALL_COLORS } from '../../data/colors';

import { formatPrice } from '../../utils/pdfGenerator';
import { getSettings } from '../../store/settingsStore';
import { getRemisePercent } from '../../utils/remiseCalculator';
import type { DevisItem, DevisFormData } from './DevisWizard';
import { formatPrice as formatPriceUtil } from '../../utils/formatPrice';

interface Props {
  formData: DevisFormData;
  items: DevisItem[];
  onPrev: () => void;
  onSubmitOrder: () => void;
  isSubmitting: boolean;
}

const StepSummary = ({ formData, items, onPrev, onSubmitOrder, isSubmitting }: Props) => {
  const { t, i18n } = useTranslation();
  const isRTL = ['ar', 'tn'].includes(i18n.language);

  const cfg = getSettings();
  // Global Calculations (for UI)
  const totalBrutHT = items.reduce((sum, item) => sum + (item.unitPrice / 1000) * item.quantity, 0);
  const totalQty = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const remisePct = getRemisePercent(totalQty);
  const totalRemise = totalBrutHT * (remisePct / 100);
  const totalNetHT = totalBrutHT - totalRemise;
  const fodec = totalNetHT * (cfg.fodecPercent / 100);
  const baseTVA = totalNetHT + fodec;
  const tva = baseTVA * (cfg.tvaPercent / 100);
  const timbre = cfg.timbreFiscal;
  const totalSurcharge = items.reduce((sum, item) => sum + ((item.colorSurchargeAmount ?? 0) / 1000) * item.quantity, 0);
  const totalTTC = baseTVA + tva + timbre;

  return (
    <div className="animate-fade-in w-full">
      <div
        style={{
          background: 'white',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: 'clamp(16px, 4vw, 24px)',
          maxWidth: '640px',
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
          overflowX: 'hidden'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '20px', color: '#0D1B2A', margin: '0 0 8px', textAlign: 'center' }}>
            {t('quote.summary_title', 'Résumé de votre devis')}
          </h2>
          <span style={{ 
            display: 'inline-block',
            background: '#F0FDF4', 
            color: '#16A34A', 
            padding: '4px 12px', 
            borderRadius: '20px', 
            fontSize: '12px', 
            fontWeight: 600,
            fontFamily: 'Inter, sans-serif'
          }}>
            {t('quote.validity', 'Valable {{days}} jours', { days: cfg.validityDays })}
          </span>
        </div>

        <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '16px', marginBottom: '24px', textAlign: isRTL ? 'right' : 'left' }}>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            {t('common.client', 'Client')} :
          </div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#0D1B2A', lineHeight: 1.6 }}>
            <p style={{ fontWeight: 600 }}>{formData.fullName}</p>
            <p style={{ color: '#4A5568' }}>{formData.address}</p>
            <p style={{ color: '#4A5568' }}>{t('common.phone_short', 'Tél')}: {formData.phone}</p>
            {formData.email && <p style={{ color: '#4A5568' }}>{t('common.email_short', 'Email')}: {formData.email}</p>}
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          {items.map((item, idx) => {
            const productData = products.find(p => p.id === item.productId);
            const imageUrl = productData?.imageUrl ?? null;
            const uPrice = item.unitPrice / 1000;
            const itemTotal = uPrice * item.quantity;
            
            return (
              <div key={item.id} style={{ 
                display: 'flex', 
                flexDirection: 'column',
                padding: '20px 0', 
                borderBottom: idx === items.length - 1 ? 'none' : '1px solid #F1F5F9',
                gap: '12px',
                width: '100%'
              }}>
                {/* 1. PRODUCT INFO SECTION (TOP) */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                  gap: '16px',
                  width: '100%'
                }}>
                  {/* Image */}
                  <div style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', border: '0.5px solid #E2E8F0', flexShrink: 0, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {imageUrl ? (
                      <img src={imageUrl} alt={item.productName} className="no-rtl-flip" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'none' }} />
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    )}
                  </div>

                  {/* Details */}
                  <div style={{ 
                    flex: 1, 
                    textAlign: isRTL ? 'right' : 'left',
                    overflow: 'visible'
                  }}>
                    <div style={{ 
                      fontFamily: 'Inter, sans-serif', 
                      fontWeight: 700, 
                      fontSize: '16px', 
                      color: '#1D3E61',
                      whiteSpace: 'normal',
                      overflow: 'visible',
                      lineHeight: 1.3
                    }}>
                      {item.productName}
                      {item.openingType && (
                        <span style={{ fontSize: 13, color: '#6B7280', marginLeft: 6 }}>
                          — {item.openingType === 'fenetre' ? '🪟' : '🚪'}
                        </span>
                      )}
                    </div>
                    
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#64748B', marginTop: '4px', fontWeight: 500 }}>
                      {item.width} × {item.height} cm — {t('common.qty_short', 'Qté')}: {item.quantity}
                    </div>

                    {/* COLOR BADGE UNDER DIMENSIONS */}
                    {item.color && (
                      <div style={{ display: 'inline-flex', flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', background: '#F1F5F9', borderRadius: '20px', padding: '2px 10px', fontSize: '12px', color: '#475569', marginTop: '6px', border: '1px solid #E2E8F0' }}>
                        <span style={{ 
                          display: 'inline-block', 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          background: ALL_COLORS.find(c => c.name === item.color)?.hex || '#FFFFFF', 
                          border: '1px solid rgba(0,0,0,0.1)',
                          [isRTL ? 'marginLeft' : 'marginRight']: '5px', 
                          verticalAlign: 'middle' 
                        }} />
                        {t(`common.${item.color?.toLowerCase() ?? 'blanc'}`, item.color ?? 'Blanc')}
                        {(item.colorSurchargePct ?? 0) > 0 && (
                          <span style={{ fontSize: '11px', color: '#92400E', [isRTL ? 'marginRight' : 'marginLeft']: '6px', fontWeight: 700 }}>
                            (+{item.colorSurchargePct}%)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. SEPARATOR LINE */}
                <div style={{ height: '1px', background: '#F1F5F9', margin: '4px 0' }} />

                {/* 3. PRICE SECTION (BOTTOM RIGHT) */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: isRTL ? 'flex-start' : 'flex-end',
                  width: '100%'
                }}>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#94A3B8', marginBottom: '2px' }}>
                    {formatPriceUtil(uPrice)} DT /u
                  </div>
                  <div style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#64748B', fontWeight: 500 }}>
                      TOTAL:
                    </span>
                    <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: '18px', color: '#1D3E61' }}>
                      {formatPriceUtil(itemTotal)} DT
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#64748B', gap: '8px' }}>
            <span style={{ maxWidth: '50%' }}>{t('quote.subtotal_ht', 'Sous-total HT')}</span>
            <span style={{ color: '#1D3E61', fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap' }}>{formatPrice(totalBrutHT)}</span>
          </div>
          {totalSurcharge > 0 && (
            <div style={{ 
              display: 'flex', 
              flexDirection: isRTL ? 'row-reverse' : 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              color: '#92400E',
              background: '#FFFBEB',
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid #FDE68A',
              margin: '6px 0',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              gap: '8px'
            }}>
              <span style={{ maxWidth: '50%' }}>{t('quote.color_surcharge', 'Supplément couleurs')}</span>
              <span style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>+ {formatPrice(totalSurcharge)}</span>
            </div>
          )}
          {totalRemise > 0 && (
            <div style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#EF4444', fontWeight: 600, gap: '8px' }}>
              <span style={{ maxWidth: '50%' }}>{t('quote.remise_label', 'Remise ({{percent}}%)', { percent: remisePct })}</span>
              <span style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>-{formatPrice(totalRemise)}</span>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#64748B', gap: '8px' }}>
            <span style={{ maxWidth: '50%' }}>{t('quote.fodec', 'FODEC ({{percent}}%)', { percent: cfg.fodecPercent })}</span>
            <span style={{ color: '#1D3E61', fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap' }}>{formatPrice(fodec)}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#64748B', gap: '8px' }}>
            <span style={{ maxWidth: '50%' }}>{t('quote.tva', 'TVA ({{percent}}%)', { percent: cfg.tvaPercent })}</span>
            <span style={{ color: '#1D3E61', fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap' }}>{formatPrice(tva)}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#64748B', gap: '8px' }}>
            <span style={{ maxWidth: '50%' }}>{t('quote.timbre', 'Timbre fiscal')}</span>
            <span style={{ color: '#1D3E61', fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap' }}>{formatPrice(timbre)}</span>
          </div>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: isRTL ? 'row-reverse' : 'row',
            justifyContent: 'space-between', 
            alignItems: 'center', 
            paddingTop: '12px', 
            borderTop: '1px solid #E2E8F0',
            marginTop: '4px',
            gap: '8px'
          }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#1D3E61' }}>{t('quote.total_ttc', 'Total TTC')}</span>
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '26px', color: '#1D3E61', flexShrink: 0, whiteSpace: 'nowrap' }}>{formatPrice(totalTTC)}</span>
          </div>
        </div>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          marginTop: '24px'
        }}>
          {/* LEFT — Retour button */}
          <button
            onClick={onPrev}
            className="w-full md:w-auto"
            style={{
              background: 'transparent',
              border: '1.5px solid #CBD5E1',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '15px',
              fontWeight: '500',
              color: '#64748B',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: isRTL ? 'row-reverse' : 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isRTL ? `${t('common.back', 'Retour')} →` : `← ${t('common.back', 'Retour')}`}
          </button>

          {/* RIGHT — Accept & Download PDF button */}
          <button
            onClick={onSubmitOrder}
            disabled={isSubmitting}
            className="w-full md:flex-1"
            style={{
              background: '#1D3E61',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: 'clamp(13px, 4vw, 15px)',
              fontWeight: '600',
              color: '#ffffff',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: isSubmitting ? 0.7 : 1,
              whiteSpace: 'normal',
              textAlign: 'center',
              minHeight: '48px'
            }}
          >
            {isSubmitting ? t('common.processing', 'Traitement...') : t('quote.accept_download', 'Accepter et télécharger le PDF')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepSummary;
