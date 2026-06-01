import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, Globe, MessageCircle, MessageSquare, User, Download, Home, LayoutGrid, Info, Phone, ChevronRight, Check, Loader, Smartphone, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWAInstall } from '../../hooks/usePWAInstall';

const languages = [
  { code: 'tn', label: 'تونسي', dir: 'rtl', flag: 'https://flagcdn.com/16x12/tn.png' },
  { code: 'ar', label: 'العربية', dir: 'rtl', flag: 'https://flagcdn.com/16x12/sa.png' },
  { code: 'fr', label: 'Français', dir: 'ltr', flag: 'https://flagcdn.com/16x12/fr.png' },
  { code: 'en', label: 'English', dir: 'ltr', flag: 'https://flagcdn.com/16x12/gb.png' },
  { code: 'it', label: 'Italiano', dir: 'ltr', flag: 'https://flagcdn.com/16x12/it.png' },
];

interface LangDropdownContentProps {
  isRTL: boolean;
  currentLanguage: string;
  changeLanguage: (lng: string) => void;
}

const LangDropdownContent: React.FC<LangDropdownContentProps> = ({ isRTL, currentLanguage, changeLanguage }) => (
  <motion.div
    initial={{ opacity: 0, y: 8, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 8, scale: 0.95 }}
    transition={{ duration: 0.14 }}
    className="bg-white rounded-xl shadow-xl overflow-hidden"
    style={{ border: '1px solid #DBDADA', minWidth: '150px' }}
  >
    {languages.map((lang) => (
      <button
        key={lang.code}
        onClick={() => changeLanguage(lang.code)}
        className={`w-full ${isRTL ? 'text-end' : 'text-start'} px-4 py-3 text-sm transition-colors duration-150`}
        style={{
          fontFamily: 'DM Sans, sans-serif',
          color: currentLanguage === lang.code ? '#81C063' : '#2F2D2C',
          background: currentLanguage === lang.code ? '#F5F7FA' : 'transparent',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#F5F7FA'; }}
        onMouseLeave={e => { e.currentTarget.style.background = currentLanguage === lang.code ? '#F5F7FA' : 'transparent'; }}
      >
        <span style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: '8px' }}>
          <img src={lang.flag} alt={lang.code} style={{ width: '16px', height: '12px', borderRadius: '2px' }} />
          {lang.label}
        </span>
      </button>
    ))}
  </motion.div>
);

