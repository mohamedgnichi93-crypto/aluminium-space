import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Search, Download, Phone, ChevronRight, Package, Clock, CheckCircle, Wrench, Calendar, Star, XCircle, Copy, Check, User, ShoppingBag, MessageCircle } from 'lucide-react';
import { getOrderById } from '../store/ordersStore';
import { generatePDF } from '../utils/pdfGenerator';
import type { Order } from '../store/ordersStore';
import PageSEO from '../components/ui/PageSEO';


type LangKey = 'fr' | 'ar' | 'tn' | 'en' | 'it';

const STATUS_STEPS = [
  {
    key: 'pending',
    label: { fr: 'En attente', ar: 'في الانتظار', tn: 'في الانتظار', en: 'Pending', it: 'In attesa' },
    desc: { fr: 'Commande reçue, en attente de confirmation', ar: 'تم استلام الطلب، في انتظار التأكيد', tn: 'الطلبية وصلت، تستنى التأكيد', en: 'Order received, awaiting confirmation', it: 'Ordine ricevuto, in attesa di conferma' },
    icon: Clock,
    color: '#F59E0B',
  },
  {
    key: 'confirmed',
    label: { fr: 'Validation', ar: 'المصادقة', tn: 'المصادقة', en: 'Validation', it: 'Validazione' },
    desc: { fr: 'Commande confirmée et planifiée', ar: 'تم تأكيد الطلب وجدولته', tn: 'الطلبية تأكدت وتجدولت', en: 'Order confirmed and scheduled', it: 'Ordine confermato e pianificato' },
    icon: CheckCircle,
    color: '#1A5DA8',
  },
  {
    key: 'en_fabrication',
    label: { fr: 'En fabrication', ar: 'قيد التصنيع', tn: 'في الصنع', en: 'In production', it: 'In produzione' },
    desc: { fr: 'Votre moustiquaire est en cours de fabrication', ar: 'ناموسيتك قيد التصنيع الآن', tn: 'الموستيكار متاعك في الصنع', en: 'Your mosquito net is being manufactured', it: 'La tua zanzariera è in produzione' },
    icon: Wrench,
    color: '#8B5CF6',
  },
  {
    key: 'pret',
    label: { fr: 'Prêt', ar: 'جاهز', tn: 'جاهز', en: 'Ready', it: 'Pronto' },
    desc: { fr: 'Votre commande est prête, installation à planifier', ar: 'طلبك جاهز، التركيب سيُجدد', tn: 'الطلبية جاهزة، التركيب باش يتجدول', en: 'Your order is ready, installation to schedule', it: 'Il tuo ordine è pronto, installazione da pianificare' },
    icon: Package,
    color: '#81C063',
  },
  {
    key: 'installe',
    label: { fr: 'Installation prévue', ar: 'التركيب مجدول', tn: 'التركيب مجدول', en: 'Installation scheduled', it: 'Installazione prevista' },
    desc: { fr: "L'équipe viendra installer votre commande", ar: 'سيأتي الفريق لتركيب طلبك', tn: 'الفريق جاي يركب الطلبية متاعك', en: 'The team will come to install your order', it: 'Il team verrà a installare il tuo ordine' },
    icon: Calendar,
    color: '#1A5DA8',
  },
  {
    key: 'livree',
    label: { fr: 'Terminé ✓', ar: 'مكتمل ✓', tn: 'مكتمل ✓', en: 'Completed ✓', it: 'Completato ✓' },
    desc: { fr: 'Installation terminée avec succès !', ar: '!تم التركيب بنجاح', tn: 'التركيب كمل بنجاح!', en: 'Installation successfully completed!', it: 'Installazione completata con successo!' },
    icon: Star,
    color: '#27AE60',
  },
];

