import React, { useState, useEffect, useRef } from 'react';

// --- DỮ LIỆU ĐƠN HÀNG & CHI PHÍ THỰC TẾ SHIPPER VIỆT NAM (TP.HCM / HÀ NỘI) ---
const RANDOM_ORDER_TYPES = [
  { name: '🧋 Trà Sữa Trân Châu Đường Đen', baseDist: 2.1, codFoodPrice: 45, shopKey: 'milkTeaShop', custKeys: ['university', 'customerB'] },
  { name: '🥖 Bánh Mì Chả Cá Nóng Giòn', baseDist: 1.6, codFoodPrice: 25, shopKey: 'milkTeaShop', custKeys: ['university', 'customerA'] },
  { name: '🍜 Phở Bò Tái Nạm Gầu Béo', baseDist: 3.4, codFoodPrice: 65, shopKey: 'restaurant', custKeys: ['hospital', 'customerA'] },
  { name: '🍛 Cơm Tấm Sườn Bì Chả Trứng', baseDist: 2.8, codFoodPrice: 55, shopKey: 'restaurant', custKeys: ['customerA', 'university'] },
  { name: '🍕 Pizza Hải Sản Cỡ Lớn', baseDist: 5.5, codFoodPrice: 185, shopKey: 'pizzaShop', custKeys: ['customerB', 'customerA'] },
  { name: '🍗 Gà Rán Giòn Cay 3 Miếng', baseDist: 4.2, codFoodPrice: 115, shopKey: 'pizzaShop', custKeys: ['university', 'customerB'] },
  { name: '🍲 Lẩu Thái Chua Cay Nhỏ', baseDist: 6.8, codFoodPrice: 220, shopKey: 'restaurant', custKeys: ['customerB', 'hospital'] },
  { name: '🥣 Cháo Thịt Bằm Hồi Sức', baseDist: 3.1, codFoodPrice: 45, shopKey: 'restaurant', custKeys: ['hospital'] },
  { name: '☕ Cà Phê Muối Sài Gòn', baseDist: 1.9, codFoodPrice: 32, shopKey: 'milkTeaShop', custKeys: ['customerB', 'university'] },
  { name: '🍔 Combo Burger Bò + Khoai Tây', baseDist: 4.6, codFoodPrice: 95, shopKey: 'pizzaShop', custKeys: ['university', 'customerA'] }
];

// Phụ phí theo Địa điểm nhận/giao (Location Surge)
const LOCATION_SURGE = {
  university: { fee: 0.0, tag: 'Khu KTX Sinh Viên (+0đ)' },
  customerA:  { fee: 2.0, tag: 'Hẻm Sâu Dân Cư (+2.000đ)' },
  hospital:   { fee: 3.5, tag: 'Cổng Bệnh Viện Đông (+3.500đ)' },
  customerB:  { fee: 4.5, tag: 'Khu Chung Cư Xa (+4.500đ)' }
};

// Hàm định dạng tiền tệ Việt Nam chuẩn (VD: 16.5 -> "16.500đ", 120 -> "120.000đ")
const formatVND = (kVal) => {
  const dong = Math.round((Number(kVal) || 0) * 1000);
  return dong.toLocaleString('vi-VN') + 'đ';
};

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// --- ROLE 1: CHỦ QUÁN / NHÂN VIÊN TẠI CÁC ĐIỂM LẤY MÓN ---
const SHOP_NPCS = {
  restaurant:  { name: 'Cô Ba (Chủ Quán Cơm Phở)', role: 'Role Chủ Quán · Khu 1 Ẩm Thực', avatar: '👩‍🍳', color: '#f59e0b' },
  milkTeaShop: { name: 'Bé Linh (Pha Chế Trà Sữa)', role: 'Role Nhân Viên Quán · Khu 2 Ăn Vặt', avatar: '🧑‍🍳', color: '#ec4899' },
  pizzaShop:   { name: 'Anh Tuấn (Quản Lý Cửa Hàng)', role: 'Role Quản Lý Fastfood · Khu 2 Nam', avatar: '👨‍🍳', color: '#f97316' }
};

// Hội thoại Chủ quán biến đổi theo Thời tiết & Thời gian
const getDynamicShopDialog = (g) => {
  const pool = [];

  if (g.weather === 'rain' || g.weather === 'storm') {
    pool.push({
      question: g.weather === 'storm'
        ? 'Trời mưa bão ngập đường thế này mà em vẫn bật App chạy đơn hả! Chị bọc 3 lớp túi nilon chống nước cho món ăn rồi nè!'
        : 'Ngoài trời đang mưa rào trơn trượt lắm, chị buộc kỹ túi đồ ăn rồi, em mặc áo mưa kín vào rồi hẵng chạy nha!',
      options: [
        {
          text: '🌧️ Dạ mưa bão cước tăng thêm được chút đỉnh nên em ráng cày chị ạ!',
          effect: () => ({
            energy: -2,
            rating: 0.04,
            reply: pickRandom([
              'Thương ghê, cầm thêm ly trà gừng nóng uống cho ấm bụng rồi đi nha em!',
              'Ừa chạy mưa cực gấp đôi ngày thường, đi đứng cẩn thận kẻo sập ổ gà nghen!'
            ]),
            log: '🌧️ <strong>Chạy đơn mùa mưa bão:</strong> Cước có cộng phụ phí thời tiết nhưng rủi ro ngập nước, tắt máy và hao tổn sức lực cao gấp bội.'
          })
        },
        {
          text: '🛍️ Để em lót thêm lớp giấy báo vào thùng giữ nhiệt cho khỏi nguội món',
          effect: () => ({
            energy: -3,
            rating: 0.06,
            reply: pickRandom([
              'Em chu đáo số 1 luôn, khách nhận được đồ nóng hổi chắc chắn thương lắm!',
              'Quá kỹ tính luôn! Chúc em thượng lộ bình an nha!'
            ]),
            log: '✅ Bọc kỹ đơn hàng trong trời mưa: bảo vệ đồ ăn không bị ướt (+0.06 ⭐).'
          })
        }
      ]
    });
  }

  if (g.isNight) {
    pool.push({
      question: 'Khuya lắm rồi mà quán chị vẫn nổ đơn đêm liên tục! Em ứng Ví COD lấy đơn này giao cho khách ăn khuya nhé?',
      options: [
        {
          text: '🌙 Dạ em quẹt Ví ứng tiền liền, chạy đêm vắng xe nhưng buồn ngủ quá chị ơi!',
          effect: () => ({
            energy: -3,
            rating: 0.04,
            reply: pickRandom([
              'Ráng nốt vài cuốc rồi về ngủ nghen em, đường khuya nhớ bật đèn pha sáng lên!',
              'Nè quán tặng em bịch cà phê đá uống cho tỉnh ngủ mà chạy ca đêm nha!'
            ]),
            log: '🌙 <strong>Lao động ca đêm (Giá trị thặng dư tuyệt đối):</strong> Kéo dài ngày lao động sang đêm khuya để kiếm thêm phụ phí +7.000đ/đơn.'
          })
        },
        {
          text: '🔍 Kiểm tra kỹ mã đơn đêm vì giờ này quán chuẩn bị đóng cửa khó đổi trả',
          effect: () => ({
            energy: -2,
            rating: 0.05,
            reply: 'Đúng chuẩn món khách dặn rồi em, yên tâm giao nha!',
            log: '🧾 Kiểm tra kỹ đơn hàng ca đêm trước khi rời quán (+0.05 ⭐).'
          })
        }
      ]
    });
  }

  // Các hội thoại thực tế thường ngày tại quán
  pool.push(
    {
      question: 'Đơn này khách chọn trả tiền mặt (COD), em ứng từ Ví Shipper trả tiền món cho quán trước rồi lấy hàng nhé!',
      options: [
        {
          text: '💳 Quẹt Ví Shipper ứng tiền món & kiểm tra kỹ niêm phong',
          effect: () => ({
            energy: -2,
            rating: 0.03,
            reply: pickRandom([
              'Quán nhận đủ tiền món rồi nha, em giao tới thu lại của khách nhé!',
              'Ok em, hóa đơn kẹp sẵn trên miệng túi rồi đó, chúc em chạy đắt khách!'
            ]),
            log: '💳 <strong>Thực tế Shipper VN:</strong> Phải tự bỏ vốn nạp sẵn vào Ví Ký Quỹ (300k) để ứng tiền đồ ăn cho khách.'
          })
        },
        {
          text: '❓ Chị ơi, bán trên App thế này quán bị sàn thu chiết khấu bao nhiêu %?',
          effect: (state) => ({
            energy: -2,
            reply: pickRandom([
              'Sàn cắt của quán 25% đến 30% giá món đó em! Quán phải bán đắt hơn tại chỗ mới không lỗ.',
              'Trừ phí sàn xong quán lời được vài nghìn bạc thôi, cả quán lẫn shipper đều nuôi béo sàn hết!'
            ]),
            log: `📚 <strong>Bóc lột kép tại VN:</strong> Sàn thu 25-30% từ Chủ quán VÀ thu ${(state.platformCutRate * 100).toFixed(1)}% trên cước của Shipper!`
          })
        }
      ]
    },
    {
      question: 'Bếp đang kẹt 4 đơn liền, em ngồi đợi ít phút uống ly trà đá miễn phí của quán nha!',
      options: [
        {
          text: '🥤 Dạ em đợi được, cảm ơn quán mời ly trà đá ạ (+10% thể lực)',
          effect: () => ({
            energy: 10,
            rating: 0.03,
            reply: pickRandom([
              'Uống đi cho mát, chạy ngoài đường nắng khói bụi cực quá!',
              'Món của em xong rồi đây, cảm ơn em chịu khó đợi bếp nha!'
            ]),
            log: '☕ Được quán mời trà đá miễn phí trong lúc chờ món (+10% thể lực).'
          })
        },
        {
          text: '⏱️ Hối bếp làm nhanh vì sợ trễ giờ mất thưởng mốc ngày',
          effect: () => ({
            energy: -3,
            reply: pickRandom([
              'Bếp ráng hết sức rồi, của em xong rồi đây!',
              'Rồi rồi xong ngay đây em ơi, thông cảm giờ cao điểm khách đặt dồn quá!'
            ]),
            log: '⏳ Thời gian chờ quán là "thời gian chết" không được tính vào tiền cước của shipper.'
          })
        }
      ]
    }
  );

  return pickRandom(pool);
};

// --- ROLE 2: NGƯỜI ĐẶT HÀNG (KHÁCH HÀNG) TẠI CÁC ĐIỂM GIAO ---
const CUSTOMER_NPCS = {
  university: { name: 'Bạn Minh (Sinh Viên KTX)', role: 'Role Khách Sinh Viên · Khu 1 Đại Học', avatar: '🧑‍🎓', color: '#3b82f6' },
  hospital:   { name: 'Bác Sĩ Lan & Người Nhà BN', role: 'Role Khách Bệnh Viện · Khu 5 Y Tế', avatar: '👩‍⚕️', color: '#f43f5e' },
  customerA:  { name: 'Chị Hương (Nhà Phố Hẻm Nhỏ)', role: 'Role Khách Gia Đình · Khu 4 Dân Cư', avatar: '🙋‍♀️', color: '#06b6d4' },
  customerB:  { name: 'Anh Hoàng (Chung Cư Cao Tầng)', role: 'Role Khách Chung Cư · Khu 5 Công Nghệ', avatar: '🧑‍💼', color: '#8b5cf6' }
};

