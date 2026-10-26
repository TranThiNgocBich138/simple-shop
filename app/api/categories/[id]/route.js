import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// GET /api/categories/[id] - Lấy chi tiết một danh mục
export async function GET(request, { params }) {
  try {
    const categoryId = Number(params.id);
    if (isNaN(categoryId)) {
      return NextResponse.json({ message: "ID danh mục không hợp lệ." }, { status: 400 });
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { products: true },
        },
        products: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            name: true,
            price: true,
            image: true,
            stock: true,
            sold: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ message: "Danh mục không tồn tại." }, { status: 404 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error("GET_CATEGORY_DETAIL_ERROR:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}

// PUT /api/categories/[id] - Cập nhật danh mục (Admin)
export async function PUT(request, { params }) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });
    }

    const categoryId = Number(params.id);
    if (isNaN(categoryId)) {
      return NextResponse.json({ message: "ID danh mục không hợp lệ." }, { status: 400 });
    }

    const body = await request.json();
    const { name, slug, icon, description } = body;

    const existing = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!existing) {
      return NextResponse.json({ message: "Danh mục không tồn tại." }, { status: 404 });
    }

    // Check slug unique (exclude current)
    if (slug && slug !== existing.slug) {
      const slugConflict = await prisma.category.findUnique({
        where: { slug: slug.trim().toLowerCase() },
      });
      if (slugConflict) {
        return NextResponse.json({ message: "Slug này đã được sử dụng bởi danh mục khác." }, { status: 409 });
      }
    }

    // Check name unique (exclude current)
    if (name && name !== existing.name) {
      const nameConflict = await prisma.category.findUnique({
        where: { name: name.trim() },
      });
      if (nameConflict) {
        return NextResponse.json({ message: "Tên danh mục này đã tồn tại." }, { status: 409 });
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(name && { name: name.trim() }),
        ...(slug && { slug: slug.trim().toLowerCase() }),
        ...(icon !== undefined && { icon: icon || "✦" }),
        ...(description !== undefined && { description }),
      },
    });

    return NextResponse.json({
      message: "Cập nhật danh mục thành công.",
      category: updatedCategory,
    });
  } catch (error) {
    console.error("UPDATE_CATEGORY_ERROR:", error);
    return NextResponse.json({ message: "Lỗi khi cập nhật danh mục." }, { status: 500 });
  }
}

// DELETE /api/categories/[id] - Xóa danh mục (Admin)
export async function DELETE(request, { params }) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });
    }

    const categoryId = Number(params.id);
    if (isNaN(categoryId)) {
      return NextResponse.json({ message: "ID danh mục không hợp lệ." }, { status: 400 });
    }

    const existing = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { _count: { select: { products: true } } },
    });

    if (!existing) {
      return NextResponse.json({ message: "Danh mục không tồn tại." }, { status: 404 });
    }

    if (existing._count.products > 0) {
      return NextResponse.json(
        {
          message: `Không thể xóa danh mục đang có ${existing._count.products} sản phẩm. Vui lòng xóa hoặc chuyển sản phẩm sang danh mục khác trước.`,
        },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id: categoryId } });

    return NextResponse.json({ message: "Xóa danh mục thành công." });
  } catch (error) {
    console.error("DELETE_CATEGORY_ERROR:", error);
    return NextResponse.json({ message: "Lỗi khi xóa danh mục." }, { status: 500 });
  }
}
