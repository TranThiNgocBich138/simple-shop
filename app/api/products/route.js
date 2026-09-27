import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId");

    const where = {};
    if (search) {
      where.name = { contains: search };
    }
    if (categoryId) {
      where.categoryId = Number(categoryId);
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("GET_PRODUCTS_ERROR:", error);
    return NextResponse.json({ message: "Lỗi lấy danh sách sản phẩm." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, price, oldPrice, stock, image, badge, categoryId, isFeatured } = body;

    if (!name || price === undefined || !categoryId || !image) {
      return NextResponse.json({ message: "Vui lòng nhập các thông tin bắt buộc (Tên, Giá, Danh mục, Hình ảnh)." }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description || "",
        price: Number(price),
        oldPrice: oldPrice ? Number(oldPrice) : null,
        stock: Number(stock ?? 100),
        image,
        badge: badge || null,
        isFeatured: Boolean(isFeatured),
        categoryId: Number(categoryId),
      },
    });

    return NextResponse.json({ message: "Tạo sản phẩm thành công.", product }, { status: 201 });
  } catch (error) {
    console.error("CREATE_PRODUCT_ERROR:", error);
    return NextResponse.json({ message: "Lỗi khi tạo sản phẩm." }, { status: 500 });
  }
}
