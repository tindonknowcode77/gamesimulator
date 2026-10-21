import React, { useState, useEffect, useRef } from 'react';

// Danh sách các loại món ăn và đơn hàng ngẫu nhiên thực tế
const RANDOM_ORDER_TYPES = [
  { name: '🧋 Trà Sữa Trân Châu Đường Đen', baseDist: 2.2, minPrice: 35, maxPrice: 50, shopKey: 'milkTeaShop', custKeys: ['university', 'customerB'] },
  { name: '🥖 Bánh Mì Chả Cá Nóng Giòn', baseDist: 1.8, minPrice: 30, maxPrice: 45, shopKey: 'milkTeaShop', custKeys: ['university', 'customerA'] },
  { name: '🍜 Phở Bò Tái Nạm Gầu Béo', baseDist: 4.5, minPrice: 65, maxPrice: 85, shopKey: 'restaurant', custKeys: ['hospital', 'customerA'] },
  { name: '🍛 Cơm Tấm Sườn Bì Chả Trứng', baseDist: 5.2, minPrice: 75, maxPrice: 95, shopKey: 'restaurant', custKeys: ['customerA', 'university'] },
  { name: '🍕 Pizza Hải Sản Cỡ Lớn', baseDist: 8.5, minPrice: 130, maxPrice: 170, shopKey: 'pizzaShop', custKeys: ['customerB', 'customerA'] },
  { name: '🍗 Gà Rán Gia Đình 6 Miếng', baseDist: 7.0, minPrice: 110, maxPrice: 150, shopKey: 'pizzaShop', custKeys: ['university', 'customerB'] },
  { name: '🍲 Lẩu Thái Chua Cay 3 Người', baseDist: 13.5, minPrice: 210, maxPrice: 280, shopKey: 'restaurant', custKeys: ['customerB', 'hospital'] },
  { name: '🥣 Cháo Bào Ngư Hồi Sức', baseDist: 5.8, minPrice: 90, maxPrice: 130, shopKey: 'restaurant', custKeys: ['hospital'] },
  { name: '☕ Cà Phê Muối Mang Đi', baseDist: 2.5, minPrice: 40, maxPrice: 55, shopKey: 'milkTeaShop', custKeys: ['customerB', 'university'] },
  { name: '🍔 Combo Burger Bò Phô Mai', baseDist: 6.0, minPrice: 85, maxPrice: 120, shopKey: 'pizzaShop', custKeys: ['university', 'customerA'] }
];

// --- ROLE 1: CHỦ QUÁN / NHÂN VIÊN TẠI CÁC ĐIỂM LẤY MÓN ---
const SHOP_NPCS = {
  restaurant:  { name: 'Cô Ba (Chủ Quán Cơm Phở)', role: 'Role Chủ Quán · Khu 1 Ẩm Thực', avatar: '👩‍🍳', color: '#f59e0b' },
  milkTeaShop: { name: 'Bé Linh (Pha Chế Trà Sữa)', role: 'Role Nhân Viên Quán · Khu 2 Ăn Vặt', avatar: '🧑‍🍳', color: '#ec4899' },
  pizzaShop:   { name: 'Anh Tuấn (Quản Lý Cửa Hàng)', role: 'Role Quản Lý Fastfood · Khu 2 Nam', avatar: '👨‍🍳', color: '#f97316' }
};

const SHOP_DIALOGS = [
  {
    question: 'Đơn này khách đặt qua Ví Ship, bếp đang đóng hộp. Em kiểm tra mã đơn trên App rồi nhận món nhé!',
    options: [
      { text: '📱 Đối chiếu mã đơn & kiểm tra kỹ niêm phong', effect: () => ({ energy: -3, rating: 0.04, reply: 'Chuẩn mã đơn rồi đó em, chúc chạy thượng lộ bình an nha!', log: '✅ Kiểm tra kỹ mã đơn tại quán: tránh giao nhầm, khách tin tưởng (+0.04 ⭐).' }) },
      { text: '🚀 Đưa lẹ giúp em, App đang đếm ngược giờ giao!', effect: () => (Math.random() < 0.45
        ? { rating: -0.08, reply: 'Rồi rồi cầm lấy đi lẹ kẻo trễ...', log: '⚠️ Lấy vội không kiểm tra kỹ: canh bị sánh nhẹ ra túi (-0.08 ⭐).' }
        : { reply: 'Đây xong ngay rồi em!', log: '⚡ Lấy món siêu tốc, bắt đầu phóng đi giao!' }) },
      { text: '❓ Chị ơi, đơn Ví này sàn chiết khấu quán bao nhiêu %?', effect: (g) => ({ energy: -2, reply: 'Sàn trừ thẳng vào Ví quán chị 28% mỗi đơn đó em, quán cũng bị bóc lột chẳng kém gì shipper!', log: `📚 <strong>Kinh tế học Mác - Lênin:</strong> Tư bản nền tảng thu địa tô/thặng dư kép từ cả Tiểu chủ quán ăn (28%) lẫn Lao động shipper (${(g.platformCutRate * 100).toFixed(0)}%).` }) }
    ]
  },
  {
    question: 'Bếp đang đông khách quá, em chịu khó đợi 4 phút được không? Quán mời em ly trà đá mát lạnh nè!',
    options: [
      { text: '🥤 Dạ em đợi được, cảm ơn quán mời nước ạ (+12% thể lực)', effect: () => ({ energy: 12, rating: 0.03, reply: 'Uống miếng nước cho đỡ khát, món của em xong rồi đây!', log: '☕ Chủ quán mời trà đá trong lúc chờ bếp: +12% thể lực. Tình tương thân tương ái giữa người lao động.' }) },
      { text: '⏱️ Hối bếp làm nhanh vì sợ thuật toán phạt trễ giờ', effect: () => ({ energy: -4, reply: 'Bếp ráng hết sức rồi, của em đây nha!', log: '⏳ Áp lực thời gian của thuật toán biến thành căng thẳng giữa tài xế và nhân viên quán.' }) }
    ]
  },
  {
    question: 'Đơn này khách chọn Thanh Toán Tiền Mặt, em ứng Ví Shipper 80k trước cho quán nhé?',
    options: [
      { text: '💳 Quẹt Ví Shipper ứng tiền nhận đơn ngay', effect: () => ({ energy: -2, rating: 0.03, reply: 'Đã nhận đủ tiền ứng qua Ví! Em giao tới nơi thu lại của khách nhé.', log: '💳 <strong>Cơ chế Ship Ví:</strong> Tài xế phải nạp tiền sẵn vào Ví Tài Xế để ứng vốn lưu động cho nền tảng và quán.' }) },
      { text: '🔍 Kiểm tra kỹ hóa đơn trước khi ứng tiền Ví', effect: () => ({ energy: -3, rating: 0.05, reply: 'Hóa đơn chuẩn 100% nha em, cảm ơn em cẩn thận!', log: '🧾 Kiểm tra kỹ hóa đơn ứng Ví, tránh rủi ro khách bùng hàng.' }) }
    ]
  }
];

// --- ROLE 2: NGƯỜI ĐẶT HÀNG (KHÁCH HÀNG) TẠI CÁC ĐIỂM GIAO ---
const CUSTOMER_NPCS = {
  university: { name: 'Bạn Minh (Sinh Viên KTX)', role: 'Role Khách Sinh Viên · Khu 1 Đại Học', avatar: '🧑‍🎓', color: '#3b82f6' },
  hospital:   { name: 'Bác Sĩ Lan & Người Nhà BN', role: 'Role Khách Bệnh Viện · Khu 5 Y Tế', avatar: '👩‍⚕️', color: '#f43f5e' },
  customerA:  { name: 'Chị Hương (Nhà Phố Khu Dân Cư)', role: 'Role Khách Gia Đình · Khu 4 Dân Cư', avatar: '🙋‍♀️', color: '#06b6d4' },
  customerB:  { name: 'Anh Hoàng (Chung Cư Cao Cấp B)', role: 'Role Khách Chung Cư · Khu 5 Công Nghệ', avatar: '🧑‍💼', color: '#8b5cf6' }
};

const CUSTOMER_DIALOGS = [
  {
    question: 'Cảm ơn shipper nha! Trời nắng/mưa cực quá, mình gửi tặng thêm 15k tiền tip vào Ví cho bạn uống nước nhé!',
    options: [
      { text: '🙏 Dạ em cảm ơn anh/chị rất nhiều! Chúc ngon miệng ạ!', effect: () => ({ tip: 15, rating: 0.05, reply: 'Mình vừa bấm đánh giá 5 sao trên App cho bạn luôn rồi đó!', log: '💵 <strong>Khách hàng boa thêm +15k:</strong> Khoản tiền thưởng trực tiếp 100% vào Ví mà thuật toán không thể cắt phế!' }) },
      { text: '😊 Em xin nhận ạ, nhờ anh/chị cho em xin 5 sao trên App nhé!', effect: () => ({ tip: 15, rating: 0.08, reply: 'Ok liền, 5 sao full điểm nhiệt tình nha!', log: '⭐ Nhận +15k tiền tip và đánh giá 5 sao tuyệt đối từ khách hàng!' }) }
    ]
  },
  {
    question: 'Ủa bạn ơi, sao giao tới hơi lâu vậy? Mình đặt nãy giờ bụng đói meo luôn rồi!',
    options: [
      { text: '🙏 Dạ nãy quán đông với kẹt đèn đỏ, mong anh/chị thông cảm giúp em ạ', effect: () => ({ energy: -3, rating: 0.02, reply: 'À ra vậy, thôi mình thông cảm, lần sau nhớ báo mình tiếng nha!', log: '🗣️ Lao động cảm xúc (Emotional Labor): Shipper phải nhẫn nhịn xin lỗi dù lỗi do quán đông hoặc tắc đường.' }) },
      { text: '📱 Dạ do App ghép đơn tự động nên em phải vòng qua 2 điểm ạ', effect: () => ({ rating: -0.05, reply: 'App ghép đơn kỳ vậy làm đồ ăn nguội bớt... Thôi mình nhận hàng nha.', log: '⚠️ Thuật toán ghép đơn để tối đa hóa m cho sàn, nhưng khách hàng lại trút sự không hài lòng lên điểm sao của tài xế.' }) }
    ]
  },
  {
    question: 'Mình đang bận họp trên lầu, bạn gửi bảo vệ hoặc treo ở kệ nhận hàng rồi bấm hoàn tất nhận tiền Ví nhé!',
    options: [
      { text: '📸 Đặt ngay ngắn lên kệ & chụp ảnh xác nhận qua App Shipper', effect: () => ({ energy: -2, rating: 0.04, reply: 'Đã thấy ảnh xác nhận trên App! Tiền đã nổ về Ví bạn nhé!', log: '📸 Chụp ảnh giao hàng không chạm chuẩn quy trình App Shipper (+0.04 ⭐).' }) },
      { text: '🏃 Mang tận nơi lên sảnh gửi bảo vệ ký nhận giúp khách', effect: () => ({ energy: -5, tip: 10, rating: 0.06, reply: 'Chu đáo quá, mình tip thêm 10k qua Ví cảm ơn bạn nha!', log: '💪 Chịu khó đi bộ gửi tận sảnh: tốn thêm 5% thể lực nhưng được khách tip +10k!' }) }
    ]
  }
];

