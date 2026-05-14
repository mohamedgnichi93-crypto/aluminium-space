interface SectionHeaderProps {
  label?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
  light?: boolean;
}

const SectionHeader = ({ label, title, subtitle, center = true, light = false }: SectionHeaderProps) => (
  <div style={{ textAlign: center ? 'center' : 'left', marginBottom: '48px' }}>
    {label && (
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        background: light ? 'rgba(129,192,99,0.15)' : 'rgba(129,192,99,0.10)',
        color: '#81C063', borderRadius: '20px', padding: '5px 16px',
        fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase',
        fontFamily: 'Rajdhani, sans-serif', marginBottom: '14px',
      }}>
        {label}
      </div>
    )}
    <h2 style={{
      fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
      fontSize: 'clamp(24px, 5vw, 40px)', letterSpacing: '3px',
      textTransform: 'uppercase', lineHeight: 1.1,
      color: light ? '#FFFFFF' : '#2F2D2C',
      marginBottom: subtitle ? '12px' : '16px',
    }}>
      {title}
    </h2>
    <div style={{
      width: '48px', height: '3px', background: '#81C063', borderRadius: '2px',
      margin: center ? '0 auto' : '0',
      marginBottom: subtitle ? '16px' : '0',
    }} />
    {subtitle && (
      <p style={{
        fontFamily: 'DM Sans, sans-serif', fontSize: 'clamp(14px, 2.5vw, 17px)',
        color: light ? 'rgba(255,255,255,0.85)' : '#818181',
        lineHeight: 1.7, maxWidth: center ? '560px' : 'none',
        margin: center ? '12px auto 0 auto' : '12px 0 0 0',
      }}>
        {subtitle}
      </p>
    )}
  </div>
);

export default SectionHeader;
