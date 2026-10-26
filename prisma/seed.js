const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Seed Categories
  const categoriesData = [
    { name: "Thời trang", slug: "thoi-trang", icon: "✦", description: "Thời trang nam nữ hiện đại" },
    { name: "Giày dép", slug: "giay-dep", icon: "◈", description: "Giày thơi trang, sneaker cao cấp" },
    { name: "Phụ kiện", slug: "phu-kien", icon: "◇", description: "Túi xách, đồng hồ, phụ kiện" },
    { name: "Đồ công nghệ", slug: "do-cong-nghe", icon: "⌁", description: "Thiết bị và phụ kiện công nghệ" },
  ];

  const categories = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
    categories[cat.name] = created.id;
  }

  // Seed Products
  const productsData = [
    // Thời trang
    {
      name: "Áo thun Essential",
      description: "Áo thun cotton 100% cao cấp, bề mặt mềm mịn, thoáng mát, thấm hút mồ hôi tốt. Form dáng regular fit trẻ trung, phù hợp cả đi chơi và đi làm.",
      price: 189000,
      oldPrice: 249000,
      rating: 4.9,
      sold: 128,
      stock: 50,
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
      badge: "Bán chạy",
      isFeatured: true,
      categoryId: categories["Thời trang"],
    },
    {
      name: "Áo Hoodie Streetwear Oversize",
      description: "Áo hoodie nỉ bông cao cấp giữ ấm tối ưu, thiết kế mũ rộng có dây rút thời thượng, form suông phong cách streetwear năng động.",
      price: 389000,
      oldPrice: 499000,
      rating: 4.9,
      sold: 215,
      stock: 40,
      image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=900&q=80",
      badge: "Hot",
      isFeatured: true,
      categoryId: categories["Thời trang"],
    },
    {
      name: "Áo sơ mi Oxford Classic",
      description: "Áo sơ mi vải Oxford dệt sợi đôi chống nhăn, cổ bẻ thanh lịch, đường may tỉ mỉ, tôn lên vẻ lịch lãm và trang nhã cho nam giới.",
      price: 320000,
      oldPrice: 420000,
      rating: 4.8,
      sold: 94,
      stock: 35,
      image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&q=80",
      badge: "Mới",
      isFeatured: false,
      categoryId: categories["Thời trang"],
    },
    {
      name: "Quần Jeans Slim-fit Denim",
      description: "Quần jean co giãn nhẹ, giữ form tốt, xử lý màu wash hiện đại, mang lại cảm giác thoải mái khi di chuyển cả ngày dài.",
      price: 450000,
      oldPrice: 580000,
      rating: 4.8,
      sold: 167,
      stock: 45,
      image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80",
      badge: "Bán chạy",
      isFeatured: true,
      categoryId: categories["Thời trang"],
    },
    {
      name: "Áo khoác Bomber Jacket",
      description: "Áo khoác bomber chất liệu polyester chống gió, chống thấm nước nhẹ, lót dù 2 lớp ấm áp cùng bo cổ tay thun co giãn thoải mái.",
      price: 590000,
      oldPrice: 750000,
      rating: 4.9,
      sold: 82,
      stock: 25,
      image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80",
      badge: "-20%",
      isFeatured: true,
      categoryId: categories["Thời trang"],
    },
    {
      name: "Váy đầm Linen Dáng Suông",
      description: "Chất liệu sợi tự nhiên linen thoáng mát, thiết kế thanh lịch dịu dàng, đường cắt may tôn dáng, phù hợp dạo phố và du lịch hè.",
      price: 360000,
      oldPrice: 450000,
      rating: 4.7,
      sold: 58,
      stock: 30,
      image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=900&q=80",
      badge: "Mới",
      isFeatured: false,
      categoryId: categories["Thời trang"],
    },

    // Giày dép
    {
      name: "Sneaker Urban White",
      description: "Sneaker trắng thời trang, đế cao su êm ái, chống trượt vượt trội, phối màu trang nhã phù hợp nhiều outfit hàng ngày.",
      price: 649000,
      oldPrice: 799000,
      rating: 4.8,
      sold: 96,
      stock: 30,
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
      badge: "Hot",
      isFeatured: true,
      categoryId: categories["Giày dép"],
    },
    {
      name: "Sneaker Retro Runner",
      description: "Thiết kế giày chạy cổ điển pha nét hiện đại, đệm khí nâng đỡ gót êm ái, thân giày phối lưới da lộn thoáng khí tối đa.",
      price: 720000,
      oldPrice: 890000,
      rating: 4.9,
      sold: 142,
      stock: 35,
      image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=900&q=80",
      badge: "Bán chạy",
      isFeatured: true,
      categoryId: categories["Giày dép"],
    },
    {
      name: "Giày tây Oxford Da bò",
      description: "Chế tác từ da bò thật 100%, độ bóng đẹp tự nhiên, đế phíp khâu viền chắc chắn, hoàn hảo cho các dịp trang trọng và môi trường công sở.",
      price: 950000,
      oldPrice: 1200000,
      rating: 4.9,
      sold: 64,
      stock: 20,
      image: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=900&q=80",
      badge: "Cao cấp",
      isFeatured: true,
      categoryId: categories["Giày dép"],
    },
    {
      name: "Giày lười Loafer Penny Da bóng",
      description: "Mẫu giày lười tiện dụng, dễ xỏ tháo, da mềm êm ái không đau gót chân, mang phong cách smart-casual lịch lãm.",
      price: 680000,
      oldPrice: 850000,
      rating: 4.7,
      sold: 88,
      stock: 25,
      image: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=900&q=80",
      badge: "Hot",
      isFeatured: false,
      categoryId: categories["Giày dép"],
    },
    {
      name: "Sneaker Chunky Street",
      description: "Đế bánh mì tôn dáng tăng chiều cao 5cm, chất liệu bền bỉ và trọng lượng nhẹ, là điểm nhấn cá tính cho phong cách dạo phố trẻ trung.",
      price: 590000,
      oldPrice: 750000,
      rating: 4.8,
      sold: 110,
      stock: 40,
      image: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=900&q=80",
      badge: "-20%",
      isFeatured: false,
      categoryId: categories["Giày dép"],
    },
    {
      name: "Sandal Thể thao Quai Dù",
      description: "Sandal quai dù dệt mật độ cao chống đứt, đế cao su gai ma sát cực tốt, nhẹ tênh và chống nước hiệu quả trong mọi thời tiết.",
      price: 280000,
      oldPrice: 350000,
      rating: 4.6,
      sold: 135,
      stock: 50,
      image: "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&w=900&q=80",
      badge: "Mới",
      isFeatured: false,
      categoryId: categories["Giày dép"],
    },

    // Phụ kiện
    {
      name: "Túi đeo chéo Mini",
      description: "Túi đeo chéo da tổng hợp cao cấp, chống nước nhẹ, thiết kế nhỏ gọn tiện lợi với nhiều ngăn đựng đồ dùng cá nhân.",
      price: 299000,
      oldPrice: 399000,
      rating: 4.9,
      sold: 84,
      stock: 45,
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80",
      badge: "-25%",
      isFeatured: true,
      categoryId: categories["Phụ kiện"],
    },
    {
      name: "Đồng hồ Minimal Classic",
      description: "Đồng hồ dây da tối giản, mặt kính khoáng chống xước tốt, bộ máy quartz Nhật Bản độ chính xác cao và chống nước 3ATM.",
      price: 799000,
      oldPrice: 990000,
      rating: 4.7,
      sold: 62,
      stock: 20,
      image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=900&q=80",
      badge: "Mới",
      isFeatured: true,
      categoryId: categories["Phụ kiện"],
    },
    {
      name: "Balo Laptop Chống Nước Ultra",
      description: "Balo đa năng có ngăn chống sốc chuyên dụng cho laptop 15.6 inch, cổng sạc USB tích hợp, quai đeo êm ái thoáng khí trợ lực tốt.",
      price: 490000,
      oldPrice: 650000,
      rating: 4.9,
      sold: 178,
      stock: 35,
      image: "https://images.unsplash.com/photo-1546938576-6e6a64f317cc?auto=format&fit=crop&w=900&q=80",
      badge: "Bán chạy",
      isFeatured: true,
      categoryId: categories["Phụ kiện"],
    },
    {
      name: "Kính mát Polarized Chống UV400",
      description: "Tròng kính phân cực chống lóa nắng và cản 99.9% tia UV có hại, gọng kim loại titan nhẹ bền không gây áp lực sống mũi.",
      price: 250000,
      oldPrice: 350000,
      rating: 4.8,
      sold: 120,
      stock: 60,
      image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=80",
      badge: "Hot",
      isFeatured: false,
      categoryId: categories["Phụ kiện"],
    },
    {
      name: "Ví Da Nam Dáng Gập Veg-Tan",
      description: "Ví da bò sáp chế tác thủ công tỉ mỉ, giữ nguyên vân da tự nhiên, nhiều ngăn đựng thẻ ATM và tiền mặt gọn gàng.",
      price: 290000,
      oldPrice: 390000,
      rating: 4.8,
      sold: 95,
      stock: 40,
      image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=900&q=80",
      badge: "-25%",
      isFeatured: false,
      categoryId: categories["Phụ kiện"],
    },
    {
      name: "Mũ Lưỡi Trai Vintage Cotton",
      description: "Nón kết chất vải 100% cotton wash phong cách bụi bặm retro, thấm hút mồ hôi, khóa đồng điều chỉnh kích cỡ linh hoạt.",
      price: 150000,
      oldPrice: 199000,
      rating: 4.7,
      sold: 180,
      stock: 70,
      image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=900&q=80",
      badge: "Mới",
      isFeatured: false,
      categoryId: categories["Phụ kiện"],
    },

    // Đồ công nghệ
    {
      name: "Tai nghe Chống ồn Không dây Pro",
      description: "Tai nghe over-ear công nghệ khử tiếng ồn chủ động ANC đỉnh cao, âm bass trầm ấm sống động, thời lượng pin khủng lên đến 40 giờ liên tục.",
      price: 1290000,
      oldPrice: 1690000,
      rating: 4.9,
      sold: 156,
      stock: 25,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
      badge: "Hot",
      isFeatured: true,
      categoryId: categories["Đồ công nghệ"],
    },
    {
      name: "Bàn phím Cơ Không dây RGB",
      description: "Bàn phím cơ layout 84 phím nhỏ gọn, kết nối 3 chế độ (Bluetooth 5.0, Wireless 2.4G và Type-C), switch gõ êm mượt, LED RGB 16.8 triệu màu.",
      price: 890000,
      oldPrice: 1190000,
      rating: 4.9,
      sold: 130,
      stock: 30,
      image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80",
      badge: "Bán chạy",
      isFeatured: true,
      categoryId: categories["Đồ công nghệ"],
    },
    {
      name: "Chuột Công thái học Ergonomic",
      description: "Chuột góc nghiêng 57 độ bảo vệ cổ tay tránh mỏi khi làm việc thời gian dài, cảm biến quang học 4000 DPI siêu nhạy, phím bấm silent.",
      price: 450000,
      oldPrice: 590000,
      rating: 4.8,
      sold: 112,
      stock: 40,
      image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=900&q=80",
      badge: "Mới",
      isFeatured: false,
      categoryId: categories["Đồ công nghệ"],
    },
    {
      name: "Loa Bluetooth Bass Boost Di động",
      description: "Loa không dây chuẩn chống nước IPX7 thoải mái tiệc tùng bãi biển, âm thanh vòm 360 độ uy lực, pin chơi nhạc 12 tiếng liên tục.",
      price: 550000,
      oldPrice: 690000,
      rating: 4.8,
      sold: 88,
      stock: 35,
      image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=80",
      badge: "-20%",
      isFeatured: true,
      categoryId: categories["Đồ công nghệ"],
    },
    {
      name: "Đồng hồ Thông minh Smartwatch Sport",
      description: "Màn hình AMOLED sắc nét, theo dõi nhịp tim SpO2, đo giấc ngủ 24/7 và hơn 100 chế độ thể thao chuyên sâu, nhận thông báo tin nhắn và cuộc gọi.",
      price: 1450000,
      oldPrice: 1890000,
      rating: 4.9,
      sold: 98,
      stock: 20,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80",
      badge: "Hot",
      isFeatured: true,
      categoryId: categories["Đồ công nghệ"],
    },
    {
      name: "Sạc Dự phòng MagSafe 10000mAh",
      description: "Sạc dự phòng hít từ tính không dây 15W chuẩn Qi, hỗ trợ sạc nhanh Type-C Power Delivery 20W, thiết kế mỏng nhẹ tiện lợi bỏ túi.",
      price: 390000,
      oldPrice: 500000,
      rating: 4.7,
      sold: 145,
      stock: 50,
      image: "https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?auto=format&fit=crop&w=900&q=80",
      badge: "Tiện ích",
      isFeatured: false,
      categoryId: categories["Đồ công nghệ"],
    },
  ];

  for (const prod of productsData) {
    const existing = await prisma.product.findFirst({
      where: { name: prod.name },
    });
    if (!existing) {
      await prisma.product.create({ data: prod });
    } else {
      await prisma.product.update({
        where: { id: existing.id },
        data: prod,
      });
    }
  }

  // Seed Admin User
  const adminPassword = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@simpleshop.com" },
    update: { role: "ADMIN" },
    create: {
      name: "Admin SimpleShop",
      email: "admin@simpleshop.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  // Seed Regular User
  const userPassword = await bcrypt.hash("user123456", 10);
  await prisma.user.upsert({
    where: { email: "user@simpleshop.com" },
    update: {},
    create: {
      name: "Nguyễn Văn A",
      email: "user@simpleshop.com",
      password: userPassword,
      role: "USER",
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
