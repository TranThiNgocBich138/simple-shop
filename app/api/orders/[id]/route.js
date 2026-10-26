import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// GET /api/orders/[id] - Lấy chi tiết đơn hàng
export async function GET(request, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
    }

    const orderId = Number(params.id);
    if (isNaN(orderId)) {
      return NextResponse.json({ message: "ID đơn hàng không hợp lệ." }, { status: 400 });
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
      return NextResponse.json({ message: "Đơn hàng không tồn tại." }, { status: 404 });
    }

    // Security check: User can ONLY view their OWN order unless ADMIN
    if (order.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Bạn không có quyền xem đơn hàng này." },
        { status: 403 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("GET_ORDER_DETAIL_ERROR:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}

// PUT /api/orders/[id] - Người dùng hủy đơn hàng của chính mình
export async function PUT(request, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
    }

    const orderId = Number(params.id);
    if (isNaN(orderId)) {
      return NextResponse.json({ message: "ID đơn hàng không hợp lệ." }, { status: 400 });
    }

    const body = await request.json();
    const { action } = body;

    if (action !== "cancel") {
      return NextResponse.json({ message: "Hành động không hợp lệ." }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json({ message: "Đơn hàng không tồn tại." }, { status: 404 });
    }

    if (order.userId !== user.id) {
      return NextResponse.json({ message: "Bạn không có quyền thao tác đơn hàng này." }, { status: 403 });
    }

    // Only allow cancel if order is PENDING or CONFIRMED
    if (!["PENDING", "CONFIRMED"].includes(order.status)) {
      return NextResponse.json(
        { message: `Không thể hủy đơn hàng ở trạng thái "${order.status}". Chỉ có thể hủy khi đơn đang chờ hoặc đã xác nhận.` },
        { status: 400 }
      );
    }

    // Cancel order and restore stock in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });

      // Restore product stock
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

    return NextResponse.json({ message: "Hủy đơn hàng thành công." });
  } catch (error) {
    console.error("CANCEL_ORDER_ERROR:", error);
    return NextResponse.json({ message: "Lỗi khi hủy đơn hàng." }, { status: 500 });
  }
}
