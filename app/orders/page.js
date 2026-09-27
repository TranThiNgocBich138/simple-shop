"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN").format(price) + "₫";
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusBadge(status) {
  switch (status) {
    case "PENDING":
      return <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-600 border border-amber-200">Chờ xác nhận</span>;
    case "CONFIRMED":
      return <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 border border-blue-200">Đã xác nhận</span>;
    case "PROCESSING":
      return <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600 border border-indigo-200">Đang đóng gói</span>;
    case "SHIPPED":
      return <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-600 border border-purple-200">Đang giao hàng</span>;
    case "DELIVERED":
      return <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600 border border-emerald-200">Đã giao thành công</span>;
    case "CANCELLED":
      return <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600 border border-rose-200">Đã hủy</span>;
    default:
      return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{status}</span>;
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        const userRes = await fetch("/api/auth/me", { cache: "no-store" });
        const userData = await userRes.json();
        setUser(userData.user);

        if (!userData.user) {
          setLoading(false);
          return;
        }

        const res = await fetch("/api/orders", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-xl font-black text-white shadow-lg">
              S
            </div>
            <div>
              <div className="text-lg font-black tracking-tight">SIMPLE</div>
              <div className="-mt-1 text-[10px] font-bold tracking-[0.25em] text-violet-600">
                SHOP
              </div>
            </div>
          </Link>

          <Link href="/" className="text-sm font-bold text-slate-600 hover:text-violet-600">
            ← Quay lại trang chủ
          </Link>
        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-5xl px-5 py-10 lg:px-8">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          Lịch sử đơn hàng
        </h1>

        {loading ? (
          <div className="mt-12 text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
            <p className="mt-3 text-slate-500 font-semibold">Đang tải danh sách đơn hàng...</p>
          </div>
        ) : !user ? (
          <div className="mt-10 rounded-3xl bg-white p-12 text-center shadow-sm border border-slate-200">
            <div className="text-5xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold">Bạn chưa đăng nhập</h2>
            <p className="mt-2 text-slate-500">Vui lòng đăng nhập để xem lịch sử đơn hàng của bạn.</p>
            <Link
              href="/login?redirect=/orders"
              className="mt-6 inline-block rounded-2xl bg-slate-950 px-8 py-4 text-sm font-black text-white shadow-xl hover:bg-violet-600 transition"
            >
              Đăng nhập ngay →
            </Link>
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-10 rounded-3xl bg-white p-12 text-center shadow-sm border border-slate-200">
            <div className="text-5xl mb-4">📦</div>
            <h2 className="text-2xl font-bold">Chưa có đơn hàng nào</h2>
            <p className="mt-2 text-slate-500">Bạn chưa thực hiện đơn hàng nào tại Simple Shop.</p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-2xl bg-slate-950 px-8 py-4 text-sm font-black text-white shadow-xl hover:bg-violet-600 transition"
            >
              Khám phá sản phẩm ngay →
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:border-violet-200"
              >
                {/* ORDER HEADER */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50 p-6">
                  <div>
                    <span className="text-xs font-semibold text-slate-400">MÃ ĐƠN HÀNG</span>
                    <h3 className="font-black text-violet-600">{order.orderNumber}</h3>
                    <p className="text-xs text-slate-400 mt-1">{formatDate(order.createdAt)}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    {getStatusBadge(order.status)}
                    <Link
                      href={`/orders/${order.id}`}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-violet-600 transition"
                    >
                      Chi tiết →
                    </Link>
                  </div>
                </div>

                {/* ITEMS SNAPSHOT */}
                <div className="p-6 divide-y divide-slate-100">
                  {order.items.map((item) => (
                    <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center gap-4">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                        <Image src={item.product.image} alt={item.product.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate">{item.product.name}</p>
                        <p className="text-xs text-slate-500">Số lượng: {item.quantity}</p>
                      </div>
                      <p className="font-black text-violet-600 text-sm">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* FOOTER */}
                <div className="border-t border-slate-100 bg-slate-50/30 px-6 py-4 flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-semibold">Tổng số tiền</span>
                  <span className="font-black text-xl text-violet-600">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
