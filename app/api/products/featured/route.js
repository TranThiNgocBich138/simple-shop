import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/products/featured - Lấy sản phẩm nổi bật
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(20, Math.max(1, Number(searchParams.get("limit") || 8)));

    const products = await prisma.product.findMany({
      where: { isFeatured: true },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { sold: "desc" },
      take: limit,
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("GET_FEATURED_PRODUCTS_ERROR:", error);
    return NextResponse.json({ message: "Lỗi lấy sản phẩm nổi bật." }, { status: 500 });
  }
}
