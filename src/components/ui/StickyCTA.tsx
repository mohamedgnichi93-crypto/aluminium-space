import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react';

const HIDDEN_PATHS = ['/devis', '/dashboard', '/mon-espace'];

const LABELS: Record<string, string> = {
  fr: 'Devis Gratuit',
  ar: 'طلب مجاني',
  tn: 'دوفيس مجاني',
  en: 'Free Quote',
  it: 'Preventivo Gratuito',
};

const StickyCTA = () => {
  const { i18n } = useTranslation();
  const { pathname } = useLocation();

  if (HIDDEN_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) return null;

  const label = LABELS[i18n.language] ?? LABELS.fr;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 md:hidden z-[9965]"
      style={{
        background: 'rgba(255,255,255,0.97)',
        borderTop: '1px solid #DBDADA',
        padding: '10px 16px 14px',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <Link
          to="/devis"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            background: '#1D3E61', color: 'white', borderRadius: '10px', height: '46px',
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '15px',
            letterSpacing: '1.5px', textTransform: 'uppercase', textDecoration: 'none',
          }}
        >
          <FileText size={16} />
          {label}
        </Link>
      </div>
    </div>
  );
};

export default StickyCTA;
