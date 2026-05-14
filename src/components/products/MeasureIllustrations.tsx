import React from 'react';

// Common animation styles for illustrations
export const IllustrationStyles = () => (
  <style>{`
    @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeSlide { from { opacity:0; transform:translateX(-12px); } to { opacity:1; transform:translateX(0); } }
    @keyframes drawArrow { from { stroke-dashoffset:180; } to { stroke-dashoffset:0; } }
    @keyframes drawArrowV { from { stroke-dashoffset:220; } to { stroke-dashoffset:0; } }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    @keyframes glow { 0%,100%{opacity:.7} 50%{opacity:1} }
    @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
    
    .t0 { animation: fadeUp .5s .1s forwards; opacity:0; }
    .t1 { animation: fadeUp .5s .4s forwards; opacity:0; }
    .t2 { animation: fadeUp .5s .7s forwards; opacity:0; }
    .t3 { animation: fadeUp .5s 1.0s forwards; opacity:0; }
    
    .e0 { animation: fadeUp .5s .1s forwards; opacity:0; }
    .e1 { animation: fadeUp .5s .5s forwards; opacity:0; }
    .e2 { animation: fadeUp .5s .9s forwards; opacity:0; }
    .eArrow { animation: glow 1.5s 1.2s infinite; }
    
    .w0 { animation: fadeIn .4s .1s forwards; opacity:0; }
    .w1 { stroke-dasharray:180; animation: drawArrow .6s .3s forwards; stroke-dashoffset:180; }
    .w2 { stroke-dasharray:180; animation: drawArrow .6s .8s forwards; stroke-dashoffset:180; }
    .w3 { stroke-dasharray:180; animation: drawArrow .6s 1.3s forwards; stroke-dashoffset:180; }
    .wl1 { animation: fadeIn .3s .9s forwards; opacity:0; }
    .wl2 { animation: fadeIn .3s 1.4s forwards; opacity:0; }
    .wl3 { animation: fadeIn .3s 1.9s forwards; opacity:0; }
    .wbadge { animation: fadeIn .5s 2.2s forwards; opacity:0; }
    
    .h0 { animation: fadeIn .4s .1s forwards; opacity:0; }
    .h1 { stroke-dasharray:220; animation: drawArrowV .6s .3s forwards; stroke-dashoffset:220; }
    .h2 { stroke-dasharray:220; animation: drawArrowV .6s .8s forwards; stroke-dashoffset:220; }
    .h3 { stroke-dasharray:220; animation: drawArrowV .6s 1.3s forwards; stroke-dashoffset:220; }
    .hl1 { animation: fadeIn .3s .9s forwards; opacity:0; }
    .hl2 { animation: fadeIn .3s 1.4s forwards; opacity:0; }
    .hl3 { animation: fadeIn .3s 1.9s forwards; opacity:0; }
    .hbadge { animation: fadeIn .5s 2.2s forwards; opacity:0; }
    
    .tip0 { animation: fadeSlide .5s .1s forwards; opacity:0; }
    .tip1 { animation: fadeSlide .5s .5s forwards; opacity:0; }
    .tip2 { animation: fadeSlide .5s .9s forwards; opacity:0; }
    .tip3 { animation: fadeSlide .5s 1.3s forwards; opacity:0; }
    
    .o0 { animation: fadeUp .5s .1s forwards; opacity:0; }
    .o1 { animation: fadeUp .5s .5s forwards; opacity:0; }
    .o2 { animation: fadeUp .6s .9s forwards; opacity:0; }
    .o3 { animation: pulse 2s 1.5s infinite; }

    .m0 { animation: fadeIn .5s .1s forwards; opacity:0; }
    .m1 { animation: fadeIn .5s .4s forwards; opacity:0; }
  `}</style>
);

