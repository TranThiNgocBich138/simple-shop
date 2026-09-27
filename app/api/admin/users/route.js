import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("GET_ADMIN_USERS_ERROR:", error);
    return NextResponse.json({ message: "Lỗi lấy danh sách người dùng." }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });
    }

    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role || !["USER", "ADMIN"].includes(role)) {
      return NextResponse.json({ message: "Dữ liệu không hợp lệ." }, { status: 400 });
    }

    // Prevent demoting self if admin
    if (admin.id === Number(userId) && role !== "ADMIN") {
      return NextResponse.json({ message: "Bạn không thể tự gỡ quyền Admin của chính mình." }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(userId) },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ message: "Cập nhật quyền người dùng thành công.", user: updatedUser });
  } catch (error) {
    console.error("UPDATE_USER_ROLE_ERROR:", error);
    return NextResponse.json({ message: "Lỗi cập nhật người dùng." }, { status: 500 });
  }
}
