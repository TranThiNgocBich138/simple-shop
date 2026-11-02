const express = require("express");
const prisma = require("../prisma");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// GET /api/categories
router.get("/", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: "asc" },
    });
    return res.json({ categories });
  } catch (error) {
    console.error("GET_CATEGORIES_ERROR:", error);
    return res.status(500).json({ message: "Lỗi lấy danh mục." });
  }
});

// GET /api/categories/:id
router.get("/:id", async (req, res) => {
  try {
    const categoryId = Number(req.params.id);
    if (isNaN(categoryId)) {
      return res.status(400).json({ message: "ID danh mục không hợp lệ." });
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: { select: { products: true } },
        products: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            name: true,
            price: true,
            image: true,
            stock: true,
            sold: true,
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({ message: "Danh mục không tồn tại." });
    }

    return res.json({ category });
  } catch (error) {
    console.error("GET_CATEGORY_DETAIL_ERROR:", error);
    return res.status(500).json({ message: "Lỗi hệ thống." });
  }
});

// POST /api/categories - Tạo danh mục (Admin)
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { name, slug, icon, description } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ message: "Vui lòng nhập tên và slug danh mục." });
    }

    const existingSlug = await prisma.category.findUnique({
      where: { slug: slug.trim().toLowerCase() },
    });

    if (existingSlug) {
      return res.status(409).json({ message: "Slug này đã tồn tại." });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        icon: icon || "✦",
        description: description || "",
      },
    });

    return res.status(201).json({ message: "Tạo danh mục thành công.", category });
  } catch (error) {
    console.error("CREATE_CATEGORY_ERROR:", error);
    return res.status(500).json({ message: "Lỗi tạo danh mục." });
  }
});

// PUT /api/categories/:id - Cập nhật danh mục (Admin)
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const categoryId = Number(req.params.id);
    if (isNaN(categoryId)) {
      return res.status(400).json({ message: "ID danh mục không hợp lệ." });
    }

    const { name, slug, icon, description } = req.body;

    const existing = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!existing) {
      return res.status(404).json({ message: "Danh mục không tồn tại." });
    }

    if (slug && slug !== existing.slug) {
      const slugConflict = await prisma.category.findUnique({
        where: { slug: slug.trim().toLowerCase() },
      });
      if (slugConflict) {
        return res.status(409).json({ message: "Slug này đã được sử dụng bởi danh mục khác." });
      }
    }

    if (name && name !== existing.name) {
      const nameConflict = await prisma.category.findUnique({
        where: { name: name.trim() },
      });
      if (nameConflict) {
        return res.status(409).json({ message: "Tên danh mục này đã tồn tại." });
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(name && { name: name.trim() }),
        ...(slug && { slug: slug.trim().toLowerCase() }),
        ...(icon !== undefined && { icon: icon || "✦" }),
        ...(description !== undefined && { description }),
      },
    });

    return res.json({
      message: "Cập nhật danh mục thành công.",
      category: updatedCategory,
    });
  } catch (error) {
    console.error("UPDATE_CATEGORY_ERROR:", error);
    return res.status(500).json({ message: "Lỗi khi cập nhật danh mục." });
  }
});

// DELETE /api/categories/:id - Xóa danh mục (Admin)
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const categoryId = Number(req.params.id);
    if (isNaN(categoryId)) {
      return res.status(400).json({ message: "ID danh mục không hợp lệ." });
    }

    const existing = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { _count: { select: { products: true } } },
    });

    if (!existing) {
      return res.status(404).json({ message: "Danh mục không tồn tại." });
    }

    if (existing._count.products > 0) {
      return res.status(400).json({
        message: `Không thể xóa danh mục đang có ${existing._count.products} sản phẩm. Vui lòng xóa hoặc chuyển sản phẩm sang danh mục khác trước.`,
      });
    }

    await prisma.category.delete({ where: { id: categoryId } });

    return res.json({ message: "Xóa danh mục thành công." });
  } catch (error) {
    console.error("DELETE_CATEGORY_ERROR:", error);
    return res.status(500).json({ message: "Lỗi khi xóa danh mục." });
  }
});

module.exports = router;
