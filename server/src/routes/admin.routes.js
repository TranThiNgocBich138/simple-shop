const express = require("express");
const prisma = require("../prisma");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Apply requireAdmin to all /api/admin routes
router.use(requireAdmin);

// GET /api/admin/dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);

    const [
      totalProducts,
      totalUsers,
      totalOrders,
      recentOrders,
      lowStockProducts,
      revenueResult,
      ordersByStatus,
      allOrdersThisYear,
      topSellingProducts,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.user.count(),
      prisma.order.count(),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          items: { include: { product: { select: { name: true, image: true } } } },
        },
      }),
      prisma.product.findMany({
        where: { stock: { lte: 10 } },
        take: 5,
        orderBy: { stock: "asc" },
        select: {
          id: true,
          name: true,
          stock: true,
          image: true,
          category: { select: { name: true } },
        },
      }),
      prisma.order.aggregate({
        where: { status: { not: "CANCELLED" } },
        _sum: { totalAmount: true },
      }),
      prisma.order.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.order.findMany({
        where: {
          createdAt: { gte: startOfYear },
          status: { not: "CANCELLED" },
        },
        select: {
          totalAmount: true,
          createdAt: true,
        },
      }),
      prisma.product.findMany({
        take: 5,
        orderBy: { sold: "desc" },
        select: {
          id: true,
          name: true,
          sold: true,
          image: true,
          price: true,
          category: { select: { name: true } },
        },
      }),
    ]);

    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      revenue: 0,
      orders: 0,
    }));

    for (const order of allOrdersThisYear) {
      const month = new Date(order.createdAt).getMonth();
      monthlyRevenue[month].revenue += order.totalAmount;
      monthlyRevenue[month].orders += 1;
    }

    const statusCount = {};
    for (const s of ordersByStatus) {
      statusCount[s.status] = s._count.id;
    }

    const totalRevenue = revenueResult._sum.totalAmount || 0;

    return res.json({
      totalProducts,
      totalUsers,
      totalOrders,
      totalRevenue,
      recentOrders,
      lowStockProducts,
      ordersByStatus: statusCount,
      monthlyRevenue,
      topSellingProducts,
    });
  } catch (error) {
    console.error("GET_ADMIN_DASHBOARD_ERROR:", error);
    return res.status(500).json({ message: "Lỗi lấy dữ liệu dashboard." });
  }
});

// GET /api/admin/orders
router.get("/orders", async (req, res) => {
  try {
    const status = req.query.status;
    const search = req.query.search || "";
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));

    const where = {};
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { customerName: { contains: search } },
        { customerPhone: { contains: search } },
        { customerEmail: { contains: search } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, image: true, price: true } },
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
    console.error("GET_ADMIN_ORDERS_ERROR:", error);
    return res.status(500).json({ message: "Lỗi lấy danh sách đơn hàng." });
  }
});

// PUT /api/admin/orders/:id - Cập nhật trạng thái
router.put("/orders/:id", async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    if (isNaN(orderId)) {
      return res.status(400).json({ message: "ID đơn hàng không hợp lệ." });
    }

    const { status } = req.body;
    const validStatuses = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Trạng thái đơn hàng không hợp lệ." });
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!existingOrder) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại." });
    }

    const wasNotCancelled = existingOrder.status !== "CANCELLED";
    const isCancelling = status === "CANCELLED";

    if (isCancelling && wasNotCancelled) {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: orderId },
          data: { status },
        });

        for (const item of existingOrder.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.quantity },
              sold: { decrement: item.quantity },
            },
          });
        }
      });
    } else {
      await prisma.order.update({
        where: { id: orderId },
        data: { status },
      });
    }

    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: { select: { id: true, name: true, image: true } } } },
      },
    });

    return res.json({ message: "Cập nhật trạng thái thành công.", order: updatedOrder });
  } catch (error) {
    console.error("UPDATE_ADMIN_ORDER_ERROR:", error);
    return res.status(500).json({ message: "Lỗi cập nhật đơn hàng." });
  }
});

// DELETE /api/admin/orders/:id - Xóa đơn hàng (chỉ xóa đơn đã HỦY)
router.delete("/orders/:id", async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    if (isNaN(orderId)) {
      return res.status(400).json({ message: "ID đơn hàng không hợp lệ." });
    }

    const existing = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existing) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại." });
    }

    if (existing.status !== "CANCELLED") {
      return res.status(400).json({
        message: "Chỉ có thể xóa đơn hàng đã bị hủy. Vui lòng hủy đơn hàng trước.",
      });
    }

    await prisma.order.delete({ where: { id: orderId } });

    return res.json({ message: "Xóa đơn hàng thành công." });
  } catch (error) {
    console.error("DELETE_ADMIN_ORDER_ERROR:", error);
    return res.status(500).json({ message: "Lỗi khi xóa đơn hàng." });
  }
});

