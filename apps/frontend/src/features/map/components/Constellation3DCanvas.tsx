import { useEffect, useRef, useState, useCallback, memo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RotateCw, ZoomIn, ZoomOut, Compass } from 'lucide-react';
import type { GraphNode, GraphEdge, UserTopicMastery } from '../types/map.types';
import { getNodeObsidianColors } from '../utils/graphColors';
import {
  initGalaxy3DNodes,
  initGalaxy3DLinks,
  stepGalaxy3D,
  type Galaxy3DNode,
  type Galaxy3DLink,
} from '../utils/galaxy3DPhysics';

export interface Constellation3DCanvasProps {
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
  readonly masteries: Record<string, UserTopicMastery>;
  readonly selectedNodeId: string | null;
  readonly highlightNodeIds: ReadonlySet<string>;
  readonly highlightEdgeIds: ReadonlySet<string>;
  readonly onSelectNode: (nodeId: string | null) => void;
  readonly onHoverNode?: (nodeId: string | null) => void;
}

function createTextSprite(text: string, isDark: boolean): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
    ctx.shadowColor = isDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.9)';
    ctx.shadowBlur = 4;
    ctx.fillText(text.slice(0, 24), 128, 32);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(24, 6, 1);
  return sprite;
}

/**
 * Universo 3D Interativo do Mapa de Revisão (Three.js + Órbita 360° + Partículas Sinápticas).
 * Estética idêntica ao Obsidian Second Brain 3D:
 * Nós esféricos em cluster cósmico denso e coeso (sem distâncias exageradas),
 * cursor em mãozinha (pointer) garantido por raycasting generoso e controles fluidos.
 */
