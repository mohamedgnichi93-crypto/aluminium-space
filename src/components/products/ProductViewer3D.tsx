import React, { useRef, useState, useMemo, useEffect, useContext } from 'react';
import { FrameColorCtx } from '../../context/FrameColorContext';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import SidneyACModel from './SidneyACModel';

// ─── MESH TEXTURE ─────────────────────────────────────────────────────────────
function useDarkMeshTexture() {
  return useMemo(() => {
    const size = 256;
    const data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const onLine = (x % 7 <= 1) || (y % 7 <= 1);
        if (onLine) {
          // Fibre thread — dark charcoal matching real product
          data[idx] = 22; data[idx + 1] = 25; data[idx + 2] = 28; data[idx + 3] = 248;
        } else {
          // Open cell — semi-transparent dark
          data[idx] = 38; data[idx + 1] = 42; data[idx + 2] = 46; data[idx + 3] = 95;
        }
      }
    }
    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(34, 28);
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.generateMipmaps = true;
    tex.needsUpdate = true;
    return tex;
  }, []);
}

// ─── SHARED MATERIALS HOOK ────────────────────────────────────────────────────
function useSharedMaterials() {
  return useMemo(() => ({
    darkMat:   new THREE.MeshStandardMaterial({ color: '#4A4A4C', metalness: 0.55, roughness: 0.45 }),
    feetUpMat: new THREE.MeshStandardMaterial({ color: '#484848', metalness: 0.50, roughness: 0.50 }),
    feetLoMat: new THREE.MeshStandardMaterial({ color: '#383838', metalness: 0.40, roughness: 0.60 }),
    cordMat:   new THREE.MeshStandardMaterial({ color: '#111111', roughness: 0.95, metalness: 0 }),
    ringMat:   new THREE.MeshStandardMaterial({ color: new THREE.Color(0.78, 0.78, 0.80), metalness: 0.90, roughness: 0.10 }),
    sealMat:   new THREE.MeshStandardMaterial({ color: '#141416', roughness: 0.97, metalness: 0 }),
    lipMat:    new THREE.MeshStandardMaterial({ color: new THREE.Color(0.90, 0.89, 0.88), metalness: 0.08, roughness: 0.85 }),
    handleMat: new THREE.MeshStandardMaterial({ color: '#3C3C3E', metalness: 0.45, roughness: 0.55 }),
    screwMat:  new THREE.MeshStandardMaterial({ color: '#606062', metalness: 0.70, roughness: 0.30 }),
  }), []);
}

function useMeshScreenMat() {
  const tex = useDarkMeshTexture();
  return useMemo(() => new THREE.MeshStandardMaterial({
    map: tex, transparent: true, opacity: 0.97,
    alphaTest: 0.02, side: THREE.DoubleSide, depthWrite: false,
    roughness: 0.85, metalness: 0.02,
  }), [tex]);
}

// Bright white aluminium matching real Grifo Flex product finish
const makeAlumMat = (r = 0.985, g = 0.982, b = 0.978) =>
  new THREE.MeshStandardMaterial({ color: new THREE.Color(r, g, b), metalness: 0.14, roughness: 0.72 });

// ─── TYPES ────────────────────────────────────────────────────────────────────
type ViewMode = 'assembled' | 'exploded';
interface ModelProps { openPct: number; viewMode: ViewMode; }

// ─── PART LABEL ───────────────────────────────────────────────────────────────
function PartLabel({ text, visible }: { text: string; visible: boolean }) {
  return (
    <Html center zIndexRange={[100, 0]}
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.4s', pointerEvents: 'none' }}>
      <div style={{
        background: 'rgba(13,27,42,0.90)', color: 'white', padding: '4px 10px',
        borderRadius: '6px', fontSize: '11px', fontFamily: 'Inter,sans-serif',
        whiteSpace: 'nowrap', borderLeft: '2px solid #1A5DA8',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}>{text}</div>
    </Html>
  );
}

// ─── ANIMATED PART ────────────────────────────────────────────────────────────
function APart({ children, name, base, explode, labelOff = [0, 0.2, 0], viewMode, label = true }: {
  children: React.ReactNode; name: string;
  base: [number, number, number]; explode: [number, number, number];
  labelOff?: [number, number, number]; viewMode: ViewMode; label?: boolean;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const e = viewMode === 'exploded';
    ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, base[0] + (e ? explode[0] : 0), 0.06);
    ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, base[1] + (e ? explode[1] : 0), 0.06);
    ref.current.position.z = THREE.MathUtils.lerp(ref.current.position.z, base[2] + (e ? explode[2] : 0), 0.06);
  });
  return (
    <group ref={ref} position={base}>
      {children}
      {label && (
        <group position={labelOff}>
          <PartLabel text={name} visible={viewMode === 'exploded'} />
        </group>
      )}
    </group>
  );
}