const Header = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ['ar', 'tn'].includes(i18n.language);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const location = useLocation();
  const { canInstall, isInstalled, isInstalling, isIOS, install } = usePWAInstall();
  const [showSuccess, setShowSuccess] = useState(false);
  const [initialInstallState] = useState(isInstalled);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isInstalled && !initialInstallState) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isInstalled, initialInstallState]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (langRef.current && !langRef.current.contains(target) && !target.closest('.mobile-lang-container')) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setMobileMenuOpen(false); }, [location]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('menu-open');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('menu-open');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('menu-open');
    };
  }, [mobileMenuOpen]);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('app_language', lng);
    setLangMenuOpen(false);
  };

  const navLinks = [
    { name: t('nav.home'), path: '/' },
    { name: t('nav.products'), path: '/produits' },
    { name: t('nav.about'), path: '/about' },
    { name: t('nav.contact'), path: '/contact' },
  ];

  const currentLang = languages.find(l => l.code === i18n.language);
  const currentFlagUrl = currentLang?.flag || 'https://flagcdn.com/16x12/fr.png';

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        height: '68px',
        background: '#FFFFFF',
        boxShadow: isScrolled ? '0 2px 16px rgba(29,62,97,0.10)' : '0 1px 6px rgba(29,62,97,0.04)',
        borderBottom: '1px solid #DBDADA',
      }}
    >
      <style>{`
        @media (max-width: 767px) {
          .lang-dropdown-safe { position: fixed !important; right: 8px !important; left: auto !important; transform: none !important; top: 68px !important; min-width: 160px !important; z-index: 9999 !important; }
        }
        @media (min-width: 768px) {
          .lang-dropdown-safe { position: absolute !important; inset-inline-end: 0 !important; inset-inline-start: auto !important; margin-top: 10px; min-width: 150px; z-index: 50; }
        }
      `}</style>

      <div className="container mx-auto px-4 h-full flex items-center justify-between gap-4 relative" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>

        {/* Logo */}
        <a href="https://aluminiumspace.pro/" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: '10px', textDecoration: 'none', flexShrink: 0 }} className="group">
          <img src="/logo-aluminium-space.png" alt="ALU SPACE Logo"
            className="no-rtl-flip"
            style={{ height: '58px', width: 'auto', objectFit: 'contain', transform: 'none', display: 'block' }}
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
          <div className="hidden sm:block">
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '19px', color: '#2F2D2C', letterSpacing: '3px', textTransform: 'uppercase' }}>
              ALUMINIUM <span style={{ color: '#1D3E61' }}>SPACE</span>
            </div>
            <div style={{ fontSize: '11px', color: '#4a4a4a', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'Rajdhani, sans-serif', display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', width: '100%', gap: '4px' }}>
              <img src="https://flagcdn.com/16x12/tn.png" alt="Tunisia" style={{ width: '16px', height: '12px' }} />
              <span style={{ flex: 1, letterSpacing: '0.18em' }}>MENUISERIE ALUMINIUM</span>
              <img src="https://flagcdn.com/16x12/it.png" alt="Italy" style={{ width: '16px', height: '12px' }} />
            </div>
          </div>
        </a>

        {/* Desktop: Nav + Actions (center, flex-1) */}
        <div className="hidden md:flex items-center flex-1 justify-center gap-1" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          {/* Nav links */}
          <nav className="flex items-center gap-1" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            {navLinks.map(link => {
              const active = link.path === '/' ? location.pathname === '/' : location.pathname.startsWith(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className="relative px-4 py-2 transition-colors duration-200"
                  style={{
                    fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '14px',
                    letterSpacing: '1.5px', textTransform: 'uppercase',
                    color: active ? '#81C063' : '#2F2D2C',
                    textDecoration: 'none', borderRadius: '8px',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#81C063'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#2F2D2C'; }}
                >
                  {link.name}
                  {active && (
                    <motion.div layoutId="nav-indicator"
                      className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                      style={{ background: '#81C063' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Separator */}
          <div style={{ width: '1px', height: '20px', background: '#DBDADA', margin: '0 4px', flexShrink: 0 }} />

          {/* Action buttons */}
          <div className="flex items-center gap-2" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            <Link
              to="/mon-espace"
              title={t('nav.my_space')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '34px', height: '34px', borderRadius: '8px',
                background: location.pathname === '/mon-espace' ? 'rgba(29,62,97,0.08)' : 'transparent',
                color: location.pathname === '/mon-espace' ? '#1D3E61' : '#2F2D2C',
                textDecoration: 'none', transition: 'all 0.2s',
                border: location.pathname === '/mon-espace' ? '1px solid rgba(29,62,97,0.2)' : '1px solid transparent',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(29,62,97,0.06)'; e.currentTarget.style.color = '#1D3E61'; }}
              onMouseLeave={e => {
                e.currentTarget.style.background = location.pathname === '/mon-espace' ? 'rgba(29,62,97,0.08)' : 'transparent';
                e.currentTarget.style.color = location.pathname === '/mon-espace' ? '#1D3E61' : '#2F2D2C';
              }}
            >
              <User size={17} />
            </Link>

            {/* PWA Install Button */}
            {isInstalled ? (
              showSuccess ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#27AE60', color: 'white', borderRadius: '8px', padding: '6px 12px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  <Check size={14} />
                  {t('header.installed', 'Installée ✓')}
                </div>
              ) : null
            ) : (!canInstall && !isIOS ? null : (
              <button
                onClick={canInstall ? install : () => setShowInstallModal(true)}
                disabled={isInstalling}
                title={t('header.install_app', "Installer l'application")}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'white', color: '#81C063',
                  border: '1.5px solid #81C063',
                  borderRadius: '8px', padding: '6px 12px',
                  fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
                  fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase',
                  cursor: isInstalling ? 'wait' : 'pointer', transition: 'all 0.2s',
                  opacity: isInstalling ? 0.7 : 1
                }}
                onMouseEnter={e => { if(!isInstalling) { e.currentTarget.style.background = '#F0FDF4'; } }}
                onMouseLeave={e => { if(!isInstalling) { e.currentTarget.style.background = 'white'; } }}
              >
                {isInstalling ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ display: 'flex' }}>
                    <Loader size={13} />
                  </motion.div>
                ) : isIOS ? (
                  <span>📲</span>
                ) : (
                  <Download size={13} />
                )}
                {isInstalling ? 'Installation...' : t('header.install', 'Installer')}
              </button>
            ))}

            {/* Language */}
            <div className="relative" ref={langRef} style={{ [isRTL ? 'borderRight' : 'borderLeft']: '1px solid #DBDADA', [isRTL ? 'paddingRight' : 'paddingLeft']: '10px' }}>
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1.5 text-sm transition-colors duration-200"
                style={{ color: '#2F2D2C', fontFamily: 'DM Sans, sans-serif', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: '6px' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#81C063'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#2F2D2C'; }}
              >
                <Globe className="w-4 h-4" />
                <img src={currentFlagUrl} alt={i18n.language} style={{ width: '16px', height: '12px', borderRadius: '2px' }} />
              </button>
              <AnimatePresence>
                {langMenuOpen && <div className="lang-dropdown-safe"><LangDropdownContent isRTL={isRTL} currentLanguage={i18n.language} changeLanguage={changeLanguage} /></div>}
              </AnimatePresence>
            </div>

            {/* Devis CTA */}
          </div>
        </div>

        {/* Grifo Flex logo — far right (desktop only) */}
        <a
          href="https://www.grifoflex.com" target="_blank" rel="noopener noreferrer"
          className="hidden md:flex items-center flex-shrink-0"
          style={{ textDecoration: 'none', paddingLeft: '12px', borderLeft: '1px solid #DBDADA' }}
          title="Grifo Flex Tunisie — Partenaire officiel"
        >
          <img
            src="/images/grifo-flex-logo.png"
            alt="Grifo Flex Tunisie"
            className="no-rtl-flip"
            style={{ height: '44px', width: 'auto', maxWidth: '200px', objectFit: 'contain', transform: 'none', display: 'block' }}
          />
        </a>

        {/* Mobile: right icons */}
        <div className="flex md:hidden items-center gap-2 absolute left-1/2 -translate-x-1/2">
          <div className="relative mobile-lang-container">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center"
              style={{ color: '#2F2D2C', border: '1.5px solid #1e3a5f', borderRadius: '10px', padding: '7px 10px', background: 'transparent', boxShadow: '0 1px 4px rgba(30, 58, 95, 0.15)' }}
              aria-label={t('header.change_lang', 'Changer la langue')}
            >
              <Globe className="w-5 h-5" />
            </button>
            <AnimatePresence>
              {langMenuOpen && <div className="lang-dropdown-safe"><LangDropdownContent isRTL={isRTL} currentLanguage={i18n.language} changeLanguage={changeLanguage} /></div>}
            </AnimatePresence>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center"
            style={{ color: '#2F2D2C', border: '1.5px solid #1e3a5f', borderRadius: '10px', padding: '7px 10px', background: 'transparent', boxShadow: '0 1px 4px rgba(30, 58, 95, 0.15)' }}
            aria-label={mobileMenuOpen ? t('common.close', 'Fermer') : t('header.menu', 'Menu')}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-6 h-6" />}
          </button>



        </div>

        {/* Small Grifo Flex logo — mobile header far right */}
        <a
          href="https://www.grifoflex.com" target="_blank" rel="noopener noreferrer"
          className="flex md:hidden items-center"
          style={{ [isRTL ? 'paddingRight' : 'paddingLeft']: '4px', [isRTL ? 'borderRight' : 'borderLeft']: '1px solid #DBDADA', [isRTL ? 'marginRight' : 'marginLeft']: '2px', flexShrink: 0, overflow: 'visible' }}
          title="Grifo Flex"
        >
          <picture style={{ display: 'flex', flexShrink: 0 }}>
            <source srcSet="/grifo-icon.webp" type="image/webp" />
            <img
              src="/grifo-icon.png"
              alt="Grifo Flex"
              style={{
                height: '38px',
                width: '38px',
                objectFit: 'contain',
                flexShrink: 0,
                borderRadius: '6px'
              }}
            />
          </picture>
        </a>
      </div>

      {/* PWA Install Guide Modal */}
      <AnimatePresence>
        {showInstallModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.55)' }}
            onClick={() => setShowInstallModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ duration: 0.18 }}
              style={{ position: 'relative', background: 'white', borderRadius: '20px', padding: '28px 28px 24px', maxWidth: '360px', width: 'calc(100% - 32px)', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowInstallModal(false)}
                style={{ position: 'absolute', top: '16px', right: '16px', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', cursor: 'pointer', transition: 'background 0.2s' }}
              >
                <X size={16} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <Download size={20} color="#1D3E61" />
                <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '17px', color: '#1D3E61', letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0, paddingRight: '24px' }}>
                  {t('header.install_app', "Installer l'application")}
                </h3>
              </div>

              {isIOS && (
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '13px', color: '#2F2D2C', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>
                    {t('header.pwa_safari_title', 'Safari (iPhone / iPad)')}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#4B5563', textAlign: isRTL ? 'right' : 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ flexShrink: 0, width: '24px', height: '24px', borderRadius: '50%', background: '#F0F6FF', color: '#1A5DA8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>1</span>
                      <span>{t('header.pwa_safari_step1', 'Appuyez sur le bouton Partager 📤 en bas')}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ flexShrink: 0, width: '24px', height: '24px', borderRadius: '50%', background: '#F0F6FF', color: '#1A5DA8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>2</span>
                      <span>{t('header.pwa_safari_step2', 'Faites défiler → "Sur l\'écran d\'accueil"')}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ flexShrink: 0, width: '24px', height: '24px', borderRadius: '50%', background: '#E2FBE8', color: '#27AE60', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>3</span>
                      <span>{t('header.pwa_safari_step3', 'Appuyez sur "Ajouter"')} ✅</span>
                    </div>
                  </div>
                </div>
              )}

              {!isIOS && (
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '13px', color: '#2F2D2C', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>
                    {t('header.pwa_chrome_title', 'Chrome / Edge')}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#4B5563', textAlign: isRTL ? 'right' : 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ flexShrink: 0, width: '24px', height: '24px', borderRadius: '50%', background: '#F0F6FF', color: '#1A5DA8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>1</span>
                      <span>{t('header.pwa_chrome_step1', 'Cliquez le menu ⋮ (en haut à droite)')}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ flexShrink: 0, width: '24px', height: '24px', borderRadius: '50%', background: '#F0F6FF', color: '#1A5DA8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>2</span>
                      <span>{t('header.pwa_chrome_step2', 'Cliquez "Installer Aluminium Space..."')}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ flexShrink: 0, width: '24px', height: '24px', borderRadius: '50%', background: '#E2FBE8', color: '#27AE60', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>3</span>
                      <span>{t('header.pwa_chrome_step3', 'Cliquez sur "Installer"')} ✅</span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowInstallModal(false)}
                style={{ width: '100%', background: '#1D3E61', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '14px', letterSpacing: '1.5px', textTransform: 'uppercase', cursor: 'pointer' }}
              >
                {t('common.close', 'Fermer')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Slide-in Panel */}
            <motion.div
              initial={{ y: '-100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '-100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed top-0 left-0 right-0 z-50 flex flex-col"
              style={{ width: '100%', maxWidth: '100%', background: '#0A1628' }}
            >
              {/* Panel Header */}
              <div style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '2px solid #81C063' }}>
                <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                  <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, fontSize: '16px', color: '#FFFFFF', letterSpacing: '3px', textTransform: 'uppercase' }}>
                    ALUMINIUM <span style={{ color: '#81C063' }}>SPACE</span>
                  </div>
                  <div style={{ fontSize: '16px', letterSpacing: '3px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, marginTop: '2px', textTransform: 'uppercase' }}>
                    <span style={{ color: '#FFFFFF' }}>× GRIFO </span>
                    <span style={{ color: '#81C063' }}>FLEX</span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#FFFFFF', cursor: 'pointer' }}
                  aria-label={t('common.close', 'Fermer')}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {/* Nav Links */}
                <nav style={{ padding: '8px 0' }}>
                  {navLinks.map((link) => {
                    const active = link.path === '/' ? location.pathname === '/' : location.pathname.startsWith(link.path);
                    const iconMap: Record<string, React.ReactNode> = {
                      '/': <Home size={16} />,
                      '/produits': <LayoutGrid size={16} />,
                      '/about': <Info size={16} />,
                      '/contact': <Phone size={16} />,
                    };
                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setMobileMenuOpen(false)}
                        style={{
                          display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: '12px', padding: '16px 24px',
                          fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '2px',
                          textTransform: 'uppercase', fontSize: '16px',
                          color: active ? '#81C063' : '#FFFFFF',
                          background: active ? 'rgba(129,192,99,0.08)' : 'transparent',
                          borderBottom: '1px solid rgba(255,255,255,0.08)',
                          [isRTL ? 'borderRight' : 'borderLeft']: active ? '3px solid #81C063' : '3px solid transparent',
                          textDecoration: 'none', transition: 'background 0.15s',
                          textAlign: isRTL ? 'right' : 'left',
                        }}
                      >
                        <span style={{ opacity: active ? 1 : 0.6, display: 'flex', transform: isRTL ? 'scaleX(-1)' : 'none' }}>{iconMap[link.path]}</span>
                        <span style={{ flex: 1 }}>{link.name}</span>
                        <ChevronRight size={14} style={{ opacity: 0.4, transform: isRTL ? 'rotate(180deg)' : 'none' }} />
                      </Link>
                    );
                  })}
                </nav>

                <div style={{ padding: '0 20px', marginTop: '8px' }}>
                  <Link
                    to="/mon-espace"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: '10px', padding: '14px 20px',
                      borderRadius: '10px', border: '1px solid rgba(255,255,255,0.3)',
                      color: '#FFFFFF', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
                      fontSize: '15px', letterSpacing: '1.5px', textTransform: 'uppercase',
                      textDecoration: 'none', background: 'transparent', transition: 'background 0.15s',
                    }}
                  >
                    <User size={17} />
                    {t('nav.my_space')}
                  </Link>
                </div>

                {/* Mobile PWA Install Card */}
                {!isInstalled && (canInstall || isIOS) && (
                  <div style={{ padding: '0 20px', marginTop: '20px' }}>
                    <button
                      onClick={() => { setMobileMenuOpen(false); if (canInstall) install(); else setShowInstallModal(true); }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: 'linear-gradient(135deg, rgba(129,192,99,0.15), rgba(129,192,99,0.05))',
                        border: '1px solid rgba(129,192,99,0.3)', borderRadius: '12px', padding: '16px',
                        cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ background: 'rgba(129,192,99,0.2)', borderRadius: '10px', padding: '10px', color: '#81C063' }}>
                          {isIOS ? <Smartphone size={24} /> : <Download size={24} />}
                        </div>
                        <div>
                          <div style={{ color: 'white', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '15px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                            {t('header.install_app', "Installer l'application")}
                          </div>
                          <div style={{ color: '#94A3B8', fontFamily: 'DM Sans, sans-serif', fontSize: '12px', marginTop: '2px' }}>
                            {t('header.install_subtitle', 'Accès rapide depuis votre écran')}
                          </div>
                        </div>
                      </div>
                      <ArrowRight size={18} color="#81C063" />
                    </button>
                  </div>
                )}

                {/* Contact Buttons */}
                <div style={{ padding: '0 20px', marginTop: '20px' }}>
                  <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#94A3B8', marginBottom: '12px', textAlign: isRTL ? 'right' : 'left' }}>
                    {t('header.contact_us_upper', 'NOUS CONTACTER')}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <a
                      href="https://wa.me/21657099070" target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#25D366', color: 'white', borderRadius: '10px', height: '48px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '14px', letterSpacing: '1.5px', textTransform: 'uppercase', textDecoration: 'none' }}
                    >
                      <MessageSquare size={16} />
                      WhatsApp
                    </a>
                    <a
                      href="https://m.me/aluminium.space.tunisie" target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#0084FF', color: 'white', borderRadius: '10px', height: '48px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '14px', letterSpacing: '1.5px', textTransform: 'uppercase', textDecoration: 'none' }}
                    >
                      <MessageCircle size={16} />
                      Messenger
                    </a>
                  </div>
                </div>
              </div>

              {/* Panel Footer */}
              <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: '#94A3B8', marginBottom: '6px' }}>
                  © 2026 Aluminium Space × Grifo Flex
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  <img src="https://flagcdn.com/16x12/tn.png" alt="Tunisia" style={{ width: '16px', height: '12px' }} />
                  <img src="https://flagcdn.com/16x12/it.png" alt="Italy" style={{ width: '16px', height: '12px' }} />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