const content = {
  title: { fr: 'Mon Espace Client', ar: 'مساحتي الشخصية', tn: 'فضائي الشخصي', en: 'My Client Space', it: 'Il Mio Spazio' },
  subtitle: { fr: 'Suivez l\'état de votre commande en temps réel', ar: 'تابع حالة طلبك في الوقت الفعلي', tn: 'تابع حالة طلبيتك مباشرة', en: 'Track your order status in real time', it: 'Segui lo stato del tuo ordine in tempo reale' },
  placeholder: { fr: 'Entrez votre code de suivi (ex: A1B2C3D4E)', ar: 'أدخل رمز التتبع الخاص بك', tn: 'دخل كود التتبع متاعك', en: 'Enter your tracking code (e.g: A1B2C3D4E)', it: 'Inserisci il tuo codice di tracciamento' },
  search_btn: { fr: 'Rechercher', ar: 'بحث', tn: 'ابحث', en: 'Search', it: 'Cerca' },
  not_found: { fr: 'Aucune commande trouvée avec ce code. Vérifiez et réessayez.', ar: 'لم يتم العثور على طلب بهذا الرمز. تحقق وأعد المحاولة.', tn: 'ما لقيناش طلبية بالكود هذا. عاود الكشف.', en: 'No order found with this code. Please check and retry.', it: 'Nessun ordine trovato con questo codice. Controlla e riprova.' },
  order_ref: { fr: 'Référence', ar: 'المرجع', tn: 'المرجع', en: 'Reference', it: 'Riferimento' },
  order_date: { fr: 'Date', ar: 'التاريخ', tn: 'التاريخ', en: 'Date', it: 'Data' },
  order_status: { fr: 'Statut', ar: 'الحالة', tn: 'الحالة', en: 'Status', it: 'Stato' },
  order_progress: { fr: 'Avancement de votre commande', ar: 'تقدم طلبك', tn: 'تقدم طلبيتك', en: 'Order progress', it: 'Avanzamento ordine' },
  client_info: { fr: 'Informations client', ar: 'معلومات العميل', tn: 'معلومات الحريف', en: 'Client information', it: 'Informazioni cliente' },
  order_detail: { fr: 'Détail de la commande', ar: 'تفاصيل الطلب', tn: 'تفاصيل الطلبية', en: 'Order details', it: 'Dettagli ordine' },
  download_pdf: { fr: 'Télécharger le Devis PDF', ar: 'تحميل الفاتورة PDF', tn: 'حمل الفاتورة PDF', en: 'Download PDF Quote', it: 'Scarica PDF Preventivo' },
  contact_us: { fr: 'Nous contacter', ar: 'تواصل معنا', tn: 'كلمنا', en: 'Contact us', it: 'Contattaci' },
  cancelled: { fr: '❌ Cette commande a été annulée.', ar: '❌ تم إلغاء هذا الطلب.', tn: '❌ الطلبية هذي تألغت.', en: '❌ This order has been cancelled.', it: '❌ Questo ordine è stato annullato.' },
  hint: { fr: 'Retrouvez votre code dans la confirmation de commande ou le SMS reçu.', ar: 'ستجد رمزك في تأكيد الطلب أو الرسالة النصية.', tn: 'تلقى الكود متاعك في تأكيد الطلبية.', en: 'Find your code in the order confirmation you received.', it: 'Trova il tuo codice nella conferma dell\'ordine ricevuta.' },
};

const formatDate = (iso: string) => {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
};

const formatDT = (millimes: number) => (millimes / 1000).toFixed(3) + ' DT';

