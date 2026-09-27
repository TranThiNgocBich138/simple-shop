"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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
      return <span className="rounded-full bg-amber-50 px-4 py-1.5 text-xs font-bold text-amber-600 border border-amber-200">Chờ xác nhận</span>;
    case "CONFIRMED":
      return <span className="rounded-full bg-blue-50 px-4 py-1.5 text-xs font-bold text-blue-600 border border-blue-200">Đã xác nhận</span>;
    case "PROCESSING":
      return <span className="rounded-full bg-indigo-50 px-4 py-1.5 text-xs font-bold text-indigo-600 border border-indigo-200">Đang đóng gói</span>;
    case "SHIPPED":
      return <span className="rounded-full bg-purple-50 px-4 py-1.5 text-xs font-bold text-purple-600 border border-purple-200">Đang giao hàng</span>;
    case "DELIVERED":
      return <span className="rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-600 border border-emerald-200">Đã giao thành công</span>;
    case "CANCELLED":
      return <span className="rounded-full bg-rose-50 px-4 py-1.5 text-xs font-bold text-rose-600 border border-rose-200">Đã hủy</span>;
    default:
      return <span className="rounded-full bg-slate-100 px-4 py-1.5 text-xs font-bold text-slate-600">{status}</span>;
  }
}

export default function OrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrder() {
      if (!params.id) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/orders/${params.id}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.message || "Không thể tải đơn hàng.");
          return;
        }

        setOrder(data.order);
      } catch (err) {
        console.error(err);
        setError("Lỗi tải thông tin đơn hàng.");
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [params.id]);

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
              <div className="-mt-1 text-[9px] font-bold tracking-[0.25em] text-violet-600">
                SHOP
              </div>
            </div>
          </Link>

          <Link href="/orders" className="text-sm font-bold text-slate-600 hover:text-violet-600">
            ← Trở lại danh sách đơn hàng
          </Link>
        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-4xl px-5 py-10 lg:px-8">
        {loading ? (
          <div className="mt-12 text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
            <p className="mt-3 text-slate-500 font-semibold">Đang tải thông tin đơn hàng...</p>
          </div>
        ) : error ? (
          <div className="mt-10 rounded-3xl bg-white p-12 text-center shadow-sm border border-red-200">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-red-600">{error}</h2>
            <p className="mt-2 text-slate-500">Bạn không thể xem đơn hàng này.</p>
            <Link
              href="/orders"
              className="mt-6 inline-block rounded-2xl bg-slate-950 px-8 py-4 text-sm font-black text-white shadow-xl hover:bg-violet-600 transition"
            >
              Về danh sách đơn hàng của bạn →
            </Link>
          </div>
        ) : order ? (
          <div className="space-y-8">
            {/* TITLE & STATUS BAR */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div>
                <span className="text-xs font-bold text-slate-400">CHI TIẾT ĐƠN HÀNG</span>
                <h1 className="text-2xl font-black text-violet-600 mt-1">{order.orderNumber}</h1>
                <p className="text-xs text-slate-500 mt-1">Ngày đặt: {formatDate(order.createdAt)}</p>
              </div>

              <div>{getStatusBadge(order.status)}</div>
            </div>

            {/* CUSTOMER & SHIPPING INFO */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Thông tin người nhận
                </h3>
                <p className="font-bold text-slate-900 text-lg">{order.customerName}</p>
                <p className="text-sm text-slate-600 mt-1">📞 {order.customerPhone}</p>
                <p className="text-sm text-slate-600 mt-1">✉ {order.customerEmail}</p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Địa chỉ & Thanh toán
                </h3>
                <p className="text-sm font-semibold text-slate-800 leading-relaxed">{order.address}</p>
                <p className="text-sm text-slate-600 mt-3">
                  Phương thức: <span className="font-bold text-slate-900">{order.paymentMethod === "COD" ? "Thanh toán khi nhận hàng (COD)" : "Chuyển khoản"}</span>
                </p>
              </div>
            </div>

            {/* PRODUCTS LIST */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                Sản phẩm trong đơn hàng
              </h3>

              <div className="divide-y divide-slate-100">
                {order.items.map((item) => (
                  <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                      <Image src={item.product.image} alt={item.product.name} fill className="object-cover" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-slate-900">{item.product.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatPrice(item.price)} x {item.quantity}
                      </p>
                    </div>

                    <p className="font-black text-violet-600">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t border-slate-200 pt-4 space-y-2 text-right">
                <div className="flex justify-between text-slate-600 text-sm">
                  <span>Tổng tiền hàng</span>
                  <span className="font-bold text-slate-900">
                    {formatPrice(order.items.reduce((s, i) => s + i.price * i.quantity, 0))}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 text-sm">
                  <span>Phí giao hàng</span>
                  <span className="font-bold text-slate-900">
                    {order.totalAmount > 500000 ? "Miễn phí" : "30.000₫"}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-3 text-lg">
                  <span className="font-black">Tổng thanh toán</span>
                  <span className="font-black text-2xl text-violet-600">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
