import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Home, Search, Phone } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  type LangKey = 'fr' | 'ar' | 'tn' | 'en' | 'it';
  const lang = (i18n.language as LangKey) || 'fr';

  const content = {
    title: { fr: 'Page introuvable', ar: 'الصفحة غير موجودة', tn: 'الصفحة ما لقيناهاش', en: 'Page not found', it: 'Pagina non trovata' },
    desc: { fr: 'La page que vous cherchez n\'existe pas ou a été déplacée.', ar: 'الصفحة التي تبحث عنها غير موجودة أو تم نقلها.', tn: 'الصفحة اللي تلوج عليها ما موجوداش.', en: 'The page you\'re looking for doesn\'t exist or has been moved.', it: 'La pagina che cerchi non esiste o è stata spostata.' },
    btn_home: { fr: 'Retour à l\'accueil', ar: 'العودة للرئيسية', tn: 'ارجع للرئيسية', en: 'Back to home', it: 'Torna alla home' },
    btn_products: { fr: 'Voir les produits', ar: 'مشاهدة المنتجات', tn: 'شوف المنتوجات', en: 'View products', it: 'Vedi prodotti' },
    btn_contact: { fr: 'Nous contacter', ar: 'تواصل معنا', tn: 'كلمنا', en: 'Contact us', it: 'Contattaci' },
    suggestion: { fr: 'Vous cherchez peut-être...', ar: 'ربما تبحث عن...', tn: 'ربما تلوج على...', en: 'You might be looking for...', it: 'Forse stai cercando...' },
  };

  const loc = (obj: Record<string, string>) => obj[lang] ?? obj.fr;

  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #F5F7FA 0%, #E8EDF5 100%)', padding: '40px 20px' }}>

      {/* Background decoration */}
      <div style={{ position: 'absolute', top: '20%', right: '5%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(129,192,99,0.06)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '20%', left: '5%', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(41,103,136,0.06)', filter: 'blur(60px)', pointerEvents: 'none' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: 'center', maxWidth: '520px', width: '100%', position: 'relative' }}
      >
        {/* 404 number */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          style={{
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: 'clamp(80px, 20vw, 140px)',
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: '8px',
            background: 'linear-gradient(135deg, #1A5DA8, #81C063)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '8px',
            userSelect: 'none',
          }}
        >
          404
        </motion.div>

        {/* Logo strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}
        >
          <div style={{ height: '2px', flex: 1, background: 'linear-gradient(to right, transparent, #DBDADA)' }} />
          <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '3px', color: '#818181', textTransform: 'uppercase' }}>
            ALUMINIUM SPACE
          </span>
          <div style={{ height: '2px', flex: 1, background: 'linear-gradient(to left, transparent, #DBDADA)' }} />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'clamp(20px, 5vw, 28px)', color: '#0D1B2A', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}
        >
          {loc(content.title)}
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{ fontFamily: 'DM Sans, sans-serif', color: '#818181', fontSize: '15px', lineHeight: 1.7, marginBottom: '36px' }}
        >
          {loc(content.desc)}
        </motion.p>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}
        >
          <button
            onClick={() => navigate('/')}
            style={{
              background: '#1A5DA8',
              color: 'white',
              border: 'none',
              padding: '14px 32px',
              borderRadius: '10px',
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 700,
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              maxWidth: '300px',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(26,93,168,0.25)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#0F3F78'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#1A5DA8'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <Home size={16} />
            {loc(content.btn_home)}
          </button>

          <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '300px' }}>
            <button
              onClick={() => navigate('/produits')}
              style={{
                flex: 1,
                background: 'white',
                color: '#1D3E61',
                border: '1.5px solid #1D3E61',
                padding: '12px 16px',
                borderRadius: '10px',
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#F5F7FA'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
            >
              <Search size={14} />
              {loc(content.btn_products)}
            </button>
            <button
              onClick={() => navigate('/contact')}
              style={{
                flex: 1,
                background: 'rgba(129,192,99,0.1)',
                color: '#81C063',
                border: '1.5px solid rgba(129,192,99,0.4)',
                padding: '12px 16px',
                borderRadius: '10px',
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(129,192,99,0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(129,192,99,0.1)'; }}
            >
              <Phone size={14} />
              {loc(content.btn_contact)}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFound;
