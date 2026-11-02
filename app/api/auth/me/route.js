import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/auth/me - Lấy thông tin người dùng hiện tại
export async function GET() {
  try {
    const user = await getAuthUser();
    return NextResponse.json({ user });
  } catch (error) {
    console.error("GET_ME_ERROR:", error);
    return NextResponse.json({ user: null, message: "Lỗi lấy thông tin người dùng." }, { status: 500 });
  }
}

// PUT /api/auth/me - Cập nhật thông tin profile
export async function PUT(request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
    });

    if (!user) {
      return NextResponse.json({ message: "Người dùng không tồn tại." }, { status: 404 });
    }

    const body = await request.json();
    const { name, currentPassword, newPassword } = body;

    // Validate name
    if (name !== undefined && !name.trim()) {
      return NextResponse.json({ message: "Họ tên không được để trống." }, { status: 400 });
    }

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ message: "Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu." }, { status: 400 });
      }

      const passwordCorrect = await bcrypt.compare(currentPassword, user.password);
      if (!passwordCorrect) {
        return NextResponse.json({ message: "Mật khẩu hiện tại không đúng." }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự." }, { status: 400 });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (newPassword) updateData.password = await bcrypt.hash(newPassword, 10);

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "Không có thông tin nào để cập nhật." }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: authUser.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({
      message: "Cập nhật thông tin thành công.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("UPDATE_PROFILE_ERROR:", error);
    return NextResponse.json({ message: "Lỗi khi cập nhật thông tin." }, { status: 500 });
  }
}