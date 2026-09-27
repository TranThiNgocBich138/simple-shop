import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });
    }

    const [totalProducts, totalUsers, totalOrders, orders, lowStockProducts] = await Promise.all([
      prisma.product.count(),
      prisma.user.count(),
      prisma.order.count(),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.product.findMany({
        where: { stock: { lte: 10 } },
        take: 5,
        orderBy: { stock: "asc" },
      }),
    ]);

    const revenueResult = await prisma.order.aggregate({
      where: { status: { not: "CANCELLED" } },
      _sum: { totalAmount: true },
    });

    const totalRevenue = revenueResult._sum.totalAmount || 0;

    return NextResponse.json({
      totalProducts,
      totalUsers,
      totalOrders,
      totalRevenue,
      recentOrders: orders,
      lowStockProducts,
    });
  } catch (error) {
    console.error("GET_ADMIN_DASHBOARD_ERROR:", error);
    return NextResponse.json({ message: "Lỗi lấy dữ liệu dashboard." }, { status: 500 });
  }
}
