const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();
const dbPath = path.join(__dirname, "dev.db");

const sampleDescriptions = [
  "Chất liệu cao cấp được hoàn thiện thủ công tỉ mỉ từng đường kim mũi chỉ. Khả năng thoáng khí vượt trội, phù hợp cho mọi hoạt động thể thao lẫn dạo phố hàng ngày. Thiết kế công thái học ôm sát cơ thể nhưng vẫn đảm bảo sự linh hoạt tối đa khi vận động. Sản phẩm đã qua kiểm định độ bền đạt chuẩn quốc tế ISO-9001. Đường may đôi chắc chắn kết hợp với kỹ thuật dệt sợi công nghệ cao giúp chống nhăn và chống xù lông hiệu quả.",
  "Thiết kế hiện đại đón đầu xu hướng thời trang thế giới. Màu sắc thanh lịch, bền màu qua nhiều lần giặt giũ mà không lo bị phai sờn hay bai xù. Tích hợp công nghệ chống tia UV và kháng khuẩn tiên tiến giúp bảo vệ làn da trong suốt ngày dài năng động dưới ánh nắng gay gắt. Kiểu dáng trẻ trung, dễ dàng phối hợp với nhiều phong cách thời trang khác nhau.",
  "Sản phẩm được chế tác từ linh kiện thế hệ mới nhất mang lại hiệu năng ổn định vượt bậc và tuổi thọ pin ấn tượng. Giao diện thân thiện trực quan, đồng bộ nhanh chóng với các thiết bị thông minh khác trong hệ sinh thái. Đi kèm chế độ bảo hành 24 tháng chính hãng 1 đổi 1 tận nơi. Khả năng chống nước và chống bụi đạt tiêu chuẩn IP68 cao cấp nhất.",
  "Phong cách tối giản Minimalism nhưng toát lên vẻ sang trọng quý phái. Phù hợp phối cùng nhiều loại trang phục từ công sở lịch lãm đến phong cách streetwear năng động đường phố. Hộp đựng và phụ kiện đi kèm được đóng gói chỉn chu, sang trọng làm quà tặng ý nghĩa. Chất liệu thân thiện với môi trường, có thể tái chế 100%.",
  "Được các chuyên gia khuyên dùng nhờ tính an toàn tuyệt đối cho sức khỏe người tiêu dùng. Nguồn gốc xuất xứ rõ ràng từ các nhà cung ứng hàng đầu. Đóng gói tiện lợi dễ dàng mang theo khi đi công tác xa, du lịch dã ngoại hoặc làm việc tại văn phòng. Hương thơm dịu nhẹ tự nhiên tạo cảm giác thư giãn, sảng khoái suốt ngày dài làm việc."
];

const sampleReviews = [
  "Sản phẩm dùng rất thích, đóng gói cực kỳ cẩn thận với 3 lớp bọc chống sốc. Giao hàng nhanh chỉ trong 2 ngày là nhận được tại Hà Nội. Sẽ tiếp tục ủng hộ shop trong các đợt khuyến mãi sắp tới! Rất đáng tiền, 10 điểm cho chất lượng và dịch vụ đóng gói chuyên nghiệp của shop.",
  "Chất lượng vượt xa mong đợi so với mức giá này. Hoàn thiện sắc nét, cầm chắc tay và cực kỳ bền bỉ. Đã giới thiệu cho bạn bè và đồng nghiệp cùng cơ quan mua thêm. Mọi người đều khen ngợi hết lời và hỏi địa chỉ để đặt thêm hàng.",
  "Shop tư vấn nhiệt tình, đổi trả size rất nhanh và chuyên nghiệp khi mình chọn nhầm cỡ. Rất hài lòng về thái độ phục vụ của đội ngũ hỗ trợ khách hàng. Nhân viên chăm sóc khách hàng gọi điện hướng dẫn tận tình chu đáo.",
  "Mẫu mã đẹp y như hình ảnh quảng cáo, không có chỉ thừa hay lỗi sản xuất nào. Đánh giá 5 sao cho chất lượng dịch vụ của Simple Shop! Chắc chắn sẽ còn quay lại ủng hộ nhiều lần nữa trong tương lai gần.",
  "Đã mua lần thứ ba tại shop và chưa bao giờ thất vọng. Hàng chính hãng nguyên tem mác bảo hành đầy đủ. Vận chuyển nhanh, shipper thân thiện nhiệt tình. Cảm ơn shop rất nhiều vì một sản phẩm tuyệt vời!"
];

