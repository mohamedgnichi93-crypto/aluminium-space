import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, MessageSquare, Send, CheckCircle, AlertCircle, ArrowRight, Globe } from 'lucide-react';
import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import PageSEO from '../components/ui/PageSEO';

type LangKey = 'fr' | 'ar' | 'tn' | 'en' | 'it';

const Contact = () => {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language as LangKey) || 'fr';
  const isRTL = ['ar', 'tn'].includes(lang);
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const subjectRef = useRef<HTMLSelectElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  const [form, setForm] = useState({ name: '', phone: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const loc = (obj: Record<string, string>) => obj[lang] ?? obj.fr;

  const LABELS: Record<string, Record<string, string>> = {
    name: { fr: 'Nom complet *', ar: 'الاسم الكامل *', tn: 'الاسم الكامل *', en: 'Full name *', it: 'Nome completo *' },
    phone: { fr: 'Téléphone *', ar: 'الهاتف *', tn: 'الهاتف *', en: 'Phone *', it: 'Telefono *' },
    email: { fr: 'Email (optionnel)', ar: 'البريد الإلكتروني', tn: 'البريد الإلكتروني', en: 'Email (optional)', it: 'Email (opzionale)' },
    subject: { fr: 'Sujet', ar: 'الموضوع', tn: 'الموضوع', en: 'Subject', it: 'Oggetto' },
    message: { fr: 'Message *', ar: 'الرسالة *', tn: 'الرسالة *', en: 'Message *', it: 'Messaggio *' },
    send: { fr: 'Envoyer le message', ar: 'إرسال الرسالة', tn: 'ابعث الرسالة', en: 'Send message', it: 'Invia messaggio' },
  };
  const L = (key: string) => LABELS[key]?.[lang] || LABELS[key]?.fr || '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.message) return;
    setStatus('sending');
    try {
      const session_id = "contact_" + Date.now() + "_" + 
        Math.random().toString(36).substr(2,9);
      
      const { error } = await supabase.from('messages').insert({
        session_id,
        client_name: form.name,
        client_phone: form.phone,
        client_email: form.email,
        subject: form.subject,
        sender: 'client',
        content: `[${form.subject || 'Contact'}] ${form.message}`,
        read_by_admin: false,
        read_by_client: true,
      });
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      setStatus('success');
      setForm({ name: '', phone: '', email: '', subject: '', message: '' });
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  const infoItems = [
    {
      icon: MapPin,
      color: '#1D3E61',
      bg: 'rgba(29,62,97,0.08)',
      title: loc({ fr: 'Adresse', ar: 'العنوان', tn: 'العنوان', en: 'Address', it: 'Indirizzo' }),
      lines: ['125 lot Laaroussi, Mghira', 'Tunis, Tunisie'],
      href: 'https://maps.google.com/?q=125+lot+Laaroussi+Mghira+Ben+Arous+Tunisie',
    },
    {
      icon: Phone,
      color: '#81C063',
      bg: 'rgba(129,192,99,0.10)',
      title: loc({ fr: 'Téléphone', ar: 'الهاتف', tn: 'الهاتف', en: 'Phone', it: 'Telefono' }),
      lines: ['(+216) 53 186 611', '(+216) 57 099 070'],
      href: 'tel:+21653186611',
    },
    {
      icon: MessageSquare,
      color: '#25D366',
      bg: 'rgba(37,211,102,0.08)',
      title: 'WhatsApp',
      lines: ['+216 57 099 070'],
      href: 'https://wa.me/21657099070',
    },
    {
      icon: Mail,
      color: '#F59E0B',
      bg: 'rgba(245,158,11,0.08)',
      title: 'Email',
      lines: ['contact@aluminiumspace.com'],
      href: 'mailto:contact@aluminiumspace.com',
    },
    {
      icon: Globe,
      color: '#81C063',
      bg: 'rgba(129,192,99,0.10)',
      title: loc({ fr: 'Site Web', ar: 'الموقع الإلكتروني', tn: 'الموقع', en: 'Website', it: 'Sito Web' }),
      lines: ['aluminiumspace.pro'],
      href: 'https://aluminiumspace.pro/',
    },
    {
      icon: Clock,
      color: '#8B5CF6',
      bg: 'rgba(139,92,246,0.08)',
      title: loc({ fr: 'Horaires', ar: 'أوقات العمل', tn: 'أوقات العمل', en: 'Hours', it: 'Orari' }),
      lines: [
        loc({ fr: 'Lun–Ven : 8h00–17h00', ar: 'الإثنين–الجمعة: 08:00–17:00', tn: 'الاثنين–الجمعة: 08:00–17:00', en: 'Mon–Fri: 8:00–17:00', it: 'Lun–Ven: 08:00–17:00' }),
        loc({ fr: 'Samedi : 8h00–12h00', ar: 'السبت: 08:00–12:00', tn: 'السبت: 08:00–12:00', en: 'Sat: 8:00–12:00', it: 'Sab: 08:00–12:00' }),
      ],
      href: '#',
    },
  ];

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px', minHeight: '52px', borderRadius: '10px',
    border: '1.5px solid #E8EDF5', fontFamily: 'DM Sans, sans-serif',
    fontSize: '14px', color: '#2F2D2C', background: '#FAFBFD',
    outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
    direction: isRTL ? 'rtl' : 'ltr', boxSizing: 'border-box',
  };

  return (
    <div style={{ background: '#F5F7FA', minHeight: '100vh' }}>
      <PageSEO
        path="/contact"
        titleFr="Contact — Aluminium Space Mghira, Tunis"
        titleAr="تواصل معنا — Aluminium Space مغيرة، تونس"
        titleEn="Contact — Aluminium Space Mghira, Tunis"
        descFr="Contactez Aluminium Space à Mghira, Tunis. Devis gratuit ou WhatsApp au +216 57 099 070."
        descAr="تواصل مع Aluminium Space في مغيرة، تونس. دوفيس مجاني أو عبر واتساب +216 57 099 070."
        descEn="Contact Aluminium Space in Mghira, Tunis. Free quote or WhatsApp +216 57 099 070."
      />

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(135deg, #1D3E61 0%, #0F2444 100%)', padding: 'clamp(56px, 10vw, 96px) 0 clamp(48px, 8vw, 80px)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(ellipse at center, rgba(129,192,99,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-15%', left: '-8%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(ellipse at center, rgba(41,103,136,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'clamp(32px, 7vw, 60px)', color: '#FFFFFF', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '16px', lineHeight: 1.05 }}>
              {loc({ fr: 'Contactez-Nous', ar: 'تواصلوا معنا', tn: 'تواصلوا معنا', en: 'Contact Us', it: 'Contattateci' })}
            </h1>
            <div style={{ width: '52px', height: '3px', background: '#81C063', borderRadius: '2px', margin: '0 auto 20px' }} />
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 'clamp(14px, 2.5vw, 17px)', color: 'rgba(255,255,255,0.85)', lineHeight: 1.75, maxWidth: '520px', margin: '0 auto 32px' }}>
              {loc({ fr: 'Une question, un devis ou besoin d\'infos ? Notre équipe vous répond rapidement.', ar: 'سؤال، عرض سعر أو تحتاج معلومات؟ فريقنا يرد عليكم بسرعة.', tn: 'سؤال، دوفيس أو محتاج معلومات؟ الفريق يرد عليكم بسرعة.', en: 'A question, quote or need info? Our team replies quickly.', it: 'Una domanda, un preventivo o info? Il nostro team risponde rapidamente.' })}
            </p>
            <div className="flex flex-col sm:flex-row" style={{ gap: '12px', justifyContent: 'center' }}>
              <a
                href="tel:+21657099070"
                className="w-full sm:w-auto flex justify-center"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#81C063', color: 'white', borderRadius: '10px', padding: '12px 24px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '14px', letterSpacing: '1.5px', textTransform: 'uppercase', textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(129,192,99,0.3)' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#5e9a43'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#81C063'; e.currentTarget.style.transform = 'none'; }}
              >
                <Phone size={15} />
                (+216) 57 099 070
              </a>
              <a
                href="https://wa.me/21657099070"
                target="_blank" rel="noopener noreferrer"
                className="w-full sm:w-auto flex justify-center"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.10)', color: 'white', borderRadius: '10px', padding: '12px 24px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '14px', letterSpacing: '1.5px', textTransform: 'uppercase', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.20)', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#25D366'; e.currentTarget.style.borderColor = '#25D366'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.20)'; }}
              >
                <MessageSquare size={15} />
                WhatsApp
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── MAIN CONTENT ───────────────────────────────────────────────────── */}
      <div className="container mx-auto px-4" style={{ maxWidth: '1100px', padding: 'clamp(32px, 6vw, 64px) 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: '24px' }} className="contact-grid">

          {/* Info column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="contact-info-col"
          >
            <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '22px', color: '#1D3E61', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '20px' }}>
              {loc({ fr: 'Nos coordonnées', ar: 'معلومات الاتصال', tn: 'معلومات الاتصال', en: 'Our details', it: 'I nostri contatti' })}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {infoItems.map((item, i) => (
                <motion.a
                  key={i}
                  href={item.href === '#' ? undefined : item.href}
                  target={item.href?.startsWith('http') ? '_blank' : undefined}
                  rel={item.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.06 }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', background: 'white', borderRadius: '14px', padding: '16px 18px', border: '1px solid #E8EDF5', textDecoration: 'none', boxShadow: '0 1px 6px rgba(29,62,97,0.05)', transition: 'all 0.2s', height: '100%', outline: 'none' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = item.color; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px rgba(29,62,97,0.10)`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E8EDF5'; (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 6px rgba(29,62,97,0.05)'; }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <item.icon size={18} style={{ color: item.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '13px', color: '#7A8FA6', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                      {item.title}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {item.lines.map((line, j) => (
                        <div key={j} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#2F2D2C', lineHeight: 1.6 }}>{line}</div>
                      ))}
                    </div>
                  </div>
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Form column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ background: 'white', borderRadius: '20px', padding: 'clamp(24px, 4vw, 40px)', border: '1px solid #E8EDF5', boxShadow: '0 4px 24px rgba(29,62,97,0.07)' }}
            className="contact-form-col"
          >
            <div style={{ marginBottom: '28px' }}>
              <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '22px', color: '#1D3E61', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>
                {loc({ fr: 'Envoyez-nous un message', ar: 'أرسلوا لنا رسالة', tn: 'بعثولنا رسالة', en: 'Send us a message', it: 'Inviaci un messaggio' })}
              </h2>
              <div style={{ width: '40px', height: '3px', background: '#81C063', borderRadius: '2px' }} />
            </div>

            {status === 'success' && (
              <div style={{ background: '#ECFDF5', border: '1px solid #6EE7B7', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={18} color="#059669" />
                <span style={{ fontFamily: 'DM Sans, sans-serif', color: '#065F46', fontSize: '14px' }}>
                  {loc({
                    fr: 'Votre message a bien été envoyé ! Notre équipe vous répondra dans les plus brefs délais.',
                    ar: 'تم إرسال رسالتك بنجاح! سيرد عليك فريقنا في أقرب وقت ممكن.',
                    tn: 'تبعثت رسالتك بنجاح! الفريق يجاوبك في أقرب وقت.',
                    en: 'Your message has been sent successfully! Our team will reply as soon as possible.',
                    it: 'Il tuo messaggio è stato inviato con successo! Il nostro team risponderà al più presto.'
                  })}
                </span>
              </div>
            )}

            {status === 'error' && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertCircle size={18} color="#DC2626" />
                <span style={{ fontFamily: 'DM Sans, sans-serif', color: '#991B1B', fontSize: '14px' }}>
                  {loc({
                    fr: "Erreur d'envoi. Veuillez réessayer.",
                    ar: 'خطأ في الإرسال. يرجى المحاولة مرة أخرى.',
                    tn: 'مشكلة في الإرسال. يرجى المحاولة مرة أخرى.',
                    en: 'Send error. Please try again.',
                    it: 'Errore di invio. Riprova.'
                  })}
                </span>
              </div>
            )}

            <form ref={formRef} onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gap: '16px' }} className="form-row-2">
                <div>
                  <label style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: 600, color: '#3D5166', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{L('name')}</label>
                  <input
                    ref={nameRef}
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    inputMode="text"
                    autoCapitalize="words"
                    autoComplete="name"
                    placeholder={isRTL ? 'مثال: محمد التريكي' : 'Ex: Ahmed Ben Ali'}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        phoneRef.current?.focus();
                      }
                    }}
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#1D3E61'; e.target.style.boxShadow = '0 0 0 3px rgba(29,62,97,0.08)'; e.target.style.background = '#fff'; }}
                    onBlur={e => { e.target.style.borderColor = '#E8EDF5'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFD'; }}
                  />
                </div>
                <div>
                  <label style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: 600, color: '#3D5166', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{L('phone')}</label>
                  <input
                    ref={phoneRef}
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+216 XX XXX XXX"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        emailRef.current?.focus();
                      }
                    }}
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#1D3E61'; e.target.style.boxShadow = '0 0 0 3px rgba(29,62,97,0.08)'; e.target.style.background = '#fff'; }}
                    onBlur={e => { e.target.style.borderColor = '#E8EDF5'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFD'; }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: 600, color: '#3D5166', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{L('email')}</label>
                <input
                  ref={emailRef}
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="exemple@email.com"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      subjectRef.current?.focus();
                    }
                  }}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = '#1D3E61'; e.target.style.boxShadow = '0 0 0 3px rgba(29,62,97,0.08)'; e.target.style.background = '#fff'; }}
                  onBlur={e => { e.target.style.borderColor = '#E8EDF5'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFD'; }}
                />
              </div>

              <div>
                <label style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: 600, color: '#3D5166', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{L('subject')}</label>
                <select
                  ref={subjectRef}
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      messageRef.current?.focus();
                    }
                  }}
                  style={{ ...inputStyle, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }}>
                  <option value="">{loc({ fr: '— Choisir un sujet —', ar: '— اختر الموضوع —', tn: '— اختر الموضوع —', en: '— Choose a subject —', it: '— Scegli argomento —' })}</option>
                  <option value="devis">{loc({ fr: 'Demande de devis', ar: 'طلب عرض سعر', tn: 'طلب دوفيس', en: 'Quote request', it: 'Richiesta preventivo' })}</option>
                  <option value="produit">{loc({ fr: 'Information produit', ar: 'معلومات المنتج', tn: 'معلومات المنتوج', en: 'Product information', it: 'Info prodotto' })}</option>
                  <option value="installation">{loc({ fr: 'Installation & SAV', ar: 'تركيب وخدمة ما بعد البيع', tn: 'تركيب وخدمة', en: 'Installation & after-sales', it: 'Installazione & assistenza' })}</option>
                  <option value="other">{loc({ fr: 'Autre', ar: 'أخرى', tn: 'أخرى', en: 'Other', it: 'Altro' })}</option>
                </select>
              </div>

              <div>
                <label style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: 600, color: '#3D5166', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{L('message')}</label>
                <textarea
                  ref={messageRef}
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  placeholder={loc({ fr: 'Écrivez votre message ici...', ar: 'اكتب رسالتك هنا...', tn: 'اكتب رسالتك هنا...', en: 'Write your message here...', it: 'Scrivi il tuo messaggio qui...' })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      submitRef.current?.click();
                    }
                  }}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: '130px' }}
                  onFocus={e => { e.target.style.borderColor = '#1D3E61'; e.target.style.boxShadow = '0 0 0 3px rgba(29,62,97,0.08)'; e.target.style.background = '#fff'; }}
                  onBlur={e => { e.target.style.borderColor = '#E8EDF5'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFD'; }}
                />
              </div>

              <button
                ref={submitRef}
                type="submit"
                disabled={status === 'sending'}
                style={{
                  background: status === 'sending' ? '#7A99BA' : '#1D3E61',
                  color: 'white', border: 'none', borderRadius: '12px',
                  padding: '14px 24px', fontSize: '15px', fontWeight: 700,
                  fontFamily: 'Rajdhani, sans-serif', letterSpacing: '2px', textTransform: 'uppercase',
                  cursor: status === 'sending' ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '10px', width: '100%',
                  boxShadow: status === 'sending' ? 'none' : '0 4px 16px rgba(29,62,97,0.25)',
                }}
                onMouseEnter={e => { if (status !== 'sending') { e.currentTarget.style.background = '#81C063'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(129,192,99,0.35)'; } }}
                onMouseLeave={e => { if (status !== 'sending') { e.currentTarget.style.background = '#1D3E61'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(29,62,97,0.25)'; } }}
              >
                {status === 'sending' ? (
                  <>
                    <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                    {loc({ fr: 'Envoi...', ar: 'جاري الإرسال...', tn: 'جاري الإرسال...', en: 'Sending...', it: 'Invio...' })}
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    {L('send')}
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>

      {/* ── MAP ────────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        style={{ maxWidth: '1100px', margin: '0 auto clamp(40px, 8vw, 80px)', borderRadius: '20px', overflow: 'hidden', border: '1px solid #E8EDF5', boxShadow: '0 4px 24px rgba(29,62,97,0.08)', marginInline: 'auto', marginLeft: 'auto', marginRight: 'auto' }}
        className="mx-4 sm:mx-auto"
      >
        <div style={{ background: '#1D3E61', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MapPin size={16} color="#81C063" />
            <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase', color: 'white' }}>
              {loc({ fr: 'Notre emplacement — Mghira, Tunis', ar: 'موقعنا — مغيرة، تونس', tn: 'موقعنا — مغيرة، تونس', en: 'Our location — Mghira, Tunis', it: 'La nostra sede — Mghira, Tunis' })}
            </span>
          </div>
          <a
            href="https://maps.google.com/?q=125+lot+Laaroussi+Mghira+Ben+Arous+Tunisie"
            target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#81C063', color: 'white', borderRadius: '8px', padding: '6px 14px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', textDecoration: 'none', transition: 'background 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#5e9a43'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#81C063'; }}
          >
            {t('contact_page.see_maps')}
            <ArrowRight size={13} />
          </a>
        </div>
        <iframe
          src="https://maps.google.com/maps?q=125+lot+Laaroussi+Mghira+Ben+Arous+Tunisie&output=embed&zoom=15"
          width="100%"
          className="h-[220px] md:h-[360px]"
          style={{ border: 'none', display: 'block' }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Aluminium Space — Mghira, Tunis"
        />
      </motion.div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .contact-grid { grid-template-columns: 1fr; }
        @media (min-width: 860px) {
          .contact-grid { grid-template-columns: 1fr 1fr; align-items: start; }
        }
        .form-row-2 { grid-template-columns: 1fr; }
        @media (min-width: 480px) {
          .form-row-2 { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  );
};

export default Contact;
