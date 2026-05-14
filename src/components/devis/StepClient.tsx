import { useTranslation } from 'react-i18next';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { DevisFormData, DevisItem } from './DevisWizard';

interface Props {
  register: UseFormRegister<DevisFormData>;
  errors: FieldErrors<DevisFormData>;
  onPrev: () => void;
  onSubmit: () => void;
  itemsCount: number;
  items: DevisItem[];
}

const StepClient = ({ register, errors, onPrev, onSubmit, itemsCount, items }: Props) => {
  const { t, i18n } = useTranslation();
  const isRTL = ['ar', 'tn'].includes(i18n.language);

  const getBorderColor = (_fieldName: string, value: any, error: any) => {
    if (error) return '#EF4444';
    // Valid state (if value exists and no error)
    if (value && value.toString().trim() !== '') return '#2EAA6E';
    return '#E2E8F0';
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = '#1D3E61';
    e.currentTarget.style.background = 'white';
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(29,62,97,0.10)';
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>, error: any) => {
    const value = e.currentTarget.value;
    e.currentTarget.style.borderColor = getBorderColor(e.currentTarget.name, value, error);
    e.currentTarget.style.background = '#F8FAFD';
    e.currentTarget.style.boxShadow = 'none';
  };

  const inputProps = (name: string, error: any) => ({
    ...register(name),
    onFocus: handleFocus,
    onBlur: (e: any) => handleBlur(e, error),
    style: {
      background: '#F8FAFD',
      border: `1px solid ${getBorderColor(name, null, error)}`,
      borderRadius: '10px',
      padding: '14px 16px',
      color: '#0D1B2A',
      fontSize: '15px',
      width: '100%',
      outline: 'none',
      transition: 'all 0.3s ease',
      fontFamily: 'Inter, sans-serif'
    }
  });

  const labelStyle = {
    display: 'block',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    color: '#4A5568',
    marginBottom: '6px',
    fontWeight: 500
  };

  return (
    <div className="animate-fade-in w-full">
      <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '26px', letterSpacing: '2px', textTransform: 'uppercase', color: '#1D3E61', marginBottom: '32px', textAlign: isRTL ? 'right' : 'left' }}>
        {t('quote.client_title', 'Vos Coordonnées')}
      </h2>

      {/* Items Summary Banner */}
      <div style={{
        background: 'rgba(29,62,97,0.05)',
        border: '1px solid rgba(29,62,97,0.18)',
        borderRadius: '10px',
        padding: '16px',
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{ fontSize: '20px' }}>📋</div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#0D1B2A', textAlign: isRTL ? 'right' : 'left' }}>
          {t('quote.summary_banner', 'Votre devis : {{count}} article(s) — Total HT : {{total}}', { count: itemsCount, total: (items.reduce((sum, item) => sum + (item.totalPrice * 0.8), 0) / 1000).toFixed(3) + ' DT' })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Full Name */}
        <div style={{ gridColumn: '1 / -1' }} className="md:col-span-1">
          <label style={labelStyle}>{t('quote.full_name')} *</label>
          <input type="text" placeholder={t('quote.full_name_placeholder', 'Ex: Mohamed Ali')} {...inputProps('fullName', errors.fullName)} dir={isRTL ? 'rtl' : 'ltr'} />
          {errors.fullName && <span style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px', display: 'block', textAlign: isRTL ? 'right' : 'left' }}>{errors.fullName.message as string}</span>}
        </div>

        {/* Phone */}
        <div style={{ gridColumn: '1 / -1' }} className="md:col-span-1">
          <label style={labelStyle}>{t('quote.phone')} *</label>
          <input type="tel" placeholder={t('quote.phone_placeholder', 'Ex: 50 123 456')} {...inputProps('phone', errors.phone)} dir="ltr" />
          <div style={{ fontSize: '12px', color: '#8896A5', marginTop: '6px', textAlign: isRTL ? 'right' : 'left' }}>{t('quote.phone_format', 'Format: 8 chiffres')}</div>
          {errors.phone && <span style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px', display: 'block', textAlign: isRTL ? 'right' : 'left' }}>{errors.phone.message as string}</span>}
        </div>

        {/* Email */}
        <div style={{ gridColumn: '1 / -1' }} className="md:col-span-1">
          <label style={labelStyle}>{t('quote.email')}</label>
          <input type="email" placeholder={t('quote.email_placeholder', 'Ex: contact@email.com')} {...inputProps('email', errors.email)} dir="ltr" />
          {errors.email && <span style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px', display: 'block', textAlign: isRTL ? 'right' : 'left' }}>{errors.email.message as string}</span>}
        </div>

        {/* Address */}
        <div style={{ gridColumn: '1 / -1' }} className="md:col-span-1">
          <label style={labelStyle}>{t('quote.address')} *</label>
          <input type="text" placeholder={t('quote.address_placeholder', 'Ex: 123 Rue de la Liberté, Tunis')} {...inputProps('address', errors.address)} dir={isRTL ? 'rtl' : 'ltr'} />
          {errors.address && <span style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px', display: 'block', textAlign: isRTL ? 'right' : 'left' }}>{errors.address.message as string}</span>}
        </div>

        {/* Notes */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>{t('quote.notes')}</label>
          <textarea
            rows={4}
            placeholder={t('quote.notes_placeholder', "Détails supplémentaires, préférences d'installation...")}
            {...inputProps('notes', errors.notes)}
            style={{ ...inputProps('notes', errors.notes).style, resize: 'none', textAlign: isRTL ? 'right' : 'left' }}
            dir={isRTL ? 'rtl' : 'ltr'}
          ></textarea>
        </div>
      </div>

      {/* Privacy Note */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F8FAFD', padding: '16px', borderRadius: '10px', marginBottom: '32px' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4A5568" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <p style={{ fontSize: '13px', color: '#4A5568', fontFamily: 'Inter, sans-serif', margin: 0, textAlign: isRTL ? 'right' : 'left' }}>
          {t('quote.privacy_note', "Vos données sont sécurisées et ne seront utilisées que pour vous recontacter concernant ce devis.")}
        </p>
      </div>

      {/* Navigation */}
      <div className="devis-nav-buttons" style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '24px', borderTop: '1px solid #E2E8F0' }}>
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
          {isRTL ? `${t('common.back', 'Retour')} →` : `← ${t('common.back', 'Retour')}`}
        </button>
        <button
          onClick={onSubmit}
          type="button"
          style={{
            background: '#1D3E61',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            padding: '14px 32px',
            fontSize: '15px',
            fontWeight: 700,
            fontFamily: 'Rajdhani, sans-serif',
            cursor: 'pointer',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#81C063'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(129,192,99,0.35)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#1D3E61'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          {isRTL ? `← ${t('common.next', 'التالي')}` : `${t('common.next', 'Suivant')} →`}
        </button>
      </div>
    </div>
  );
};

export default StepClient;
