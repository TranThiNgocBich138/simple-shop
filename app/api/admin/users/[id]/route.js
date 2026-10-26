import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// DELETE /api/admin/users/[id] - Xóa người dùng (Admin)
export async function DELETE(request, { params }) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });
    }

    const userId = Number(params.id);
    if (isNaN(userId)) {
      return NextResponse.json({ message: "ID người dùng không hợp lệ." }, { status: 400 });
    }

    // Prevent deleting yourself
    if (admin.id === userId) {
      return NextResponse.json({ message: "Bạn không thể tự xóa tài khoản của chính mình." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      return NextResponse.json({ message: "Người dùng không tồn tại." }, { status: 404 });
    }

    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ message: "Xóa người dùng thành công." });
  } catch (error) {
    console.error("DELETE_USER_ERROR:", error);
    return NextResponse.json({ message: "Lỗi khi xóa người dùng." }, { status: 500 });
  }
}

// GET /api/admin/users/[id] - Lấy chi tiết người dùng (Admin)
export async function GET(request, { params }) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });
    }

    const userId = Number(params.id);
    if (isNaN(userId)) {
      return NextResponse.json({ message: "ID người dùng không hợp lệ." }, { status: 400 });
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
      return NextResponse.json({ message: "Người dùng không tồn tại." }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("GET_USER_DETAIL_ERROR:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}
