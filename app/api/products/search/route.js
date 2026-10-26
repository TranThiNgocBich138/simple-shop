import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/products/search - Tìm kiếm sản phẩm nhanh (autocomplete / full search)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const limit = Math.min(20, Math.max(1, Number(searchParams.get("limit") || 10)));

    if (!q.trim()) {
      return NextResponse.json({ products: [] });
    }

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { description: { contains: q } },
          { badge: { contains: q } },
        ],
      },
      select: {
        id: true,
        name: true,
        price: true,
        oldPrice: true,
        image: true,
        badge: true,
        rating: true,
        stock: true,
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { sold: "desc" },
      take: limit,
    });

    return NextResponse.json({ products, query: q });
  } catch (error) {
    console.error("SEARCH_PRODUCTS_ERROR:", error);
    return NextResponse.json({ message: "Lỗi tìm kiếm sản phẩm." }, { status: 500 });
  }
}
