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
    {
      name: "Áo thun Essential",
      description: "Áo thun cotton cao cấp thoáng mát, thấm hút mồ hôi tốt, kiểu dáng trẻ trung.",
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
      name: "Sneaker Urban White",
      description: "Sneaker trắng thời trang, đế cao su êm ái, phù hợp nhiều phong cách.",
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
      name: "Túi đeo chéo Mini",
      description: "Túi đeo chéo da tổng hợp cao cấp, chống nước nhẹ, thiết kế nhỏ gọn tiện lợi.",
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
      name: "Đồng hồ Minimal",
      description: "Đồng hồ dây da tối giản, kính khoáng chống xước, máy quartz Nhật Bản.",
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
  ];

  for (const prod of productsData) {
    const existing = await prisma.product.findFirst({
      where: { name: prod.name },
    });
    if (!existing) {
      await prisma.product.create({ data: prod });
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
