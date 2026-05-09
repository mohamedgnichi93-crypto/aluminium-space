import { useTranslation } from 'react-i18next';
import { products } from '../../data/products';
import { Edit2 } from 'lucide-react';
import { formatPrice } from '../../utils/pdfGenerator';
import { getSettings } from '../../store/settingsStore';
import type { DevisItem } from './DevisWizard';

interface Props {
  formData: any;
  items: DevisItem[];
  onPrev: () => void;
  onSubmitOrder: () => void;
  isSubmitting: boolean;
}

const StepSummary = ({ formData, items, onPrev, onSubmitOrder, isSubmitting }: Props) => {
  const { t } = useTranslation();

  const cfg = getSettings();
  // Global Calculations (for UI)
  const totalBrutHT = items.reduce((sum, item) => sum + (item.unitPrice / 1000) * item.quantity, 0);
  const totalRemise = totalBrutHT * (cfg.remisePercent / 100);
  const totalNetHT = totalBrutHT - totalRemise;
  const fodec = totalNetHT * (cfg.fodecPercent / 100);
  const baseTVA = totalNetHT + fodec;
  const tva = baseTVA * (cfg.tvaPercent / 100);
  const timbre = cfg.timbreFiscal;
  const totalTTC = baseTVA + tva + timbre;

  const getProductImage = (productId: string) => {
    switch (productId) {
      case 'colibri-50': return '/images/colibri-50.png';
      case 'sidney-50': return '/images/sidney-50.png';
      case 'sidney-50-ac': return '/images/sidney-50-ac.png';
      case 'elba': return '/images/elba.png';
      default: return '/images/colibri-50.png';
    }
  };

  return (
    <div className="animate-fade-in w-full">
      <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '26px', letterSpacing: '2px', textTransform: 'uppercase', color: '#1D3E61', marginBottom: '32px', textAlign: 'center' }}>
        Résumé de votre Devis
      </h2>

      <div
        className="devis-invoice-container"
        style={{
          background: 'white',
          border: '1px solid #E2E8F0',
          borderRadius: '20px',
          padding: '40px',
          marginBottom: '32px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '32px', borderBottom: '2px solid #1A5DA8', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img src="/logo-aluminium-space.png" alt="Logo" style={{ height: '50px', width: 'auto', objectFit: 'contain' }} />
            <div>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '20px', color: '#0D1B2A', letterSpacing: '0.5px' }}>
                ALUMINIUM <span style={{ color: '#1A5DA8' }}>SPACE</span>
              </div>
              <div style={{ fontSize: '11px', letterSpacing: '2px', color: '#8896A5', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
                MENUISERIE ALUMINIUM
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '24px', color: '#1A5DA8', marginBottom: '4px' }}>DEVIS OFFICIEL</div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#8896A5' }}>Date: {new Date().toLocaleDateString('fr-TN')}</div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#8896A5' }}>Validité: {cfg.validityDays} jours</div>
          </div>
        </div>

        <div className="devis-from-to-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
          <div>
            <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '14px', color: '#4A5568', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>De :</h4>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#0D1B2A', lineHeight: 1.6 }}>
              <p style={{ fontWeight: 600 }}>Aluminium Space</p>
              <p style={{ color: '#4A5568' }}>125 lot Laaroussi, Mghira</p>
              <p style={{ color: '#4A5568' }}>Tunis, Tunisie</p>
              <p style={{ color: '#4A5568' }}>Tél: (+216) 53 186 611</p>
              <p style={{ color: '#4A5568' }}>Email: contact@aluminiumspace.com</p>
            </div>
          </div>
          <div>
            <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '14px', color: '#4A5568', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>À :</h4>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#0D1B2A', lineHeight: 1.6 }}>
              <p style={{ fontWeight: 600 }}>{formData.fullName}</p>
              <p style={{ color: '#4A5568' }}>{formData.address}</p>
              <p style={{ color: '#4A5568' }}>Tél: {formData.phone}</p>
              {formData.email && <p style={{ color: '#4A5568' }}>Email: {formData.email}</p>}
            </div>
          </div>
        </div>

        <p className="block md:hidden" style={{ fontSize: '12px', color: '#94A3B8', textAlign: 'center', marginBottom: '6px', fontFamily: 'DM Sans, sans-serif' }}>← Faites défiler pour voir le tableau →</p>
        <div style={{ width: '100%', marginBottom: '32px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any, border: '1px solid #E2E8F0', borderRadius: '12px' }}>
          <div style={{ minWidth: '750px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '30% 15% 8% 15% 17% 15%',
              background: '#1D3E61',
              padding: '14px 20px',
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 600,
              fontSize: '13px',
              color: 'white',
              alignItems: 'center'
            }}>
              <div>Description</div>
              <div style={{ textAlign: 'center' }}>Dimensions</div>
              <div style={{ textAlign: 'center' }}>Qté</div>
              <div style={{ textAlign: 'right' }}>P.U HT</div>
              <div style={{ textAlign: 'right' }}>Remise {cfg.remisePercent}%</div>
              <div style={{ textAlign: 'right' }}>Net HT</div>
            </div>

            {items.map((item) => {
              const uPrice = item.unitPrice / 1000;
              const itemRemise = uPrice * item.quantity * (cfg.remisePercent / 100);
              const itemNet = uPrice * item.quantity - itemRemise;
              const prod = products.find(p => p.id === item.productId);

              return (
                <div key={item.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '30% 15% 8% 15% 17% 15%',
                  padding: '16px 20px',
                  borderBottom: '1px solid #E2E8F0',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  color: '#0D1B2A',
                  alignItems: 'center',
                  background: 'white'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={getProductImage(item.productId)} alt="" style={{ width: '45px', height: '45px', objectFit: 'contain', background: '#F8FAFD', borderRadius: '8px', padding: '4px' }} />
                    <div>
                      <div style={{ fontWeight: 600, color: '#1A202C' }}>{item.productName}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', color: '#8896A5', fontStyle: 'italic' }}>
                          {prod ? t(`products.category_${prod.category}`) : ''}
                          {item.meshType && ` — ${item.meshType}`}
                        </span>
                        {item.color && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(29,62,97,0.06)', border: '1px solid #D0D9E8', borderRadius: '20px', padding: '1px 8px 1px 4px' }}>
                            <span style={{
                              display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%',
                              background: item.color === 'Noir' ? '#1A1A1A' : '#FFFFFF',
                              border: item.color === 'Blanc' ? '1.5px solid #C0CAD6' : '1.5px solid #1A1A1A',
                              flexShrink: 0,
                            }} />
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#1D3E61', fontFamily: 'Inter, sans-serif', fontStyle: 'normal' }}>
                              {item.color}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', color: '#4A5568' }}>{item.width} × {item.height} cm</div>
                  <div style={{ textAlign: 'center', color: '#4A5568' }}>{item.quantity}</div>
                  <div style={{ textAlign: 'right', color: '#4A5568' }}>{formatPrice(uPrice)}</div>
                  <div style={{ textAlign: 'right', color: '#EF4444', fontWeight: 500 }}>{formatPrice(itemRemise)}</div>
                  <div style={{ textAlign: 'right', fontWeight: 700, color: '#1A5DA8' }}>{formatPrice(itemNet)}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="devis-totals-outer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div className="devis-totals-panel" style={{ width: '320px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4A5568' }}>
              <span>Total brut HT :</span>
              <span style={{ color: '#0D1B2A' }}>{formatPrice(totalBrutHT)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#EF4444' }}>
              <span>Remise ({cfg.remisePercent}%) :</span>
              <span>-{formatPrice(totalRemise)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#0D1B2A', fontWeight: 600, textDecoration: 'none' }}>
              <span style={{ textDecoration: 'none' }}>Total net HT :</span>
              <span style={{ textDecoration: 'none' }}>{formatPrice(totalNetHT)}</span>
            </div>

            <div style={{ height: '1px', background: '#E2E8F0', margin: '12px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4A5568' }}>
              <span>FODEC (1%) :</span>
              <span style={{ color: '#0D1B2A' }}>{formatPrice(fodec)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4A5568' }}>
              <span>Base TVA :</span>
              <span style={{ color: '#0D1B2A' }}>{formatPrice(baseTVA)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4A5568' }}>
              <span>TVA (19%) :</span>
              <span style={{ color: '#0D1B2A' }}>{formatPrice(tva)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4A5568' }}>
              <span>Timbre fiscal :</span>
              <span style={{ color: '#0D1B2A' }}>{formatPrice(timbre)}</span>
            </div>

            <div style={{ background: '#1D3E61', borderRadius: '10px', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(26,93,168,0.15)' }}>
              <span style={{ color: 'white', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '16px' }}>TOTAL TTC</span>
              <span style={{ color: 'white', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '24px' }}>{formatPrice(totalTTC)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="devis-summary-action-buttons" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
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
          <Edit2 size={16} />
          Modifier
        </button>

        <button
          onClick={onSubmitOrder}
          disabled={isSubmitting}
          type="button"
          style={{
            background: isSubmitting ? '#7A9BC4' : '#1D3E61',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '16px 40px',
            fontSize: '15px',
            fontWeight: 700,
            fontFamily: 'Rajdhani, sans-serif',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: isSubmitting ? 'none' : '0 6px 20px rgba(29,62,97,0.30)',
            transition: 'all 0.2s ease',
            minWidth: '260px',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => { if (!isSubmitting) { e.currentTarget.style.background = '#81C063'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(129,192,99,0.35)'; } }}
          onMouseLeave={(e) => { if (!isSubmitting) { e.currentTarget.style.background = '#1D3E61'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(29,62,97,0.30)'; } }}
        >
          {isSubmitting ? '⏳ Envoi en cours...' : '✓ Confirmer & Télécharger le Devis'}
        </button>
      </div>
    </div>
  );
};

export default StepSummary;
