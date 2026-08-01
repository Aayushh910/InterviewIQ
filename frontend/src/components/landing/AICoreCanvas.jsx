import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

function CyberneticHumanoidHead() {
  const barRefs = useRef([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Animate multi-bar speech equalizer in mouth area to simulate active AI vocalization
    barRefs.current.forEach((bar, idx) => {
      if (bar) {
        const heightFactor = 0.3 + Math.abs(Math.sin(t * 12 + idx * 0.8) * Math.cos(t * 8 - idx * 0.5)) * 0.7;
        bar.scale.y = heightFactor;
        bar.material.emissiveIntensity = 1.0 + heightFactor * 1.5;
      }
    });
  });

  return (
    <group position={[0, -0.15, 0]}>
      {/* 1. Main Head Shell (Smooth Metallic Android Cranium & Face Contour) */}
      <mesh position={[0, 0.45, 0]} scale={[1.08, 1.22, 1.02]}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          color="#e2e8f0"
          metalness={0.92}
          roughness={0.12}
          emissive="#334155"
          emissiveIntensity={0.25}
        />
      </mesh>

      {/* 2. Cheekbones & Face Plate Profile */}
      <mesh position={[0, 0.25, 0.35]} scale={[0.95, 0.75, 0.75]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#f1f5f9" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* 3. Sleek Cybernetic Eye Visor Frame */}
      <mesh position={[0, 0.48, 0.72]} scale={[1.25, 0.36, 0.4]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#0f172a" metalness={0.95} roughness={0.08} />
      </mesh>

      {/* 4. Glowing Cyan Visor Interface */}
      <mesh position={[0, 0.48, 0.84]} scale={[1.18, 0.28, 0.15]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#00f0ff"
          emissive="#00f0ff"
          emissiveIntensity={1.4}
          roughness={0.05}
          metalness={0.4}
          transparent={true}
          opacity={0.95}
        />
      </mesh>

      {/* 5. Left Ocular Sensor Eye */}
      <mesh position={[-0.32, 0.48, 0.94]} scale={[0.12, 0.12, 0.08]}>
        <cylinderGeometry args={[1, 1, 1, 32]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2.5} />
      </mesh>

      {/* 6. Right Ocular Sensor Eye */}
      <mesh position={[0.32, 0.48, 0.94]} scale={[0.12, 0.12, 0.08]}>
        <cylinderGeometry args={[1, 1, 1, 32]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2.5} />
      </mesh>

      {/* 7. Nose Bridge Profile */}
      <mesh position={[0, 0.22, 0.82]} scale={[0.12, 0.35, 0.2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* 8. Active Audio Speech Equalizer Bars (Mouth Region) */}
      <group position={[0, -0.05, 0.85]}>
        {[-0.24, -0.16, -0.08, 0, 0.08, 0.16, 0.24].map((xPos, idx) => (
          <mesh
            key={idx}
            ref={(el) => (barRefs.current[idx] = el)}
            position={[xPos, 0, 0]}
            scale={[0.04, 0.5, 0.04]}
          >
            <boxGeometry args={[1, 0.2, 1]} />
            <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={1.5} />
          </mesh>
        ))}
      </group>

      {/* 9. Metallic Jaw Line Plate */}
      <mesh position={[0, -0.32, 0.25]} scale={[0.84, 0.42, 0.8]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.18} />
      </mesh>

      {/* 10. Side Cybernetic Ear Hubs */}
      <group position={[-1.12, 0.45, 0]} rotation={[0, 0, Math.PI / 2]}>
        <mesh scale={[0.32, 0.18, 0.32]}>
          <cylinderGeometry args={[1, 1, 1, 32]} />
          <meshStandardMaterial color="#1e293b" metalness={0.92} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.1, 0]} scale={[0.22, 0.04, 0.22]}>
          <cylinderGeometry args={[1, 1, 1, 32]} />
          <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={1.8} />
        </mesh>
      </group>

      <group position={[1.12, 0.45, 0]} rotation={[0, 0, Math.PI / 2]}>
        <mesh scale={[0.32, 0.18, 0.32]}>
          <cylinderGeometry args={[1, 1, 1, 32]} />
          <meshStandardMaterial color="#1e293b" metalness={0.92} roughness={0.1} />
        </mesh>
        <mesh position={[0, -0.1, 0]} scale={[0.22, 0.04, 0.22]}>
          <cylinderGeometry args={[1, 1, 1, 32]} />
          <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={1.8} />
        </mesh>
      </group>

      {/* 11. Mechanical Neck Assembly */}
      <mesh position={[0, -0.72, 0]} scale={[0.5, 0.42, 0.5]}>
        <cylinderGeometry args={[1, 1.2, 1, 32]} />
        <meshStandardMaterial color="#475569" metalness={0.88} roughness={0.2} />
      </mesh>

      {/* 12. Base Collar Ring */}
      <mesh position={[0, -0.96, 0]} scale={[0.85, 0.16, 0.85]}>
        <cylinderGeometry args={[1, 1, 1, 32]} />
        <meshStandardMaterial color="#0f172a" metalness={0.95} roughness={0.1} emissive="#00f0ff" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

// Static background micro-grid points
function StaticBackgroundGrid() {
  return (
    <group position={[0, 0, -2]}>
      {[-2, -1, 0, 1, 2].map((x) =>
        [-2, -1, 0, 1, 2].map((y) => (
          <mesh key={`${x}-${y}`} position={[x * 1.5, y * 1.5, 0]} scale={[0.02, 0.02, 0.02]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshBasicMaterial color="#ffffff" opacity={0.25} transparent />
          </mesh>
        ))
      )}
    </group>
  );
}

export const AICoreCanvas = () => {
  return (
    <div className="w-full h-[260px] sm:h-[300px] relative bg-black/40 rounded-xl overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 4.4], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        className="w-full h-full"
      >
        {/* Crisp Studio 3-Point Lighting */}
        <ambientLight intensity={1.8} />
        <directionalLight position={[10, 15, 10]} intensity={3.2} color="#ffffff" />
        <directionalLight position={[-10, 10, -5]} intensity={2.5} color="#00ffff" />
        <pointLight position={[0, -5, 5]} intensity={2.0} color="#10b981" />

        <CyberneticHumanoidHead />
        <StaticBackgroundGrid />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
        />
      </Canvas>
    </div>
  );
};
