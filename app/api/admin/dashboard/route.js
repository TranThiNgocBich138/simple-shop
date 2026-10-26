import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/dashboard - Thống kê tổng quan + biểu đồ doanh thu theo tháng
export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);

    const [
      totalProducts,
      totalUsers,
      totalOrders,
      recentOrders,
      lowStockProducts,
      revenueResult,
      ordersByStatus,
      allOrdersThisYear,
      topSellingProducts,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.user.count(),
      prisma.order.count(),
      // 5 đơn hàng gần nhất
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          items: { include: { product: { select: { name: true, image: true } } } },
        },
      }),
      // Sản phẩm sắp hết hàng (stock <= 10)
      prisma.product.findMany({
        where: { stock: { lte: 10 } },
        take: 5,
        orderBy: { stock: "asc" },
        select: {
          id: true,
          name: true,
          stock: true,
          image: true,
          category: { select: { name: true } },
        },
      }),
      // Tổng doanh thu (không tính đơn HỦY)
      prisma.order.aggregate({
        where: { status: { not: "CANCELLED" } },
        _sum: { totalAmount: true },
      }),
      // Đơn hàng theo từng trạng thái
      prisma.order.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      // Tất cả đơn trong năm để build biểu đồ tháng
      prisma.order.findMany({
        where: {
          createdAt: { gte: startOfYear },
          status: { not: "CANCELLED" },
        },
        select: {
          totalAmount: true,
          createdAt: true,
        },
      }),
      // Top 5 sản phẩm bán chạy
      prisma.product.findMany({
        take: 5,
        orderBy: { sold: "desc" },
        select: {
          id: true,
          name: true,
          sold: true,
          image: true,
          price: true,
          category: { select: { name: true } },
        },
      }),
    ]);

    // Build biểu đồ doanh thu theo tháng (12 tháng)
    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      revenue: 0,
      orders: 0,
    }));

    for (const order of allOrdersThisYear) {
      const month = new Date(order.createdAt).getMonth(); // 0-indexed
      monthlyRevenue[month].revenue += order.totalAmount;
      monthlyRevenue[month].orders += 1;
    }

    // Map ordersByStatus to object
    const statusCount = {};
    for (const s of ordersByStatus) {
      statusCount[s.status] = s._count.id;
    }

    const totalRevenue = revenueResult._sum.totalAmount || 0;

    return NextResponse.json({
      totalProducts,
      totalUsers,
      totalOrders,
      totalRevenue,
      recentOrders,
      lowStockProducts,
      ordersByStatus: statusCount,
      monthlyRevenue,
      topSellingProducts,
    });
  } catch (error) {
    console.error("GET_ADMIN_DASHBOARD_ERROR:", error);
    return NextResponse.json({ message: "Lỗi lấy dữ liệu dashboard." }, { status: 500 });
  }
}
