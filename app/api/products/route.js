import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId");
    const featured = searchParams.get("featured");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 20)));

    const where = {};
    if (search) {
      where.name = { contains: search };
    }
    if (categoryId) {
      where.categoryId = Number(categoryId);
    }
    if (featured === "true") {
      where.isFeatured = true;
    }

    // Allowed sort fields
    const allowedSortFields = ["createdAt", "price", "sold", "stock", "name", "rating"];
    const orderByField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const orderByDir = sortOrder === "asc" ? "asc" : "desc";

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { [orderByField]: orderByDir },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
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
    const { name, description, price, oldPrice, stock, image, badge, categoryId, isFeatured, rating } = body;

    if (!name || price === undefined || !categoryId || !image) {
      return NextResponse.json(
        { message: "Vui lòng nhập các thông tin bắt buộc (Tên, Giá, Danh mục, Hình ảnh)." },
        { status: 400 }
      );
    }

    if (Number(price) < 0) {
      return NextResponse.json({ message: "Giá sản phẩm không hợp lệ." }, { status: 400 });
    }

    // Verify category exists
    const categoryExists = await prisma.category.findUnique({ where: { id: Number(categoryId) } });
    if (!categoryExists) {
      return NextResponse.json({ message: "Danh mục không tồn tại." }, { status: 404 });
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : "",
        price: Number(price),
        oldPrice: oldPrice ? Number(oldPrice) : null,
        stock: Number(stock ?? 100),
        image,
        badge: badge || null,
        isFeatured: Boolean(isFeatured),
        rating: rating ? Number(rating) : 5.0,
        categoryId: Number(categoryId),
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json({ message: "Tạo sản phẩm thành công.", product }, { status: 201 });
  } catch (error) {
    console.error("CREATE_PRODUCT_ERROR:", error);
    return NextResponse.json({ message: "Lỗi khi tạo sản phẩm." }, { status: 500 });
  }
}
