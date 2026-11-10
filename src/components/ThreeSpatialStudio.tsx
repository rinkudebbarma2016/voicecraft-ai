import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  Play,
  Pause,
  RotateCcw,
  Video,
  Download,
  Sparkles,
  Layers,
  Camera,
  Sun,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Check,
  Film,
  Plus,
} from 'lucide-react';
import { StoryboardScene, ImageToVideoAspectRatio } from '../types/imageToVideo';

export type ThreeCameraPreset = 'orbit' | 'dolly' | 'isometric' | 'parallax' | 'cinema-curve';
export type ThreeLightingTheme = 'studio' | 'cyberpunk' | 'golden-hour' | 'deep-space';
export type ThreeParticleStyle = 'embers' | 'dust' | 'constellation' | 'none';

interface ThreeSpatialStudioProps {
  sourceImage: string;
  sourceImageName: string;
  aspectRatio: ImageToVideoAspectRatio;
  duration: number;
  prompt: string;
  headline?: string;
  subheadline?: string;
  zDepthMove?: number;
  perspectiveIntensity?: number;
  depthCurvature?: number;
  onDepthConfigChange?: (config: { zDepthMove: number; perspectiveIntensity: number; depthCurvature: number }) => void;
  onAddSceneToStoryboard?: (scene: StoryboardScene) => void;
  onExportVideoRecorded?: (videoUrl: string, title: string) => void;
}

// Pre-allocated reusable math vectors (Zero GC in animation loop per Three.js guidelines)
const _vec3 = new THREE.Vector3();
const _targetPos = new THREE.Vector3();
const _lookAtTarget = new THREE.Vector3(0, 0, 0);

