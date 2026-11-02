import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    message: "Đăng xuất thành công.",
  });

  const clearCookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };

  response.cookies.set("auth_token", "", clearCookieOptions);
  response.cookies.set("userId", "", clearCookieOptions);

  return response;
}