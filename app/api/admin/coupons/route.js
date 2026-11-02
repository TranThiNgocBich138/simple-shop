import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/coupons - Danh sách mã giảm giá
export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });
    }

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ coupons });
  } catch (error) {
    console.error("GET_COUPONS_ERROR:", error);
    return NextResponse.json({ message: "Lỗi lấy danh sách mã giảm giá." }, { status: 500 });
  }
}

// POST /api/admin/coupons - Tạo mã giảm giá mới
export async function POST(request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });
    }

    const body = await request.json();
    const { code, discount, isPercent, minAmount, maxDiscount, expiresAt } = body;

    if (!code || discount === undefined) {
      return NextResponse.json({ message: "Vui lòng nhập mã và mức giảm giá." }, { status: 400 });
    }

    const formattedCode = code.trim().toUpperCase();

    const existing = await prisma.coupon.findUnique({
      where: { code: formattedCode },
    });

    if (existing) {
      return NextResponse.json({ message: "Mã giảm giá này đã tồn tại." }, { status: 409 });
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

    return NextResponse.json({
      message: "Tạo mã giảm giá thành công.",
      coupon: newCoupon,
    }, { status: 201 });
  } catch (error) {
    console.error("CREATE_COUPON_ERROR:", error);
    return NextResponse.json({ message: "Lỗi tạo mã giảm giá." }, { status: 500 });
  }
}
