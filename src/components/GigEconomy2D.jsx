import React, { useState, useEffect, useRef } from 'react';

// Danh sách các loại món ăn và đơn hàng ngẫu nhiên thực tế
const RANDOM_ORDER_TYPES = [
  { name: '🧋 Trà Sữa Trân Châu Đường Đen', baseDist: 2.2, minPrice: 35, maxPrice: 50 },
  { name: '🥖 Bánh Mì Chả Cá Nóng Giòn', baseDist: 1.8, minPrice: 30, maxPrice: 45 },
  { name: '🍜 Phở Bò Tái Nạm Gầu Béo', baseDist: 4.5, minPrice: 65, maxPrice: 85 },
  { name: '🍛 Cơm Tấm Sườn Bì Chả Trứng', baseDist: 5.2, minPrice: 75, maxPrice: 95 },
  { name: '🍕 Pizza Hải Sản Cỡ Lớn', baseDist: 8.5, minPrice: 130, maxPrice: 170 },
  { name: '🍗 Gà Rán Gia Đình 6 Miếng', baseDist: 7.0, minPrice: 110, maxPrice: 150 },
  { name: '🍲 Lẩu Thái Chua Cay 3 Người', baseDist: 13.5, minPrice: 210, maxPrice: 280 },
  { name: '🍣 Set Sushi Sashimi Cao Cấp', baseDist: 11.0, minPrice: 190, maxPrice: 260 },
  { name: '☕ Cà Phê Muối Mang Đi', baseDist: 2.5, minPrice: 40, maxPrice: 55 },
  { name: '🍔 Combo Burger Bò Phô Mai', baseDist: 6.0, minPrice: 85, maxPrice: 120 }
];

