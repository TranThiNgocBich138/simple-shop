import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/stats - Thống kê chi tiết theo khoảng thời gian
export async function GET(request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const year = Number(searchParams.get("year") || new Date().getFullYear());

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const [
      ordersThisYear,
      newUsersThisYear,
      categoryStats,
    ] = await Promise.all([
      // Tất cả đơn hàng trong năm
      prisma.order.findMany({
        where: {
          createdAt: { gte: startDate, lt: endDate },
        },
        select: {
          status: true,
          totalAmount: true,
          createdAt: true,
        },
      }),
      // Người dùng đăng ký trong năm
      prisma.user.findMany({
        where: {
          createdAt: { gte: startDate, lt: endDate },
        },
        select: { createdAt: true },
      }),
      // Thống kê theo danh mục
      prisma.category.findMany({
        include: {
          _count: { select: { products: true } },
          products: {
            select: { sold: true, price: true },
          },
        },
      }),
    ]);

    // Build monthly stats
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      revenue: 0,
      orders: 0,
      cancelledOrders: 0,
      newUsers: 0,
    }));

    for (const order of ordersThisYear) {
      const month = new Date(order.createdAt).getMonth();
      monthlyData[month].orders += 1;
      if (order.status === "CANCELLED") {
        monthlyData[month].cancelledOrders += 1;
      } else {
        monthlyData[month].revenue += order.totalAmount;
      }
    }

    for (const user of newUsersThisYear) {
      const month = new Date(user.createdAt).getMonth();
      monthlyData[month].newUsers += 1;
    }

    // Category summary
    const categorySummary = categoryStats.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      productCount: cat._count.products,
      totalSold: cat.products.reduce((sum, p) => sum + p.sold, 0),
      totalRevenue: cat.products.reduce((sum, p) => sum + p.price * p.sold, 0),
    }));

    return NextResponse.json({
      year,
      monthlyData,
      categorySummary,
      totalOrdersThisYear: ordersThisYear.length,
      totalRevenueThisYear: ordersThisYear
        .filter((o) => o.status !== "CANCELLED")
        .reduce((sum, o) => sum + o.totalAmount, 0),
      totalNewUsersThisYear: newUsersThisYear.length,
    });
  } catch (error) {
    console.error("GET_ADMIN_STATS_ERROR:", error);
    return NextResponse.json({ message: "Lỗi lấy thống kê." }, { status: 500 });
  }
}
