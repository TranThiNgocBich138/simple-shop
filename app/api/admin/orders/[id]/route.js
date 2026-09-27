import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function PUT(request, { params }) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });
    }

    const orderId = Number(params.id);
    if (isNaN(orderId)) {
      return NextResponse.json({ message: "ID đơn hàng không hợp lệ." }, { status: 400 });
    }

    const body = await request.json();
    const { status } = body;

    const validStatuses = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ message: "Trạng thái đơn hàng không hợp lệ." }, { status: 400 });
    }

    const existingOrder = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existingOrder) {
      return NextResponse.json({ message: "Đơn hàng không tồn tại." }, { status: 404 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    return NextResponse.json({ message: "Cập nhật trạng thái thành công.", order: updatedOrder });
  } catch (error) {
    console.error("UPDATE_ADMIN_ORDER_ERROR:", error);
    return NextResponse.json({ message: "Lỗi cập nhật đơn hàng." }, { status: 500 });
  }
}