// --- HỆ THỐNG HỘI THOẠI NGƯỜI NHẬN HÀNG NGẪU NHIÊN THEO THỜI TIẾT + THỜI GIAN + ĐỊA ĐIỂM ---
const getDynamicCustomerDialog = (g, custKey) => {
  const weather = g.weather; // 'clear' | 'rain' | 'storm'
  const isNight = g.isNight; // true | false
  const isRushHour = g.isRushHour; // true | false
  const isBatched = g.isBatchedOrder;

  const candidates = [];

  // 1. KỊCH BẢN THEO THỜI TIẾT: MƯA RÀO / MƯA BÃO
  if (weather === 'storm') {
    candidates.push(
      {
        conditionTag: '⛈️ Khách nhận hàng giữa tâm bão ngập đường',
        question: pickRandom([
          'Trời ơi bão gió ngập nửa bánh xe thế này mà anh vẫn giao tới tận nơi cho em được! Áo mưa anh rách cả tà rồi kìa, đồ ăn có bị ướt không anh?',
          'Mưa bão sấm chớp đùng đùng em tưởng App tự hủy đơn rồi chứ! Cảm ơn anh shipper dũng cảm quá, để em gửi thêm tiền tip cho anh uống trà gừng nha!'
        ]),
        options: [
          {
            text: '🙏 Dạ em bọc 3 lớp túi chống nước trong thùng giữ nhiệt nên đồ ăn vẫn khô ráo nóng hổi ạ!',
            effect: () => {
              const tip = pickRandom([10, 15, 20]);
              return {
                tip,
                rating: 0.08,
                reply: pickRandom([
                  `Tuyệt vời quá! Em gửi tặng anh thêm ${formatVND(tip)} tiền tip bồi dưỡng vượt bão và đánh giá 5 sao liền đây!`,
                  `Cảm động thiệt sự, đồ ăn vẫn còn nóng nguyên! Gửi anh thêm ${formatVND(tip)} tiền cà phê nhé, chạy về cẩn thận nha anh!`
                ]),
                log: `⛈️ <strong>Giao hàng vượt bão:</strong> Khách hàng cảm kích vì đồ ăn khô ráo giữa mưa bão, thưởng nóng <strong>+${formatVND(tip)} tiền tip</strong> & 5 ⭐!`
              };
            }
          },
          {
            text: '🛵 Dạ đường ngập quá xe em suýt chết máy ở ngã tư, may mà vẫn kịp giao cho anh/chị!',
            effect: () => {
              const tip = pickRandom([10, 15]);
              return {
                tip,
                energy: -3,
                rating: 0.06,
                reply: pickRandom([
                  `Khổ thân anh quá, cầm lấy ${formatVND(tip)} tiền tip của em rồi tìm chỗ trú bão bớt mưa hẵng chạy tiếp anh ơi!`,
                  `Trời mưa bão thế này ai cũng thông cảm hết, em biếu anh thêm ${formatVND(tip)} lau bugi xe nha!`
                ]),
                log: `🌧️ Khách hàng thấu hiểu nỗi vất vả chạy xe mùa mưa ngập, tặng thêm <strong>+${formatVND(tip)}</strong>.`
              };
            }
          }
        ]
      }
    );
  } else if (weather === 'rain') {
    candidates.push(
      {
        conditionTag: '🌧️ Khách nhận hàng lúc trời mưa rào trơn trượt',
        question: pickRandom([
          'Đang mưa rào bất chợt nên mình ngại ra đường mới đặt App. Cảm ơn bạn đội mưa giao đồ qua nha, tay bạn ướt lạnh hết rồi kìa!',
          'Trời mưa đường trơn mà bạn chạy nhanh ghê! Mình đứng ở mái hiên đợi sẵn để bạn khỏi phải cởi áo mưa xuống xe nè!'
        ]),
        options: [
          {
            text: '😊 Dạ cảm ơn anh/chị tâm lý đứng đợi sẵn ở mái hiên giúp em đỡ ướt!',
            effect: () => {
              const tip = pickRandom([5, 10]);
              return {
                tip,
                rating: 0.05,
                reply: pickRandom([
                  `Không có chi đâu, gửi bạn thêm ${formatVND(tip)} tiền lẻ uống nước ấm nhé! Đã chấm 5 sao trên App!`,
                  `Mình cũng hay đi ngoài đường nên hiểu mà, tặng bạn thêm ${formatVND(tip)} tiền tip qua Ví nha!`
                ]),
                log: `🌧️ <strong>Tình người ngày mưa:</strong> Khách ra tận mái hiên nhận hàng và tip thêm <strong>+${formatVND(tip)}</strong>.`
              };
            }
          },
          {
            text: '🙏 Dạ mưa rào kẹt đèn đỏ hơi lâu một chút, mong anh/chị thông cảm giúp em nhé',
            effect: () => ({
              tip: 5,
              rating: 0.04,
              reply: pickRandom([
                'Trời mưa chạy an toàn là trên hết bạn ơi, mình không vội đâu! Gửi bạn 5.000đ tiền tip nha!',
                'Mưa gió thế này tới nơi an toàn là mừng rồi, mình cho 5 sao liền nè!'
              ]),
              log: '🌧️ Khách hàng thông cảm vì trời mưa đường trơn, tặng +5.000đ tiền tip.'
            })
          }
        ]
      }
    );
  }

  // 2. KỊCH BẢN THEO THỜI GIAN: CA ĐÊM KHUYA (22h - 02h)
  if (isNight) {
    candidates.push(
      {
        conditionTag: '🌙 Khách đặt đồ ăn đêm khuya (Sau 22h00)',
        question: custKey === 'university'
          ? pickRandom([
              'Hơn 11h đêm rồi tụi mình đang thức cày đồ án môn Kinh tế chính trị đói meo! Cổng KTX khóa rồi, anh đưa túi đồ ăn qua khe cổng sắt giúp em với!',
              'May quá đêm khuya vẫn có anh nhận đơn trà sữa cứu đói phòng KTX tụi em! Anh nói nhỏ kẻo bác bảo vệ KTX thức giấc nha!'
            ])
          : pickRandom([
              'Khuya rồi mà anh vẫn còn chạy ngoài đường vất vả quá! Nhà em có em bé đang ngủ nên anh giao nhẹ tay ở cổng giúp em nhé!',
              'Đêm hôm đặt đồ ăn khuya cứกลัว không có tài xế nhận. Cảm ơn anh giao tới nhanh nha, đường khuya vắng chạy cẩn thận nhé anh!'
            ]),
        options: [
          {
            text: '🤫 Dạ em tắt máy xe từ đầu ngõ và đưa nhẹ nhàng để không làm ồn mọi người nghỉ đêm ạ!',
            effect: () => {
              const tip = pickRandom([5, 10, 15]);
              return {
                tip,
                rating: 0.06,
                reply: pickRandom([
                  `Anh tinh tế quá trời! Em gửi thêm ${formatVND(tip)} bồi dưỡng ca đêm vào Ví cho anh nhé!`,
                  `Cảm ơn anh nhiều nha! Chúc anh chạy nốt ca đêm bình an, em vừa tip thêm ${formatVND(tip)} trên App đó!`
                ]),
                log: `🌙 <strong>Giao hàng ca đêm tinh tế:</strong> Tắt máy dắt bộ vào ngõ khuya, được khách thưởng thêm <strong>+${formatVND(tip)}</strong>!`
              };
            }
          },
          {
            text: '🥱 Dạ chạy từ sáng tới khuya buồn ngủ ríu mắt mà ráng kiếm thêm tiền đóng trọ anh/chị ạ!',
            effect: () => ({
              tip: 10,
              energy: 5,
              rating: 0.05,
              reply: pickRandom([
                'Tội nghiệp anh ghê, cầm lấy lon cà phê sữa trong nhà em với 10.000đ tiền tip cho tỉnh táo chạy về nghỉ nha!',
                'Cố lên anh ơi! Em gửi thêm 10.000đ tiền tip và đánh giá 5 sao đầy đủ cho anh rồi nhé!'
              ]),
              log: '🌙 Khách ca đêm tặng lon cà phê (+5% thể lực) và +10.000đ tiền tip động viên.'
            })
          }
        ]
      }
    );
  }

  // 3. KỊCH BẢN THEO GIỜ CAO ĐIỂM HOẶC ĐƠN GHÉP
  if (isRushHour || isBatched) {
    candidates.push({
      conditionTag: isBatched ? '📦📦 Khách hỏi vì sao lộ trình vòng vèo (Đơn Ghép)' : '🔥 Khách chờ lâu vào Giờ Cao Điểm kẹt xe',
      question: pickRandom([
        'Ủa anh ơi, sao nãy giờ em nhìn trên bản đồ GPS thấy anh rẽ qua đường khác đứng đợi lâu vậy mới tới chỗ em? Đồ ăn có bị nguội không anh?',
        'Giờ nghỉ trưa công ty mình có 1 tiếng thôi mà đợi đơn hơi lâu đó nha! Đường kẹt xe hay do App ghép đơn vậy bạn?'
      ]),
      options: [
        {
          text: '🙏 Dạ giờ cao điểm ngã tư đèn đỏ kẹt cứng với App ghép đơn, nhưng em giữ kỹ trong túi cách nhiệt nên vẫn nóng ạ!',
          effect: () => ({
            tip: Math.random() < 0.5 ? 5 : 0,
            rating: 0.03,
            reply: pickRandom([
              'À ừ mở ra thấy vẫn còn nóng hổi thật! Thôi mình thông cảm cho shipper giờ cao điểm, vẫn chấm 5 sao nha!',
              'Ra là do thuật toán App ghép đơn à, thôi không phải lỗi của bạn, mình nhận hàng và gửi thêm 5.000đ uống nước nhé!'
            ]),
            log: '🗣️ <strong>Lao động cảm xúc giờ cao điểm:</strong> Giải thích khéo léo giúp khách hiểu áp lực kẹt xe & đơn ghép của thuật toán.'
          })
        },
        {
          text: '😓 Dạ quán làm món lâu quá chứ em lấy xong là phóng hết ga trên đường tới liền đó ạ!',
          effect: () => (Math.random() < 0.3
            ? {
                rating: -0.05,
                reply: 'Biết là quán đông nhưng chờ lâu mình bị trễ giờ họp chiều rồi... Thôi đưa mình lẹ nha.',
                log: '⚠️ Khách bực dọc vì chờ lâu giờ cao điểm: dù lỗi do quán đông và kẹt xe nhưng tài xế bị giảm -0.05 ⭐.'
              }
            : {
                rating: 0.02,
                reply: 'Ừ giờ ăn trưa quán nào cũng quá tải hết, cảm ơn bạn đã cố gắng giao nhanh nhé!',
                log: '✅ Khách thông cảm cho tình trạng quá tải giờ cao điểm.'
              })
        }
      ]
    });
  }

  // 4. KỊCH BẢN ĐẶC TRƯNG THEO TỪNG ĐỊA ĐIỂM (KTX ĐẠI HỌC, BỆNH VIỆN, NHÀ PHỐ HẺM, CHUNG CƯ)
  if (custKey === 'university') {
    candidates.push({
      conditionTag: '🏫 Giao hàng tại Cổng Ký Túc Xá Đại Học (Khu 1)',
      question: pickRandom([
        'Em chào anh shipper! Tụi em vừa tan ca học ở giảng đường chạy ù ra cổng KTX nhận đơn nè, tiền lẻ tụi em góp sẵn đủ 100% luôn rồi ạ!',
        'Anh ơi đơn trà sữa này phòng tụi em góp tiền đặt chung, anh chờ 30 giây bạn em chạy xuống lấy liền nha, nắng quá mời anh đứng vào bóng cây cổng trường ạ!'
      ]),
      options: [
        {
          text: '🎓 Cảm ơn các bạn sinh viên dễ thương nha, chúc các em học tốt thi đạt điểm A+ nhé!',
          effect: () => ({
            tip: 5,
            rating: 0.06,
            reply: pickRandom([
              'Dạ tụi em cảm ơn lời chúc của anh! Tụi em gửi dư thêm 5.000đ mời anh ly trà đá và thả 5 sao tim đỏ trên App nha!',
              'Anh shipper vui tính ghê! Phòng em chấm 5 sao full điểm dịch vụ cho anh liền!'
            ]),
            log: '🧑‍🎓 Giao đơn tại KTX Đại Học: Sinh viên thân thiện, tặng +5.000đ uống trà đá và đánh giá 5 ⭐.'
          })
        },
        {
          text: '📱 Đưa hàng nhanh gọn để các bạn kịp vào lớp học ca tiếp theo',
          effect: () => ({
            rating: 0.04,
            reply: 'Nhanh gọn lẹ quá, cảm ơn anh shipper nhiều nha!',
            log: '✅ Giao đơn nhanh chóng tại cổng trường Đại học (+0.04 ⭐).'
          })
        }
      ]
    });
  } else if (custKey === 'hospital') {
    candidates.push({
      conditionTag: '🏥 Giao đồ ăn dinh dưỡng tại Cổng Bệnh Viện Đa Khoa (Khu 5)',
      question: pickRandom([
        'Cảm ơn bạn giao cháo nóng tới kịp giờ cho người nhà mình uống thuốc nhé! Cổng bệnh viện đông xe cứu thương, bạn đỗ xe ở vịnh [P] có vất vả không?',
        'Mình đang trực ca cấp cứu không rời khoa lâu được, may mà bạn chạy đúng làn đường tới điểm hẹn cổng viện đúng giờ!'
      ]),
      options: [
        {
          text: '💖 Dạ không vất vả gì đâu ạ, chúc người nhà mình mau khỏe / chúc bác sĩ ca trực thuận lợi nhé!',
          effect: () => ({
            tip: 10,
            rating: 0.07,
            reply: pickRandom([
              'Cảm ơn lời chúc ấm áp của bạn! Mình gửi thêm 10.000đ tiền tip cảm ơn tấm lòng của bạn nhé!',
              'Nghe bạn chúc mà ấm lòng quá, gửi bạn thêm 10.000đ uống nước cam giữ sức khỏe chạy xe nha!'
            ]),
            log: '🏥 <strong>Giao đơn tại Bệnh Viện:</strong> Lời chúc ấm áp giúp người bệnh/bác sĩ vui lòng, nhận <strong>+10.000đ tip</strong> & +0.07 ⭐.'
          })
        },
        {
          text: '🥣 Dạ em giữ kỹ phần cháo/phở không bị đổ giọt nào, gửi anh/chị kiểm tra ạ',
          effect: () => ({
            tip: 5,
            rating: 0.05,
            reply: 'Đóng gói còn nguyên vẹn sạch sẽ lắm, cảm ơn bạn nhiều, mình gửi thêm 5.000đ tiền lẻ nhé!',
            log: '✅ Giao đồ ăn nóng hổi an toàn tại Bệnh viện (+5.000đ tip).'
          })
        }
      ]
    });
  } else if (custKey === 'customerB') {
    candidates.push({
      conditionTag: '🏢 Giao hàng tại Sảnh Chung Cư Cao Cấp B (Khu 5)',
      question: pickRandom([
        'Mình đang họp online trên tầng 18 chung cư, bạn đặt đồ ăn lên kệ lễ tân sảnh G rồi chụp ảnh gửi qua App giúp mình nhé! Phụ phí chung cư mình trả đủ trên App rồi đó!',
        'Chào bạn, chung cư mình bảo vệ kiểm soát lối vào hơi kỹ, cảm ơn bạn đã đỗ đúng vịnh [P] trước sảnh chờ mình xuống lấy nha!'
      ]),
      options: [
        {
          text: '📸 Đặt ngay ngắn tại kệ Sảnh G, ghi chú số phòng & chụp ảnh báo khách qua App',
          effect: () => {
            const tip = pickRandom([5, 10]);
            return {
              tip,
              rating: 0.05,
              reply: pickRandom([
                `Đã thấy ảnh xác nhận rõ nét trên App! Mình bấm tip thêm ${formatVND(tip)} vào Ví cho bạn luôn rồi nhé!`,
                `Chuyên nghiệp quá, cảm ơn bạn! Mình gửi tặng thêm ${formatVND(tip)} tiền gửi xe & uống nước nha!`
              ]),
              log: `🏢 Giao đơn Chung cư cao cấp: Quy trình chuyên nghiệp, khách tip qua App <strong>+${formatVND(tip)}</strong>.`
            };
          }
        },
        {
          text: '🤝 Gửi trực tiếp tận tay khách vừa xuống sảnh bằng hai tay lịch sự',
          effect: () => ({
            tip: 10,
            rating: 0.06,
            reply: 'Lịch sự và đúng giờ lắm! Mình gửi thêm 10.000đ tiền tip và đánh giá 5 sao nha!',
            log: '⭐ Khách hàng chung cư hài lòng tuyệt đối, thưởng +10.000đ tip.'
          })
        }
      ]
    });
  } else {
    // customerA - Nhà phố hẻm dân cư
    candidates.push({
      conditionTag: '🏠 Giao hàng tận cửa Nhà Phố Khu Dân Cư (Khu 4)',
      question: pickRandom([
        'Trời nắng gắt quá mà em tìm địa chỉ nhà chị nhanh ghê! Tiền đơn chị trả đủ đây, gửi em thêm 5.000đ tiền lẻ uống nước mía đầu ngõ nhé!',
        'Cảm ơn chú shipper nghen, nhà cô ở trong khu dân cư này nhiều số nhà xẹt quá mà chú chạy đúng đường tới tận cổng luôn!'
      ]),
      options: [
        {
          text: '🙏 Dạ em cảm ơn chị/cô nhiều ạ! Tiền tip 5.000đ bằng nửa tiền lời cuốc xe rồi!',
          effect: () => ({
            tip: 5,
            rating: 0.05,
            reply: pickRandom([
              'Chị vừa bấm 5 sao trên App cho em luôn rồi đó, chạy xe ngoài nắng nhớ giữ sức khỏe nha!',
              'Thương mấy đứa chạy ship nắng nôi cực khổ, cầm lấy uống ly nước mát rồi chạy tiếp nghen con!'
            ]),
            log: '💵 <strong>Khách nhà phố tip +5.000đ:</strong> Khoản tiền thưởng trực tiếp vào Ví không bị sàn cắt 27.2%!'
          })
        },
        {
          text: '😊 Cảm ơn gia đình mình nhiều ạ, chúc cả nhà dùng bữa ngon miệng nhé!',
          effect: () => ({
            tip: 10,
            rating: 0.06,
            reply: 'Khéo miệng dễ thương quá, thôi chị gửi hẳn 10.000đ tiền bo luôn nè!',
            log: '⭐ Khách hàng quý mến sự niềm nở của tài xế, thưởng nóng +10.000đ!'
          })
        }
      ]
    });
  }

  return pickRandom(candidates);
};

