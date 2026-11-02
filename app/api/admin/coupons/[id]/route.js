import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// DELETE /api/admin/coupons/[id] - Xóa mã giảm giá
export async function DELETE(request, { params }) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });
    }

    const couponId = Number(params.id);
    if (isNaN(couponId)) {
      return NextResponse.json({ message: "ID mã giảm giá không hợp lệ." }, { status: 400 });
    }

    const existing = await prisma.coupon.findUnique({ where: { id: couponId } });
    if (!existing) {
      return NextResponse.json({ message: "Mã giảm giá không tồn tại." }, { status: 404 });
    }

    await prisma.coupon.delete({ where: { id: couponId } });

    return NextResponse.json({ message: "Xóa mã giảm giá thành công." });
  } catch (error) {
    console.error("DELETE_COUPON_ERROR:", error);
    return NextResponse.json({ message: "Lỗi xóa mã giảm giá." }, { status: 500 });
  }
}

// PUT /api/admin/coupons/[id] - Bật/tắt trạng thái mã giảm giá
export async function PUT(request, { params }) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });
    }

    const couponId = Number(params.id);
    if (isNaN(couponId)) {
      return NextResponse.json({ message: "ID mã giảm giá không hợp lệ." }, { status: 400 });
    }

    const body = await request.json();
    const { isActive, discount, minAmount, maxDiscount, expiresAt } = body;

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

    return NextResponse.json({ message: "Cập nhật mã giảm giá thành công.", coupon: updated });
  } catch (error) {
    console.error("UPDATE_COUPON_ERROR:", error);
    return NextResponse.json({ message: "Lỗi cập nhật mã giảm giá." }, { status: 500 });
  }
}