export const ToolsSVG: React.FC<{ k: number }> = ({ k }) => (
  <svg key={k} viewBox="0 0 320 210" style={{ width: '100%', maxWidth: '320px', height: 'auto' }}>
    <IllustrationStyles />
    {/* Tape measure */}
    <g className="t0" transform="translate(20,35)">
      <rect x="0" y="10" width="72" height="52" rx="10" fill="#F5A623" />
      <rect x="5" y="15" width="62" height="42" rx="7" fill="#E8960A" />
      <rect x="8" y="22" width="56" height="20" rx="3" fill="#FFF9EE" />
      {[0, 1, 2, 3, 4, 5, 6].map(i => (
        <line key={i} x1={10 + i * 8} y1="24" x2={10 + i * 8} y2={i % 2 === 0 ? '38' : '33'} stroke="#B87714" strokeWidth="1.5" />
      ))}
      <text x="36" y="34" fontSize="8" fill="#A06800" textAnchor="middle" fontWeight="700">50 cm</text>
      <rect x="64" y="27" width="12" height="10" rx="2" fill="#C8780A" />
      <text x="36" y="78" fontSize="11" fill="#3D5166" textAnchor="middle" fontWeight="600">Mètre ruban</text>
    </g>

    {/* Level */}
    <g className="t1" transform="translate(110,28)">
      <rect x="0" y="12" width="100" height="28" rx="6" fill="#2ECC71" />
      <rect x="3" y="15" width="94" height="22" rx="4" fill="#27AE60" />
      <ellipse cx="50" cy="26" rx="12" ry="8" fill="#1A8B4A" />
      <ellipse cx="50" cy="26" rx="8" ry="5" fill="none" stroke="#7FFFD4" strokeWidth="1.5" />
      <ellipse cx="50" cy="26" rx="3" ry="3" fill="#7FFFD4" />
      <line x1="14" y1="26" x2="30" y2="26" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
      <line x1="70" y1="26" x2="86" y2="26" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
      <text x="50" y="56" fontSize="11" fill="#3D5166" textAnchor="middle" fontWeight="600">Niveau à bulle</text>
    </g>

    {/* Pencil */}
    <g className="t2" transform="translate(232,18)">
      <rect x="26" y="0" width="14" height="100" rx="2" fill="#FFD700" />
      <rect x="26" y="0" width="14" height="12" rx="2" fill="#D4A017" />
      <rect x="27" y="1" width="12" height="11" rx="1" fill="#FFB6C1" />
      <line x1="26" y1="13" x2="40" y2="13" stroke="#B8860B" strokeWidth="1" />
      <polygon points="26,98 40,98 33,118" fill="#8B6914" />
      <polygon points="30,110 36,110 33,118" fill="#1A0A00" />
      <text x="33" y="132" fontSize="11" fill="#3D5166" textAnchor="middle" fontWeight="600">Crayon</text>
    </g>

    {/* Notepad */}
    <g className="t3" transform="translate(20,110)">
      <rect x="0" y="0" width="280" height="75" rx="8" fill="white" stroke="#E8EDF5" strokeWidth="1.5" />
      <rect x="0" y="0" width="280" height="18" rx="8" fill="#1A5DA8" />
      <rect x="0" y="10" width="280" height="8" fill="#1A5DA8" />
      <text x="140" y="13" fontSize="10" fill="white" textAnchor="middle" fontWeight="700" letterSpacing="1">CARNET DE NOTES — MESURES</text>
      <text x="70" y="42" fontSize="13" fill="#1A5DA8" textAnchor="middle" fontWeight="800">L (Largeur)</text>
      <rect x="20" y="48" width="100" height="18" rx="4" fill="#F4F7FB" stroke="#D0D9E8" strokeWidth="1" />
      <text x="70" y="61" fontSize="12" fill="#7A8FA6" textAnchor="middle">______ cm</text>
      <text x="210" y="42" fontSize="13" fill="#1A5DA8" textAnchor="middle" fontWeight="800">H (Hauteur)</text>
      <rect x="160" y="48" width="100" height="18" rx="4" fill="#F4F7FB" stroke="#D0D9E8" strokeWidth="1" />
      <text x="210" y="61" fontSize="12" fill="#7A8FA6" textAnchor="middle">______ cm</text>
    </g>
  </svg>
);

