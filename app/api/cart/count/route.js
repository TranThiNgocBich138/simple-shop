import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/cart/count - Lấy số lượng item trong giỏ hàng (nhanh, dùng cho badge)
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ count: 0 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        _count: { select: { items: true } },
      },
    });

    const count = cart?._count?.items || 0;

    return NextResponse.json({ count });
  } catch (error) {
    console.error("GET_CART_COUNT_ERROR:", error);
    return NextResponse.json({ count: 0 });
  }
}