// ─── ADJUSTABLE FOOT ──────────────────────────────────────────────────────────
function AdjFoot({ x, y, mats }: { x: number; y: number; mats: ReturnType<typeof useSharedMaterials> }) {
  return (
    <group position={[x, y, 0]}>
      <mesh material={mats.feetUpMat} position={[0, 0.033, 0]}><boxGeometry args={[0.048, 0.065, 0.050]} /></mesh>
      <mesh material={mats.feetLoMat} position={[0, -0.007, 0]}><boxGeometry args={[0.068, 0.014, 0.068]} /></mesh>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COLIBRÌ 50 — Window, TOP cassette, mesh rolls DOWN
// ═══════════════════════════════════════════════════════════════════════════════
function ColibriModel({ openPct, viewMode }: ModelProps) {
  const pct = openPct / 100;
  const mats = useSharedMaterials();

  const FW = 2.40;
  const FH = 1.55;
  const RW = 0.050;
  const RD = 0.048;
  const CH = 0.22;
  const CD = 0.048;

  const [fcr, fcg, fcb] = useContext(FrameColorCtx);
  const cassetteMat = useMemo(() => makeAlumMat(fcr * 0.945, fcg * 0.938, fcb * 0.930), [fcr, fcg, fcb]);
  const railMat = useMemo(() => makeAlumMat(fcr * 0.985, fcg * 0.978, fcb * 0.971), [fcr, fcg, fcb]);
  const pbMat = useMemo(() => makeAlumMat(fcr * 0.975, fcg * 0.968, fcb * 0.961), [fcr, fcg, fcb]);
  const meshMat = useMeshScreenMat();

  const cassetteY = FH / 2 + CH / 2;
  const cassetteBottomY = FH / 2;
  const meshMaxH = FH;
  const interiorW = FW - RW * 2;

  const meshRef = useRef<THREE.Mesh>(null);
  const pbRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const sY = Math.max(0.001, 1 - pct);
    const visH = meshMaxH * sY;

    if (meshRef.current) {
      meshRef.current.scale.y = sY;
      meshRef.current.position.y = cassetteBottomY - visH / 2;
    }
    if (pbRef.current) {
      pbRef.current.position.y = cassetteBottomY - visH - 0.036;
    }
  });

  return (
    <group>
      {/* CASSETTE */}
      <APart name="Caisson enrouleur — 45mm" base={[0, cassetteY, 0]}
        explode={[0, 1.3, 0]} labelOff={[0, 0.28, 0]} viewMode={viewMode}>
        <mesh material={cassetteMat}>
          <boxGeometry args={[FW, CH, CD]} />
        </mesh>
        <mesh material={mats.lipMat} position={[0, -CH / 2 - 0.015, CD / 2 - 0.014]}>
          <boxGeometry args={[FW, 0.030, 0.018]} />
        </mesh>
        <mesh material={mats.sealMat} position={[0, -CH / 2 - 0.003, CD / 2 - 0.010]}>
          <boxGeometry args={[FW - 0.04, 0.008, 0.006]} />
        </mesh>
        <mesh material={mats.sealMat} position={[0, -CH / 2 - 0.011, CD / 2 - 0.010]}>
          <boxGeometry args={[FW - 0.04, 0.008, 0.006]} />
        </mesh>
      </APart>

      {/* LEFT RAIL */}
      <APart name="Coulisse gauche — doubles joints-brosses"
        base={[-FW / 2 + RW / 2, 0, 0]}
        explode={[-1.7, 0, 0]} labelOff={[-0.38, 0, 0]} viewMode={viewMode}>
        <mesh material={railMat}><boxGeometry args={[RW, FH, RD]} /></mesh>
        <mesh material={mats.lipMat} position={[RW / 2 - 0.008, 0, 0.02]}>
          <boxGeometry args={[0.012, FH, 0.014]} />
        </mesh>
        <mesh material={mats.sealMat} position={[RW / 2 - 0.002, 0, 0.044]}>
          <boxGeometry args={[0.007, FH - 0.06, 0.005]} />
        </mesh>
      </APart>

      {/* RIGHT RAIL */}
      <APart name="Coulisse droite" base={[FW / 2 - RW / 2, 0, 0]}
        explode={[1.7, 0, 0]} labelOff={[0.38, 0, 0]} viewMode={viewMode} label={false}>
        <mesh material={railMat}><boxGeometry args={[RW, FH, RD]} /></mesh>
        <mesh material={mats.lipMat} position={[-RW / 2 + 0.008, 0, 0.02]}>
          <boxGeometry args={[0.012, FH, 0.014]} />
        </mesh>
        <mesh material={mats.sealMat} position={[-RW / 2 + 0.002, 0, 0.044]}>
          <boxGeometry args={[0.007, FH - 0.06, 0.005]} />
        </mesh>
      </APart>

      {/* CORNER BRACKETS */}
      <APart name="Équerres de fixation" base={[0, 0, 0.04]}
        explode={[0, 0, -1.2]} viewMode={viewMode} label={false}>
        <mesh material={mats.darkMat} position={[-FW / 2 + 0.052, cassetteBottomY - 0.012, 0]}>
          <boxGeometry args={[0.104, 0.024, 0.055]} />
        </mesh>
        <mesh material={mats.darkMat} position={[-FW / 2 + 0.012, cassetteBottomY - 0.064, 0]}>
          <boxGeometry args={[0.024, 0.104, 0.055]} />
        </mesh>
        <mesh material={mats.darkMat} position={[FW / 2 - 0.052, cassetteBottomY - 0.012, 0]}>
          <boxGeometry args={[0.104, 0.024, 0.055]} />
        </mesh>
        <mesh material={mats.darkMat} position={[FW / 2 - 0.012, cassetteBottomY - 0.064, 0]}>
          <boxGeometry args={[0.024, 0.104, 0.055]} />
        </mesh>
        <mesh material={mats.darkMat} position={[-FW / 2 + 0.052, -FH / 2 + 0.012, 0]}>
          <boxGeometry args={[0.104, 0.024, 0.055]} />
        </mesh>
        <mesh material={mats.darkMat} position={[-FW / 2 + 0.012, -FH / 2 + 0.064, 0]}>
          <boxGeometry args={[0.024, 0.104, 0.055]} />
        </mesh>
        <mesh material={mats.darkMat} position={[FW / 2 - 0.052, -FH / 2 + 0.012, 0]}>
          <boxGeometry args={[0.104, 0.024, 0.055]} />
        </mesh>
        <mesh material={mats.darkMat} position={[FW / 2 - 0.012, -FH / 2 + 0.064, 0]}>
          <boxGeometry args={[0.024, 0.104, 0.055]} />
        </mesh>
      </APart>

      {/* ADJUSTABLE FEET */}
      <APart name="Pieds réglables" base={[0, 0, 0]}
        explode={[0, -1.3, 0]} viewMode={viewMode} label={false}>
        <AdjFoot x={-FW / 2 + RW / 2} y={-FH / 2 - 0.044} mats={mats} />
        <AdjFoot x={FW / 2 - RW / 2} y={-FH / 2 - 0.044} mats={mats} />
      </APart>

      {/* MESH SCREEN */}
      <APart name="Maille fibre de verre PVC" base={[0, 0, 0.006]}
        explode={[0, 0, 1.4]} labelOff={[0, 0, 0.28]} viewMode={viewMode}>
        <mesh ref={meshRef} material={meshMat}
          position={[0, cassetteBottomY - meshMaxH / 2, 0]}>
          <planeGeometry args={[interiorW, meshMaxH]} />
        </mesh>
      </APart>

      {/* PULL BAR + CORD + RING */}
      <APart name="Barre de charge + cordon" base={[0, 0, 0.015]}
        explode={[0, -1.5, 0]} labelOff={[0, -0.14, 0]} viewMode={viewMode}>
        <group ref={pbRef} position={[0, cassetteBottomY - meshMaxH - 0.036, 0]}>
          <mesh material={pbMat}>
            <boxGeometry args={[interiorW, 0.072, 0.068]} />
          </mesh>
          <mesh material={mats.handleMat} position={[-interiorW / 2 - 0.014, 0, 0]}>
            <boxGeometry args={[0.028, 0.072, 0.068]} />
          </mesh>
          <mesh material={mats.handleMat} position={[interiorW / 2 + 0.014, 0, 0]}>
            <boxGeometry args={[0.028, 0.072, 0.068]} />
          </mesh>
          <mesh material={mats.cordMat} position={[0, -0.165, 0]}>
            <cylinderGeometry args={[0.005, 0.005, 0.30, 8]} />
          </mesh>
          <mesh material={mats.ringMat} position={[0, -0.325, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.022, 0.008, 8, 16]} />
          </mesh>
        </group>
      </APart>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIDNEY 50 — Door, LEFT side cassette, mesh slides LEFT into cassette
// ═══════════════════════════════════════════════════════════════════════════════
function SidneyModel({ openPct, viewMode }: ModelProps) {
  const pct = openPct / 100;
  const mats = useSharedMaterials();

  const FH = 2.60;
  const RW = 0.07;
  const RD = 0.10;
  const CW = 0.16;
  const CD = 0.10;

  const [fcr2, fcg2, fcb2] = useContext(FrameColorCtx);
  const railMat = useMemo(() => makeAlumMat(fcr2 * 0.985, fcg2 * 0.978, fcb2 * 0.971), [fcr2, fcg2, fcb2]);
  const cassetteMat = useMemo(() => makeAlumMat(fcr2 * 0.945, fcg2 * 0.938, fcb2 * 0.930), [fcr2, fcg2, fcb2]);
  const meshMat = useMeshScreenMat();

  const interiorW = 1.60;
  const outerW = CW + interiorW + RW;
  const casX = -outerW / 2 + CW / 2;
  const rightRailX = outerW / 2 - RW / 2;
  const meshStartX = casX + CW / 2;
  const meshEndX = rightRailX - RW / 2;
  const meshMaxW = meshEndX - meshStartX;

  const meshRef = useRef<THREE.Mesh>(null);
  const handleRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const sX = Math.max(0.001, 1 - pct);
    const visW = meshMaxW * sX;

    if (meshRef.current) {
      meshRef.current.scale.x = sX;
      meshRef.current.position.x = meshStartX + visW / 2;
    }
    if (handleRef.current) {
      handleRef.current.position.x = meshStartX + visW + 0.025;
    }
  });

  return (
    <group>
      {/* LEFT CASSETTE */}
      <APart name="Caisson latéral gauche — 45mm" base={[casX, 0, 0]}
        explode={[-2.0, 0, 0]} labelOff={[-0.32, 0, 0]} viewMode={viewMode}>
        <mesh material={cassetteMat}>
          <boxGeometry args={[CW, FH + 0.14, CD]} />
        </mesh>
        <mesh material={mats.lipMat} position={[CW / 2 + 0.008, 0, 0]}>
          <boxGeometry args={[0.016, FH * 0.94, 0.020]} />
        </mesh>
        <mesh material={mats.sealMat} position={[CW / 2 + 0.003, 0, 0.008]}>
          <boxGeometry args={[0.006, FH * 0.92, 0.005]} />
        </mesh>
        <mesh material={mats.sealMat} position={[CW / 2 + 0.003, 0, -0.008]}>
          <boxGeometry args={[0.006, FH * 0.92, 0.005]} />
        </mesh>
      </APart>

      {/* TOP RAIL */}
      <APart name="Rail supérieur"
        base={[(casX + CW / 2 + rightRailX + RW / 2) / 2, FH / 2 + RW / 2, 0]}
        explode={[0, 1.4, 0]} labelOff={[0, 0.22, 0]} viewMode={viewMode}>
        <mesh material={railMat}>
          <boxGeometry args={[interiorW + RW, RW, RD]} />
        </mesh>
      </APart>

      {/* BOTTOM RAIL */}
      <APart name="Rail inférieur"
        base={[(casX + CW / 2 + rightRailX + RW / 2) / 2, -FH / 2 - RW / 2, 0]}
        explode={[0, -1.4, 0]} viewMode={viewMode} label={false}>
        <mesh material={railMat}>
          <boxGeometry args={[interiorW + RW, RW, RD]} />
        </mesh>
      </APart>

      {/* RIGHT RAIL */}
      <APart name="Profilé de réception droit" base={[rightRailX, 0, 0]}
        explode={[2.0, 0, 0]} labelOff={[0.32, 0, 0]} viewMode={viewMode}>
        <mesh material={railMat}><boxGeometry args={[RW, FH, RD]} /></mesh>
      </APart>

      {/* CORNER BRACKETS */}
      <APart name="Équerres de fixation" base={[0, 0, 0.04]}
        explode={[0, 0, -0.9]} viewMode={viewMode} label={false}>
        {([
          [casX + CW / 2, FH / 2],
          [casX + CW / 2, -FH / 2],
          [rightRailX, FH / 2],
          [rightRailX, -FH / 2],
        ] as [number, number][]).map(([x, y], i) => (
          <mesh key={i} material={mats.darkMat} position={[x, y, 0]}>
            <boxGeometry args={[0.045, 0.045, 0.055]} />
          </mesh>
        ))}
      </APart>

      {/* ADJUSTABLE FEET */}
      <APart name="Pieds réglables" base={[0, 0, 0]}
        explode={[0, -1.6, 0]} viewMode={viewMode} label={false}>
        <AdjFoot x={casX} y={-FH / 2 - 0.07 - 0.044} mats={mats} />
        <AdjFoot x={rightRailX} y={-FH / 2 - 0.044} mats={mats} />
      </APart>

      {/* MESH SCREEN */}
      <APart name="Maille fibre de verre PVC" base={[0, 0, 0.005]}
        explode={[0, 0, 1.3]} labelOff={[0, 0, 0.28]} viewMode={viewMode}>
        <mesh ref={meshRef} material={meshMat} position={[meshStartX + meshMaxW / 2, 0, 0]}>
          <planeGeometry args={[meshMaxW, FH]} />
        </mesh>
      </APart>

      {/* HANDLE */}
      <APart name="Barre de charge à poignée pliante" base={[0, 0, 0.012]}
        explode={[1.0, 0, 0.5]} labelOff={[0.18, 0, 0]} viewMode={viewMode}>
        <mesh ref={handleRef} material={mats.handleMat}
          position={[meshStartX + meshMaxW + 0.025, 0, 0]}>
          <boxGeometry args={[0.040, FH * 0.80, 0.038]} />
        </mesh>
      </APart>
    </group>
  );
}


