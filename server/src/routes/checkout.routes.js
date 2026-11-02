const express = require("express");
const prisma = require("../prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// POST /api/checkout
router.post("/", requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const { customerName, customerEmail, customerPhone, address, paymentMethod, couponCode } = req.body;

    if (!customerName || !customerPhone || !address) {
      return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin nhận hàng (Họ tên, SĐT, Địa chỉ)." });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: { include: { product: true } },
      },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Giỏ hàng của bạn đang trống." });
    }

    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of cart.items) {
      const product = item.product;

      if (!product) {
        return res.status(400).json({ message: "Một số sản phẩm không còn tồn tại." });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Sản phẩm "${product.name}" chỉ còn ${product.stock} trong kho.`,
        });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItemsData.push({
        productId: product.id,
        price: product.price,
        quantity: item.quantity,
      });
    }

    const shippingFee = totalAmount > 500000 ? 0 : 30000;

    let discountAmount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const code = couponCode.trim().toUpperCase();
      const coupon = await prisma.coupon.findUnique({ where: { code } });
      if (coupon && coupon.isActive && (!coupon.expiresAt || new Date(coupon.expiresAt) >= new Date())) {
        if (totalAmount >= coupon.minAmount) {
          if (coupon.isPercent) {
            discountAmount = Math.round((totalAmount * coupon.discount) / 100);
            if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
              discountAmount = coupon.maxDiscount;
            }
          } else {
            discountAmount = Math.min(coupon.discount, totalAmount);
          }
          appliedCoupon = coupon.code;
        }
      }
    }

    const finalTotal = Math.max(0, totalAmount + shippingFee - discountAmount);

    const order = await prisma.$transaction(async (tx) => {
      const orderNum = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newOrder = await tx.order.create({
        data: {
          orderNumber: orderNum,
          userId: user.id,
          customerName: customerName.trim(),
          customerEmail: (customerEmail || user.email).trim(),
          customerPhone: customerPhone.trim(),
          address: address.trim(),
          paymentMethod: paymentMethod || "COD",
          status: "PENDING",
          totalAmount: finalTotal,
          couponCode: appliedCoupon,
          discountAmount: discountAmount,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: { include: { product: true } },
        },
      });

      for (const item of orderItemsData) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
            sold: { increment: item.quantity },
          },
        });
      }

      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    });

    return res.json({
      message: "Đặt hàng thành công!",
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    console.error("CHECKOUT_ERROR:", error);
    return res.status(500).json({ message: "Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại." });
  }
});

module.exports = router;
