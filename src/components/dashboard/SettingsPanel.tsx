import React from 'react';
import { 
  DollarSign, Phone, Clock, FileText, Settings, RotateCcw 
} from 'lucide-react';
import type { BusinessSettings } from '../../store/settingsStore';

interface SettingsPanelProps {
  settings: BusinessSettings;
  setSettings: React.Dispatch<React.SetStateAction<BusinessSettings>>;
  settingsSection: 'finances' | 'contact' | 'horaires' | 'legales';
  setSettingsSection: (section: 'finances' | 'contact' | 'horaires' | 'legales') => void;
  saveSettings: (s: BusinessSettings) => void;
  resetSettings: () => void;
  getSettings: () => BusinessSettings;
  settingsSaved: boolean;
  setSettingsSaved: (saved: boolean) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  setSettings,
  settingsSection,
  setSettingsSection,
  saveSettings,
  resetSettings,
  getSettings,
  settingsSaved,
  setSettingsSaved
}) => {
  return (
    <div style={{ maxWidth: '1000px' }}>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6B7280', marginBottom: '28px' }}>
        Gérez tous les paramètres de votre site depuis ce panneau. Les modifications s'appliquent immédiatement.
      </p>

      {/* Section Tabs */}
      <div className="params-section-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
        {([
          { id: 'finances' as const, label: 'Finances', icon: DollarSign },
          { id: 'contact' as const, label: 'Contact', icon: Phone },
          { id: 'horaires' as const, label: 'Horaires', icon: Clock },
          { id: 'legales' as const, label: 'Légal & Réseaux', icon: FileText },
        ]).map(sec => (
          <button
            key={sec.id}
            onClick={() => setSettingsSection(sec.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 22px', borderRadius: '10px',
              border: `2px solid ${settingsSection === sec.id ? '#1D3E61' : '#E8EDF5'}`,
              cursor: 'pointer',
              fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '14px',
              background: settingsSection === sec.id ? '#1D3E61' : 'white',
              color: settingsSection === sec.id ? 'white' : '#6B7280',
              transition: 'all 0.15s ease',
            }}
          >
            <sec.icon size={15} />
            {sec.label}
          </button>
        ))}
      </div>

      {/* ── FINANCES ── */}
      {settingsSection === 'finances' && (
        <div className="params-finance-outer-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ gridColumn: '1 / -1', background: 'white', borderRadius: '16px', border: '1px solid #E8EDF5', overflow: 'hidden' }}>
            <div style={{ padding: '18px 28px', borderBottom: '1px solid #E8EDF5', background: 'rgba(29,62,97,0.02)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(29,62,97,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <DollarSign size={17} color="#1D3E61" />
              </div>
              <div>
                <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '15px', color: '#0D1B2A', margin: 0 }}>Taxes & Remise</h4>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6B7280', margin: 0 }}>Appliqués automatiquement sur tous les devis</p>
              </div>
            </div>
            <div className="params-finance-inner-grid" style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {([
                { key: 'remisePercent' as keyof BusinessSettings, label: 'Remise commerciale', unit: '%', min: 0, max: 50, step: 1, desc: 'Réduction accordée aux clients' },
                { key: 'tvaPercent' as keyof BusinessSettings, label: 'TVA', unit: '%', min: 0, max: 30, step: 0.5, desc: 'Taxe sur la valeur ajoutée' },
                { key: 'fodecPercent' as keyof BusinessSettings, label: 'FODEC', unit: '%', min: 0, max: 5, step: 0.25, desc: 'Fonds de développement' },
                { key: 'timbreFiscal' as keyof BusinessSettings, label: 'Timbre fiscal', unit: 'DT', min: 0, max: 5, step: 0.1, desc: 'Taxe fixe par devis' },
              ]).map(field => (
                <div key={String(field.key)} style={{ background: '#F8FAFD', borderRadius: '12px', padding: '16px', border: '1px solid #EDF2F7' }}>
                  <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '13px', color: '#1D3E61', marginBottom: '2px' }}>{field.label}</div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9AA5B4', marginBottom: '10px' }}>{field.desc}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button type="button"
                      onClick={() => setSettings(s => ({ ...s, [field.key]: Math.max(field.min, Number(((s[field.key] as number) - field.step).toFixed(3))) }))}
                      style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1.5px solid #D0D9E8', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px', color: '#1D3E61', flexShrink: 0, transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(29,62,97,0.06)'; e.currentTarget.style.borderColor = '#1D3E61'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#D0D9E8'; }}
                    >−</button>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'white', border: '1.5px solid #D0D9E8', borderRadius: '8px', overflow: 'hidden' }}>
                      <input type="number" value={settings[field.key] as number} min={field.min} max={field.max} step={field.step}
                        onChange={e => setSettings(s => ({ ...s, [field.key]: parseFloat(e.target.value) || 0 }))}
                        style={{ flex: 1, padding: '8px 4px', border: 'none', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '17px', color: '#1D3E61', textAlign: 'center', outline: 'none', background: 'transparent', minWidth: 0 }}
                      />
                      <span style={{ padding: '0 8px 0 0', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: '#8896A5', flexShrink: 0 }}>{field.unit}</span>
                    </div>
                    <button type="button"
                      onClick={() => setSettings(s => ({ ...s, [field.key]: Math.min(field.max, Number(((s[field.key] as number) + field.step).toFixed(3))) }))}
                      style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1.5px solid #D0D9E8', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px', color: '#1D3E61', flexShrink: 0, transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(29,62,97,0.06)'; e.currentTarget.style.borderColor = '#1D3E61'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#D0D9E8'; }}
                    >+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Validity */}
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E8EDF5', overflow: 'hidden' }}>
            <div style={{ padding: '18px 28px', borderBottom: '1px solid #E8EDF5', background: 'rgba(129,192,99,0.04)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(129,192,99,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FileText size={17} color="#81C063" />
              </div>
              <div>
                <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '15px', color: '#0D1B2A', margin: 0 }}>Validité du devis</h4>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6B7280', margin: 0 }}>Durée avant expiration</p>
              </div>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ background: '#F8FAFD', borderRadius: '12px', padding: '16px', border: '1px solid #EDF2F7' }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9AA5B4', marginBottom: '10px' }}>Nombre de jours avant expiration</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button type="button" onClick={() => setSettings(s => ({ ...s, validityDays: Math.max(7, (s.validityDays || 10) - 1) }))}
                    style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1.5px solid #D0D9E8', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px', color: '#1D3E61' }}>−</button>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'white', border: '1.5px solid #D0D9E8', borderRadius: '8px', overflow: 'hidden' }}>
                    <input type="number" value={settings.validityDays || 10} min={7} max={90}
                      onChange={e => setSettings(s => ({ ...s, validityDays: parseInt(e.target.value) || 10 }))}
                      style={{ flex: 1, padding: '8px 4px', border: 'none', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '17px', color: '#1D3E61', textAlign: 'center', outline: 'none', background: 'transparent' }}
                    />
                    <span style={{ padding: '0 8px 0 0', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: '#8896A5' }}>jours</span>
                  </div>
                  <button type="button" onClick={() => setSettings(s => ({ ...s, validityDays: Math.min(90, (s.validityDays || 10) + 1) }))}
                    style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1.5px solid #D0D9E8', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px', color: '#1D3E61' }}>+</button>
                </div>
              </div>
            </div>
          </div>

          {/* Live preview */}
          <div style={{ background: 'linear-gradient(135deg, #1D3E61 0%, #0F2444 100%)', borderRadius: '16px', padding: '24px', color: 'white' }}>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)', marginBottom: '16px' }}>
              Aperçu calcul (base 1 000 DT)
            </div>
            {(() => {
              const base = 1000000;
              const remise = base * (settings.remisePercent / 100);
              const netHT = base - remise;
              const fodec = netHT * (settings.fodecPercent / 100);
              const baseTVA = netHT + fodec;
              const tva = baseTVA * (settings.tvaPercent / 100);
              const ttc = baseTVA + tva + (settings.timbreFiscal * 1000);
              return (
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.85)' }}><span>Base HT</span><span>1 000.000 DT</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#FF8A8A' }}><span>− Remise {settings.remisePercent}%</span><span>−{(remise / 1000).toFixed(3)} DT</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}><span>Net HT</span><span>{(netHT / 1000).toFixed(3)} DT</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.85)' }}><span>+ FODEC {settings.fodecPercent}%</span><span>+{(fodec / 1000).toFixed(3)} DT</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.85)' }}><span>+ TVA {settings.tvaPercent}%</span><span>+{(tva / 1000).toFixed(3)} DT</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.85)' }}><span>+ Timbre</span><span>+{settings.timbreFiscal.toFixed(3)} DT</span></div>
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.15)', margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '16px' }}>
                    <span>TOTAL TTC</span>
                    <span style={{ color: '#81C063' }}>{(ttc / 1000).toFixed(3)} DT</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── CONTACT ── */}
      {settingsSection === 'contact' && (
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E8EDF5', overflow: 'hidden' }}>
          <div style={{ padding: '18px 28px', borderBottom: '1px solid #E8EDF5', background: 'rgba(29,62,97,0.02)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(29,62,97,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Phone size={17} color="#1D3E61" />
            </div>
            <div>
              <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '15px', color: '#0D1B2A', margin: 0 }}>Coordonnées & Contact</h4>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6B7280', margin: 0 }}>Affiché sur la page Contact, dans les devis et partout sur le site</p>
            </div>
          </div>
          <div className="params-contact-grid" style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#4A5568', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Téléphone principal</label>
              <input type="tel" value={settings.phone1 || ''} placeholder="(+216) 53 186 611"
                onChange={e => setSettings(s => ({ ...s, phone1: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E8EDF5', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#0D1B2A', outline: 'none', boxSizing: 'border-box', background: '#FAFBFD' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#1D3E61'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(29,62,97,0.08)'; e.currentTarget.style.background = 'white'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#E8EDF5'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#FAFBFD'; }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#4A5568', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Téléphone secondaire</label>
              <input type="tel" value={settings.phone2 || ''} placeholder="(+216) 57 099 070"
                onChange={e => setSettings(s => ({ ...s, phone2: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E8EDF5', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#0D1B2A', outline: 'none', boxSizing: 'border-box', background: '#FAFBFD' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#1D3E61'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(29,62,97,0.08)'; e.currentTarget.style.background = 'white'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#E8EDF5'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#FAFBFD'; }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#4A5568', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Numéro WhatsApp</label>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#F59E0B', marginBottom: '6px' }}>⚠ Sans + ni espaces (ex: 21657099070)</p>
              <input type="tel" value={settings.whatsapp || ''} placeholder="21657099070"
                onChange={e => setSettings(s => ({ ...s, whatsapp: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E8EDF5', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#0D1B2A', outline: 'none', boxSizing: 'border-box', background: '#FAFBFD' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#1D3E61'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(29,62,97,0.08)'; e.currentTarget.style.background = 'white'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#E8EDF5'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#FAFBFD'; }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#4A5568', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</label>
              <input type="email" value={settings.email || ''} placeholder="contact@aluminiumspace.com"
                onChange={e => setSettings(s => ({ ...s, email: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E8EDF5', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#0D1B2A', outline: 'none', boxSizing: 'border-box', background: '#FAFBFD' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#1D3E61'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(29,62,97,0.08)'; e.currentTarget.style.background = 'white'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#E8EDF5'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#FAFBFD'; }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#4A5568', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Adresse</label>
              <input type="text" value={settings.address || ''} placeholder="125 lot Laaroussi, Mghira"
                onChange={e => setSettings(s => ({ ...s, address: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E8EDF5', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#0D1B2A', outline: 'none', boxSizing: 'border-box', background: '#FAFBFD' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#1D3E61'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(29,62,97,0.08)'; e.currentTarget.style.background = 'white'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#E8EDF5'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#FAFBFD'; }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#4A5568', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ville / Gouvernorat</label>
              <input type="text" value={settings.city || ''} placeholder="Tunis, Tunisie"
                onChange={e => setSettings(s => ({ ...s, city: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E8EDF5', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#0D1B2A', outline: 'none', boxSizing: 'border-box', background: '#FAFBFD' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#1D3E61'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(29,62,97,0.08)'; e.currentTarget.style.background = 'white'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#E8EDF5'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#FAFBFD'; }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── HORAIRES ── */}
      {settingsSection === 'horaires' && (
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E8EDF5', overflow: 'hidden' }}>
          <div style={{ padding: '18px 28px', borderBottom: '1px solid #E8EDF5', background: 'rgba(29,62,97,0.02)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(29,62,97,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Clock size={17} color="#1D3E61" />
            </div>
            <div>
              <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '15px', color: '#0D1B2A', margin: 0 }}>Horaires d'ouverture</h4>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6B7280', margin: 0 }}>Affichés sur la page Contact</p>
            </div>
          </div>
          <div className="params-hours-grid" style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#4A5568', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lundi – Vendredi</label>
              <input type="text" value={settings.hoursWeekday || ''} placeholder="8h00 – 17h00"
                onChange={e => setSettings(s => ({ ...s, hoursWeekday: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E8EDF5', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#0D1B2A', outline: 'none', boxSizing: 'border-box', background: '#FAFBFD' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#1D3E61'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(29,62,97,0.08)'; e.currentTarget.style.background = 'white'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#E8EDF5'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#FAFBFD'; }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#4A5568', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Samedi</label>
              <input type="text" value={settings.hoursSaturday || ''} placeholder="8h00 – 12h00"
                onChange={e => setSettings(s => ({ ...s, hoursSaturday: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E8EDF5', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#0D1B2A', outline: 'none', boxSizing: 'border-box', background: '#FAFBFD' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#1D3E61'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(29,62,97,0.08)'; e.currentTarget.style.background = 'white'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#E8EDF5'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#FAFBFD'; }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#4A5568', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dimanche</label>
              <input type="text" value={settings.sundayHours || ''} placeholder="Fermé"
                onChange={e => setSettings(s => ({ ...s, sundayHours: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E8EDF5', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#0D1B2A', outline: 'none', boxSizing: 'border-box', background: '#FAFBFD' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#1D3E61'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(29,62,97,0.08)'; e.currentTarget.style.background = 'white'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#E8EDF5'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#FAFBFD'; }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#8896A5', marginBottom: '12px' }}>Aperçu horaires</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { day: 'Lundi – Vendredi', hours: settings.hoursWeekday || '8h00 – 17h00', open: true },
                  { day: 'Samedi', hours: settings.hoursSaturday || '8h00 – 12h00', open: true },
                  { day: 'Dimanche', hours: settings.sundayHours || 'Fermé', open: !!settings.sundayHours && settings.sundayHours.toLowerCase() !== 'fermé' },
                ].map(row => (
                  <div key={row.day} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: row.open ? '#F0FFF4' : '#FFF5F5', borderRadius: '8px', border: `1px solid ${row.open ? '#A7F3D0' : '#FECACA'}` }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#1D3E61' }}>{row.day}</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: row.open ? '#059669' : '#EF4444' }}>{row.hours}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LEGAL & RESEAUX ── */}
      {settingsSection === 'legales' && (
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E8EDF5', overflow: 'hidden' }}>
          <div style={{ padding: '18px 28px', borderBottom: '1px solid #E8EDF5', background: 'rgba(29,62,97,0.02)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(29,62,97,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileText size={17} color="#1D3E61" />
            </div>
            <div>
              <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '15px', color: '#0D1B2A', margin: 0 }}>Informations légales</h4>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6B7280', margin: 0 }}>Raison sociale, identifiants fiscaux et réseaux sociaux</p>
            </div>
          </div>
          <div className="params-legales-grid" style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#4A5568', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Raison sociale</label>
              <input type="text" value={settings.companyFullName || ''} placeholder="Aluminium Space SARL"
                onChange={e => setSettings(s => ({ ...s, companyFullName: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E8EDF5', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#0D1B2A', outline: 'none', boxSizing: 'border-box', background: '#FAFBFD' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#1D3E61'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(29,62,97,0.08)'; e.currentTarget.style.background = 'white'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#E8EDF5'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#FAFBFD'; }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#4A5568', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Matricule fiscal</label>
              <input type="text" value={settings.matriculeFiscal || ''} placeholder="0000000X/A/M/000"
                onChange={e => setSettings(s => ({ ...s, matriculeFiscal: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E8EDF5', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#0D1B2A', outline: 'none', boxSizing: 'border-box', background: '#FAFBFD' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#1D3E61'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(29,62,97,0.08)'; e.currentTarget.style.background = 'white'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#E8EDF5'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#FAFBFD'; }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#4A5568', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>RIB Bancaire</label>
              <input type="text" value={settings.rib || ''} placeholder="00 000 0000000000000 00"
                onChange={e => setSettings(s => ({ ...s, rib: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E8EDF5', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#0D1B2A', outline: 'none', boxSizing: 'border-box', background: '#FAFBFD' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#1D3E61'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(29,62,97,0.08)'; e.currentTarget.style.background = 'white'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#E8EDF5'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#FAFBFD'; }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#4A5568', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>URL Facebook</label>
              <input type="url" value={settings.facebook || ''} placeholder="https://facebook.com/..."
                onChange={e => setSettings(s => ({ ...s, facebook: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E8EDF5', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#0D1B2A', outline: 'none', boxSizing: 'border-box', background: '#FAFBFD' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#1D3E61'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(29,62,97,0.08)'; e.currentTarget.style.background = 'white'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#E8EDF5'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#FAFBFD'; }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#4A5568', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>URL Instagram</label>
              <input type="url" value={settings.instagram || ''} placeholder="https://instagram.com/..."
                onChange={e => setSettings(s => ({ ...s, instagram: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E8EDF5', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#0D1B2A', outline: 'none', boxSizing: 'border-box', background: '#FAFBFD' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#1D3E61'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(29,62,97,0.08)'; e.currentTarget.style.background = 'white'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#E8EDF5'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#FAFBFD'; }}
              />
            </div>
          </div>
        </div>
      )}

      {/* SAVE BUTTONS */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
        <button
          onClick={() => {
            saveSettings(settings);
            setSettingsSaved(true);
            setTimeout(() => setSettingsSaved(false), 2500);
          }}
          style={{
            flex: 1, background: settingsSaved ? '#81C063' : '#1D3E61', color: 'white', border: 'none', borderRadius: '12px',
            padding: '15px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '15px',
            letterSpacing: '1.5px', textTransform: 'uppercase', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            transition: 'all 0.2s', boxShadow: settingsSaved ? '0 4px 16px rgba(129,192,99,0.3)' : '0 4px 16px rgba(29,62,97,0.2)',
          }}
          onMouseEnter={e => { if (!settingsSaved) { e.currentTarget.style.background = '#81C063'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(129,192,99,0.35)'; } }}
          onMouseLeave={e => { if (!settingsSaved) { e.currentTarget.style.background = '#1D3E61'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(29,62,97,0.2)'; } }}
        >
          {settingsSaved ? (
            <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg> Paramètres sauvegardés !</>
          ) : (
            <><Settings size={16} /> Enregistrer tous les paramètres</>
          )}
        </button>
        <button
          onClick={() => { resetSettings(); setSettings(getSettings()); }}
          style={{ padding: '15px 20px', background: 'white', color: '#EF4444', border: '1.5px solid #FECACA', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s', whiteSpace: 'nowrap' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.borderColor = '#FCA5A5'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#FECACA'; }}
        >
          <RotateCcw size={15} />
          Réinitialiser
        </button>
      </div>

      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8896A5', marginTop: '12px', textAlign: 'center' }}>
        Les modifications s'appliquent immédiatement sur tous les nouveaux devis et pages.
      </p>
    </div>
  );
};

export default SettingsPanel;
