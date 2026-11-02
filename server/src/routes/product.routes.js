const express = require("express");
const prisma = require("../prisma");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// GET /api/products/search - Tìm kiếm nhanh
router.get("/search", async (req, res) => {
  try {
    const q = req.query.q || "";
    const limit = Math.min(20, Math.max(1, Number(req.query.limit || 10)));

    if (!q.trim()) {
      return res.json({ products: [] });
    }

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { description: { contains: q } },
          { badge: { contains: q } },
        ],
      },
      select: {
        id: true,
        name: true,
        price: true,
        oldPrice: true,
        image: true,
        badge: true,
        rating: true,
        stock: true,
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { sold: "desc" },
      take: limit,
    });

    return res.json({ products, query: q });
  } catch (error) {
    console.error("SEARCH_PRODUCTS_ERROR:", error);
    return res.status(500).json({ message: "Lỗi tìm kiếm sản phẩm." });
  }
});

// GET /api/products/featured - Sản phẩm nổi bật
router.get("/featured", async (req, res) => {
  try {
    const limit = Math.min(20, Math.max(1, Number(req.query.limit || 8)));
    const products = await prisma.product.findMany({
      where: { isFeatured: true },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { sold: "desc" },
      take: limit,
    });
    return res.json({ products });
  } catch (error) {
    console.error("GET_FEATURED_PRODUCTS_ERROR:", error);
    return res.status(500).json({ message: "Lỗi lấy sản phẩm nổi bật." });
  }
});

// GET /api/products - Danh sách sản phẩm (có lọc, phân trang, sắp xếp)
router.get("/", async (req, res) => {
  try {
    const search = req.query.search || "";
    const categoryId = req.query.categoryId;
    const featured = req.query.featured;
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder || "desc";
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));

    const where = {};
    if (search) {
      where.name = { contains: search };
    }
    if (categoryId) {
      where.categoryId = Number(categoryId);
    }
    if (featured === "true") {
      where.isFeatured = true;
    }

    const allowedSortFields = ["createdAt", "price", "sold", "stock", "name", "rating"];
    const orderByField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const orderByDir = sortOrder === "asc" ? "asc" : "desc";

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { [orderByField]: orderByDir },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return res.json({
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("GET_PRODUCTS_ERROR:", error);
    return res.status(500).json({ message: "Lỗi lấy danh sách sản phẩm." });
  }
});

// GET /api/products/:id - Chi tiết sản phẩm
router.get("/:id", async (req, res) => {
  try {
    const productId = Number(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({ message: "ID sản phẩm không hợp lệ." });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true },
    });

    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại." });
    }

    return res.json({ product });
  } catch (error) {
    console.error("GET_PRODUCT_DETAIL_ERROR:", error);
    return res.status(500).json({ message: "Lỗi hệ thống." });
  }
});

// POST /api/products - Tạo sản phẩm (Admin)
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { name, description, price, oldPrice, stock, image, badge, categoryId, isFeatured, rating } = req.body;

    if (!name || price === undefined || !categoryId || !image) {
      return res.status(400).json({ message: "Vui lòng nhập các thông tin bắt buộc (Tên, Giá, Danh mục, Hình ảnh)." });
    }

    if (Number(price) < 0) {
      return res.status(400).json({ message: "Giá sản phẩm không hợp lệ." });
    }

    const categoryExists = await prisma.category.findUnique({ where: { id: Number(categoryId) } });
    if (!categoryExists) {
      return res.status(404).json({ message: "Danh mục không tồn tại." });
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : "",
        price: Number(price),
        oldPrice: oldPrice ? Number(oldPrice) : null,
        stock: Number(stock ?? 100),
        image,
        badge: badge || null,
        isFeatured: Boolean(isFeatured),
        rating: rating ? Number(rating) : 5.0,
        categoryId: Number(categoryId),
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    return res.status(201).json({ message: "Tạo sản phẩm thành công.", product });
  } catch (error) {
    console.error("CREATE_PRODUCT_ERROR:", error);
    return res.status(500).json({ message: "Lỗi khi tạo sản phẩm." });
  }
});

