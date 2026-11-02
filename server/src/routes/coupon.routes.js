const express = require("express");
const prisma = require("../prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// POST /api/coupons/apply
router.post("/apply", requireAuth, async (req, res) => {
  try {
    const code = req.body.code?.trim().toUpperCase();
    const totalAmount = Number(req.body.totalAmount || 0);

    if (!code) {
      return res.status(400).json({ message: "Vui lòng nhập mã giảm giá." });
    }

    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (!coupon || !coupon.isActive) {
      return res.status(400).json({ message: "Mã giảm giá không tồn tại hoặc đã hết hiệu lực." });
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({ message: "Mã giảm giá này đã hết hạn sử dụng." });
    }

    if (totalAmount < coupon.minAmount) {
      return res.status(400).json({
        message: `Mã này chỉ áp dụng cho đơn hàng từ ${coupon.minAmount.toLocaleString("vi-VN")}₫ trở lên.`,
      });
    }

    let discountAmount = 0;
    if (coupon.isPercent) {
      discountAmount = Math.round((totalAmount * coupon.discount) / 100);
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = Math.min(coupon.discount, totalAmount);
    }

    const finalAmount = Math.max(0, totalAmount - discountAmount);

    return res.json({
      message: `Áp dụng mã ${coupon.code} thành công!`,
      valid: true,
      coupon: {
        code: coupon.code,
        discount: coupon.discount,
        isPercent: coupon.isPercent,
      },
      discountAmount,
      finalAmount,
    });
  } catch (error) {
    console.error("APPLY_COUPON_ERROR:", error);
    return res.status(500).json({ message: "Lỗi kiểm tra mã giảm giá." });
  }
});

module.exports = router;
