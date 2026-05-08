import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface ProductVRExperienceProps {
  productId: string;
  productName: string;
  onClose: () => void;
}

interface ProductConfig {
  winW: number;
  winH: number;
  winY: number;
  hasShutter: boolean;
}

// ─── PRODUCT CONFIG ───────────────────────────────────────────────────────────
const PRODUCT_CONFIG: Record<string, ProductConfig> = {
  'colibri-50':   { winW: 1.30, winH: 1.60, winY: 0.82, hasShutter: true  },
  'sidney-50':    { winW: 1.00, winH: 2.22, winY: 0.00, hasShutter: false },
  'sidney-50-ac': { winW: 2.10, winH: 2.22, winY: 0.00, hasShutter: false },
  'elba':         { winW: 1.10, winH: 1.10, winY: 0.82, hasShutter: true  },
};

// ─── TEXTURE HOOKS ────────────────────────────────────────────────────────────
function useMarbleTex(): THREE.CanvasTexture {
  return useMemo(() => {
    const size = 512;
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const ctx = cv.getContext('2d')!;
    ctx.fillStyle = '#f0ede8';
    ctx.fillRect(0, 0, size, size);
    // tile grid lines
    ctx.strokeStyle = 'rgba(180,165,150,0.45)';
    ctx.lineWidth = 1.4;
    const tile = 128;
    for (let x = 0; x <= size; x += tile) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, size); ctx.stroke(); }
    for (let y = 0; y <= size; y += tile) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke(); }
    // marble veins
    ctx.strokeStyle = 'rgba(155,140,128,0.15)';
    ctx.lineWidth = 0.7;
    for (let i = 0; i < 22; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * size, Math.random() * size);
      for (let j = 0; j < 5; j++) ctx.bezierCurveTo(
        Math.random() * size, Math.random() * size,
        Math.random() * size, Math.random() * size,
        Math.random() * size, Math.random() * size,
      );
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(5, 5);
    return tex;
  }, []);
}