function getDbSizeMB() {
  if (fs.existsSync(dbPath)) {
    return (fs.statSync(dbPath).size / (1024 * 1024)).toFixed(3);
  }
  return 0;
}

async function main() {
  console.log("=================================================");
  console.log("🚀 BẮT ĐẦU NẠP DỮ LIỆU ĐẠT CHUẨN 10 MB (SQLITE)");
  console.log(`📁 File DB: ${dbPath}`);
  console.log(`📊 Dung lượng ban đầu: ${getDbSizeMB()} MB`);
  console.log("=================================================\n");

  const startTime = Date.now();

  // 1. Tạo tài khoản mẫu Admin và User
  console.log("🔑 Tạo tài khoản Admin & User mẫu...");
  const adminHash = await bcrypt.hash("admin123", 6);
  const userHash = await bcrypt.hash("user123456", 6);

  await prisma.user.upsert({
    where: { email: "admin@simpleshop.com" },
    update: { role: "ADMIN" },
    create: {
      name: "Quản trị viên",
      email: "admin@simpleshop.com",
      password: adminHash,
      role: "ADMIN"
    }
  });

  const demoUser = await prisma.user.upsert({
    where: { email: "user@simpleshop.com" },
    update: {},
    create: {
      name: "Nguyễn Văn Khách",
      email: "user@simpleshop.com",
      password: userHash,
      role: "USER"
    }
  });

  // 2. Tạo Coupon mẫu
  console.log("🎟️ Tạo mã giảm giá mẫu...");
  const coupons = [
    { code: "GIAM10", discount: 10, isPercent: true, minAmount: 100000, maxDiscount: 50000 },
    { code: "FREESHIP", discount: 30000, isPercent: false, minAmount: 200000 },
    { code: "VIP20", discount: 20, isPercent: true, minAmount: 500000, maxDiscount: 100000 }
  ];
  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: c,
      create: c
    });
  }

  // 3. Tạo danh mục sản phẩm phong phú
  console.log("📦 Tạo danh mục hàng hóa...");
  const catNames = [
    { name: "Thời trang Nam", slug: "thoi-trang-nam", icon: "👔" },
    { name: "Thời trang Nữ", slug: "thoi-trang-nu", icon: "👗" },
    { name: "Giày dép Sneaker", slug: "giay-dep", icon: "👟" },
    { name: "Đồng hồ cao cấp", slug: "dong-ho", icon: "⌚" },
    { name: "Túi xách & Balo", slug: "tui-xach", icon: "👜" },
    { name: "Thiết bị âm thanh", slug: "thiet-bi-am-thanh", icon: "🎧" },
    { name: "Đồ công nghệ số", slug: "do-cong-nghe", icon: "💻" },
    { name: "Phụ kiện thông minh", slug: "phu-kien", icon: "⚡" },
    { name: "Mỹ phẩm & Chăm sóc", slug: "my-pham", icon: "✨" },
    { name: "Thể thao dã ngoại", slug: "the-thao", icon: "⛺" }
  ];

  const categoryIds = [];
  for (const c of catNames) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        description: `Danh mục sản phẩm tuyển chọn chuyên sâu về ${c.name}, đem lại trải nghiệm cao cấp cho khách hàng.`
      }
    });
    categoryIds.push(cat.id);
  }

  // 4. Tạo Users mẫu (300 users)
  console.log("👤 Đang tạo 300 tài khoản người dùng...");
  const userIds = [demoUser.id];
  for (let i = 0; i < 300; i++) {
    const u = await prisma.user.upsert({
      where: { email: `customer_${i + 1}@simpleshop.vn` },
      update: {},
      create: {
        name: `Khách hàng VIP #${i + 1}`,
        email: `customer_${i + 1}@simpleshop.vn`,
        password: userHash,
        role: "USER"
      }
    });
    userIds.push(u.id);
  }

  // 5. Tạo 1.200 Sản phẩm chi tiết
  console.log("🏷️ Đang tạo 1.200 sản phẩm chi tiết...");
  const productIds = [];
  for (let i = 0; i < 1200; i++) {
    const catId = categoryIds[i % categoryIds.length];
    const desc = sampleDescriptions[i % sampleDescriptions.length].repeat(5); // ~2.5 KB mỗi sản phẩm
    const prod = await prisma.product.create({
      data: {
        name: `Sản phẩm cao cấp Simple Shop phiên bản #${i + 1}`,
        description: desc,
        price: 150000 + (i % 25) * 40000,
        oldPrice: 250000 + (i % 25) * 40000,
        stock: 50 + (i % 100),
        sold: 10 + (i % 300),
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
        badge: i % 3 === 0 ? "Bán chạy" : (i % 3 === 1 ? "Hot" : "Mới"),
        rating: 4.6 + (i % 4) * 0.1,
        isFeatured: i % 8 === 0,
        categoryId: catId
      }
    });
    productIds.push(prod.id);

    if ((i + 1) % 300 === 0) {
      console.log(`   -> Đã tạo ${i + 1}/1.200 sản phẩm (Dung lượng DB: ${getDbSizeMB()} MB)`);
    }
  }

  // 6. Tạo 4.000 Đánh giá (Reviews) với nội dung dài
  console.log("⭐ Đang tạo 4.000 đánh giá sản phẩm...");
  let reviewCount = 0;
  for (let pIdx = 0; pIdx < Math.min(productIds.length, 1000); pIdx++) {
    const prodId = productIds[pIdx];
    for (let u = 0; u < 4; u++) {
      const uId = userIds[(pIdx * 4 + u) % userIds.length];
      const commentText = sampleReviews[(pIdx + u) % sampleReviews.length].repeat(4);
      try {
        await prisma.review.create({
          data: {
            rating: 4 + (u % 2),
            comment: commentText,
            userId: uId,
            productId: prodId
          }
        });
        reviewCount++;
      } catch (e) {
        // bỏ qua nếu trùng
      }
    }
    if ((pIdx + 1) % 250 === 0) {
      console.log(`   -> Đã tạo ${reviewCount} đánh giá (Dung lượng DB: ${getDbSizeMB()} MB)`);
    }
  }

  // 7. Tạo Đơn hàng liên tục cho đến khi file database đạt >= 10.0 MB
  console.log("📦 Đang tạo các đơn hàng chi tiết để đạt mốc 10.0 MB...");
  let orderIndex = 0;
  while (parseFloat(getDbSizeMB()) < 10.0 && orderIndex < 5000) {
    const uId = userIds[orderIndex % userIds.length];
    const prodId = productIds[orderIndex % productIds.length];
    const qty = 1 + (orderIndex % 3);
    const price = 250000;

    await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}-${orderIndex}`,
        userId: uId,
        customerName: `Khách hàng VIP #${orderIndex + 1}`,
        customerEmail: `customer_${orderIndex % 300 + 1}@simpleshop.vn`,
        customerPhone: `09${String(10000000 + orderIndex).slice(0, 8)}`,
        address: `Số ${orderIndex + 1} Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh, Việt Nam (Giao hàng giờ hành chính từ thứ 2 đến thứ 6, vui lòng gọi điện trước khi giao hàng 15 phút)`,
        paymentMethod: orderIndex % 2 === 0 ? "COD" : "BANKING",
        status: orderIndex % 3 === 0 ? "DELIVERED" : (orderIndex % 3 === 1 ? "SHIPPED" : "PROCESSING"),
        totalAmount: price * qty,
        items: {
          create: [
            {
              productId: prodId,
              price: price,
              quantity: qty
            }
          ]
        }
      }
    });

    orderIndex++;
    if (orderIndex % 300 === 0) {
      console.log(`   -> Đã tạo ${orderIndex} đơn hàng (Dung lượng hiện tại: ${getDbSizeMB()} MB)`);
    }
  }

  // Sao chép dev.db sang thư mục prisma/ ở root để đồng bộ
  try {
    const rootDbPath = path.join(__dirname, "../../prisma/dev.db");
    fs.copyFileSync(dbPath, rootDbPath);
    console.log(`📋 Đã đồng bộ sang: ${rootDbPath}`);
  } catch (err) {
    // không bắt buộc
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log("\n=================================================");
  console.log(`🎉 HOÀN THÀNH XUẤT SẮC TRONG ${duration}s!`);
  console.log(`📊 DUNG LƯỢNG DATABASE CUỐI CÙNG: ${getDbSizeMB()} MB`);
  console.log("=================================================");
}

main()
  .catch((e) => {
    console.error("LỖI SEED DATABASE:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
