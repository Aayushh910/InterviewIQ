import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float } from '@react-three/drei';

function AvatarSphere({ isSpeaking = true }) {
  const sphereRef = useRef();

  useFrame(({ clock }) => {
    if (sphereRef.current) {
      sphereRef.current.rotation.y = clock.getElapsedTime() * 0.4;
      sphereRef.current.rotation.z = clock.getElapsedTime() * 0.2;
    }
  });

  return (
    <Float speed={3} rotationIntensity={1} floatIntensity={1.5}>
      <Sphere ref={sphereRef} args={[1.2, 64, 64]} scale={1}>
        <MeshDistortMaterial
          color="#06B6D4"
          attach="material"
          distort={isSpeaking ? 0.6 : 0.2}
          speed={isSpeaking ? 4 : 1.5}
          roughness={0.1}
          metalness={0.9}
          wireframe={false}
          emissive="#14B8A6"
          emissiveIntensity={0.8}
        />
      </Sphere>
    </Float>
  );
}

export const AIAvatar = ({ isSpeaking = true }) => {
  return (
    <div className="w-full h-full relative flex items-center justify-center bg-surfaceDark/60 rounded-2xl overflow-hidden border border-white/10">
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }} gl={{ antialias: true }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 5, 5]} intensity={2} color="#14B8A6" />
        <pointLight position={[-5, -5, -5]} intensity={2} color="#8B5CF6" />
        <AvatarSphere isSpeaking={isSpeaking} />
      </Canvas>

      <div className="absolute bottom-3 left-3 bg-bgDark/80 px-2.5 py-1 rounded-lg border border-white/10 text-[10px] font-mono text-cyanAccent">
        AI Interrogator Active
      </div>
    </div>
  );
};