export const EmbrasureSVG: React.FC<{ k: number; isDoor: boolean }> = ({ k, isDoor }) => (
  <svg key={k} viewBox="0 0 320 210" style={{ width: '100%', maxWidth: '320px', height: 'auto' }}>
    <IllustrationStyles />
    {/* Wall + opening - top view */}
    <g className="e0">
      <rect x="20" y="70" width="95" height="70" rx="4" fill="#D0D9E8" />
      <rect x="20" y="70" width="95" height="70" rx="4" fill="none" stroke="#B0BED0" strokeWidth="1.5" />
      <text x="67" y="109" fontSize="11" fill="#7A8FA6" textAnchor="middle" fontWeight="600">MUR</text>
      <rect x="205" y="70" width="95" height="70" rx="4" fill="#D0D9E8" />
      <rect x="205" y="70" width="95" height="70" rx="4" fill="none" stroke="#B0BED0" strokeWidth="1.5" />
      <text x="252" y="109" fontSize="11" fill="#7A8FA6" textAnchor="middle" fontWeight="600">MUR</text>
      <rect x="115" y="70" width="90" height="70" fill="#E8F0FF" stroke="#1A5DA8" strokeWidth="2" strokeDasharray="4 2" />
      <text x="160" y="92" fontSize="10" fill="#1A5DA8" textAnchor="middle" fontWeight="700">EMBRASURE</text>
      <text x="160" y="108" fontSize="9" fill="#3D7DC8" textAnchor="middle">(Vue de dessus)</text>
      <text x="160" y="128" fontSize="18" textAnchor="middle">👁</text>
    </g>

    {/* Arrows showing interior */}
    <g className="e1 eArrow">
      <line x1="115" y1="155" x2="205" y2="155" stroke="#1A5DA8" strokeWidth="2" />
      <polygon points="115,151 115,159 108,155" fill="#1A5DA8" />
      <polygon points="205,151 205,159 212,155" fill="#1A5DA8" />
      <text x="160" y="170" fontSize="11" fill="#1A5DA8" textAnchor="middle" fontWeight="700">Largeur de l'embrasure</text>
    </g>

    <g className="e2">
      <rect x="20" y="175" width="280" height="28" rx="6" fill="#EEF4FF" />
      <text x="160" y="193" fontSize="11" fill="#1A5DA8" textAnchor="middle" fontWeight="600">
        {isDoor ? '📐 Mesure de l\'embrasure de porte (sol → haut)' : '📐 Mesure de l\'embrasure de fenêtre'}
      </text>
    </g>
  </svg>
);

export const MistakesSVG: React.FC<{ k: number }> = ({ k }) => (
  <svg key={k} viewBox="0 0 320 210" style={{ width: '100%', maxWidth: '320px', height: 'auto' }}>
    <IllustrationStyles />
    
    {/* Left Panel: Wrong (Frame) */}
    <g className="m0" transform="translate(15, 20)">
      <rect x="0" y="0" width="135" height="150" rx="8" fill="#FEF2F2" stroke="#FCA5A5" strokeWidth="1.5" />
      <text x="67" y="25" fontSize="14" textAnchor="middle">❌</text>
      
      {/* Window representation */}
      <rect x="25" y="45" width="85" height="80" rx="2" fill="white" stroke="#EF4444" strokeWidth="2" />
      <line x1="25" y1="85" x2="110" y2="85" stroke="#EF4444" strokeWidth="1" />
      <line x1="67" y1="45" x2="67" y2="125" stroke="#EF4444" strokeWidth="1" />
      
      {/* Wrong measurement lines */}
      <line x1="20" y1="40" x2="115" y2="40" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 2" />
      <text x="67" y="142" fontSize="10" fill="#991B1B" fontWeight="700" textAnchor="middle">Sur le cadre</text>
    </g>

    {/* Right Panel: Correct (Embrasure) */}
    <g className="m1" transform="translate(170, 20)">
      <rect x="0" y="0" width="135" height="150" rx="8" fill="#F0FDF4" stroke="#86EFAC" strokeWidth="1.5" />
      <text x="67" y="25" fontSize="14" textAnchor="middle">✅</text>
      
      {/* Opening representation */}
      <rect x="25" y="45" width="85" height="80" rx="2" fill="#EFF6FF" stroke="#22C55E" strokeWidth="2" strokeDasharray="4 2" />
      
      {/* Correct measurement lines */}
      <line x1="25" y1="85" x2="110" y2="85" stroke="#22C55E" strokeWidth="2" />
      <polygon points="25,82 25,88 20,85" fill="#22C55E" />
      <polygon points="110,82 110,88 115,85" fill="#22C55E" />
      
      <text x="67" y="142" fontSize="10" fill="#166534" fontWeight="700" textAnchor="middle">Dans l'embrasure</text>
    </g>
  </svg>
);