export default function GigEconomy2D() {
  const canvasRef = useRef(null);

  // --- TRẠNG THÁI TÀI XẾ (LAO ĐỘNG) ---
  const [energy, setEnergy] = useState(100);
  const [driverWage, setDriverWage] = useState(0); // v
  const [driverCost, setDriverCost] = useState(0); // c
  const [completedOrders, setCompletedOrders] = useState(0);
  const [rating, setRating] = useState(4.95);
  const [acceptanceRate, setAcceptanceRate] = useState(96);
  const [tier, setTier] = useState('Bạc');
  const [questOrders, setQuestOrders] = useState(0);
  const [bikeHealth, setBikeHealth] = useState(100);

  // --- TRẠNG THÁI CHỦ NỀN TẢNG (TƯ BẢN SỐ) ---
  const [platformCutRate, setPlatformCutRate] = useState(0.25); // 25%
  const [surplusM, setSurplusM] = useState(0); // m
  const [algoSpeed, setAlgoSpeed] = useState(1.0);
  const [algoLevel, setAlgoLevel] = useState(1);
  const [droneCount, setDroneCount] = useState(0);

  // --- TRẠNG THÁI ĐƠN HÀNG HIỆN TẠI (NGẪU NHIÊN) ---
  const [currentOrder, setCurrentOrder] = useState({
    name: '🍛 Cơm Tấm Sườn Bì Chả Trứng',
    distance: 4.8,
    price: 85,
    vehicleCost: 26
  });

  // --- BIẾN ĐỘNG THỊ TRƯỜNG & CHI PHÍ ---
  const [gasCrisis, setGasCrisis] = useState(false);
  const [isBatchedOrder, setIsBatchedOrder] = useState(false);
  const [isStrike, setIsStrike] = useState(false);
  const [isNight, setIsNight] = useState(false);
  const [weather, setWeather] = useState('clear');
  const [autoDispatch, setAutoDispatch] = useState(false);

  const [hasFood, setHasFood] = useState(false);
  const [missionState, setMissionState] = useState('idle');
  const [logList, setLogList] = useState([
    '☕ TÍNH NĂNG MỚI: Lái xe (W/A/S/D) hoặc click vào Quán Trà Đá thì xe sẽ tự chạy tới và TỰ ĐỘNG HỒI PHỤC THỂ LỰC!',
    'Mẹo: Cứ cày đơn mệt mỏi, hãy tấp xe vào Quán Trà Đá để sạc lại 100% pin năng lượng.'
  ]);

  // Phân tích dòng tiền đơn hiện tại W = c + v + m
  const currentPrice = currentOrder.price;
  const currentCost = currentOrder.vehicleCost;
  const currentSurplusM = currentPrice * platformCutRate;
  const currentWageV = Math.max(0, currentPrice - currentSurplusM - currentCost);
  const surplusRate = currentWageV > 0 ? ((currentSurplusM / currentWageV) * 100).toFixed(1) : '∞';

  const gameRef = useRef({
    energy: 100,
    driverWage: 0,
    driverCost: 0,
    completedOrders: 0,
    rating: 4.95,
    acceptanceRate: 96,
    bikeHealth: 100,
    platformCutRate: 0.25,
    surplusM: 0,
    algoSpeed: 1.0,
    algoLevel: 1,
    currentOrder: { name: '🍛 Cơm Tấm', distance: 4.8, price: 85, vehicleCost: 26 },
    gasCrisis: false,
    weather: 'clear',
    isNight: false,
    autoDispatch: false,
    isStrike: false,
    isBatchedOrder: false,
    missionState: 'idle',
    targetPrice: 85,
    targetCost: 26,
    targetDrain: 12,
    hasFood: false
  });

  useEffect(() => {
    gameRef.current = {
      energy,
      driverWage,
      driverCost,
      completedOrders,
      rating,
      acceptanceRate,
      bikeHealth,
      platformCutRate,
      surplusM,
      algoSpeed,
      algoLevel,
      currentOrder,
      gasCrisis,
      weather,
      isNight,
      autoDispatch,
      isStrike,
      isBatchedOrder,
      missionState,
      targetPrice: gameRef.current.targetPrice || currentOrder.price,
      targetCost: gameRef.current.targetCost || currentOrder.vehicleCost,
      targetDrain: gameRef.current.targetDrain || 12,
      hasFood
    };
  }, [energy, driverWage, driverCost, completedOrders, rating, acceptanceRate, bikeHealth, platformCutRate, surplusM, algoSpeed, algoLevel, currentOrder, gasCrisis, weather, isNight, autoDispatch, isStrike, isBatchedOrder, missionState, hasFood]);

  const addLog = (msg) => {
    setLogList(prev => [msg, ...prev.slice(0, 4)]);
  };

  const generateRandomOrder = (isNightShift = false, isBatched = false) => {
    const template = RANDOM_ORDER_TYPES[Math.floor(Math.random() * RANDOM_ORDER_TYPES.length)];
    const distNoise = +(Math.random() * 1.5 - 0.75).toFixed(1);
    const finalDist = Math.max(1.2, +(template.baseDist + distNoise).toFixed(1));

    let randomPrice = Math.floor(Math.random() * (template.maxPrice - template.minPrice + 1)) + template.minPrice;
    if (isNightShift) randomPrice = Math.round(randomPrice * 1.25);
    if (isBatched) randomPrice = Math.round(randomPrice * 1.7);

    let cost = Math.round(randomPrice * (0.28 + Math.random() * 0.05));
    if (gameRef.current.gasCrisis) cost = Math.round(cost * 1.4);

    return {
      name: isBatched ? `[Ghép 2 đơn] ${template.name}` : template.name,
      distance: isBatched ? +(finalDist * 1.5).toFixed(1) : finalDist,
      price: randomPrice,
      vehicleCost: cost
    };
  };

  const playSound = (type) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;

      if (type === 'coin') {
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.setValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'heal') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'strike') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.setValueAtTime(160, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === 'upgrade') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);
        osc.frequency.setValueAtTime(1046.50, now + 0.3);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      }
    } catch (e) {}
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const map = {
      restaurant:  { x: 70,  y: 40,  w: 105, h: 65, label: '🍜 Quán Cơm', color: '#f59e0b' },
      gasStation:  { x: 70,  y: 260, w: 105, h: 65, label: '⛽ Trạm Xe/Xăng', color: '#d97706' },
      teaStall:    { x: 330, y: 45,  w: 95,  h: 60, label: '☕ Trà Đá Hồi Máu', color: '#10b981' },
      customerA:   { x: 575, y: 260, w: 100, h: 65, label: '🏠 Nhà Khách A', color: '#06b6d4' },
      customerB:   { x: 575, y: 155, w: 100, h: 58, label: '🏢 Khách B (Ghép)', color: '#3b82f6' },
      platformHQ:  { x: 575, y: 35,  w: 100, h: 75, label: '🏢 AI Sàn (m)', color: '#8b5cf6' },
      policePoint: { x: 330, y: 260, w: 95,  h: 60, label: '🚨 Trạm CSGT', color: '#ef4444' }
    };

    const bike = {
      x: 375, y: 185,
      targetX: 375, targetY: 185,
      angle: 0, speed: 3.8
    };

    let particles = [];
    let rainDrops = [];
    let healingParticles = [];
    let lastHealSoundTime = 0;
    let lastPoliceTime = 0;
    let lastRepairTime = 0;

    for (let i = 0; i < 90; i++) {
      rainDrops.push({ x: Math.random() * 850, y: Math.random() * 450, len: 10 + Math.random() * 12, speed: 9 + Math.random() * 5 });
    }

    const spawnDeliveryCash = (startX, startY, orderPriceVal) => {
      playSound('coin');
      const mVal = orderPriceVal * gameRef.current.platformCutRate;
      const driverGross = orderPriceVal - mVal;

      // Tiền nhận liền tay bay về phía tài xế (+Nhận liền)
      for (let i = 0; i < 7; i++) {
        particles.push({
          x: startX, y: startY,
          targetX: 50, targetY: 15,
          color: '#10b981', text: i === 0 ? `+${driverGross.toFixed(0)}k (Nhận liền)` : null,
          progress: 0, speed: 0.025 + Math.random() * 0.015
        });
      }
      // Tiền thặng dư sàn cắt bay về phía trụ sở AI Platform
      for (let i = 0; i < 7; i++) {
        particles.push({
          x: startX, y: startY,
          targetX: map.platformHQ.x + 50, targetY: map.platformHQ.y + 20,
          color: '#8b5cf6', text: i === 0 ? `+${mVal.toFixed(0)}k (m sàn)` : null,
          progress: 0, speed: 0.02 + Math.random() * 0.015
        });
      }
    };

    const spawnRepairCash = (startX, startY, repairCost) => {
      // Tiền xăng & sửa chữa tự trả từ tiền túi bay về phía Trạm Xe
      for (let i = 0; i < 6; i++) {
        particles.push({
          x: startX, y: startY,
          targetX: map.gasStation.x + 50, targetY: map.gasStation.y + 30,
          color: '#d97706', text: i === 0 ? `-${repairCost}k (xăng/xe c)` : null,
          progress: 0, speed: 0.025 + Math.random() * 0.015
        });
      }
    };

    const keys = { w: false, s: false, a: false, d: false };
    const onKD = (e) => {
      const k = e.key.toLowerCase();
      if (['w', 'arrowup'].includes(k)) keys.w = true;
      if (['s', 'arrowdown'].includes(k)) keys.s = true;
      if (['a', 'arrowleft'].includes(k)) keys.a = true;
      if (['d', 'arrowright'].includes(k)) keys.d = true;
    };
    const onKU = (e) => {
      const k = e.key.toLowerCase();
      if (['w', 'arrowup'].includes(k)) keys.w = false;
      if (['s', 'arrowdown'].includes(k)) keys.s = false;
      if (['a', 'arrowleft'].includes(k)) keys.a = false;
      if (['d', 'arrowright'].includes(k)) keys.d = false;
    };
    window.addEventListener('keydown', onKD);
    window.addEventListener('keyup', onKU);

    const onCanvasClick = (e) => {
      if (gameRef.current.isStrike) {
        addLog('⚠️ Tài xế đang đình công! Hãy bấm "Dừng bãi công" để mở lại ứng dụng.');
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      // Click on Restaurant
      if (cx >= map.restaurant.x && cx <= map.restaurant.x + map.restaurant.w &&
          cy >= map.restaurant.y && cy <= map.restaurant.y + map.restaurant.h) {
        window.__dispatchOrder(false);
        return;
      }

      // CLICK ON TEA STALL -> LÁI XE TRỰC TIẾP TỚI QUÁN TRÀ ĐÁ ĐỂ HỒI THỂ LỰC!
      if (cx >= map.teaStall.x && cx <= map.teaStall.x + map.teaStall.w &&
          cy >= map.teaStall.y && cy <= map.teaStall.y + map.teaStall.h) {
        bike.targetX = map.teaStall.x + 45;
        bike.targetY = map.teaStall.y + 35;
        addLog('☕ Đang lái xe tới Quán Trà Đá để hồi phục thể lực...');
        return;
      }

      // Click on Gas Station -> Lái xe tới sửa xe
      if (cx >= map.gasStation.x && cx <= map.gasStation.x + map.gasStation.w &&
          cy >= map.gasStation.y && cy <= map.gasStation.y + map.gasStation.h) {
        bike.targetX = map.gasStation.x + 50;
        bike.targetY = map.gasStation.y + 35;
        addLog('⛽ Đang lái xe tới Cây Xăng/Trạm Xe để kiểm tra xe...');
        return;
      }

      bike.targetX = cx;
      bike.targetY = cy;
    };
    canvas.addEventListener('click', onCanvasClick);

    // Kích hoạt đơn hàng ngẫu nhiên mới
    window.__dispatchOrder = (isNightShift = false) => {
      if (gameRef.current.isStrike) {
        addLog('✊ Tài xế đang đình công tắt app! Nền tảng bị tê liệt hoàn toàn.');
        return;
      }
      if (gameRef.current.energy < (isNightShift ? 15 : 10)) {
        addLog('🛑 Tài xế kiệt sức! Hãy lái xe ghé Quán Trà Đá ☕ để hồi phục năng lượng.');
        return;
      }
      if (gameRef.current.bikeHealth <= 15) {
        addLog('🛠️ Xe máy hỏng hóc nặng! Cần ghé Trạm Xe ⛽ để bảo dưỡng trước khi chạy tiếp.');
        return;
      }

      const newOrder = generateRandomOrder(isNightShift, gameRef.current.isBatchedOrder);
      setCurrentOrder(newOrder);

      gameRef.current.targetPrice = newOrder.price;
      gameRef.current.targetCost = newOrder.vehicleCost;
      gameRef.current.targetDrain = Math.round((newOrder.distance * 2.2 + (isNightShift ? 10 : 0)) * gameRef.current.algoSpeed);
      if (gameRef.current.weather === 'rain') gameRef.current.targetDrain += 5;
      if (gameRef.current.weather === 'storm') gameRef.current.targetDrain += 10;

      gameRef.current.missionState = 'to_restaurant';
      setMissionState('to_restaurant');
      bike.targetX = map.restaurant.x + 50;
      bike.targetY = map.restaurant.y + 35;
      bike.hasFood = false;
      setHasFood(false);

      addLog(`🔔 <strong>Nổ đơn ngẫu nhiên:</strong> ${newOrder.name} (${newOrder.distance} km) - Giá: <strong>${newOrder.price}k VNĐ</strong>!`);
    };

    window.__restDriver = () => {
      bike.targetX = map.teaStall.x + 45;
      bike.targetY = map.teaStall.y + 35;
      addLog('☕ Đang di chuyển đến Quán Trà Đá để nghỉ ngơi.');
    };

    window.__repairBike = () => {
      if (gameRef.current.driverWage < 40) {
        addLog('❌ Không đủ tiền để sửa xe! (Cần 40k VNĐ).');
        return;
      }
      bike.targetX = map.gasStation.x + 50;
      bike.targetY = map.gasStation.y + 35;
      addLog('🔧 Đang di chuyển vào Trạm Xe để bảo dưỡng.');
    };

    let animId;
    const render = () => {
      animId = requestAnimationFrame(render);
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      if (gameRef.current.isStrike) {
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(0, 0, w, h);
        ctx.font = 'bold 24px system-ui';
        ctx.fillStyle = '#f43f5e';
        ctx.textAlign = 'center';
        ctx.fillText('✊ TÀI XẾ ĐỒNG LOẠT ĐÌNH CÔNG TẮT APP!', w / 2, h / 2 - 15);
        ctx.font = '14px system-ui';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText('Nền tảng tê liệt, thặng dư m của chủ sàn rơi về 0. Bấm "Dừng bãi công" để tái đàm phán.', w / 2, h / 2 + 15);
        return;
      }

      ctx.fillStyle = gameRef.current.isNight ? '#090d16' : '#1e293b';
      ctx.fillRect(0, 0, w, h);

      // Roads
      ctx.fillStyle = gameRef.current.isNight ? '#131b2e' : '#334155';
      ctx.fillRect(0, 155, w, 60);
      ctx.fillRect(60, 0, 70, h);
      ctx.fillRect(340, 0, 70, h);
      ctx.fillRect(570, 0, 70, h);

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      ctx.beginPath(); ctx.moveTo(0, 185); ctx.lineTo(w, 185); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(95, 0); ctx.lineTo(95, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(375, 0); ctx.lineTo(375, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(605, 0); ctx.lineTo(605, h); ctx.stroke();
      ctx.setLineDash([]);

      // Landmarks
      drawLandmark(ctx, map.restaurant.x, map.restaurant.y, map.restaurant.w, map.restaurant.h, '🍜', 'Quán Cơm', '#f59e0b', bike.hasFood ? '' : '👉 Lấy món');
      drawLandmark(ctx, map.teaStall.x, map.teaStall.y, map.teaStall.w, map.teaStall.h, '☕', 'Quán Trà Đá', '#10b981', 'Ghé tự hồi thể lực');
      drawLandmark(ctx, map.gasStation.x, map.gasStation.y, map.gasStation.w, map.gasStation.h, '⛽', 'Trạm Xe/Xăng', '#d97706', 'Khi hao mòn tự ghé');
      drawLandmark(ctx, map.customerA.x, map.customerA.y, map.customerA.w, map.customerA.h, '🏠', 'Khách Hàng A', '#06b6d4', bike.hasFood ? '🎯 Giao tới!' : 'Chờ món');
      drawLandmark(ctx, map.customerB.x, map.customerB.y, map.customerB.w, map.customerB.h, '🏢', 'Khách B (Ghép)', '#3b82f6', gameRef.current.isBatchedOrder && bike.hasFood ? '🎯 Giao tiếp!' : 'Đơn ghép');
      drawLandmark(ctx, map.policePoint.x, map.policePoint.y, map.policePoint.w, map.policePoint.h, '🚨', 'Chốt CSGT', '#ef4444', 'Coi chừng phạt');
      drawTower(ctx, map.platformHQ.x, map.platformHQ.y, map.platformHQ.w, map.platformHQ.h, gameRef.current.algoLevel);

      // Movement
      if (keys.w || keys.s || keys.a || keys.d) {
        bike.targetX = bike.x; bike.targetY = bike.y;
        const spd = (gameRef.current.bikeHealth > 30 ? 4.2 : 2.5) * gameRef.current.algoSpeed;
        if (keys.w) { bike.y -= spd; bike.angle = -Math.PI / 2; }
        if (keys.s) { bike.y += spd; bike.angle = Math.PI / 2; }
        if (keys.a) { bike.x -= spd; bike.angle = Math.PI; }
        if (keys.d) { bike.x += spd; bike.angle = 0; }
      } else {
        const dx = bike.targetX - bike.x;
        const dy = bike.targetY - bike.y;
        const dist = Math.hypot(dx, dy);
        const autoSpd = (gameRef.current.bikeHealth > 30 ? 3.8 : 2.2) * gameRef.current.algoSpeed;

        if (dist <= autoSpd) {
          bike.x = bike.targetX;
          bike.y = bike.targetY;

          if (gameRef.current.missionState === 'to_restaurant') {
            gameRef.current.missionState = 'to_customer';
            setMissionState('to_customer');
            bike.hasFood = true;
            setHasFood(true);
            bike.targetX = map.customerA.x + 45;
            bike.targetY = map.customerA.y + 35;
            addLog(`📦 Đã lấy món (${gameRef.current.targetPrice}k)! Đang phóng xe đến Nhà Khách...`);
          } else if (gameRef.current.missionState === 'to_customer') {
            gameRef.current.missionState = 'idle';
            setMissionState('idle');
            bike.hasFood = false;
            setHasFood(false);
            bike.targetX = 375;
            bike.targetY = 185;

            const finalPrice = gameRef.current.targetPrice;
            const m = finalPrice * gameRef.current.platformCutRate;
            const driverGross = finalPrice - m; // Tiền nhận liền tay, chưa trừ trạm xăng!

            const nextEnergy = Math.max(0, gameRef.current.energy - gameRef.current.targetDrain);
            const nextWage = gameRef.current.driverWage + driverGross; // Nhận đủ tiền cuốc
            const nextCost = gameRef.current.driverCost; // Chưa trừ phí trạm xăng, khi nào độ bền giảm tự tới
            const nextSurplus = gameRef.current.surplusM + m;
            const nextOrders = gameRef.current.completedOrders + (gameRef.current.isBatchedOrder ? 2 : 1);
            
            // Độ bền xe giảm theo quãng đường
            const wear = Math.min(25, Math.round(5 + (gameRef.current.currentOrder.distance || 3) * 1.5));
            const nextHealth = Math.max(0, gameRef.current.bikeHealth - wear);

            setEnergy(nextEnergy);
            setDriverWage(nextWage);
            setDriverCost(nextCost);
            setSurplusM(nextSurplus);
            setCompletedOrders(nextOrders);
            setBikeHealth(nextHealth);

            // Quest
            setQuestOrders(q => {
              const n = q + (gameRef.current.isBatchedOrder ? 2 : 1);
              if (n >= 10) {
                if (Math.random() < 0.6) {
                  addLog('🎉 <strong>Thưởng ảo thành công:</strong> Nhận thêm 150k tiền thưởng ngày!');
                  setDriverWage(w => w + 150);
                } else {
                  addLog('⚠️ <strong>Thuật toán bóp thưởng ảo:</strong> Cuốc thứ 10 bị hủy sát giờ 23h59! Mất trắng 150k.');
                }
                return 0;
              }
              return n;
            });

            // Rating
            if (Math.random() < 0.2) {
              setRating(r => Math.max(3.5, +(r - 0.15).toFixed(2)));
              addLog('⭐ Khách đánh giá 1 sao oan: "Đồ ăn nguội vì đường kẹt"! Thuật toán trừ điểm.');
            } else {
              setRating(r => Math.min(5.0, +(r + 0.02).toFixed(2)));
            }

            spawnDeliveryCash(bike.x, bike.y, finalPrice);
            addLog(`🎉 Giao xong đơn ${finalPrice}k: Sàn cắt ${m.toFixed(0)}k (m), Tài xế nhận liền tay +${driverGross.toFixed(0)}k! Độ bền xe còn ${nextHealth}% (chưa cần ghé trạm xăng).`);
            if (nextHealth <= 25) {
              addLog(`⚠️ <strong>Xe xuống cấp (${nextHealth}%):</strong> Xe chạy chậm lại, hãy chủ động ghé Trạm Xe ⛽ khi thuận tiện!`);
            }

            if (gameRef.current.autoDispatch && nextEnergy >= 10 && nextHealth > 15) {
              setTimeout(() => {
                if (window.__dispatchOrder) window.__dispatchOrder(false);
              }, 800);
            }
          }
        } else {
          bike.angle = Math.atan2(dy, dx);
          bike.x += Math.cos(bike.angle) * autoSpd;
          bike.y += Math.sin(bike.angle) * autoSpd;
        }
      }

      // --- CƠ CHẾ TỰ ĐỘNG HỒI PHỤC THỂ LỰC KHI GHÉ QUÁN TRÀ ĐÁ ---
      const distToTea = Math.hypot(bike.x - (map.teaStall.x + 45), bike.y - (map.teaStall.y + 30));
      if (distToTea < 45) {
        if (gameRef.current.energy < 100) {
          // Hồi phục thể lực dần dần liên tục lên 100%
          const healedEnergy = Math.min(100, gameRef.current.energy + 0.8);
          gameRef.current.energy = healedEnergy;
          setEnergy(healedEnergy);

          // Tạo hạt hồi phục màu xanh lá cây
          if (Math.random() < 0.4) {
            healingParticles.push({
              x: bike.x + (Math.random() - 0.5) * 20,
              y: bike.y - 10,
              vy: -1.2,
              life: 1.0,
              text: '+Thể lực ☕'
            });
          }

          // Âm thanh hồi máu cách quãng
          const now = Date.now();
          if (now - lastHealSoundTime > 600) {
            playSound('heal');
            lastHealSoundTime = now;
            addLog(`☕ <strong>Đang uống trà đá hồi sức:</strong> Thể lực tăng lên ${Math.round(healedEnergy)}%!`);
          }
        }
      }

      // --- CƠ CHẾ SỬA XE & ĐỔ XĂNG KHI CHỦ ĐỘNG GHÉ TRẠM XE ---
      const distToGas = Math.hypot(bike.x - (map.gasStation.x + 50), bike.y - (map.gasStation.y + 30));
      if (distToGas < 45) {
        if (gameRef.current.bikeHealth < 100) {
          const damage = 100 - gameRef.current.bikeHealth;
          let repairCost = Math.max(15, Math.round(damage * 0.5));
          if (gameRef.current.gasCrisis) repairCost = Math.round(repairCost * 1.4);

          if (gameRef.current.driverWage >= repairCost) {
            const now = Date.now();
            if (now - lastRepairTime > 2000) {
              lastRepairTime = now;
              setDriverWage(w => w - repairCost);
              setDriverCost(c => c + repairCost);
              setBikeHealth(100);
              gameRef.current.bikeHealth = 100;
              spawnRepairCash(bike.x, bike.y, repairCost);
              playSound('coin');
              addLog(`🔧 <strong>Đã ghé Trạm Xe:</strong> Tự trả tiền xăng & bảo dưỡng -${repairCost}k (c) từ tiền túi. Xe phục hồi 100% độ bền!`);
            }
          } else {
            const now = Date.now();
            if (now - lastRepairTime > 3000) {
              lastRepairTime = now;
              addLog(`❌ <strong>Không đủ tiền bảo dưỡng:</strong> Cần ${repairCost}k để bảo dưỡng xe, nhưng bạn chỉ có ${gameRef.current.driverWage.toFixed(0)}k!`);
            }
          }
        }
      }

      // Proximity checks at Restaurant and Customer
      if (Math.hypot(bike.x - (map.restaurant.x + 50), bike.y - (map.restaurant.y + 35)) < 35 && !bike.hasFood) {
        bike.hasFood = true;
        setHasFood(true);
        addLog('🍜 Lấy món tại Quán Cơm! Lái xe đến Khách Hàng để giao.');
      }
      if (Math.hypot(bike.x - (map.customerA.x + 45), bike.y - (map.customerA.y + 35)) < 35 && bike.hasFood) {
        bike.hasFood = false;
        setHasFood(false);
        const finalPrice = gameRef.current.targetPrice;
        const m = finalPrice * gameRef.current.platformCutRate;
        const driverGross = finalPrice - m;
        const wear = Math.min(25, Math.round(5 + (gameRef.current.currentOrder.distance || 3) * 1.5));
        const nextHealth = Math.max(0, gameRef.current.bikeHealth - wear);

        setEnergy(e => Math.max(0, e - 12));
        setDriverWage(w => w + driverGross);
        setSurplusM(sm => sm + m);
        setCompletedOrders(o => o + 1);
        setBikeHealth(nextHealth);

        spawnDeliveryCash(bike.x, bike.y, finalPrice);
        addLog(`🎉 Giao thành công! Sàn cắt ${m.toFixed(0)}k (m), Tài xế nhận liền tay +${driverGross.toFixed(0)}k! Độ bền xe còn ${nextHealth}% (chưa cần trả trạm xăng).`);
        if (nextHealth <= 25) {
          addLog(`⚠️ <strong>Xe xuống cấp (${nextHealth}%):</strong> Xe chạy chậm lại, hãy chủ động ghé Trạm Xe ⛽ khi thuận tiện!`);
        }
      }
      // Police
      const distToPolice = Math.hypot(bike.x - (map.policePoint.x + 45), bike.y - (map.policePoint.y + 30));
      if (distToPolice < 35) {
        const now = Date.now();
        if (now - lastPoliceTime > 4000) {
          lastPoliceTime = now;
          if (Math.random() < 0.3) {
            setDriverWage(w => Math.max(0, w - 100));
            setDriverCost(c => c + 100);
            playSound('strike');
            addLog('🚨 <strong>Bị CSGT phạt -100k:</strong> Vượt đèn vàng do vội kịp giờ thuật toán! Shipper tự gánh chịu.');
          }
        }
      }

      bike.x = Math.max(15, Math.min(w - 15, bike.x));
      bike.y = Math.max(15, Math.min(h - 15, bike.y));

      drawBike2D(ctx, bike.x, bike.y, bike.angle, bike.hasFood, gameRef.current.energy, gameRef.current.isNight);

      // Draw Healing Particles
      for (let i = healingParticles.length - 1; i >= 0; i--) {
        const hp = healingParticles[i];
        hp.y += hp.vy;
        hp.life -= 0.03;
        if (hp.life <= 0) {
          healingParticles.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = hp.life;
        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 11px system-ui';
        ctx.fillText(hp.text, hp.x, hp.y);
        ctx.restore();
      }

      // Weather
      if (gameRef.current.weather !== 'clear') {
        ctx.strokeStyle = gameRef.current.weather === 'storm' ? 'rgba(147, 197, 253, 0.8)' : 'rgba(186, 230, 253, 0.5)';
        ctx.lineWidth = gameRef.current.weather === 'storm' ? 2 : 1.5;
        rainDrops.forEach(r => {
          ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x - 3, r.y + r.len); ctx.stroke();
          r.y += r.speed * (gameRef.current.weather === 'storm' ? 1.5 : 1);
          r.x -= 2;
          if (r.y > h) { r.y = -10; r.x = Math.random() * w; }
        });
      }

      // Cash Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.progress += p.speed;
        if (p.progress >= 1) { particles.splice(i, 1); continue; }
        const cx = p.x + (p.targetX - p.x) * p.progress;
        const cy = p.y + (p.targetY - p.y) * p.progress;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
        if (p.text && p.progress < 0.65) {
          ctx.font = 'bold 11px system-ui';
          ctx.fillStyle = p.color;
          ctx.fillText(p.text, cx + 8, cy - 6);
        }
      }
    };
    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKD);
      window.removeEventListener('keyup', onKU);
      canvas.removeEventListener('click', onCanvasClick);
    };
  }, []);

  function drawLandmark(ctx, x, y, w, h, emoji, name, color, badge) {
    ctx.save();
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 8); ctx.fill(); ctx.stroke();

    ctx.font = '22px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(emoji, x + w / 2, y + 28);

    ctx.font = 'bold 11px system-ui'; ctx.fillStyle = '#f8fafc';
    ctx.fillText(name, x + w / 2, y + 44);

    if (badge) {
      ctx.font = '9px system-ui'; ctx.fillStyle = color;
      ctx.fillText(badge, x + w / 2, y + 56);
    }
    ctx.restore();
  }

  function drawTower(ctx, x, y, w, h, level) {
    ctx.save();
    const bonusH = level * 4;
    const finalH = h + bonusH;
    const drawY = y - bonusH;

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.roundRect(x, drawY, w, finalH, 8); ctx.fill(); ctx.stroke();

    for (let sy = drawY + 8; sy < drawY + finalH - 18; sy += 9) {
      ctx.fillStyle = Math.sin(Date.now() * 0.006 + sy) > 0 ? '#38bdf8' : '#c084fc';
      ctx.fillRect(x + 10, sy, 8, 4);
      ctx.fillRect(x + 24, sy, 48, 4);
      ctx.fillRect(x + 78, sy, 8, 4);
    }

    ctx.font = 'bold 11px system-ui'; ctx.fillStyle = '#c7d2fe'; ctx.textAlign = 'center';
    ctx.fillText('🏢 AI PLATFORM', x + w / 2, drawY + finalH - 6);
    ctx.fillText(`Cấp ${level}`, x + w / 2, drawY - 4);
    ctx.restore();
  }

  function drawBike2D(ctx, x, y, angle, carryingFood, staminaVal, isNightMode) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    if (isNightMode) {
      const lightGrad = ctx.createRadialGradient(25, 0, 5, 80, 0, 65);
      lightGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
      lightGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = lightGrad;
      ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(80, -28); ctx.lineTo(80, 28); ctx.closePath(); ctx.fill();
    }

    ctx.fillStyle = '#0f172a'; ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(16, 0, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(-16, 0, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    ctx.strokeStyle = '#10b981'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(4, 0); ctx.lineTo(13, -3); ctx.stroke();

    if (carryingFood) {
      ctx.fillStyle = '#ef4444'; ctx.fillRect(-16, -8, 11, 16);
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 7px system-ui'; ctx.textAlign = 'center'; ctx.fillText('FOOD', -10, 3);
    } else {
      ctx.fillStyle = '#10b981'; ctx.fillRect(-14, -6, 8, 12);
    }

    ctx.fillStyle = '#0284c7'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = staminaVal > 30 ? '#22c55e' : '#ef4444';
    ctx.beginPath(); ctx.arc(5, 0, 5, 0, Math.PI * 2); ctx.fill();

    if (staminaVal < 30 && Math.sin(Date.now() * 0.01) > 0) {
      ctx.font = '12px system-ui'; ctx.fillText('💦', -4, -12);
    }
    ctx.restore();
  }

  const handleUpgradeAlgo = () => {
    if (surplusM < 200) {
      alert('Cần tích lũy tối thiểu 200k thặng dư để tái đầu tư AI!');
      return;
    }
    playSound('upgrade');
    setSurplusM(s => s - 200);
    setAlgoLevel(l => l + 1);
    setAlgoSpeed(sp => +(sp + 0.4).toFixed(1));
    setPlatformCutRate(c => Math.min(0.40, +(c + 0.05).toFixed(2)));
    addLog(`⚙️ Nâng cấp AI v${algoLevel + 1}.0: Chiết khấu tăng lên ${(platformCutRate + 0.05) * 100}%, cường độ ép đơn x${(algoSpeed + 0.4).toFixed(1)}!`);
  };

  const handleGasCrisis = () => {
    setGasCrisis(g => {
      const next = !g;
      addLog(next 
        ? '⛽ <strong>Khủng hoảng giá xăng:</strong> Chi phí xăng c tăng thêm 40%! Shipper tự gánh toàn bộ, tiền công v bị bóp nghẹt!'
        : '⛽ Giá xăng bình ổn trở lại mức bình thường.');
      return next;
    });
  };

  const handleToggleStrike = () => {
    playSound('strike');
    setIsStrike(s => {
      const next = !s;
      if (next) {
        addLog('✊ <strong>Đình công nổ ra:</strong> Toàn bộ tài xế tắt app! Nền tảng tê liệt, thặng dư m của sàn sụt về 0.');
      } else {
        addLog('🤝 Đình công kết thúc: Chủ sàn tạm hoãn tăng chiết khấu, shipper bật lại ứng dụng.');
      }
      return next;
    });
  };

  const handleBuyDrone = () => {
    if (surplusM < 500) {
      alert('Cần tích lũy tối thiểu 500k thặng dư tích lũy để mua Drone tự hành!');
      return;
    }
    setSurplusM(s => s - 500);
    setDroneCount(d => d + 1);
    addLog('🤖 <strong>Tư bản tự động hóa (Cấu tạo hữu cơ c/v tăng vọt):</strong> Chủ sàn đầu tư Drone AI giao hàng, đe dọa sa thải hàng loạt shipper!');
  };

  const pctC = (currentCost / currentPrice) * 100;
  const pctM = (currentSurplusM / currentPrice) * 100;
  const pctV = Math.max(0, 100 - pctC - pctM);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      
      {/* Top Header */}
      <div style={{ background: '#111827', borderRadius: '16px', border: '1px solid #1f2937', padding: '14px 18px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '6px', background: '#10b98120', color: '#34d399', border: '1px solid #10b98140' }}>
              ☕ TỰ HỒI THỂ LỰC TẠI QUÁN TRÀ ĐÁ
            </span>
            <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '6px', background: '#6366f120', color: '#818cf8', border: '1px solid #6366f140' }}>
              W = c + v + m
            </span>
          </div>
          <h1 style={{ fontSize: '19px', fontWeight: 'bold', margin: 0, color: '#f8fafc' }}>
            🛵 Mô Phỏng Kinh Tế Nền Tảng: Tương Tác Quán Trà Đá Tự Hồi Thể Lực
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setWeather(w => w === 'clear' ? 'rain' : w === 'rain' ? 'storm' : 'clear')}
            style={{ padding: '6px 12px', borderRadius: '8px', background: weather !== 'clear' ? '#0284c7' : '#1e293b', color: '#fff', border: '1px solid #334155', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
          >
            {weather === 'storm' ? '⛈️ Bão Lớn' : weather === 'rain' ? '🌧️ Mưa Rào' : '☀️ Nắng Ráo'}
          </button>
          <button
            onClick={() => setIsNight(n => !n)}
            style={{ padding: '6px 12px', borderRadius: '8px', background: isNight ? '#4338ca' : '#1e293b', color: '#fff', border: '1px solid #334155', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
          >
            {isNight ? '🌙 Ban Đêm (+25%)' : '☀️ Ban Ngày'}
          </button>
          <button
            onClick={handleToggleStrike}
            style={{ padding: '6px 14px', borderRadius: '8px', background: isStrike ? '#be123c' : '#881337', color: '#fff', border: '1px solid #e11d48', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
          >
            {isStrike ? '🛑 Dừng Bãi Công' : '✊ Tổ Chức Đình Công'}
          </button>
        </div>
      </div>

      {/* Thông tin đơn hàng ngẫu nhiên hiện tại */}
      <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '10px 16px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>📦</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#38bdf8' }}>{currentOrder.name}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Cự ly giao: <strong>{currentOrder.distance} km</strong> | Khách trả: <strong style={{ color: '#f59e0b' }}>{currentOrder.price}.000 VNĐ</strong></div>
          </div>
        </div>
        <div style={{ fontSize: '12px', background: '#0f172a', padding: '4px 12px', borderRadius: '8px', border: '1px solid #334155', color: '#cbd5e1' }}>
          Xăng & hao mòn xe c: <strong style={{ color: '#fbbf24' }}>{currentCost}k</strong> | Sàn cắt m: <strong style={{ color: '#a78bfa' }}>{currentSurplusM.toFixed(0)}k</strong> | Tài xế nhận v: <strong style={{ color: '#34d399' }}>{currentWageV.toFixed(0)}k</strong>
        </div>
      </div>

      {/* Live Formula Bar (W = c + v + m) */}
      <div style={{ background: '#111827', borderRadius: '14px', border: '1px solid #1f2937', padding: '12px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>
          <span style={{ color: '#cbd5e1' }}>CƠ CẤU ĐƠN HIỆN TẠI ({currentPrice}k VNĐ)</span>
          <span style={{ padding: '2px 10px', borderRadius: '20px', background: '#6366f120', color: Number(surplusRate) >= 100 ? '#f43f5e' : '#818cf8', border: '1px solid #6366f140', fontSize: '12px' }}>
            Tỷ suất bóc lột m' = {surplusRate}% {Number(surplusRate) >= 100 && '🔥 (Bóc lột cực đại)'}
          </span>
        </div>
        <div style={{ display: 'flex', height: '26px', borderRadius: '8px', overflow: 'hidden', fontWeight: 'bold', fontSize: '11px', color: '#fff', textAlign: 'center', lineHeight: '26px' }}>
          <div style={{ width: `${pctC}%`, background: '#d97706' }} title="Tư bản bất biến c: Xăng + Hao mòn xe">c: {currentCost}k ({pctC.toFixed(0)}%)</div>
          <div style={{ width: `${pctV}%`, background: '#10b981' }} title="Tư bản khả biến v: Tiền công thực nhận">v: {currentWageV.toFixed(0)}k ({pctV.toFixed(0)}%)</div>
          <div style={{ width: `${pctM}%`, background: '#8b5cf6' }} title="Giá trị thặng dư m: Chủ sàn trích">m: {currentSurplusM.toFixed(0)}k ({pctM.toFixed(0)}%)</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
          <span>🔸 <strong>c</strong>: Tài xế tự gánh phương tiện ({currentCost}k)</span>
          <span>🔹 <strong>v</strong>: Tiền nuôi sống tài xế ({currentWageV.toFixed(0)}k)</span>
          <span>🔺 <strong>m</strong>: Chủ sàn chiếm đoạt tự động ({currentSurplusM.toFixed(0)}k)</span>
        </div>
      </div>

      {/* 2 Bảng Thông Số Shipper & Chủ Sàn (Ngoại vi Canvas) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        
        {/* Bên Người Lao Động (Shipper) */}
        <div style={{ background: '#111827', borderRadius: '14px', border: '2px solid #059669', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: '#34d399', fontSize: '14px' }}>
              <span>👤 Shipper (Bậc {tier})</span>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: energy > 30 ? '#34d399' : '#f87171' }}>
              Thể lực: {energy.toFixed(0)}%
            </span>
          </div>

          <div style={{ height: '7px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${energy}%`, height: '100%', background: energy > 30 ? '#10b981' : '#ef4444', transition: 'width 0.2s' }}></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>
            <div style={{ background: '#1e293b', padding: '8px 10px', borderRadius: '8px' }}>
              <span style={{ color: '#94a3b8', fontSize: '11px' }}>Ví tiền nhận liền:</span>
              <div style={{ fontWeight: 'bold', color: '#34d399', fontSize: '15px' }}>{driverWage.toFixed(1)}k VNĐ</div>
            </div>
            <div style={{ background: '#1e293b', padding: '8px 10px', borderRadius: '8px' }}>
              <span style={{ color: '#94a3b8', fontSize: '11px' }}>Tiền xe/xăng đã trả (c):</span>
              <div style={{ fontWeight: 'bold', color: '#fbbf24', fontSize: '15px' }}>{driverCost.toFixed(1)}k VNĐ</div>
            </div>
            <div style={{ background: '#1e293b', padding: '6px 10px', borderRadius: '8px' }}>
              Độ bền xe: <strong style={{ color: bikeHealth > 30 ? '#34d399' : '#f43f5e' }}>{bikeHealth}%</strong>
            </div>
            <div style={{ background: '#1e293b', padding: '6px 10px', borderRadius: '8px' }}>
              Đánh giá: <strong>{rating.toFixed(2)} ⭐</strong> ({acceptanceRate}%)
            </div>
          </div>
        </div>

        {/* Bên Chủ Sàn Công Nghệ */}
        <div style={{ background: '#111827', borderRadius: '14px', border: '2px solid #8b5cf6', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: '#a78bfa', fontSize: '14px' }}>
              <span>🏢 Chủ Sàn (AI Cấp {algoLevel})</span>
            </div>
            <span style={{ fontSize: '11px', background: '#5b21b6', color: '#ddd6fe', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
              Ép đơn x{algoSpeed.toFixed(1)}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', color: '#cbd5e1', marginTop: '6px' }}>
            <div style={{ background: '#1e293b', padding: '8px 10px', borderRadius: '8px' }}>
              <span style={{ color: '#94a3b8', fontSize: '11px' }}>Quỹ thặng dư (m):</span>
              <div style={{ fontWeight: 'bold', color: '#a78bfa', fontSize: '15px' }}>{surplusM.toFixed(1)}k VNĐ</div>
            </div>
            <div style={{ background: '#1e293b', padding: '8px 10px', borderRadius: '8px' }}>
              <span style={{ color: '#94a3b8', fontSize: '11px' }}>Chiết khấu đơn:</span>
              <div style={{ fontWeight: 'bold', color: '#f43f5e', fontSize: '15px' }}>{(platformCutRate * 100).toFixed(0)}%</div>
            </div>
            <div style={{ background: '#1e293b', padding: '6px 10px', borderRadius: '8px' }}>
              Đội Drone AI: <strong style={{ color: '#38bdf8' }}>{droneCount} chiếc</strong>
            </div>
            <div style={{ background: '#1e293b', padding: '6px 10px', borderRadius: '8px' }}>
              Tổng đơn chạy: <strong style={{ color: '#f8fafc' }}>{completedOrders} cuốc</strong>
            </div>
          </div>
        </div>

      </div>

      {/* 2D Canvas Viewport (100% THÔNG THOÁNG) */}
      <div style={{ position: 'relative', width: '100%', height: '370px', borderRadius: '16px', overflow: 'hidden', border: '2px solid #1e293b', background: '#090d16' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', cursor: 'pointer' }} />

        <div style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid #334155', borderRadius: '20px', padding: '4px 16px', fontSize: '11px', color: '#cbd5e1', pointerEvents: 'none' }}>
          ☕ <em>Lái xe hoặc nhấp vào Quán Trà Đá: xe sẽ tự chạy tới và TỰ ĐỘNG HỒI THỂ LỰC!</em>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
        <button
          onClick={() => { if (window.__dispatchOrder) window.__dispatchOrder(false); }}
          disabled={isStrike || energy < 10}
          style={{ padding: '12px', background: '#059669', color: '#fff', border: 'none', borderRadius: '12px', cursor: energy >= 10 ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '13px' }}
        >
          🎲 Nổ Đơn Mới (Ngẫu Nhiên)
        </button>

        <button
          onClick={() => { if (window.__dispatchOrder) window.__dispatchOrder(true); }}
          disabled={isStrike || energy < 15}
          style={{ padding: '12px', background: '#be123c', color: '#fff', border: 'none', borderRadius: '12px', cursor: energy >= 15 ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '13px' }}
          title="Sản xuất giá trị thặng dư tuyệt đối bằng cách cày đêm"
        >
          🌙 Cày Đêm (+25% giá đơn)
        </button>

        <button
          onClick={() => { if (window.__restDriver) window.__restDriver(); }}
          style={{ padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
        >
          ☕ Chạy Tới Quán Trà Đá (Tự Hồi Máu)
        </button>

        <button
          onClick={() => { if (window.__repairBike) window.__repairBike(); }}
          style={{ padding: '12px', background: '#d97706', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
        >
          🔧 Chạy Vào Trạm Sửa Xe (-40k c)
        </button>
      </div>

      {/* Advanced Gig & Capitalist Mechanics */}
      <div style={{ background: '#111827', borderRadius: '14px', border: '1px solid #1f2937', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>⚙️ CƠ CHẾ NÂNG CAO CỦA NỀN KINH TẾ NỀN TẢNG (PLATFORM CAPITALISM):</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
          
          <button
            onClick={() => {
              setIsBatchedOrder(b => {
                const next = !b;
                addLog(next 
                  ? '📦📦 <strong>Bật Đơn Ghép:</strong> Các đơn ngẫu nhiên tiếp theo sẽ ghép 2 khách (giá tăng x1.7, thặng dư sàn cắt tăng vọt)!'
                  : 'Đã tắt chế độ đơn ghép.');
                return next;
              });
            }}
            style={{ padding: '10px', borderRadius: '10px', background: isBatchedOrder ? '#3b82f6' : '#1e293b', color: '#fff', border: '1px solid #334155', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', textAlign: 'left' }}
          >
            {isBatchedOrder ? '✅ Đang Ghép 2 Đơn Ngẫu Nhiên' : '➕ Kích Hoạt Đơn Ghép (Batching)'}
            <div style={{ fontSize: '10px', fontWeight: 'normal', color: '#cbd5e1', marginTop: '2px' }}>Tăng tỷ suất bóc lột m' của sàn</div>
          </button>

          <button
            onClick={handleGasCrisis}
            style={{ padding: '10px', borderRadius: '10px', background: gasCrisis ? '#b45309' : '#1e293b', color: '#fff', border: '1px solid #334155', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', textAlign: 'left' }}
          >
            {gasCrisis ? '⛽ Đang Bão Giá Xăng (+40% c)' : '⛽ Biến Động Giá Xăng Dầu'}
            <div style={{ fontSize: '10px', fontWeight: 'normal', color: '#cbd5e1', marginTop: '2px' }}>Tài xế tự chịu c, bóp nghẹt lương v</div>
          </button>

          <button
            onClick={handleUpgradeAlgo}
            disabled={surplusM < 200}
            style={{ padding: '10px', borderRadius: '10px', background: surplusM >= 200 ? '#7c3aed' : '#312e81', color: '#fff', border: 'none', cursor: surplusM >= 200 ? 'pointer' : 'not-allowed', opacity: surplusM >= 200 ? 1 : 0.6, fontSize: '12px', fontWeight: 'bold', textAlign: 'left' }}
          >
            🚀 Nâng Cấp Thuật Toán AI (200k m)
            <div style={{ fontSize: '10px', fontWeight: 'normal', color: '#cbd5e1', marginTop: '2px' }}>Tăng chiết khấu & tốc độ bào thể lực</div>
          </button>

          <button
            onClick={handleBuyDrone}
            disabled={surplusM < 500}
            style={{ padding: '10px', borderRadius: '10px', background: surplusM >= 500 ? '#0284c7' : '#0f172a', color: '#fff', border: 'none', cursor: surplusM >= 500 ? 'pointer' : 'not-allowed', opacity: surplusM >= 500 ? 1 : 0.6, fontSize: '12px', fontWeight: 'bold', textAlign: 'left' }}
          >
            🤖 Mua Drone Tự Hành AI (500k m)
            <div style={{ fontSize: '10px', fontWeight: 'normal', color: '#cbd5e1', marginTop: '2px' }}>Tự động hóa thay thế lao động sống</div>
          </button>

        </div>
      </div>

      {/* Auto Dispatch Toggle & Live Event Logs */}
      <div style={{ background: '#111827', borderRadius: '14px', border: '1px solid #1f2937', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => {
              const next = !autoDispatch;
              setAutoDispatch(next);
              if (next && missionState === 'idle') window.__dispatchOrder(false);
            }}
            style={{ padding: '6px 14px', borderRadius: '8px', background: autoDispatch ? '#d97706' : '#1e293b', color: '#fff', border: '1px solid #334155', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
          >
            {autoDispatch ? '⏸️ Tắt Tự Động Ép Cuốc' : '⚡ Bật Thuật Toán Ép Cuốc Ngẫu Nhiên Liên Tục'}
          </button>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Nhật ký thời gian thực (5 sự kiện gần nhất):</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
          {logList.map((l, idx) => (
            <div key={idx} style={{ color: idx === 0 ? '#38bdf8' : '#94a3b8', borderLeft: idx === 0 ? '3px solid #38bdf8' : '3px solid transparent', paddingLeft: '8px' }} dangerouslySetInnerHTML={{ __html: l }} />
          ))}
        </div>
      </div>

    </div>
  );
}