export const Constellation3DCanvas = memo(function Constellation3DCanvas({
  nodes,
  edges,
  masteries,
  selectedNodeId,
  highlightNodeIds,
  highlightEdgeIds,
  onSelectNode,
  onHoverNode,
}: Constellation3DCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const hoveredNodeIdRef = useRef<string | null>(null);
  const [isAutoRotating, setIsAutoRotating] = useState(false);

  // Manipuladores de controle de câmera
  const handleZoomIn = useCallback(() => {
    const cam = cameraRef.current;
    if (!cam) return;
    cam.position.multiplyScalar(0.8);
  }, []);

  const handleZoomOut = useCallback(() => {
    const cam = cameraRef.current;
    if (!cam) return;
    cam.position.multiplyScalar(1.25);
  }, []);

  const handleResetCamera = useCallback(() => {
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (!cam || !ctrl) return;
    cam.position.set(0, 0, 110);
    ctrl.target.set(0, 0, 0);
    ctrl.update();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || nodes.length === 0) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    const isDark = document.documentElement.classList.contains('dark');

    // 1. Cena Three.js
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isDark ? 0x030509 : 0xf1f5f9);
    scene.fog = new THREE.FogExp2(isDark ? 0x030509 : 0xf1f5f9, 0.0015);

    // 2. Câmera Perspectiva (enquadramento compacto)
    const camera = new THREE.PerspectiveCamera(52, width / height, 0.5, 2000);
    camera.position.set(0, 0, 110);
    cameraRef.current = camera;

    // 3. Renderizador WebGL
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    const dom = renderer.domElement;
    dom.style.cursor = 'grab';
    dom.style.touchAction = 'none';
    dom.style.display = 'block';
    dom.style.width = '100%';
    dom.style.height = '100%';
    container.appendChild(dom);

    // 4. OrbitControls 360°
    const controls = new OrbitControls(camera, dom);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 500;
    controls.minDistance = 35;
    controlsRef.current = controls;

    // 5. Iluminação Holográfica Estelar
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.9 : 1.3);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00f0ff, 1.6);
    dirLight1.position.set(100, 150, 100);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xc084fc, 1.3);
    dirLight2.position.set(-100, -80, -80);
    scene.add(dirLight2);

    // 6. Poeira Estelar Galáctica
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 300;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 800;
      starPositions[i + 1] = (Math.random() - 0.5) * 800;
      starPositions[i + 2] = (Math.random() - 0.5) * 800;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: isDark ? 0x94a3b8 : 0x64748b,
      size: 1.3,
      transparent: true,
      opacity: 0.55,
    });
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // 7. Inicializa Nós e Links 3D com cluster compacto
    const gNodes: Galaxy3DNode[] = initGalaxy3DNodes(nodes);
    const nodeIdSet = new Set(nodes.map((n) => n.id));
    const gLinks: Galaxy3DLink[] = initGalaxy3DLinks(edges, nodeIdSet);

    // Pré-relaxa física tridimensional
    for (let i = 0; i < 50; i++) {
      stepGalaxy3D(gNodes, gLinks, 0.08);
    }

    // 8. Criação das Malhas 3D para Nós e Hitboxes Fitts
    const nodeGroupMap = new Map<string, THREE.Group>();
    const interactiveTargets: THREE.Object3D[] = [];
    const sphereGeometry = new THREE.SphereGeometry(1, 24, 24);
    const hitGeometry = new THREE.SphereGeometry(1, 12, 12);
    // Utiliza material 100% transparente em vez de visible=false (o Raycaster do Three.js ignora objetos com visible=false)
    const hitMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
    const ringGeometry = new THREE.TorusGeometry(1, 0.12, 12, 32);

    const nodesRoot = new THREE.Group();
    scene.add(nodesRoot);

    for (const gNode of gNodes) {
      const originalNode = nodes.find((n) => n.id === gNode.id);
      if (!originalNode) continue;

      const mastery = masteries[gNode.id];
      const isNotStarted = !mastery || mastery.state === 'NOT_STARTED';
      const score = mastery?.masteryScore ?? 0;
      const dueCards = mastery?.dueFlashcardsCount ?? 0;

      const colors = getNodeObsidianColors(originalNode, score, isNotStarted, isDark);

      const group = new THREE.Group();
      group.position.set(gNode.x, gNode.y, gNode.z);

      // Esfera visual do Nó
      const sphereMat = new THREE.MeshStandardMaterial({
        color: colors.hexNumber,
        emissive: colors.hexNumber,
        emissiveIntensity: isNotStarted ? 0.12 : 0.7,
        roughness: 0.25,
        metalness: 0.45,
      });

      const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMat);
      sphereMesh.scale.setScalar(gNode.radius);
      sphereMesh.userData = { nodeId: gNode.id };
      group.add(sphereMesh);
      interactiveTargets.push(sphereMesh);

      // Hitbox generosa invisível para garantir cursor em mãozinha imediato (Lei de Fitts)
      const hitMesh = new THREE.Mesh(hitGeometry, hitMaterial);
      hitMesh.scale.setScalar(Math.max(8.5, gNode.radius * 2.6));
      hitMesh.userData = { nodeId: gNode.id };
      group.add(hitMesh);
      interactiveTargets.push(hitMesh);

      // Anel Âmbar para flashcards vencidos
      if (dueCards > 0) {
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xf2a93b });
        const ringMesh = new THREE.Mesh(ringGeometry, ringMat);
        ringMesh.scale.setScalar(gNode.radius + 1.2);
        ringMesh.rotation.x = Math.PI / 2;
        group.add(ringMesh);
      }

      // Rótulo tipográfico flutuante
      const labelSprite = createTextSprite(gNode.name, isDark);
      labelSprite.position.set(0, gNode.radius + 3.2, 0);
      labelSprite.userData = { nodeId: gNode.id };
      group.add(labelSprite);
      interactiveTargets.push(labelSprite);

      nodesRoot.add(group);
      nodeGroupMap.set(gNode.id, group);
    }

    // 9. Conexões Tridimensionais (Arestas Coesas)
    const linksRoot = new THREE.Group();
    scene.add(linksRoot);

    const lineMaterial = new THREE.LineBasicMaterial({
      color: isDark ? 0x38bdf8 : 0x0284c7,
      transparent: true,
      opacity: 0.4,
    });

    for (const gLink of gLinks) {
      const srcNode = gNodes.find((n) => n.id === gLink.sourceId);
      const tgtNode = gNodes.find((n) => n.id === gLink.targetId);
      if (!srcNode || !tgtNode) continue;

      const points = [
        new THREE.Vector3(srcNode.x, srcNode.y, srcNode.z),
        new THREE.Vector3(tgtNode.x, tgtNode.y, tgtNode.z),
      ];
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geom, lineMaterial);
      linksRoot.add(line);
    }

    // 10. Partículas Sinápticas Pulsantes
    const particleGeometry = new THREE.SphereGeometry(0.65, 12, 12);
    const particleMaterial = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const synapticParticles: { mesh: THREE.Mesh; src: Galaxy3DNode; tgt: Galaxy3DNode; progress: number; speed: number }[] = [];

    for (let i = 0; i < Math.min(gLinks.length, 30); i++) {
      const link = gLinks[i];
      const src = gNodes.find((n) => n.id === link.sourceId);
      const tgt = gNodes.find((n) => n.id === link.targetId);
      if (!src || !tgt) continue;

      const pMesh = new THREE.Mesh(particleGeometry, particleMaterial);
      scene.add(pMesh);
      synapticParticles.push({
        mesh: pMesh,
        src,
        tgt,
        progress: Math.random(),
        speed: 0.007 + Math.random() * 0.009,
      });
    }

    // 11. Raycaster Responsivo com Mãozinha Garantida no Canvas
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isPointerDown = false;
    let pointerDownStart = { x: 0, y: 0 };

    const handlePointerDown = (event: PointerEvent) => {
      isPointerDown = true;
      pointerDownStart = { x: event.clientX, y: event.clientY };
      if (!hoveredNodeIdRef.current) {
        dom.style.cursor = 'grabbing';
        container.style.cursor = 'grabbing';
      }
    };

    const handlePointerUp = (event: PointerEvent) => {
      isPointerDown = false;
      const movedDist = Math.hypot(event.clientX - pointerDownStart.x, event.clientY - pointerDownStart.y);

      // Clique intencional sem arrasto
      if (movedDist < 6) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(interactiveTargets);
        if (intersects.length > 0) {
          const hitId = intersects[0].object.userData.nodeId as string;
          onSelectNode(hitId || null);
        } else {
          onSelectNode(null);
        }
      }

      const nextCursor = hoveredNodeIdRef.current ? 'pointer' : 'grab';
      dom.style.cursor = nextCursor;
      container.style.cursor = nextCursor;
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = dom.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveTargets);

      if (intersects.length > 0) {
        const hitId = intersects[0].object.userData.nodeId as string;
        dom.style.cursor = 'pointer';
        container.style.cursor = 'pointer';

        if (hitId && hitId !== hoveredNodeIdRef.current) {
          hoveredNodeIdRef.current = hitId;
          onHoverNode?.(hitId);
        }
      } else {
        if (!isPointerDown) {
          dom.style.cursor = 'grab';
          container.style.cursor = 'grab';
        }
        if (hoveredNodeIdRef.current !== null) {
          hoveredNodeIdRef.current = null;
          onHoverNode?.(null);
        }
      }
    };

    dom.addEventListener('pointerdown', handlePointerDown);
    dom.addEventListener('pointerup', handlePointerUp);
    dom.addEventListener('pointermove', handlePointerMove);

    // 12. Loop de Animação e Renderização
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      controls.update();

      // Anima partículas sinápticas
      for (const sp of synapticParticles) {
        sp.progress += sp.speed;
        if (sp.progress > 1) sp.progress = 0;
        sp.mesh.position.lerpVectors(
          new THREE.Vector3(sp.src.x, sp.src.y, sp.src.z),
          new THREE.Vector3(sp.tgt.x, sp.tgt.y, sp.tgt.z),
          sp.progress,
        );
      }

      // Feedback suave de escala no nó destacado ou sob hover
      for (const [id, grp] of nodeGroupMap.entries()) {
        const isHovered = id === hoveredNodeIdRef.current;
        const isSelected = id === selectedNodeId;
        const targetScale = isSelected ? 1.25 : isHovered ? 1.15 : 1.0;
        grp.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
      }

      renderer.render(scene, camera);
    };

    animate();

    // 13. Redimensionamento Responsivo
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Limpeza de recursos WebGL ao desmontar
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('pointerdown', handlePointerDown);
      dom.removeEventListener('pointerup', handlePointerUp);
      dom.removeEventListener('pointermove', handlePointerMove);

      renderer.dispose();
      sphereGeometry.dispose();
      hitGeometry.dispose();
      hitMaterial.dispose();
      ringGeometry.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      lineMaterial.dispose();
      starGeometry.dispose();
      starMaterial.dispose();

      if (container.contains(dom)) {
        container.removeChild(dom);
      }
    };
  }, [nodes, edges, masteries, selectedNodeId, highlightNodeIds, highlightEdgeIds, onSelectNode, onHoverNode]);

  // Atualiza auto-rotação nos OrbitControls
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = isAutoRotating;
      controlsRef.current.autoRotateSpeed = 1.0;
    }
  }, [isAutoRotating]);

  return (
    <div className="relative h-full w-full overflow-hidden select-none bg-slate-950">
      {/* Contêiner WebGL */}
      <div ref={containerRef} className="h-full w-full" role="application" aria-label="Universo 3D do Mapa de Revisão" />

      {/* Controles Flutuantes da Visão 3D */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 rounded-xl border border-slate-700/60 bg-slate-900/80 p-1.5 backdrop-blur-md shadow-lg">
        <button
          type="button"
          onClick={() => setIsAutoRotating((prev) => !prev)}
          title={isAutoRotating ? 'Pausar rotação da galáxia' : 'Girar galáxia 360°'}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
            isAutoRotating
              ? 'bg-primary-600 text-white shadow-xs'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <RotateCw className={`h-3.5 w-3.5 ${isAutoRotating ? 'animate-spin' : ''}`} />
          <span>{isAutoRotating ? 'Girando' : 'Girar 360°'}</span>
        </button>

        <div className="h-4 w-px bg-slate-700/60" />

        <button
          type="button"
          onClick={handleZoomIn}
          title="Aproximar Câmera"
          className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={handleZoomOut}
          title="Afastar Câmera"
          className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={handleResetCamera}
          title="Recentralizar Universo"
          className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
        >
          <Compass className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
});