const ClientPortal = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = (i18n.language as LangKey) || 'fr';
  const isRTL = ['ar', 'tn'].includes(i18n.language);
  const loc = (obj: Record<string, string>) => obj[lang] ?? obj.fr;

  const [code, setCode] = useState(searchParams.get('code') || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [searched, setSearched] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSearch = () => {
    if (!code.trim()) return;
    const found = getOrderById(code.trim());
    if (found) {
      setOrder(found);
      setNotFound(false);
    } else {
      setOrder(null);
      setNotFound(true);
    }
    setSearched(true);
  };

  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode) {
      setCode(urlCode);
      const found = getOrderById(urlCode);
      if (found) { setOrder(found); setSearched(true); }
      else { setNotFound(true); setSearched(true); }
    }
  }, []);

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentStepIndex = order ? STATUS_STEPS.findIndex(s => s.key === order.status) : -1;
  const isCancelled = order?.status === 'cancelled';

  return (
    <>
      <PageSEO
        path="/mon-espace"
        titleFr="Mon Espace Client — Suivi de commande | Aluminium Space"
        descFr="Suivez votre commande Aluminium Space en temps réel. Entrez votre code de suivi pour voir l'état de votre moustiquaire."
        titleEn="My Client Space — Order tracking | Aluminium Space"
        descEn="Track your Aluminium Space order in real time. Enter your tracking code to check your mosquito net status."
      />

      {/* Dark hero banner */}
      <div style={{ position: 'relative', background: 'linear-gradient(135deg, #0F2035 0%, #1D3E61 100%)', paddingTop: '80px', paddingBottom: '48px', textAlign: 'center', overflow: 'hidden' }}>
        <motion.div 
          animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
          transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
          style={{
            position: 'absolute', inset: 0, opacity: 0.05,
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }}
        />
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(129,192,99,0.12)', border: '1px solid rgba(129,192,99,0.3)', borderRadius: '20px', padding: '6px 16px', marginBottom: '20px' }}>
            <img 
              src="https://flagcdn.com/w20/tn.png" 
              alt="Tunisie" 
              style={{ width: '20px', height: '14px', objectFit: 'cover', borderRadius: '2px' }} 
            />
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2.5px', color: '#81C063', textTransform: 'uppercase', fontFamily: 'Rajdhani, sans-serif' }}>ALUMINIUM SPACE</span>
          </div>
          <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'clamp(28px,6vw,48px)', color: '#FFFFFF', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 12px' }}>
            {loc(content.title)}
          </h1>
          <div style={{ width: '48px', height: '3px', background: '#81C063', borderRadius: '2px', margin: '0 auto 16px' }} />
          <p style={{ fontFamily: 'DM Sans, sans-serif', color: 'rgba(255,255,255,0.95)', fontSize: '17px', maxWidth: '480px', margin: '0 auto' }}>
            {loc(content.subtitle)}
          </p>
        </motion.div>
      </div>

    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F5F7FA 0%, #E8EDF5 100%)', paddingBottom: '60px' }}>

      <div style={{ maxWidth: '780px', margin: '0 auto', padding: 'clamp(32px,5vw,48px) clamp(16px,4vw,24px) 0' }}>

        {/* Search box */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ background: 'white', borderRadius: '20px', padding: '28px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid #E2E8F0', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
              <Search size={20} color="#9CA3AF" style={{ position: 'absolute', [isRTL ? 'right' : 'left']: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder={loc(content.placeholder)}
                style={{
                  width: '100%', height: '52px', border: '2px solid transparent', borderRadius: '12px',
                  padding: isRTL ? '0 48px 0 16px' : '0 16px 0 48px', fontFamily: 'monospace', fontSize: '16px', color: '#1A5DA8',
                  background: '#F5F7FA', outline: 'none', fontWeight: 700, transition: 'all 0.3s'
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#1A5DA8'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,93,168,0.1)'; e.currentTarget.style.background = '#FFFFFF'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#F5F7FA'; }}
              />
            </div>
            <button
              onClick={handleSearch}
              style={{
                height: '52px', padding: '0 28px', background: 'linear-gradient(135deg, #1D3E61, #1A5DA8)', color: 'white', border: 'none', borderRadius: '12px',
                fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '15px', letterSpacing: '1px', textTransform: 'uppercase',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(26,93,168,0.3)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(26,93,168,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(26,93,168,0.3)'; }}
            >
              <Search size={16} />
              {loc(content.search_btn)}
            </button>
          </div>
          <p style={{ fontSize: '12px', color: '#6B7280', fontFamily: 'DM Sans, sans-serif', marginTop: '12px' }}>
            💡 {loc(content.hint)}
          </p>
        </motion.div>

        {/* Not found message */}
        <AnimatePresence>
          {searched && notFound && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <XCircle size={20} color="#EF4444" />
              <span style={{ color: '#991B1B', fontFamily: 'DM Sans, sans-serif', fontSize: '14px' }}>{loc(content.not_found)}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Order found */}
        <AnimatePresence>
          {order && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

              {/* Cancelled banner */}
              {isCancelled && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px' }}>
                  <span style={{ color: '#991B1B', fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>{loc(content.cancelled)}</span>
                </div>
              )}

              {/* Order header card */}
              <div style={{ position: 'relative', background: 'white', borderRadius: '20px', padding: '28px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid #E2E8F0', borderLeft: '4px solid #1A5DA8', marginBottom: '20px' }}>
                
                {/* Status Badge */}
                {currentStepIndex >= 0 && (
                  <div style={{ position: 'absolute', top: '20px', [isRTL ? 'left' : 'right']: '20px', background: `${STATUS_STEPS[currentStepIndex].color}15`, color: STATUS_STEPS[currentStepIndex].color, padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {loc(STATUS_STEPS[currentStepIndex].label)}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', paddingRight: isRTL ? '0' : '100px', paddingLeft: isRTL ? '100px' : '0' }}>
                  <div>
                    <p style={{ fontSize: '12px', color: '#818181', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>{loc(content.order_ref)}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '15px', fontWeight: 600, letterSpacing: '0.5px', color: '#1A5DA8', wordBreak: 'break-all' }}>#{order.id}</div>
                      <button onClick={() => handleCopy(order.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: copied ? '#27AE60' : '#9CA3AF', transition: 'color 0.2s' }} title="Copier">
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                  <div style={{ textAlign: isRTL ? 'left' : 'right' }}>
                    <p style={{ fontSize: '12px', color: '#818181', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>{loc(content.order_date)}</p>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '15px', fontWeight: 600, color: '#2F2D2C' }}>{formatDate(order.date)}</div>
                  </div>
                </div>

                {/* Status timeline */}
                {!isCancelled && (
                  <>
                    <p style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', color: '#0D1B2A', textTransform: 'uppercase', fontFamily: 'Rajdhani, sans-serif', marginBottom: '20px' }}>
                      {loc(content.order_progress)}
                    </p>
                    <div style={{ position: 'relative' }}>
                      {/* Progress line background */}
                      <div style={{ position: 'absolute', top: '24px', left: '20px', right: '20px', height: '3px', background: '#E2E8F0', borderRadius: '4px' }} />
                      {/* Progress line filled */}
                      <div style={{
                        position: 'absolute', top: '24px', [isRTL ? 'right' : 'left']: '20px', height: '3px', borderRadius: '4px',
                        background: isRTL ? 'linear-gradient(270deg, #1A5DA8, #81C063)' : 'linear-gradient(90deg, #1A5DA8, #81C063)',
                        width: currentStepIndex < 0 ? '0%' : `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%`,
                        transition: 'width 0.8s ease',
                      }} />

                      <div style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', position: 'relative', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '8px' }}>
                        {STATUS_STEPS.map((step, i) => {
                          const isCompleted = i <= currentStepIndex;
                          const isActive = i === currentStepIndex;
                          const Icon = step.icon;
                          return (
                            <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '56px', flex: 1 }}>
                              <div style={{
                                width: isActive ? '48px' : '40px', height: isActive ? '48px' : '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: isCompleted ? step.color : '#F5F7FA',
                                border: isActive ? `3px solid ${step.color}` : isCompleted ? 'none' : '2px solid #E2E8F0',
                                boxShadow: isActive ? `0 0 0 8px ${step.color}33` : 'none',
                                transition: 'all 0.3s',
                                zIndex: 1, position: 'relative',
                              }}>
                                {isCompleted && !isActive ? (
                                  <Check size={18} color="white" />
                                ) : (
                                  <Icon size={isActive ? 22 : 18} color={isCompleted ? 'white' : '#9CA3AF'} />
                                )}
                              </div>
                              <span style={{
                                fontSize: '10px', fontWeight: 700, textAlign: 'center', marginTop: '8px', fontFamily: 'Rajdhani, sans-serif',
                                letterSpacing: '0.5px', textTransform: 'uppercase',
                                color: isCompleted ? step.color : '#6B7280',
                                lineHeight: 1.2,
                              }}>
                                {loc(step.label)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Current status description */}
                    {currentStepIndex >= 0 && (
                      <div style={{ marginTop: '20px', background: `${STATUS_STEPS[currentStepIndex].color}10`, border: `1px solid ${STATUS_STEPS[currentStepIndex].color}30`, borderRadius: '12px', padding: '14px 16px', display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: STATUS_STEPS[currentStepIndex].color, flexShrink: 0, boxShadow: `0 0 0 3px ${STATUS_STEPS[currentStepIndex].color}30` }} />
                        <span style={{ fontSize: '14px', color: '#2F2D2C', fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }}>
                          {loc(STATUS_STEPS[currentStepIndex].desc)}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Client info + items */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                {/* Client info */}
                <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', textAlign: isRTL ? 'right' : 'left', overflow: 'hidden' }}>
                  <div style={{ background: 'linear-gradient(135deg, #1D3E61, #1A5DA8)', color: 'white', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={18} />
                    <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '14px', letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}>{loc(content.client_info)}</h3>
                  </div>
                  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {[
                      { label: '👤', value: order.clientInfo.fullName },
                      { label: '📱', value: order.clientInfo.phone },
                      { label: '📍', value: order.clientInfo.address },
                      ...(order.clientInfo.email ? [{ label: '✉️', value: order.clientInfo.email }] : []),
                      ...(order.clientInfo.notes ? [{ label: '📝', value: order.clientInfo.notes }] : []),
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', gap: '10px', fontSize: '14px', color: '#2F2D2C', fontFamily: 'DM Sans, sans-serif', padding: '8px', borderRadius: '8px', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ flexShrink: 0 }}>{item.label}</span>
                        <span style={{ color: '#4B5563' }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Items */}
                <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', textAlign: isRTL ? 'right' : 'left', overflow: 'hidden' }}>
                  <div style={{ background: 'linear-gradient(135deg, #1D3E61, #1A5DA8)', color: 'white', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShoppingBag size={18} />
                    <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '14px', letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}>{loc(content.order_detail)}</h3>
                  </div>
                  <div style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {order.items.map((item, i) => (
                        <div key={i} style={{ padding: '12px', background: 'linear-gradient(135deg, #F0FDF4, #F5F7FA)', borderRadius: '10px', border: '1px solid #E2E8F0', borderLeft: '4px solid #81C063' }}>
                          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '14px', color: '#1A5DA8', letterSpacing: '0.5px', marginBottom: '4px' }}>
                            {item.productName}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6B7280', fontFamily: 'DM Sans, sans-serif' }}>
                            {item.width} × {item.height} cm — ×{item.quantity}
                            {item.meshType && ` — ${item.meshType}`}
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#27AE60', marginTop: '4px', textAlign: isRTL ? 'left' : 'right' }}>
                            {formatDT(item.totalPrice)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
                      {(() => {
                        const brutHT = order.totalHT + order.remise;
                        const remisePct = brutHT > 0 ? Math.round((order.remise / brutHT) * 100) : 0;
                        
                        return (
                          <>
                            <div style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', fontSize: '12px', color: '#6B7280', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
                              <span>Total brut HT</span><span>{formatDT(brutHT)}</span>
                            </div>
                            
                            {order.remise > 0 && (
                              <div style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', fontSize: '12px', color: '#EF4444', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
                                <span>Remise ({remisePct}%)</span><span>-{formatDT(order.remise)}</span>
                              </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', fontSize: '12px', color: '#6B7280', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
                              <span>Total net HT</span><span>{formatDT(order.totalHT)}</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', fontSize: '12px', color: '#6B7280', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
                              <span>FODEC (1%)</span><span>{formatDT(order.fodec)}</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', fontSize: '12px', color: '#6B7280', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
                              <span>TVA (19%)</span><span>{formatDT(order.tva)}</span>
                            </div>

                            {order.timbre > 0 && (
                              <div style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', fontSize: '12px', color: '#6B7280', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
                                <span>Timbre fiscal</span><span>{formatDT(order.timbre)}</span>
                              </div>
                            )}
                          </>
                        );
                      })()}
                      
                      <div style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, color: 'white', fontFamily: 'Rajdhani, sans-serif', marginTop: '16px', background: 'linear-gradient(135deg, #1D3E61, #1A5DA8)', borderRadius: '12px', padding: '16px 20px' }}>
                        <span>TOTAL TTC</span>
                        <span>{formatDT(order.totalTTC)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', gap: '12px', flexWrap: 'wrap' }}>
                <motion.button
                  onClick={() => generatePDF(order)}
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  style={{ flex: 1, minWidth: '140px', height: '52px', background: 'linear-gradient(135deg, #1D3E61, #1A5DA8)', color: 'white', border: 'none', borderRadius: '12px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'box-shadow 0.2s', boxShadow: '0 4px 16px rgba(26,93,168,0.3)' }}
                >
                  <Download size={18} />
                  {loc(content.download_pdf)}
                </motion.button>
                <a
                  href={`https://wa.me/21657099070?text=${encodeURIComponent(`Bonjour, je veux des informations sur ma commande #${order.id}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ flex: 1, minWidth: '140px', height: '52px', background: '#25D366', color: 'white', border: 'none', borderRadius: '12px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(37,211,102,0.3)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#1EA352'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#25D366'; }}
                >
                  <MessageCircle size={18} />
                  {loc(content.contact_us)}
                </a>
                <button
                  onClick={() => navigate('/produits')}
                  style={{ flex: 1, minWidth: '140px', height: '52px', background: 'transparent', color: '#1A5DA8', border: '2px solid #1A5DA8', borderRadius: '12px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#1A5DA8'; e.currentTarget.style.color = 'white'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#1A5DA8'; }}
                >
                  <ChevronRight size={18} className="no-rtl-flip" style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} />
                  {t('hero.cta_products', 'Voir nos produits')}
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state (before search) */}
        {!searched && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} style={{ textAlign: 'center', padding: '40px 20px', color: '#6B7280' }}>
            <motion.div 
              animate={{ y: [0, -10, 0] }} 
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              style={{ display: 'inline-block', marginBottom: '24px' }}
            >
              <Package size={80} color="#1A5DA8" opacity={0.8} />
            </motion.div>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '16px', color: '#4B5563', marginBottom: '24px' }}>
              {t('portal.empty_hint', 'Entrez votre code pour accéder à votre commande')}
            </p>
            <button
              onClick={() => navigate('/produits')}
              style={{ background: 'white', color: '#1A5DA8', border: '1.5px solid #1A5DA8', borderRadius: '12px', padding: '12px 24px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F0F6FF'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
            >
              {t('hero.cta_products', 'Voir nos produits')}
            </button>
          </motion.div>
        )}
      </div>
    </div>
    </>
  );
};

export default ClientPortal;