// ELBA — Fixed flat panel, thin frame, no moving parts
// ═══════════════════════════════════════════════════════════════════════════════
function ElbaModel({ openPct: _openPct, viewMode }: ModelProps) {
  const mats = useSharedMaterials();

  const FW = 1.80;
  const FH = 2.00;
  const PW = 0.055;
  const PD = 0.040;

  const [fcr3, fcg3, fcb3] = useContext(FrameColorCtx);
  const frameMat = useMemo(() => makeAlumMat(fcr3, fcg3, fcb3), [fcr3, fcg3, fcb3]);
  const meshMat = useMeshScreenMat();

  return (
    <group>
      <APart name="Châssis aluminium supérieur" base={[0, FH / 2 - PW / 2, 0]}
        explode={[0, 1.1, 0]} labelOff={[0, 0.20, 0]} viewMode={viewMode}>
        <mesh material={frameMat}><boxGeometry args={[FW, PW, PD]} /></mesh>
      </APart>
      <APart name="Châssis inférieur" base={[0, -FH / 2 + PW / 2, 0]}
        explode={[0, -1.1, 0]} viewMode={viewMode} label={false}>
        <mesh material={frameMat}><boxGeometry args={[FW, PW, PD]} /></mesh>
      </APart>
      <APart name="Châssis gauche" base={[-FW / 2 + PW / 2, 0, 0]}
        explode={[-1.1, 0, 0]} viewMode={viewMode} label={false}>
        <mesh material={frameMat}><boxGeometry args={[PW, FH - PW * 2, PD]} /></mesh>
      </APart>
      <APart name="Châssis droit" base={[FW / 2 - PW / 2, 0, 0]}
        explode={[1.1, 0, 0]} viewMode={viewMode} label={false}>
        <mesh material={frameMat}><boxGeometry args={[PW, FH - PW * 2, PD]} /></mesh>
      </APart>

      {/* Perimeter brush seal */}
      <APart name="Joint-brosse périmétral" base={[0, 0, -0.005]}
        explode={[0, 0, -0.9]} viewMode={viewMode} label={false}>
        <mesh material={mats.sealMat} position={[0, FH / 2 - PW - 0.004, 0]}>
          <boxGeometry args={[FW - PW * 2, 0.008, 0.006]} />
        </mesh>
        <mesh material={mats.sealMat} position={[0, -FH / 2 + PW + 0.004, 0]}>
          <boxGeometry args={[FW - PW * 2, 0.008, 0.006]} />
        </mesh>
        <mesh material={mats.sealMat} position={[-FW / 2 + PW + 0.004, 0, 0]}>
          <boxGeometry args={[0.008, FH - PW * 2, 0.006]} />
        </mesh>
        <mesh material={mats.sealMat} position={[FW / 2 - PW - 0.004, 0, 0]}>
          <boxGeometry args={[0.008, FH - PW * 2, 0.006]} />
        </mesh>
      </APart>

      {/* Fixed mesh */}
      <APart name="Maille fixe — fibre de verre PVC" base={[0, 0, 0.005]}
        explode={[0, 0, 1.1]} labelOff={[0, 0, 0.26]} viewMode={viewMode}>
        <mesh material={meshMat}><planeGeometry args={[FW - PW * 2, FH - PW * 2]} /></mesh>
      </APart>

      {/* Wall mounting brackets */}
      <APart name="Fixations murales en nylon" base={[0, 0, 0]}
        explode={[0, 0, -1.1]} labelOff={[0, 1.15, -0.26]} viewMode={viewMode}>
        {([
          [-FW / 2 + 0.032, FH / 2 - 0.032],
          [FW / 2 - 0.032, FH / 2 - 0.032],
          [-FW / 2 + 0.032, -FH / 2 + 0.032],
          [FW / 2 - 0.032, -FH / 2 + 0.032],
        ] as [number, number][]).map(([x, y], i) => (
          <mesh key={i} material={mats.darkMat} position={[x, y, 0.052]}>
            <boxGeometry args={[0.040, 0.060, 0.068]} />
          </mesh>
        ))}
      </APart>
    </group>
  );
}

