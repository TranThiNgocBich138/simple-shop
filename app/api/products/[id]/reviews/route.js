import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/products/[id]/reviews - Lấy danh sách đánh giá của sản phẩm
export async function GET(request, { params }) {
  try {
    const productId = Number(params.id);
    if (isNaN(productId)) {
      return NextResponse.json({ message: "ID sản phẩm không hợp lệ." }, { status: 400 });
    }

    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const total = reviews.length;
    const averageRating = total > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1)
      : "5.0";

    // Phân bố sao (1-5)
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of reviews) {
      if (distribution[r.rating] !== undefined) {
        distribution[r.rating]++;
      }
    }

    return NextResponse.json({
      reviews,
      total,
      averageRating: parseFloat(averageRating),
      distribution,
    });
  } catch (error) {
    console.error("GET_REVIEWS_ERROR:", error);
    return NextResponse.json({ message: "Lỗi lấy danh sách đánh giá." }, { status: 500 });
  }
}

// POST /api/products/[id]/reviews - Gửi nhận xét & đánh giá sao
export async function POST(request, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ message: "Vui lòng đăng nhập để đánh giá sản phẩm." }, { status: 401 });
    }

    const productId = Number(params.id);
    if (isNaN(productId)) {
      return NextResponse.json({ message: "ID sản phẩm không hợp lệ." }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ message: "Sản phẩm không tồn tại." }, { status: 404 });
    }

    const body = await request.json();
    const rating = Number(body.rating);
    const comment = body.comment?.trim();

    if (isNaN(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ message: "Đánh giá sao phải từ 1 đến 5 sao." }, { status: 400 });
    }

    if (!comment) {
      return NextResponse.json({ message: "Vui lòng nhập nội dung nhận xét." }, { status: 400 });
    }

    // Upsert review (nếu người dùng đã đánh giá thì cập nhật)
    const review = await prisma.review.upsert({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
      update: {
        rating,
        comment,
      },
      create: {
        userId: user.id,
        productId,
        rating,
        comment,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    // Cập nhật lại rating trung bình cho sản phẩm
    const allProductReviews = await prisma.review.findMany({
      where: { productId },
      select: { rating: true },
    });

    const newAvg = (
      allProductReviews.reduce((sum, r) => sum + r.rating, 0) / allProductReviews.length
    ).toFixed(1);

    await prisma.product.update({
      where: { id: productId },
      data: { rating: parseFloat(newAvg) },
    });

    return NextResponse.json({
      message: "Đánh giá sản phẩm thành công!",
      review,
      newAverageRating: parseFloat(newAvg),
    }, { status: 201 });
  } catch (error) {
    console.error("POST_REVIEW_ERROR:", error);
    return NextResponse.json({ message: "Lỗi khi gửi đánh giá." }, { status: 500 });
  }
}
