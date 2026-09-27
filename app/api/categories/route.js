import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("GET_CATEGORIES_ERROR:", error);
    return NextResponse.json({ message: "Lỗi lấy danh mục." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });
    }

    const body = await request.json();
    const { name, slug, icon, description } = body;

    if (!name || !slug) {
      return NextResponse.json({ message: "Vui lòng nhập Tên và Slug cho danh mục." }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug: slug.trim().toLowerCase(),
        icon: icon || "✦",
        description: description || "",
      },
    });

    return NextResponse.json({ message: "Tạo danh mục thành công.", category }, { status: 201 });
  } catch (error) {
    console.error("CREATE_CATEGORY_ERROR:", error);
    return NextResponse.json({ message: "Lỗi khi tạo danh mục." }, { status: 500 });
  }
}