// ─── GROUND SHADOW ────────────────────────────────────────────────────────────
function GroundShadow({ productId }: { productId: string }) {
  const cfg: Record<string, { y: number; sx: number; sz: number }> = {
    'colibri-50': { y: -0.86, sx: 1.9, sz: 0.80 },
    'sidney-50': { y: -1.42, sx: 1.5, sz: 0.80 },
    'sidney-50-ac': { y: -1.36, sx: 2.6, sz: 0.80 },
    'elba': { y: -1.06, sx: 1.6, sz: 0.80 },
  };
  const { y, sx, sz } = cfg[productId] ?? { y: -1.20, sx: 1.8, sz: 0.80 };
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} scale={[sx, sz, 1]}>
      <circleGeometry args={[1, 32]} />
      <meshBasicMaterial color="#AAAAAA" transparent opacity={0.15} />
    </mesh>
  );
}

// ─── SCENE ────────────────────────────────────────────────────────────────────
function Scene({ productId, openPct, viewMode }: ModelProps & { productId: string }) {
  return (
    <group>
      {/* Studio 3-point lighting — matches Grifo Flex product photos */}
      <ambientLight intensity={0.60} color="#F2F4FF" />
      <directionalLight position={[4, 8, 6]} intensity={2.30} color="#FFFFFF" castShadow
        shadow-mapSize={[2048, 2048]} shadow-camera-near={0.5} shadow-camera-far={30} />
      <directionalLight position={[-4, 3, 3]} intensity={0.65} color="#E8F0FF" />
      <directionalLight position={[1, -1, -5]} intensity={0.30} color="#FFFFFF" />
      <pointLight position={[0, -3, 3]} intensity={0.20} color="#F8F8FF" />
      <GroundShadow productId={productId} />
      {productId === 'colibri-50' && <ColibriModel openPct={openPct} viewMode={viewMode} />}
      {productId === 'sidney-50' && <SidneyModel openPct={openPct} viewMode={viewMode} />}
      {productId === 'sidney-50-ac' && <SidneyACModel openPct={openPct} viewMode={viewMode} />}
      {productId === 'elba' && <ElbaModel openPct={openPct} viewMode={viewMode} />}
    </group>
  );
}

