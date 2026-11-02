const express = require("express");
const prisma = require("../prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/orders - Danh sách đơn hàng người dùng
router.get("/", requireAuth, async (req, res) => {
  try {
    const status = req.query.status;
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 10)));

    const where = { userId: req.user.id };
    if (status && status !== "ALL") {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, image: true, price: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return res.json({
      orders,
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
    console.error("GET_USER_ORDERS_ERROR:", error);
    return res.status(500).json({ message: "Lỗi lấy danh sách đơn hàng." });
  }
});

// GET /api/orders/:id - Chi tiết đơn hàng
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    if (isNaN(orderId)) {
      return res.status(400).json({ message: "ID đơn hàng không hợp lệ." });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, image: true, price: true, category: { select: { name: true } } },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại." });
    }

    if (order.userId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Bạn không có quyền xem đơn hàng này." });
    }

    return res.json({ order });
  } catch (error) {
    console.error("GET_ORDER_DETAIL_ERROR:", error);
    return res.status(500).json({ message: "Lỗi hệ thống." });
  }
});

// PUT /api/orders/:id - Hủy đơn hàng của chính mình
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    if (isNaN(orderId)) {
      return res.status(400).json({ message: "ID đơn hàng không hợp lệ." });
    }

    const { action } = req.body;
    if (action !== "cancel") {
      return res.status(400).json({ message: "Hành động không hợp lệ." });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại." });
    }

    if (order.userId !== req.user.id) {
      return res.status(403).json({ message: "Bạn không có quyền thao tác đơn hàng này." });
    }

    if (!["PENDING", "CONFIRMED"].includes(order.status)) {
      return res.status(400).json({
        message: `Không thể hủy đơn hàng ở trạng thái "${order.status}". Chỉ có thể hủy khi đơn đang chờ hoặc đã xác nhận.`,
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });

      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
            sold: { decrement: item.quantity },
          },
        });
      }
    });

    return res.json({ message: "Hủy đơn hàng thành công." });
  } catch (error) {
    console.error("CANCEL_ORDER_ERROR:", error);
    return res.status(500).json({ message: "Lỗi khi hủy đơn hàng." });
  }
});

module.exports = router;
