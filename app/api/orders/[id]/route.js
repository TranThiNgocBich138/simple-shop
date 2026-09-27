import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

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
          include: { product: true },
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