export const LargeurSVG: React.FC<{ k: number; isDoor: boolean }> = ({ k, isDoor }) => {
  const fW = 140, fH = isDoor ? 175 : 130;
  const fX = (320 - fW) / 2, fY = isDoor ? 15 : 28;
  const cx = fX + fW / 2;

  return (
    <svg key={k} viewBox="0 0 320 210" style={{ width: '100%', maxWidth: '320px', height: 'auto' }}>
      <IllustrationStyles />
      <g className="w0">
        <rect x={fX} y={fY} width={fW} height={fH} rx="3" fill="none" stroke="#B0BED0" strokeWidth="3" />
        <rect x={fX + 8} y={fY + 8} width={fW - 16} height={fH - 16} rx="2" fill="#EEF4FF" stroke="#1A5DA8" strokeWidth="1" strokeDasharray="3 2" />
        {!isDoor && <rect x={fX} y={fY + fH} width={fW} height="12" rx="2" fill="#D0D9E8" />}
        <text x={cx} y={fY + fH / 2} fontSize="11" fill="#7A8FA6" textAnchor="middle">Ouverture</text>
      </g>

      {/* Arrow 1 - top */}
      <g>
        <line className="w1" x1={fX + 4} y1={fY + fH * 0.22} x2={fX + fW - 4} y2={fY + fH * 0.22} stroke="#E74C3C" strokeWidth="2" />
        <polygon className="wl1" points={`${fX + 4},${fY + fH * 0.22 - 4} ${fX + 4},${fY + fH * 0.22 + 4} ${fX - 2},${fY + fH * 0.22}`} fill="#E74C3C" />
        <polygon className="wl1" points={`${fX + fW - 4},${fY + fH * 0.22 - 4} ${fX + fW - 4},${fY + fH * 0.22 + 4} ${fX + fW + 2},${fY + fH * 0.22}`} fill="#E74C3C" />
        <rect className="wl1" x={cx - 16} y={fY + fH * 0.22 - 9} width="32" height="14" rx="3" fill="#E74C3C" />
        <text className="wl1" x={cx} y={fY + fH * 0.22 + 1} fontSize="9" fill="white" textAnchor="middle" fontWeight="700">L1</text>
      </g>

      {/* Arrow 2 - middle */}
      <g>
        <line className="w2" x1={fX + 4} y1={fY + fH * 0.50} x2={fX + fW - 4} y2={fY + fH * 0.50} stroke="#F39C12" strokeWidth="2.5" />
        <polygon className="wl2" points={`${fX + 4},${fY + fH * 0.50 - 4} ${fX + 4},${fY + fH * 0.50 + 4} ${fX - 2},${fY + fH * 0.50}`} fill="#F39C12" />
        <polygon className="wl2" points={`${fX + fW - 4},${fY + fH * 0.50 - 4} ${fX + fW - 4},${fY + fH * 0.50 + 4} ${fX + fW + 2},${fY + fH * 0.50}`} fill="#F39C12" />
        <rect className="wl2" x={cx - 16} y={fY + fH * 0.50 - 9} width="32" height="14" rx="3" fill="#F39C12" />
        <text className="wl2" x={cx} y={fY + fH * 0.50 + 1} fontSize="9" fill="white" textAnchor="middle" fontWeight="700">L2</text>
      </g>

      {/* Arrow 3 - bottom */}
      <g>
        <line className="w3" x1={fX + 4} y1={fY + fH * 0.78} x2={fX + fW - 4} y2={fY + fH * 0.78} stroke="#1A5DA8" strokeWidth="2" />
        <polygon className="wl3" points={`${fX + 4},${fY + fH * 0.78 - 4} ${fX + 4},${fY + fH * 0.78 + 4} ${fX - 2},${fY + fH * 0.78}`} fill="#1A5DA8" />
        <polygon className="wl3" points={`${fX + fW - 4},${fY + fH * 0.78 - 4} ${fX + fW - 4},${fY + fH * 0.78 + 4} ${fX + fW + 2},${fY + fH * 0.78}`} fill="#1A5DA8" />
        <rect className="wl3" x={cx - 16} y={fY + fH * 0.78 - 9} width="32" height="14" rx="3" fill="#1A5DA8" />
        <text className="wl3" x={cx} y={fY + fH * 0.78 + 1} fontSize="9" fill="white" textAnchor="middle" fontWeight="700">L3</text>
      </g>

      <g className="wbadge">
        <rect x="20" y={isDoor ? 195 : 178} width="280" height="22" rx="5" fill="#FEF3CD" />
        <text x="160" y={isDoor ? 210 : 193} fontSize="11" fill="#8A6A00" textAnchor="middle" fontWeight="700">
          ⚠️  Retenez la valeur la plus petite → c'est votre L
        </text>
      </g>
    </svg>
  );
};

