/**
 * Script sinh dữ liệu giả lập thương mại điện tử thực tế đạt dung lượng ~10 MB.
 * Bao gồm: Danh mục, Sản phẩm với mô tả chi tiết, Người dùng, Đơn hàng, Đánh giá sản phẩm.
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const sampleDescriptions = [
  "Chất liệu cao cấp được hoàn thiện thủ công tỉ mỉ từng đường kim mũi chỉ. Khả năng thoáng khí vượt trội, phù hợp cho mọi hoạt động thể thao lẫn dạo phố hàng ngày. Thiết kế công thái học ôm sát cơ thể nhưng vẫn đảm bảo sự linh hoạt tối đa khi vận động. Sản phẩm đã qua kiểm định độ bền đạt chuẩn quốc tế ISO-9001.",
  "Thiết kế hiện đại đón đầu xu hướng thời trang thế giới. Màu sắc thanh lịch, bền màu qua nhiều lần giặt giũ mà không lo bị phai sờn hay bai xù. Tích hợp công nghệ chống tia UV và kháng khuẩn tiên tiến giúp bảo vệ làn da trong suốt ngày dài năng động dưới ánh nắng gay gắt.",
  "Sản phẩm được chế tác từ linh kiện thế hệ mới nhất mang lại hiệu năng ổn định vượt bậc và tuổi thọ pin ấn tượng. Giao diện thân thiện trực quan, đồng bộ nhanh chóng với các thiết bị thông minh khác trong hệ sinh thái. Đi kèm chế độ bảo hành 24 tháng chính hãng 1 đổi 1 tận nơi.",
  "Phong cách tối giản Minimalism nhưng toát lên vẻ sang trọng quý phái. Phù hợp phối cùng nhiều loại trang phục từ công sở lịch lãm đến phong cách streetwear năng động đường phố. Hộp đựng và phụ kiện đi kèm được đóng gói chỉn chu, sang trọng làm quà tặng ý nghĩa.",
  "Được các chuyên gia khuyên dùng nhờ tính an toàn tuyệt đối cho sức khỏe người tiêu dùng. Nguồn gốc xuất xứ rõ ràng từ các nhà cung ứng hàng đầu. Đóng gói tiện lợi dễ dàng mang theo khi đi công tác xa, du lịch dã ngoại hoặc làm việc tại văn phòng."
];

const sampleReviews = [
  "Sản phẩm dùng rất thích, đóng gói cực kỳ cẩn thận với 3 lớp bọc chống sốc. Giao hàng nhanh chỉ trong 2 ngày là nhận được tại Hà Nội. Sẽ tiếp tục ủng hộ shop trong các đợt khuyến mãi sắp tới!",
  "Chất lượng vượt xa mong đợi so với mức giá này. Hoàn thiện sắc nét, cầm chắc tay và cực kỳ bền bỉ. Đã giới thiệu cho bạn bè và đồng nghiệp cùng cơ quan mua thêm.",
  "Shop tư vấn nhiệt tình, đổi trả size rất nhanh và chuyên nghiệp khi mình chọn nhầm cỡ. Rất hài lòng về thái độ phục vụ của đội ngũ hỗ trợ khách hàng.",
  "Mẫu mã đẹp y như hình ảnh quảng cáo, không có chỉ thừa hay lỗi sản xuất nào. Đánh giá 5 sao cho chất lượng dịch vụ của Simple Shop!",
  "Đã mua lần thứ ba tại shop và chưa bao giờ thất vọng. Hàng chính hãng nguyên tem mác bảo hành đầy đủ."
];

async function generateData(targetSizeMb = 10) {
  console.log(`🚀 Bắt đầu sinh dữ liệu hướng tới ~${targetSizeMb} MB...`);
  const startTime = Date.now();

  // 1. Hash password mẫu 1 lần
  const defaultPassword = await bcrypt.hash("123456", 6);

  // 2. Tạo 10 danh mục
  console.log("📦 Đang tạo danh mục...");
  const categoryIds = [];
  const catNames = [
    "Thời trang Nam", "Thời trang Nữ", "Giày dép Sneaker", "Đồng hồ cao cấp",
    "Túi xách phụ kiện", "Thiết bị âm thanh", "Đồ gia dụng thông minh",
    "Mỹ phẩm & Chăm sóc da", "Thể thao & Dã ngoại", "Văn phòng phẩm cao cấp"
  ];

  for (let i = 0; i < catNames.length; i++) {
    const slug = `danh-muc-${i + 1}-${Date.now()}`;
    const cat = await prisma.category.create({
      data: {
        name: `${catNames[i]} #${i + 1}`,
        slug: slug,
        icon: "✦",
        description: `Danh mục sản phẩm tuyển chọn chuyên sâu về ${catNames[i]}, đem lại trải nghiệm cao cấp cho khách hàng.`
      }
    });
    categoryIds.push(cat.id);
  }

  // 3. Tạo 200 Users
  console.log("👤 Đang tạo tài khoản người dùng...");
  const userIds = [];
  for (let i = 0; i < 200; i++) {
    const user = await prisma.user.create({
      data: {
        name: `Khách hàng ${i + 1}`,
        email: `customer_${Date.now()}_${i}@simpleshop.vn`,
        password: defaultPassword,
        role: "USER"
      }
    });
    userIds.push(user.id);
  }

  // 4. Tạo 1000 Sản phẩm với nội dung mô tả chi tiết
  console.log("🏷️ Đang tạo 1.000 sản phẩm chi tiết...");
  const productIds = [];
  for (let i = 0; i < 1000; i++) {
    const catId = categoryIds[i % categoryIds.length];
    const desc = sampleDescriptions[i % sampleDescriptions.length].repeat(4); // Lặp để tăng kích thước text thực tế
    const prod = await prisma.product.create({
      data: {
        name: `Sản phẩm cao cấp Simple Shop phiên bản Pro Series #${i + 1}`,
        description: desc,
        price: 150000 + (i % 20) * 50000,
        oldPrice: 250000 + (i % 20) * 50000,
        stock: 50 + (i % 100),
        sold: 10 + (i % 200),
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
        badge: i % 3 === 0 ? "Bán chạy" : (i % 3 === 1 ? "Hot" : "Mới"),
        rating: 4.5 + (i % 5) * 0.1,
        isFeatured: i % 10 === 0,
        categoryId: catId
      }
    });
    productIds.push(prod.id);

    if ((i + 1) % 200 === 0) {
      console.log(`   -> Đã tạo ${i + 1}/1.000 sản phẩm`);
    }
  }

  // 5. Tạo 4.000 Đánh giá (Reviews)
  console.log("⭐ Đang tạo 4.000 đánh giá sản phẩm...");
  let reviewCount = 0;
  for (let pIdx = 0; pIdx < Math.min(productIds.length, 800); pIdx++) {
    const prodId = productIds[pIdx];
    // Mỗi sản phẩm có 5 reviews từ 5 users khác nhau
    for (let u = 0; u < 5; u++) {
      const uId = userIds[(pIdx * 5 + u) % userIds.length];
      const commentText = sampleReviews[(pIdx + u) % sampleReviews.length].repeat(3);
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
        // bỏ qua nếu trùng unique userId + productId
      }
    }
    if ((pIdx + 1) % 200 === 0) {
      console.log(`   -> Đã tạo ${reviewCount} đánh giá`);
    }
  }

  // 6. Tạo 1.500 Đơn hàng và chi tiết đơn hàng
  console.log("📦 Đang tạo 1.500 đơn hàng lịch sử...");
  for (let o = 0; o < 1500; o++) {
    const uId = userIds[o % userIds.length];
    const prodId = productIds[o % productIds.length];
    const qty = 1 + (o % 3);
    const price = 200000;

    await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}-${o}`,
        userId: uId,
        customerName: `Khách hàng VIP #${o + 1}`,
        customerEmail: `customer_${o}@simpleshop.vn`,
        customerPhone: `09${String(10000000 + o).slice(0, 8)}`,
        address: `Số ${o + 1} Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh, Việt Nam (Giao giờ hành chính, gọi trước khi giao)`,
        paymentMethod: o % 2 === 0 ? "COD" : "BANKING",
        status: o % 3 === 0 ? "DELIVERED" : (o % 3 === 1 ? "SHIPPED" : "PROCESSING"),
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

    if ((o + 1) % 300 === 0) {
      console.log(`   -> Đã tạo ${o + 1}/1.500 đơn hàng`);
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🎉 HOÀN TẤT SINH DỮ LIỆU trong ${duration}s!`);
}

generateData()
  .catch((err) => {
    console.error("LỖI SINH DỮ LIỆU:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
