import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    message: "Đăng xuất thành công.",
  });

  response.cookies.set("userId", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}