export const HauteurSVG: React.FC<{ k: number; isDoor: boolean }> = ({ k, isDoor }) => {
  const fW = 140, fH = isDoor ? 175 : 130;
  const fX = (320 - fW) / 2, fY = isDoor ? 10 : 22;
  const cy = fY + fH / 2;

  return (
    <svg key={k} viewBox="0 0 320 210" style={{ width: '100%', maxWidth: '320px', height: 'auto' }}>
      <IllustrationStyles />
      <g className="h0">
        <rect x={fX} y={fY} width={fW} height={fH} rx="3" fill="none" stroke="#B0BED0" strokeWidth="3" />
        <rect x={fX + 8} y={fY + 8} width={fW - 16} height={fH - 16} rx="2" fill="#EEF4FF" stroke="#1A5DA8" strokeWidth="1" strokeDasharray="3 2" />
        {!isDoor && <rect x={fX} y={fY + fH} width={fW} height="12" rx="2" fill="#D0D9E8" />}
        <text x={fX + fW / 2} y={cy} fontSize="11" fill="#7A8FA6" textAnchor="middle">Ouverture</text>
      </g>

      {/* Arrow 1 - left */}
      <g>
        <line className="h1" x1={fX + fW * 0.20} y1={fY + 4} x2={fX + fW * 0.20} y2={fY + fH - 4} stroke="#E74C3C" strokeWidth="2" />
        <polygon className="hl1" points={`${fX + fW * 0.20 - 4},${fY + 4} ${fX + fW * 0.20 + 4},${fY + 4} ${fX + fW * 0.20},${fY - 2}`} fill="#E74C3C" />
        <polygon className="hl1" points={`${fX + fW * 0.20 - 4},${fY + fH - 4} ${fX + fW * 0.20 + 4},${fY + fH - 4} ${fX + fW * 0.20},${fY + fH + 2}`} fill="#E74C3C" />
        <rect className="hl1" x={fX + fW * 0.20 - 14} y={cy - 7} width="28" height="14" rx="3" fill="#E74C3C" />
        <text className="hl1" x={fX + fW * 0.20} y={cy + 2} fontSize="9" fill="white" textAnchor="middle" fontWeight="700">H1</text>
      </g>

      {/* Arrow 2 - center */}
      <g>
        <line className="h2" x1={fX + fW * 0.50} y1={fY + 4} x2={fX + fW * 0.50} y2={fY + fH - 4} stroke="#F39C12" strokeWidth="2.5" />
        <polygon className="hl2" points={`${fX + fW * 0.50 - 4},${fY + 4} ${fX + fW * 0.50 + 4},${fY + 4} ${fX + fW * 0.50},${fY - 2}`} fill="#F39C12" />
        <polygon className="hl2" points={`${fX + fW * 0.50 - 4},${fY + fH - 4} ${fX + fW * 0.50 + 4},${fY + fH - 4} ${fX + fW * 0.50},${fY + fH + 2}`} fill="#F39C12" />
        <rect className="hl2" x={fX + fW * 0.50 - 14} y={cy - 7} width="28" height="14" rx="3" fill="#F39C12" />
        <text className="hl2" x={fX + fW * 0.50} y={cy + 2} fontSize="9" fill="white" textAnchor="middle" fontWeight="700">H2</text>
      </g>

      {/* Arrow 3 - right */}
      <g>
        <line className="h3" x1={fX + fW * 0.80} y1={fY + 4} x2={fX + fW * 0.80} y2={fY + fH - 4} stroke="#1A5DA8" strokeWidth="2" />
        <polygon className="hl3" points={`${fX + fW * 0.80 - 4},${fY + 4} ${fX + fW * 0.80 + 4},${fY + 4} ${fX + fW * 0.80},${fY - 2}`} fill="#1A5DA8" />
        <polygon className="hl3" points={`${fX + fW * 0.80 - 4},${fY + fH - 4} ${fX + fW * 0.80 + 4},${fY + fH - 4} ${fX + fW * 0.80},${fY + fH + 2}`} fill="#1A5DA8" />
        <rect className="hl3" x={fX + fW * 0.80 - 14} y={cy - 7} width="28" height="14" rx="3" fill="#1A5DA8" />
        <text className="hl3" x={fX + fW * 0.80} y={cy + 2} fontSize="9" fill="white" textAnchor="middle" fontWeight="700">H3</text>
      </g>

      <g className="hbadge">
        <rect x="20" y={isDoor ? 190 : 172} width="280" height="22" rx="5" fill="#FEF3CD" />
        <text x="160" y={isDoor ? 205 : 187} fontSize="11" fill="#8A6A00" textAnchor="middle" fontWeight="700">
          ⚠️  Retenez la valeur la plus petite → c'est votre H
        </text>
      </g>
    </svg>
  );
};

