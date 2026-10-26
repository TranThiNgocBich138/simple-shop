import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// PUT /api/admin/orders/[id] - Cập nhật trạng thái đơn hàng (Admin)
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

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ message: "Đơn hàng không tồn tại." }, { status: 404 });
    }

    // If transitioning to CANCELLED and wasn't already CANCELLED, restore stock
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

    return NextResponse.json({ message: "Cập nhật trạng thái thành công.", order: updatedOrder });
  } catch (error) {
    console.error("UPDATE_ADMIN_ORDER_ERROR:", error);
    return NextResponse.json({ message: "Lỗi cập nhật đơn hàng." }, { status: 500 });
  }
}

// DELETE /api/admin/orders/[id] - Xóa đơn hàng (Admin) - chỉ cho phép xóa đơn đã HỦY
export async function DELETE(request, { params }) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });
    }

    const orderId = Number(params.id);
    if (isNaN(orderId)) {
      return NextResponse.json({ message: "ID đơn hàng không hợp lệ." }, { status: 400 });
    }

    const existing = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existing) {
      return NextResponse.json({ message: "Đơn hàng không tồn tại." }, { status: 404 });
    }

    if (existing.status !== "CANCELLED") {
      return NextResponse.json(
        { message: "Chỉ có thể xóa đơn hàng đã bị hủy. Vui lòng hủy đơn hàng trước." },
        { status: 400 }
      );
    }

    await prisma.order.delete({ where: { id: orderId } });

    return NextResponse.json({ message: "Xóa đơn hàng thành công." });
  } catch (error) {
    console.error("DELETE_ADMIN_ORDER_ERROR:", error);
    return NextResponse.json({ message: "Lỗi khi xóa đơn hàng." }, { status: 500 });
  }
}
