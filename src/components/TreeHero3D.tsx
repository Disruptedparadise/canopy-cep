import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Low-poly layered pine / evergreen tree
function LayeredTree({ position = [0, 0, 0], scale = 1, foliageColor1 = '#10B981', foliageColor2 = '#059669', foliageColor3 = '#047857' }: {
  position?: [number, number, number];
  scale?: number;
  foliageColor1?: string;
  foliageColor2?: string;
  foliageColor3?: string;
}) {
  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.16, 0.24, 1.2, 7]} />
        <meshStandardMaterial color="#4A2E1A" roughness={0.9} flatShading />
      </mesh>

      {/* Foliage Tier 1 (bottom) */}
      <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
        <coneGeometry args={[1.05, 1.2, 7]} />
        <meshStandardMaterial color={foliageColor1} roughness={0.8} flatShading />
      </mesh>

      {/* Foliage Tier 2 (middle) */}
      <mesh position={[0, 2.05, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.82, 1.1, 7]} />
        <meshStandardMaterial color={foliageColor2} roughness={0.8} flatShading />
      </mesh>

      {/* Foliage Tier 3 (top) */}
      <mesh position={[0, 2.7, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.55, 0.95, 7]} />
        <meshStandardMaterial color={foliageColor3} roughness={0.75} flatShading />
      </mesh>
    </group>
  );
}

// Low-poly broad/rounded canopy tree
function BroadTree({ position = [0, 0, 0], scale = 1 }: {
  position?: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.28, 1.4, 7]} />
        <meshStandardMaterial color="#4A2E1A" roughness={0.9} flatShading />
      </mesh>

      {/* Broad Lower Crown */}
      <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.95, 0]} />
        <meshStandardMaterial color="#059669" roughness={0.8} flatShading />
      </mesh>

      {/* Upper Crown cluster */}
      <mesh position={[0.2, 2.4, 0.1]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.7, 0]} />
        <meshStandardMaterial color="#10B981" roughness={0.75} flatShading />
      </mesh>

      <mesh position={[-0.25, 2.2, -0.15]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial color="#34D399" roughness={0.75} flatShading />
      </mesh>
    </group>
  );
}

// Gentle slow-rotating grove group
function TreeGrove() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.12; // slow, calm rotation
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.8, 0]}>
      {/* Earthen Soil Mound */}
      <mesh position={[0, -0.15, 0]} receiveShadow>
        <cylinderGeometry args={[3.2, 3.5, 0.3, 24]} />
        <meshStandardMaterial color="#1A2B1D" roughness={0.95} flatShading />
      </mesh>

      {/* Soil humus top plate */}
      <mesh position={[0, 0.01, 0]} receiveShadow>
        <cylinderGeometry args={[3.1, 3.1, 0.05, 24]} />
        <meshStandardMaterial color="#142217" roughness={0.9} />
      </mesh>

      {/* Tree 1: Primary Tall Layered Evergreen (Left-Back) */}
      <LayeredTree
        position={[-1.15, 0, -0.3]}
        scale={1.1}
        foliageColor1="#065F46"
        foliageColor2="#059669"
        foliageColor3="#10B981"
      />

      {/* Tree 2: Broad Shade Tree (Right-Center) */}
      <BroadTree position={[1.05, 0, 0.1]} scale={0.95} />

      {/* Tree 3: Young Sapling (Front-Center) */}
      <LayeredTree
        position={[0.1, 0, 1.15]}
        scale={0.65}
        foliageColor1="#047857"
        foliageColor2="#10B981"
        foliageColor3="#34D399"
      />

      {/* Low-poly stones and soil aggregates */}
      <mesh position={[0.7, 0.08, 0.9]} rotation={[0.2, 0.5, 0.1]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.18, 0]} />
        <meshStandardMaterial color="#374151" roughness={0.95} flatShading />
      </mesh>

      <mesh position={[-0.6, 0.06, 0.8]} rotation={[0.4, 0.1, 0.3]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.13, 0]} />
        <meshStandardMaterial color="#92400E" roughness={0.95} flatShading />
      </mesh>

      <mesh position={[-1.6, 0.07, 0.6]} rotation={[0.1, 0.8, 0.2]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.15, 0]} />
        <meshStandardMaterial color="#4B5563" roughness={0.95} flatShading />
      </mesh>
    </group>
  );
}

// Error Boundary specifically to ensure WebGL failures don't break the page
interface ErrorBoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class WebGLErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('WebGL initialization caught error, falling back to static visual:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export const TreeHero3D: React.FC = () => {
  const [webglAvailable, setWebglAvailable] = useState<boolean>(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglAvailable(false);
      }
    } catch {
      setWebglAvailable(false);
    }
  }, []);

  const fallbackIllustration = (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0C150E]/80 border border-white/[0.08] p-8 text-center rounded-2xl">
      <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 2L4 12h4l-2 8h12l-2-8h4L12 2z" />
        </svg>
      </div>
      <div className="text-base font-semibold text-white">
        Living Canopy & Soil Protection
      </div>
      <p className="text-xs text-gray-400 mt-1 max-w-sm">
        Native tree planting stabilizes steep hydrology, restores subterranean humus, and shields topsoil horizons.
      </p>
    </div>
  );

  if (!webglAvailable) {
    return fallbackIllustration;
  }

  return (
    <WebGLErrorBoundary fallback={fallbackIllustration}>
      <div className="w-full h-full relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#0F1C12]/60 via-[#0A140D]/40 to-[#060B08]/90 border border-white/[0.08] select-none">
        {/* Subtle status tag */}
        <div className="absolute top-3 right-3 z-10 pointer-events-none text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 backdrop-blur-md">
          ● 360° Live Diorama
        </div>

        <Canvas
          shadows
          camera={{ position: [0, 2.3, 6.0], fov: 38 }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
          {/* Ambient lighting */}
          <ambientLight intensity={1.1} color="#EDFDF2" />

          {/* Directional key sun light */}
          <directionalLight
            position={[4, 7, 3]}
            intensity={1.8}
            color="#E6FFFA"
            castShadow
            shadow-mapSize={[1024, 1024]}
          />

          {/* Earth bounce fill light */}
          <directionalLight position={[-4, 2, -2]} intensity={0.5} color="#10B981" />

          {/* Rotating Low-Poly Trees */}
          <TreeGrove />

          {/* Limited OrbitControls */}
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate={false}
            maxPolarAngle={Math.PI / 2.15}
            minPolarAngle={Math.PI / 3.6}
            rotateSpeed={0.6}
          />
        </Canvas>

        {/* Bottom subtle ground gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#060B08] to-transparent pointer-events-none" />
      </div>
    </WebGLErrorBoundary>
  );
};