// ─── CAMERA CONFIG ────────────────────────────────────────────────────────────
const CAM: Record<string, {
  pos: [number, number, number];
  target: [number, number, number];
  fov: number;
}> = {
  'colibri-50': { pos: [0.6, 0.2, 5.8], target: [0, 0.35, 0], fov: 32 },
  'sidney-50': { pos: [1.5, 0.8, 4.8], target: [0, 0.00, 0], fov: 46 },
  'sidney-50-ac': { pos: [2.2, 1.6, 6.0], target: [0, 0.00, 0], fov: 50 },
  'elba': { pos: [1.2, 0.8, 3.8], target: [0, 0.00, 0], fov: 46 },
};

// ─── ERROR BOUNDARY ───────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: string | null }
> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) { return { error: e.message }; }
  render() {
    if (this.state.error) return (
      <div style={{
        color: 'red', padding: 24, background: 'white',
        position: 'fixed', top: 0, left: 0, zIndex: 99999, fontFamily: 'monospace',
      }}>
        3D Error: {this.state.error}
      </div>
    );
    return this.props.children;
  }
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export default function ProductViewer3D({
  productId, productName, onClose,
}: {
  productId: string;
  productName: string;
  onClose: () => void;
}) {
  const [openPct, setOpenPct] = useState(0);
  const [visible, setVisible] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('assembled');
  const [frameColor, setFrameColor] = useState<[number, number, number]>([0.985, 0.982, 0.978]);
  const orbitRef = useRef<any>(null);
  const isElba = productId === 'elba';
  const cam = CAM[productId] ?? CAM['colibri-50'];

  const FRAME_PRESETS: { name: string; hex: string; rgb: [number, number, number] }[] = [
    { name: 'Blanc RAL 9010', hex: '#F4F1EC', rgb: [0.985, 0.982, 0.978] },
    { name: 'Gris anthracite', hex: '#5C5C5C', rgb: [0.360, 0.360, 0.360] },
    { name: 'Bronze', hex: '#9B7340', rgb: [0.608, 0.451, 0.251] },
    { name: 'Noir mat', hex: '#2A2A2A', rgb: [0.165, 0.165, 0.165] },
    { name: 'Vert olive', hex: '#5C7A4E', rgb: [0.361, 0.478, 0.306] },
  ];

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    window.dispatchEvent(new CustomEvent('toggle-overlay', { detail: true }));
    return () => {
      document.body.style.overflow = '';
      window.dispatchEvent(new CustomEvent('toggle-overlay', { detail: false }));
    };
  }, []);

  const btnPrimary: React.CSSProperties = {
    background: '#1A5DA8', color: 'white', border: 'none', borderRadius: 8,
    padding: '10px 20px', fontSize: 14, fontWeight: 600,
    fontFamily: 'Space Grotesk,sans-serif', cursor: 'pointer', transition: 'all .2s',
  };
  const btnSecondary: React.CSSProperties = {
    background: 'white', color: '#1A5DA8', border: '1.5px solid #1A5DA8',
    borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', transition: 'all .2s',
  };
  const btnGhost: React.CSSProperties = {
    background: 'transparent', color: '#7A8FA6',
    border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8,
    padding: '10px 18px', fontSize: 13, cursor: 'pointer', transition: 'all .2s',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      opacity: visible ? 1 : 0, transition: 'opacity 300ms ease',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* TOP BAR */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 32px', pointerEvents: 'none',
      }}>
        <div style={{
          color: '#0D1B2A', fontSize: 18, fontWeight: 700,
          fontFamily: 'Space Grotesk,sans-serif',
          background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(8px)',
          padding: '6px 14px', borderRadius: 8, pointerEvents: 'auto',
        }}>
          {productName}
        </div>
        <button
          onClick={onClose}
          style={{
            width: 40, height: 40, borderRadius: '50%', border: 'none',
            background: '#0D1B2A', color: 'white', fontSize: 18, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)', pointerEvents: 'auto',
            transition: 'background .2s',
          }}
          onMouseOver={e => (e.currentTarget.style.background = '#1A5DA8')}
          onMouseOut={e => (e.currentTarget.style.background = '#0D1B2A')}
        >✕</button>
      </div>

      {/* 3D CANVAS */}
      <div style={{ flex: 1 }}>
        <ErrorBoundary>
          <FrameColorCtx.Provider value={frameColor}>
            <Canvas
              camera={{ position: cam.pos, fov: cam.fov }}
              onCreated={({ gl }) => {
                gl.setClearColor('#E4E6EA', 1);
                gl.toneMapping = THREE.ACESFilmicToneMapping;
                gl.toneMappingExposure = 1.05;
              }}
              style={{ background: '#E4E6EA' }}
              shadows
            >
              <Scene productId={productId} openPct={openPct} viewMode={viewMode} />
              <OrbitControls
                ref={orbitRef}
                enableDamping
                dampingFactor={0.06}
                minDistance={2}
                maxDistance={14}
                target={cam.target}
              />
            </Canvas>
          </FrameColorCtx.Provider>
        </ErrorBoundary>
      </div>

      {/* BOTTOM CONTROLS */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
        background: 'rgba(13,27,42,0.82)', backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,255,255,0.10)',
        padding: '16px 32px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 14,
      }}>
        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {viewMode === 'assembled' ? (
            <>
              {!isElba && (
                <button
                  style={btnPrimary}
                  onMouseEnter={e => (e.currentTarget.style.background = '#0F3F78')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#1A5DA8')}
                  onClick={() => setOpenPct(p => p > 50 ? 0 : 100)}
                >
                  {openPct > 50 ? 'Fermer la moustiquaire' : 'Ouvrir la moustiquaire'}
                </button>
              )}
              <button
                style={btnSecondary}
                onMouseEnter={e => (e.currentTarget.style.background = '#EEF4FF')}
                onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                onClick={() => setViewMode('exploded')}
              >
                ❖ Vue éclatée
              </button>
            </>
          ) : (
            <button
              style={btnSecondary}
              onMouseEnter={e => (e.currentTarget.style.background = '#EEF4FF')}
              onMouseLeave={e => (e.currentTarget.style.background = 'white')}
              onClick={() => setViewMode('assembled')}
            >
              ❖ Assembler
            </button>
          )}
          <button
            style={btnGhost}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.10)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#7A8FA6';
            }}
            onClick={() => {
              orbitRef.current?.reset();
              setOpenPct(0);
              setViewMode('assembled');
            }}
          >
            ↺ Réinitialiser la vue
          </button>
        </div>

        {/* Frame color picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', fontWeight: 600, letterSpacing: '1px', fontFamily: 'Space Grotesk,sans-serif', textTransform: 'uppercase' }}>
            Couleur cadre :
          </span>
          {FRAME_PRESETS.map(p => {
            const isActive = frameColor[0] === p.rgb[0];
            return (
              <button
                key={p.name}
                title={p.name}
                onClick={() => setFrameColor(p.rgb)}
                style={{
                  width: '28px', height: '28px', borderRadius: '50%', border: isActive ? '3px solid #4A9EDB' : '2px solid rgba(255,255,255,0.3)',
                  background: p.hex, cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: isActive ? '0 0 0 2px rgba(74,158,219,0.5)' : 'none',
                  transform: isActive ? 'scale(1.2)' : 'scale(1)',
                  flexShrink: 0,
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.transform = 'scale(1.1)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.transform = 'scale(1)'; }}
              />
            );
          })}
          <span style={{ color: 'rgba(255,255,255,0.50)', fontSize: '11px', fontFamily: 'DM Sans,sans-serif' }}>
            {FRAME_PRESETS.find(p => p.rgb[0] === frameColor[0])?.name}
          </span>
        </div>

        {/* Elba notice */}
        {isElba && viewMode === 'assembled' && (
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 600 }}>
            Panneau fixe — aucun mécanisme mobile
          </div>
        )}

        {/* Opening slider */}
        {!isElba && viewMode === 'assembled' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            width: '100%', maxWidth: 520,
          }}>
            <span style={{
              color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 600, minWidth: 40,
            }}>Fermé</span>
            <input
              type="range" min={0} max={100} value={openPct}
              onChange={e => setOpenPct(Number(e.target.value))}
              style={{ flex: 1, accentColor: '#4A9EDB', cursor: 'pointer', height: 4 }}
            />
            <span style={{
              color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 600,
              minWidth: 40, textAlign: 'right',
            }}>Ouvert</span>
            <span style={{
              color: '#4A9EDB', fontSize: 14, fontWeight: 700,
              minWidth: 42, textAlign: 'right',
            }}>{openPct}%</span>
          </div>
        )}
      </div>
    </div>
  );
}