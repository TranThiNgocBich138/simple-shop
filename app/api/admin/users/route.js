import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/users - Lấy danh sách người dùng với tìm kiếm và phân trang
export async function GET(request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role");
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 20)));

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }
    if (role && ["USER", "ADMIN"].includes(role)) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("GET_ADMIN_USERS_ERROR:", error);
    return NextResponse.json({ message: "Lỗi lấy danh sách người dùng." }, { status: 500 });
  }
}

// PUT /api/admin/users - Cập nhật role người dùng
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

    const targetUser = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!targetUser) {
      return NextResponse.json({ message: "Người dùng không tồn tại." }, { status: 404 });
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
