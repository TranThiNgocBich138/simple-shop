"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN").format(price) + "₫";
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await fetch("/api/admin/dashboard", { cache: "no-store" });
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
        <p className="mt-3 font-semibold">Đang tải dữ liệu dashboard...</p>
      </div>
    );
  }

  if (!data) return <div className="text-red-400">Không thể tải dữ liệu dashboard.</div>;

  const stats = [
    { label: "Tổng sản phẩm", value: data.totalProducts, icon: "🛍️", color: "from-blue-500/20 to-indigo-500/20 border-blue-500/30" },
    { label: "Tổng số người dùng", value: data.totalUsers, icon: "👥", color: "from-violet-500/20 to-purple-500/20 border-violet-500/30" },
    { label: "Tổng đơn hàng", value: data.totalOrders, icon: "📦", color: "from-amber-500/20 to-orange-500/20 border-amber-500/30" },
    { label: "Tổng doanh thu", value: formatPrice(data.totalRevenue), icon: "💰", color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">Dashboard Quản trị</h1>
        <p className="mt-1 text-sm text-slate-400">Tổng quan tình hình kinh doanh của Simple Shop</p>
      </div>

      {/* STATS GRID */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`rounded-3xl border bg-gradient-to-br p-6 shadow-xl backdrop-blur ${s.color}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-3xl">{s.icon}</span>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="mt-1 text-xs font-semibold text-slate-400">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* RECENT ORDERS */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-white">Đơn hàng mới nhất</h2>
            <Link href="/admin/orders" className="text-xs font-bold text-violet-400 hover:underline">
              Xem tất cả →
            </Link>
          </div>

          {data.recentOrders.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">Chưa có đơn hàng nào.</p>
          ) : (
            <div className="space-y-3">
              {data.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-2xl bg-slate-950 p-4 border border-slate-800/80"
                >
                  <div>
                    <p className="font-bold text-sm text-white">{order.orderNumber}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {order.customerName} • {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-violet-400">{formatPrice(order.totalAmount)}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LOW STOCK ALERT */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-white">⚠️ Sản phẩm sắp hết hàng</h2>
            <Link href="/admin/products" className="text-xs font-bold text-violet-400 hover:underline">
              Quản lý kho →
            </Link>
          </div>

          {data.lowStockProducts.length === 0 ? (
            <p className="text-sm text-emerald-400 py-6 text-center">
              ✓ Kho hàng ổn định. Tất cả sản phẩm đều đủ số lượng.
            </p>
          ) : (
            <div className="space-y-3">
              {data.lowStockProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="flex items-center justify-between rounded-2xl bg-slate-950 p-4 border border-slate-800/80"
                >
                  <div>
                    <p className="font-bold text-sm text-white">{prod.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatPrice(prod.price)}</p>
                  </div>
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-400">
                    Còn {prod.stock} sp
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