// --- DANH SÁCH 5 KHU VỰC & CHỨC NĂNG RIÊNG CỦA TỪNG ROLE ---
const ZONE_ROLES_INFO = [
  { id: 'zone1', title: 'Khu 1: Phố Ẩm Thực & ĐH', role: '👩‍🍳 Chủ Quán & 🧑‍🎓 Sinh Viên', desc: 'Lấy đơn Cơm/Phở tại Quán Cô Ba, hoặc giao đồ ăn cho sinh viên KTX Đại Học.', targetKey: 'restaurant', color: '#f59e0b' },
  { id: 'zone2', title: 'Khu 2: Ăn Vặt & Hạ Tầng Xe', role: '🧑‍🍳 Pha Chế & ⛽ Thợ Máy', desc: 'Lấy Trà Sữa/Pizza, hoặc ghé Trạm Xăng & Kho Sạc để đổ xăng, bảo dưỡng xe (trả c).', targetKey: 'gasStation', color: '#ec4899' },
  { id: 'zone3', title: 'Khu 3: Lao Động & Công Đoàn', role: '☕ Trà Đá, 🚨 CSGT & 🤝 Công Đoàn', desc: 'Uống trà đá hồi máu miễn phí, cẩn thận Chốt CSGT phạt đèn đỏ, ghé Hội Quán hồi 5⭐.', targetKey: 'unionHub', color: '#10b981' },
  { id: 'zone4', title: 'Khu 4: Công Viên & Dân Cư', role: '🏪 Tiện Lợi 24h & 🙋‍♀️ Khách Nhà Phố', desc: 'Ghé Công Viên/Tiện Lợi 24h nạp tăng lực, giao đơn tận nhà cho Khách Hàng A.', targetKey: 'customerA', color: '#22c55e' },
  { id: 'zone5', title: 'Khu 5: Đô Thị Công Nghệ Cao', role: '🏢 Chủ Sàn AI, 🏥 Y Tế & 🧑‍💼 Chung Cư', desc: 'Trụ sở AI Platform rút giá trị thặng dư m, giao đơn Bệnh Viện & Chung Cư B.', targetKey: 'platformHQ', color: '#8b5cf6' }
];

