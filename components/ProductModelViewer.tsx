"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Group } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

function LoadedModel({ url }: { url: string }) {
  const gltf = useLoader(GLTFLoader, url);
  const group = useRef<Group>(null);
  const object = useMemo(() => {
    const clone = gltf.scene.clone(true);
    const bounds = new THREE.Box3().setFromObject(clone);
    const center = bounds.getCenter(new THREE.Vector3());
    const dimensions = bounds.getSize(new THREE.Vector3());
    const maxAxis = Math.max(dimensions.x, dimensions.y, dimensions.z, 0.001);
    const scale = 2.2 / maxAxis;
    clone.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
    clone.scale.setScalar(scale);
    return clone;
  }, [gltf]);
  useFrame((_state, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.22;
  });
  return <group ref={group}><primitive object={object} /></group>;
}

export default function ProductModelViewer({ url, title }: { url: string; title: string }) {
  return (
    <section className="product-model-section" aria-label={`Interactive 3D model of ${title}`}>
      <div className="product-model-heading">
        <div><span className="eyebrow"><span className="eyebrow-line" /> INTERACTIVE PRODUCT MODEL</span><h2>Inspect the form.</h2></div>
        <p>3D preview · auto-rotating</p>
      </div>
      <div className="product-model-canvas">
        <Canvas camera={{ position: [0, 0, 4.2], fov: 38 }} dpr={[1, 1.5]} shadows gl={{ alpha: false, antialias: true, powerPreference: "low-power" }}>
          <color attach="background" args={["#efede8"]} />
          <ambientLight intensity={1.15} />
          <hemisphereLight intensity={0.8} groundColor="#b7aaa0" />
          <directionalLight position={[3, 4, 5]} intensity={2.2} castShadow />
          <directionalLight position={[-3, 1, -2]} intensity={0.7} color="#ffd7d5" />
          <Suspense fallback={null}><LoadedModel url={url} /></Suspense>
        </Canvas>
        <div className="model-viewer-caption"><span>SKY PLASTIC / {title.toUpperCase()}</span><span>GLB MODEL</span></div>
      </div>
    </section>
  );
}
