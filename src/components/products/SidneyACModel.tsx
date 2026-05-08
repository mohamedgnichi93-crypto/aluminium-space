import React, { useRef, useMemo, useContext } from 'react';
import { FrameColorCtx } from '../../context/FrameColorContext';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

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
          data[idx] = 22; data[idx + 1] = 25; data[idx + 2] = 28; data[idx + 3] = 248;
        } else {
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

export default function SidneyACModel({ openPct, viewMode }: ModelProps) {
  const pct = openPct / 100;
  const mats = useSharedMaterials();

  const FH = 2.40;
  const RW = 0.07;
  const RD = 0.10;
  const CW = 0.16;
  const CD = 0.10;

  const [fcr, fcg, fcb] = useContext(FrameColorCtx);
  const railMat = useMemo(() => makeAlumMat(fcr, fcg, fcb), [fcr, fcg, fcb]);
  const cassetteMat = useMemo(() => makeAlumMat(fcr * 0.960, fcg * 0.957, fcb * 0.956), [fcr, fcg, fcb]);
  const meshMat = useMeshScreenMat();

  const interiorW = 2.80;
  const halfW = interiorW / 2;

  const leftCasX = -(halfW + CW / 2);
  const rightCasX = (halfW + CW / 2);
  const outerW = interiorW + CW * 2;

  const lMeshRef = useRef<THREE.Mesh>(null);
  const rMeshRef = useRef<THREE.Mesh>(null);
  const lHndlRef = useRef<THREE.Mesh>(null);
  const rHndlRef = useRef<THREE.Mesh>(null);
  const cBarRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const sX = Math.max(0.001, 1 - pct);
    if (lMeshRef.current) {
      lMeshRef.current.scale.x = sX;
      lMeshRef.current.position.x = -halfW + halfW * sX / 2;
    }
    if (rMeshRef.current) {
      rMeshRef.current.scale.x = sX;
      rMeshRef.current.position.x = halfW - halfW * sX / 2;
    }
    if (lHndlRef.current) {
      lHndlRef.current.position.x = -halfW + halfW * sX;
    }
    if (rHndlRef.current) {
      rHndlRef.current.position.x = halfW - halfW * sX;
    }
    if (cBarRef.current) {
      cBarRef.current.visible = pct < 0.04;
    }
  });

  return (
    <group>
      <APart name="Caisson gauche — 45mm" base={[leftCasX, 0, 0]}
        explode={[-2.2, 0, 0]} labelOff={[-0.28, 0, 0]} viewMode={viewMode}>
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

      <APart name="Caisson droit — 45mm" base={[rightCasX, 0, 0]}
        explode={[2.2, 0, 0]} labelOff={[0.28, 0, 0]} viewMode={viewMode}>
        <mesh material={cassetteMat}>
          <boxGeometry args={[CW, FH + 0.14, CD]} />
        </mesh>
        <mesh material={mats.lipMat} position={[-CW / 2 - 0.008, 0, 0]}>
          <boxGeometry args={[0.016, FH * 0.94, 0.020]} />
        </mesh>
        <mesh material={mats.sealMat} position={[-CW / 2 - 0.003, 0, 0.008]}>
          <boxGeometry args={[0.006, FH * 0.92, 0.005]} />
        </mesh>
        <mesh material={mats.sealMat} position={[-CW / 2 - 0.003, 0, -0.008]}>
          <boxGeometry args={[0.006, FH * 0.92, 0.005]} />
        </mesh>
      </APart>

      <APart name="Rail supérieur" base={[0, FH / 2 + RW / 2, 0]}
        explode={[0, 1.4, 0]} labelOff={[0, 0.22, 0]} viewMode={viewMode}>
        <mesh material={railMat}><boxGeometry args={[outerW, RW, RD]} /></mesh>
      </APart>

      <APart name="Rail inférieur" base={[0, -FH / 2 - RW / 2, 0]}
        explode={[0, -1.4, 0]} viewMode={viewMode} label={false}>
        <mesh material={railMat}><boxGeometry args={[outerW, RW, RD]} /></mesh>
      </APart>

      <APart name="Équerres de fixation" base={[0, 0, 0.04]}
        explode={[0, 0, -0.9]} viewMode={viewMode} label={false}>
        {([
          [leftCasX + CW / 2, FH / 2],
          [leftCasX + CW / 2, -FH / 2],
          [rightCasX - CW / 2, FH / 2],
          [rightCasX - CW / 2, -FH / 2],
        ] as [number, number][]).map(([x, y], i) => (
          <mesh key={i} material={mats.darkMat} position={[x, y, 0]}>
            <boxGeometry args={[0.045, 0.045, 0.055]} />
          </mesh>
        ))}
      </APart>

      <APart name="Pieds réglables" base={[0, 0, 0]}
        explode={[0, -1.6, 0]} viewMode={viewMode} label={false}>
        <AdjFoot x={leftCasX} y={-FH / 2 - 0.07 - 0.044} mats={mats} />
        <AdjFoot x={rightCasX} y={-FH / 2 - 0.07 - 0.044} mats={mats} />
      </APart>

      <APart name="Barre centrale — joints magnétiques" base={[0, 0, 0.007]}
        explode={[0, 0, 1.3]} labelOff={[0, 0.28, 0.12]} viewMode={viewMode}>
        <group ref={cBarRef}>
          <mesh material={railMat}><boxGeometry args={[0.050, FH, 0.050]} /></mesh>
          <mesh material={mats.sealMat} position={[-0.030, 0, 0]}>
            <boxGeometry args={[0.007, FH - 0.02, 0.018]} />
          </mesh>
          <mesh material={mats.sealMat} position={[0.030, 0, 0]}>
            <boxGeometry args={[0.007, FH - 0.02, 0.018]} />
          </mesh>
        </group>
      </APart>

      <APart name="Maille gauche" base={[0, 0, 0.005]}
        explode={[0, 0, 1.3]} viewMode={viewMode} label={false}>
        <mesh ref={lMeshRef} material={meshMat} position={[-halfW / 2, 0, 0]}>
          <planeGeometry args={[halfW, FH]} />
        </mesh>
      </APart>

      <APart name="Maille droite" base={[0, 0, 0.005]}
        explode={[0, 0, 1.3]} viewMode={viewMode} label={false}>
        <mesh ref={rMeshRef} material={meshMat} position={[halfW / 2, 0, 0]}>
          <planeGeometry args={[halfW, FH]} />
        </mesh>
      </APart>

      <APart name="Barre de charge gauche" base={[0, 0, 0.014]}
        explode={[-0.7, 0, 0.5]} viewMode={viewMode} label={false}>
        <mesh ref={lHndlRef} material={mats.handleMat}
          position={[-halfW - 0.025, 0, 0]}>
          <boxGeometry args={[0.040, FH * 0.80, 0.038]} />
        </mesh>
      </APart>

      <APart name="Barre de charge droite" base={[0, 0, 0.014]}
        explode={[0.7, 0, 0.5]} viewMode={viewMode} label={false}>
        <mesh ref={rHndlRef} material={mats.handleMat}
          position={[halfW + 0.025, 0, 0]}>
          <boxGeometry args={[0.040, FH * 0.80, 0.038]} />
        </mesh>
      </APart>
    </group>
  );
}