export default function GigEconomy2D() {
  const canvasRef = useRef(null);

  // --- TRẠNG THÁI APP SHIPPER & VÍ TÀI XẾ ---
  const [appOnline, setAppOnline] = useState(true); // Bật App / Tắt App
  const [incomingOrder, setIncomingOrder] = useState(null); // Đơn hàng đang kêu "Ting ting" chờ Nhận/Từ chối
  const [walletDeposit, setWalletDeposit] = useState(200); // Ví Ký Quỹ / Ví Trên để nhận đơn ứng tiền

  // --- TRẠNG THÁI TÀI XẾ (LAO ĐỘNG) ---
  const [energy, setEnergy] = useState(100);
  const [driverWage, setDriverWage] = useState(85); // Ví Tiền Mặt / Thu nhập thực nhận (khởi điểm 85k để dễ trải nghiệm)
  const [driverCost, setDriverCost] = useState(0); // c đã chi trả tại trạm xăng
  const [completedOrders, setCompletedOrders] = useState(0);
  const [rating, setRating] = useState(4.95);
  const [acceptanceRate, setAcceptanceRate] = useState(96);
  const [tier, setTier] = useState('Vàng');
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
    vehicleCost: 24,
    shopKey: 'restaurant',
    shopLabel: 'Quán Cơm Phở',
    custKey: 'customerA',
    custLabel: 'Nhà Khách Hàng A'
  });

  // --- BIẾN ĐỘNG THỊ TRƯỜNG & CHI PHÍ ---
  const [gasCrisis, setGasCrisis] = useState(false);
  const [isBatchedOrder, setIsBatchedOrder] = useState(false);
  const [isStrike, setIsStrike] = useState(false);
  const [isNight, setIsNight] = useState(false);
  const [weather, setWeather] = useState('clear');
  const [autoDispatch, setAutoDispatch] = useState(false);

  const [hasFood, setHasFood] = useState(false);
  // missionState: 'idle' | 'ringing' | 'to_restaurant' | 'at_shop' | 'picking_up' | 'to_customer' | 'at_customer'
  const [missionState, setMissionState] = useState('idle');
  const [shopDialog, setShopDialog] = useState(null); // Hội thoại tại quán
  const [customerDialog, setCustomerDialog] = useState(null); // Hội thoại tại điểm giao hàng
  const [activeZoneTab, setActiveZoneTab] = useState(null);

  const [logList, setLogList] = useState([
    '📱 <strong>CƠ CHẾ APP SHIP VÍ:</strong> Bật App Online → Nổ đơn ngẫu nhiên → Bấm [Nhận Đơn] → Chạy theo GPS tới Quán gặp Chủ Quán → Chạy tới địa chỉ Khách giao hàng & nhận tiền vào Ví!',
    '🗺️ Mỗi Khu vực & Role (Chủ quán, Khách hàng, CSGT, Công đoàn, Trạm xăng, Trà đá) đều có chức năng tương tác riêng.'
  ]);

  // Phân tích dòng tiền đơn hiện tại W = c + v + m
  const displayOrder = incomingOrder || currentOrder;
  const currentPrice = displayOrder.price;
  const currentCost = displayOrder.vehicleCost;
  const currentSurplusM = currentPrice * platformCutRate;
  const currentWageV = Math.max(0, currentPrice - currentSurplusM - currentCost);
  const surplusRate = currentWageV > 0 ? ((currentSurplusM / currentWageV) * 100).toFixed(1) : '∞';

  const gameRef = useRef({
    appOnline: true,
    walletDeposit: 200,
    energy: 100,
    driverWage: 85,
    driverCost: 0,
    completedOrders: 0,
    rating: 4.95,
    acceptanceRate: 96,
    bikeHealth: 100,
    platformCutRate: 0.25,
    surplusM: 0,
    algoSpeed: 1.0,
    algoLevel: 1,
    currentOrder: { name: '🍛 Cơm Tấm', distance: 4.8, price: 85, vehicleCost: 24, shopKey: 'restaurant', custKey: 'customerA' },
    gasCrisis: false,
    weather: 'clear',
    isNight: false,
    autoDispatch: false,
    isStrike: false,
    isBatchedOrder: false,
    missionState: 'idle',
    targetPrice: 85,
    targetCost: 24,
    targetDrain: 12,
    hasFood: false
  });

  useEffect(() => {
    gameRef.current = {
      ...gameRef.current,
      appOnline,
      walletDeposit,
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
  }, [appOnline, walletDeposit, energy, driverWage, driverCost, completedOrders, rating, acceptanceRate, bikeHealth, platformCutRate, surplusM, algoSpeed, algoLevel, currentOrder, gasCrisis, weather, isNight, autoDispatch, isStrike, isBatchedOrder, missionState, hasFood]);

  const addLog = (msg) => {
    setLogList(prev => [msg, ...prev.slice(0, 5)]);
  };

  const SHOP_LABELS = {
    restaurant: 'Quán Cơm Phở (Khu 1)',
    milkTeaShop: 'Trà Sữa & Bánh Mì (Khu 2)',
    pizzaShop: 'Pizza & Fastfood (Khu 2 Nam)'
  };

  const CUST_LABELS = {
    university: 'Đại Học & KTX (Khu 1 Nam)',
    hospital: 'Bệnh Viện Đa Khoa (Khu 5)',
    customerA: 'Nhà Khách Hàng A (Khu 4)',
    customerB: 'Chung Cư Khách B (Khu 5 Nam)'
  };

  const generateRandomOrder = (isNightShift = false, isBatched = false) => {
    const template = RANDOM_ORDER_TYPES[Math.floor(Math.random() * RANDOM_ORDER_TYPES.length)];
    const distNoise = +(Math.random() * 1.5 - 0.75).toFixed(1);
    const finalDist = Math.max(1.2, +(template.baseDist + distNoise).toFixed(1));

    let randomPrice = Math.floor(Math.random() * (template.maxPrice - template.minPrice + 1)) + template.minPrice;
    if (isNightShift) randomPrice = Math.round(randomPrice * 1.25);
    if (isBatched) randomPrice = Math.round(randomPrice * 1.7);

    let cost = Math.round(randomPrice * (0.26 + Math.random() * 0.05));
    if (gameRef.current.gasCrisis) cost = Math.round(cost * 1.4);

    const shopKey = template.shopKey;
    const custKey = isBatched ? 'customerB' : template.custKeys[Math.floor(Math.random() * template.custKeys.length)];

    return {
      name: isBatched ? `[Ghép 2 Đơn] ${template.name}` : template.name,
      distance: isBatched ? +(finalDist * 1.45).toFixed(1) : finalDist,
      price: randomPrice,
      vehicleCost: cost,
      shopKey,
      shopLabel: SHOP_LABELS[shopKey],
      custKey,
      custLabel: CUST_LABELS[custKey],
      isNightShift
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
      } else if (type === 'ring') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(784, now);
        osc.frequency.setValueAtTime(987.77, now + 0.12);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
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
      // --- HÀNG 1 (BẮC, Y: 30) - KHU ẨM THỰC & QUYỀN LỰC THUẬT TOÁN ---
      restaurant:   { x: 25,  y: 30,  w: 120, h: 75, emoji: '🍜', label: 'Quán Cơm Phở', color: '#f59e0b', sub: '👩‍🍳 Role Chủ Quán' },
      milkTeaShop:  { x: 220, y: 30,  w: 115, h: 75, emoji: '🧋', label: 'Trà Sữa & Bánh Mì', color: '#ec4899', sub: '🧑‍🍳 Role Pha Chế' },
      teaStall:     { x: 410, y: 30,  w: 115, h: 75, emoji: '☕', label: 'Quán Trà Đá', color: '#10b981', sub: 'Miễn phí +Thể lực' },
      park:         { x: 600, y: 30,  w: 115, h: 75, emoji: '🌳', label: 'Công Viên Shipper', color: '#22c55e', sub: 'Nghỉ trưa hồi sức' },
      platformHQ:   { x: 790, y: 22,  w: 125, h: 83, emoji: '🏢', label: 'AI Platform (m)', color: '#8b5cf6', sub: 'Trụ sở tư bản số' },

      // --- HÀNG 2 (TRUNG TÂM, Y: 235) - HẠ TẦNG, BẢO DƯỠNG & TIỆN ÍCH ---
      gasStation:   { x: 25,  y: 235, w: 120, h: 75, emoji: '⛽', label: 'Trạm Xe/Xăng', color: '#d97706', sub: 'Đổ xăng/Sửa xe (c)' },
      logisticsHub: { x: 220, y: 235, w: 115, h: 75, emoji: '📦', label: 'Kho Sàn & Sạc Điện', color: '#ea580c', sub: 'Trạm bảo dưỡng xe' },
      policePoint:  { x: 410, y: 235, w: 115, h: 75, emoji: '🚨', label: 'Chốt CSGT & Đèn Đỏ', color: '#ef4444', sub: 'Role CSGT tuần tra' },
      convenience:  { x: 600, y: 235, w: 115, h: 75, emoji: '🏪', label: 'Tiện Lợi 24h', color: '#06b6d4', sub: 'Bò Húc siêu hồi sức' },
      hospital:     { x: 790, y: 235, w: 125, h: 75, emoji: '🏥', label: 'Bệnh Viện Đa Khoa', color: '#f43f5e', sub: '👩‍⚕️ Khách Y Tế/BN' },

      // --- HÀNG 3 (NAM, Y: 445) - ĐÔ THỊ DÂN CƯ, CÔNG ĐOÀN & GIAO HÀNG ---
      university:   { x: 25,  y: 445, w: 120, h: 75, emoji: '🏫', label: 'Đại Học & KTX', color: '#3b82f6', sub: '🧑‍🎓 Khách Sinh Viên' },
      pizzaShop:    { x: 220, y: 445, w: 115, h: 75, emoji: '🍕', label: 'Pizza & Fastfood', color: '#f97316', sub: '👨‍🍳 Quản Lý Quán' },
      unionHub:     { x: 410, y: 445, w: 115, h: 75, emoji: '🤝', label: 'Hội Quán Shipper', color: '#10b981', sub: 'Role Công Đoàn 5⭐' },
      customerA:    { x: 600, y: 445, w: 115, h: 75, emoji: '🏠', label: 'Nhà Khách Hàng A', color: '#06b6d4', sub: '🙋‍♀️ Khách Gia Đình' },
      customerB:    { x: 790, y: 445, w: 125, h: 75, emoji: '🏢', label: 'Chung Cư Khách B', color: '#8b5cf6', sub: '🧑‍💼 Khách Chung Cư' }
    };
    gameRef.current.map = map;

    // 6 shipper đồng nghiệp AI tuần tra khắp 2 đại lộ ngang & các trục dọc
    const aiShippers = [
      { x: 80,  y: 155, vx: 2.2, vy: 0, color: '#22c55e', brand: 'Grab' },
      { x: 850, y: 175, vx: -2.0, vy: 0, color: '#f97316', brand: 'Shopee' },
      { x: 100, y: 370, vx: 2.1, vy: 0, color: '#eab308', brand: 'Be' },
      { x: 820, y: 390, vx: -2.3, vy: 0, color: '#ef4444', brand: 'Baemin' },
      { x: 375, y: 60,  vx: 0, vy: 1.8, color: '#06b6d4', brand: 'Ahamove' },
      { x: 565, y: 500, vx: 0, vy: -1.9, color: '#10b981', brand: 'Gojek' }
    ];

    // Người đi bộ qua đường (Pedestrians)
    const pedestrians = [
      { x: 185, y: 120, vy: 0.6, miny: 105, maxy: 200 },
      { x: 755, y: 190, vy: -0.5, miny: 110, maxy: 205 },
      { x: 375, y: 335, vy: 0.6, miny: 320, maxy: 415 },
      { x: 565, y: 405, vy: -0.5, miny: 325, maxy: 420 }
    ];

    const bike = {
      x: 470, y: 270,
      targetX: 470, targetY: 270,
      angle: 0, speed: 3.8
    };
    gameRef.current.bike = bike;

    let particles = [];
    let rainDrops = [];
    let healingParticles = [];
    let lastHealSoundTime = 0;
    let lastPoliceTime = 0;
    let lastRepairTime = 0;
    let lastUnionTime = 0;
    let lastHQTime = 0;

    for (let i = 0; i < 110; i++) {
      rainDrops.push({ x: Math.random() * 850, y: Math.random() * 560, len: 10 + Math.random() * 12, speed: 9 + Math.random() * 5 });
    }

    const spawnDeliveryCash = (startX, startY, orderPriceVal, tipVal = 0) => {
      playSound('coin');
      const mVal = orderPriceVal * gameRef.current.platformCutRate;
      const driverGross = orderPriceVal - mVal + tipVal;

      // Tiền nhận liền tay bay về phía Ví tài xế
      for (let i = 0; i < 7; i++) {
        particles.push({
          x: startX, y: startY,
          targetX: 80, targetY: 15,
          color: '#10b981', text: i === 0 ? `+${driverGross.toFixed(0)}k vào Ví Shipper` : null,
          progress: 0, speed: 0.025 + Math.random() * 0.015
        });
      }
      // Tiền thặng dư sàn cắt bay về phía trụ sở AI Platform
      for (let i = 0; i < 7; i++) {
        particles.push({
          x: startX, y: startY,
          targetX: map.platformHQ.x + 50, targetY: map.platformHQ.y + 20,
          color: '#8b5cf6', text: i === 0 ? `-${mVal.toFixed(0)}k (Sàn thu m)` : null,
          progress: 0, speed: 0.02 + Math.random() * 0.015
        });
      }
    };

    const spawnRepairCash = (startX, startY, repairCost) => {
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

    // Chức năng di chuyển tới bất kỳ địa điểm nào trên bản đồ
    window.__driveToLandmark = (key) => {
      const lm = map[key];
      if (!lm) return;
      bike.targetX = lm.x + Math.round(lm.w / 2);
      bike.targetY = lm.y + Math.round(lm.h / 2);
      addLog(`🛵 Đang điều hướng xe chạy tới <strong>${lm.emoji} ${lm.label}</strong> (${lm.sub})...`);
    };

    const onCanvasClick = (e) => {
      if (gameRef.current.isStrike) {
        addLog('⚠️ Tài xế đang đình công! Hãy bấm "Dừng bãi công" để mở lại ứng dụng.');
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      // Kiểm tra xem người chơi có click vào tòa nhà nào trong 15 tòa nhà không
      for (const [key, lm] of Object.entries(map)) {
        if (cx >= lm.x && cx <= lm.x + lm.w && cy >= lm.y && cy <= lm.y + lm.h) {
          bike.targetX = lm.x + Math.round(lm.w / 2);
          bike.targetY = lm.y + Math.round(lm.h / 2);
          // Nếu đang rảnh và click vào quán ăn -> nổ đơn luôn tại quán đó
          if (['restaurant', 'milkTeaShop', 'pizzaShop'].includes(key) && gameRef.current.missionState === 'idle') {
            window.__ringOrder(false, key);
          } else {
            addLog(`📍 Đang lái xe tới <strong>${lm.emoji} ${lm.label}</strong> (${lm.sub})...`);
          }
          return;
        }
      }

      bike.targetX = cx;
      bike.targetY = cy;
    };
    canvas.addEventListener('click', onCanvasClick);

    // --- BƯỚC 0: NỔ ĐƠN NGẪU NHIÊN TRÊN APP SHIPPER (CHỜ NHẬN ĐƠN HOẶC NHẬN NGAY) ---
    window.__ringOrder = (isNightShift = false, forcedShopKey = null) => {
      if (gameRef.current.isStrike) {
        addLog('✊ Tài xế đang đình công tắt app! Nền tảng bị tê liệt hoàn toàn.');
        return;
      }
      if (!gameRef.current.appOnline) {
        addLog('📴 Bạn đang TẮT APP (Offline)! Hãy gạt nút "BẬT APP" trên điện thoại để nhận đơn mới.');
        return;
      }
      if (gameRef.current.energy < (isNightShift ? 15 : 10)) {
        addLog('🛑 Tài xế kiệt sức! Hãy ghé Quán Trà Đá ☕, Công Viên 🌳 hoặc Tiện Lợi 24h 🏪 để hồi phục.');
        return;
      }
      if (gameRef.current.bikeHealth <= 15) {
        addLog('🛠️ Xe máy hỏng hóc nặng! Cần ghé Trạm Xe ⛽ để bảo dưỡng trước khi chạy tiếp.');
        return;
      }

      const newOrder = generateRandomOrder(isNightShift, gameRef.current.isBatchedOrder);
      if (forcedShopKey && map[forcedShopKey]) {
        newOrder.shopKey = forcedShopKey;
        newOrder.shopLabel = SHOP_LABELS[forcedShopKey];
      }

      playSound('ring');
      setIncomingOrder(newOrder);
      gameRef.current.incomingOrder = newOrder;
      gameRef.current.missionState = 'ringing';
      setMissionState('ringing');

      addLog(`📲 <strong>TING TING! App nổ đơn mới:</strong> ${newOrder.name} (${newOrder.distance} km) • Lấy tại <strong>${newOrder.shopLabel}</strong> → Giao tới <strong>${newOrder.custLabel}</strong>. Bấm <strong>[Nhận Đơn]</strong> trên App!`);

      // Nếu đang bật Tự Động Ép Cuốc của thuật toán -> Tự nhận đơn sau 1.2 giây
      clearTimeout(gameRef.current.ringTimer);
      if (gameRef.current.autoDispatch) {
        gameRef.current.ringTimer = setTimeout(() => {
          if (window.__acceptIncomingOrder) window.__acceptIncomingOrder(newOrder);
        }, 1200);
      }
    };

    // Giữ tương thích với các nút bấm nổ đơn nhanh
    window.__dispatchOrder = (isNightShift = false) => {
      window.__ringOrder(isNightShift, null);
    };

    // --- BƯỚC 1: TÀI XẾ BẤM "NHẬN ĐƠN" TRÊN APP -> BẮT ĐẦU CHẠY TỚI ĐỊA CHỈ QUÁN ---
    window.__acceptIncomingOrder = (orderOverride = null) => {
      const ord = orderOverride || gameRef.current.incomingOrder;
      if (!ord) return;
      clearTimeout(gameRef.current.ringTimer);

      setCurrentOrder(ord);
      setIncomingOrder(null);
      gameRef.current.incomingOrder = null;
      gameRef.current.currentOrder = ord;

      gameRef.current.targetPrice = ord.price;
      gameRef.current.targetCost = ord.vehicleCost;
      gameRef.current.targetDrain = Math.round((ord.distance * 2.0 + (ord.isNightShift ? 8 : 0)) * gameRef.current.algoSpeed);
      if (gameRef.current.weather === 'rain') gameRef.current.targetDrain += 4;
      if (gameRef.current.weather === 'storm') gameRef.current.targetDrain += 8;

      const pickShop = map[ord.shopKey] || map.restaurant;
      const dropSpot = map[ord.custKey] || map.customerA;
      gameRef.current.targetShop = pickShop;
      gameRef.current.targetCustomer = dropSpot;

      gameRef.current.missionState = 'to_restaurant';
      setMissionState('to_restaurant');
      bike.targetX = pickShop.x + 60;
      bike.targetY = pickShop.y + 40;
      bike.hasFood = false;
      setHasFood(false);

      addLog(`✅ <strong>Đã nhận đơn trên App!</strong> Lộ trình GPS Bước 1/2: Đang chạy tới <strong>${pickShop.emoji} ${pickShop.label}</strong> để lấy món...`);
    };

    // --- TỪ CHỐI ĐƠN TRÊN APP -> TRỪ % NHẬN ĐƠN ---
    window.__declineIncomingOrder = () => {
      clearTimeout(gameRef.current.ringTimer);
      setIncomingOrder(null);
      gameRef.current.incomingOrder = null;
      gameRef.current.missionState = 'idle';
      setMissionState('idle');
      setAcceptanceRate(r => Math.max(50, r - 5));
      addLog(`❌ <strong>Đã từ chối đơn:</strong> Thuật toán cảnh cáo và trừ -5% Tỷ lệ nhận đơn! (Nếu xuống thấp sẽ bị khóa tài khoản).`);
    };

    // --- BƯỚC 2: TỚI QUÁN GẶP CHỦ QUÁN -> NHẬN MÓN XONG -> CHẠY ĐI GIAO CHO KHÁCH ---
    const finishPickup = () => {
      gameRef.current.missionState = 'to_customer';
      setMissionState('to_customer');
      bike.hasFood = true;
      setHasFood(true);
      const drop = gameRef.current.targetCustomer || map.customerA;
      bike.targetX = drop.x + 60;
      bike.targetY = drop.y + 40;
      addLog(`📦 <strong>Đã nhận món tại quán!</strong> Lộ trình GPS Bước 2/2: Phóng xe tới địa chỉ người đặt tại <strong>${drop.emoji} ${drop.label}</strong>!`);
    };

    const openShopDialog = () => {
      if (gameRef.current.missionState !== 'to_restaurant') return;
      gameRef.current.missionState = 'at_shop';
      setMissionState('at_shop');
      const shop = gameRef.current.targetShop || map.restaurant;
      const shopKey = Object.keys(map).find(k => map[k] === shop) || 'restaurant';
      const npc = SHOP_NPCS[shopKey] || SHOP_NPCS.restaurant;
      const dlg = SHOP_DIALOGS[Math.floor(Math.random() * SHOP_DIALOGS.length)];
      setShopDialog({ npc, shopLabel: shop.label, question: dlg.question, options: dlg.options, reply: null });
      playSound('heal');

      clearTimeout(gameRef.current.dialogTimer);
      if (gameRef.current.autoDispatch) {
        gameRef.current.dialogTimer = setTimeout(() => window.__resolveShopDialog(dlg.options[0]), 2600);
      }
    };

    window.__resolveShopDialog = (opt) => {
      if (gameRef.current.missionState !== 'at_shop') return;
      clearTimeout(gameRef.current.dialogTimer);
      const fx = opt.effect(gameRef.current) || {};
      if (fx.energy) {
        const e = Math.max(0, Math.min(100, gameRef.current.energy + fx.energy));
        gameRef.current.energy = e;
        setEnergy(e);
      }
      if (fx.wage) {
        gameRef.current.driverWage += fx.wage;
        setDriverWage(w => w + fx.wage);
      }
      if (fx.rating) setRating(r => Math.max(3.5, Math.min(5.0, +(r + fx.rating).toFixed(2))));
      if (fx.log) addLog(fx.log);
      setShopDialog(d => d ? { ...d, reply: fx.reply || 'Đây món của em nè!', options: [] } : d);
      gameRef.current.missionState = 'picking_up';
      setMissionState('picking_up');
      setTimeout(() => {
        setShopDialog(null);
        finishPickup();
      }, 1100);
    };

    // --- BƯỚC 3: TỚI ĐỊA CHỈ NGƯỜI ĐẶT -> KHÁCH HÀNG RA NHẬN ĐƠN & CỘNG TIỀN VÍ ---
    const openCustomerDialog = () => {
      if (gameRef.current.missionState !== 'to_customer') return;
      gameRef.current.missionState = 'at_customer';
      setMissionState('at_customer');
      const custSpot = gameRef.current.targetCustomer || map.customerA;
      const custKey = Object.keys(map).find(k => map[k] === custSpot) || 'customerA';
      const npc = CUSTOMER_NPCS[custKey] || CUSTOMER_NPCS.customerA;
      const dlg = CUSTOMER_DIALOGS[Math.floor(Math.random() * CUSTOMER_DIALOGS.length)];
      setCustomerDialog({ npc, custLabel: custSpot.label, question: dlg.question, options: dlg.options, reply: null });
      playSound('heal');

      clearTimeout(gameRef.current.custTimer);
      if (gameRef.current.autoDispatch) {
        gameRef.current.custTimer = setTimeout(() => window.__resolveCustomerDialog(dlg.options[0]), 2600);
      }
    };

    const completeOrderPayout = (tipBonus = 0) => {
      gameRef.current.missionState = 'idle';
      setMissionState('idle');
      bike.hasFood = false;
      setHasFood(false);

      const finalPrice = gameRef.current.targetPrice;
      const m = finalPrice * gameRef.current.platformCutRate;
      const driverGross = finalPrice - m + tipBonus; // Tiền về Ví Tài Xế ngay lập tức (chưa trừ xăng c)

      const nextEnergy = Math.max(0, gameRef.current.energy - gameRef.current.targetDrain);
      const nextWage = gameRef.current.driverWage + driverGross;
      const nextSurplus = gameRef.current.surplusM + m;
      const nextOrders = gameRef.current.completedOrders + (gameRef.current.isBatchedOrder ? 2 : 1);

      const wear = Math.min(24, Math.round(5 + (gameRef.current.currentOrder.distance || 3) * 1.4));
      const nextHealth = Math.max(0, gameRef.current.bikeHealth - wear);

      gameRef.current.energy = nextEnergy;
      gameRef.current.driverWage = nextWage;
      gameRef.current.surplusM = nextSurplus;
      gameRef.current.completedOrders = nextOrders;
      gameRef.current.bikeHealth = nextHealth;

      setEnergy(nextEnergy);
      setDriverWage(nextWage);
      setSurplusM(nextSurplus);
      setCompletedOrders(nextOrders);
      setBikeHealth(nextHealth);

      // Thưởng mốc 10 đơn
      setQuestOrders(q => {
        const n = q + (gameRef.current.isBatchedOrder ? 2 : 1);
        if (n >= 10) {
          if (Math.random() < 0.65) {
            addLog('🎉 <strong>Thưởng mốc 10 đơn:</strong> Sàn cộng +150k tiền thưởng chuyên cần vào Ví!');
            setDriverWage(w => w + 150);
          } else {
            addLog('⚠️ <strong>Thuật toán bóp thưởng mốc:</strong> Cuốc thứ 10 bị hệ thống báo lỗi GPS sát 23h59! Mất thưởng 150k.');
          }
          return 0;
        }
        return n;
      });

      spawnDeliveryCash(bike.x, bike.y, finalPrice, tipBonus);
      addLog(`💰 <strong>Hoàn tất giao hàng!</strong> Khách trả ${finalPrice}k → Sàn thu chiết khấu <strong>-${m.toFixed(0)}k (m)</strong> → Ví Shipper cộng liền <strong>+${driverGross.toFixed(0)}k</strong>${tipBonus > 0 ? ` (gồm ${tipBonus}k tip)` : ''}! Độ bền xe còn ${nextHealth}%.`);

      if (nextHealth <= 25) {
        addLog(`⚠️ <strong>Xe báo bảo dưỡng (${nextHealth}%):</strong> Hãy lái xe ghé ⛽ Trạm Xăng hoặc 📦 Kho Sạc để đổ xăng/sửa xe!`);
      }

      if (gameRef.current.autoDispatch && gameRef.current.appOnline && nextEnergy >= 10 && nextHealth > 15) {
        setTimeout(() => {
          if (window.__ringOrder) window.__ringOrder(false);
        }, 1000);
      }
    };

    window.__resolveCustomerDialog = (opt) => {
      if (gameRef.current.missionState !== 'at_customer') return;
      clearTimeout(gameRef.current.custTimer);
      const fx = opt.effect(gameRef.current) || {};
      if (fx.energy) {
        const e = Math.max(0, Math.min(100, gameRef.current.energy + fx.energy));
        gameRef.current.energy = e;
        setEnergy(e);
      }
      if (fx.rating) setRating(r => Math.max(3.5, Math.min(5.0, +(r + fx.rating).toFixed(2))));
      if (fx.log) addLog(fx.log);
      const tipBonus = fx.tip || 0;
      setCustomerDialog(d => d ? { ...d, reply: fx.reply || 'Cảm ơn shipper nhiều nha!', options: [] } : d);
      setTimeout(() => {
        setCustomerDialog(null);
        completeOrderPayout(tipBonus);
      }, 1000);
    };

    window.__restDriver = () => {
      bike.targetX = map.teaStall.x + 60;
      bike.targetY = map.teaStall.y + 40;
      addLog('☕ Đang di chuyển đến Quán Trà Đá để nghỉ ngơi hồi phục thể lực miễn phí.');
    };

    window.__repairBike = () => {
      bike.targetX = map.gasStation.x + 50;
      bike.targetY = map.gasStation.y + 35;
      addLog('🔧 Đang di chuyển vào Trạm Xe/Xăng để đổ xăng & bảo dưỡng xe.');
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

      // --- 5 KHU VỰC ĐÔ THỊ ĐẶC TRƯNG ---
      ctx.fillStyle = 'rgba(245, 158, 11, 0.05)';
      ctx.fillRect(10, 8, 150, h - 16);
      ctx.fillStyle = 'rgba(236, 72, 153, 0.05)';
      ctx.fillRect(205, 8, 145, h - 16);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.05)';
      ctx.fillRect(395, 8, 145, h - 16);
      ctx.fillStyle = 'rgba(34, 197, 94, 0.05)';
      ctx.fillRect(585, 8, 145, h - 16);
      ctx.fillStyle = 'rgba(139, 92, 246, 0.05)';
      ctx.fillRect(775, 8, Math.max(150, w - 785), h - 16);

      // Tên các khu vực (Subtle Headers)
      ctx.font = 'bold 9px system-ui';
      ctx.fillStyle = '#f59e0b99'; ctx.textAlign = 'center'; ctx.fillText('🍜 KHU 1: ẨM THỰC & ĐẠI HỌC', 85, 18);
      ctx.fillStyle = '#ec489999'; ctx.fillText('🧋 KHU 2: ĂN VẶT & TRẠM XE', 277, 18);
      ctx.fillStyle = '#10b98199'; ctx.fillText('☕ KHU 3: LAO ĐỘNG & CÔNG ĐOÀN', 467, 18);
      ctx.fillStyle = '#22c55e99'; ctx.fillText('🌳 KHU 4: CÔNG VIÊN & DÂN CƯ', 657, 18);
      ctx.fillStyle = '#a78bfa99'; ctx.fillText('🏢 KHU 5: ĐÔ THỊ CÔNG NGHỆ', 852, 18);

      // --- HỆ THỐNG ĐƯỜNG PHỐ & VỈA HÈ ---
      ctx.fillStyle = gameRef.current.isNight ? '#1e293b' : '#475569';
      ctx.fillRect(0, 115, w, 80);
      ctx.fillRect(0, 325, w, 80);
      ctx.fillRect(155, 0, 60, h);
      ctx.fillRect(345, 0, 60, h);
      ctx.fillRect(535, 0, 60, h);
      ctx.fillRect(725, 0, 60, h);

      ctx.fillStyle = gameRef.current.isNight ? '#0f172a' : '#334155';
      ctx.fillRect(0, 125, w, 60);
      ctx.fillRect(0, 335, w, 60);
      ctx.fillRect(160, 0, 50, h);
      ctx.fillRect(350, 0, 50, h);
      ctx.fillRect(540, 0, 50, h);
      ctx.fillRect(730, 0, 50, h);

      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 10]);
      ctx.beginPath(); ctx.moveTo(0, 155); ctx.lineTo(w, 155); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 365); ctx.lineTo(w, 365); ctx.stroke();

      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 8]);
      ctx.beginPath(); ctx.moveTo(185, 0); ctx.lineTo(185, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(375, 0); ctx.lineTo(375, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(565, 0); ctx.lineTo(565, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(755, 0); ctx.lineTo(755, h); ctx.stroke();
      ctx.setLineDash([]);

      [160, 350, 540, 730].forEach(cx => {
        drawCrosswalk(ctx, cx, 115, 50, 10, false);
        drawCrosswalk(ctx, cx, 185, 50, 10, false);
        drawCrosswalk(ctx, cx, 325, 50, 10, false);
        drawCrosswalk(ctx, cx, 395, 50, 10, false);
      });

      const treeLocs = [
        [18, 105], [142, 105], [212, 105], [338, 105], [402, 105], [528, 105], [592, 105], [718, 105], [782, 105], [920, 105],
        [18, 205], [142, 205], [212, 205], [338, 205], [402, 205], [528, 205], [592, 205], [718, 205], [782, 205], [920, 205],
        [18, 315], [142, 315], [212, 315], [338, 315], [402, 315], [528, 315], [592, 315], [718, 315], [782, 315], [920, 315],
        [18, 415], [142, 415], [212, 415], [338, 415], [402, 415], [528, 415], [592, 415], [718, 415], [782, 415], [920, 415],
        [18, 530], [142, 530], [212, 530], [338, 530], [402, 530], [528, 530], [592, 530], [718, 530], [782, 530], [920, 530]
      ];
      treeLocs.forEach(([tx, ty]) => drawTree(ctx, tx, ty));

      const tlState = Math.floor(Date.now() / 4000) % 3 === 0 ? 'green' : Math.floor(Date.now() / 4000) % 3 === 1 ? 'yellow' : 'red';
      const tlState2 = Math.floor(Date.now() / 4000 + 1) % 3 === 0 ? 'green' : Math.floor(Date.now() / 4000 + 1) % 3 === 1 ? 'yellow' : 'red';
      drawTrafficLight(ctx, 342, 122, tlState);
      drawTrafficLight(ctx, 532, 332, tlState2);

      pedestrians.forEach(p => {
        p.y += p.vy;
        if (p.y > p.maxy || p.y < p.miny) p.vy = -p.vy;
        drawPedestrian(ctx, p);
      });

      aiShippers.forEach(s => {
        s.x += s.vx;
        s.y += s.vy;
        if (s.x > w + 30) s.x = -30;
        if (s.x < -30) s.x = w + 30;
        if (s.y > h + 30) s.y = -30;
        if (s.y < -30) s.y = h + 30;
        drawAiShipper(ctx, s);
      });

      // --- VẼ 15 TÒA NHÀ & CÔNG TRÌNH ---
      drawLandmark(ctx, map.restaurant.x, map.restaurant.y, map.restaurant.w, map.restaurant.h, map.restaurant.emoji, map.restaurant.label, map.restaurant.color, map.restaurant.sub);
      drawLandmark(ctx, map.milkTeaShop.x, map.milkTeaShop.y, map.milkTeaShop.w, map.milkTeaShop.h, map.milkTeaShop.emoji, map.milkTeaShop.label, map.milkTeaShop.color, map.milkTeaShop.sub);
      drawLandmark(ctx, map.teaStall.x, map.teaStall.y, map.teaStall.w, map.teaStall.h, map.teaStall.emoji, map.teaStall.label, map.teaStall.color, map.teaStall.sub);
      drawLandmark(ctx, map.park.x, map.park.y, map.park.w, map.park.h, map.park.emoji, map.park.label, map.park.color, map.park.sub);
      drawTower(ctx, map.platformHQ.x, map.platformHQ.y, map.platformHQ.w, map.platformHQ.h, gameRef.current.algoLevel);

      drawLandmark(ctx, map.gasStation.x, map.gasStation.y, map.gasStation.w, map.gasStation.h, map.gasStation.emoji, map.gasStation.label, map.gasStation.color, map.gasStation.sub);
      drawLandmark(ctx, map.logisticsHub.x, map.logisticsHub.y, map.logisticsHub.w, map.logisticsHub.h, map.logisticsHub.emoji, map.logisticsHub.label, map.logisticsHub.color, map.logisticsHub.sub);
      drawLandmark(ctx, map.policePoint.x, map.policePoint.y, map.policePoint.w, map.policePoint.h, map.policePoint.emoji, map.policePoint.label, map.policePoint.color, map.policePoint.sub);
      drawLandmark(ctx, map.convenience.x, map.convenience.y, map.convenience.w, map.convenience.h, map.convenience.emoji, map.convenience.label, map.convenience.color, map.convenience.sub);
      drawLandmark(ctx, map.hospital.x, map.hospital.y, map.hospital.w, map.hospital.h, map.hospital.emoji, map.hospital.label, map.hospital.color, map.hospital.sub);

      drawLandmark(ctx, map.university.x, map.university.y, map.university.w, map.university.h, map.university.emoji, map.university.label, map.university.color, map.university.sub);
      drawLandmark(ctx, map.pizzaShop.x, map.pizzaShop.y, map.pizzaShop.w, map.pizzaShop.h, map.pizzaShop.emoji, map.pizzaShop.label, map.pizzaShop.color, map.pizzaShop.sub);
      drawLandmark(ctx, map.unionHub.x, map.unionHub.y, map.unionHub.w, map.unionHub.h, map.unionHub.emoji, map.unionHub.label, map.unionHub.color, map.unionHub.sub);
      drawLandmark(ctx, map.customerA.x, map.customerA.y, map.customerA.w, map.customerA.h, map.customerA.emoji, map.customerA.label, map.customerA.color, map.customerA.sub);
      drawLandmark(ctx, map.customerB.x, map.customerB.y, map.customerB.w, map.customerB.h, map.customerB.emoji, map.customerB.label, map.customerB.color, map.customerB.sub);

      // --- VẼ ĐƯỜNG DẪN ĐỊNH VỊ GPS TRÊN BẢN ĐỒ KHI ĐANG CHẠY ĐƠN ---
      if (gameRef.current.missionState === 'to_restaurant' && gameRef.current.targetShop) {
        const ts = gameRef.current.targetShop;
        const tx = ts.x + ts.w / 2;
        const ty = ts.y + ts.h / 2;
        drawGpsRoute(ctx, bike.x, bike.y, tx, ty, '#f59e0b', `📍 TỚI QUÁN LẤY MÓN: ${ts.label}`);
      } else if (gameRef.current.missionState === 'to_customer' && gameRef.current.targetCustomer) {
        const tc = gameRef.current.targetCustomer;
        const tx = tc.x + tc.w / 2;
        const ty = tc.y + tc.h / 2;
        drawGpsRoute(ctx, bike.x, bike.y, tx, ty, '#38bdf8', `🎯 GIAO CHO KHÁCH: ${tc.label}`);
      }

      // --- ĐIỀU KHIỂN & CHUYỂN ĐỘNG XE CỦA NGƯỜI CHƠI ---
      const inDialog = ['at_shop', 'picking_up', 'at_customer'].includes(gameRef.current.missionState);
      if (inDialog) {
        // Đứng yên tương tác với Chủ quán hoặc Khách hàng
      } else if (keys.w || keys.s || keys.a || keys.d) {
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
        } else {
          bike.angle = Math.atan2(dy, dx);
          bike.x += Math.cos(bike.angle) * autoSpd;
          bike.y += Math.sin(bike.angle) * autoSpd;
        }
      }

      // --- KIỂM TRA TỚI QUÁN LẤY ĐƠN (DÙ LÁI WASD HAY CLICK CHUỘT) ---
      const tShop = gameRef.current.targetShop;
      if (tShop && gameRef.current.missionState === 'to_restaurant' &&
          Math.hypot(bike.x - (tShop.x + 60), bike.y - (tShop.y + 40)) < 45) {
        openShopDialog();
      }

      // --- KIỂM TRA TỚI ĐỊA CHỈ KHÁCH GIAO HÀNG (DÙ LÁI WASD HAY CLICK CHUỘT) ---
      const tCust = gameRef.current.targetCustomer;
      if (tCust && gameRef.current.missionState === 'to_customer' &&
          Math.hypot(bike.x - (tCust.x + 60), bike.y - (tCust.y + 40)) < 45) {
        openCustomerDialog();
      }

      // --- CƠ CHẾ KHU VỰC 1: HỒI THỂ LỰC (QUÁN TRÀ ĐÁ, CÔNG VIÊN HOẶC TIỆN LỢI 24H) ---
      const distToTea = Math.hypot(bike.x - (map.teaStall.x + 60), bike.y - (map.teaStall.y + 40));
      const distToPark = Math.hypot(bike.x - (map.park.x + 60), bike.y - (map.park.y + 40));
      const distToConv = Math.hypot(bike.x - (map.convenience.x + 60), bike.y - (map.convenience.y + 40));
      if (distToTea < 48 || distToPark < 48 || distToConv < 48) {
        if (gameRef.current.energy < 100) {
          const healRate = distToConv < 48 ? 1.6 : 0.85;
          const healedEnergy = Math.min(100, gameRef.current.energy + healRate);
          gameRef.current.energy = healedEnergy;
          setEnergy(healedEnergy);

          if (Math.random() < 0.4) {
            healingParticles.push({
              x: bike.x + (Math.random() - 0.5) * 20,
              y: bike.y - 10,
              vy: -1.2,
              life: 1.0,
              text: distToTea < 48 ? '+Trà đá ☕' : (distToPark < 48 ? '+Bóng mát 🌳' : '+Bò Húc ⚡')
            });
          }

          const now = Date.now();
          if (now - lastHealSoundTime > 900) {
            playSound('heal');
            lastHealSoundTime = now;
            if (distToConv < 48 && gameRef.current.driverWage >= 2) {
              setDriverWage(w => Math.max(0, w - 2));
              addLog(`🏪 <strong>Tiện Lợi 24h:</strong> Mua nước tăng lực (-2k từ Ví) hồi nhanh thể lực lên ${Math.round(healedEnergy)}%!`);
            } else {
              addLog(distToTea < 48
                ? `☕ <strong>Quán Trà Đá Vỉa Hè:</strong> Uống trà đá miễn phí, thể lực tăng lên ${Math.round(healedEnergy)}%!`
                : `🌳 <strong>Công Viên Shipper:</strong> Nghỉ lưng dưới bóng cây, thể lực tăng lên ${Math.round(healedEnergy)}%!`);
            }
          }
        }
      }

      // --- CƠ CHẾ KHU VỰC 2: HỘI QUÁN SHIPPER (ROLE CÔNG ĐOÀN LAO ĐỘNG) ---
      const distToUnion = Math.hypot(bike.x - (map.unionHub.x + 60), bike.y - (map.unionHub.y + 40));
      if (distToUnion < 48) {
        const now = Date.now();
        if (now - lastUnionTime > 5000) {
          lastUnionTime = now;
          setRating(5.0);
          setAcceptanceRate(100);
          playSound('heal');
          addLog('🤝 <strong>Role Công Đoàn (Hội Quán Shipper):</strong> Anh em tài xế hỗ trợ kháng cáo đánh giá oan! Phục hồi <strong>5.0 ⭐</strong> & <strong>100% Tỷ lệ nhận đơn</strong>!');
        }
      }

      // --- CƠ CHẾ KHU VỰC 3: TRỤ SỞ AI PLATFORM (ROLE CHỦ SÀN TƯ BẢN SỐ) ---
      const distToHQ = Math.hypot(bike.x - (map.platformHQ.x + 62), bike.y - (map.platformHQ.y + 42));
      if (distToHQ < 48) {
        const now = Date.now();
        if (now - lastHQTime > 5000) {
          lastHQTime = now;
          addLog(`🏢 <strong>Trụ Sở AI Platform (Khu 5):</strong> Sàn đã tích lũy <strong>${gameRef.current.surplusM.toFixed(0)}k VNĐ thặng dư (m)</strong> từ mồ hôi của bạn với mức chiết khấu ${(gameRef.current.platformCutRate * 100).toFixed(0)}%!`);
        }
      }

      // --- CƠ CHẾ KHU VỰC 4: SỬA XE & BẢO DƯỠNG (CÂY XĂNG HOẶC KHO SẠC) ---
      const distToGas = Math.hypot(bike.x - (map.gasStation.x + 60), bike.y - (map.gasStation.y + 40));
      const distToHub = Math.hypot(bike.x - (map.logisticsHub.x + 60), bike.y - (map.logisticsHub.y + 40));
      if (distToGas < 48 || distToHub < 48) {
        if (gameRef.current.bikeHealth < 100) {
          const damage = 100 - gameRef.current.bikeHealth;
          let repairCost = Math.max(12, Math.round(damage * 0.45));
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
              addLog(`⛽ <strong>Role Trạm Xăng & Bảo Dưỡng:</strong> Đã trích <strong>-${repairCost}k (chi phí c)</strong> từ Ví Tài Xế để đổ đầy bình xăng & thay nhớt. Độ bền xe đạt 100%!`);
            }
          } else {
            const now = Date.now();
            if (now - lastRepairTime > 3000) {
              lastRepairTime = now;
              addLog(`❌ <strong>Ví không đủ tiền bảo dưỡng:</strong> Cần ${repairCost}k nhưng Ví bạn chỉ còn ${gameRef.current.driverWage.toFixed(0)}k!`);
            }
          }
        }
      }

      // --- CƠ CHẾ KHU VỰC 5: CHỐT CSGT (ROLE CẢNH SÁT GIAO THÔNG) ---
      const distToPolice = Math.hypot(bike.x - (map.policePoint.x + 60), bike.y - (map.policePoint.y + 40));
      if (distToPolice < 40) {
        const now = Date.now();
        if (now - lastPoliceTime > 4500) {
          lastPoliceTime = now;
          if (gameRef.current.algoSpeed > 1.2 || Math.random() < 0.25) {
            setDriverWage(w => Math.max(0, w - 80));
            setDriverCost(c => c + 80);
            playSound('strike');
            addLog('🚨 <strong>Role Chốt CSGT:</strong> Phạt hành chính <strong>-80k</strong> vì vượt đèn vàng khi chạy đua với thời gian của thuật toán! Sàn vô can, tài xế tự chịu.');
          } else {
            addLog('👮 <strong>Role Chốt CSGT:</strong> Đồng chí CSGT kiểm tra giấy tờ hợp lệ và nhắc nhở: "Chạy đơn nhớ giữ an toàn, đừng vì App giục mà vượt đèn đỏ nhé!"');
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

  function drawGpsRoute(ctx, x1, y1, x2, y2, color, labelText) {
    ctx.save();
    // Glowing animated dashed GPS line
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.5;
    ctx.setLineDash([10, 6]);
    ctx.lineDashOffset = -(Date.now() * 0.04) % 16;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Pulsing target ring at destination
    const pulse = 18 + Math.sin(Date.now() * 0.008) * 6;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x2, y2, pulse, 0, Math.PI * 2);
    ctx.stroke();

    // Floating GPS Banner above destination
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    const bw = 195;
    const bh = 22;
    const bx = Math.max(8, Math.min(ctx.canvas.width / (window.devicePixelRatio || 1) - bw - 8, x2 - bw / 2));
    const by = Math.max(8, y2 - 52);
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 10px system-ui';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(labelText, bx + bw / 2, by + 14);
    ctx.restore();
  }

  function drawCrosswalk(ctx, x, y, w, h, isVertical = false) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    if (isVertical) {
      for (let sy = y; sy < y + h - 5; sy += 9) {
        ctx.fillRect(x + 2, sy, w - 4, 4);
      }
    } else {
      for (let sx = x; sx < x + w - 5; sx += 9) {
        ctx.fillRect(sx, y + 2, 4, h - 4);
      }
    }
    ctx.restore();
  }

  function drawTree(ctx, x, y) {
    ctx.save();
    ctx.fillStyle = '#15803d';
    ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath(); ctx.arc(x - 2, y - 2, 5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawTrafficLight(ctx, x, y, state) {
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x - 4, y - 18, 8, 24);
    ctx.fillStyle = state === 'red' ? '#ef4444' : '#450a0a';
    ctx.beginPath(); ctx.arc(x, y - 13, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = state === 'yellow' ? '#f59e0b' : '#451a03';
    ctx.beginPath(); ctx.arc(x, y - 7, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = state === 'green' ? '#10b981' : '#022c22';
    ctx.beginPath(); ctx.arc(x, y - 1, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawPedestrian(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = '#fcd34d';
    ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-2.5, 3.5, 5, 5.5);
    ctx.restore();
  }

  function drawAiShipper(ctx, s) {
    ctx.save();
    ctx.translate(s.x, s.y);
    const ang = Math.atan2(s.vy, s.vx);
    ctx.rotate(ang);
    ctx.fillStyle = '#0f172a';
    ctx.beginPath(); ctx.arc(8, 0, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-8, 0, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(3, 0); ctx.lineTo(7, -2); ctx.stroke();
    ctx.fillStyle = s.color;
    ctx.fillRect(-8, -4, 6, 8);
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath(); ctx.arc(1, 0, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawLandmark(ctx, x, y, w, h, emoji, name, color, badge) {
    ctx.save();
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 8); ctx.fill(); ctx.stroke();

    ctx.fillStyle = color;
    ctx.fillRect(x + 4, y + 2, w - 8, 3);

    ctx.font = '22px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(emoji, x + w / 2, y + 28);

    ctx.font = 'bold 11px system-ui'; ctx.fillStyle = '#f8fafc';
    ctx.fillText(name, x + w / 2, y + 44);

    if (badge) {
      ctx.font = '9px system-ui'; ctx.fillStyle = color;
      ctx.fillText(badge, x + w / 2, y + 58);
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
    <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      
      {/* Top Header */}
      <div style={{ background: '#111827', borderRadius: '16px', border: '1px solid #1f2937', padding: '14px 18px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '6px', background: '#10b98120', color: '#34d399', border: '1px solid #10b98140' }}>
              📱 CƠ CHẾ APP SHIP VÍ & ĐỊNH VỊ GPS
            </span>
            <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '6px', background: '#6366f120', color: '#818cf8', border: '1px solid #6366f140' }}>
              W = c + v + m
            </span>
          </div>
          <h1 style={{ fontSize: '19px', fontWeight: 'bold', margin: 0, color: '#f8fafc' }}>
            🛵 Mô Phỏng Ship Ví: Bật App Nhận Đơn → Tới Quán Lấy Món → Giao Tận Tay Người Đặt
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

      {/* --- BẢNG ĐIỀU KHIỂN APP SHIPPER & VÍ TÀI XẾ (SHIP VÍ) --- */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '14px' }}>

        {/* CỘT TRÁI: MÀN HÌNH ĐIỆN THOẠI APP SHIPPER */}
        <div style={{ background: '#0f172a', borderRadius: '16px', border: appOnline ? '2px solid #10b981' : '2px solid #475569', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 8px 25px rgba(0,0,0,0.35)' }}>
          
          {/* Thanh trạng thái App (Bật/Tắt App + Ví Ký Quỹ) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>📱</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#f8fafc' }}>APP DRIVER PRO • VÍ SHIPPER</div>
                <div style={{ fontSize: '11px', color: appOnline ? '#34d399' : '#94a3b8' }}>
                  {appOnline ? '🟢 Đang Bật App (Sẵn sàng nhận đơn)' : '⚪ Đang Tắt App (Nghỉ ngơi)'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => {
                  const next = !appOnline;
                  setAppOnline(next);
                  if (!next) {
                    setIncomingOrder(null);
                    if (missionState === 'ringing') setMissionState('idle');
                    addLog('📴 Đã TẮT APP Shipper. Bạn sẽ không bị nổ đơn mới.');
                  } else {
                    addLog('🟢 Đã BẬT APP Shipper! Bấm "Tìm Đơn Random" để nhận cuốc ngay.');
                  }
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  background: appOnline ? '#10b981' : '#334155',
                  color: '#fff'
                }}
              >
                {appOnline ? '🟢 ĐANG BẬT APP' : '⚪ BẤM ĐỂ BẬT APP'}
              </button>
            </div>
          </div>

          {/* Nội dung Màn hình App theo từng bước: Đang Rảnh / Đang Nổ Đơn / Đang Tới Quán / Đang Giao Khách */}
          {missionState === 'ringing' && incomingOrder ? (
            <div style={{ background: '#1e293b', borderRadius: '12px', border: '2px solid #f59e0b', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fbbf24' }}>🔔 ĐƠN HÀNG RANDOM MỚI NỔ TRÊN APP!</span>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#34d399' }}>Cước W: {incomingOrder.price}.000đ ({incomingOrder.distance} km)</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#f8fafc' }}>{incomingOrder.name}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', background: '#0f172a', padding: '8px 10px', borderRadius: '8px' }}>
                <div>
                  <span style={{ color: '#94a3b8' }}>📍 Bước 1 - Tới Quán Lấy:</span>
                  <div style={{ fontWeight: 'bold', color: '#f59e0b', marginTop: '2px' }}>{incomingOrder.shopLabel}</div>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>🎯 Bước 2 - Giao Cho Khách:</span>
                  <div style={{ fontWeight: 'bold', color: '#38bdf8', marginTop: '2px' }}>{incomingOrder.custLabel}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e1' }}>
                <span>Sàn trừ Ví (m): <strong style={{ color: '#a78bfa' }}>-{(incomingOrder.price * platformCutRate).toFixed(0)}k</strong></span>
                <span>Thực cộng vào Ví: <strong style={{ color: '#34d399' }}>+{(incomingOrder.price * (1 - platformCutRate)).toFixed(0)}k</strong></span>
                <span>Xăng/hao mòn (c): <strong style={{ color: '#fbbf24' }}>~{incomingOrder.vehicleCost}k</strong></span>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '2px' }}>
                <button
                  onClick={() => window.__acceptIncomingOrder && window.__acceptIncomingOrder()}
                  style={{ flex: 2, padding: '10px', borderRadius: '10px', border: 'none', background: '#10b981', color: '#fff', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                >
                  ✅ NHẬN ĐƠN & CHẠY TỚI QUÁN
                </button>
                <button
                  onClick={() => window.__declineIncomingOrder && window.__declineIncomingOrder()}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #ef4444', background: '#1e293b', color: '#f87171', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                >
                  ❌ Bỏ Qua (-5%)
                </button>
              </div>
            </div>
          ) : (missionState === 'to_restaurant' || missionState === 'at_shop' || missionState === 'picking_up' || missionState === 'to_customer' || missionState === 'at_customer') ? (
            <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #38bdf8', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#38bdf8' }}>
                  {missionState === 'to_restaurant' && '🛵 BƯỚC 1/2: ĐANG CHẠY TỚI ĐỊA CHỈ QUÁN LẤY MÓN...'}
                  {(missionState === 'at_shop' || missionState === 'picking_up') && '👩‍🍳 BƯỚC 1/2: ĐANG TƯƠNG TÁC VỚI CHỦ QUÁN NHẬN ĐƠN...'}
                  {missionState === 'to_customer' && '🎯 BƯỚC 2/2: ĐÃ LẤY MÓN! ĐANG CHẠY ĐI GIAO CHO NGƯỜI ĐẶT...'}
                  {missionState === 'at_customer' && '🙋‍♂️ BƯỚC 2/2: ĐANG GIAO HÀNG & NHẬN TIỀN TỪ KHÁCH...'}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#f59e0b' }}>{currentOrder.price}k VNĐ</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#f8fafc' }}>{currentOrder.name} ({currentOrder.distance} km)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                <div style={{ padding: '6px 10px', borderRadius: '8px', background: hasFood ? '#064e3b' : '#0f172a', border: !hasFood ? '1px solid #f59e0b' : '1px solid #10b981' }}>
                  <div style={{ color: '#94a3b8' }}>1. Điểm lấy hàng:</div>
                  <div style={{ fontWeight: 'bold', color: '#f8fafc' }}>{hasFood ? '✅ Đã lấy tại ' : '👉 '}{currentOrder.shopLabel}</div>
                </div>
                <div style={{ padding: '6px 10px', borderRadius: '8px', background: '#0f172a', border: hasFood ? '1px solid #38bdf8' : '1px solid #334155' }}>
                  <div style={{ color: '#94a3b8' }}>2. Điểm giao khách:</div>
                  <div style={{ fontWeight: 'bold', color: '#38bdf8' }}>🎯 {currentOrder.custLabel}</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px dashed #475569', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#e2e8f0' }}>
                  {appOnline ? '📡 App đang quét tìm đơn hàng quanh bạn...' : '📴 App đang tắt (Offline)'}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                  Bấm nút bên cạnh hoặc click vào Quán Cơm / Trà Sữa / Pizza trên bản đồ để nổ đơn ngẫu nhiên!
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button
                  onClick={() => window.__ringOrder && window.__ringOrder(false)}
                  disabled={!appOnline || isStrike}
                  style={{ padding: '10px 14px', borderRadius: '10px', border: 'none', background: appOnline ? '#059669' : '#334155', color: '#fff', fontWeight: 'bold', fontSize: '12px', cursor: appOnline ? 'pointer' : 'not-allowed' }}
                >
                  📲 Nổ Đơn Random
                </button>
                <button
                  onClick={() => window.__ringOrder && window.__ringOrder(true)}
                  disabled={!appOnline || isStrike}
                  style={{ padding: '10px 12px', borderRadius: '10px', border: 'none', background: appOnline ? '#be123c' : '#334155', color: '#fff', fontWeight: 'bold', fontSize: '12px', cursor: appOnline ? 'pointer' : 'not-allowed' }}
                >
                  🌙 Đơn Ca Đêm
                </button>
              </div>
            </div>
          )}

        </div>

        {/* CỘT PHẢI: VÍ TÀI XẾ (SHIP VÍ) & CHỦ SÀN */}
        <div style={{ background: '#111827', borderRadius: '16px', border: '1px solid #1f2937', padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', color: '#34d399', fontSize: '13px' }}>💳 VÍ SHIPPER ({tier}) & THỂ LỰC</span>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: energy > 30 ? '#34d399' : '#f87171' }}>
              ⚡ Thể lực: {energy.toFixed(0)}% | 🛠️ Xe: {bikeHealth}%
            </span>
          </div>

          <div style={{ height: '6px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${energy}%`, height: '100%', background: energy > 30 ? '#10b981' : '#ef4444', transition: 'width 0.2s' }}></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
            <div style={{ background: '#1e293b', padding: '8px 10px', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
              <span style={{ color: '#94a3b8', fontSize: '11px' }}>Số dư Ví Shipper:</span>
              <div style={{ fontWeight: 'bold', color: '#34d399', fontSize: '15px' }}>{driverWage.toFixed(0)}.000đ</div>
            </div>
            <div style={{ background: '#1e293b', padding: '8px 10px', borderRadius: '8px', borderLeft: '3px solid #f59e0b' }}>
              <span style={{ color: '#94a3b8', fontSize: '11px' }}>Đã chi Xăng/Sửa xe (c):</span>
              <div style={{ fontWeight: 'bold', color: '#fbbf24', fontSize: '15px' }}>{driverCost.toFixed(0)}.000đ</div>
            </div>
            <div style={{ background: '#1e293b', padding: '8px 10px', borderRadius: '8px', borderLeft: '3px solid #8b5cf6' }}>
              <span style={{ color: '#94a3b8', fontSize: '11px' }}>Sàn đã thu (Thặng dư m):</span>
              <div style={{ fontWeight: 'bold', color: '#a78bfa', fontSize: '14px' }}>{surplusM.toFixed(0)}k ({(platformCutRate * 100).toFixed(0)}%)</div>
            </div>
            <div style={{ background: '#1e293b', padding: '8px 10px', borderRadius: '8px', borderLeft: '3px solid #38bdf8' }}>
              <span style={{ color: '#94a3b8', fontSize: '11px' }}>Uy tín App ({completedOrders} đơn):</span>
              <div style={{ fontWeight: 'bold', color: '#f8fafc', fontSize: '14px' }}>{rating.toFixed(2)} ⭐ ({acceptanceRate}%)</div>
            </div>
          </div>
        </div>

      </div>

      {/* Live Formula Bar (W = c + v + m) */}
      <div style={{ background: '#111827', borderRadius: '14px', border: '1px solid #1f2937', padding: '10px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>
          <span style={{ color: '#cbd5e1' }}>PHÂN TÍCH GIÁ TRỊ ĐƠN HÀNG W = c + v + m ({currentPrice}k VNĐ)</span>
          <span style={{ padding: '2px 10px', borderRadius: '20px', background: '#6366f120', color: Number(surplusRate) >= 100 ? '#f43f5e' : '#818cf8', border: '1px solid #6366f140', fontSize: '12px' }}>
            Tỷ suất bóc lột m' = m/v = {surplusRate}% {Number(surplusRate) >= 100 && '🔥'}
          </span>
        </div>
        <div style={{ display: 'flex', height: '22px', borderRadius: '6px', overflow: 'hidden', fontWeight: 'bold', fontSize: '11px', color: '#fff', textAlign: 'center', lineHeight: '22px' }}>
          <div style={{ width: `${pctC}%`, background: '#d97706' }}>c (Xăng/Xe): {currentCost}k ({pctC.toFixed(0)}%)</div>
          <div style={{ width: `${pctV}%`, background: '#10b981' }}>v (Thực nuôi sống): {currentWageV.toFixed(0)}k ({pctV.toFixed(0)}%)</div>
          <div style={{ width: `${pctM}%`, background: '#8b5cf6' }}>m (Sàn cắt): {currentSurplusM.toFixed(0)}k ({pctM.toFixed(0)}%)</div>
        </div>
      </div>

      {/* --- BẢNG CHỨC NĂNG RIÊNG CỦA 5 KHU VỰC & CÁC ROLE (BẤM ĐỂ CHẠY XE TỚI NGAY) --- */}
      <div style={{ background: '#111827', borderRadius: '14px', border: '1px solid #1f2937', padding: '10px 14px' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>🗺️ CHỨC NĂNG RIÊNG CỦA 5 KHU VỰC & CÁC ROLE TRONG THÀNH PHỐ (Click vào khu vực để lái xe tới tương tác):</span>
          <span style={{ fontSize: '11px', color: '#38bdf8' }}>Hoặc dùng phím W/A/S/D & Click trực tiếp lên bản đồ</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
          {ZONE_ROLES_INFO.map(z => (
            <div
              key={z.id}
              onClick={() => {
                setActiveZoneTab(z.id);
                if (window.__driveToLandmark) window.__driveToLandmark(z.targetKey);
              }}
              style={{
                background: activeZoneTab === z.id ? '#1e293b' : '#0f172a',
                border: `1px solid ${activeZoneTab === z.id ? z.color : '#1e293b'}`,
                borderTop: `3px solid ${z.color}`,
                borderRadius: '10px',
                padding: '8px 10px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: z.color }}>{z.title}</div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#f8fafc', marginTop: '2px' }}>{z.role}</div>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px', lineHeight: 1.35 }}>{z.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 2D Canvas Viewport */}
      <div style={{ position: 'relative', width: '100%', height: '560px', borderRadius: '16px', overflow: 'hidden', border: '2px solid #1e293b', background: '#090d16' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', cursor: 'pointer' }} />

        {/* HỘI THOẠI VỚI ROLE CHỦ QUÁN / NHÂN VIÊN KHI TỚI LẤY ĐƠN */}
        {shopDialog && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(2, 6, 23, 0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '16px', zIndex: 10 }}>
            <div style={{ width: '100%', maxWidth: '640px', background: '#0f172a', border: `2px solid ${shopDialog.npc.color}`, borderRadius: '16px', padding: '14px 16px', boxShadow: '0 10px 30px rgba(0,0,0,0.6)', marginBottom: '28px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '40px', lineHeight: 1, background: '#1e293b', borderRadius: '12px', padding: '8px' }}>{shopDialog.npc.avatar}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', color: shopDialog.npc.color, fontSize: '13px' }}>
                      {shopDialog.npc.name}
                    </span>
                    <span style={{ fontSize: '11px', background: '#1e293b', color: '#cbd5e1', padding: '2px 8px', borderRadius: '10px' }}>
                      📍 Bước 1/2: Nhận đơn tại {shopDialog.shopLabel}
                    </span>
                  </div>
                  <div style={{ color: '#f1f5f9', fontSize: '14px', marginTop: '6px', lineHeight: 1.45 }}>
                    “{shopDialog.reply || shopDialog.question}”
                  </div>
                </div>
              </div>

              {shopDialog.options.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
                  {shopDialog.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => { if (window.__resolveShopDialog) window.__resolveShopDialog(opt); }}
                      style={{ textAlign: 'left', padding: '9px 12px', background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: '10px', cursor: 'pointer', fontSize: '13px' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = shopDialog.npc.color; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; }}
                    >
                      {i + 1}. {opt.text}
                    </button>
                  ))}
                </div>
              )}
              {shopDialog.reply && (
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#34d399', marginTop: '8px' }}>
                  📦 Đã nhận đồ ăn! Đang bật GPS chạy tới giao cho người đặt...
                </div>
              )}
            </div>
          </div>
        )}

        {/* HỘI THOẠI VỚI ROLE NGƯỜI ĐẶT HÀNG (KHÁCH HÀNG) KHI TỚI GIAO MÓN */}
        {customerDialog && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(2, 6, 23, 0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '16px', zIndex: 10 }}>
            <div style={{ width: '100%', maxWidth: '640px', background: '#0f172a', border: `2px solid ${customerDialog.npc.color}`, borderRadius: '16px', padding: '14px 16px', boxShadow: '0 10px 30px rgba(0,0,0,0.6)', marginBottom: '28px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '40px', lineHeight: 1, background: '#1e293b', borderRadius: '12px', padding: '8px' }}>{customerDialog.npc.avatar}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', color: customerDialog.npc.color, fontSize: '13px' }}>
                      {customerDialog.npc.name}
                    </span>
                    <span style={{ fontSize: '11px', background: '#1e293b', color: '#38bdf8', padding: '2px 8px', borderRadius: '10px' }}>
                      🎯 Bước 2/2: Giao hàng tại {customerDialog.custLabel}
                    </span>
                  </div>
                  <div style={{ color: '#f1f5f9', fontSize: '14px', marginTop: '6px', lineHeight: 1.45 }}>
                    “{customerDialog.reply || customerDialog.question}”
                  </div>
                </div>
              </div>

              {customerDialog.options.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
                  {customerDialog.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => { if (window.__resolveCustomerDialog) window.__resolveCustomerDialog(opt); }}
                      style={{ textAlign: 'left', padding: '9px 12px', background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: '10px', cursor: 'pointer', fontSize: '13px' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = customerDialog.npc.color; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; }}
                    >
                      {i + 1}. {opt.text}
                    </button>
                  ))}
                </div>
              )}
              {customerDialog.reply && (
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#34d399', marginTop: '8px' }}>
                  💰 Giao hàng hoàn tất! Đang chuyển tiền vào Ví Shipper...
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(15, 23, 42, 0.88)', border: '1px solid #334155', borderRadius: '20px', padding: '4px 16px', fontSize: '11px', color: '#cbd5e1', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
          📲 <em>Quy trình chuẩn: Bật App → Nhận Đơn Random → Đi theo đường định vị GPS tới Quán gặp Chủ Quán → Chạy tới Địa Chỉ Khách giao hàng!</em>
        </div>
      </div>

      {/* Quick Navigation & Role Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: '10px' }}>
        <button
          onClick={() => { if (window.__ringOrder) window.__ringOrder(false); }}
          disabled={isStrike || !appOnline || energy < 10}
          style={{ padding: '11px', background: '#059669', color: '#fff', border: 'none', borderRadius: '12px', cursor: (energy >= 10 && appOnline) ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '12px' }}
        >
          📲 Bắn Đơn Random Lên App
        </button>

        <button
          onClick={() => { if (window.__restDriver) window.__restDriver(); }}
          style={{ padding: '11px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
        >
          ☕ Ghé Trà Đá (Hồi Thể Lực)
        </button>

        <button
          onClick={() => { if (window.__repairBike) window.__repairBike(); }}
          style={{ padding: '11px', background: '#d97706', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
        >
          ⛽ Ghé Trạm Xăng/Sửa Xe (Trả c)
        </button>

        <button
          onClick={() => { if (window.__driveToLandmark) window.__driveToLandmark('unionHub'); }}
          style={{ padding: '11px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
        >
          🤝 Ghé Hội Quán (Hồi 5.0 ⭐)
        </button>
      </div>

      {/* Advanced Gig & Capitalist Mechanics (Role Chủ Sàn AI) */}
      <div style={{ background: '#111827', borderRadius: '14px', border: '1px solid #1f2937', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>🏢 BẢNG ĐIỀU KHIỂN CỦA ROLE CHỦ SÀN AI (TƯ BẢN NỀN TẢNG - KHU 5):</span>
          <span style={{ fontSize: '11px', color: '#a78bfa' }}>Quỹ thặng dư tích lũy m: {surplusM.toFixed(0)}k VNĐ | Drone AI: {droneCount} chiếc</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
          <button
            onClick={() => {
              setIsBatchedOrder(b => {
                const next = !b;
                addLog(next 
                  ? '📦📦 <strong>Bật Đơn Ghép (Batching):</strong> Ghép 2 khách trên 1 cuốc xe (giá x1.7, tăng cường độ bóc lột lao động)!'
                  : 'Đã tắt chế độ đơn ghép.');
                return next;
              });
            }}
            style={{ padding: '10px', borderRadius: '10px', background: isBatchedOrder ? '#3b82f6' : '#1e293b', color: '#fff', border: '1px solid #334155', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', textAlign: 'left' }}
          >
            {isBatchedOrder ? '✅ Đang Ghép 2 Đơn Ngẫu Nhiên' : '➕ Kích Hoạt Đơn Ghép (Batching)'}
            <div style={{ fontSize: '10px', fontWeight: 'normal', color: '#cbd5e1', marginTop: '2px' }}>Tăng tỷ suất giá trị thặng dư m'</div>
          </button>

          <button
            onClick={handleGasCrisis}
            style={{ padding: '10px', borderRadius: '10px', background: gasCrisis ? '#b45309' : '#1e293b', color: '#fff', border: '1px solid #334155', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', textAlign: 'left' }}
          >
            {gasCrisis ? '⛽ Đang Bão Giá Xăng (+40% c)' : '⛽ Biến Động Giá Xăng Dầu'}
            <div style={{ fontSize: '10px', fontWeight: 'normal', color: '#cbd5e1', marginTop: '2px' }}>Tài xế tự chịu c tại Trạm Xăng</div>
          </button>

          <button
            onClick={handleUpgradeAlgo}
            disabled={surplusM < 200}
            style={{ padding: '10px', borderRadius: '10px', background: surplusM >= 200 ? '#7c3aed' : '#312e81', color: '#fff', border: 'none', cursor: surplusM >= 200 ? 'pointer' : 'not-allowed', opacity: surplusM >= 200 ? 1 : 0.6, fontSize: '12px', fontWeight: 'bold', textAlign: 'left' }}
          >
            🚀 Nâng Cấp Thuật Toán AI (200k m)
            <div style={{ fontSize: '10px', fontWeight: 'normal', color: '#cbd5e1', marginTop: '2px' }}>Tăng chiết khấu sàn & tốc độ ép đơn</div>
          </button>

          <button
            onClick={handleBuyDrone}
            disabled={surplusM < 500}
            style={{ padding: '10px', borderRadius: '10px', background: surplusM >= 500 ? '#0284c7' : '#0f172a', color: '#fff', border: 'none', cursor: surplusM >= 500 ? 'pointer' : 'not-allowed', opacity: surplusM >= 500 ? 1 : 0.6, fontSize: '12px', fontWeight: 'bold', textAlign: 'left' }}
          >
            🤖 Mua Drone Giao Hàng AI (500k m)
            <div style={{ fontSize: '10px', fontWeight: 'normal', color: '#cbd5e1', marginTop: '2px' }}>Tăng cấu tạo hữu cơ c/v, thay thế shipper</div>
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
              if (next && missionState === 'idle' && appOnline) window.__ringOrder(false);
            }}
            style={{ padding: '6px 14px', borderRadius: '8px', background: autoDispatch ? '#d97706' : '#1e293b', color: '#fff', border: '1px solid #334155', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
          >
            {autoDispatch ? '⏸️ Tắt Tự Động Nhận & Chạy Đơn' : '⚡ Bật Tự Động Nhận Đơn & Chạy Liên Tục'}
          </button>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Nhật ký hoạt động App & Ví Shipper:</span>
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
