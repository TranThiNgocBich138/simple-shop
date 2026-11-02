import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { signAuthToken } from "@/lib/auth";

export async function POST(request) {
  try {
    const body = await request.json();

    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json(
        {
          message: "Vui lòng nhập email và mật khẩu.",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          message: "Email hoặc mật khẩu không đúng.",
        },
        { status: 401 }
      );
    }

    const passwordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordCorrect) {
      return NextResponse.json(
        {
          message: "Email hoặc mật khẩu không đúng.",
        },
        { status: 401 }
      );
    }

    // Ký token bảo mật HMAC-SHA256
    const token = signAuthToken({ userId: user.id, role: user.role, email: user.email });

    const response = NextResponse.json({
      message: "Đăng nhập thành công.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    const cookieOptions = {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 ngày
    };

    // Thiết lập auth_token mã hóa có chữ ký
    response.cookies.set("auth_token", token, cookieOptions);
    response.cookies.set("userId", String(user.id), cookieOptions);

    return response;
  } catch (error) {
    console.error("LOGIN_ERROR:", error);

    return NextResponse.json(
      {
        message: "Có lỗi xảy ra khi đăng nhập.",
      },
      { status: 500 }
    );
  }
}