// PUT /api/products/:id - Cập nhật sản phẩm (Admin)
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const productId = Number(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({ message: "ID sản phẩm không hợp lệ." });
    }

    const { name, description, price, oldPrice, stock, image, badge, categoryId, isFeatured } = req.body;

    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại." });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: Number(price) }),
        ...(oldPrice !== undefined && { oldPrice: oldPrice ? Number(oldPrice) : null }),
        ...(stock !== undefined && { stock: Number(stock) }),
        ...(image && { image }),
        ...(badge !== undefined && { badge: badge || null }),
        ...(categoryId && { categoryId: Number(categoryId) }),
        ...(isFeatured !== undefined && { isFeatured: Boolean(isFeatured) }),
      },
    });

    return res.json({ message: "Cập nhật sản phẩm thành công.", product: updatedProduct });
  } catch (error) {
    console.error("UPDATE_PRODUCT_ERROR:", error);
    return res.status(500).json({ message: "Lỗi khi cập nhật sản phẩm." });
  }
});

// DELETE /api/products/:id - Xóa sản phẩm (Admin)
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const productId = Number(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({ message: "ID sản phẩm không hợp lệ." });
    }

    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại." });
    }

    await prisma.product.delete({ where: { id: productId } });

    return res.json({ message: "Xóa sản phẩm thành công." });
  } catch (error) {
    console.error("DELETE_PRODUCT_ERROR:", error);
    return res.status(500).json({ message: "Lỗi khi xóa sản phẩm." });
  }
});

// GET /api/products/:id/reviews - Lấy đánh giá của sản phẩm
router.get("/:id/reviews", async (req, res) => {
  try {
    const productId = Number(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({ message: "ID sản phẩm không hợp lệ." });
    }

    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const total = reviews.length;
    const averageRating = total > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1)
      : "5.0";

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of reviews) {
      if (distribution[r.rating] !== undefined) {
        distribution[r.rating]++;
      }
    }

    return res.json({
      reviews,
      total,
      averageRating: parseFloat(averageRating),
      distribution,
    });
  } catch (error) {
    console.error("GET_REVIEWS_ERROR:", error);
    return res.status(500).json({ message: "Lỗi lấy danh sách đánh giá." });
  }
});

// POST /api/products/:id/reviews - Gửi đánh giá sản phẩm
router.post("/:id/reviews", requireAuth, async (req, res) => {
  try {
    const productId = Number(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({ message: "ID sản phẩm không hợp lệ." });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại." });
    }

    const rating = Number(req.body.rating);
    const comment = req.body.comment?.trim();

    if (isNaN(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Đánh giá sao phải từ 1 đến 5 sao." });
    }

    if (!comment) {
      return res.status(400).json({ message: "Vui lòng nhập nội dung nhận xét." });
    }

    const review = await prisma.review.upsert({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId,
        },
      },
      update: { rating, comment },
      create: {
        userId: req.user.id,
        productId,
        rating,
        comment,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    const allProductReviews = await prisma.review.findMany({
      where: { productId },
      select: { rating: true },
    });

    const newAvg = (
      allProductReviews.reduce((sum, r) => sum + r.rating, 0) / allProductReviews.length
    ).toFixed(1);

    await prisma.product.update({
      where: { id: productId },
      data: { rating: parseFloat(newAvg) },
    });

    return res.status(201).json({
      message: "Đánh giá sản phẩm thành công!",
      review,
      newAverageRating: parseFloat(newAvg),
    });
  } catch (error) {
    console.error("POST_REVIEW_ERROR:", error);
    return res.status(500).json({ message: "Lỗi khi gửi đánh giá." });
  }
});

module.exports = router;
