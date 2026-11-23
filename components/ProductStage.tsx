"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Group } from "three";

function roundedPlate(width: number, height: number, radius: number, holes: { x: number; y: number; r: number }[]) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2 + radius, -height / 2);
  shape.lineTo(width / 2 - radius, -height / 2);
  shape.quadraticCurveTo(width / 2, -height / 2, width / 2, -height / 2 + radius);
  shape.lineTo(width / 2, height / 2 - radius);
  shape.quadraticCurveTo(width / 2, height / 2, width / 2 - radius, height / 2);
  shape.lineTo(-width / 2 + radius, height / 2);
  shape.quadraticCurveTo(-width / 2, height / 2, -width / 2, height / 2 - radius);
  shape.lineTo(-width / 2, -height / 2 + radius);
  shape.quadraticCurveTo(-width / 2, -height / 2, -width / 2 + radius, -height / 2);
  holes.forEach(({ x, y, r }) => {
    const path = new THREE.Path();
    path.absarc(x, y, r, 0, Math.PI * 2, true);
    shape.holes.push(path);
  });
  return new THREE.ExtrudeGeometry(shape, { depth: 0.13, bevelEnabled: true, bevelThickness: 0.045, bevelSize: 0.04, bevelSegments: 4, curveSegments: 18 });
}

function MouldedAssembly() {
  const group = useRef<Group>(null);
  const plate = useMemo(() => roundedPlate(2.35, 1.55, 0.18, [
    { x: -0.87, y: -0.48, r: 0.11 }, { x: 0.87, y: -0.48, r: 0.11 },
    { x: -0.87, y: 0.48, r: 0.11 }, { x: 0.87, y: 0.48, r: 0.11 },
  ]), []);
  const strap = useMemo(() => roundedPlate(0.5, 2.55, 0.22, [
    { x: 0, y: 1.03, r: 0.105 }, { x: 0, y: -1.03, r: 0.105 },
  ]), []);
  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();
    group.current.rotation.y = Math.sin(t * 0.28) * 0.22;
    group.current.rotation.x = -0.12 + Math.sin(t * 0.35) * 0.035;
    group.current.position.y = Math.sin(t * 0.75) * 0.055;
  });
  const red = <meshPhysicalMaterial color="#b9474d" roughness={0.39} metalness={0.025} clearcoat={0.24} clearcoatRoughness={0.4} />;
  return (
    <group ref={group} rotation={[0, -0.32, -0.1]}>
      <mesh geometry={plate} position={[-0.34, -0.12, 0.03]} castShadow receiveShadow>{red}</mesh>
      <mesh position={[-0.3, 0.03, 0.21]} castShadow><boxGeometry args={[1.1, 0.52, 0.27]} />{red}</mesh>
      <mesh position={[-0.3, 0.02, 0.37]} castShadow><boxGeometry args={[0.62, 0.28, 0.1]} /><meshPhysicalMaterial color="#d46d70" roughness={0.36} clearcoat={0.25} /></mesh>
      <mesh position={[0.85, -0.16, 0.03]} geometry={strap} rotation={[0, 0, -0.13]} castShadow receiveShadow>{red}</mesh>
      <mesh position={[0.85, 0.0, 0.2]} castShadow><boxGeometry args={[0.66, 0.34, 0.2]} /><meshPhysicalMaterial color="#a9373d" roughness={0.34} clearcoat={0.2} /></mesh>
      <mesh position={[0.85, 0.0, 0.33]} castShadow><boxGeometry args={[0.42, 0.16, 0.08]} /><meshPhysicalMaterial color="#d86c70" roughness={0.35} /></mesh>
      <mesh position={[-1.2, 0.68, -0.01]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.19, 0.025, 8, 40]} /><meshStandardMaterial color="#e6e0dc" metalness={0.55} roughness={0.32} /></mesh>
      <mesh position={[0.55, 0.78, -0.01]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.19, 0.025, 8, 40]} /><meshStandardMaterial color="#e6e0dc" metalness={0.55} roughness={0.32} /></mesh>
    </group>
  );
}

function ShowroomScene() {
  const floor = useMemo(() => new THREE.CircleGeometry(3.7, 64), []);
  return (
    <>
      <ambientLight intensity={1.1} />
      <directionalLight position={[3.5, 4.5, 5]} intensity={2.4} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <pointLight position={[-3, 1.5, 2]} intensity={1.15} color="#ffc4be" />
      <mesh geometry={floor} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.58, 0]} receiveShadow><shadowMaterial opacity={0.18} /></mesh>
      <MouldedAssembly />
    </>
  );
}

export default function ProductStage() {
  return (
    <div className="product-stage" aria-label="Illustrative interactive 3D view of a moulded plastic component">
      <div className="stage-orbit stage-orbit-one" /><div className="stage-orbit stage-orbit-two" />
      <Canvas camera={{ position: [0, 0, 5.8], fov: 34 }} dpr={[1, 1.5]} shadows gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}>
        <Suspense fallback={null}><ShowroomScene /></Suspense>
      </Canvas>
      <div className="stage-label"><span className="stage-dot" /> 3D concept showcase <span>Auto-rotating · illustrative model</span></div>
      <div className="stage-crosshair" aria-hidden="true">＋</div>
    </div>
  );
}