function useWallTex(): THREE.CanvasTexture {
  return useMemo(() => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 256;
    const ctx = cv.getContext('2d')!;
    ctx.fillStyle = '#f5f2ee';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1400; i++) {
      ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.022})`;
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 1, 1);
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    return tex;
  }, []);
}

function useSkySurface(): THREE.CanvasTexture {
  return useMemo(() => {
    const w = 512, h = 256;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0.0,  '#3a7bd5');
    grad.addColorStop(0.45, '#6eb4f7');
    grad.addColorStop(0.75, '#b8ddfb');
    grad.addColorStop(1.0,  '#dff0ff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    // subtle haze band near horizon
    const haze = ctx.createLinearGradient(0, h * 0.7, 0, h);
    haze.addColorStop(0, 'rgba(255,250,235,0)');
    haze.addColorStop(1, 'rgba(255,250,200,0.35)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, w, h);
    return new THREE.CanvasTexture(cv);
  }, []);
}

function useMeshGridTex(): THREE.DataTexture {
  return useMemo(() => {
    const size = 512;
    const data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        const xm = x % 32, ym = y % 32;
        const isWire = xm < 2 || ym < 2;
        const isSoft = xm === 2 || ym === 2;
        if (isWire) {
          data[i] = 70; data[i+1] = 70; data[i+2] = 78; data[i+3] = 230;
        } else if (isSoft) {
          data[i] = 100; data[i+1] = 100; data[i+2] = 108; data[i+3] = 80;
        } else {
          data[i] = 160; data[i+1] = 165; data[i+2] = 170; data[i+3] = 12;
        }
      }
    }
    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(9, 9);
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.generateMipmaps = true;
    tex.needsUpdate = true;
    return tex;
  }, []);
}

function useRugTex(): THREE.CanvasTexture {
  return useMemo(() => {
    const size = 256;
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const ctx = cv.getContext('2d')!;
    // base deep navy/teal rug
    ctx.fillStyle = '#1e3a5f';
    ctx.fillRect(0, 0, size, size);
    // geometric pattern - concentric rectangles
    for (let n = 0; n < 5; n++) {
      const m = 10 + n * 22;
      ctx.strokeStyle = n % 2 === 0 ? 'rgba(200,170,100,0.55)' : 'rgba(255,255,255,0.12)';
      ctx.lineWidth = n % 2 === 0 ? 3 : 1;
      ctx.strokeRect(m, m, size - m * 2, size - m * 2);
    }
    // center diamond
    ctx.strokeStyle = 'rgba(200,170,100,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(size / 2, 55); ctx.lineTo(size - 55, size / 2);
    ctx.lineTo(size / 2, size - 55); ctx.lineTo(55, size / 2);
    ctx.closePath(); ctx.stroke();
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 1);
    return tex;
  }, []);
}

// ─── EXTERIOR SCENE ───────────────────────────────────────────────────────────
function ExteriorScene({ winX, winY, winW: _winW, winH }: {
  winX: number; winY: number; winW: number; winH: number;
}) {
  const skyTex = useSkySurface();
  const sunRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (sunRef.current) {
      const t = clock.getElapsedTime();
      const s = 1 + Math.sin(t * 0.6) * 0.04;
      sunRef.current.scale.setScalar(s);
    }
  });

  // Pine tree helper
  const PineTree = ({ x, z, scale }: { x: number; z: number; scale: number }) => {
    const trunkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#5c3d1e', roughness: 0.9 }), []);
    const coneMat  = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2d5a27', roughness: 0.85 }), []);
    return (
      <group position={[x, -4, z]} scale={scale}>
        {/* trunk */}
        <mesh material={trunkMat} position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.08, 0.12, 1.2, 8]} />
        </mesh>
        {/* 3-tier cones */}
        <mesh material={coneMat} position={[0, 2.2, 0]}>
          <coneGeometry args={[0.65, 1.4, 8]} />
        </mesh>
        <mesh material={coneMat} position={[0, 3.0, 0]}>
          <coneGeometry args={[0.50, 1.2, 8]} />
        </mesh>
        <mesh material={coneMat} position={[0, 3.7, 0]}>
          <coneGeometry args={[0.35, 1.0, 8]} />
        </mesh>
      </group>
    );
  };

  const groundMat  = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4a7c3f', roughness: 1 }), []);
  const sunCoreMat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(3.0, 2.8, 1.8) }), []);
  const sunGlowMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(2.0, 1.8, 1.0), transparent: true, opacity: 0.35,
  }), []);

  return (
    <group>
      {/* Sky backdrop */}
      <mesh position={[winX, winY + winH / 2, -9]}>
        <planeGeometry args={[22, 14]} />
        <meshBasicMaterial map={skyTex} />
      </mesh>

      {/* Ground outside */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[winX, winY - 0.8, -9]} material={groundMat}>
        <planeGeometry args={[22, 12]} />
      </mesh>

      {/* Sun */}
      <group position={[winX + 2.5, winY + winH * 0.75, -8.8]}>
        <mesh ref={sunRef} material={sunCoreMat}>
          <circleGeometry args={[0.28, 32]} />
        </mesh>
        <mesh material={sunGlowMat}>
          <circleGeometry args={[0.52, 32]} />
        </mesh>
      </group>

      {/* 5 pine trees at varied positions */}
      <PineTree x={-3.5} z={-6.5} scale={1.0} />
      <PineTree x={-1.8} z={-7.5} scale={1.3} />
      <PineTree x={ 0.8} z={-7.0} scale={0.9} />
      <PineTree x={ 2.5} z={-6.8} scale={1.15} />
      <PineTree x={ 4.2} z={-7.3} scale={1.05} />
    </group>
  );
}

// ─── SHUTTERS ─────────────────────────────────────────────────────────────────
function Shutters({ winX, winY, winW, winH, shutterPct }: {
  winX: number; winY: number; winW: number; winH: number; shutterPct: number;
}) {
  const panelW  = winW / 2;
  const wallZ   = -4.5;
  const pct     = shutterPct;

  const woodMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#6b4423', roughness: 0.8, metalness: 0.02,
  }), []);
  const slat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#7a5030', roughness: 0.75, metalness: 0.02,
  }), []);

  // Left panel: hinge at left edge of opening → rotates from 0 to -PI/2 (outward = positive Z)
  const leftAngle  = pct * (-Math.PI / 2);
  // Right panel: hinge at right edge → rotates from 0 to +PI/2
  const rightAngle = pct * ( Math.PI / 2);

  const ShutterPanel = ({
    side, angle,
  }: { side: 'left' | 'right'; angle: number }) => {
    const hingeX = side === 'left'
      ? winX - winW / 2   // left edge of opening
      : winX + winW / 2;  // right edge of opening

    return (
      <group position={[hingeX, winY + winH / 2, wallZ + 0.06]}>
        <group rotation={[0, angle, 0]}>
          {/* Panel body — pivot at X=0, panel extends right for left / left for right */}
          <mesh
            material={woodMat}
            position={[side === 'left' ? panelW / 2 : -panelW / 2, 0, 0]}
            castShadow
          >
            <boxGeometry args={[panelW, winH, 0.038]} />
          </mesh>
          {/* 8 horizontal louver slats */}
          {Array.from({ length: 8 }).map((_, i) => {
            const slotY = -winH / 2 + winH / 9 * (i + 1);
            return (
              <mesh
                key={i}
                material={slat}
                position={[side === 'left' ? panelW / 2 : -panelW / 2, slotY, 0.022]}
                castShadow
              >
                <boxGeometry args={[panelW * 0.92, 0.028, 0.009]} />
              </mesh>
            );
          })}
        </group>
      </group>
    );
  };

  return (
    <group>
      <ShutterPanel side="left"  angle={leftAngle}  />
      <ShutterPanel side="right" angle={rightAngle} />
    </group>
  );
}

// ─── ROOM ─────────────────────────────────────────────────────────────────────
function Room({ winX, winY, winW, winH }: {
  winX: number; winY: number; winW: number; winH: number;
}) {
  const floorTex = useMarbleTex();
  const wallTex  = useWallTex();
  const rugTex   = useRugTex();

  const RW = 8, RD = 9, RH = 3.1;
  const wallZ = -RD / 2;     // = -4.5

  const wallMat    = useMemo(() => new THREE.MeshStandardMaterial({ map: wallTex,  roughness: 0.92, metalness: 0 }), [wallTex]);
  const floorMat   = useMemo(() => new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.50, metalness: 0 }), [floorTex]);
  const ceilMat    = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95 }), []);
  const moldingMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e8e4de', roughness: 0.85 }), []);
  const woodMat    = useMemo(() => new THREE.MeshStandardMaterial({ color: '#5c3d1e', roughness: 0.70, metalness: 0.02 }), []);
  const rugMat     = useMemo(() => new THREE.MeshStandardMaterial({ map: rugTex, roughness: 0.95 }), [rugTex]);

  // TV screen emissive texture
  const tvScreenMat = useMemo(() => {
    const cv = document.createElement('canvas');
    cv.width = 320; cv.height = 180;
    const ctx = cv.getContext('2d')!;
    const g = ctx.createLinearGradient(0, 0, 320, 180);
    g.addColorStop(0, '#0a1628'); g.addColorStop(0.5, '#0d1f3c'); g.addColorStop(1, '#091422');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 320, 180);
    // subtle logo glow
    ctx.fillStyle = 'rgba(26,93,168,0.55)';
    ctx.beginPath(); ctx.arc(160, 90, 38, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('GRIFO FLEX', 160, 90);
    const tex = new THREE.CanvasTexture(cv);
    return new THREE.MeshStandardMaterial({
      color: '#000000', emissive: '#102244', emissiveMap: tex, emissiveIntensity: 1.4, roughness: 0.1, metalness: 0.7,
    });
  }, []);

  const darkNavyMat   = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1a2744', roughness: 0.85, metalness: 0 }), []);
  const cushionMat    = useMemo(() => new THREE.MeshStandardMaterial({ color: '#243255', roughness: 0.90, metalness: 0 }), []);
  const legMat        = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3d2b1a', roughness: 0.7, metalness: 0.05 }), []);
  const glassTopMat   = useMemo(() => new THREE.MeshStandardMaterial({ color: '#9fb8c8', metalness: 0.2, roughness: 0.0, transparent: true, opacity: 0.38 }), []);
  const plantStemMat  = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3d6b2f', roughness: 0.9 }), []);
  const plantLeafMat  = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2f7d32', roughness: 0.85, side: THREE.DoubleSide }), []);
  const lampBodyMat   = useMemo(() => new THREE.MeshStandardMaterial({ color: '#c8b88a', roughness: 0.5, metalness: 0.3 }), []);
  const lampShadeMat  = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f5e8cc', roughness: 0.85, side: THREE.DoubleSide }), []);
  const lampBaseMat   = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8a7050', roughness: 0.6, metalness: 0.4 }), []);
  const tvFrameMat    = useMemo(() => new THREE.MeshStandardMaterial({ color: '#111111', roughness: 0.2, metalness: 0.7 }), []);

  return (
    <group>
      {/* ─ FLOOR ─ */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[RW, RD]} />
        <primitive object={floorMat} attach="material" />
      </mesh>

      {/* ─ CEILING ─ */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, RH, 0]}>
        <planeGeometry args={[RW, RD]} />
        <primitive object={ceilMat} attach="material" />
      </mesh>

      {/* ─ BACK WALL (around window opening) ─ */}
      {/* above window */}
      <mesh position={[winX, winY + winH + (RH - winY - winH) / 2, wallZ]} receiveShadow>
        <planeGeometry args={[RW, RH - winY - winH]} />
        <primitive object={wallMat} attach="material" />
      </mesh>
      {/* below window (sill area) */}
      {winY > 0 && (
        <mesh position={[winX, winY / 2, wallZ]} receiveShadow>
          <planeGeometry args={[RW, winY]} />
          <primitive object={wallMat} attach="material" />
        </mesh>
      )}
      {/* left of window */}
      <mesh
        position={[winX - winW / 2 - (RW / 2 + winX - winW / 2) / 2, winY + winH / 2, wallZ]}
        receiveShadow
      >
        <planeGeometry args={[RW / 2 + winX - winW / 2, winH]} />
        <primitive object={wallMat} attach="material" />
      </mesh>
      {/* right of window */}
      <mesh
        position={[winX + winW / 2 + (RW / 2 - winX - winW / 2) / 2, winY + winH / 2, wallZ]}
        receiveShadow
      >
        <planeGeometry args={[RW / 2 - winX - winW / 2, winH]} />
        <primitive object={wallMat} attach="material" />
      </mesh>

      {/* ─ LEFT WALL ─ */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-RW / 2, RH / 2, 0]} receiveShadow>
        <planeGeometry args={[RD, RH]} />
        <primitive object={wallMat} attach="material" />
      </mesh>

      {/* ─ RIGHT WALL ─ */}
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[RW / 2, RH / 2, 0]} receiveShadow>
        <planeGeometry args={[RD, RH]} />
        <primitive object={wallMat} attach="material" />
      </mesh>

      {/* ─ FRONT WALL (behind camera) ─ */}
      <mesh rotation={[0, Math.PI, 0]} position={[0, RH / 2, RD / 2]}>
        <planeGeometry args={[RW, RH]} />
        <primitive object={wallMat} attach="material" />
      </mesh>

      {/* ─ WINDOW / DOOR FRAME (dark wood) ─ */}
      {winY === 0 ? (
        /* DOOR FRAME — jambs floor-to-lintel, threshold at ground, no interior sill */
        <>
          {/* lintel */}
          <mesh position={[winX, winH + 0.080, wallZ + 0.11]} castShadow>
            <boxGeometry args={[winW + 0.32, 0.160, 0.22]} />
            <primitive object={woodMat} attach="material" />
          </mesh>
          {/* left jamb */}
          <mesh position={[winX - winW / 2 - 0.085, winH / 2, wallZ + 0.11]} castShadow>
            <boxGeometry args={[0.155, winH + 0.160, 0.22]} />
            <primitive object={woodMat} attach="material" />
          </mesh>
          {/* right jamb */}
          <mesh position={[winX + winW / 2 + 0.085, winH / 2, wallZ + 0.11]} castShadow>
            <boxGeometry args={[0.155, winH + 0.160, 0.22]} />
            <primitive object={woodMat} attach="material" />
          </mesh>
          {/* threshold / floor sill */}
          <mesh position={[winX, 0.022, wallZ + 0.13]} castShadow>
            <boxGeometry args={[winW + 0.06, 0.044, 0.26]} />
            <primitive object={woodMat} attach="material" />
          </mesh>
        </>
      ) : (
        /* WINDOW FRAME — with projecting bottom sill */
        <>
          {/* top */}
          <mesh position={[winX, winY + winH + 0.055, wallZ + 0.09]} castShadow>
            <boxGeometry args={[winW + 0.22, 0.11, 0.17]} />
            <primitive object={woodMat} attach="material" />
          </mesh>
          {/* bottom sill */}
          <mesh position={[winX, winY - 0.055, wallZ + 0.11]} castShadow>
            <boxGeometry args={[winW + 0.22, 0.11, 0.25]} />
            <primitive object={woodMat} attach="material" />
          </mesh>
          {/* left jamb */}
          <mesh position={[winX - winW / 2 - 0.06, winY + winH / 2, wallZ + 0.09]} castShadow>
            <boxGeometry args={[0.11, winH + 0.11, 0.17]} />
            <primitive object={woodMat} attach="material" />
          </mesh>
          {/* right jamb */}
          <mesh position={[winX + winW / 2 + 0.06, winY + winH / 2, wallZ + 0.09]} castShadow>
            <boxGeometry args={[0.11, winH + 0.11, 0.17]} />
            <primitive object={woodMat} attach="material" />
          </mesh>
        </>
      )}

      {/* ─ BASEBOARD MOLDING ─ */}
      <mesh position={[0, 0.057, wallZ + 0.008]}>
        <boxGeometry args={[RW, 0.115, 0.018]} />
        <primitive object={moldingMat} attach="material" />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-RW / 2 + 0.008, 0.057, 0]}>
        <boxGeometry args={[RD, 0.115, 0.018]} />
        <primitive object={moldingMat} attach="material" />
      </mesh>
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[RW / 2 - 0.008, 0.057, 0]}>
        <boxGeometry args={[RD, 0.115, 0.018]} />
        <primitive object={moldingMat} attach="material" />
      </mesh>

      {/* ─ CEILING MOLDING ─ */}
      <mesh position={[0, RH - 0.048, wallZ + 0.008]}>
        <boxGeometry args={[RW, 0.095, 0.014]} />
        <primitive object={moldingMat} attach="material" />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-RW / 2 + 0.008, RH - 0.048, 0]}>
        <boxGeometry args={[RD, 0.095, 0.014]} />
        <primitive object={moldingMat} attach="material" />
      </mesh>
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[RW / 2 - 0.008, RH - 0.048, 0]}>
        <boxGeometry args={[RD, 0.095, 0.014]} />
        <primitive object={moldingMat} attach="material" />
      </mesh>

      {/* ─ RECESSED CEILING SPOTS ─ */}
      {([-2, 0, 2] as number[]).map((lx, i) => (
        <group key={i} position={[lx, RH - 0.01, -1.5]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.075, 16]} />
            <meshBasicMaterial color={new THREE.Color(4.5, 4.0, 3.2)} />
          </mesh>
          <pointLight
            position={[0, -0.06, 0]}
            intensity={2.2}
            distance={4.5}
            color="#fff5e0"
            decay={2}
            castShadow
          />
        </group>
      ))}

      {/* ─ DECORATIVE RUG ─ */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.5, 0.003, 1.4]} receiveShadow>
        <planeGeometry args={[3.0, 2.0]} />
        <primitive object={rugMat} attach="material" />
      </mesh>

      {/* ─ SOFA (dark navy, 2.1m, at (1.5, 0, 2.0)) ─ */}
      <group position={[1.5, 0, 2.0]}>
        {/* base */}
        <mesh material={darkNavyMat} position={[0, 0.22, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.1, 0.44, 0.90]} />
        </mesh>
        {/* back */}
        <mesh material={darkNavyMat} position={[0, 0.62, -0.40]} castShadow receiveShadow>
          <boxGeometry args={[2.1, 0.76, 0.18]} />
        </mesh>
        {/* left arm */}
        <mesh material={darkNavyMat} position={[-0.96, 0.52, -0.05]} castShadow>
          <boxGeometry args={[0.18, 0.56, 0.88]} />
        </mesh>
        {/* right arm */}
        <mesh material={darkNavyMat} position={[0.96, 0.52, -0.05]} castShadow>
          <boxGeometry args={[0.18, 0.56, 0.88]} />
        </mesh>
        {/* 3 seat cushions */}
        {([-0.65, 0, 0.65] as number[]).map((cx, i) => (
          <mesh key={i} material={cushionMat} position={[cx, 0.50, -0.08]} castShadow>
            <boxGeometry args={[0.62, 0.14, 0.74]} />
          </mesh>
        ))}
        {/* 3 back cushions */}
        {([-0.65, 0, 0.65] as number[]).map((cx, i) => (
          <mesh key={i} material={cushionMat} position={[cx, 0.82, -0.36]} castShadow>
            <boxGeometry args={[0.58, 0.40, 0.12]} />
          </mesh>
        ))}
        {/* legs */}
        {([-0.95, 0.95] as number[]).flatMap((lx) =>
          ([-0.38, 0.38] as number[]).map((lz, j) => (
            <mesh key={`${lx}-${lz}-${j}`} material={legMat} position={[lx, 0.06, lz]} castShadow>
              <boxGeometry args={[0.07, 0.12, 0.07]} />
            </mesh>
          ))
        )}
        {/* decorative throw pillow */}
        <mesh material={new THREE.MeshStandardMaterial({ color: '#c8a060', roughness: 0.9 })} position={[-0.6, 0.66, -0.12]} rotation={[0, 0.3, 0.18]} castShadow>
          <boxGeometry args={[0.38, 0.32, 0.10]} />
        </mesh>
      </group>

      {/* ─ COFFEE TABLE at (1.5, 0, 0.8) ─ */}
      <group position={[1.5, 0, 0.8]}>
        {/* glass top */}
        <mesh material={glassTopMat} position={[0, 0.42, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.05, 0.025, 0.60]} />
        </mesh>
        {/* metal frame */}
        {[[-0.46, -0.26], [-0.46, 0.26], [0.46, -0.26], [0.46, 0.26]].map(([fx, fz], i) => (
          <mesh key={i} material={legMat} position={[fx, 0.20, fz]} castShadow>
            <cylinderGeometry args={[0.022, 0.022, 0.40, 8]} />
          </mesh>
        ))}
        {/* under-shelf */}
        <mesh material={woodMat} position={[0, 0.04, 0]}>
          <boxGeometry args={[0.90, 0.022, 0.50]} />
        </mesh>
        {/* decorative items on table */}
        <mesh material={new THREE.MeshStandardMaterial({ color: '#1e3a5f', roughness: 0.3, metalness: 0.5 })} position={[-0.3, 0.46, 0.08]}>
          <cylinderGeometry args={[0.045, 0.055, 0.14, 12]} />
        </mesh>
        <mesh material={new THREE.MeshStandardMaterial({ color: '#8b4513', roughness: 0.7 })} position={[0.2, 0.46, -0.05]}>
          <boxGeometry args={[0.22, 0.028, 0.16]} />
        </mesh>
      </group>

      {/* ─ TV on left wall at (-3.9, 1.5, 0.5) rotated 90° ─ */}
      <group position={[-3.9, 1.5, 0.5]} rotation={[0, Math.PI / 2, 0]}>
        {/* frame */}
        <mesh material={tvFrameMat} position={[0, 0, 0]} castShadow>
          <boxGeometry args={[1.40, 0.80, 0.055]} />
        </mesh>
        {/* screen */}
        <mesh material={tvScreenMat} position={[0, 0, 0.030]}>
          <planeGeometry args={[1.32, 0.73]} />
        </mesh>
        {/* mount bracket */}
        <mesh material={tvFrameMat} position={[0, -0.44, -0.10]}>
          <boxGeometry args={[0.22, 0.08, 0.25]} />
        </mesh>
        <mesh material={tvFrameMat} position={[0, -0.50, -0.22]}>
          <boxGeometry args={[0.08, 0.22, 0.06]} />
        </mesh>
      </group>

      {/* ─ CORNER PLANT at (-3.0, 0, -3.0) ─ */}
      <group position={[-3.0, 0, -3.0]}>
        {/* pot */}
        <mesh material={new THREE.MeshStandardMaterial({ color: '#7d5533', roughness: 0.8 })} position={[0, 0.22, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.17, 0.44, 12]} />
        </mesh>
        {/* soil */}
        <mesh material={new THREE.MeshStandardMaterial({ color: '#3d2b1a', roughness: 1 })} position={[0, 0.44, 0]}>
          <cylinderGeometry args={[0.21, 0.21, 0.02, 12]} />
        </mesh>
        {/* main stem */}
        <mesh material={plantStemMat} position={[0, 0.85, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.05, 0.82, 8]} />
        </mesh>
        {/* large leaves */}
        {([
          [0.3, 0.95, 0,   0, 0.3],
          [-0.35, 1.1, 0.1, 0, -0.4],
          [0.15, 1.3, -0.2, 0, 0.2],
          [-0.2, 1.0, -0.15, 0.2, -0.25],
          [0.28, 1.2, 0.18, -0.15, 0.35],
        ] as [number, number, number, number, number][]).map(([lx, ly, lz, rx, ry], i) => (
          <mesh key={i} material={plantLeafMat} position={[lx, ly, lz]} rotation={[rx, ry, 0.3]} castShadow>
            <planeGeometry args={[0.55, 0.22]} />
          </mesh>
        ))}
      </group>

      {/* ─ FLOOR LAMP at (3.2, 0, 1.8) ─ */}
      <group position={[3.2, 0, 1.8]}>
        <mesh material={lampBaseMat} position={[0, 0.04, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.18, 0.08, 16]} />
        </mesh>
        <mesh material={lampBodyMat} position={[0, 0.90, 0]} castShadow>
          <cylinderGeometry args={[0.022, 0.022, 1.68, 8]} />
        </mesh>
        {/* shade */}
        <mesh material={lampShadeMat} position={[0, 1.82, 0]} castShadow>
          <coneGeometry args={[0.24, 0.38, 16, 1, true]} />
        </mesh>
        {/* light source inside shade */}
        <mesh position={[0, 1.72, 0]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color={new THREE.Color(3.5, 3.0, 2.2)} />
        </mesh>
        <pointLight position={[0, 1.7, 0]} intensity={1.8} distance={3.5} color="#ffe8c0" decay={2} castShadow />
      </group>
    </group>
  );
}

// ─── PRODUCT MODELS ───────────────────────────────────────────────────────────
function ColibriVR({ screenPct, wallZ, cy, winW, winH }: {
  screenPct: number; wallZ: number; cy: number; winW: number; winH: number;
}) {
  const pct = screenPct / 100;
  const RW = winW, RH = winH;
  const RAIL_W = 0.048, RAIL_D = 0.046;
  const CAS_H = 0.20, CAS_D = 0.046;
  const interiorW = RW - RAIL_W * 2;
  const meshTex = useMeshGridTex();
  const aluMat  = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#f2f0ec', metalness: 0.12, roughness: 0.70,
  }), []);
  const meshMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: meshTex, transparent: true, opacity: 0.92,
    alphaTest: 0.01, side: THREE.DoubleSide, depthWrite: false, roughness: 0.8,
  }), [meshTex]);

  const meshRef  = useRef<THREE.Mesh>(null);
  const pbRef    = useRef<THREE.Group>(null);
  const cassetteY = RH / 2 + CAS_H / 2;

  useFrame(() => {
    const sY = Math.max(0.001, 1 - pct);
    if (meshRef.current) {
      meshRef.current.scale.y = sY;
      meshRef.current.position.y = RH / 2 - (RH * sY) / 2;
    }
    if (pbRef.current) pbRef.current.position.y = RH / 2 - RH * sY - 0.034;
  });

  return (
    <group position={[0, cy, wallZ + 0.05]}>
      <mesh material={aluMat} position={[0, cassetteY, 0]}><boxGeometry args={[RW, CAS_H, CAS_D]} /></mesh>
      <mesh material={aluMat} position={[-RW / 2 + RAIL_W / 2, 0, 0]}><boxGeometry args={[RAIL_W, RH, RAIL_D]} /></mesh>
      <mesh material={aluMat} position={[RW / 2 - RAIL_W / 2, 0, 0]}><boxGeometry args={[RAIL_W, RH, RAIL_D]} /></mesh>
      <mesh ref={meshRef} material={meshMat} position={[0, RH / 2 - RH / 2, 0.005]}>
        <planeGeometry args={[interiorW, RH]} />
      </mesh>
      <group ref={pbRef} position={[0, RH / 2 - RH - 0.034, 0.008]}>
        <mesh material={aluMat}><boxGeometry args={[interiorW, 0.052, 0.046]} /></mesh>
      </group>
    </group>
  );
}

function SidneyVR({ screenPct, wallZ, cy, winW, winH }: {
  screenPct: number; wallZ: number; cy: number; winW: number; winH: number;
}) {
  const pct = screenPct / 100;
  const FH = winH;
  const CW = 0.112, CD = 0.070;          // cassette housing
  const TH = 0.030, TD = 0.050;          // top/bottom track rail
  const RW = 0.038, RD = 0.036;          // right guide rail
  const totalW = winW;
  const interiorW = totalW - CW - RW;
  const casX = -totalW / 2 + CW / 2;
  const rightRailX = totalW / 2 - RW / 2;

  const meshTex = useMeshGridTex();
  const aluMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#dbd7d0', metalness: 0.52, roughness: 0.36,
  }), []);
  const aluShade = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#9e9a94', metalness: 0.48, roughness: 0.52,
  }), []);
  const meshMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: meshTex, transparent: true, opacity: 0.90,
    alphaTest: 0.01, side: THREE.DoubleSide, depthWrite: false, roughness: 0.75,
  }), [meshTex]);

  const meshRef  = useRef<THREE.Mesh>(null);
  const edgeRef  = useRef<THREE.Group>(null);

  useFrame(() => {
    const sX = Math.max(0.001, 1 - pct);
    if (meshRef.current) {
      meshRef.current.scale.x = sX;
      meshRef.current.position.x = casX + CW / 2 + (interiorW * sX) / 2;
    }
    if (edgeRef.current) {
      edgeRef.current.position.x = casX + CW / 2 + interiorW * sX;
    }
  });

  const hH = FH * 0.50;
  const trackCX = (casX + CW / 2 + rightRailX + RW / 2) / 2;
  const trackW  = interiorW + RW;

  return (
    <group position={[0, cy, wallZ + 0.04]}>

      {/* ── Cassette housing ── */}
      <mesh material={aluMat} position={[casX, 0, 0]}>
        <boxGeometry args={[CW, FH + 0.014, CD]} />
      </mesh>
      {/* cassette front channel strip */}
      <mesh material={aluShade} position={[casX + CW * 0.36, 0, CD * 0.42]}>
        <boxGeometry args={[CW * 0.20, FH - 0.028, CD * 0.16]} />
      </mesh>
      {/* cassette exit brush seal */}
      <mesh material={aluShade} position={[casX + CW / 2 - 0.005, 0, CD * 0.05]}>
        <boxGeometry args={[0.008, FH * 0.97, 0.018]} />
      </mesh>
      {/* cassette top cap */}
      <mesh material={aluShade} position={[casX, FH / 2 + 0.010, CD * 0.10]}>
        <boxGeometry args={[CW * 0.88, 0.012, CD * 0.82]} />
      </mesh>
      {/* cassette bottom cap */}
      <mesh material={aluShade} position={[casX, -FH / 2 - 0.010, CD * 0.10]}>
        <boxGeometry args={[CW * 0.88, 0.012, CD * 0.82]} />
      </mesh>

      {/* ── Top track rail ── */}
      <mesh material={aluMat} position={[trackCX, FH / 2 + TH / 2, 0]}>
        <boxGeometry args={[trackW, TH, TD]} />
      </mesh>
      <mesh material={aluShade} position={[trackCX, FH / 2 + TH / 2, TD / 2 - 0.004]}>
        <boxGeometry args={[trackW * 0.88, TH * 0.28, 0.005]} />
      </mesh>

      {/* ── Bottom track rail ── */}
      <mesh material={aluMat} position={[trackCX, -FH / 2 - TH / 2, 0]}>
        <boxGeometry args={[trackW, TH, TD]} />
      </mesh>
      <mesh material={aluShade} position={[trackCX, -FH / 2 - TH / 2, TD / 2 - 0.004]}>
        <boxGeometry args={[trackW * 0.88, TH * 0.28, 0.005]} />
      </mesh>

      {/* ── Right guide rail ── */}
      <mesh material={aluMat} position={[rightRailX, 0, 0]}>
        <boxGeometry args={[RW, FH, RD]} />
      </mesh>
      <mesh material={aluShade} position={[rightRailX - RW * 0.38, 0, RD / 2 - 0.004]}>
        <boxGeometry args={[RW * 0.24, FH * 0.94, 0.006]} />
      </mesh>

      {/* ── Mosquito net panel ── */}
      <mesh ref={meshRef} material={meshMat}
        position={[casX + CW / 2 + interiorW / 2, 0, 0.012]}>
        <planeGeometry args={[interiorW, FH * 0.975]} />
      </mesh>

      {/* ── Panel free edge + pull handle (animated) ── */}
      <group ref={edgeRef} position={[casX + CW / 2 + interiorW, 0, 0]}>
        {/* edge stile */}
        <mesh material={aluMat} position={[0.013, 0, 0.010]}>
          <boxGeometry args={[0.024, FH * 0.978, 0.028]} />
        </mesh>
        {/* handle top bracket */}
        <mesh material={aluShade} position={[0.030, hH * 0.30, 0.022]}>
          <boxGeometry args={[0.016, 0.026, 0.014]} />
        </mesh>
        {/* handle bottom bracket */}
        <mesh material={aluShade} position={[0.030, -hH * 0.30, 0.022]}>
          <boxGeometry args={[0.016, 0.026, 0.014]} />
        </mesh>
        {/* handle bar */}
        <mesh material={aluShade} position={[0.034, 0, 0.024]}>
          <boxGeometry args={[0.010, hH * 0.62, 0.012]} />
        </mesh>
      </group>

    </group>
  );
}

function SidneyACVR({ screenPct, wallZ, cy, winW, winH }: {
  screenPct: number; wallZ: number; cy: number; winW: number; winH: number;
}) {
  const pct = screenPct / 100;
  const FH = winH;
  const CW = 0.112, CD = 0.070;
  const TH = 0.030, TD = 0.050;
  const totalW = winW;
  const halfInterior = (totalW - CW * 2) / 2;
  const lCasX = -totalW / 2 + CW / 2;
  const rCasX =  totalW / 2 - CW / 2;

  const meshTex = useMeshGridTex();
  const aluMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#dbd7d0', metalness: 0.52, roughness: 0.36,
  }), []);
  const aluShade = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#9e9a94', metalness: 0.48, roughness: 0.52,
  }), []);
  const meshMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: meshTex, transparent: true, opacity: 0.90,
    alphaTest: 0.01, side: THREE.DoubleSide, depthWrite: false, roughness: 0.75,
  }), [meshTex]);

  const lMeshRef = useRef<THREE.Mesh>(null);
  const rMeshRef = useRef<THREE.Mesh>(null);
  const lEdgeRef = useRef<THREE.Group>(null);
  const rEdgeRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const sX = Math.max(0.001, 1 - pct);
    if (lMeshRef.current) {
      lMeshRef.current.scale.x = sX;
      lMeshRef.current.position.x = -(halfInterior - halfInterior * sX / 2);
    }
    if (rMeshRef.current) {
      rMeshRef.current.scale.x = sX;
      rMeshRef.current.position.x = halfInterior - halfInterior * sX / 2;
    }
    if (lEdgeRef.current) lEdgeRef.current.position.x = -halfInterior + halfInterior * sX;
    if (rEdgeRef.current) rEdgeRef.current.position.x =  halfInterior - halfInterior * sX;
  });

  const hH = FH * 0.50;

  return (
    <group position={[0, cy, wallZ + 0.04]}>

      {/* ── Left cassette ── */}
      <mesh material={aluMat} position={[lCasX, 0, 0]}>
        <boxGeometry args={[CW, FH + 0.014, CD]} />
      </mesh>
      <mesh material={aluShade} position={[lCasX + CW * 0.36, 0, CD * 0.42]}>
        <boxGeometry args={[CW * 0.20, FH - 0.028, CD * 0.16]} />
      </mesh>
      <mesh material={aluShade} position={[lCasX + CW / 2 - 0.005, 0, CD * 0.05]}>
        <boxGeometry args={[0.008, FH * 0.97, 0.018]} />
      </mesh>
      <mesh material={aluShade} position={[lCasX,  FH / 2 + 0.010, CD * 0.10]}>
        <boxGeometry args={[CW * 0.88, 0.012, CD * 0.82]} />
      </mesh>
      <mesh material={aluShade} position={[lCasX, -FH / 2 - 0.010, CD * 0.10]}>
        <boxGeometry args={[CW * 0.88, 0.012, CD * 0.82]} />
      </mesh>

      {/* ── Right cassette ── */}
      <mesh material={aluMat} position={[rCasX, 0, 0]}>
        <boxGeometry args={[CW, FH + 0.014, CD]} />
      </mesh>
      <mesh material={aluShade} position={[rCasX - CW * 0.36, 0, CD * 0.42]}>
        <boxGeometry args={[CW * 0.20, FH - 0.028, CD * 0.16]} />
      </mesh>
      <mesh material={aluShade} position={[rCasX - CW / 2 + 0.005, 0, CD * 0.05]}>
        <boxGeometry args={[0.008, FH * 0.97, 0.018]} />
      </mesh>
      <mesh material={aluShade} position={[rCasX,  FH / 2 + 0.010, CD * 0.10]}>
        <boxGeometry args={[CW * 0.88, 0.012, CD * 0.82]} />
      </mesh>
      <mesh material={aluShade} position={[rCasX, -FH / 2 - 0.010, CD * 0.10]}>
        <boxGeometry args={[CW * 0.88, 0.012, CD * 0.82]} />
      </mesh>

      {/* ── Top track rail ── */}
      <mesh material={aluMat} position={[0, FH / 2 + TH / 2, 0]}>
        <boxGeometry args={[totalW, TH, TD]} />
      </mesh>
      <mesh material={aluShade} position={[0, FH / 2 + TH / 2, TD / 2 - 0.004]}>
        <boxGeometry args={[halfInterior * 2 * 0.90, TH * 0.28, 0.005]} />
      </mesh>

      {/* ── Bottom track rail ── */}
      <mesh material={aluMat} position={[0, -FH / 2 - TH / 2, 0]}>
        <boxGeometry args={[totalW, TH, TD]} />
      </mesh>
      <mesh material={aluShade} position={[0, -FH / 2 - TH / 2, TD / 2 - 0.004]}>
        <boxGeometry args={[halfInterior * 2 * 0.90, TH * 0.28, 0.005]} />
      </mesh>

      {/* ── Left mosquito net panel ── */}
      <mesh ref={lMeshRef} material={meshMat} position={[-halfInterior / 2, 0, 0.012]}>
        <planeGeometry args={[halfInterior, FH * 0.975]} />
      </mesh>
      {/* ── Right mosquito net panel ── */}
      <mesh ref={rMeshRef} material={meshMat} position={[halfInterior / 2, 0, 0.012]}>
        <planeGeometry args={[halfInterior, FH * 0.975]} />
      </mesh>

      {/* ── Left panel edge + handle (animated) ── */}
      <group ref={lEdgeRef} position={[0, 0, 0]}>
        <mesh material={aluMat} position={[-0.013, 0, 0.010]}>
          <boxGeometry args={[0.024, FH * 0.978, 0.028]} />
        </mesh>
        <mesh material={aluShade} position={[-0.030, hH * 0.30, 0.022]}>
          <boxGeometry args={[0.016, 0.026, 0.014]} />
        </mesh>
        <mesh material={aluShade} position={[-0.030, -hH * 0.30, 0.022]}>
          <boxGeometry args={[0.016, 0.026, 0.014]} />
        </mesh>
        <mesh material={aluShade} position={[-0.034, 0, 0.024]}>
          <boxGeometry args={[0.010, hH * 0.62, 0.012]} />
        </mesh>
      </group>

      {/* ── Right panel edge + handle (animated) ── */}
      <group ref={rEdgeRef} position={[0, 0, 0]}>
        <mesh material={aluMat} position={[0.013, 0, 0.010]}>
          <boxGeometry args={[0.024, FH * 0.978, 0.028]} />
        </mesh>
        <mesh material={aluShade} position={[0.030, hH * 0.30, 0.022]}>
          <boxGeometry args={[0.016, 0.026, 0.014]} />
        </mesh>
        <mesh material={aluShade} position={[0.030, -hH * 0.30, 0.022]}>
          <boxGeometry args={[0.016, 0.026, 0.014]} />
        </mesh>
        <mesh material={aluShade} position={[0.034, 0, 0.024]}>
          <boxGeometry args={[0.010, hH * 0.62, 0.012]} />
        </mesh>
      </group>

    </group>
  );
}

function ElbaVR({ wallZ, cy, winW, winH }: {
  wallZ: number; cy: number; winW: number; winH: number;
}) {
  const FW = winW, FH = winH, PW = 0.055;
  const meshTex = useMeshGridTex();
  const aluMat  = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f2f0ec', metalness: 0.12, roughness: 0.70 }), []);
  const meshMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: meshTex, transparent: true, opacity: 0.92,
    alphaTest: 0.01, side: THREE.DoubleSide, depthWrite: false, roughness: 0.8,
  }), [meshTex]);
  return (
    <group position={[0, cy, wallZ + 0.05]}>
      <mesh material={aluMat} position={[0, FH / 2 - PW / 2, 0]}><boxGeometry args={[FW, PW, 0.042]} /></mesh>
      <mesh material={aluMat} position={[0, -FH / 2 + PW / 2, 0]}><boxGeometry args={[FW, PW, 0.042]} /></mesh>
      <mesh material={aluMat} position={[-FW / 2 + PW / 2, 0, 0]}><boxGeometry args={[PW, FH - PW * 2, 0.042]} /></mesh>
      <mesh material={aluMat} position={[FW / 2 - PW / 2, 0, 0]}><boxGeometry args={[PW, FH - PW * 2, 0.042]} /></mesh>
      <mesh material={meshMat} position={[0, 0, 0.005]}>
        <planeGeometry args={[FW - PW * 2, FH - PW * 2]} />
      </mesh>
    </group>
  );
}

// ─── SCENE CONTROLLER (animation state in useFrame) ──────────────────────────
interface SceneControllerProps {
  shutterTargetRef: React.MutableRefObject<number>;
  screenTargetRef:  React.MutableRefObject<number>;
  shutterPctRef:    React.MutableRefObject<number>;
  screenPctRef:     React.MutableRefObject<number>;
  onShutterChange:  (v: number) => void;
  onScreenChange:   (v: number) => void;
}

function SceneController({
  shutterTargetRef, screenTargetRef,
  shutterPctRef, screenPctRef,
  onShutterChange, onScreenChange,
}: SceneControllerProps) {
  useFrame((_, delta) => {
    const SPEED = 1.2 * delta;
    const prev_s = shutterPctRef.current;
    const prev_m = screenPctRef.current;
    shutterPctRef.current = THREE.MathUtils.lerp(prev_s, shutterTargetRef.current, Math.min(1, SPEED * 3));
    screenPctRef.current  = THREE.MathUtils.lerp(prev_m, screenTargetRef.current,  Math.min(1, SPEED * 3));
    if (Math.abs(shutterPctRef.current - prev_s) > 0.001) onShutterChange(shutterPctRef.current);
    if (Math.abs(screenPctRef.current  - prev_m) > 0.001) onScreenChange(screenPctRef.current);
  });
  return null;
}

// ─── SCENE GRAPH ─────────────────────────────────────────────────────────────
interface SceneGraphProps {
  productId:       string;
  cfg:             ProductConfig;
  shutterPctRef:   React.MutableRefObject<number>;
  screenPctRef:    React.MutableRefObject<number>;
  shutterTargetRef: React.MutableRefObject<number>;
  screenTargetRef:  React.MutableRefObject<number>;
  shutterPct:      number;
  screenPct:       number;
  onShutterChange: (v: number) => void;
  onScreenChange:  (v: number) => void;
}

function SceneGraph({
  productId, cfg,
  shutterPctRef, screenPctRef, shutterTargetRef, screenTargetRef,
  shutterPct, screenPct,
  onShutterChange, onScreenChange,
}: SceneGraphProps) {
  const { winW, winH, winY, hasShutter } = cfg;
  const winX  = 0;
  const wallZ = -4.5;
  const cy    = winY + winH / 2;
  const target = useMemo(() => new THREE.Vector3(0, 1.2, -1.5), []);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} color="#fff8f0" />
      <directionalLight
        position={[-3, 6, -2]}
        intensity={3.0}
        color="#fff5d0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.1}
        shadow-camera-far={22}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-bias={-0.0004}
      />
      <hemisphereLight args={['#e8f4ff', '#c8a87a', 0.30]} />

      <OrbitControls
        target={target}
        enablePan={false}
        minDistance={0.4}
        maxDistance={8.0}
        maxPolarAngle={Math.PI / 2 - 0.03}
        dampingFactor={0.06}
        enableDamping
      />

      <SceneController
        shutterTargetRef={shutterTargetRef}
        screenTargetRef={screenTargetRef}
        shutterPctRef={shutterPctRef}
        screenPctRef={screenPctRef}
        onShutterChange={onShutterChange}
        onScreenChange={onScreenChange}
      />

      <ExteriorScene winX={winX} winY={winY} winW={winW} winH={winH} />
      <Room winX={winX} winY={winY} winW={winW} winH={winH} />

      {/* Product — rendered behind shutter (lower Z offset) */}
      {(!hasShutter || shutterPct > 0.02) && (
        <>
          {productId === 'colibri-50'   && <ColibriVR  screenPct={screenPct} wallZ={wallZ} cy={cy} winW={winW} winH={winH} />}
          {productId === 'sidney-50'    && <SidneyVR   screenPct={screenPct} wallZ={wallZ} cy={cy} winW={winW} winH={winH} />}
          {productId === 'sidney-50-ac' && <SidneyACVR screenPct={screenPct} wallZ={wallZ} cy={cy} winW={winW} winH={winH} />}
          {productId === 'elba'         && <ElbaVR                           wallZ={wallZ} cy={cy} winW={winW} winH={winH} />}
        </>
      )}

      {/* Shutters on top */}
      {hasShutter && (
        <Shutters
          winX={winX} winY={winY} winW={winW} winH={winH}
          shutterPct={shutterPct}
        />
      )}

      <EffectComposer>
        <Bloom intensity={0.6} luminanceThreshold={0.82} luminanceSmoothing={0.5} />
        <Vignette eskil={false} offset={0.3} darkness={0.6} />
      </EffectComposer>
    </>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const ProductVRExperience: React.FC<ProductVRExperienceProps> = ({
  productId, productName, onClose,
}) => {
  const cfg    = PRODUCT_CONFIG[productId] ?? PRODUCT_CONFIG['colibri-50'];
  const isElba = productId === 'elba';

  // React state for UI rendering
  const [shutterPct, setShutterPct] = useState(0);
  const [screenPct,  setScreenPct]  = useState(0);
  const [screenTarget, setScreenTarget] = useState(0);

  // Refs for useFrame (no re-render on animation tick)
  const shutterTargetRef = useRef<number>(0);
  const screenTargetRef  = useRef<number>(0);
  const shutterPctRef    = useRef<number>(0);
  const screenPctRef     = useRef<number>(0);

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  // Sync screen target to ref
  useEffect(() => {
    screenTargetRef.current = screenTarget;
  }, [screenTarget]);

  const handleOpenShutter = () => {
    shutterTargetRef.current = 1;
  };

  const handleReset = () => {
    shutterTargetRef.current = 0;
    screenTargetRef.current  = 0;
    setScreenTarget(0);
    shutterPctRef.current = 0;
    screenPctRef.current  = 0;
    setShutterPct(0);
    setScreenPct(0);
  };

  const shuttersOpen = shutterPct >= 0.95;
  const screenLabel  = screenPct > 50 ? 'Fermer' : 'Ouvrir';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.45s ease',
      background: '#0f1922',
    }}>
      <Canvas
        shadows
        camera={{ position: [0.8, 1.6, 5.0], fov: 60, near: 0.05, far: 60 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.08,
        }}
      >
        <SceneGraph
          productId={productId}
          cfg={cfg}
          shutterPctRef={shutterPctRef}
          screenPctRef={screenPctRef}
          shutterTargetRef={shutterTargetRef}
          screenTargetRef={screenTargetRef}
          shutterPct={shutterPct}
          screenPct={screenPct}
          onShutterChange={setShutterPct}
          onScreenChange={setScreenPct}
        />
      </Canvas>

      {/* ═══ TOP BAR ═══ */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: '20px 26px',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.42) 0%, transparent 100%)',
        pointerEvents: 'none',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{
            color: '#ffffff', fontSize: 21, fontWeight: 700,
            fontFamily: 'Space Grotesk, Inter, sans-serif',
            textShadow: '0 2px 14px rgba(0,0,0,0.55)',
            letterSpacing: '-0.3px',
          }}>
            {productName}
          </span>
          <span style={{
            color: 'rgba(255,255,255,0.55)', fontSize: 11,
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '2.2px', textTransform: 'uppercase',
          }}>
            Grifo Flex · Vue Immersive
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(255,255,255,0.10)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.18)',
            color: 'white', fontSize: 17, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'auto', flexShrink: 0,
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.22)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.10)'; }}
        >
          ✕
        </button>
      </div>

      {/* ═══ BOTTOM CONTROLS ═══ */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '0 0 28px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        background: 'linear-gradient(to top, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.30) 65%, transparent 100%)',
        pointerEvents: 'none',
      }}>

        {/* ── CONTROL CARD ── */}
        <div style={{
          background: 'rgba(8,20,38,0.72)',
          backdropFilter: 'blur(18px)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 16,
          padding: '16px 24px',
          display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 12,
          width: '100%', maxWidth: 520,
          pointerEvents: 'auto',
          boxShadow: '0 8px 40px rgba(0,0,0,0.45)',
        }}>

          {/* Row 1: Shutter open button OR screen slider */}
          {cfg.hasShutter && !shuttersOpen && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={handleOpenShutter}
                style={{
                  background: 'linear-gradient(135deg, #1A5DA8 0%, #1e72d4 100%)',
                  color: 'white', border: 'none',
                  borderRadius: 10, padding: '11px 28px',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  letterSpacing: '0.3px',
                  boxShadow: '0 4px 18px rgba(26,93,168,0.45)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 24px rgba(26,93,168,0.60)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 18px rgba(26,93,168,0.45)';
                }}
              >
                <span style={{ fontSize: 16 }}>🪟</span>
                Ouvrir le volet
              </button>
            </div>
          )}

          {(shuttersOpen || !cfg.hasShutter) && !isElba && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Slider label row */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{
                  color: 'rgba(255,255,255,0.50)', fontSize: 11,
                  fontFamily: 'Inter, sans-serif', letterSpacing: '1.5px', textTransform: 'uppercase',
                }}>
                  Moustiquaire
                </span>
                <span style={{
                  color: '#4A9EDB', fontSize: 14, fontWeight: 700,
                  fontFamily: 'Space Grotesk, sans-serif',
                }}>
                  {Math.round(screenPct)}%
                </span>
              </div>

              {/* Slider row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  color: 'rgba(255,255,255,0.40)', fontSize: 11,
                  fontFamily: 'Inter, sans-serif', minWidth: 38,
                }}>Fermé</span>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    type="range"
                    min={0} max={100}
                    value={Math.round(screenPct)}
                    onChange={e => {
                      const v = Number(e.target.value);
                      screenTargetRef.current = v;
                      setScreenTarget(v);
                    }}
                    style={{
                      width: '100%', cursor: 'pointer',
                      accentColor: '#1A5DA8', height: 4,
                      appearance: 'none', background: 'transparent',
                    }}
                  />
                </div>
                <span style={{
                  color: 'rgba(255,255,255,0.40)', fontSize: 11,
                  fontFamily: 'Inter, sans-serif', minWidth: 38, textAlign: 'right',
                }}>Ouvert</span>
                <button
                  onClick={() => {
                    const v = screenPct > 50 ? 0 : 100;
                    screenTargetRef.current = v;
                    setScreenTarget(v);
                  }}
                  style={{
                    background: '#1A5DA8', color: 'white', border: 'none',
                    borderRadius: 8, padding: '7px 16px', fontSize: 12,
                    fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {screenLabel}
                </button>
              </div>
            </div>
          )}

          {isElba && (shuttersOpen || !cfg.hasShutter) && (
            <div style={{
              color: 'rgba(255,255,255,0.50)', fontSize: 12,
              fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: '4px 0',
              letterSpacing: '0.5px',
            }}>
              Châssis fixe · Moustiquaire permanente installée
            </div>
          )}

          {/* Row 2: Reset */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 2 }}>
            <button
              onClick={handleReset}
              style={{
                background: 'transparent', color: 'rgba(255,255,255,0.38)',
                border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: 7, padding: '6px 16px', fontSize: 12,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                letterSpacing: '0.3px',
                transition: 'color 0.2s, border-color 0.2s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.70)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.30)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.38)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.14)';
              }}
            >
              ↺ Réinitialiser
            </button>
          </div>
        </div>

        {/* Hint */}
        <span style={{
          color: 'rgba(255,255,255,0.28)', fontSize: 11,
          fontFamily: 'Inter, sans-serif', letterSpacing: '0.4px',
          pointerEvents: 'none',
        }}>
          Cliquer · Faire glisser · Molette pour zoomer
        </span>
      </div>

      <style>{`
        input[type=range]::-webkit-slider-runnable-track {
          background: rgba(255,255,255,0.15);
          border-radius: 4px;
          height: 4px;
        }
        input[type=range]::-webkit-slider-thumb {
          appearance: none;
          width: 16px; height: 16px;
          border-radius: 50%;
          background: #1A5DA8;
          border: 2px solid #4A9EDB;
          margin-top: -6px;
          cursor: pointer;
          box-shadow: 0 0 8px rgba(26,93,168,0.6);
        }
        input[type=range]::-moz-range-track {
          background: rgba(255,255,255,0.15);
          border-radius: 4px;
          height: 4px;
        }
        input[type=range]::-moz-range-thumb {
          width: 16px; height: 16px;
          border-radius: 50%;
          background: #1A5DA8;
          border: 2px solid #4A9EDB;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default ProductVRExperience;
