import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function RemiseBanner() {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);

  const CARDS = [
    { minQty: 1,  maxQty: 2,   pct: 15, labelKey: 'home.remise.packs.decouverte',   hot: false },
    { minQty: 3,  maxQty: 5,   pct: 30, labelKey: 'home.remise.packs.appartement',  hot: false },
    { minQty: 6,  maxQty: 10,  pct: 40, labelKey: 'home.remise.packs.confort',      hot: true  },
    { minQty: 11, maxQty: null,pct: 50, labelKey: 'home.remise.packs.villa',        hot: false },
  ];

  const COUPONS = [
    { pct: 15, labelKey: 'home.remise.packs.decouverte.label',   rotate: -10, xD: -95, yD: 20,  xM: -70, yM: 10,  big: false },
    { pct: 30, labelKey: 'home.remise.packs.appartement.label',  rotate:   7, xD:  20, yD: 70,  xM:  15, yM: 50,  big: false },
    { pct: 40, labelKey: 'home.remise.packs.confort.label',      rotate:  -4, xD: -20, yD: 140, xM: -10, yM: 100, big: true  },
    { pct: 50, labelKey: 'home.remise.packs.villa.label',        rotate:   9, xD:  75, yD: 30,  xM:  55, yM: 20,  big: false },
  ];

  const PILLS = [
    { icon: 'check',  textKey: 'home.remise.pill1' },
    { icon: 'clock',  textKey: 'home.remise.pill2' },
    { icon: 'shield', textKey: 'home.remise.pill3' },
  ];

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <section style={{
      background: '#ffffff',
      padding: isMobile ? '36px 0 32px' : 'clamp(48px, 6vw, 72px) 0 clamp(32px, 4vw, 48px)',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Dot grid background */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(29,62,97,0.08) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />

      {/* Center green glow */}
      <div style={{
        position: 'absolute', top: '10%', left: '38%',
        transform: 'translateX(-50%)',
        width: '500px', height: '500px',
        background: 'radial-gradient(ellipse, rgba(99,153,34,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="container mx-auto px-4" style={{
        position: 'relative', zIndex: 1,
        maxWidth: '1200px',
      }}>

        {/* MAIN ROW: Left + Center + Right */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1.2fr',
          gridTemplateRows: 'auto',
          gap: '32px',
          alignItems: 'center',
          marginBottom: '32px',
        }}>

          {/* -- LEFT BLOCK -- */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ order: isMobile ? 1 : 0 }}
          >
            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              border: '2px solid #3B6D11', borderRadius: '99px',
              padding: '5px 16px', marginBottom: '20px',
              background: '#fff',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3B6D11" strokeWidth="2.5" strokeLinecap="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              <span style={{
                fontFamily: '"DM Sans", sans-serif', fontSize: '12px',
                fontWeight: 700, letterSpacing: '2px',
                textTransform: 'uppercase', color: '#3B6D11',
              }}>{t('home.remise.badge')}</span>
            </div>

            {/* Headline */}
            <h2 style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 900, fontSize: isMobile ? 'clamp(32px, 8vw, 44px)' : 'clamp(42px, 5vw, 68px)',
              lineHeight: 0.95, textTransform: 'uppercase',
              letterSpacing: '1px', margin: '0 0 14px',
            }}>
              <span style={{ color: '#1D3E61', display: 'block' }}>{t('home.remise.title1')}</span>
              <span style={{ color: '#639922', display: 'block' }}>{t('home.remise.title2')}</span>
            </h2>

            {/* Subtitle */}
            <p style={{
              fontFamily: '"DM Sans", sans-serif', fontSize: '13px',
              color: '#888780', marginBottom: '20px', lineHeight: 1.5,
            }}>
              {t('home.remise.subtitle')}
            </p>

            {/* Feature list */}
            {[
              t('home.remise.feature1'),
              t('home.remise.feature2'),
              t('home.remise.feature3'),
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                marginBottom: isMobile ? '12px' : '10px',
              }}>
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: '#639922', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <span style={{
                  fontFamily: '"DM Sans", sans-serif', fontSize: '13px',
                  color: '#444441', fontWeight: 500,
                }}>{item}</span>
              </div>
            ))}
          </motion.div>

          {/* -- CENTER BLOCK: Gift Box + Flying Coupons -- */}
          {isMobile ? (
            /* -- CENTER BLOCK (MOBILE): Gift Box + Flying Coupons -- */
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative mx-auto md:hidden"
              style={{
                width: '280px',
                height: '300px',
                order: 2,
              }}
            >
              {/* Flying coupons - Mobile Staggered Layout */}
              {/* Card 1: -15% */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.5 }}
                style={{
                  position: 'absolute',
                  bottom: '120px',
                  left: '-10px',
                  width: '130px',
                  transform: 'rotate(-3deg)',
                  background: '#fff',
                  border: '2px dashed #B5D4F4',
                  borderRadius: '10px',
                  padding: '6px 10px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                  zIndex: 2,
                  textAlign: 'center',
                }}
              >
                <div style={{
                  fontFamily: '"Barlow Condensed", sans-serif',
                  fontWeight: 900,
                  fontSize: '22px',
                  lineHeight: 1,
                  color: '#1D3E61',
                }}>-15%</div>
                <div style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '9px', fontWeight: 700,
                  letterSpacing: '1.2px', textTransform: 'uppercase',
                  color: '#888780',
                  marginTop: '2px',
                }}>{t('home.remise.packs.decouverte.label')}</div>
              </motion.div>

              {/* Card 2: -30% */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.5 }}
                style={{
                  position: 'absolute',
                  bottom: '160px',
                  left: '60px',
                  width: '120px',
                  transform: 'rotate(2deg)',
                  background: '#fff',
                  border: '2px dashed #B5D4F4',
                  borderRadius: '10px',
                  padding: '6px 10px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                  zIndex: 3,
                  textAlign: 'center',
                }}
              >
                <div style={{
                  fontFamily: '"Barlow Condensed", sans-serif',
                  fontWeight: 900,
                  fontSize: '22px',
                  lineHeight: 1,
                  color: '#1D3E61',
                }}>-30%</div>
                <div style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '9px', fontWeight: 700,
                  letterSpacing: '1.2px', textTransform: 'uppercase',
                  color: '#888780',
                  marginTop: '2px',
                }}>{t('home.remise.packs.appartement.label')}</div>
              </motion.div>

              {/* Card 3: -40% (Highlighted Green) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.5 }}
                style={{
                  position: 'absolute',
                  bottom: '195px',
                  left: '50%',
                  transform: 'translateX(-45%) rotate(-1deg)',
                  width: '130px',
                  background: '#EAF3DE',
                  border: '2.5px dashed #639922',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  zIndex: 4,
                  textAlign: 'center',
                }}
              >
                <div style={{
                  fontFamily: '"Barlow Condensed", sans-serif',
                  fontWeight: 900,
                  fontSize: '24px',
                  lineHeight: 1,
                  color: '#639922',
                }}>-40%</div>
                <div style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '9px', fontWeight: 700,
                  letterSpacing: '1.2px', textTransform: 'uppercase',
                  color: '#3B6D11',
                  marginTop: '2px',
                }}>{t('home.remise.packs.confort.label')}</div>
              </motion.div>

              {/* Card 4: -50% */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.5 }}
                style={{
                  position: 'absolute',
                  bottom: '130px',
                  right: '-10px',
                  width: '120px',
                  transform: 'rotate(3deg)',
                  background: '#fff',
                  border: '2px dashed #B5D4F4',
                  borderRadius: '10px',
                  padding: '6px 10px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                  zIndex: 3,
                  textAlign: 'center',
                }}
              >
                <div style={{
                  fontFamily: '"Barlow Condensed", sans-serif',
                  fontWeight: 900,
                  fontSize: '22px',
                  lineHeight: 1,
                  color: '#1D3E61',
                }}>-50%</div>
                <div style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '9px', fontWeight: 700,
                  letterSpacing: '1.2px', textTransform: 'uppercase',
                  color: '#888780',
                  marginTop: '2px',
                }}>{t('home.remise.packs.villa.label')}</div>
              </motion.div>

              {/* Floating % signs */}
              {[
                { top: '10px', left: '5px', size: '18px', opacity: 0.25 },
                { top: '20px', right: '0px', size: '14px', opacity: 0.20 },
                { top: '60%', left: '0px', size: '20px', opacity: 0.18 },
                { top: '15%', right: '10px', size: '16px', opacity: 0.22 },
              ].map((s, i) => (
                <div key={i} style={{
                  position: 'absolute', ...s,
                  fontFamily: '"Barlow Condensed", sans-serif',
                  fontWeight: 900, fontSize: s.size,
                  color: `rgba(99,153,34,${s.opacity})`,
                }}>%</div>
              ))}

              {/* Gift Box SVG */}
              <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 1 }}>
                <svg
                  width="150"
                  height="136"
                  viewBox="0 0 220 200"
                  fill="none"
                >
                  {/* -- Far glow behind everything -- */}
                  <ellipse cx="110" cy="95" rx="70" ry="30"
                    fill="rgba(99,153,34,0.15)" />

                  {/* -- Glow rays shooting upward from open box -- */}
                  <line x1="110" y1="95" x2="80" y2="18"
                    stroke="rgba(129,192,99,0.30)" strokeWidth="10" strokeLinecap="round"/>
                  <line x1="110" y1="95" x2="110" y2="5"
                    stroke="rgba(129,192,99,0.35)" strokeWidth="12" strokeLinecap="round"/>
                  <line x1="110" y1="95" x2="140" y2="16"
                    stroke="rgba(129,192,99,0.30)" strokeWidth="10" strokeLinecap="round"/>
                  <line x1="110" y1="95" x2="62" y2="35"
                    stroke="rgba(129,192,99,0.18)" strokeWidth="7" strokeLinecap="round"/>
                  <line x1="110" y1="95" x2="158" y2="33"
                    stroke="rgba(129,192,99,0.18)" strokeWidth="7" strokeLinecap="round"/>

                  {/* -- Inner bright glow at opening -- */}
                  <ellipse cx="110" cy="96" rx="44" ry="16"
                    fill="rgba(129,192,99,0.50)" />
                  <ellipse cx="110" cy="96" rx="28" ry="10"
                    fill="rgba(180,230,120,0.60)" />

                  {/* -- BOX BODY -- */}
                  <rect x="25" y="100" width="170" height="90" rx="8"
                    fill="#1D3E61"/>
                  <rect x="25" y="100" width="170" height="90" rx="8"
                    fill="none" stroke="#2a5585" strokeWidth="1.5"/>
                  {/* body shine top edge */}
                  <rect x="30" y="100" width="90" height="5" rx="2"
                    fill="rgba(255,255,255,0.07)"/>
                  {/* green ribbon on body */}
                  <rect x="101" y="100" width="18" height="90" fill="#639922"/>

                  {/* -- BOX LID - tilted open (rotated around bottom-left corner) -- */}
                  <g transform="rotate(-28, 25, 100)">
                    <rect x="25" y="72" width="170" height="30" rx="6"
                      fill="#185FA5"/>
                    {/* lid ribbon */}
                    <rect x="25" y="78" width="170" height="18" fill="#639922"/>
                    {/* lid green stripe aligned with body ribbon */}
                    <rect x="101" y="72" width="18" height="30" fill="#3B6D11"/>
                    {/* lid shine */}
                    <rect x="32" y="72" width="75" height="7" rx="3"
                      fill="rgba(255,255,255,0.09)"/>

                    {/* -- BOW on lid -- */}
                    {/* bow left loop */}
                    <path d="M110 72 C88 46 52 40 62 60 C68 74 96 72 110 72Z"
                      fill="#3B6D11"/>
                    {/* bow right loop */}
                    <path d="M110 72 C132 46 168 40 158 60 C152 74 124 72 110 72Z"
                      fill="#639922"/>
                    {/* bow knot */}
                    <ellipse cx="110" cy="72" rx="10" ry="8" fill="#27500A"/>
                    <ellipse cx="110" cy="71" rx="6" ry="4"
                      fill="rgba(99,153,34,0.65)"/>
                  </g>

                  {/* -- Sparkles inside box -- */}
                  <text x="42" y="162" fill="rgba(255,255,255,0.14)"
                    fontSize="18" fontFamily="sans-serif">✦</text>
                  <text x="158" y="175" fill="rgba(255,255,255,0.11)"
                    fontSize="13" fontFamily="sans-serif">✦</text>
                  <text x="58" y="180" fill="rgba(255,255,255,0.09)"
                    fontSize="10" fontFamily="sans-serif">✦</text>

                  {/* -- Ground shadow -- */}
                  <ellipse cx="110" cy="193" rx="75" ry="7"
                    fill="rgba(29,62,97,0.13)"/>
                </svg>
              </div>
            </motion.div>
          ) : (
            /* -- CENTER BLOCK (DESKTOP): Gift Box + Flying Coupons -- */
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="hidden md:flex"
              style={{
                position: 'relative',
                height: '460px',
                width: 'auto',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                order: 0,
              }}
            >
              {/* Flying coupons */}
              {COUPONS.map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                  style={{
                    position: 'absolute',
                    bottom: `${165 + c.yD}px`,
                    left: `calc(50% + ${c.xD}px)`,
                    transform: `translateX(-50%) rotate(${c.rotate}deg)`,
                    background: c.big ? '#EAF3DE' : '#fff',
                    border: `2px dashed ${c.big ? '#639922' : '#B5D4F4'}`,
                    borderRadius: '10px',
                    padding: c.big ? '10px 18px' : '8px 14px',
                    minWidth: c.big ? '150px' : '120px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                    zIndex: c.big ? 4 : 2,
                    textAlign: 'center',
                  }}
                >
                  <div style={{
                    fontFamily: '"Barlow Condensed", sans-serif',
                    fontWeight: 900,
                    fontSize: c.big ? '36px' : '28px',
                    lineHeight: 1,
                    color: c.big ? '#639922' : '#1D3E61',
                  }}>-{c.pct}%</div>
                  <div style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '10px', fontWeight: 700,
                    letterSpacing: '1.5px', textTransform: 'uppercase',
                    color: c.big ? '#3B6D11' : '#888780',
                    marginTop: '2px',
                  }}>{t(c.labelKey)}</div>
                </motion.div>
              ))}

              {/* Floating % signs */}
              {[
                { top: '10px', left: '5px', size: '18px', opacity: 0.25 },
                { top: '20px', right: '0px', size: '14px', opacity: 0.20 },
                { top: '60%', left: '0px', size: '20px', opacity: 0.18 },
                { top: '15%', right: '10px', size: '16px', opacity: 0.22 },
              ].map((s, i) => (
                <div key={i} style={{
                  position: 'absolute', ...s,
                  fontFamily: '"Barlow Condensed", sans-serif',
                  fontWeight: 900, fontSize: s.size,
                  color: `rgba(99,153,34,${s.opacity})`,
                }}>%</div>
              ))}

              {/* Gift Box SVG */}
              <div style={{ position: 'absolute', bottom: 0 }}>
                <svg
                  width="220"
                  height="200"
                  viewBox="0 0 220 200"
                  fill="none"
                >
                  {/* -- Far glow behind everything -- */}
                  <ellipse cx="110" cy="95" rx="70" ry="30"
                    fill="rgba(99,153,34,0.15)" />

                  {/* -- Glow rays shooting upward from open box -- */}
                  <line x1="110" y1="95" x2="80" y2="18"
                    stroke="rgba(129,192,99,0.30)" strokeWidth="10" strokeLinecap="round"/>
                  <line x1="110" y1="95" x2="110" y2="5"
                    stroke="rgba(129,192,99,0.35)" strokeWidth="12" strokeLinecap="round"/>
                  <line x1="110" y1="95" x2="140" y2="16"
                    stroke="rgba(129,192,99,0.30)" strokeWidth="10" strokeLinecap="round"/>
                  <line x1="110" y1="95" x2="62" y2="35"
                    stroke="rgba(129,192,99,0.18)" strokeWidth="7" strokeLinecap="round"/>
                  <line x1="110" y1="95" x2="158" y2="33"
                    stroke="rgba(129,192,99,0.18)" strokeWidth="7" strokeLinecap="round"/>

                  {/* -- Inner bright glow at opening -- */}
                  <ellipse cx="110" cy="96" rx="44" ry="16"
                    fill="rgba(129,192,99,0.50)" />
                  <ellipse cx="110" cy="96" rx="28" ry="10"
                    fill="rgba(180,230,120,0.60)" />

                  {/* -- BOX BODY -- */}
                  <rect x="25" y="100" width="170" height="90" rx="8"
                    fill="#1D3E61"/>
                  <rect x="25" y="100" width="170" height="90" rx="8"
                    fill="none" stroke="#2a5585" strokeWidth="1.5"/>
                  {/* body shine top edge */}
                  <rect x="30" y="100" width="90" height="5" rx="2"
                    fill="rgba(255,255,255,0.07)"/>
                  {/* green ribbon on body */}
                  <rect x="101" y="100" width="18" height="90" fill="#639922"/>

                  {/* -- BOX LID - tilted open (rotated around bottom-left corner) -- */}
                  <g transform="rotate(-28, 25, 100)">
                    <rect x="25" y="72" width="170" height="30" rx="6"
                      fill="#185FA5"/>
                    {/* lid ribbon */}
                    <rect x="25" y="78" width="170" height="18" fill="#639922"/>
                    {/* lid green stripe aligned with body ribbon */}
                    <rect x="101" y="72" width="18" height="30" fill="#3B6D11"/>
                    {/* lid shine */}
                    <rect x="32" y="72" width="75" height="7" rx="3"
                      fill="rgba(255,255,255,0.09)"/>

                    {/* -- BOW on lid -- */}
                    {/* bow left loop */}
                    <path d="M110 72 C88 46 52 40 62 60 C68 74 96 72 110 72Z"
                      fill="#3B6D11"/>
                    {/* bow right loop */}
                    <path d="M110 72 C132 46 168 40 158 60 C152 74 124 72 110 72Z"
                      fill="#639922"/>
                    {/* bow knot */}
                    <ellipse cx="110" cy="72" rx="10" ry="8" fill="#27500A"/>
                    <ellipse cx="110" cy="71" rx="6" ry="4"
                      fill="rgba(99,153,34,0.65)"/>
                  </g>

                  {/* -- Sparkles inside box -- */}
                  <text x="42" y="162" fill="rgba(255,255,255,0.14)"
                    fontSize="18" fontFamily="sans-serif">✦</text>
                  <text x="158" y="175" fill="rgba(255,255,255,0.11)"
                    fontSize="13" fontFamily="sans-serif">✦</text>
                  <text x="58" y="180" fill="rgba(255,255,255,0.09)"
                    fontSize="10" fontFamily="sans-serif">✦</text>

                  {/* -- Ground shadow -- */}
                  <ellipse cx="110" cy="193" rx="75" ry="7"
                    fill="rgba(29,62,97,0.13)"/>
                </svg>
              </div>
            </motion.div>
          )}

          {/* -- RIGHT BLOCK: 4 Cards -- */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: '10px',
              order: isMobile ? 3 : 0,
              margin: isMobile ? '0 auto' : '0',
              width: isMobile ? '100%' : 'auto',
            }}
          >
            {CARDS.map((card, i) => (
              <div key={i} style={{
                position: 'relative',
                borderRadius: '14px',
                padding: isMobile ? '20px 16px 16px' : '16px 14px 14px',
                background: card.hot ? '#FAFFF6' : '#fff',
                border: card.hot ? '2px solid #639922' : '1.5px solid #E8EDF3',
                boxShadow: card.hot
                  ? '0 4px 20px rgba(99,153,34,0.15)'
                  : '0 2px 12px rgba(29,62,97,0.07)',
              }}>
                {card.hot && (
                  <div style={{
                    position: 'absolute', top: '-13px', left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#639922', borderRadius: '99px',
                    padding: '3px 10px', fontSize: '9px', fontWeight: 700,
                    letterSpacing: '1.5px', textTransform: 'uppercase',
                    color: '#fff', whiteSpace: 'nowrap',
                    fontFamily: '"DM Sans", sans-serif',
                  }}>⭐ {t('home.remise.popular')}</div>
                )}
                <div style={{
                  fontFamily: '"DM Sans", sans-serif', fontSize: '10px',
                  fontWeight: 600, letterSpacing: '1px',
                  textTransform: 'uppercase',
                  color: card.hot ? '#639922' : '#B4B2A9',
                  marginBottom: '4px',
                  textAlign: isMobile ? 'center' : 'left',
                }}>
                  {card.maxQty
                    ? t('home.remise.pieces_range', { min: card.minQty, max: card.maxQty })
                    : t('home.remise.pieces_plus', { min: card.minQty })}
                </div>
                <div style={{
                  fontFamily: '"Barlow Condensed", sans-serif',
                  fontWeight: 900, fontSize: isMobile ? '52px' : '48px',
                  lineHeight: 0.9, letterSpacing: '-1px',
                  color: card.hot ? '#639922' : '#1D3E61',
                  marginBottom: '6px',
                  textAlign: isMobile ? 'center' : 'left',
                }}>-{card.pct}%</div>
                <div style={{
                  fontFamily: '"Barlow Condensed", sans-serif',
                  fontWeight: 700, fontSize: '12px',
                  letterSpacing: '1.5px', textTransform: 'uppercase',
                  color: '#1D3E61', marginBottom: '4px',
                  textAlign: isMobile ? 'center' : 'left',
                }}>{t(`${card.labelKey}.label`)}</div>
                <div style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '11px', color: '#B4B2A9', lineHeight: 1.4,
                  textAlign: isMobile ? 'center' : 'left',
                }}>{t(`${card.labelKey}.desc`)}</div>
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  height: '3px', borderRadius: '0 0 12px 12px',
                  background: card.hot
                    ? 'linear-gradient(90deg,#639922,rgba(99,153,34,0))'
                    : 'linear-gradient(90deg,#B5D4F4,transparent)',
                }} />
              </div>
            ))}
          </motion.div>

        </div>

        {/* -- BOTTOM PILLS -- */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: 'center', gap: isMobile ? '8px' : '12px',
            flexWrap: 'wrap',
            paddingTop: '24px',
            borderTop: '1px solid #F0F4F8',
          }}
        >
          {PILLS.map((p, i) => (
            <div key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              width: isMobile ? '100%' : 'auto',
              justifyContent: isMobile ? 'center' : 'flex-start',
              border: '2px solid #3B6D11', borderRadius: '99px',
              padding: '8px 20px', background: '#fff',
              fontFamily: '"DM Sans", sans-serif', fontSize: '12px',
              fontWeight: 700, letterSpacing: '1.5px',
              textTransform: 'uppercase', color: '#3B6D11',
            }}>
              <div style={{
                width: '20px', height: '20px', borderRadius: '50%',
                background: '#639922',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {p.icon === 'check' && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
                {p.icon === 'clock' && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                )}
                {p.icon === 'shield' && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                )}
              </div>
              {t(p.textKey)}
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