// --- DANH SÁCH 5 KHU VỰC & CHỨC NĂNG CHI PHÍ THỰC TẾ VIỆT NAM ---
const ZONE_ROLES_INFO = [
  { id: 'zone1', title: 'Khu 1: Phố Ẩm Thực & ĐH', role: '👩‍🍳 Chủ Quán & 🧑‍🎓 KTX (+0đ)', desc: 'Lấy Cơm tấm/Phở (ứng COD 45k-65k), giao đơn KTX Sinh viên (cước ưu đãi).', targetKey: 'restaurant', color: '#f59e0b' },
  { id: 'zone2', title: 'Khu 2: Ăn Vặt & Trạm Xăng', role: '⛽ Xăng RON95 & Nhớt Xe', desc: 'Đổ xăng RON 95 (23.500đ/L) & thay nhớt/bảo dưỡng xe (trung bình ~1.250đ/km).', targetKey: 'gasStation', color: '#ec4899' },
  { id: 'zone3', title: 'Khu 3: Trà Đá, CSGT & Công Đoàn', role: '☕ Trà Đá 0đ • 🚨 CSGT • 🤝 Hội Quán', desc: 'Uống trà đá miễn phí, coi chừng CSGT phạt vượt đèn (150k), Hội Quán hồi 5⭐.', targetKey: 'unionHub', color: '#10b981' },
  { id: 'zone4', title: 'Khu 4: Công Viên & Dân Cư', role: '🏪 Bò Húc 12k & 🙋‍♀️ Hẻm (+2k)', desc: 'Ghé Tiện Lợi 24h mua Bò Húc (-12.000đ) hồi nhanh thể lực, giao đơn hẻm (+2.000đ).', targetKey: 'customerA', color: '#22c55e' },
  { id: 'zone5', title: 'Khu 5: Đô Thị Công Nghệ Cao', role: '🏢 Sàn AI • 🏥 Viện (+3.5k) • Chung Cư (+4.5k)', desc: 'Trụ sở Sàn thu 27.2%, phụ phí giao xa Bệnh Viện (+3.5k) & Chung Cư B (+4.5k).', targetKey: 'platformHQ', color: '#8b5cf6' }
];