export const FormulaSVG: React.FC<{ k: number; exampleL?: string; exampleH?: string }> = ({ k, exampleL = "1 200", exampleH = "2 150" }) => (
  <svg key={k} viewBox="0 0 320 210" style={{ width: '100%', maxWidth: '320px', height: 'auto' }}>
    <IllustrationStyles />
    <g className="o0">
      <rect x="35" y="15" width="250" height="68" rx="12" fill="#EEF4FF" stroke="#1A5DA8" strokeWidth="2" />
      <text x="160" y="42" fontSize="13" fill="#7A8FA6" textAnchor="middle" fontWeight="600">Votre commande en une formule</text>
      <text x="160" y="72" fontSize="26" fill="#0D1B2A" textAnchor="middle" fontWeight="900">L  ×  H</text>
      <text x="107" y="84" fontSize="10" fill="#1A5DA8" textAnchor="middle">Largeur min.</text>
      <text x="213" y="84" fontSize="10" fill="#1A5DA8" textAnchor="middle">Hauteur min.</text>
    </g>

    <g className="o1">
      <rect x="55" y="92" width="210" height="40" rx="8" fill="#F4F7FB" stroke="#D0D9E8" strokeWidth="1.5" />
      <text x="160" y="107" fontSize="10" fill="#7A8FA6" textAnchor="middle">Exemple :</text>
      <text x="160" y="124" fontSize="14" fill="#0D1B2A" textAnchor="middle" fontWeight="800">{exampleL} mm  ×  {exampleH} mm</text>
    </g>

    <g className="o2">
      <rect x="20" y="142" width="280" height="28" rx="7" fill="#E8F5E9" stroke="#86EFAC" strokeWidth="1.5" />
      <text x="160" y="160" fontSize="12" fill="#1B5E20" textAnchor="middle" fontWeight="700">📞 Notre équipe valide vos mesures gratuitement</text>
    </g>

    <g className="o3" transform="translate(130, 175)">
      <rect x="0" y="0" width="60" height="28" rx="14" fill="#1A5DA8" />
      <text x="30" y="19" fontSize="13" fill="white" textAnchor="middle" fontWeight="800">✓ OK !</text>
    </g>
  </svg>
);