export const ThreeSpatialStudio: React.FC<ThreeSpatialStudioProps> = ({
  sourceImage,
  sourceImageName,
  aspectRatio,
  duration,
  prompt,
  headline,
  subheadline,
  zDepthMove = 1.8,
  perspectiveIntensity = 48,
  depthCurvature = 0.35,
  onDepthConfigChange,
  onAddSceneToStoryboard,
  onExportVideoRecorded,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());

  // Dynamic 3D Object references
  const stageGroupRef = useRef<THREE.Group | null>(null);
  const screenMeshRef = useRef<THREE.Mesh | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const fillLightRef = useRef<THREE.HemisphereLight | null>(null);
  const rimLightRef = useRef<THREE.PointLight | null>(null);
  const titlePlateRef = useRef<THREE.Group | null>(null);

  // Recording states
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [isRecording3D, setIsRecording3D] = useState<boolean>(false);
  const [recordedProgress, setRecordedProgress] = useState<number>(0);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);

  // 3D Visual Options & Depth State
  const [cameraPreset, setCameraPreset] = useState<ThreeCameraPreset>('orbit');
  const [lightingTheme, setLightingTheme] = useState<ThreeLightingTheme>('studio');
  const [particleStyle, setParticleStyle] = useState<ThreeParticleStyle>('dust');
  const [internalZDepth, setInternalZDepth] = useState<number>(zDepthMove);
  const [internalFov, setInternalFov] = useState<number>(perspectiveIntensity);
  const [depthCurve, setDepthCurve] = useState<number>(depthCurvature);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [showTitlePlate, setShowTitlePlate] = useState<boolean>(true);
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const internalZDepthRef = useRef<number>(zDepthMove);
  internalZDepthRef.current = internalZDepth;
  const internalFovRef = useRef<number>(perspectiveIntensity);
  internalFovRef.current = internalFov;
  const depthCurveRef = useRef<number>(depthCurvature);
  depthCurveRef.current = depthCurve;

  // Sync when parent scene props change
  useEffect(() => {
    if (zDepthMove !== undefined) {
      setInternalZDepth(zDepthMove);
      internalZDepthRef.current = zDepthMove;
    }
  }, [zDepthMove]);

  useEffect(() => {
    if (perspectiveIntensity !== undefined) {
      setInternalFov(perspectiveIntensity);
      internalFovRef.current = perspectiveIntensity;
    }
  }, [perspectiveIntensity]);

  useEffect(() => {
    if (depthCurvature !== undefined) {
      setDepthCurve(depthCurvature);
      depthCurveRef.current = depthCurvature;
    }
  }, [depthCurvature]);

  // Handle local depth changes with parent callback
  const handleUpdateDepthSettings = (updates: { z?: number; fov?: number; curve?: number }) => {
    const newZ = updates.z !== undefined ? updates.z : internalZDepth;
    const newFov = updates.fov !== undefined ? updates.fov : internalFov;
    const newCurve = updates.curve !== undefined ? updates.curve : depthCurve;

    if (updates.z !== undefined) setInternalZDepth(newZ);
    if (updates.fov !== undefined) setInternalFov(newFov);
    if (updates.curve !== undefined) setDepthCurve(newCurve);

    if (onDepthConfigChange) {
      onDepthConfigChange({
        zDepthMove: newZ,
        perspectiveIntensity: newFov,
        depthCurvature: newCurve,
      });
    }
  };

  // Determine aspect ratio dimensions for 3D screen mesh
  const getAspectWidthHeight = useCallback((aspect: ImageToVideoAspectRatio) => {
    switch (aspect) {
      case '9:16':
        return { w: 3.6, h: 6.4 };
      case '4:5':
        return { w: 4.0, h: 5.0 };
      case '1:1':
        return { w: 4.8, h: 4.8 };
      case '21:9':
        return { w: 7.0, h: 3.0 };
      case '16:9':
      default:
        return { w: 6.4, h: 3.6 };
    }
  }, []);

  // Show a brief toast
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // =========================================================================
  // INITIALIZE THREE.JS WEBGL SPATIAL STAGE
  // =========================================================================
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Detect software WebGL per Three.js skill
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Setup Renderer with physical standards
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 450;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true, // Needed for recording & capturing snapshots
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. Setup Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x09090b); // Tailwind zinc-950 dark tone
    scene.fog = new THREE.FogExp2(0x09090b, 0.025);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 9);
    cameraRef.current = camera;

    // 4. Setup OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 22;
    controls.minDistance = 2;
    controls.maxPolarAngle = Math.PI / 2 + 0.1; // Don't go too far under ground
    controlsRef.current = controls;

    // 5. Studio Environment Reflection via RoomEnvironment
    try {
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
    } catch (err) {
      console.warn('RoomEnvironment fallback:', err);
    }

    // 6. Balanced 3-Point Lighting Rig
    const keyLight = new THREE.DirectionalLight(0xfff3e0, 2.2); // Warm key
    keyLight.position.set(6, 8, 7);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);
    keyLightRef.current = keyLight;

    const fillLight = new THREE.HemisphereLight(0x38bdf8, 0x09090b, 1.2); // Cool sky / dark ground
    scene.add(fillLight);
    fillLightRef.current = fillLight;

    const rimLight = new THREE.PointLight(0x06b6d4, 3.5, 20); // Cyan rim back light
    rimLight.position.set(-6, 3, -4);
    scene.add(rimLight);
    rimLightRef.current = rimLight;

    // 7. Ground Contact Shadow & Stage Grid
    const groundGeo = new THREE.PlaneGeometry(30, 30);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      roughness: 0.85,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2.2;
    ground.receiveShadow = !isSoftwareGl;
    scene.add(ground);

    // Subtle radial contact shadow plane
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const shadowCtx = shadowCanvas.getContext('2d');
    if (shadowCtx) {
      const grad = shadowCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
      grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      shadowCtx.fillStyle = grad;
      shadowCtx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 5),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
      })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -2.18;
    scene.add(shadowPlane);

    // 8. Composite 3D Screen Monolith Assembly (THREE.Group)
    const stageGroup = new THREE.Group();
    scene.add(stageGroup);
    stageGroupRef.current = stageGroup;

    // Load initial source image as texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      sourceImage,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();

        const { w, h } = getAspectWidthHeight(aspectRatio);

        // Screen Bezel Frame (Brushed Titanium PBR)
        const frameGeo = new THREE.BoxGeometry(w + 0.25, h + 0.25, 0.15);
        const frameMat = new THREE.MeshStandardMaterial({
          color: 0x18181b,
          metalness: 0.85,
          roughness: 0.25,
        });
        const frameMesh = new THREE.Mesh(frameGeo, frameMat);
        frameMesh.position.z = -0.05;
        frameMesh.castShadow = !isSoftwareGl;
        stageGroup.add(frameMesh);

        // Active Screen Surface with Subtle Curvature
        const segmentsX = 32;
        const screenGeo = new THREE.PlaneGeometry(w, h, segmentsX, 8);
        // Apply cylinder curve based on depthCurve
        const pos = screenGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          const zOffset = (1 - Math.cos((x / (w * 0.5)) * (Math.PI * 0.25))) * depthCurve;
          pos.setZ(i, -zOffset);
        }
        screenGeo.computeVertexNormals();

        const screenMat = new THREE.MeshStandardMaterial({
          map: tex,
          roughness: 0.4,
          metalness: 0.1,
          side: THREE.DoubleSide,
        });
        const screenMesh = new THREE.Mesh(screenGeo, screenMat);
        screenMesh.castShadow = !isSoftwareGl;
        stageGroup.add(screenMesh);
        screenMeshRef.current = screenMesh;

        // Glowing Backlight Trim
        const glowGeo = new THREE.BoxGeometry(w + 0.35, h + 0.35, 0.05);
        const glowMat = new THREE.MeshBasicMaterial({
          color: 0x06b6d4,
          transparent: true,
          opacity: 0.2,
        });
        const glowMesh = new THREE.Mesh(glowGeo, glowMat);
        glowMesh.position.z = -0.12;
        stageGroup.add(glowMesh);

        // 3D Floating Lower-Third Title Plate
        const titleGroup = new THREE.Group();
        const plateGeo = new THREE.PlaneGeometry(w * 0.85, 0.65);
        const plateCanvas = document.createElement('canvas');
        plateCanvas.width = 512;
        plateCanvas.height = 128;
        const pCtx = plateCanvas.getContext('2d');
        if (pCtx) {
          pCtx.fillStyle = 'rgba(9, 9, 11, 0.85)';
          pCtx.roundRect(4, 4, 504, 120, 16);
          pCtx.fill();
          pCtx.lineWidth = 4;
          pCtx.strokeStyle = '#06b6d4';
          pCtx.stroke();
          pCtx.fillStyle = '#ffffff';
          pCtx.font = 'bold 32px sans-serif';
          pCtx.fillText((headline || sourceImageName || '3D SPATIAL PRESENTATION').slice(0, 26).toUpperCase(), 24, 54);
          pCtx.fillStyle = '#38bdf8';
          pCtx.font = '22px monospace';
          pCtx.fillText((subheadline || 'Spatial 3D Neural Viewport').slice(0, 36), 24, 96);
        }
        const plateTex = new THREE.CanvasTexture(plateCanvas);
        plateTex.colorSpace = THREE.SRGBColorSpace;
        const plateMat = new THREE.MeshBasicMaterial({
          map: plateTex,
          transparent: true,
          depthWrite: false,
        });
        const plateMesh = new THREE.Mesh(plateGeo, plateMat);
        plateMesh.position.set(0, -h * 0.45, 0.3);
        titleGroup.add(plateMesh);
        stageGroup.add(titleGroup);
        titlePlateRef.current = titleGroup;
      },
      undefined,
      (err) => console.warn('Could not load 3D texture:', err)
    );

    // 9. 3D Floating Particle Atmosphere
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePos[i] = (Math.random() - 0.5) * 16;
      particlePos[i + 1] = Math.random() * 8 - 2;
      particlePos[i + 2] = (Math.random() - 0.5) * 14;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.08,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    particlesRef.current = particles;

    // 10. Continuous 3D Animation Loop
    clockRef.current.start();
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      const elapsedTime = clockRef.current.getElapsedTime();
      const delta = clockRef.current.getDelta();

      // Camera preset choreography with Z-axis travel depth offset
      const zOffset = internalZDepthRef.current;
      if (cameraPreset === 'orbit' && autoRotate) {
        const radius = Math.max(3.2, 8.5 - zOffset * 0.7);
        const angle = elapsedTime * 0.25;
        _targetPos.set(Math.sin(angle) * radius, 1.2 + Math.sin(angle * 0.5) * 0.6, Math.cos(angle) * radius);
        camera.position.lerp(_targetPos, 0.04);
        camera.lookAt(_lookAtTarget);
      } else if (cameraPreset === 'dolly') {
        const baseDist = Math.max(2.2, 7.5 - zOffset);
        const dist = baseDist + Math.sin(elapsedTime * 0.5) * (1.5 + Math.abs(zOffset) * 0.5);
        _targetPos.set(0, 0.5, dist);
        camera.position.lerp(_targetPos, 0.04);
        camera.lookAt(_lookAtTarget);
      } else if (cameraPreset === 'isometric') {
        const scale = Math.max(0.4, 1.0 - zOffset * 0.12);
        _targetPos.set(6.5 * scale, 4.5 * scale, 6.5 * scale);
        camera.position.lerp(_targetPos, 0.03);
        camera.lookAt(_lookAtTarget);
      } else if (cameraPreset === 'parallax') {
        const zDist = Math.max(3.0, 7.8 - zOffset);
        _targetPos.set(Math.sin(elapsedTime * 0.8) * 2.5, 1.0 + Math.cos(elapsedTime * 0.6) * 0.8, zDist);
        camera.position.lerp(_targetPos, 0.05);
        camera.lookAt(_lookAtTarget);
      } else {
        controls.update();
      }

      // Floating gentle motion of stage group
      if (stageGroupRef.current) {
        stageGroupRef.current.position.y = Math.sin(elapsedTime * 0.8) * 0.08;
        stageGroupRef.current.rotation.y = Math.sin(elapsedTime * 0.3) * 0.04;
      }

      // Animate floating particles
      if (particlesRef.current) {
        const pArray = particlesRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 1; i < pArray.length; i += 3) {
          pArray[i] += delta * 0.3;
          if (pArray[i] > 6) pArray[i] = -2;
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 11. Responsive Resize Observer
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      renderer.dispose();
      controls.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [aspectRatio, getAspectWidthHeight, sourceImage]);

  // Update 3D Lighting Theme dynamically
  useEffect(() => {
    if (!keyLightRef.current || !fillLightRef.current || !rimLightRef.current || !sceneRef.current) return;

    switch (lightingTheme) {
      case 'cyberpunk':
        keyLightRef.current.color.set(0xf43f5e); // Neon pink
        fillLightRef.current.color.set(0x06b6d4); // Cyan
        rimLightRef.current.color.set(0xa855f7); // Purple
        sceneRef.current.fog = new THREE.FogExp2(0x0f172a, 0.03);
        break;
      case 'golden-hour':
        keyLightRef.current.color.set(0xf59e0b); // Amber
        fillLightRef.current.color.set(0x78350f); // Warm dark
        rimLightRef.current.color.set(0xfbbf24); // Gold rim
        sceneRef.current.fog = new THREE.FogExp2(0x1c1917, 0.03);
        break;
      case 'deep-space':
        keyLightRef.current.color.set(0x818cf8); // Indigo
        fillLightRef.current.color.set(0x1e1b4b); // Deep navy
        rimLightRef.current.color.set(0x38bdf8); // Sky blue
        sceneRef.current.fog = new THREE.FogExp2(0x030712, 0.035);
        break;
      case 'studio':
      default:
        keyLightRef.current.color.set(0xfff3e0);
        fillLightRef.current.color.set(0x38bdf8);
        rimLightRef.current.color.set(0x06b6d4);
        sceneRef.current.fog = new THREE.FogExp2(0x09090b, 0.025);
        break;
    }
  }, [lightingTheme]);

  // Update 3D Particle Styling
  useEffect(() => {
    if (!particlesRef.current) return;
    const mat = particlesRef.current.material as THREE.PointsMaterial;
    if (particleStyle === 'none') {
      mat.opacity = 0;
    } else if (particleStyle === 'embers') {
      mat.opacity = 0.8;
      mat.color.set(0xf59e0b);
      mat.size = 0.12;
    } else if (particleStyle === 'constellation') {
      mat.opacity = 0.7;
      mat.color.set(0x38bdf8);
      mat.size = 0.1;
    } else {
      mat.opacity = 0.55;
      mat.color.set(0xe0f2fe);
      mat.size = 0.07;
    }
  }, [particleStyle]);

  // Toggle title plate
  useEffect(() => {
    if (titlePlateRef.current) {
      titlePlateRef.current.visible = showTitlePlate;
    }
  }, [showTitlePlate]);

  // Dynamically update Perspective Camera FOV (Perspective Intensity)
  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.fov = internalFov;
      cameraRef.current.updateProjectionMatrix();
    }
  }, [internalFov]);

  // Dynamically update Screen Mesh 3D Curvature
  useEffect(() => {
    if (!screenMeshRef.current) return;
    const geo = screenMeshRef.current.geometry as THREE.BufferGeometry;
    const { w } = getAspectWidthHeight(aspectRatio);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const zOffset = (1 - Math.cos((x / (w * 0.5)) * (Math.PI * 0.25))) * depthCurve;
      pos.setZ(i, -zOffset);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }, [depthCurve, aspectRatio, getAspectWidthHeight]);

  // =========================================================================
  // 3D VIDEO RECORDING & EXPORT
  // =========================================================================
  const handleStartRecording3D = () => {
    const canvas = rendererRef.current?.domElement;
    if (!canvas) return;

    try {
      const stream = canvas.captureStream(30);
      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const mr = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8000000 });
      recordedChunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      mr.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        setIsRecording3D(false);
        setRecordedProgress(100);
        triggerToast('3D Spatial Video successfully rendered and ready to play!');
        if (onExportVideoRecorded) {
          onExportVideoRecorded(url, `${sourceImageName || '3D Scene'} (3D Spatial Video)`);
        }
      };

      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording3D(true);
      setRecordedProgress(0);

      const targetSec = Math.max(3, Math.min(20, duration || 6));
      let currentSec = 0;
      const interval = setInterval(() => {
        currentSec += 0.2;
        const pct = Math.min(99, Math.round((currentSec / targetSec) * 100));
        setRecordedProgress(pct);

        if (currentSec >= targetSec) {
          clearInterval(interval);
          if (mr.state === 'recording') {
            mr.stop();
          }
        }
      }, 200);
    } catch (err) {
      console.error('3D Video record error:', err);
      alert('Could not record 3D canvas on this browser.');
    }
  };

  // Add 3D scene to Storyboard timeline
  const handleAdd3DToStoryboard = () => {
    const canvas = rendererRef.current?.domElement;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const newScene: StoryboardScene = {
      id: `scene-3d-${Date.now()}`,
      title: `${sourceImageName || '3D Spatial Scene'} (3D Extrusion)`,
      image: dataUrl,
      imageName: `${sourceImageName || '3D Scene'}`,
      mediaType: 'image',
      prompt: `3D spatial camera ${cameraPreset} shot of ${sourceImageName || prompt}`,
      narrationScript: `Spatial 3D presentation perspective exploring ${sourceImageName}...`,
      motion: 'orbit',
      atmosphere: particleStyle === 'embers' ? 'embers' : 'dust-particles',
      duration: duration || 5,
      transition: 'cross-dissolve',
      zDepthMove: internalZDepth,
      perspectiveIntensity: internalFov,
      depthCurvature: depthCurve,
      lowerThird: {
        enabled: true,
        headline: (headline || sourceImageName || '3D SPATIAL PRESENTATION').toUpperCase().slice(0, 24),
        subheadline: `3D ${cameraPreset.toUpperCase()} PERSPECTIVE`,
        position: 'bottom-left',
      },
    };

    if (onAddSceneToStoryboard) {
      onAddSceneToStoryboard(newScene);
      triggerToast('Added 3D Spatial Scene to your Storyboard timeline!');
    }
  };

  // Snapshot 3D image download
  const handleDownloadSnapshot = () => {
    const canvas = rendererRef.current?.domElement;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `3d_spatial_${Date.now()}.png`;
    a.click();
    triggerToast('3D snapshot downloaded!');
  };

  return (
    <div className="relative w-full h-[620px] bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl flex flex-col">
      {/* 3D Top Header Bar */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-zinc-900/90 border border-zinc-700/80 px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md">
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
        <span className="text-xs font-bold text-white tracking-wide">
          Three.js 3D Spatial Stage
        </span>
        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800/60 uppercase">
          WebGL PBR
        </span>
      </div>

      {/* Top Right Quick Actions */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={handleDownloadSnapshot}
          className="px-3 py-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-200 hover:text-white flex items-center gap-1.5 shadow-lg backdrop-blur-md transition cursor-pointer"
          title="Download snapshot of current 3D view"
        >
          <Camera className="w-3.5 h-3.5 text-cyan-400" />
          <span>3D Snapshot</span>
        </button>

        <button
          type="button"
          onClick={handleAdd3DToStoryboard}
          className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-cyan-600/30 transition cursor-pointer"
          title="Add this 3D scene directly into your Storyboard sequence"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add 3D to Storyboard</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs font-semibold px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main 3D Canvas Container */}
      <div
        ref={mountRef}
        className="w-full flex-1 cursor-grab active:cursor-grabbing bg-zinc-950 overflow-hidden"
        title="Click and drag to rotate in 3D, scroll to zoom"
      />

      {/* Recording Overlay Progress */}
      {isRecording3D && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 relative flex items-center justify-center mb-3">
            <div className="absolute inset-0 rounded-full border-4 border-cyan-500/30 border-t-cyan-400 animate-spin" />
            <Film className="w-7 h-7 text-cyan-400" />
          </div>
          <h4 className="text-base font-bold text-white mb-1">
            Recording 3D Spatial Video...
          </h4>
          <p className="text-xs text-zinc-400 mb-3">
            Capturing real-time 3D camera trajectory and volumetric lighting ({duration || 6}s)
          </p>
          <div className="w-64 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-150"
              style={{ width: `${recordedProgress}%` }}
            />
          </div>
          <span className="text-xs font-mono text-cyan-300 font-bold mt-2">
            {recordedProgress}%
          </span>
        </div>
      )}

      {/* Recorded Video Ready Popup / Player */}
      {recordedVideoUrl && !isRecording3D && (
        <div className="absolute inset-x-4 bottom-24 z-30 bg-zinc-900 border border-cyan-500/50 p-3 rounded-xl shadow-2xl flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">
                3D Spatial Video Rendered!
              </div>
              <div className="text-[11px] text-zinc-400">
                Play, download, or review your 3D spatial recording.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={recordedVideoUrl}
              download="3d_spatial_video.webm"
              className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download WebM</span>
            </a>
            <button
              onClick={() => setRecordedVideoUrl(null)}
              className="text-zinc-400 hover:text-white text-xs px-2 py-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ERGONOMIC COLLAPSIBLE BOTTOM 3D DOCK (Per Three.js Guidelines)         */}
      {/* ===================================================================== */}
      <div
        className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-4xl transition-transform duration-300 ${
          isDockCollapsed ? 'translate-y-[calc(100%-36px)]' : 'translate-y-0'
        }`}
      >
        {/* Collapse Toggle Tab */}
        <div className="flex justify-center mb-1">
          <button
            type="button"
            onClick={() => setIsDockCollapsed(!isDockCollapsed)}
            className="px-3 py-1 rounded-t-lg bg-zinc-900/95 border border-b-0 border-zinc-700 text-[11px] font-semibold text-zinc-300 hover:text-white flex items-center gap-1 backdrop-blur-md shadow-lg cursor-pointer"
          >
            {isDockCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
                <span>Show 3D Studio Controls</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                <span>Hide Controls (Full 3D View)</span>
              </>
            )}
          </button>
        </div>

        {/* Unified Horizontal Dock */}
        <div className="bg-zinc-900/95 border border-zinc-800 rounded-2xl p-3 shadow-2xl backdrop-blur-md flex flex-col gap-2.5">
          {/* Top Row: Presets and Mode Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Camera Preset Pills */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mr-1 flex items-center gap-1">
                <Camera className="w-3 h-3 text-cyan-400" />
                <span>Motion</span>
              </span>
              {(
                [
                  { id: 'orbit', label: '3D Orbit' },
                  { id: 'dolly', label: 'Dolly' },
                  { id: 'isometric', label: 'Isometric' },
                  { id: 'parallax', label: 'Parallax' },
                ] as const
              ).map((cp) => (
                <button
                  key={cp.id}
                  type="button"
                  onClick={() => {
                    setCameraPreset(cp.id);
                    setAutoRotate(true);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    cameraPreset === cp.id
                      ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-600/30'
                      : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  {cp.label}
                </button>
              ))}
            </div>

            {/* Lighting Presets */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mr-1 flex items-center gap-1">
                <Sun className="w-3 h-3 text-amber-400" />
                <span>Light</span>
              </span>
              {(
                [
                  { id: 'studio', label: 'Studio' },
                  { id: 'cyberpunk', label: 'Cyber' },
                  { id: 'golden-hour', label: 'Golden' },
                  { id: 'deep-space', label: 'Space' },
                ] as const
              ).map((lt) => (
                <button
                  key={lt.id}
                  type="button"
                  onClick={() => setLightingTheme(lt.id)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                    lightingTheme === lt.id
                      ? 'bg-amber-600 text-white font-bold'
                      : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  {lt.label}
                </button>
              ))}
            </div>

            {/* Particles */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mr-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Particles</span>
              </span>
              {(
                [
                  { id: 'dust', label: 'Dust' },
                  { id: 'embers', label: 'Embers' },
                  { id: 'constellation', label: 'Stars' },
                  { id: 'none', label: 'None' },
                ] as const
              ).map((ps) => (
                <button
                  key={ps.id}
                  type="button"
                  onClick={() => setParticleStyle(ps.id)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                    particleStyle === ps.id
                      ? 'bg-purple-600 text-white font-bold'
                      : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  {ps.label}
                </button>
              ))}
            </div>

            {/* Title Plate & Record Action */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowTitlePlate(!showTitlePlate)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                  showTitlePlate
                    ? 'bg-zinc-800 text-cyan-300 border border-cyan-500/40'
                    : 'bg-zinc-950 text-zinc-500 border border-zinc-800'
                }`}
                title="Toggle 3D floating title badge"
              >
                3D Title: {showTitlePlate ? 'ON' : 'OFF'}
              </button>

              <button
                type="button"
                disabled={isRecording3D}
                onClick={handleStartRecording3D}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-600/30 transition cursor-pointer disabled:opacity-50"
                title="Record and render a 3D video clip directly from WebGL canvas"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Record 3D Video</span>
              </button>
            </div>
          </div>

          {/* Bottom Row: 3D Camera Depth & Perspective Intensity Sliders */}
          <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Z-Axis Depth Movement */}
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 shrink-0">
                Z-Depth:
              </span>
              <input
                type="range"
                min="-3.0"
                max="5.0"
                step="0.1"
                value={internalZDepth}
                onChange={(e) => handleUpdateDepthSettings({ z: parseFloat(e.target.value) })}
                className="flex-1 accent-cyan-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                title="Control camera push-in / pull-back along Z-axis"
              />
              <span className="text-[11px] font-mono text-cyan-300 font-bold shrink-0 w-10 text-right">
                {internalZDepth > 0 ? `+${internalZDepth.toFixed(1)}` : internalZDepth.toFixed(1)}
              </span>
            </div>

            {/* Perspective Intensity (FOV) */}
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 shrink-0">
                FOV Lens:
              </span>
              <input
                type="range"
                min="30"
                max="85"
                step="1"
                value={internalFov}
                onChange={(e) => handleUpdateDepthSettings({ fov: parseInt(e.target.value, 10) })}
                className="flex-1 accent-indigo-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                title="Camera perspective intensity / Field of view"
              />
              <span className="text-[11px] font-mono text-indigo-300 font-bold shrink-0 w-8 text-right">
                {internalFov}°
              </span>
            </div>

            {/* 3D Screen Curvature */}
            <div className="flex items-center gap-2 flex-1 min-w-[180px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400 shrink-0">
                3D Curve:
              </span>
              <input
                type="range"
                min="0"
                max="1.0"
                step="0.05"
                value={depthCurve}
                onChange={(e) => handleUpdateDepthSettings({ curve: parseFloat(e.target.value) })}
                className="flex-1 accent-pink-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                title="Screen mesh 3D spatial curvature"
              />
              <span className="text-[11px] font-mono text-pink-300 font-bold shrink-0 w-10 text-right">
                {Math.round(depthCurve * 100)}%
              </span>
            </div>

            {/* Depth Quick Presets */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handleUpdateDepthSettings({ z: 3.5, fov: 65, curve: 0.45 })}
                className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
                title="Deep plunge inward with wide perspective"
              >
                Deep Push
              </button>
              <button
                type="button"
                onClick={() => handleUpdateDepthSettings({ z: 1.5, fov: 48, curve: 0.25 })}
                className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
                title="Natural balanced cinema depth"
              >
                Neutral
              </button>
              <button
                type="button"
                onClick={() => handleUpdateDepthSettings({ z: 2.2, fov: 75, curve: 0.75 })}
                className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
                title="Dramatic IMAX curved display"
              >
                IMAX Curve
              </button>
              <button
                type="button"
                onClick={() => handleUpdateDepthSettings({ z: -2.0, fov: 80, curve: 0.1 })}
                className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
                title="Wide expansive pull-back"
              >
                Pull-Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
