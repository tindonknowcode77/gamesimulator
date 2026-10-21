import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default function GigEconomy3D() {
  const mountRef = useRef(null);

  // States
  const [stamina, setStamina] = useState(100);
  const [driverWage, setDriverWage] = useState(0); // v
  const [driverCost, setDriverCost] = useState(0); // c
  const [completedOrders, setCompletedOrders] = useState(0);

  const [platformCut, setPlatformCut] = useState(0.25); // 25%
  const [surplusM, setSurplusM] = useState(0); // m
  const [algoLevel, setAlgoLevel] = useState(1);
  const [algoSpeed, setAlgoSpeed] = useState(1.0);

  const [isNight, setIsNight] = useState(true);
  const [controlMode, setControlMode] = useState('auto'); // 'auto' | 'manual'
  const [hasFood, setHasFood] = useState(false);
  const [log, setLog] = useState('🎮 Bạn có thể dùng phím W/A/S/D (Mũi tên) để tự lái xe, hoặc bấm các nút bên dưới!');

  // Calculations
  const orderPrice = 100;
  const vehicleCost = 30;
  const currentM = orderPrice * platformCut;
  const currentV = Math.max(0, orderPrice - currentM - vehicleCost);
  const surplusRate = currentV > 0 ? ((currentM / currentV) * 100).toFixed(1) : '∞';

  // Refs for animation loop
  const controlsRef = useRef(null);
  const gameRef = useRef({
    stamina: 100,
    driverWage: 0,
    driverCost: 0,
    completedOrders: 0,
    surplusM: 0,
    platformCut: 0.25,
    algoSpeed: 1.0,
    algoLevel: 1,
    hasFood: false,
    
    // Bike manual physics
    keys: { forward: false, backward: false, left: false, right: false },
    bikePos: new THREE.Vector3(0, 0, 0),
    bikeRotY: 0,
    bikeSpeed: 0,
    
    // Auto navigation target
    autoTarget: null,
    missionPhase: 'idle', // 'idle' | 'to_restaurant' | 'to_customer'
    targetPrice: 100,
    targetDrain: 12
  });

  // Simple Web Audio API Sound Effects (no external files needed)
  const playSound = (type) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'coin') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880, now + 0.08); // A5
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'upgrade') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554.37, now + 0.1);
        osc.frequency.setValueAtTime(659.25, now + 0.2);
        osc.frequency.setValueAtTime(880, now + 0.3);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === 'pickup') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.setValueAtTime(600, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch (e) {
      // AudioContext might be blocked until user gesture, safe to ignore
    }
  };

  // Keyboard Event Listeners for Manual Driving
  useEffect(() => {
    const handleKeyDown = (e) => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'w'].includes(k)) gameRef.current.keys.forward = true;
      if (['arrowdown', 's'].includes(k)) gameRef.current.keys.backward = true;
      if (['arrowleft', 'a'].includes(k)) gameRef.current.keys.left = true;
      if (['arrowright', 'd'].includes(k)) gameRef.current.keys.right = true;
      if (['arrowup', 'w', 'arrowdown', 's', 'arrowleft', 'a', 'arrowright', 'd'].includes(k)) {
        setControlMode('manual');
        gameRef.current.missionPhase = 'idle';
        gameRef.current.autoTarget = null;
      }
    };

    const handleKeyUp = (e) => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'w'].includes(k)) gameRef.current.keys.forward = false;
      if (['arrowdown', 's'].includes(k)) gameRef.current.keys.backward = false;
      if (['arrowleft', 'a'].includes(k)) gameRef.current.keys.left = false;
      if (['arrowright', 'd'].includes(k)) gameRef.current.keys.right = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Three.js Scene Setup
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = 480;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isNight ? 0x070a13 : 0x7dd3fc);
    scene.fog = new THREE.FogExp2(isNight ? 0x070a13 : 0x7dd3fc, 0.012);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 500);
    camera.position.set(0, 36, 44);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    // 2. Official OrbitControls (Smooth mouse rotation & zoom)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.minDistance = 15;
    controls.maxDistance = 85;
    controls.target.set(0, 2, 0);
    controlsRef.current = controls;

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(isNight ? 0x1e293b : 0xffffff, isNight ? 1.4 : 1.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(isNight ? 0x6366f1 : 0xfffaed, isNight ? 1.2 : 2.0);
    sunLight.position.set(20, 50, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    // 4. Ground & Roads
    const groundGeo = new THREE.PlaneGeometry(80, 80);
    const groundMat = new THREE.MeshStandardMaterial({
      color: isNight ? 0x0f172a : 0x334155,
      roughness: 0.8
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Cross Roads
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const roadX = new THREE.Mesh(new THREE.PlaneGeometry(80, 8), roadMat);
    roadX.rotation.x = -Math.PI / 2;
    roadX.position.y = 0.02;
    scene.add(roadX);

    const roadZ = new THREE.Mesh(new THREE.PlaneGeometry(8, 80), roadMat);
    roadZ.rotation.x = -Math.PI / 2;
    roadZ.position.y = 0.02;
    scene.add(roadZ);

    // 5. Buildings
    // A. AI Platform Tower (m)
    const towerGroup = new THREE.Group();
    towerGroup.position.set(20, 0, -20);
    const towerGeo = new THREE.BoxGeometry(8, 22, 8);
    const towerMat = new THREE.MeshStandardMaterial({
      color: 0x4338ca,
      emissive: 0x312e81,
      roughness: 0.2,
      metalness: 0.8
    });
    const towerMesh = new THREE.Mesh(towerGeo, towerMat);
    towerMesh.position.y = 11;
    towerMesh.castShadow = true;
    towerGroup.add(towerMesh);

    const beaconLight = new THREE.PointLight(0xa855f7, 3, 25);
    beaconLight.position.y = 25;
    towerGroup.add(beaconLight);
    scene.add(towerGroup);

    // B. Restaurant (Nhà hàng)
    const restGroup = new THREE.Group();
    restGroup.position.set(-20, 0, -20);
    const restMesh = new THREE.Mesh(
      new THREE.BoxGeometry(8, 6, 8),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 })
    );
    restMesh.position.y = 3;
    restMesh.castShadow = true;
    restGroup.add(restMesh);

    // Roof
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(6, 3.5, 4),
      new THREE.MeshStandardMaterial({ color: 0xb45309 })
    );
    roof.position.y = 7.75;
    roof.rotation.y = Math.PI / 4;
    restGroup.add(roof);
    scene.add(restGroup);

    // C. Gas Station (Cây Xăng - c = 30k)
    const gasGroup = new THREE.Group();
    gasGroup.position.set(-20, 0, 20);
    const canopy = new THREE.Mesh(
      new THREE.BoxGeometry(8, 0.8, 8),
      new THREE.MeshStandardMaterial({ color: 0xe11d48 })
    );
    canopy.position.y = 5;
    gasGroup.add(canopy);
    [-3, 3].forEach(px => {
      [-3, 3].forEach(pz => {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 5, 8), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
        pillar.position.set(px, 2.5, pz);
        gasGroup.add(pillar);
      });
    });
    scene.add(gasGroup);

    // D. Customer House (Nhà Khách)
    const custGroup = new THREE.Group();
    custGroup.position.set(20, 0, 20);
    const houseMesh = new THREE.Mesh(
      new THREE.BoxGeometry(8, 6, 8),
      new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.5 })
    );
    houseMesh.position.y = 3;
    custGroup.add(houseMesh);
    scene.add(custGroup);

    // 6. Shipper 3D Motorbike
    const bikeGroup = new THREE.Group();
    bikeGroup.position.set(0, 0, 0);

    const frameMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.7, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3 })
    );
    frameMesh.position.y = 0.8;
    frameMesh.castShadow = true;
    bikeGroup.add(frameMesh);

    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const fWheel = new THREE.Mesh(wheelGeo, wheelMat);
    fWheel.rotation.z = Math.PI / 2;
    fWheel.position.set(0, 0.4, 1.0);
    bikeGroup.add(fWheel);

    const rWheel = new THREE.Mesh(wheelGeo, wheelMat);
    rWheel.rotation.z = Math.PI / 2;
    rWheel.position.set(0, 0.4, -1.0);
    bikeGroup.add(rWheel);

    const deliveryBox = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 1.0, 0.9),
      new THREE.MeshStandardMaterial({ color: 0xdc2626 })
    );
    deliveryBox.position.set(0, 1.45, -0.65);
    bikeGroup.add(deliveryBox);

    const driverBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 0.9, 12),
      new THREE.MeshStandardMaterial({ color: 0x0284c7 })
    );
    driverBody.position.set(0, 1.4, 0.2);
    bikeGroup.add(driverBody);

    const helmetMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x22c55e })
    );
    helmetMesh.position.set(0, 2.05, 0.2);
    bikeGroup.add(helmetMesh);

    const headlight = new THREE.SpotLight(0xfef08a, 4, 30, Math.PI / 5, 0.5);
    headlight.position.set(0, 1.0, 1.2);
    headlight.target.position.set(0, 0, 10);
    bikeGroup.add(headlight);
    bikeGroup.add(headlight.target);

    scene.add(bikeGroup);

    // 7. 3D Coin Particles System
    const coinParticles = [];

    const spawn3DCoins = (origin) => {
      playSound('coin');
      const destinations = [
        { target: new THREE.Vector3(-20, 2, 20), color: 0xd97706, count: 5 }, // c -> Gas Station
        { target: new THREE.Vector3(camera.position.x - 3, camera.position.y - 3, camera.position.z - 5), color: 0x10b981, count: 6 }, // v -> Driver Wallet
        { target: new THREE.Vector3(20, 20, -20), color: 0xa855f7, count: 7 } // m -> Platform AI Tower
      ];

      destinations.forEach(dest => {
        for (let i = 0; i < dest.count; i++) {
          const coin = new THREE.Mesh(
            new THREE.CylinderGeometry(0.35, 0.35, 0.1, 12),
            new THREE.MeshStandardMaterial({ color: dest.color, emissive: dest.color, emissiveIntensity: 0.7 })
          );
          coin.position.copy(origin);
          coin.position.y += 1.5;
          scene.add(coin);

          coinParticles.push({
            mesh: coin,
            start: origin.clone().add(new THREE.Vector3(0, 1.5, 0)),
            dest: dest.target,
            t: 0,
            speed: 0.016 + Math.random() * 0.012,
            midY: 8 + Math.random() * 5
          });
        }
      });
    };

    // 8. Animation & Physics Loop
    let animId;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      // OrbitControls update
      controls.update();

      // Tower neon effect
      beaconLight.intensity = 2.5 + Math.sin(Date.now() * 0.008) * 1.5;

      // Driver Helmet color based on stamina
      helmetMesh.material.color.setHex(gameRef.current.stamina > 30 ? 0x22c55e : 0xef4444);

      // --- MOVEMENT PHYSICS ---
      // A. Manual Driving Mode (WASD / Arrows)
      const k = gameRef.current.keys;
      if (k.forward || k.backward || k.left || k.right) {
        if (k.left) gameRef.current.bikeRotY += 0.045;
        if (k.right) gameRef.current.bikeRotY -= 0.045;

        const maxSpd = 0.35 * gameRef.current.algoSpeed;
        if (k.forward) gameRef.current.bikeSpeed = Math.min(maxSpd, gameRef.current.bikeSpeed + 0.02);
        else if (k.backward) gameRef.current.bikeSpeed = Math.max(-maxSpd * 0.5, gameRef.current.bikeSpeed - 0.02);

        fWheel.rotation.x += gameRef.current.bikeSpeed * 0.8;
        rWheel.rotation.x += gameRef.current.bikeSpeed * 0.8;
      } else if (!gameRef.current.autoTarget) {
        // Friction when no keys pressed
        gameRef.current.bikeSpeed *= 0.92;
      }

      // B. Auto-Navigation Mode (Waypoint tracking with overshoot snapping)
      if (gameRef.current.autoTarget) {
        const target = gameRef.current.autoTarget;
        const curPos = bikeGroup.position;
        const dx = target.x - curPos.x;
        const dz = target.z - curPos.z;
        const dist = Math.hypot(dx, dz);
        const autoSpeed = 0.32 * gameRef.current.algoSpeed;

        if (dist <= Math.max(0.6, autoSpeed)) {
          // SNAP TO TARGET TO PREVENT OVERSHOOT JIGGLE
          bikeGroup.position.x = target.x;
          bikeGroup.position.z = target.z;
          gameRef.current.bikeSpeed = 0;
          gameRef.current.autoTarget = null;

          // Waypoint logic
          if (gameRef.current.missionPhase === 'to_restaurant') {
            gameRef.current.hasFood = true;
            setHasFood(true);
            playSound('pickup');
            gameRef.current.missionPhase = 'to_customer';
            gameRef.current.autoTarget = new THREE.Vector3(20, 0, 20);
            setLog('📦 Đã lấy món tại Nhà Hàng! Đang phi nước đại đến Khách Hàng...');
          } else if (gameRef.current.missionPhase === 'to_customer') {
            gameRef.current.hasFood = false;
            setHasFood(false);
            gameRef.current.missionPhase = 'idle';

            // Complete Order & Calculate Surplus
            const price = gameRef.current.targetPrice || 100;
            const drain = gameRef.current.targetDrain || 12;
            const m = price * gameRef.current.platformCut;
            const v = price - m - vehicleCost;

            gameRef.current.stamina = Math.max(0, gameRef.current.stamina - drain);
            gameRef.current.driverWage += v;
            gameRef.current.driverCost += vehicleCost;
            gameRef.current.surplusM += m;
            gameRef.current.completedOrders += 1;

            setStamina(gameRef.current.stamina);
            setDriverWage(gameRef.current.driverWage);
            setDriverCost(gameRef.current.driverCost);
            setSurplusM(gameRef.current.surplusM);
            setCompletedOrders(gameRef.current.completedOrders);

            spawn3DCoins(bikeGroup.position.clone());
            setLog(`🎉 Giao 3D thành công! Tài xế nhận ${v.toFixed(0)}k (v), Chủ sàn cắt ${m.toFixed(0)}k (m), Cây xăng ngốn 30k (c).`);
          }
        } else {
          // Face and move towards target
          const targetAngle = Math.atan2(dx, dz);
          gameRef.current.bikeRotY = targetAngle;
          bikeGroup.position.x += Math.sin(targetAngle) * autoSpeed;
          bikeGroup.position.z += Math.cos(targetAngle) * autoSpeed;
          fWheel.rotation.x += 0.25;
          rWheel.rotation.x += 0.25;
        }
      } else {
        // Apply manual velocity
        bikeGroup.rotation.y = gameRef.current.bikeRotY;
        bikeGroup.position.x += Math.sin(gameRef.current.bikeRotY) * gameRef.current.bikeSpeed;
        bikeGroup.position.z += Math.cos(gameRef.current.bikeRotY) * gameRef.current.bikeSpeed;
      }

      // Clamp bike inside map boundary
      bikeGroup.position.x = Math.max(-38, Math.min(38, bikeGroup.position.x));
      bikeGroup.position.z = Math.max(-38, Math.min(38, bikeGroup.position.z));

      // Check proximity collisions in Manual Mode
      const bp = bikeGroup.position;
      // Proximity to Restaurant
      if (Math.hypot(bp.x - (-20), bp.z - (-20)) < 6 && !gameRef.current.hasFood) {
        gameRef.current.hasFood = true;
        setHasFood(true);
        playSound('pickup');
        setLog('🍜 Đã lấy đồ ăn từ Nhà Hàng! Hãy lái xe đến Nhà Khách Hàng (Góc xanh lá) để giao!');
      }
      // Proximity to Customer
      if (Math.hypot(bp.x - 20, bp.z - 20) < 6 && gameRef.current.hasFood) {
        gameRef.current.hasFood = false;
        setHasFood(false);

        const m = orderPrice * gameRef.current.platformCut;
        const v = orderPrice - m - vehicleCost;

        gameRef.current.stamina = Math.max(0, gameRef.current.stamina - 12);
        gameRef.current.driverWage += v;
        gameRef.current.driverCost += vehicleCost;
        gameRef.current.surplusM += m;
        gameRef.current.completedOrders += 1;

        setStamina(gameRef.current.stamina);
        setDriverWage(gameRef.current.driverWage);
        setDriverCost(gameRef.current.driverCost);
        setSurplusM(gameRef.current.surplusM);
        setCompletedOrders(gameRef.current.completedOrders);

        spawn3DCoins(bikeGroup.position.clone());
        setLog(`🎉 Giao tận tay thành công! Tài xế nhận ${v.toFixed(0)}k (v), Chủ sàn chiếm đoạt ${m.toFixed(0)}k (m)!`);
      }
      // Proximity to Gas Station
      if (Math.hypot(bp.x - (-20), bp.z - 20) < 6) {
        // Near gas station
      }

      // Animate 3D Coin Particles (Bezier Arc)
      for (let i = coinParticles.length - 1; i >= 0; i--) {
        const p = coinParticles[i];
        p.t += p.speed;
        if (p.t >= 1) {
          scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          p.mesh.material.dispose();
          coinParticles.splice(i, 1);
          continue;
        }

        const currX = p.start.x + (p.dest.x - p.start.x) * p.t;
        const currZ = p.start.z + (p.dest.z - p.start.z) * p.t;
        const currY = p.start.y + (p.dest.y - p.start.y) * p.t + Math.sin(p.t * Math.PI) * p.midY;

        p.mesh.position.set(currX, currY, currZ);
        p.mesh.rotation.y += 0.15;
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const newW = mountRef.current.clientWidth;
      camera.aspect = newW / height;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [isNight]);

  // Dispatch Auto Order
  const handleDispatchOrder = (isNightShift = false) => {
    if (stamina < (isNightShift ? 15 : 10)) {
      setLog('🛑 Tài xế kiệt sức! Bấm "Hồi Thể Lực" để nghỉ ngơi.');
      return;
    }
    setControlMode('auto');
    gameRef.current.targetPrice = isNightShift ? 120 : 100;
    gameRef.current.targetDrain = (isNightShift ? 22 : 12) * algoSpeed;
    gameRef.current.missionPhase = 'to_restaurant';
    gameRef.current.autoTarget = new THREE.Vector3(-20, 0, -20);
    setLog(isNightShift ? '🌙 Cày đêm thặng dư tuyệt đối: Xe đang tự phóng đến Nhà Hàng!' : '🚀 Đã nhận đơn! Xe máy đang tự lái đến Quán Ăn...');
  };

  // Rest
  const handleRest = () => {
    const newStamina = Math.min(100, stamina + 35);
    setStamina(newStamina);
    gameRef.current.stamina = newStamina;
    setLog('☕ Uống trà đá nghỉ ngơi: Hồi phục +35% thể lực để tiếp tục bán sức lao động.');
  };

  // Upgrade Algorithm
  const handleUpgradeAlgo = () => {
    if (surplusM < 200) {
      alert('Cần tích lũy tối thiểu 200k thặng dư m để nâng cấp AI!');
      return;
    }
    playSound('upgrade');
    const newSurplus = surplusM - 200;
    const newLevel = algoLevel + 1;
    const newSpeed = +(algoSpeed + 0.4).toFixed(1);
    const newCut = Math.min(0.40, +(platformCut + 0.05).toFixed(2));

    setSurplusM(newSurplus);
    setAlgoLevel(newLevel);
    setAlgoSpeed(newSpeed);
    setPlatformCut(newCut);

    gameRef.current.surplusM = newSurplus;
    gameRef.current.algoLevel = newLevel;
    gameRef.current.algoSpeed = newSpeed;
    gameRef.current.platformCut = newCut;

    setLog(`🚀 Nâng cấp AI v${newLevel}.0: Chiết khấu tăng lên ${(newCut * 100).toFixed(0)}%, tốc độ ép đơn lên x${newSpeed}!`);
  };

  // Percentages for live bar
  const pctC = (vehicleCost / orderPrice) * 100;
  const pctM = (currentM / orderPrice) * 100;
  const pctV = Math.max(0, 100 - pctC - pctM);

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      
      {/* Header */}
      <div style={{ background: '#111827', borderRadius: '16px', border: '1px solid #1f2937', padding: '16px 20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '6px', background: '#3b82f620', color: '#60a5fa', border: '1px solid #3b82f640' }}>
              🎮 TỰ LÁI (WASD / MŨI TÊN) HOẶC TỰ ĐỘNG
            </span>
            <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '6px', background: '#6366f120', color: '#818cf8', border: '1px solid #6366f140' }}>
              W = c + v + m
            </span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#f8fafc' }}>
            🛵 Đô Thị 3D: Cuộc Đua Sức Lao Động & Thặng Dư Nền Tảng
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setIsNight(!isNight)}
            style={{ padding: '8px 14px', borderRadius: '10px', background: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
          >
            {isNight ? '☀️ Ban Ngày' : '🌙 Ban Đêm'}
          </button>
        </div>
      </div>

      {/* Value Decomposition Bar W = c + v + m */}
      <div style={{ background: '#111827', borderRadius: '14px', border: '1px solid #1f2937', padding: '12px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>
          <span style={{ color: '#cbd5e1' }}>CƠ CẤU 1 ĐƠN HÀNG (100k VNĐ)</span>
          <span style={{ padding: '2px 10px', borderRadius: '20px', background: '#6366f120', color: '#818cf8', border: '1px solid #6366f140', fontSize: '12px' }}>
            Tỷ suất bóc lột m' = {surplusRate}%
          </span>
        </div>
        <div style={{ display: 'flex', height: '26px', borderRadius: '8px', overflow: 'hidden', fontWeight: 'bold', fontSize: '11px', color: '#fff', textAlign: 'center', lineHeight: '26px' }}>
          <div style={{ width: `${pctC}%`, background: '#d97706' }} title="Tư bản bất biến c: Xăng + Hao mòn xe">c: {vehicleCost}k ({pctC.toFixed(0)}%)</div>
          <div style={{ width: `${pctV}%`, background: '#10b981' }} title="Tư bản khả biến v: Tiền công thực nhận">v: {currentV.toFixed(0)}k ({pctV.toFixed(0)}%)</div>
          <div style={{ width: `${pctM}%`, background: '#6366f1' }} title="Giá trị thặng dư m: Chủ sàn trích">m: {currentM.toFixed(0)}k ({pctM.toFixed(0)}%)</div>
        </div>
      </div>

      {/* 3D Viewport */}
      <div style={{ position: 'relative', width: '100%', height: '480px', borderRadius: '16px', overflow: 'hidden', border: '2px solid #1e293b', background: '#090d16' }}>
        
        {/* Three.js Canvas */}
        <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />

        {/* Top-Left HUD (Driver Stats) */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(51, 65, 85, 0.7)', borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '12px', width: '190px', pointerEvents: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '6px' }}>
            <span style={{ color: '#34d399' }}>👤 Tài Xế</span>
            <span style={{ color: stamina > 30 ? '#34d399' : '#f87171' }}>{stamina.toFixed(0)}%</span>
          </div>
          <div style={{ height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
            <div style={{ width: `${stamina}%`, height: '100%', background: stamina > 30 ? '#10b981' : '#ef4444', transition: 'width 0.2s' }}></div>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.6' }}>
            <div>Tiền công ròng (v): <strong style={{ color: '#34d399' }}>{driverWage.toFixed(1)}k</strong></div>
            <div>Khấu hao tự gánh (c): <strong style={{ color: '#fbbf24' }}>{driverCost.toFixed(1)}k</strong></div>
            <div>Đơn hoàn thành: <strong>{completedOrders}</strong> cuốc</div>
            <div>Thùng hàng: <strong style={{ color: hasFood ? '#f87171' : '#94a3b8' }}>{hasFood ? '🎒 Đang chở món' : 'Trống'}</strong></div>
          </div>
        </div>

        {/* Top-Right HUD (Platform Capitalist Stats) */}
        <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(51, 65, 85, 0.7)', borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '12px', width: '190px', textAlign: 'right', pointerEvents: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '6px' }}>
            <span style={{ fontSize: '10px', background: '#4338ca', padding: '2px 6px', borderRadius: '4px' }}>AI v{algoLevel}.0</span>
            <span style={{ color: '#818cf8' }}>🏢 Chủ Sàn</span>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.6' }}>
            <div>Quỹ thặng dư (m): <strong style={{ color: '#818cf8', fontSize: '14px' }}>{surplusM.toFixed(1)}k</strong></div>
            <div>Chiết khấu đơn: <strong>{(platformCut * 100).toFixed(0)}%</strong></div>
            <div>Cường độ ép đơn: <strong style={{ color: '#fbbf24' }}>x{algoSpeed.toFixed(1)}</strong></div>
          </div>
        </div>

        {/* Floating Driving Instructions */}
        <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid #334155', borderRadius: '12px', padding: '8px 12px', fontSize: '11px', color: '#cbd5e1', pointerEvents: 'none' }}>
          <div>🎮 <strong>Phím lái xe:</strong> W / ⬆️ (Tiến), S / ⬇️ (Lùi), A/D / ⬅️➡️ (Rẽ)</div>
          <div>🖱️ <strong>Chuột:</strong> Giữ chuột trái xoay 360°, cuộn phóng to/nhỏ</div>
        </div>

      </div>

      {/* Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
        <button
          onClick={() => handleDispatchOrder(false)}
          disabled={stamina < 10}
          style={{ padding: '12px', background: '#059669', color: '#fff', border: 'none', borderRadius: '12px', cursor: stamina >= 10 ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '13px' }}
        >
          🚀 Tự Động Chạy Đơn (+100k)
        </button>

        <button
          onClick={() => handleDispatchOrder(true)}
          disabled={stamina < 15}
          style={{ padding: '12px', background: '#be123c', color: '#fff', border: 'none', borderRadius: '12px', cursor: stamina >= 15 ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '13px' }}
          title="Sản xuất giá trị thặng dư tuyệt đối bằng cách cày đêm"
        >
          🌙 Cày Đêm (Thặng dư TĐ)
        </button>

        <button
          onClick={handleRest}
          style={{ padding: '12px', background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
        >
          ☕ Hồi Thể Lực (+35%)
        </button>

        <button
          onClick={handleUpgradeAlgo}
          disabled={surplusM < 200}
          style={{ padding: '12px', background: surplusM >= 200 ? '#4f46e5' : '#312e81', color: '#fff', border: 'none', borderRadius: '12px', cursor: surplusM >= 200 ? 'pointer' : 'not-allowed', opacity: surplusM >= 200 ? 1 : 0.6, fontWeight: 'bold', fontSize: '13px' }}
        >
          ⚙️ Nâng Cấp AI (200k m)
        </button>
      </div>

      {/* Live Log */}
      <div style={{ padding: '10px 16px', background: '#111827', borderRadius: '12px', border: '1px solid #1f2937', fontSize: '13px', color: '#cbd5e1' }}>
        <strong>📢 Thông báo:</strong> {log}
      </div>

    </div>
  );
}