export const TipsSVG: React.FC<{ k: number }> = ({ k }) => (
  <svg key={k} viewBox="0 0 320 210" style={{ width: '100%', maxWidth: '320px', height: 'auto' }}>
    <IllustrationStyles />
    {[
      { icon: '📏', color: '#EEF4FF', border: '#B8D0F0', text: 'Mesurez toujours DANS l\'embrasure, entre les deux bords du mur', dy: 0 },
      { icon: '⬇️', color: '#FFF8EE', border: '#F5D27A', text: 'Arrondissez toujours au millimètre INFÉRIEUR (ex: 1203mm → 1203mm)', dy: 46 },
      { icon: '📐', color: '#F0FFF4', border: '#86EFAC', text: 'Un écart > 0.5cm entre vos mesures = défaut d\'aplomb. Signalez-le !', dy: 92 },
      { icon: '🔩', color: '#FFF0F0', border: '#FCA5A5', text: 'Pour fixation mural : prévoyez au moins 50mm de tableau accessible', dy: 138 },
    ].map(({ icon, color, border, text, dy }, i) => (
      <g key={i} className={`tip${i}`} transform={`translate(16, ${10 + dy})`}>
        <rect x="0" y="0" width="288" height="38" rx="7" fill={color} stroke={border} strokeWidth="1.5" />
        <text x="14" y="24" fontSize="17">{icon}</text>
        <text x="40" y="15" fontSize="10.5" fill="#0D1B2A" fontWeight="600">{text.split('(')[0]}</text>
        {text.includes('(') && (
          <text x="40" y="30" fontSize="10" fill="#7A8FA6">{`(${text.split('(')[1]}`}</text>
        )}
      </g>
    ))}
  </svg>
);

export const RecapSVG = ({ 
  L, H, productType 
}: { 
  L: number | null
  H: number | null
  productType: 'fenetre' | 'porte'
}) => {
  // Scale to fit SVG viewport (max 200x180)
  const maxW = 160, maxH = 150
  const ratio = L && H ? Math.min(maxW/L, maxH/H) : 1
  const w = L ? Math.round(L * ratio) : 120
  const h = H ? Math.round(H * ratio) : 100
  const x = (200 - w) / 2
  const y = (180 - h) / 2

  return (
    <svg viewBox="0 0 200 180" 
         xmlns="http://www.w3.org/2000/svg"
         style={{ width: '100%', maxHeight: 180 }}>
      
      {/* Window/Door rectangle */}
      <rect x={x} y={y} width={w} height={h}
        fill="#EFF6FF" stroke="#2563EB" 
        strokeWidth={2} rx={productType === 'porte' ? 2 : 6}
      />
      
      {/* Cross bars (window look) */}
      {productType === 'fenetre' && (
        <>
          <line x1={x + w/2} y1={y} 
                x2={x + w/2} y2={y + h}
            stroke="#2563EB" strokeWidth={1} 
            strokeDasharray="4,2" opacity={0.4}
          />
          <line x1={x} y1={y + h/2} 
                x2={x + w} y2={y + h/2}
            stroke="#2563EB" strokeWidth={1} 
            strokeDasharray="4,2" opacity={0.4}
          />
        </>
      )}

      {/* L arrow (bottom) */}
      <g>
        <line x1={x} y1={y+h+14} 
              x2={x+w} y2={y+h+14}
          stroke="#2563EB" strokeWidth={1.5}
          markerStart="url(#arr)" 
          markerEnd="url(#arr)"
        />
        <text x={x + w/2} y={y+h+26} 
          textAnchor="middle" 
          fontSize={10} fontWeight={700} 
          fill="#2563EB"
        >
          {L ? `L = ${L} cm` : 'L = ?'}
        </text>
      </g>

      {/* H arrow (right) */}
      <g>
        <line x1={x+w+14} y1={y} 
              x2={x+w+14} y2={y+h}
          stroke="#059669" strokeWidth={1.5}
          markerStart="url(#arrG)" 
          markerEnd="url(#arrG)"
        />
        <text x={x+w+18} y={y + h/2} 
          textAnchor="start" 
          fontSize={10} fontWeight={700} 
          fill="#059669"
          transform={`rotate(-90, ${x+w+30}, ${y + h/2})`}
        >
          {H ? `H = ${H} cm` : 'H = ?'}
        </text>
      </g>

      {/* Arrow marker defs */}
      <defs>
        <marker id="arr" markerWidth={6} markerHeight={6}
          refX={3} refY={3} orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#2563EB"/>
        </marker>
        <marker id="arrG" markerWidth={6} markerHeight={6}
          refX={3} refY={3} orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#059669"/>
        </marker>
      </defs>
    </svg>
  )
}
