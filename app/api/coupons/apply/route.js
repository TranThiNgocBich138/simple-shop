import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/coupons/apply - Kiểm tra và áp dụng mã giảm giá
export async function POST(request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ message: "Vui lòng đăng nhập để áp dụng mã giảm giá." }, { status: 401 });
    }

    const body = await request.json();
    const code = body.code?.trim().toUpperCase();
    const totalAmount = Number(body.totalAmount || 0);

    if (!code) {
      return NextResponse.json({ message: "Vui lòng nhập mã giảm giá." }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code },
    });

    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ message: "Mã giảm giá không tồn tại hoặc đã hết hiệu lực." }, { status: 400 });
    }

    // Kiểm tra ngày hết hạn
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ message: "Mã giảm giá này đã hết hạn sử dụng." }, { status: 400 });
    }

    // Kiểm tra giá trị đơn hàng tối thiểu
    if (totalAmount < coupon.minAmount) {
      return NextResponse.json(
        {
          message: `Mã này chỉ áp dụng cho đơn hàng từ ${coupon.minAmount.toLocaleString("vi-VN")}₫ trở lên.`,
        },
        { status: 400 }
      );
    }

    // Tính số tiền giảm giá
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

    return NextResponse.json({
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
    return NextResponse.json({ message: "Lỗi kiểm tra mã giảm giá." }, { status: 500 });
  }
}