// GET /api/admin/users
router.get("/users", async (req, res) => {
  try {
    const search = req.query.search || "";
    const role = req.query.role;
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }
    if (role && ["USER", "ADMIN"].includes(role)) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return res.json({
      users,
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
    console.error("GET_ADMIN_USERS_ERROR:", error);
    return res.status(500).json({ message: "Lỗi lấy danh sách người dùng." });
  }
});

// PUT /api/admin/users - Cập nhật role
router.put("/users", async (req, res) => {
  try {
    const { userId, role } = req.body;
    if (!userId || !role || !["USER", "ADMIN"].includes(role)) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ." });
    }

    if (req.user.id === Number(userId) && role !== "ADMIN") {
      return res.status(400).json({ message: "Bạn không thể tự gỡ quyền Admin của chính mình." });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!targetUser) {
      return res.status(404).json({ message: "Người dùng không tồn tại." });
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(userId) },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return res.json({ message: "Cập nhật quyền người dùng thành công.", user: updatedUser });
  } catch (error) {
    console.error("UPDATE_USER_ROLE_ERROR:", error);
    return res.status(500).json({ message: "Lỗi cập nhật người dùng." });
  }
});

// GET /api/admin/users/:id
router.get("/users/:id", async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "ID người dùng không hợp lệ." });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { orders: true } },
        orders: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại." });
    }

    return res.json({ user });
  } catch (error) {
    console.error("GET_USER_DETAIL_ERROR:", error);
    return res.status(500).json({ message: "Lỗi hệ thống." });
  }
});

// DELETE /api/admin/users/:id
router.delete("/users/:id", async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "ID người dùng không hợp lệ." });
    }

    if (req.user.id === userId) {
      return res.status(400).json({ message: "Bạn không thể tự xóa tài khoản của chính mình." });
    }

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      return res.status(404).json({ message: "Người dùng không tồn tại." });
    }

    await prisma.user.delete({ where: { id: userId } });

    return res.json({ message: "Xóa người dùng thành công." });
  } catch (error) {
    console.error("DELETE_USER_ERROR:", error);
    return res.status(500).json({ message: "Lỗi khi xóa người dùng." });
  }
});

// GET /api/admin/coupons
router.get("/coupons", async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    return res.json({ coupons });
  } catch (error) {
    console.error("GET_COUPONS_ERROR:", error);
    return res.status(500).json({ message: "Lỗi lấy danh sách mã giảm giá." });
  }
});

// POST /api/admin/coupons
router.post("/coupons", async (req, res) => {
  try {
    const { code, discount, isPercent, minAmount, maxDiscount, expiresAt } = req.body;
    if (!code || discount === undefined) {
      return res.status(400).json({ message: "Vui lòng nhập mã và mức giảm giá." });
    }

    const formattedCode = code.trim().toUpperCase();
    const existing = await prisma.coupon.findUnique({ where: { code: formattedCode } });
    if (existing) {
      return res.status(409).json({ message: "Mã giảm giá này đã tồn tại." });
    }

    const newCoupon = await prisma.coupon.create({
      data: {
        code: formattedCode,
        discount: Number(discount),
        isPercent: isPercent !== undefined ? Boolean(isPercent) : true,
        minAmount: Number(minAmount || 0),
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true,
      },
    });

    return res.status(201).json({ message: "Tạo mã giảm giá thành công.", coupon: newCoupon });
  } catch (error) {
    console.error("CREATE_COUPON_ERROR:", error);
    return res.status(500).json({ message: "Lỗi tạo mã giảm giá." });
  }
});

// PUT /api/admin/coupons/:id
router.put("/coupons/:id", async (req, res) => {
  try {
    const couponId = Number(req.params.id);
    if (isNaN(couponId)) {
      return res.status(400).json({ message: "ID mã giảm giá không hợp lệ." });
    }

    const { isActive, discount, minAmount, maxDiscount, expiresAt } = req.body;
    const updated = await prisma.coupon.update({
      where: { id: couponId },
      data: {
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(discount !== undefined && { discount: Number(discount) }),
        ...(minAmount !== undefined && { minAmount: Number(minAmount) }),
        ...(maxDiscount !== undefined && { maxDiscount: maxDiscount ? Number(maxDiscount) : null }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
      },
    });

    return res.json({ message: "Cập nhật mã giảm giá thành công.", coupon: updated });
  } catch (error) {
    console.error("UPDATE_COUPON_ERROR:", error);
    return res.status(500).json({ message: "Lỗi cập nhật mã giảm giá." });
  }
});

// DELETE /api/admin/coupons/:id
router.delete("/coupons/:id", async (req, res) => {
  try {
    const couponId = Number(req.params.id);
    if (isNaN(couponId)) {
      return res.status(400).json({ message: "ID mã giảm giá không hợp lệ." });
    }

    await prisma.coupon.delete({ where: { id: couponId } });
    return res.json({ message: "Xóa mã giảm giá thành công." });
  } catch (error) {
    console.error("DELETE_COUPON_ERROR:", error);
    return res.status(500).json({ message: "Lỗi xóa mã giảm giá." });
  }
});

module.exports = router;