export default function GigEconomy2D() {
  const canvasRef = useRef(null);

  // --- TRẠNG THÁI APP SHIPPER & VÍ TÀI XẾ THỰC TẾ VIỆT NAM ---
  const [appOnline, setAppOnline] = useState(true);
  const [incomingOrder, setIncomingOrder] = useState(null);
  const [walletDeposit] = useState(300);

  // --- TRẠNG THÁI TÀI XẾ ---
  const [energy, setEnergy] = useState(100);
  const [driverWage, setDriverWage] = useState(50);
  const [driverCost, setDriverCost] = useState(0);
  const [unpaidWearCost, setUnpaidWearCost] = useState(0);
  const [totalKmDriven, setTotalKmDriven] = useState(0);
  const [completedOrders, setCompletedOrders] = useState(0);
  const [rating, setRating] = useState(4.95);
  const [acceptanceRate, setAcceptanceRate] = useState(96);
  const [tier] = useState('Vàng');
  const [questOrders, setQuestOrders] = useState(0);
  const [bikeHealth, setBikeHealth] = useState(100);

  // --- TRẠNG THÁI CHỦ NỀN TẢNG ---
  const [platformCutRate, setPlatformCutRate] = useState(0.272);
  const [surplusM, setSurplusM] = useState(0);
  const [algoSpeed, setAlgoSpeed] = useState(1.0);
  const [algoLevel, setAlgoLevel] = useState(1);
  const [droneCount, setDroneCount] = useState(0);

  // --- TRẠNG THÁI ĐƠN HÀNG HIỆN TẠI (CÓ PHỤ PHÍ THỜI TIẾT, THỜI GIAN, ĐỊA ĐIỂM) ---
  const [currentOrder, setCurrentOrder] = useState({
    name: '🍛 Cơm Tấm Sườn Bì Chả Trứng',
    distance: 2.8,
    codFoodPrice: 55,
    baseKmFee: 18.5,
    weatherSurge: 0,
    timeSurge: 0,
    locationSurge: 2.0,
    locationTag: 'Hẻm Sâu Dân Cư (+2.000đ)',
    price: 20.5,
    vehicleCost: 3.8,
    shopKey: 'restaurant',
    shopLabel: 'Quán Cơm Phở (Khu 1)',
    custKey: 'customerA',
    custLabel: 'Nhà Khách Hàng A (Khu 4)'
  });

  // --- ĐIỀU KIỆN THỜI TIẾT, THỜI GIAN & THỊ TRƯỜNG ---
  const [gasCrisis, setGasCrisis] = useState(false);
  const [isBatchedOrder, setIsBatchedOrder] = useState(false);
  const [isStrike, setIsStrike] = useState(false);
  const [isNight, setIsNight] = useState(false);
  const [isRushHour, setIsRushHour] = useState(false);
  const [weather, setWeather] = useState('clear'); // 'clear' | 'rain' | 'storm'
  const [autoDispatch, setAutoDispatch] = useState(false);

  const [hasFood, setHasFood] = useState(false);
  const [missionState, setMissionState] = useState('idle');
  const [shopDialog, setShopDialog] = useState(null);
  const [customerDialog, setCustomerDialog] = useState(null);
  const [activeZoneTab, setActiveZoneTab] = useState(null);

  const [logList, setLogList] = useState([
    '🌦️ <strong>GIÁ ĐƠN & HỘI THOẠI THEO THỜI TIẾT • THỜI GIAN • ĐỊA ĐIỂM:</strong> Cước đơn tự động cộng phụ phí khi Mưa rào (+5k), Mưa bão (+12k), Giờ cao điểm (+4k), Ca đêm (+7k) và Khu vực xa (+2k đến +4.5k)!',
    '🗣️ Khi giao hàng tới nơi, <strong>Người nhận hàng sẽ hỏi thăm & phản hồi ngẫu nhiên</strong> khớp với trời mưa/nắng, đêm khuya/cao điểm và địa điểm nhận (KTX, Bệnh viện, Chung cư, Nhà hẻm).'
  ]);

  const displayOrder = incomingOrder || currentOrder;
  const currentPrice = displayOrder.price;
  const currentCost = displayOrder.vehicleCost;
  const currentSurplusM = +(currentPrice * platformCutRate).toFixed(1);
  const currentGrossDriver = +(currentPrice - currentSurplusM).toFixed(1);
  const currentWageV = Math.max(0, +(currentPrice - currentSurplusM - currentCost).toFixed(1));
  const surplusRate = currentWageV > 0 ? ((currentSurplusM / currentWageV) * 100).toFixed(1) : '∞';

  const gameRef = useRef({
    appOnline: true,
    walletDeposit: 300,
    energy: 100,
    driverWage: 50,
    driverCost: 0,
    unpaidWearCost: 0,
    totalKmDriven: 0,
    completedOrders: 0,
    rating: 4.95,
    acceptanceRate: 96,
    bikeHealth: 100,
    platformCutRate: 0.272,
    surplusM: 0,
    algoSpeed: 1.0,
    algoLevel: 1,
    currentOrder,
    gasCrisis: false,
    weather: 'clear',
    isNight: false,
    isRushHour: false,
    autoDispatch: false,
    isStrike: false,
    isBatchedOrder: false,
    missionState: 'idle',
    targetPrice: 20.5,
    targetCost: 3.8,
    targetDrain: 8,
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
      unpaidWearCost,
      totalKmDriven,
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
      isRushHour,
      autoDispatch,
      isStrike,
      isBatchedOrder,
      missionState,
      targetPrice: gameRef.current.targetPrice || currentOrder.price,
      targetCost: gameRef.current.targetCost || currentOrder.vehicleCost,
      targetDrain: gameRef.current.targetDrain || 8,
      hasFood
    };
  }, [appOnline, walletDeposit, energy, driverWage, driverCost, unpaidWearCost, totalKmDriven, completedOrders, rating, acceptanceRate, bikeHealth, platformCutRate, surplusM, algoSpeed, algoLevel, currentOrder, gasCrisis, weather, isNight, isRushHour, autoDispatch, isStrike, isBatchedOrder, missionState, hasFood]);

  const addLog = (msg) => {
    setLogList(prev => [msg, ...prev.slice(0, 5)]);
  };

  const SHOP_LABELS = {
    restaurant: 'Quán Cơm Phở (Khu 1)',
    milkTeaShop: 'Trà Sữa & Bánh Mì (Khu 2)',
    pizzaShop: 'Pizza & Gà Rán (Khu 2 Nam)'
  };

  const CUST_LABELS = {
    university: 'Đại Học & KTX (Khu 1 Nam)',
    hospital: 'Bệnh Viện Đa Khoa (Khu 5)',
    customerA: 'Nhà Khách Hàng A (Khu 4)',
    customerB: 'Chung Cư Khách B (Khu 5 Nam)'
  };

  // --- TÍNH GIÁ ĐƠN HÀNG ĐỘNG THEO THỜI TIẾT + THỜI GIAN + ĐỊA ĐIỂM ---
  const generateRandomOrder = (forcedNight = false, isBatched = false) => {
    const template = RANDOM_ORDER_TYPES[Math.floor(Math.random() * RANDOM_ORDER_TYPES.length)];
    const distNoise = +(Math.random() * 1.2 - 0.5).toFixed(1);
    const baseDist = Math.max(1.2, +(template.baseDist + distNoise).toFixed(1));
    const finalDist = isBatched ? +(baseDist * 1.45).toFixed(1) : baseDist;

    const shopKey = template.shopKey;
    const custKey = isBatched ? 'customerB' : template.custKeys[Math.floor(Math.random() * template.custKeys.length)];

    // 1. Cước gốc theo cự ly km (2km đầu 15.000đ + 4.200đ/km tiếp theo)
    let baseKmFee = 15.0 + Math.max(0, finalDist - 2.0) * 4.2;
    if (isBatched) {
      baseKmFee = 15.0 + Math.max(0, baseDist - 2.0) * 4.2 + 6.5;
    }
    baseKmFee = +(Math.round(baseKmFee * 2) / 2).toFixed(1);

    // 2. Phụ phí Thời Tiết (Weather Surge)
    const wState = gameRef.current.weather;
    let weatherSurge = 0;
    if (wState === 'rain') weatherSurge = 5.0;   // Mưa rào: +5.000đ
    if (wState === 'storm') weatherSurge = 12.0; // Mưa bão ngập nước: +12.000đ

    // 3. Phụ phí Thời Gian (Time Surge: Ca đêm hoặc Giờ cao điểm)
    const nightActive = forcedNight || gameRef.current.isNight;
    const rushActive = gameRef.current.isRushHour;
    let timeSurge = 0;
    if (nightActive) timeSurge += 7.0; // Ca đêm khuya: +7.000đ
    if (rushActive) timeSurge += 4.0;  // Giờ cao điểm trưa/tối: +4.000đ

    // 4. Phụ phí Địa Điểm Giao Hàng (Location Surge)
    const locInfo = LOCATION_SURGE[custKey] || { fee: 0, tag: 'Tiêu chuẩn (+0đ)' };
    const locationSurge = locInfo.fee;

    const totalShippingFee = +(baseKmFee + weatherSurge + timeSurge + locationSurge).toFixed(1);

    // 5. Chi phí xăng RON95 + nhớt + khấu hao xe (tăng thêm khi mưa bão hoặc kẹt xe giờ cao điểm)
    const realKmDriven = finalDist + 0.8;
    let costPerKm = 1.25;
    if (gameRef.current.gasCrisis) costPerKm += 0.5;
    if (wState === 'storm' || rushActive) costPerKm += 0.25; // Ngập nước/kẹt xe tốn xăng hơn
    const vehicleCost = +(realKmDriven * costPerKm).toFixed(1);

    return {
      name: isBatched ? `[Ghép 2 Đơn] ${template.name}` : template.name,
      distance: finalDist,
      realKm: +realKmDriven.toFixed(1),
      codFoodPrice: isBatched ? template.codFoodPrice * 2 : template.codFoodPrice,
      baseKmFee,
      weatherSurge,
      timeSurge,
      locationSurge,
      locationTag: locInfo.tag,
      price: totalShippingFee,
      vehicleCost,
      shopKey,
      shopLabel: SHOP_LABELS[shopKey],
      custKey,
      custLabel: CUST_LABELS[custKey],
      isNightShift: nightActive
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
      restaurant:   { x: 25,  y: 30,  w: 120, h: 75, parkX: 85,  parkY: 120, aveY: 155, emoji: '🍜', label: 'Quán Cơm Phở', color: '#f59e0b', sub: '👩‍🍳 Ứng COD 45-65k' },
      milkTeaShop:  { x: 220, y: 30,  w: 115, h: 75, parkX: 277, parkY: 120, aveY: 155, emoji: '🧋', label: 'Trà Sữa & Bánh Mì', color: '#ec4899', sub: '🧑‍🍳 Ứng COD 25-45k' },
      teaStall:     { x: 410, y: 30,  w: 115, h: 75, parkX: 467, parkY: 120, aveY: 155, emoji: '☕', label: 'Trà Đá Vỉa Hè', color: '#10b981', sub: 'Miễn phí 0đ (+Sức)' },
      park:         { x: 600, y: 30,  w: 115, h: 75, parkX: 657, parkY: 120, aveY: 155, emoji: '🌳', label: 'Công Viên Shipper', color: '#22c55e', sub: 'Nghỉ trưa 0đ' },
      platformHQ:   { x: 790, y: 22,  w: 125, h: 83, parkX: 852, parkY: 120, aveY: 155, emoji: '🏢', label: 'AI Platform (m)', color: '#8b5cf6', sub: 'Thu 27.2% mỗi đơn' },

      gasStation:   { x: 25,  y: 235, w: 120, h: 75, parkX: 85,  parkY: 328, aveY: 365, emoji: '⛽', label: 'Cây Xăng RON95', color: '#d97706', sub: '23.5k/L & Thay nhớt' },
      logisticsHub: { x: 220, y: 235, w: 115, h: 75, parkX: 277, parkY: 328, aveY: 365, emoji: '📦', label: 'Tiệm Sửa Xe Máy', color: '#ea580c', sub: 'Vá lốp/Bảo dưỡng (c)' },
      policePoint:  { x: 410, y: 235, w: 115, h: 75, parkX: 467, parkY: 328, aveY: 365, emoji: '🚨', label: 'Chốt CSGT Ngã Tư', color: '#ef4444', sub: 'Vượt đèn phạt 150k' },
      convenience:  { x: 600, y: 235, w: 115, h: 75, parkX: 657, parkY: 328, aveY: 365, emoji: '🏪', label: 'Circle K / 24h', color: '#06b6d4', sub: 'Bò Húc 12.000đ/lon' },
      hospital:     { x: 790, y: 235, w: 125, h: 75, parkX: 852, parkY: 328, aveY: 365, emoji: '🏥', label: 'Bệnh Viện Đa Khoa', color: '#f43f5e', sub: '👩‍⚕️ Phụ phí +3.500đ' },

      university:   { x: 25,  y: 445, w: 120, h: 75, parkX: 85,  parkY: 405, aveY: 365, emoji: '🏫', label: 'Đại Học & KTX', color: '#3b82f6', sub: '🧑‍🎓 Sinh Viên (+0đ)' },
      pizzaShop:    { x: 220, y: 445, w: 115, h: 75, parkX: 277, parkY: 405, aveY: 365, emoji: '🍕', label: 'Pizza & Gà Rán', color: '#f97316', sub: '👨‍🍳 Ứng COD 95-185k' },
      unionHub:     { x: 410, y: 445, w: 115, h: 75, parkX: 467, parkY: 405, aveY: 365, emoji: '🤝', label: 'Hội Quán Shipper', color: '#10b981', sub: 'Công Đoàn hồi 5.0⭐' },
      customerA:    { x: 600, y: 445, w: 115, h: 75, parkX: 657, parkY: 405, aveY: 365, emoji: '🏠', label: 'Nhà Khách Hàng A', color: '#06b6d4', sub: '🙋‍♀️ Hẻm (+2.000đ)' },
      customerB:    { x: 790, y: 445, w: 125, h: 75, parkX: 852, parkY: 405, aveY: 365, emoji: '🏢', label: 'Chung Cư Khách B', color: '#8b5cf6', sub: '🧑‍💼 Xa (+4.500đ)' }
    };
    gameRef.current.map = map;

    const AVE_YS = [155, 365];
    const STREET_XS = [185, 375, 565, 755];

    const isOnDrivableRoad = (px, py) => {
      if (py >= 115 && py <= 192) return true;
      if (py >= 324 && py <= 410) return true;
      for (const sx of STREET_XS) {
        if (px >= sx - 28 && px <= sx + 28 && py >= 12 && py <= 545) return true;
      }
      for (const lm of Object.values(map)) {
        const minY = Math.min(lm.parkY, lm.aveY) - 6;
        const maxY = Math.max(lm.parkY, lm.aveY) + 6;
        if (px >= lm.parkX - 28 && px <= lm.parkX + 28 && py >= minY && py <= maxY) {
          return true;
        }
      }
      return false;
    };

    const buildRoadPath = (startX, startY, destX, destY, forcedAveY = null) => {
      const pts = [];
      const addPt = (x, y) => {
        const rx = Math.round(x);
        const ry = Math.round(y);
        if (pts.length === 0 || Math.hypot(pts[pts.length - 1].x - rx, pts[pts.length - 1].y - ry) > 4) {
          pts.push({ x: rx, y: ry });
        }
      };

      const targetAveY = forcedAveY || (Math.abs(destY - 155) < Math.abs(destY - 365) ? 155 : 365);
      const currentVertX = STREET_XS.find(sx => Math.abs(startX - sx) <= 26);
      const startAveY = Math.abs(startY - 155) < Math.abs(startY - 365) ? 155 : 365;

      if (currentVertX !== undefined && Math.abs(startY - startAveY) > 22) {
        addPt(currentVertX, startY);
        addPt(currentVertX, targetAveY);
        addPt(destX, targetAveY);
        addPt(destX, destY);
        return pts;
      }

      addPt(startX, startAveY);

      if (startAveY === targetAveY) {
        addPt(destX, targetAveY);
        addPt(destX, destY);
      } else {
        let bestSx = STREET_XS[0];
        let bestDist = Infinity;
        for (const sx of STREET_XS) {
          const d = Math.abs(startX - sx) + Math.abs(sx - destX);
          if (d < bestDist) {
            bestDist = d;
            bestSx = sx;
          }
        }
        addPt(bestSx, startAveY);
        addPt(bestSx, targetAveY);
        addPt(destX, targetAveY);
        addPt(destX, destY);
      }

      return pts;
    };

    const lerpAngle = (curr, target, factor = 0.25) => {
      let diff = target - curr;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      return curr + diff * factor;
    };

    const aiShippers = [
      { x: 80,  y: 155, vx: 2.2, vy: 0, color: '#22c55e', brand: 'Grab' },
      { x: 850, y: 175, vx: -2.0, vy: 0, color: '#f97316', brand: 'Shopee' },
      { x: 100, y: 370, vx: 2.1, vy: 0, color: '#eab308', brand: 'Be' },
      { x: 820, y: 390, vx: -2.3, vy: 0, color: '#ef4444', brand: 'XanhSM' },
      { x: 375, y: 60,  vx: 0, vy: 1.8, color: '#06b6d4', brand: 'Ahamove' },
      { x: 565, y: 500, vx: 0, vy: -1.9, color: '#10b981', brand: 'Grab' }
    ];

    const pedestrians = [
      { x: 185, y: 120, vy: 0.6, miny: 105, maxy: 200 },
      { x: 755, y: 190, vy: -0.5, miny: 110, maxy: 205 },
      { x: 375, y: 335, vy: 0.6, miny: 320, maxy: 415 },
      { x: 565, y: 405, vy: -0.5, miny: 325, maxy: 420 }
    ];

    const bike = {
      x: 375, y: 155,
      waypoints: [],
      angle: 0, speed: 3.8
    };
    gameRef.current.bike = bike;

    const navigateBikeTo = (destX, destY, aveY = null) => {
      bike.waypoints = buildRoadPath(bike.x, bike.y, destX, destY, aveY);
    };

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
      const mVal = +(orderPriceVal * gameRef.current.platformCutRate).toFixed(1);
      const driverGross = +(orderPriceVal - mVal + tipVal).toFixed(1);

      for (let i = 0; i < 7; i++) {
        particles.push({
          x: startX, y: startY,
          targetX: 80, targetY: 15,
          color: '#10b981', text: i === 0 ? `+${formatVND(driverGross)} vào Ví` : null,
          progress: 0, speed: 0.025 + Math.random() * 0.015
        });
      }
      for (let i = 0; i < 7; i++) {
        particles.push({
          x: startX, y: startY,
          targetX: map.platformHQ.x + 50, targetY: map.platformHQ.y + 20,
          color: '#8b5cf6', text: i === 0 ? `-${formatVND(mVal)} (Sàn cắt)` : null,
          progress: 0, speed: 0.02 + Math.random() * 0.015
        });
      }
    };

    const spawnRepairCash = (startX, startY, repairCost) => {
      for (let i = 0; i < 6; i++) {
        particles.push({
          x: startX, y: startY,
          targetX: map.gasStation.x + 50, targetY: map.gasStation.y + 30,
          color: '#d97706', text: i === 0 ? `-${formatVND(repairCost)} (Xăng/Nhớt c)` : null,
          progress: 0, speed: 0.025 + Math.random() * 0.015
        });
      }
    };

    const keys = { w: false, s: false, a: false, d: false };
    const onKD = (e) => {
      const k = e.key.toLowerCase();
      if (['w', 'arrowup', 's', 'arrowdown', 'a', 'arrowleft', 'd', 'arrowright'].includes(k)) {
        bike.waypoints = [];
      }
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

    window.__driveToLandmark = (key) => {
      const lm = map[key];
      if (!lm) return;
      navigateBikeTo(lm.parkX, lm.parkY, lm.aveY);
      addLog(`🛵 Đang chạy theo làn đường & bo cua tới điểm đỗ <strong>${lm.emoji} ${lm.label}</strong>...`);
    };

    const onCanvasClick = (e) => {
      if (gameRef.current.isStrike) {
        addLog('⚠️ Tài xế đang đình công! Hãy bấm "Dừng bãi công" để mở lại ứng dụng.');
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      for (const [key, lm] of Object.entries(map)) {
        if (cx >= lm.x && cx <= lm.x + lm.w && cy >= lm.y && cy <= lm.y + lm.h) {
          navigateBikeTo(lm.parkX, lm.parkY, lm.aveY);
          if (['restaurant', 'milkTeaShop', 'pizzaShop'].includes(key) && gameRef.current.missionState === 'idle') {
            window.__ringOrder(false, key);
          } else {
            addLog(`🛣️ Đang chạy theo lộ trình đường phố tới <strong>${lm.emoji} ${lm.label}</strong> (${lm.sub})...`);
          }
          return;
        }
      }

      let validX = cx;
      let validY = cy;
      if (!isOnDrivableRoad(validX, validY)) {
        const nearAve = Math.abs(cy - 155) < Math.abs(cy - 365) ? 155 : 365;
        validY = nearAve;
      }
      navigateBikeTo(validX, validY);
    };
    canvas.addEventListener('click', onCanvasClick);

    // --- BƯỚC 0: NỔ ĐƠN NGẪU NHIÊN TRÊN APP (TÍNH PHỤ PHÍ THỜI TIẾT, THỜI GIAN, ĐỊA ĐIỂM) ---
    window.__ringOrder = (isNightShift = false, forcedShopKey = null) => {
      if (gameRef.current.isStrike) {
        addLog('✊ Tài xế đang đình công tắt app! Nền tảng bị tê liệt hoàn toàn.');
        return;
      }
      if (!gameRef.current.appOnline) {
        addLog('📴 Bạn đang TẮT APP (Offline)! Hãy gạt nút "BẬT APP" trên điện thoại để nhận đơn mới.');
        return;
      }
      if (gameRef.current.energy < (isNightShift ? 12 : 8)) {
        addLog('🛑 Tài xế kiệt sức! Hãy ghé Trà Đá Vỉa Hè ☕ (0đ), Công Viên 🌳 hoặc Circle K 🏪 (Bò Húc 12.000đ) để hồi phục.');
        return;
      }
      if (gameRef.current.bikeHealth <= 15) {
        addLog('🛠️ Xe máy cạn xăng / khô nhớt! Cần ghé Cây Xăng RON95 ⛽ để đổ xăng & bảo dưỡng trước khi chạy tiếp.');
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

      const surgeParts = [];
      if (newOrder.weatherSurge > 0) surgeParts.push(`Thời tiết +${formatVND(newOrder.weatherSurge)}`);
      if (newOrder.timeSurge > 0) surgeParts.push(`Thời gian +${formatVND(newOrder.timeSurge)}`);
      if (newOrder.locationSurge > 0) surgeParts.push(`Địa điểm +${formatVND(newOrder.locationSurge)}`);
      const surgeStr = surgeParts.length > 0 ? ` (Gồm phụ phí: ${surgeParts.join(', ')})` : ' (Không có phụ phí)';

      addLog(`📲 <strong>TING TING! Nổ đơn ${newOrder.distance} km:</strong> ${newOrder.name} → Giao tới <strong>${newOrder.custLabel}</strong> • Tổng cước: <strong>${formatVND(newOrder.price)}</strong>${surgeStr}!`);

      clearTimeout(gameRef.current.ringTimer);
      if (gameRef.current.autoDispatch) {
        gameRef.current.ringTimer = setTimeout(() => {
          if (window.__acceptIncomingOrder) window.__acceptIncomingOrder(newOrder);
        }, 1200);
      }
    };

    window.__dispatchOrder = (isNightShift = false) => {
      window.__ringOrder(isNightShift, null);
    };

    // --- BƯỚC 1: TÀI XẾ BẤM "NHẬN ĐƠN" TRÊN APP ---
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
      gameRef.current.targetDrain = Math.round((ord.distance * 1.8 + (ord.isNightShift ? 6 : 0)) * gameRef.current.algoSpeed);
      if (gameRef.current.weather === 'rain') gameRef.current.targetDrain += 4;
      if (gameRef.current.weather === 'storm') gameRef.current.targetDrain += 8;

      const pickShop = map[ord.shopKey] || map.restaurant;
      const dropSpot = map[ord.custKey] || map.customerA;
      gameRef.current.targetShop = pickShop;
      gameRef.current.targetCustomer = dropSpot;

      gameRef.current.missionState = 'to_restaurant';
      setMissionState('to_restaurant');
      navigateBikeTo(pickShop.parkX, pickShop.parkY, pickShop.aveY);
      bike.hasFood = false;
      setHasFood(false);

      addLog(`✅ <strong>Đã nhận đơn!</strong> Bước 1/2: Đang chạy dọc làn đường & bo cua tới điểm đỗ <strong>${pickShop.emoji} ${pickShop.label}</strong>...`);
    };

    window.__declineIncomingOrder = () => {
      clearTimeout(gameRef.current.ringTimer);
      setIncomingOrder(null);
      gameRef.current.incomingOrder = null;
      gameRef.current.missionState = 'idle';
      setMissionState('idle');
      setAcceptanceRate(r => Math.max(50, r - 5));
      addLog(`❌ <strong>Đã bỏ qua đơn:</strong> Bị hệ thống trừ -5% Tỷ lệ nhận đơn! (Dưới 80% sẽ mất quyền nhận thưởng mốc ngày).`);
    };

    // --- BƯỚC 2: TỚI ĐIỂM ĐỖ QUÁN GẶP CHỦ QUÁN ---
    const finishPickup = () => {
      gameRef.current.missionState = 'to_customer';
      setMissionState('to_customer');
      bike.hasFood = true;
      setHasFood(true);
      const drop = gameRef.current.targetCustomer || map.customerA;
      navigateBikeTo(drop.parkX, drop.parkY, drop.aveY);
      addLog(`📦 <strong>Đã nhận món!</strong> Bước 2/2: Đang chạy dọc theo đường phố & ôm cua tới <strong>${drop.emoji} ${drop.label}</strong> giao cho khách!`);
    };

    const openShopDialog = () => {
      if (gameRef.current.missionState !== 'to_restaurant') return;
      bike.waypoints = [];
      gameRef.current.missionState = 'at_shop';
      setMissionState('at_shop');
      const shop = gameRef.current.targetShop || map.restaurant;
      const shopKey = Object.keys(map).find(k => map[k] === shop) || 'restaurant';
      const npc = SHOP_NPCS[shopKey] || SHOP_NPCS.restaurant;
      const dlg = getDynamicShopDialog(gameRef.current);
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
        gameRef.current.driverWage = +(gameRef.current.driverWage + fx.wage).toFixed(1);
        setDriverWage(w => +(w + fx.wage).toFixed(1));
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

    // --- BƯỚC 3: TỚI ĐIỂM ĐỖ NHÀ KHÁCH -> KHÁCH HỎI & TRẢ LỜI THEO THỜI TIẾT / THỜI GIAN / ĐỊA ĐIỂM ---
    const openCustomerDialog = () => {
      if (gameRef.current.missionState !== 'to_customer') return;
      bike.waypoints = [];
      gameRef.current.missionState = 'at_customer';
      setMissionState('at_customer');
      const custSpot = gameRef.current.targetCustomer || map.customerA;
      const custKey = Object.keys(map).find(k => map[k] === custSpot) || 'customerA';
      const npc = CUSTOMER_NPCS[custKey] || CUSTOMER_NPCS.customerA;
      const dlg = getDynamicCustomerDialog(gameRef.current, custKey);
      setCustomerDialog({
        npc,
        custLabel: custSpot.label,
        conditionTag: dlg.conditionTag,
        question: dlg.question,
        options: dlg.options,
        reply: null
      });
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

      const ord = gameRef.current.currentOrder;
      const finalPrice = gameRef.current.targetPrice;
      const m = +(finalPrice * gameRef.current.platformCutRate).toFixed(1);
      const driverGross = +(finalPrice - m + tipBonus).toFixed(1);
      const tripWearCost = gameRef.current.targetCost;
      const realNetProfit = +(driverGross - tripWearCost).toFixed(1);

      const nextEnergy = Math.max(0, gameRef.current.energy - gameRef.current.targetDrain);
      const nextWage = +(gameRef.current.driverWage + driverGross).toFixed(1);
      const nextUnpaidWear = +(gameRef.current.unpaidWearCost + tripWearCost).toFixed(1);
      const nextKm = +(gameRef.current.totalKmDriven + (ord.realKm || ord.distance + 0.8)).toFixed(1);
      const nextSurplus = +(gameRef.current.surplusM + m).toFixed(1);
      const nextOrders = gameRef.current.completedOrders + (gameRef.current.isBatchedOrder ? 2 : 1);

      const wearPct = Math.min(22, Math.round(4 + (ord.distance || 3) * 1.5));
      const nextHealth = Math.max(0, gameRef.current.bikeHealth - wearPct);

      gameRef.current.energy = nextEnergy;
      gameRef.current.driverWage = nextWage;
      gameRef.current.unpaidWearCost = nextUnpaidWear;
      gameRef.current.totalKmDriven = nextKm;
      gameRef.current.surplusM = nextSurplus;
      gameRef.current.completedOrders = nextOrders;
      gameRef.current.bikeHealth = nextHealth;

      setEnergy(nextEnergy);
      setDriverWage(nextWage);
      setUnpaidWearCost(nextUnpaidWear);
      setTotalKmDriven(nextKm);
      setSurplusM(nextSurplus);
      setCompletedOrders(nextOrders);
      setBikeHealth(nextHealth);

      setQuestOrders(q => {
        const n = q + (gameRef.current.isBatchedOrder ? 2 : 1);
        if (n >= 10) {
          if (gameRef.current.acceptanceRate >= 85 && Math.random() < 0.7) {
            addLog('🎉 <strong>Đạt mốc 10 đơn/ngày:</strong> Nhận thưởng điểm chuyên cần <strong>+50.000đ</strong> vào Ví!');
            setDriverWage(w => +(w + 50).toFixed(1));
          } else {
            addLog('⚠️ <strong>Mất thưởng mốc 10 đơn (50.000đ):</strong> Do tỷ lệ nhận đơn thấp hoặc hệ thống ngưng nổ đơn sát giờ chốt ca!');
          }
          return 0;
        }
        return n;
      });

      spawnDeliveryCash(bike.x, bike.y, finalPrice, tipBonus);
      addLog(
        `💰 <strong>Xong cuốc ${ord.distance}km:</strong> Cước <strong>${formatVND(finalPrice)}</strong> ` +
        `| Sàn thu 27.2%: <strong style="color:#a78bfa">-${formatVND(m)}</strong> ` +
        `| Ví cộng: <strong style="color:#34d399">+${formatVND(driverGross)}</strong>${tipBonus > 0 ? ` (gồm tip ${formatVND(tipBonus)})` : ''} ` +
        `| Trừ xăng & hao mòn xe (~${formatVND(tripWearCost)}) → <strong>Thực lời ròng ${formatVND(realNetProfit)}!</strong>`
      );

      if (nextHealth <= 25) {
        addLog(`⚠️ <strong>Xe cạn xăng & dơ nhớt (${nextHealth}%):</strong> Hãy ghé ⛽ Cây Xăng RON95 để đổ xăng & thay nhớt!`);
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
      }, 1100);
    };

    window.__restDriver = () => {
      navigateBikeTo(map.teaStall.parkX, map.teaStall.parkY, map.teaStall.aveY);
      addLog('☕ Đang chạy theo làn đường tới Quán Trà Đá Vỉa Hè (miễn phí 0đ) để nghỉ ngơi.');
    };

    window.__repairBike = () => {
      navigateBikeTo(map.gasStation.parkX, map.gasStation.parkY, map.gasStation.aveY);
      addLog('⛽ Đang chạy theo làn đường vào Cây Xăng RON95 để đổ xăng & bảo dưỡng.');
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

      ctx.font = 'bold 9px system-ui';
      ctx.fillStyle = '#f59e0b99'; ctx.textAlign = 'center'; ctx.fillText('🍜 KHU 1: ẨM THỰC & ĐẠI HỌC', 85, 18);
      ctx.fillStyle = '#ec489999'; ctx.fillText('🧋 KHU 2: ĂN VẶT & XĂNG XE', 277, 18);
      ctx.fillStyle = '#10b98199'; ctx.fillText('☕ KHU 3: TRÀ ĐÁ, CSGT & CÔNG ĐOÀN', 467, 18);
      ctx.fillStyle = '#22c55e99'; ctx.fillText('🌳 KHU 4: CÔNG VIÊN & DÂN CƯ (+2k)', 657, 18);
      ctx.fillStyle = '#a78bfa99'; ctx.fillText('🏢 KHU 5: ĐÔ THỊ XA (+3.5k ~ +4.5k)', 852, 18);

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

      for (const lm of Object.values(map)) {
        ctx.save();
        ctx.fillStyle = gameRef.current.isNight ? '#172554' : '#3b495e';
        ctx.strokeStyle = lm.color + '88';
        ctx.lineWidth = 1;
        const bayW = 36;
        const bayX = lm.parkX - bayW / 2;
        const bayY = lm.parkY < lm.aveY ? lm.parkY - 12 : lm.aveY + 25;
        const bayH = 22;
        ctx.fillRect(bayX, bayY, bayW, bayH);
        ctx.strokeRect(bayX, bayY, bayW, bayH);
        ctx.font = 'bold 8px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText('P', lm.parkX, bayY + 14);
        ctx.restore();
      }

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

      // --- VẼ ĐƯỜNG DẪN ĐỊNH VỊ GPS BÁM THEO KHÚC CUA MẶT ĐƯỜNG ---
      if (gameRef.current.missionState === 'to_restaurant' && gameRef.current.targetShop) {
        const ts = gameRef.current.targetShop;
        const routeNodes = bike.waypoints.length > 0
          ? [{ x: bike.x, y: bike.y }, ...bike.waypoints]
          : [{ x: bike.x, y: bike.y }, ...buildRoadPath(bike.x, bike.y, ts.parkX, ts.parkY, ts.aveY)];
        drawGpsPolyline(ctx, routeNodes, '#f59e0b', `📍 TỚI QUÁN LẤY MÓN: ${ts.label}`);
      } else if (gameRef.current.missionState === 'to_customer' && gameRef.current.targetCustomer) {
        const tc = gameRef.current.targetCustomer;
        const routeNodes = bike.waypoints.length > 0
          ? [{ x: bike.x, y: bike.y }, ...bike.waypoints]
          : [{ x: bike.x, y: bike.y }, ...buildRoadPath(bike.x, bike.y, tc.parkX, tc.parkY, tc.aveY)];
        drawGpsPolyline(ctx, routeNodes, '#38bdf8', `🎯 GIAO CHO KHÁCH: ${tc.label}`);
      } else if (bike.waypoints.length > 0) {
        drawGpsPolyline(ctx, [{ x: bike.x, y: bike.y }, ...bike.waypoints], '#10b981', '🛵 ĐANG CHẠY TRÊN ĐƯỜNG...');
      }

      // --- ĐIỀU KHIỂN XE TRÊN ĐƯỜNG, ÔM CUA & CHẶN CHƯỚNG NGẠI VẬT ---
      const inDialog = ['at_shop', 'picking_up', 'at_customer'].includes(gameRef.current.missionState);
      if (inDialog) {
        // Đứng yên tại điểm đỗ xe [P] để tương tác
      } else if (keys.w || keys.s || keys.a || keys.d) {
        const spd = (gameRef.current.bikeHealth > 30 ? 4.0 : 2.4) * gameRef.current.algoSpeed;
        let vx = 0;
        let vy = 0;
        if (keys.w) vy -= 1;
        if (keys.s) vy += 1;
        if (keys.a) vx -= 1;
        if (keys.d) vx += 1;

        if (vx !== 0 || vy !== 0) {
          const mag = Math.hypot(vx, vy);
          vx = (vx / mag) * spd;
          vy = (vy / mag) * spd;

          const desiredAngle = Math.atan2(vy, vx);
          bike.angle = lerpAngle(bike.angle, desiredAngle, 0.28);

          const nextX = bike.x + vx;
          const nextY = bike.y + vy;

          if (isOnDrivableRoad(nextX, nextY)) {
            bike.x = nextX;
            bike.y = nextY;
          } else {
            if (isOnDrivableRoad(nextX, bike.y)) {
              bike.x = nextX;
            } else if (isOnDrivableRoad(bike.x, nextY)) {
              bike.y = nextY;
            } else {
              if (vy !== 0) {
                const nearSx = STREET_XS.find(sx => Math.abs(bike.x - sx) < 35);
                if (nearSx !== undefined) {
                  bike.x += Math.sign(nearSx - bike.x) * Math.min(spd, Math.abs(nearSx - bike.x));
                }
              }
              if (vx !== 0) {
                const nearAy = AVE_YS.find(ay => Math.abs(bike.y - ay) < 35);
                if (nearAy !== undefined) {
                  bike.y += Math.sign(nearAy - bike.y) * Math.min(spd, Math.abs(nearAy - bike.y));
                }
              }
            }
          }
        }
      } else if (bike.waypoints.length > 0) {
        const wp = bike.waypoints[0];
        const dx = wp.x - bike.x;
        const dy = wp.y - bike.y;
        const dist = Math.hypot(dx, dy);
        const autoSpd = (gameRef.current.bikeHealth > 30 ? 3.8 : 2.2) * gameRef.current.algoSpeed;

        if (dist <= autoSpd) {
          bike.x = wp.x;
          bike.y = wp.y;
          bike.waypoints.shift();
        } else {
          const desiredAngle = Math.atan2(dy, dx);
          bike.angle = lerpAngle(bike.angle, desiredAngle, 0.32);
          bike.x += (dx / dist) * autoSpd;
          bike.y += (dy / dist) * autoSpd;
        }
      }

      // --- KIỂM TRA TỚI ĐIỂM ĐỖ QUÁN LẤY ĐƠN ---
      const tShop = gameRef.current.targetShop;
      if (tShop && gameRef.current.missionState === 'to_restaurant' &&
          Math.hypot(bike.x - tShop.parkX, bike.y - tShop.parkY) < 28) {
        openShopDialog();
      }

      // --- KIỂM TRA TỚI ĐIỂM ĐỖ NHÀ KHÁCH GIAO HÀNG ---
      const tCust = gameRef.current.targetCustomer;
      if (tCust && gameRef.current.missionState === 'to_customer' &&
          Math.hypot(bike.x - tCust.parkX, bike.y - tCust.parkY) < 28) {
        openCustomerDialog();
      }

      // --- CƠ CHẾ KHU VỰC 1: HỒI THỂ LỰC TẠI VỊNH ĐỖ XE TRÀ ĐÁ / CÔNG VIÊN / CIRCLE K ---
      const distToTea = Math.hypot(bike.x - map.teaStall.parkX, bike.y - map.teaStall.parkY);
      const distToPark = Math.hypot(bike.x - map.park.parkX, bike.y - map.park.parkY);
      const distToConv = Math.hypot(bike.x - map.convenience.parkX, bike.y - map.convenience.parkY);
      if (distToTea < 34 || distToPark < 34 || distToConv < 34) {
        if (gameRef.current.energy < 100) {
          const healRate = distToConv < 34 ? 1.8 : 0.85;
          const healedEnergy = Math.min(100, gameRef.current.energy + healRate);
          gameRef.current.energy = healedEnergy;
          setEnergy(healedEnergy);

          if (Math.random() < 0.4) {
            healingParticles.push({
              x: bike.x + (Math.random() - 0.5) * 20,
              y: bike.y - 10,
              vy: -1.2,
              life: 1.0,
              text: distToTea < 34 ? '+Trà đá 0đ ☕' : (distToPark < 34 ? '+Nghỉ mát 🌳' : '+Bò Húc 12k ⚡')
            });
          }

          const now = Date.now();
          if (now - lastHealSoundTime > 1200) {
            playSound('heal');
            lastHealSoundTime = now;
            if (distToConv < 34 && gameRef.current.driverWage >= 12) {
              setDriverWage(w => +(Math.max(0, w - 12)).toFixed(1));
              addLog(`🏪 <strong>Circle K / Tiện Lợi 24h:</strong> Mua 1 lon Bò Húc giá thực tế <strong>-12.000đ</strong> từ Ví, hồi siêu tốc thể lực lên ${Math.round(healedEnergy)}%!`);
            } else {
              addLog(distToTea < 34
                ? `☕ <strong>Trà Đá Vỉa Hè Miễn Phí (0đ):</strong> Dừng xe tại điểm đỗ uống trà đá từ thiện, thể lực lên ${Math.round(healedEnergy)}%!`
                : `🌳 <strong>Công Viên Shipper (0đ):</strong> Dựng chân chống xe nghỉ mát, thể lực lên ${Math.round(healedEnergy)}%!`);
            }
          }
        }
      }

      // --- CƠ CHẾ KHU VỰC 2: HỘI QUÁN SHIPPER ---
      const distToUnion = Math.hypot(bike.x - map.unionHub.parkX, bike.y - map.unionHub.parkY);
      if (distToUnion < 34) {
        const now = Date.now();
        if (now - lastUnionTime > 5000) {
          lastUnionTime = now;
          setRating(5.0);
          setAcceptanceRate(100);
          playSound('heal');
          addLog('🤝 <strong>Role Công Đoàn (Hội Quán Shipper):</strong> Anh em hỗ trợ gửi đơn kháng cáo sao oan thành công! Phục hồi <strong>5.0 ⭐</strong> & <strong>100% Tỷ lệ nhận đơn</strong>!');
        }
      }

      // --- CƠ CHẾ KHU VỰC 3: TRỤ SỞ AI PLATFORM ---
      const distToHQ = Math.hypot(bike.x - map.platformHQ.parkX, bike.y - map.platformHQ.parkY);
      if (distToHQ < 34) {
        const now = Date.now();
        if (now - lastHQTime > 5000) {
          lastHQTime = now;
          addLog(`🏢 <strong>Trụ Sở AI Platform:</strong> Sàn đã thu tổng cộng <strong>${formatVND(gameRef.current.surplusM)} (m)</strong> từ ${gameRef.current.completedOrders} cuốc xe của bạn (mức thu ${(gameRef.current.platformCutRate * 100).toFixed(1)}%/đơn)!`);
        }
      }

      // --- CƠ CHẾ KHU VỰC 4: ĐỔ XĂNG RON95 & THAY NHỚT THỰC TẾ ---
      const distToGas = Math.hypot(bike.x - map.gasStation.parkX, bike.y - map.gasStation.parkY);
      const distToHub = Math.hypot(bike.x - map.logisticsHub.parkX, bike.y - map.logisticsHub.parkY);
      if (distToGas < 34 || distToHub < 34) {
        if (gameRef.current.bikeHealth < 100 || gameRef.current.unpaidWearCost > 0) {
          const wearAccumulated = gameRef.current.unpaidWearCost;
          const damage = 100 - gameRef.current.bikeHealth;
          let repairCost = wearAccumulated > 0 ? +wearAccumulated.toFixed(1) : +(Math.max(10, damage * 0.4)).toFixed(1);

          if (gameRef.current.driverWage >= repairCost) {
            const now = Date.now();
            if (now - lastRepairTime > 2000) {
              lastRepairTime = now;
              setDriverWage(w => +(w - repairCost).toFixed(1));
              setDriverCost(c => +(c + repairCost).toFixed(1));
              setUnpaidWearCost(0);
              gameRef.current.unpaidWearCost = 0;
              setBikeHealth(100);
              gameRef.current.bikeHealth = 100;
              spawnRepairCash(bike.x, bike.y, repairCost);
              playSound('coin');
              addLog(`⛽ <strong>Cây Xăng RON95 & Bảo Dưỡng Xe:</strong> Đã thanh toán <strong>-${formatVND(repairCost)} (chi phí c)</strong> cho ${gameRef.current.totalKmDriven}km chạy xe (Xăng RON95 23.500đ/L + hao mòn nhớt/lốp). Xe đạt 100% độ bền!`);
            }
          } else {
            const now = Date.now();
            if (now - lastRepairTime > 3000) {
              lastRepairTime = now;
              addLog(`❌ <strong>Ví không đủ tiền đổ xăng/sửa xe:</strong> Cần <strong>${formatVND(repairCost)}</strong> nhưng Ví bạn chỉ còn <strong>${formatVND(gameRef.current.driverWage)}</strong>!`);
            }
          }
        }
      }

      // --- CƠ CHẾ KHU VỰC 5: CHỐT CSGT THỰC TẾ ---
      const distToPolice = Math.hypot(bike.x - map.policePoint.parkX, bike.y - map.policePoint.parkY);
      if (distToPolice < 34) {
        const now = Date.now();
        if (now - lastPoliceTime > 4500) {
          lastPoliceTime = now;
          if (gameRef.current.algoSpeed > 1.2 || Math.random() < 0.22) {
            const fineAmount = 150;
            setDriverWage(w => +(Math.max(0, w - fineAmount)).toFixed(1));
            setDriverCost(c => +(c + fineAmount).toFixed(1));
            playSound('strike');
            addLog('🚨 <strong>Chốt CSGT phạt -150.000đ:</strong> Lỗi vừa lái xe vừa bấm điện thoại nhận đơn / vượt đèn vàng! Đi tong tiền công của hơn 15 cuốc xe!');
          } else {
            addLog('👮 <strong>Chốt CSGT:</strong> Đồng chí CSGT nhắc nhở: "Một cuốc xe lời có 8.000đ - 10.000đ thôi, nhớ đi đúng làn đường, đừng vượt đèn đỏ nhé!"');
          }
        }
      }

      bike.x = Math.max(15, Math.min(w - 15, bike.x));
      bike.y = Math.max(15, Math.min(h - 15, bike.y));

      drawBike2D(ctx, bike.x, bike.y, bike.angle, bike.hasFood, gameRef.current.energy, gameRef.current.isNight);

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

  function drawGpsPolyline(ctx, nodes, color, labelText) {
    if (!nodes || nodes.length < 2) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.setLineDash([10, 6]);
    ctx.lineDashOffset = -(Date.now() * 0.045) % 16;

    ctx.beginPath();
    ctx.moveTo(nodes[0].x, nodes[0].y);
    for (let i = 1; i < nodes.length; i++) {
      ctx.lineTo(nodes[i].x, nodes[i].y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    for (let i = 1; i < nodes.length - 1; i++) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(nodes[i].x, nodes[i].y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    const last = nodes[nodes.length - 1];
    const pulse = 14 + Math.sin(Date.now() * 0.008) * 5;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(last.x, last.y, pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    const bw = 205;
    const bh = 22;
    const bx = Math.max(8, Math.min(ctx.canvas.width / (window.devicePixelRatio || 1) - bw - 8, last.x - bw / 2));
    const by = Math.max(8, last.y - 36);
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
    if (surplusM < 30) {
      alert('Cần tích lũy tối thiểu 30.000đ thặng dư (m) từ các cuốc xe để nâng cấp AI!');
      return;
    }
    playSound('upgrade');
    setSurplusM(s => +(s - 30).toFixed(1));
    setAlgoLevel(l => l + 1);
    setAlgoSpeed(sp => +(sp + 0.3).toFixed(1));
    setPlatformCutRate(c => Math.min(0.38, +(c + 0.03).toFixed(3)));
    addLog(`⚙️ Nâng cấp AI v${algoLevel + 1}.0: Chiết khấu sàn + thuế tăng lên ${((platformCutRate + 0.03) * 100).toFixed(1)}%, cường độ ép đơn x${(algoSpeed + 0.3).toFixed(1)}!`);
  };

  const handleGasCrisis = () => {
    setGasCrisis(g => {
      const next = !g;
      addLog(next 
        ? '⛽ <strong>Giá xăng RON95 vượt 30.000đ/lít:</strong> Chi phí xăng & hao mòn tăng từ 1.250đ/km lên 1.750đ/km! Giá cước sàn không đổi, tài xế tự gánh!'
        : '⛽ Giá xăng RON95 bình ổn về mức 23.500đ/lít (~1.250đ/km).');
      return next;
    });
  };

  const handleToggleStrike = () => {
    playSound('strike');
    setIsStrike(s => {
      const next = !s;
      if (next) {
        addLog('✊ <strong>Đình công tập thể nổ ra:</strong> Anh em shipper đồng loạt tắt app phản đối chiết khấu 27.2% và đơn ghép giá rẻ!');
      } else {
        addLog('🤝 Đình công kết thúc: Chủ sàn cam kết hỗ trợ phụ phí xăng dầu, shipper bật lại ứng dụng.');
      }
      return next;
    });
  };

  const handleBuyDrone = () => {
    if (surplusM < 80) {
      alert('Cần tích lũy tối thiểu 80.000đ thặng dư (m) để đầu tư thử nghiệm Drone giao hàng!');
      return;
    }
    setSurplusM(s => +(s - 80).toFixed(1));
    setDroneCount(d => d + 1);
    addLog('🤖 <strong>Tư bản tự động hóa (Cấu tạo hữu cơ c/v tăng):</strong> Chủ sàn dùng thặng dư m trích từ shipper để mua Drone AI thay thế chính shipper!');
  };

  const pctC = (currentCost / currentPrice) * 100;
  const pctM = (currentSurplusM / currentPrice) * 100;
  const pctV = Math.max(0, 100 - pctC - pctM);
  const realTakeHome = +(driverWage - unpaidWearCost).toFixed(1);

  return (
    <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      
      {/* Top Header: Nút chuyển Thời tiết, Giờ Cao Điểm, Ban Đêm */}
      <div style={{ background: '#111827', borderRadius: '16px', border: '1px solid #1f2937', padding: '14px 18px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '6px', background: '#10b98120', color: '#34d399', border: '1px solid #10b98140' }}>
              🌦️ GIÁ CƯỚC & KHÁCH HÀNG THEO THỜI TIẾT • THỜI GIAN • ĐỊA ĐIỂM
            </span>
            <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '6px', background: '#ef444420', color: '#f87171', border: '1px solid #ef444440' }}>
              🇻🇳 BIỂU PHÍ VN: 15.000đ/2km • Sàn thu 27.2%
            </span>
          </div>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#f8fafc' }}>
            🛵 Mô Phỏng Ship Ví Việt Nam: Giá Đơn & Khách Nhận Hàng Biến Đổi Theo Mưa Bão, Giờ Giấc & Khu Vực
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              const nextW = weather === 'clear' ? 'rain' : weather === 'rain' ? 'storm' : 'clear';
              setWeather(nextW);
              addLog(nextW === 'storm'
                ? '⛈️ <strong>Thời tiết chuyển Mưa Bão:</strong> Đơn mới tự động cộng phụ phí bão <strong>+12.000đ</strong>, khách hàng sẽ hỏi thăm chuyện vượt bão!'
                : nextW === 'rain'
                ? '🌧️ <strong>Thời tiết chuyển Mưa Rào:</strong> Đơn mới cộng phụ phí mưa <strong>+5.000đ</strong>, khách ra mái hiên đón hàng!'
                : '☀️ <strong>Trời Nắng Ráo trở lại:</strong> Phụ phí thời tiết về +0đ.');
            }}
            style={{ padding: '6px 11px', borderRadius: '8px', background: weather !== 'clear' ? '#0284c7' : '#1e293b', color: '#fff', border: '1px solid #334155', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
          >
            {weather === 'storm' ? '⛈️ Mưa Bão (+12.000đ)' : weather === 'rain' ? '🌧️ Mưa Rào (+5.000đ)' : '☀️ Nắng Ráo (+0đ)'}
          </button>
          <button
            onClick={() => {
              const nextR = !isRushHour;
              setIsRushHour(nextR);
              addLog(nextR
                ? '🔥 <strong>Bật Giờ Cao Điểm (11h30-13h / 17h30-19h):</strong> Đơn mới cộng phụ phí cao điểm <strong>+4.000đ</strong>, khách dễ hỏi thăm chuyện kẹt xe!'
                : '🕒 Đã qua Giờ Cao Điểm.');
            }}
            style={{ padding: '6px 11px', borderRadius: '8px', background: isRushHour ? '#d97706' : '#1e293b', color: '#fff', border: '1px solid #334155', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
          >
            {isRushHour ? '🔥 Giờ Cao Điểm (+4.000đ)' : '🕒 Giờ Thường'}
          </button>
          <button
            onClick={() => {
              const nextN = !isNight;
              setIsNight(nextN);
              addLog(nextN
                ? '🌙 <strong>Chuyển sang Ca Đêm Khuya (sau 22h):</strong> Đơn mới cộng phụ phí đêm <strong>+7.000đ</strong>, khách nhận hàng đêm dặn giữ yên lặng!'
                : '☀️ Chuyển sang Ca Ban Ngày.');
            }}
            style={{ padding: '6px 11px', borderRadius: '8px', background: isNight ? '#4338ca' : '#1e293b', color: '#fff', border: '1px solid #334155', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
          >
            {isNight ? '🌙 Ca Đêm (+7.000đ)' : '☀️ Ban Ngày'}
          </button>
          <button
            onClick={handleToggleStrike}
            style={{ padding: '6px 12px', borderRadius: '8px', background: isStrike ? '#be123c' : '#881337', color: '#fff', border: '1px solid #e11d48', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
          >
            {isStrike ? '🛑 Dừng Bãi Công' : '✊ Đình Công'}
          </button>
        </div>
      </div>

      {/* --- BẢNG ĐIỀU KHIỂN APP SHIPPER & VÍ TÀI XẾ THỰC TẾ VN --- */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.28fr 1fr', gap: '14px' }}>

        {/* CỘT TRÁI: MÀN HÌNH ĐIỆN THOẠI APP SHIPPER */}
        <div style={{ background: '#0f172a', borderRadius: '16px', border: appOnline ? '2px solid #10b981' : '2px solid #475569', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 8px 25px rgba(0,0,0,0.35)' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>📱</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#f8fafc' }}>
                  APP TÀI XẾ CÔNG NGHỆ • VÍ KÝ QUỸ: <span style={{ color: '#38bdf8' }}>{formatVND(walletDeposit)}</span>
                </div>
                <div style={{ fontSize: '11px', color: appOnline ? '#34d399' : '#94a3b8' }}>
                  {appOnline
                    ? `🟢 Đang Bật App • Hệ số hiện tại: ${weather === 'storm' ? 'Mưa Bão (+12k)' : weather === 'rain' ? 'Mưa Rào (+5k)' : 'Nắng (+0đ)'}${isRushHour ? ' • Cao Điểm (+4k)' : ''}${isNight ? ' • Đêm (+7k)' : ''}`
                    : '⚪ Đang Tắt App (Offline)'}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                const next = !appOnline;
                setAppOnline(next);
                if (!next) {
                  setIncomingOrder(null);
                  if (missionState === 'ringing') setMissionState('idle');
                  addLog('📴 Đã TẮT APP Shipper. Ngưng nhận đơn mới.');
                } else {
                  addLog('🟢 Đã BẬT APP Shipper! Sẵn sàng nhận đơn theo biểu phí thực tế Việt Nam.');
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

          {missionState === 'ringing' && incomingOrder ? (
            <div style={{ background: '#1e293b', borderRadius: '12px', border: '2px solid #f59e0b', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fbbf24' }}>
                  🔔 ĐƠN MỚI ({incomingOrder.distance} km) • Ứng COD: {formatVND(incomingOrder.codFoodPrice)}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#38bdf8' }}>
                  Tổng Cước W: {formatVND(incomingOrder.price)}
                </span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#f8fafc' }}>{incomingOrder.name}</div>

              {/* Chi tiết tăng giá theo Thời tiết + Thời gian + Địa điểm */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '10px' }}>
                <span style={{ background: '#0f172a', padding: '3px 8px', borderRadius: '6px', color: '#cbd5e1', border: '1px solid #334155' }}>
                  🛣️ Cước km gốc: <strong>{formatVND(incomingOrder.baseKmFee)}</strong>
                </span>
                <span style={{ background: incomingOrder.weatherSurge > 0 ? '#0284c733' : '#0f172a', padding: '3px 8px', borderRadius: '6px', color: incomingOrder.weatherSurge > 0 ? '#38bdf8' : '#64748b', border: '1px solid #334155' }}>
                  🌦️ Thời tiết: <strong>+{formatVND(incomingOrder.weatherSurge)}</strong>
                </span>
                <span style={{ background: incomingOrder.timeSurge > 0 ? '#4338ca33' : '#0f172a', padding: '3px 8px', borderRadius: '6px', color: incomingOrder.timeSurge > 0 ? '#a5b4fc' : '#64748b', border: '1px solid #334155' }}>
                  ⏰ Thời gian: <strong>+{formatVND(incomingOrder.timeSurge)}</strong>
                </span>
                <span style={{ background: incomingOrder.locationSurge > 0 ? '#f59e0b22' : '#0f172a', padding: '3px 8px', borderRadius: '6px', color: incomingOrder.locationSurge > 0 ? '#fbbf24' : '#64748b', border: '1px solid #334155' }}>
                  📍 {incomingOrder.locationTag}
                </span>
              </div>

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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', fontSize: '11px', background: '#111827', padding: '6px 8px', borderRadius: '8px', textAlign: 'center' }}>
                <div>
                  <span style={{ color: '#94a3b8', display: 'block', fontSize: '10px' }}>Sàn + Thuế ({(platformCutRate * 100).toFixed(1)}%):</span>
                  <strong style={{ color: '#a78bfa' }}>-{formatVND(incomingOrder.price * platformCutRate)}</strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', display: 'block', fontSize: '10px' }}>Xăng RON95 & Xe (c):</span>
                  <strong style={{ color: '#fbbf24' }}>-{formatVND(incomingOrder.vehicleCost)}</strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', display: 'block', fontSize: '10px' }}>Thực lời đút túi (v):</span>
                  <strong style={{ color: '#34d399' }}>+{formatVND(incomingOrder.price * (1 - platformCutRate) - incomingOrder.vehicleCost)}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '2px' }}>
                <button
                  onClick={() => window.__acceptIncomingOrder && window.__acceptIncomingOrder()}
                  style={{ flex: 2, padding: '10px', borderRadius: '10px', border: 'none', background: '#10b981', color: '#fff', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                >
                  ✅ NHẬN ĐƠN (LỜI RÒNG {formatVND(incomingOrder.price * (1 - platformCutRate) - incomingOrder.vehicleCost)})
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
                  {missionState === 'to_restaurant' && '🛵 BƯỚC 1/2: ĐANG BÁM LÀN ĐƯỜNG & ÔM CUA TỚI QUÁN...'}
                  {(missionState === 'at_shop' || missionState === 'picking_up') && '👩‍🍳 BƯỚC 1/2: ĐANG ĐỖ TẠI [P] GẶP CHỦ QUÁN NHẬN MÓN...'}
                  {missionState === 'to_customer' && '🎯 BƯỚC 2/2: ĐANG CHẠY THEO ĐƯỜNG PHỐ TỚI NHÀ KHÁCH...'}
                  {missionState === 'at_customer' && '🙋‍♂️ BƯỚC 2/2: ĐANG GẶP NGƯỜI NHẬN HÀNG TẠI ĐIỂM ĐỖ [P]...'}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#f59e0b' }}>
                  Cước: {formatVND(currentOrder.price)} (COD: {formatVND(currentOrder.codFoodPrice)})
                </span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#f8fafc' }}>
                {currentOrder.name} ({currentOrder.distance} km) • <span style={{ fontSize: '11px', color: '#fbbf24' }}>{currentOrder.locationTag}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                <div style={{ padding: '6px 10px', borderRadius: '8px', background: hasFood ? '#064e3b' : '#0f172a', border: !hasFood ? '1px solid #f59e0b' : '1px solid #10b981' }}>
                  <div style={{ color: '#94a3b8' }}>1. Điểm đỗ lấy hàng [P]:</div>
                  <div style={{ fontWeight: 'bold', color: '#f8fafc' }}>{hasFood ? '✅ Đã lấy tại ' : '👉 '}{currentOrder.shopLabel}</div>
                </div>
                <div style={{ padding: '6px 10px', borderRadius: '8px', background: '#0f172a', border: hasFood ? '1px solid #38bdf8' : '1px solid #334155' }}>
                  <div style={{ color: '#94a3b8' }}>2. Điểm đỗ giao khách [P]:</div>
                  <div style={{ fontWeight: 'bold', color: '#38bdf8' }}>🎯 {currentOrder.custLabel}</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px dashed #475569', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#e2e8f0' }}>
                  {appOnline ? '📡 App đang quét đơn (Tự động tính phụ phí Mưa / Đêm / Khu vực)...' : '📴 App đang tắt (Offline)'}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                  Thử bật <strong>🌧️ Mưa Rào / ⛈️ Mưa Bão / 🔥 Cao Điểm / 🌙 Ca Đêm</strong> ở góc trên rồi bấm Nổ Đơn để thấy giá cước & lời thoại khách thay đổi!
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
                  🌙 Đơn Đêm (+7k)
                </button>
              </div>
            </div>
          )}

        </div>

        {/* CỘT PHẢI: BẢNG KÊ VÍ SHIPPER & CHI PHÍ THỰC TẾ VN */}
        <div style={{ background: '#111827', borderRadius: '16px', border: '1px solid #1f2937', padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', color: '#34d399', fontSize: '13px' }}>💳 VÍ THU NHẬP & CHI PHÍ THỰC TẾ</span>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: energy > 30 ? '#34d399' : '#f87171' }}>
              ⚡ Sức: {energy.toFixed(0)}% | 🛵 Xăng/Xe: {bikeHealth}% ({totalKmDriven}km)
            </span>
          </div>

          <div style={{ height: '6px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${energy}%`, height: '100%', background: energy > 30 ? '#10b981' : '#ef4444', transition: 'width 0.2s' }}></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
            <div style={{ background: '#1e293b', padding: '8px 10px', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
              <span style={{ color: '#94a3b8', fontSize: '10px' }}>Số dư Ví (Chưa trừ hao mòn chờ):</span>
              <div style={{ fontWeight: 'bold', color: '#34d399', fontSize: '14px' }}>{formatVND(driverWage)}</div>
              <div style={{ fontSize: '10px', color: '#6ee7b7' }}>Thực còn: {formatVND(realTakeHome)}</div>
            </div>
            <div style={{ background: '#1e293b', padding: '8px 10px', borderRadius: '8px', borderLeft: '3px solid #f59e0b' }}>
              <span style={{ color: '#94a3b8', fontSize: '10px' }}>Xăng RON95 & Nhớt đã trả (c):</span>
              <div style={{ fontWeight: 'bold', color: '#fbbf24', fontSize: '14px' }}>{formatVND(driverCost)}</div>
              <div style={{ fontSize: '10px', color: '#fcd34d' }}>Chờ đổ xăng/nhớt: ~{formatVND(unpaidWearCost)}</div>
            </div>
            <div style={{ background: '#1e293b', padding: '8px 10px', borderRadius: '8px', borderLeft: '3px solid #8b5cf6' }}>
              <span style={{ color: '#94a3b8', fontSize: '10px' }}>Sàn + Thuế đã thu ({(platformCutRate * 100).toFixed(1)}%):</span>
              <div style={{ fontWeight: 'bold', color: '#a78bfa', fontSize: '14px' }}>{formatVND(surplusM)}</div>
            </div>
            <div style={{ background: '#1e293b', padding: '8px 10px', borderRadius: '8px', borderLeft: '3px solid #38bdf8' }}>
              <span style={{ color: '#94a3b8', fontSize: '10px' }}>Đã giao ({questOrders}/10 thưởng 50k):</span>
              <div style={{ fontWeight: 'bold', color: '#f8fafc', fontSize: '14px' }}>{completedOrders} đơn • {rating.toFixed(2)}⭐</div>
            </div>
          </div>
        </div>

      </div>

      {/* Live Formula Bar (W = c + v + m) */}
      <div style={{ background: '#111827', borderRadius: '14px', border: '1px solid #1f2937', padding: '10px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold', flexWrap: 'wrap', gap: '6px' }}>
          <span style={{ color: '#cbd5e1' }}>
            BÓC TÁCH CUỐC SHIP ({displayOrder.distance} km) • CƯỚC W = {formatVND(currentPrice)} (Gốc {formatVND(displayOrder.baseKmFee || 15)} + Phụ phí {formatVND((displayOrder.weatherSurge || 0) + (displayOrder.timeSurge || 0) + (displayOrder.locationSurge || 0))})
          </span>
          <span style={{ padding: '2px 10px', borderRadius: '20px', background: '#6366f120', color: Number(surplusRate) >= 75 ? '#f43f5e' : '#818cf8', border: '1px solid #6366f140', fontSize: '12px' }}>
            Tỷ suất bóc lột m' = m/v = {surplusRate}% {Number(surplusRate) >= 75 && '🔥 (Sàn ăn dày hơn công thực của tài xế!)'}
          </span>
        </div>
        <div style={{ display: 'flex', height: '24px', borderRadius: '6px', overflow: 'hidden', fontWeight: 'bold', fontSize: '11px', color: '#fff', textAlign: 'center', lineHeight: '24px' }}>
          <div style={{ width: `${pctC}%`, background: '#d97706' }}>c (Xăng/Nhớt): {formatVND(currentCost)} ({pctC.toFixed(0)}%)</div>
          <div style={{ width: `${pctV}%`, background: '#10b981' }}>v (Thực lời bỏ túi): {formatVND(currentWageV)} ({pctV.toFixed(0)}%)</div>
          <div style={{ width: `${pctM}%`, background: '#8b5cf6' }}>m (Sàn thu): {formatVND(currentSurplusM)} ({pctM.toFixed(0)}%)</div>
        </div>
      </div>

      {/* --- BẢNG CHỨC NĂNG RIÊNG CỦA 5 KHU VỰC & CÁC ROLE --- */}
      <div style={{ background: '#111827', borderRadius: '14px', border: '1px solid #1f2937', padding: '10px 14px' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>🗺️ 5 KHU VỰC & PHỤ PHÍ ĐỊA ĐIỂM TRONG THÀNH PHỐ (Click để xe tự chạy theo làn đường tới):</span>
          <span style={{ fontSize: '11px', color: '#38bdf8' }}>KTX: +0đ • Hẻm Dân Cư: +2.000đ • Bệnh Viện: +3.500đ • Chung Cư Xa: +4.500đ</span>
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
            <div style={{ width: '100%', maxWidth: '650px', background: '#0f172a', border: `2px solid ${shopDialog.npc.color}`, borderRadius: '16px', padding: '14px 16px', boxShadow: '0 10px 30px rgba(0,0,0,0.6)', marginBottom: '28px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '40px', lineHeight: 1, background: '#1e293b', borderRadius: '12px', padding: '8px' }}>{shopDialog.npc.avatar}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                    <span style={{ fontWeight: 'bold', color: shopDialog.npc.color, fontSize: '13px' }}>
                      {shopDialog.npc.name}
                    </span>
                    <span style={{ fontSize: '11px', background: '#1e293b', color: '#cbd5e1', padding: '2px 8px', borderRadius: '10px' }}>
                      📍 Bước 1/2: Ứng COD {formatVND(currentOrder.codFoodPrice)} tại {shopDialog.shopLabel}
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
                  📦 Đã nhận đồ ăn! Đang lùi xe ra làn đường để chạy tới giao cho người đặt...
                </div>
              )}
            </div>
          </div>
        )}

        {/* HỘI THOẠI VỚI ROLE NGƯỜI ĐẶT HÀNG (THAY ĐỔI THEO THỜI TIẾT • THỜI GIAN • ĐỊA ĐIỂM) */}
        {customerDialog && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(2, 6, 23, 0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '16px', zIndex: 10 }}>
            <div style={{ width: '100%', maxWidth: '650px', background: '#0f172a', border: `2px solid ${customerDialog.npc.color}`, borderRadius: '16px', padding: '14px 16px', boxShadow: '0 10px 30px rgba(0,0,0,0.6)', marginBottom: '28px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '40px', lineHeight: 1, background: '#1e293b', borderRadius: '12px', padding: '8px' }}>{customerDialog.npc.avatar}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                    <span style={{ fontWeight: 'bold', color: customerDialog.npc.color, fontSize: '13px' }}>
                      {customerDialog.npc.name}
                    </span>
                    <span style={{ fontSize: '11px', background: '#1e293b', color: '#38bdf8', padding: '2px 8px', borderRadius: '10px' }}>
                      {customerDialog.conditionTag || `🎯 Giao tại ${customerDialog.custLabel}`}
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
                  💰 Giao hàng hoàn tất! Đang quyết toán tiền cước vào Ví Shipper...
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(15, 23, 42, 0.88)', border: '1px solid #334155', borderRadius: '20px', padding: '4px 16px', fontSize: '11px', color: '#cbd5e1', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
          🌦️ <em>Giá đơn & câu hỏi của khách tự động thay đổi theo Thời tiết (Nắng/Mưa/Bão), Thời gian (Ngày/Cao điểm/Đêm) & Địa điểm!</em>
        </div>
      </div>

      {/* Quick Navigation & Role Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: '10px' }}>
        <button
          onClick={() => { if (window.__ringOrder) window.__ringOrder(false); }}
          disabled={isStrike || !appOnline || energy < 8}
          style={{ padding: '11px', background: '#059669', color: '#fff', border: 'none', borderRadius: '12px', cursor: (energy >= 8 && appOnline) ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '12px' }}
        >
          📲 Bắn Đơn Thực Tế Lên App
        </button>

        <button
          onClick={() => { if (window.__restDriver) window.__restDriver(); }}
          style={{ padding: '11px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
        >
          ☕ Ghé Trà Đá Vỉa Hè (0đ)
        </button>

        <button
          onClick={() => { if (window.__repairBike) window.__repairBike(); }}
          style={{ padding: '11px', background: '#d97706', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
        >
          ⛽ Đổ Xăng RON95 & Nhớt (Trả c)
        </button>

        <button
          onClick={() => { if (window.__driveToLandmark) window.__driveToLandmark('unionHub'); }}
          style={{ padding: '11px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
        >
          🤝 Ghé Hội Quán (Hồi 5.0 ⭐)
        </button>
      </div>

      {/* Advanced Gig & Capitalist Mechanics */}
      <div style={{ background: '#111827', borderRadius: '14px', border: '1px solid #1f2937', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <span>🏢 CHÍNH SÁCH TƯ BẢN NỀN TẢNG TẠI VIỆT NAM (ROLE CHỦ SÀN AI):</span>
          <span style={{ fontSize: '11px', color: '#a78bfa' }}>Quỹ thặng dư m sàn đã rút: {formatVND(surplusM)} | Drone AI: {droneCount} chiếc</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
          <button
            onClick={() => {
              setIsBatchedOrder(b => {
                const next = !b;
                addLog(next 
                  ? '📦📦 <strong>Bật Đơn Ghép Thực Tế VN:</strong> Ghép 2 đơn cùng lúc nhưng đơn thứ 2 chỉ cộng thêm +6.500đ cho tài xế, trong khi sàn thu đủ phí của 2 khách!'
                  : 'Đã tắt chế độ đơn ghép.');
                return next;
              });
            }}
            style={{ padding: '10px', borderRadius: '10px', background: isBatchedOrder ? '#3b82f6' : '#1e293b', color: '#fff', border: '1px solid #334155', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', textAlign: 'left' }}
          >
            {isBatchedOrder ? '✅ Đang Bật Đơn Ghép (+6.500đ/đơn 2)' : '➕ Bật Đơn Ghép (Ép Giá Đơn Thứ 2)'}
            <div style={{ fontSize: '10px', fontWeight: 'normal', color: '#cbd5e1', marginTop: '2px' }}>Giao 2 khách nhưng chỉ trả thêm ~6.500đ</div>
          </button>

          <button
            onClick={handleGasCrisis}
            style={{ padding: '10px', borderRadius: '10px', background: gasCrisis ? '#b45309' : '#1e293b', color: '#fff', border: '1px solid #334155', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', textAlign: 'left' }}
          >
            {gasCrisis ? '⛽ Xăng RON95 Đang >30.000đ/L' : '⛽ Tăng Giá Xăng RON95 Lên 30k/L'}
            <div style={{ fontSize: '10px', fontWeight: 'normal', color: '#cbd5e1', marginTop: '2px' }}>Tăng c từ 1.250đ/km lên 1.750đ/km</div>
          </button>

          <button
            onClick={handleUpgradeAlgo}
            disabled={surplusM < 30}
            style={{ padding: '10px', borderRadius: '10px', background: surplusM >= 30 ? '#7c3aed' : '#312e81', color: '#fff', border: 'none', cursor: surplusM >= 30 ? 'pointer' : 'not-allowed', opacity: surplusM >= 30 ? 1 : 0.6, fontSize: '12px', fontWeight: 'bold', textAlign: 'left' }}
          >
            🚀 Tăng Chiết Khấu Sàn (+3% / 30.000đ m)
            <div style={{ fontSize: '10px', fontWeight: 'normal', color: '#cbd5e1', marginTop: '2px' }}>Từ 27.2% lên 30.2% - 35% mỗi cuốc</div>
          </button>

          <button
            onClick={handleBuyDrone}
            disabled={surplusM < 80}
            style={{ padding: '10px', borderRadius: '10px', background: surplusM >= 80 ? '#0284c7' : '#0f172a', color: '#fff', border: 'none', cursor: surplusM >= 80 ? 'pointer' : 'not-allowed', opacity: surplusM >= 80 ? 1 : 0.6, fontSize: '12px', fontWeight: 'bold', textAlign: 'left' }}
          >
            🤖 Đầu Tư Drone Giao Hàng (80.000đ m)
            <div style={{ fontSize: '10px', fontWeight: 'normal', color: '#cbd5e1', marginTop: '2px' }}>Dùng m của tài xế để tự động hóa</div>
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
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Sổ cái chi tiết thu - chi từng cuốc xe tại Việt Nam:</span>
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
