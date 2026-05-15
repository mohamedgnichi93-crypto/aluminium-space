import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Phone, Mail, MessageCircle, MessageSquare, Globe } from 'lucide-react';

const Footer = () => {
  const { t } = useTranslation();

  const quickLinks = [
    { name: t('nav.home'), path: '/' },
    { name: t('nav.products'), path: '/produits' },
    { name: t('nav.contact'), path: '/contact' },
    { name: t('nav.about'), path: '/about' },
  ];

  return (
    <footer
      style={{
        background: '#1D3E61',
        borderTop: '3px solid #81C063',
      }}
    >
      <div className="container mx-auto px-4 pt-16 pb-[24px] md:pb-8">
        <div className="flex flex-col md:grid md:grid-cols-3 gap-8 md:gap-12 mb-12">

          {/* Brand Column */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '22px', letterSpacing: '3px', textTransform: 'uppercase' }}>
                <span style={{ color: '#FFFFFF' }}>ALUMINIUM </span>
                <span style={{ color: '#81C063' }}>SPACE</span>
              </span>
            </div>
            <div style={{ fontSize: '9px', letterSpacing: '3px', color: 'rgba(255,255,255,0.5)', fontWeight: 500, marginBottom: '8px', fontFamily: 'Rajdhani, sans-serif', textTransform: 'uppercase' }}>
              {t('footer.brand_subtitle', 'MENUISERIE ALUMINIUM')}
            </div>
            <p style={{ color: '#81C063', fontSize: '13px', fontStyle: 'italic', marginBottom: '12px', fontFamily: 'DM Sans, sans-serif' }}>
              "{t('footer.motto')}"
            </p>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', lineHeight: 1.7, maxWidth: '340px', marginBottom: '24px', fontFamily: 'DM Sans, sans-serif' }}>
              {t('footer.brand_desc')}
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              {[
                {
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                    </svg>
                  ), color: '#1877F2', url: 'https://www.facebook.com/aluminium.space.tunisie', label: 'Facebook'
                },
                {
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  ), color: '#E4405F', url: 'https://www.instagram.com/aluminium.space', label: 'Instagram'
                },
                {
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                    </svg>
                  ), color: '#FF0000', url: 'https://www.youtube.com/@aluminiumspace', label: 'YouTube'
                },
                {
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                      <rect x="2" y="9" width="4" height="12"></rect>
                      <circle cx="4" cy="4" r="2"></circle>
                    </svg>
                  ), color: '#0A66C2', url: 'https://www.linkedin.com/company/aluminium-space/', label: 'LinkedIn'
                },
                {
                  icon: (
                    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z" />
                    </svg>
                  ), color: '#000000', url: 'https://tiktok.com/@aluminium.space', label: 'TikTok'
                },
                { icon: <MessageCircle className="w-[18px] h-[18px]" />, color: '#0084FF', url: 'https://m.me/aluminium.space.tunisie', label: 'Messenger' },
                { icon: <MessageSquare className="w-[18px] h-[18px]" />, color: '#25D366', url: 'https://wa.me/21657099070', label: 'WhatsApp' }
              ].map((social, idx) => (
                <Fragment key={social.label}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-social-icon flex items-center justify-center transition-all duration-300"
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: 'rgba(255,255,255,0.85)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = social.color;
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                    }}
                    aria-label={social.label}
                  >
                    {social.icon}
                  </a>
                  {idx === 3 && <div className="w-full md:hidden" />}
                </Fragment>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '16px', letterSpacing: '2px', color: 'white', marginBottom: '8px', textTransform: 'uppercase' }}>
              {t('footer.quick_links')}
            </h3>
            <div style={{ width: '30px', height: '2px', background: '#81C063', marginBottom: '20px', borderRadius: '1px' }} />
            <ul className="grid grid-cols-2 gap-y-3 md:block md:space-y-3">
              {quickLinks.map(link => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="flex items-center gap-2 text-sm transition-all duration-200"
                    style={{ color: 'rgba(255,255,255,0.85)', paddingLeft: '0', fontFamily: 'DM Sans, sans-serif' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#81C063'; e.currentTarget.style.paddingLeft = '4px'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; e.currentTarget.style.paddingLeft = '0'; }}
                  >
                    <span style={{ color: '#81C063' }}>›</span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>

          </div>

          {/* Contact Info */}
          <div>
            <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '16px', letterSpacing: '2px', color: 'white', marginBottom: '8px', textTransform: 'uppercase' }}>
              {t('nav.contact')}
            </h3>
            <div style={{ width: '30px', height: '2px', background: '#81C063', marginBottom: '20px', borderRadius: '1px' }} />
            <ul className="space-y-4">
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'rgba(255,255,255,0.85)', fontSize: '14px' }}>
                <MapPin size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#81C063' }} />
                <div style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  {t('footer.address')} -{' '}
                  <a
                    href="https://maps.google.com/?q=125+lot+Laaroussi+Mghira+Ben+Arous+Tunisie"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors"
                    style={{ color: '#81C063' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#81C063'}
                  >
                    {t('footer.see_maps')}
                  </a>
                </div>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px' }}>
                <Phone size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#81C063' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontFamily: 'DM Sans, sans-serif' }}>
                  <a href="tel:+21653186611" className="transition-colors" style={{ color: 'rgba(255,255,255,0.85)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'white'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.85)'}>(+216) 53 186 611</a>
                  <a href="tel:+21657099070" className="transition-colors" style={{ color: 'rgba(255,255,255,0.85)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'white'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.85)'}>(+216) 57 099 070</a>
                </div>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px' }}>
                <svg width="16" height="16" style={{ flexShrink: 0, marginTop: '2px' }} viewBox="0 0 24 24" fill="none" stroke="#81C063" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                <div style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  <a href="https://wa.me/21657099070" target="_blank" rel="noopener noreferrer" className="transition-colors" style={{ color: 'rgba(255,255,255,0.85)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'white'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.85)'}>WhatsApp: +216 57 099 070</a>
                </div>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px' }}>
                <Mail size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#81C063' }} />
                <div style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  <a href="mailto:contact@aluminiumspace.com" className="transition-colors" style={{ color: 'rgba(255,255,255,0.85)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'white'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.85)'}>contact@aluminiumspace.com</a>
                </div>
              </li>
              <li>
                <a
                  href="https://aluminiumspace.pro/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#81C063'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.75)'}
                >
                  <Globe size={16} style={{ color: '#81C063', flexShrink: 0 }} />
                  aluminiumspace.pro
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className="flex flex-col md:flex-row items-center justify-between gap-2 text-center md:text-left"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(0,0,0,0.15)',
            padding: '14px 24px',
            margin: '0',
            borderRadius: '0 0 12px 12px'
          }}
        >
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}>{t('footer.copyright')}</p>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}>{t('footer.powered_by')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
