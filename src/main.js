/**
 * Apex Studio - Ferrari F1 Interactive 3D Showcase
 * High-end automotive studio showcase featuring clean standalone Ferrari F1 glTF asset.
 * Includes dynamic PBR reflections, studio lighting rigs, 8 camera presets,
 * turntable auto-rotation, and responsive glassmorphism HUD.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// ---------------------------------------------------------------------------
// Application State
// ---------------------------------------------------------------------------
const state = {
    autoRotate: false,
    userInteracting: false,
    activeLighting: 'dark',
    cameraTransitioning: false,
    modelLoaded: false,
    carDimensions: null
};

let autoRotateResumeTimer = null;

// ---------------------------------------------------------------------------
// Authoritative Livery Palette (Permanent Freeze: Emerald Teal + Gold)
// ---------------------------------------------------------------------------
const LIVERY_CONFIG = {
    // Primary Body Paint: Emerald Teal / British Racing Green Metallic
    tealBody: 0x094547,
    // Halo Hoop: Dark Satin Carbon Fiber
    carbonHalo: 0x0c0e10,
    // Front Wing Flaps: Glossy Carbon Black
    carbonFrontWing: 0x08090b,
    // Rear Wing Aerofoils: Deep Dark Teal Carbon
    carbonRearWing: 0x0a1614,
    // Glossy Aero Carbon Fiber
    carbonGloss: { r: 0.006, g: 0.007, b: 0.008 },
    // Matte Underbody / Diffuser / Plank Carbon
    carbonMatte: { r: 0.012, g: 0.013, b: 0.015 },
    // Dedicated Wheel Aero Disc Covers & Controls Accent: Dark Satin Black Carbon
    wheelCoverCarbon: 0x070809,
    // Sidepod & Engine Cover Livery Swoop: Crisp Silver-White
    whiteSwoop: 0xf0f3f6,
    // Wheel Outer Rim Lip: Champagne Bronze / Gold Metallic
    goldRim: 0xbfa15f,
    // Wheel Center Hub Nut: Metallic Gold
    goldHubNut: 0xd4af37,
    // Mechanical Actuators / DRS Pivot: Champagne Bronze / Gold Metallic
    goldMech: 0xc5a059,
    // Procedural Shader Gold Racing Stripe [R, G, B]
    goldStripeRGB: [0.75, 0.63, 0.37],
    // Showroom Stage Plinth Metallic Accent Ring
    plinthRingGold: 0xbfa15f,
    plinthRingEmissive: 0x221a0a
};

// ---------------------------------------------------------------------------
// Studio Lighting Environments (Calibrated for High-End Cinematic Studio)
// ---------------------------------------------------------------------------
const LIGHTING_PRESETS = {
    dark: {
        name: 'Obsidian Dark Studio',
        bg: 0x07090C,
        floorColor: 0x0A0D11,
        floorRoughness: 0.45,
        floorMetalness: 0.08,
        keyIntensity: 2.2,
        keyColor: 0xFFFAF2,
        rim1Intensity: 1.6,
        rim1Color: 0xEDF2F7,
        rim2Intensity: 1.2,
        rim2Color: 0xE2E8F0,
        overheadIntensity: 0.7,
        fillIntensity: 0.4,
        fillColor: 0x2A323D,
        ambientIntensity: 0.25,
        exposure: 0.98
    },
    white: {
        name: 'Clean White Cyc',
        bg: 0xD6DBE0,
        floorColor: 0xDFE3E8,
        floorRoughness: 0.38,
        floorMetalness: 0.05,
        keyIntensity: 1.8,
        keyColor: 0xFFFFFF,
        rim1Intensity: 1.1,
        rim1Color: 0xFFFFFF,
        rim2Intensity: 1.1,
        rim2Color: 0xFFFFFF,
        overheadIntensity: 0.8,
        fillIntensity: 1.0,
        fillColor: 0xD0D6DC,
        ambientIntensity: 0.55,
        exposure: 0.90
    },
    neon: {
        name: 'Cyber Neon',
        bg: 0x05070A,
        floorColor: 0x07090D,
        floorRoughness: 0.28,
        floorMetalness: 0.12,
        keyIntensity: 1.7,
        keyColor: 0xDDEEFF,
        rim1Intensity: 2.5,
        rim1Color: 0x00D4FF,
        rim2Intensity: 2.0,
        rim2Color: 0xE0006A,
        overheadIntensity: 0.5,
        fillIntensity: 0.3,
        fillColor: 0x1A222C,
        ambientIntensity: 0.20,
        exposure: 0.98
    },
    golden: {
        name: 'Golden Hour',
        bg: 0x0E0B08,
        floorColor: 0x120E0A,
        floorRoughness: 0.38,
        floorMetalness: 0.08,
        keyIntensity: 2.2,
        keyColor: 0xFFD8AA,
        rim1Intensity: 1.7,
        rim1Color: 0xFFA038,
        rim2Intensity: 1.1,
        rim2Color: 0x6688AA,
        overheadIntensity: 0.6,
        fillIntensity: 0.4,
        fillColor: 0x30251B,
        ambientIntensity: 0.30,
        exposure: 0.96
    }
};

// ---------------------------------------------------------------------------
// Camera Presets (8 Professional Angles Calibrated with Studio Reference)
// ---------------------------------------------------------------------------
const CAMERA_PRESETS = {
    'overview': {
        name: 'Studio Overview',
        pos: new THREE.Vector3(4.8, 2.1, 4.8),
        target: new THREE.Vector3(0.0, 0.65, 0.0)
    },
    'front-three-quarter': {
        name: 'Front 3/4',
        pos: new THREE.Vector3(4.5, 1.35, 4.8),
        target: new THREE.Vector3(0.0, 0.55, 0.35)
    },
    'front': {
        name: 'Front',
        pos: new THREE.Vector3(0.0, 0.75, 5.8),
        target: new THREE.Vector3(0.0, 0.55, 0.5)
    },
    'side': {
        name: 'Side Profile',
        pos: new THREE.Vector3(6.8, 0.70, 0.0),
        target: new THREE.Vector3(0.0, 0.65, 0.0)
    },
    'rear-three-quarter': {
        name: 'Rear 3/4',
        pos: new THREE.Vector3(4.3, 1.35, -4.5),
        target: new THREE.Vector3(0.0, 0.55, -0.35)
    },
    'rear': {
        name: 'Rear',
        pos: new THREE.Vector3(0.0, 0.80, -5.6),
        target: new THREE.Vector3(0.0, 0.60, -0.5)
    },
    'top': {
        name: 'Top Down',
        pos: new THREE.Vector3(0.0, 8.2, 0.01),
        target: new THREE.Vector3(0.0, 0.45, 0.0)
    },
    'cockpit': {
        name: 'Cockpit / Detail',
        pos: new THREE.Vector3(0.52, 1.35, 0.85),
        target: new THREE.Vector3(0.0, 0.85, 0.68)
    }
};

// ---------------------------------------------------------------------------
// Core Three.js Variables
// ---------------------------------------------------------------------------
let scene, camera, renderer, controls, pmremGenerator;
let studioFloorMesh, stagePlinthMesh;
let carContainer = null;
let lights = {};

const container = document.getElementById('canvas-container');

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------
function init() {
    const p = LIGHTING_PRESETS.dark;

    // 1. Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(p.bg);
    scene.fog = new THREE.FogExp2(p.bg, 0.035);

    // 2. Camera (38 deg FOV for cinematic automotive framing)
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 100);
    camera.position.copy(CAMERA_PRESETS['overview'].pos);

    // 3. WebGL Renderer with High-Precision ACES Filmic Tone Mapping
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = p.exposure;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.copy(CAMERA_PRESETS['overview'].target);
    controls.minDistance = 1.0;
    controls.maxDistance = 20.0;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Prevent going underneath showroom floor
    controls.minPolarAngle = 0.05;

    // Handle user interaction pausing of turntable auto-rotation
    controls.addEventListener('start', () => {
        state.userInteracting = true;
        if (autoRotateResumeTimer) clearTimeout(autoRotateResumeTimer);
    });

    controls.addEventListener('end', () => {
        if (autoRotateResumeTimer) clearTimeout(autoRotateResumeTimer);
        autoRotateResumeTimer = setTimeout(() => {
            state.userInteracting = false;
        }, 2200);
    });

    // 5. Studio Environment Map (RoomEnvironment PMREM)
    pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const envScene = new RoomEnvironment();
    scene.environment = pmremGenerator.fromScene(envScene).texture;

    // 6. Showcase Stage Plinth & Floor
    setupStudioFloor();

    // 7. Studio Lighting Rig
    setupStudioLights();

    // 8. Load Ferrari F1 Clean Model
    loadFerrariModel();

    // 9. Event Listeners & UI Binding
    bindUIEvents();
    window.addEventListener('resize', onWindowResize);

    // 10. Start Render Loop
    animate();

    // Debugging globals
    window.camera = camera;
    window.controls = controls;
    window.scene = scene;
}

// ---------------------------------------------------------------------------
// Studio Floor & High-End Showcase Stage
// ---------------------------------------------------------------------------
function setupStudioFloor() {
    const p = LIGHTING_PRESETS.dark;

    // Seamless Infinity Studio Floor with Soft Controlled Specular
    const floorGeo = new THREE.PlaneGeometry(120, 120);
    const floorMat = new THREE.MeshStandardMaterial({
        color: p.floorColor,
        roughness: p.floorRoughness,
        metalness: p.floorMetalness,
        envMapIntensity: 0.45
    });
    studioFloorMesh = new THREE.Mesh(floorGeo, floorMat);
    studioFloorMesh.rotation.x = -Math.PI / 2;
    studioFloorMesh.position.y = 0.0;
    studioFloorMesh.receiveShadow = true;
    scene.add(studioFloorMesh);

    // Beveled Circular Showcase Dais (Radius 4.1m comfortably holds 5.47m Ferrari)
    const daisGroup = new THREE.Group();
    daisGroup.name = 'ShowcaseDais';

    const plinthGeo = new THREE.CylinderGeometry(4.1, 4.35, 0.08, 64);
    const plinthMat = new THREE.MeshStandardMaterial({
        color: 0x101318,
        roughness: 0.38,
        metalness: 0.25,
        envMapIntensity: 0.8
    });
    stagePlinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
    stagePlinthMesh.position.y = 0.04; // Center at 0.04, top is at 0.08
    stagePlinthMesh.receiveShadow = true;
    stagePlinthMesh.castShadow = true;
    daisGroup.add(stagePlinthMesh);

    // Subtle Outer Accent Ring on Plinth (Restrained Champagne Gold Metallic Accent)
    const ringGeo = new THREE.TorusGeometry(4.12, 0.012, 16, 64);
    const ringMat = new THREE.MeshStandardMaterial({
        color: LIVERY_CONFIG.plinthRingGold,
        roughness: 0.25,
        metalness: 0.85,
        emissive: LIVERY_CONFIG.plinthRingEmissive,
        emissiveIntensity: 0.35
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.081;
    daisGroup.add(ringMesh);

    scene.add(daisGroup);
}

// ---------------------------------------------------------------------------
// Studio Lighting Rig (Calibrated with Studio Blender Reference)
// ---------------------------------------------------------------------------
function setupStudioLights() {
    const p = LIGHTING_PRESETS.dark;

    // 1. Ambient Fill Light
    lights.ambient = new THREE.AmbientLight(0xFFFFFF, p.ambientIntensity);
    scene.add(lights.ambient);

    // 2. Softbox Key Light (Upper front quarter, soft PCF shadow)
    lights.key = new THREE.DirectionalLight(p.keyColor, p.keyIntensity);
    lights.key.position.set(4.0, 5.5, 4.5);
    lights.key.castShadow = true;
    lights.key.shadow.mapSize.width = 2048;
    lights.key.shadow.mapSize.height = 2048;
    lights.key.shadow.camera.near = 0.5;
    lights.key.shadow.camera.far = 25;
    lights.key.shadow.camera.left = -6;
    lights.key.shadow.camera.right = 6;
    lights.key.shadow.camera.top = 6;
    lights.key.shadow.camera.bottom = -6;
    lights.key.shadow.bias = -0.0003;
    lights.key.shadow.radius = 2.5;
    scene.add(lights.key);

    // 3. Fill Softbox Light (Cool soft fill on opposite side)
    lights.fill = new THREE.DirectionalLight(p.fillColor, p.fillIntensity);
    lights.fill.position.set(-4.2, 4.0, 3.8);
    scene.add(lights.fill);

    // 4. Rear Rim Light (Rear wingline and silhouette separation)
    lights.rim1 = new THREE.DirectionalLight(p.rim1Color, p.rim1Intensity);
    lights.rim1.position.set(-3.5, 3.8, -4.8);
    scene.add(lights.rim1);

    // 5. Flank Rim Light (Side body silhouette and specular sheen)
    lights.rim2 = new THREE.DirectionalLight(p.rim2Color, p.rim2Intensity);
    lights.rim2.position.set(4.5, 2.8, -4.0);
    scene.add(lights.rim2);

    // 6. Overhead Linear Diffuse Light (Soft roof gradient)
    lights.overhead = new THREE.DirectionalLight(0xFFFFFF, p.overheadIntensity);
    lights.overhead.position.set(0, 6.5, 0.3);
    scene.add(lights.overhead);

    // 7. Ground Bounce Fill
    lights.bounce = new THREE.DirectionalLight(0x202630, 0.35);
    lights.bounce.position.set(0, -2.0, 0);
    scene.add(lights.bounce);
}

// ---------------------------------------------------------------------------
// Dynamic Lighting Environment Switching
// ---------------------------------------------------------------------------
function setLighting(presetKey) {
    const p = LIGHTING_PRESETS[presetKey];
    if (!p) return;

    state.activeLighting = presetKey;

    // Update background & fog
    scene.background.setHex(p.bg);
    scene.fog.color.setHex(p.bg);

    // Update tone mapping exposure
    if (renderer) {
        renderer.toneMappingExposure = p.exposure;
    }

    // Update floor
    if (studioFloorMesh) {
        studioFloorMesh.material.color.setHex(p.floorColor);
        studioFloorMesh.material.roughness = p.floorRoughness;
        studioFloorMesh.material.metalness = p.floorMetalness;
    }

    // Update lights
    if (lights.key) {
        lights.key.color.setHex(p.keyColor);
        lights.key.intensity = p.keyIntensity;
    }
    if (lights.fill) {
        lights.fill.color.setHex(p.fillColor);
        lights.fill.intensity = p.fillIntensity;
    }
    if (lights.rim1) {
        lights.rim1.color.setHex(p.rim1Color);
        lights.rim1.intensity = p.rim1Intensity;
    }
    if (lights.rim2) {
        lights.rim2.color.setHex(p.rim2Color);
        lights.rim2.intensity = p.rim2Intensity;
    }
    if (lights.overhead) {
        lights.overhead.intensity = p.overheadIntensity;
    }
    if (lights.ambient) {
        lights.ambient.intensity = p.ambientIntensity;
    }

    // Update active UI button
    document.querySelectorAll('.lighting-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.lighting === presetKey);
    });
}

// ---------------------------------------------------------------------------
// Ferrari F1 Clean Model Loader & PBR Material Pipeline
// ---------------------------------------------------------------------------
function loadFerrariModel() {
    const progressBar = document.getElementById('loading-progress-bar');
    const statusText = document.getElementById('loading-status-text');
    const loadingScreen = document.getElementById('loading-screen');

    const loader = new GLTFLoader();
    const modelUrl = 'public/models/Ferrari_F1_Clean.glb';

    loader.load(
        modelUrl,
        (gltf) => {
            console.log('[SHOWCASE] Ferrari F1 GLB Loaded Successfully');

            const carModel = gltf.scene;
            let meshCount = 0;
            const uniqueMaterials = new Set();

            carModel.traverse((child) => {
                if (child.isMesh) {
                    meshCount++;
                    child.castShadow = true;
                    child.receiveShadow = true;

                    if (child.material) {
                        uniqueMaterials.add(child.material.name || child.material.uuid);

                        // Calibrate material properties to match reference livery and authentic PBR
                        const matName = child.material.name;

                        if (matName === 'f1.paint') {
                            if (child.name.includes('Halo')) {
                                // Halo Hoop: Dark Satin Carbon Fiber
                                child.material = child.material.clone();
                                child.material.name = 'f1.haloCarbon';
                                child.material.color.setHex(LIVERY_CONFIG.carbonHalo);
                                child.material.roughness = 0.35;
                                child.material.metalness = 0.20;
                                child.material.clearcoat = 0.30;
                                child.material.clearcoatRoughness = 0.08;
                                child.material.envMapIntensity = 0.80;
                            } else if (
                                child.name.includes('Wheel') ||
                                child.name.includes('Tire') ||
                                child.name.includes('Steering')
                            ) {
                                // Wheel & Cockpit Controls Accent: Dark Satin Black Carbon
                                child.material = child.material.clone();
                                child.material.name = 'f1.wheelCover';
                                child.material.color.setHex(LIVERY_CONFIG.wheelCoverCarbon);
                                child.material.roughness = 0.32;
                                child.material.metalness = 0.20;
                                child.material.clearcoat = 0.40;
                                child.material.clearcoatRoughness = 0.08;
                                child.material.envMapIntensity = 0.85;
                            } else {
                                // Primary Body Paint: Emerald Teal / British Racing Green Metallic
                                // Deep, rich automotive paint with controlled specular highlights and glossy lacquer
                                child.material.color.setHex(LIVERY_CONFIG.tealBody);
                                child.material.roughness = 0.18;
                                child.material.metalness = 0.38;
                                child.material.clearcoat = 1.0;
                                child.material.clearcoatRoughness = 0.025;
                                child.material.envMapIntensity = 0.90;
                            }
                        } else if (matName === 'f1.wheelCover') {
                            // Dedicated Wheel Aero Disc Covers: Deep Satin Black Carbon
                            child.material.color.setHex(LIVERY_CONFIG.wheelCoverCarbon);
                            child.material.roughness = 0.32;
                            child.material.metalness = 0.20;
                            child.material.clearcoat = 0.40;
                            child.material.clearcoatRoughness = 0.08;
                            child.material.envMapIntensity = 0.85;
                        } else if (matName === 'f1.rim') {
                            // Wheel Outer Rim Lip: Champagne Bronze / Gold Metallic
                            child.material.color.setHex(LIVERY_CONFIG.goldRim);
                            child.material.roughness = 0.20;
                            child.material.metalness = 0.90;
                            child.material.clearcoat = 0.50;
                            child.material.clearcoatRoughness = 0.06;
                            child.material.envMapIntensity = 1.10;
                        } else if (matName === 'f1.carbon') {
                            // Glossy Aero Carbon Fiber
                            child.material.color.setRGB(LIVERY_CONFIG.carbonGloss.r, LIVERY_CONFIG.carbonGloss.g, LIVERY_CONFIG.carbonGloss.b);
                            child.material.roughness = 0.28;
                            child.material.metalness = 0.35;
                            child.material.clearcoat = 1.0;
                            child.material.clearcoatRoughness = 0.04;
                            child.material.envMapIntensity = 0.85;
                        } else if (matName === 'f1.carbonMatte') {
                            // Matte Underbody / Diffuser / Plank Carbon
                            child.material.color.setRGB(LIVERY_CONFIG.carbonMatte.r, LIVERY_CONFIG.carbonMatte.g, LIVERY_CONFIG.carbonMatte.b);
                            child.material.roughness = 0.55;
                            child.material.metalness = 0.15;
                            child.material.envMapIntensity = 0.60;
                        } else if (matName === 'f1.paintWhite') {
                            if (child.name.includes('FrontWing')) {
                                // Front Wing Flaps: Glossy Carbon Black
                                child.material = child.material.clone();
                                child.material.name = 'f1.frontWingCarbon';
                                child.material.color.setHex(LIVERY_CONFIG.carbonFrontWing);
                                child.material.roughness = 0.26;
                                child.material.metalness = 0.35;
                                child.material.clearcoat = 1.0;
                                child.material.clearcoatRoughness = 0.04;
                                child.material.envMapIntensity = 0.85;
                            } else if (child.name.includes('RearWing')) {
                                // Rear Wing Aerofoils: Deep Dark Teal Carbon
                                child.material = child.material.clone();
                                child.material.name = 'f1.rearWingCarbon';
                                child.material.color.setHex(LIVERY_CONFIG.carbonRearWing);
                                child.material.roughness = 0.25;
                                child.material.metalness = 0.40;
                                child.material.clearcoat = 0.90;
                                child.material.clearcoatRoughness = 0.04;
                                child.material.envMapIntensity = 0.85;
                            } else if (child.name.includes('AirboxCowl')) {
                                // Airbox Cowl Shark Fin: Matches Body Green Paint
                                child.material = child.material.clone();
                                child.material.name = 'f1.airboxCowlPaint';
                                child.material.color.setHex(LIVERY_CONFIG.tealBody);
                                child.material.roughness = 0.18;
                                child.material.metalness = 0.38;
                                child.material.clearcoat = 1.0;
                                child.material.clearcoatRoughness = 0.025;
                                child.material.envMapIntensity = 0.90;
                            } else {
                                // Sidepod & Engine Cover Livery Swoop: Crisp Silver-White
                                child.material.color.setHex(LIVERY_CONFIG.whiteSwoop);
                                child.material.roughness = 0.16;
                                child.material.metalness = 0.12;
                                child.material.clearcoat = 1.0;
                                child.material.clearcoatRoughness = 0.03;
                                child.material.envMapIntensity = 0.90;
                            }
                        } else if (matName === 'f1.mech') {
                            // Mechanical Actuators / DRS Pivot: Champagne Bronze / Gold Metallic
                            child.material.color.setHex(LIVERY_CONFIG.goldMech);
                            child.material.roughness = 0.22;
                            child.material.metalness = 0.85;
                            child.material.clearcoat = 0.40;
                            child.material.clearcoatRoughness = 0.05;
                            child.material.envMapIntensity = 1.0;
                        } else if (matName === 'f1.darkSteel' && (child.name.includes('Wheel') || child.name.includes('Tire'))) {
                            // Wheel Center Hub Nut: Metallic Gold
                            child.material = child.material.clone();
                            child.material.name = 'f1.wheelHubNutGold';
                            child.material.color.setHex(LIVERY_CONFIG.goldHubNut);
                            child.material.roughness = 0.18;
                            child.material.metalness = 0.92;
                            child.material.clearcoat = 0.40;
                            child.material.envMapIntensity = 1.0;
                        } else if (matName === 'f1.rubber') {
                            // Tire Rubber
                            child.material.roughness = 0.88;
                            child.material.metalness = 0.0;
                            child.material.envMapIntensity = 0.40;
                        } else {
                            child.material.envMapIntensity = 0.85;
                        }

                        // Apply precision metallic gold livery accents (Nose, Front Wing, Sidepod sweep, Floor edge, Rear continuation)
                        const needsGoldAccent = (
                            child.name.includes('Nose') ||
                            child.name.includes('Monocoque') ||
                            child.name.includes('Sidepod') ||
                            child.name.includes('EngineCover') ||
                            child.name.includes('Gearbox') ||
                            child.name.includes('Underbody') ||
                            child.name.includes('Floor_Flank') ||
                            child.name.includes('FrontWing_Outer')
                        );

                        if (needsGoldAccent) {
                            child.material = child.material.clone();
                            attachGoldLiveryShader(child.material);
                        }

                        child.material.needsUpdate = true;
                    }
                }
            });

            console.log(`[SHOWCASE] Hierarchy: ${meshCount} meshes, ${uniqueMaterials.size} unique materials`);

            // Compute dynamic bounding box
            const box = new THREE.Box3().setFromObject(carModel);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());

            console.log('[SHOWCASE] Dimensions:', size.x.toFixed(2), 'x', size.y.toFixed(2), 'x', size.z.toFixed(2));
            console.log('[SHOWCASE] Bounds min Y:', box.min.y.toFixed(3), 'max Y:', box.max.y.toFixed(3));

            state.carDimensions = { size, center, box };

            // Dedicated container for centered normalization
            carContainer = new THREE.Group();
            carContainer.name = 'Ferrari_F1_Showcase_Container';

            // Center on X and Z
            carModel.position.x = -center.x;
            carModel.position.z = -center.z;

            // Place wheels flush on top of plinth (plinth top is at y = 0.08)
            const plinthTopY = 0.08;
            carModel.position.y = plinthTopY - box.min.y;

            carContainer.add(carModel);
            scene.add(carContainer);

            state.modelLoaded = true;

            // Complete loading experience
            if (progressBar) progressBar.style.width = '100%';
            if (statusText) statusText.textContent = 'FERRARI F1 // READY';

            setTimeout(() => {
                if (loadingScreen) {
                    loadingScreen.style.opacity = '0';
                    setTimeout(() => {
                        loadingScreen.style.display = 'none';
                    }, 600);
                }
            }, 400);
        },
        (xhr) => {
            if (xhr.lengthComputable && xhr.total > 0) {
                const percent = Math.round((xhr.loaded / xhr.total) * 100);
                if (progressBar) progressBar.style.width = percent + '%';
                if (statusText) statusText.textContent = `LOADING VEHICLE (${percent}%)...`;
            } else {
                if (progressBar) progressBar.style.width = '70%';
                if (statusText) statusText.textContent = 'STREAMING ASSET DATA...';
            }
        },
        (error) => {
            console.error('[SHOWCASE ERROR] Failed to load model:', error);
            if (statusText) {
                statusText.textContent = 'FAILED TO LOAD VEHICLE // CHECK NETWORK OR ASSET';
                statusText.style.color = '#FF4D4D';
            }
            if (progressBar) {
                progressBar.style.background = '#FF4D4D';
            }
        }
    );
}

// ---------------------------------------------------------------------------
// Precision Metallic-Gold Livery Shader Hook
// Enhances PBR materials with aerodynamic gold racing accent striping
// ---------------------------------------------------------------------------
function attachGoldLiveryShader(material) {
    if (material._hasGoldLiveryHook) return;
    material._hasGoldLiveryHook = true;

    material.onBeforeCompile = (shader) => {
        shader.uniforms.uGoldColor = { value: LIVERY_CONFIG.goldStripeRGB };

        shader.vertexShader = shader.vertexShader.replace(
            '#include <common>',
            `#include <common>
            varying vec3 vCarPos;
            varying vec3 vCarNorm;`
        );

        shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            `#include <begin_vertex>
            vCarPos = position;
            vCarNorm = normal;`
        );

        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <common>',
            `#include <common>
            varying vec3 vCarPos;
            varying vec3 vCarNorm;
            uniform vec3 uGoldColor;

            float getGoldLiveryMask(vec3 pos, vec3 norm) {
                float totalMask = 0.0;
                float absX = abs(pos.x);
                float absNormX = abs(norm.x);

                // 1. FRONT / NOSE LONGITUDINAL CONTOUR ACCENTS
                // Follows the natural aerodynamic shoulder crease of the nose cone
                if (pos.z > 1.38 && pos.z < 2.50 && pos.y > 0.35) {
                    float tNose = clamp((pos.z - 1.38) / (2.42 - 1.38), 0.0, 1.0);
                    float shoulderX = mix(0.132, 0.048, pow(tNose, 0.85));
                    float distNose = abs(absX - shoulderX);
                    float maskNose = smoothstep(0.011, 0.003, distNose);
                    totalMask = max(totalMask, maskNose);
                }

                // 2. FRONT WING OUTER TRIM / FOOTPLATE RUNNER
                if (pos.z > 2.35 && absX > 0.82) {
                    if (pos.y < 0.038 && absX > 0.84 && absX < 1.04) {
                        totalMask = max(totalMask, 1.0);
                    }
                    if (absX > 1.040 && pos.y > 0.02 && pos.y < 0.20) {
                        totalMask = max(totalMask, 1.0);
                    }
                }

                // 3. SIDE BODY / SIDEPOD AERODYNAMIC SWEEPING ACCENT
                // Follows the natural sidepod downwash crease from front to rear
                if (pos.z > -1.40 && pos.z < 0.75 && absX > 0.44 && absX < 0.74 && absNormX > 0.30) {
                    float tz = clamp((pos.z - (-1.40)) / (0.70 - (-1.40)), 0.0, 1.0);
                    float sweepY = 0.22 + 0.24 * pow(tz, 0.90);
                    float distSweep = abs(pos.y - sweepY);
                    float maskSweep = smoothstep(0.013, 0.004, distSweep);
                    totalMask = max(totalMask, maskSweep);
                }

                // 4. SIDE FLOOR / LOWER EDGE ACCENT
                // Subtle, restrained pinstripe along the outer carbon floor edge
                if (pos.z > -0.60 && pos.z < 0.70 && pos.y < 0.045 && absX > 0.655 && absX < 0.685) {
                    float distFloor = abs(absX - 0.670);
                    float maskFloor = smoothstep(0.009, 0.002, distFloor);
                    totalMask = max(totalMask, maskFloor * 0.90);
                }

                // 5. REAR CONTINUATION
                // Smooth continuation along rear flank toward gearbox cowl
                if (pos.z > -1.75 && pos.z <= -1.40 && absX > 0.22 && absX < 0.48 && absNormX > 0.30) {
                    float tzRear = clamp((pos.z - (-1.75)) / (-1.40 - (-1.75)), 0.0, 1.0);
                    float rearY = 0.18 + 0.04 * tzRear;
                    float distRear = abs(pos.y - rearY);
                    float maskRear = smoothstep(0.011, 0.003, distRear);
                    totalMask = max(totalMask, maskRear);
                }

                return clamp(totalMask, 0.0, 1.0);
            }`
        );

        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <color_fragment>',
            `#include <color_fragment>
            float liveryGoldMask = getGoldLiveryMask(vCarPos, vCarNorm);
            if (liveryGoldMask > 0.001) {
                diffuseColor.rgb = mix(diffuseColor.rgb, uGoldColor, liveryGoldMask);
            }`
        );

        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <roughnessmap_fragment>',
            `#include <roughnessmap_fragment>
            if (liveryGoldMask > 0.001) {
                roughnessFactor = mix(roughnessFactor, 0.20, liveryGoldMask);
            }`
        );

        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <metalnessmap_fragment>',
            `#include <metalnessmap_fragment>
            if (liveryGoldMask > 0.001) {
                metalnessFactor = mix(metalnessFactor, 0.90, liveryGoldMask);
            }`
        );
    };
}

// ---------------------------------------------------------------------------
// Camera Presets & Smooth Tween Transition
// ---------------------------------------------------------------------------
let camStartPos = new THREE.Vector3();
let camEndPos = new THREE.Vector3();
let camStartTarget = new THREE.Vector3();
let camEndTarget = new THREE.Vector3();
let carStartRot = 0;
let carEndRot = 0;
let transitionStartTime = 0;
let lastFrameTime = performance.now();
const TRANSITION_DURATION = 950; // ms

function transitionCamera(presetKey) {
    const preset = CAMERA_PRESETS[presetKey];
    if (!preset) return;

    camStartPos.copy(camera.position);
    camEndPos.copy(preset.pos);

    camStartTarget.copy(controls.target);
    camEndTarget.copy(preset.target);

    // Smoothly reset car rotation to 0 during preset transitions
    if (carContainer) {
        carStartRot = carContainer.rotation.y;
        const twoPi = Math.PI * 2;
        carStartRot = ((carStartRot % twoPi) + twoPi) % twoPi;
        if (carStartRot > Math.PI) carStartRot -= twoPi;
        carContainer.rotation.y = carStartRot;
        carEndRot = 0;
    }

    transitionStartTime = performance.now();
    state.cameraTransitioning = true;

    // Update active UI preset button
    document.querySelectorAll('.preset-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.preset === presetKey);
    });
}

function updateCameraTransition(now) {
    const elapsed = now - transitionStartTime;
    const progress = Math.min(elapsed / TRANSITION_DURATION, 1.0);

    // Smooth cubic ease-in-out
    const t = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    camera.position.lerpVectors(camStartPos, camEndPos, t);
    controls.target.lerpVectors(camStartTarget, camEndTarget, t);

    if (carContainer) {
        carContainer.rotation.y = THREE.MathUtils.lerp(carStartRot, carEndRot, t);
    }

    if (progress >= 1.0) {
        state.cameraTransitioning = false;
        camera.position.copy(camEndPos);
        controls.target.copy(camEndTarget);
        if (carContainer) carContainer.rotation.y = carEndRot;
    }
}

// ---------------------------------------------------------------------------
// Showcase Controls & Handlers
// ---------------------------------------------------------------------------
function toggleAutoRotate() {
    state.autoRotate = !state.autoRotate;
    const btn = document.getElementById('btn-rotate');
    if (btn) btn.classList.toggle('active', state.autoRotate);
}

function toggleFullscreen() {
    const icon = document.getElementById('fullscreen-icon');
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
            if (icon) icon.textContent = '🗗';
        }).catch((err) => {
            console.warn('Fullscreen request failed:', err);
        });
    } else {
        document.exitFullscreen().then(() => {
            if (icon) icon.textContent = '⛶';
        }).catch((err) => {
            console.warn('Fullscreen exit failed:', err);
        });
    }
}

document.addEventListener('fullscreenchange', () => {
    const icon = document.getElementById('fullscreen-icon');
    if (icon) {
        icon.textContent = document.fullscreenElement ? '🗗' : '⛶';
    }
});

// ---------------------------------------------------------------------------
// UI Event Binding
// ---------------------------------------------------------------------------
function bindUIEvents() {
    // 8 Camera Preset Buttons
    document.querySelectorAll('.preset-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            transitionCamera(btn.dataset.preset);
        });
    });

    // Reset Hero View
    const btnReset = document.getElementById('btn-reset-cam');
    if (btnReset) {
        btnReset.addEventListener('click', () => transitionCamera('overview'));
    }

    // Auto Rotate
    const btnRotate = document.getElementById('btn-rotate');
    if (btnRotate) {
        btnRotate.addEventListener('click', toggleAutoRotate);
    }

    // Fullscreen Toggle
    const btnFullscreen = document.getElementById('btn-fullscreen');
    if (btnFullscreen) {
        btnFullscreen.addEventListener('click', toggleFullscreen);
    }

    // Lighting Atmosphere Buttons
    document.querySelectorAll('.lighting-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            setLighting(btn.dataset.lighting);
        });
    });

    // Keyboard Shortcuts
    const PRESET_KEYS = [
        'overview',
        'front-three-quarter',
        'front',
        'side',
        'rear-three-quarter',
        'rear',
        'top',
        'cockpit'
    ];

    window.addEventListener('keydown', (e) => {
        if (e.code === 'KeyR') {
            transitionCamera('overview');
        } else if (e.code === 'KeyT') {
            toggleAutoRotate();
        } else if (e.code === 'KeyF') {
            toggleFullscreen();
        } else if (e.code === 'KeyH') {
            toggleHUD();
        } else if (e.key >= '1' && e.key <= '8') {
            const idx = parseInt(e.key, 10) - 1;
            if (PRESET_KEYS[idx]) transitionCamera(PRESET_KEYS[idx]);
        }
    });

    // UI Toggle Button
    const btnHideUI = document.getElementById('btn-hide-ui');
    if (btnHideUI) {
        btnHideUI.addEventListener('click', toggleHUD);
    }
}

function toggleHUD() {
    const hudContainer = document.getElementById('hud-container');
    const btnHideUI = document.getElementById('btn-hide-ui');
    if (hudContainer && btnHideUI) {
        hudContainer.classList.toggle('hidden');
        btnHideUI.textContent = hudContainer.classList.contains('hidden') ? '👁 Show HUD' : '✖ Hide HUD';
    }
}

// ---------------------------------------------------------------------------
// Window Resize Handler
// ---------------------------------------------------------------------------
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

// ---------------------------------------------------------------------------
// Main Animation & Render Loop (Single Unified Loop)
// ---------------------------------------------------------------------------
function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
    const delta = Math.min((now - lastFrameTime) / 1000, 0.1);
    lastFrameTime = now;

    // Turntable Auto-Rotation
    if (state.autoRotate && !state.userInteracting && !state.cameraTransitioning && carContainer) {
        carContainer.rotation.y += delta * 0.22;
    }

    // Smooth Camera Preset Transition
    if (state.cameraTransitioning) {
        updateCameraTransition(now);
    }

    // Update Orbit Controls (handles damping and smooth orbit/pan/zoom)
    controls.update();

    // Render Scene
    renderer.render(scene, camera);
}

// Expose global window API for debugging / scripting
window.setCameraPreset = transitionCamera;
window.setLighting = setLighting;
window.toggleAutoRotate = toggleAutoRotate;
window.toggleFullscreen = toggleFullscreen;

// Initialize on DOM Load
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
