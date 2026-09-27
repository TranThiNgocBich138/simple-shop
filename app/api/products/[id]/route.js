import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(request, { params }) {
  try {
    const productId = Number(params.id);
    if (isNaN(productId)) {
      return NextResponse.json({ message: "ID sản phẩm không hợp lệ." }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true },
    });

    if (!product) {
      return NextResponse.json({ message: "Sản phẩm không tồn tại." }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("GET_PRODUCT_DETAIL_ERROR:", error);
    return NextResponse.json({ message: "Lỗi hệ thống." }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });
    }

    const productId = Number(params.id);
    if (isNaN(productId)) {
      return NextResponse.json({ message: "ID sản phẩm không hợp lệ." }, { status: 400 });
    }

    const body = await request.json();
    const { name, description, price, oldPrice, stock, image, badge, categoryId, isFeatured } = body;

    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing) {
      return NextResponse.json({ message: "Sản phẩm không tồn tại." }, { status: 404 });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: Number(price) }),
        ...(oldPrice !== undefined && { oldPrice: oldPrice ? Number(oldPrice) : null }),
        ...(stock !== undefined && { stock: Number(stock) }),
        ...(image && { image }),
        ...(badge !== undefined && { badge: badge || null }),
        ...(categoryId && { categoryId: Number(categoryId) }),
        ...(isFeatured !== undefined && { isFeatured: Boolean(isFeatured) }),
      },
    });

    return NextResponse.json({ message: "Cập nhật sản phẩm thành công.", product: updatedProduct });
  } catch (error) {
    console.error("UPDATE_PRODUCT_ERROR:", error);
    return NextResponse.json({ message: "Lỗi khi cập nhật sản phẩm." }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });
    }

    const productId = Number(params.id);
    if (isNaN(productId)) {
      return NextResponse.json({ message: "ID sản phẩm không hợp lệ." }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing) {
      return NextResponse.json({ message: "Sản phẩm không tồn tại." }, { status: 404 });
    }

    await prisma.product.delete({ where: { id: productId } });

    return NextResponse.json({ message: "Xóa sản phẩm thành công." });
  } catch (error) {
    console.error("DELETE_PRODUCT_ERROR:", error);
    return NextResponse.json({ message: "Lỗi khi xóa sản phẩm." }, { status: 500 });
  }
}
