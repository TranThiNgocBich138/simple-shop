"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN").format(price) + "₫";
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data.order);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
        <p className="mt-3 text-slate-500 font-semibold">Đang tải thông tin đơn hàng...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-16 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl text-emerald-600 mb-6 shadow-lg shadow-emerald-100">
        ✓
      </div>

      <h1 className="text-3xl font-black tracking-tight sm:text-4xl text-slate-900">
        Đặt hàng thành công!
      </h1>

      <p className="mt-3 text-slate-500">
        Cảm ơn bạn đã mua sắm tại Simple Shop. Chúng tôi đã nhận được đơn hàng của bạn.
      </p>

      {order && (
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-7 text-left shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <div className="text-xs text-slate-400 font-semibold">MÃ ĐƠN HÀNG</div>
              <div className="text-lg font-black text-violet-600">{order.orderNumber}</div>
            </div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-600 border border-amber-200">
              {order.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-400">Người nhận</p>
              <p className="font-bold">{order.customerName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Số điện thoại</p>
              <p className="font-bold">{order.customerPhone}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-slate-400">Địa chỉ giao hàng</p>
              <p className="font-bold">{order.address}</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-400 mb-2">Sản phẩm ({order.items.length})</p>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.product.name} x {item.quantity}</span>
                  <span className="font-bold">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-base">
            <span className="font-black">Tổng thanh toán</span>
            <span className="font-black text-xl text-violet-600">{formatPrice(order.totalAmount)}</span>
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-center gap-4">
        <Link
          href="/orders"
          className="rounded-2xl bg-slate-950 px-7 py-4 text-sm font-black text-white shadow-xl hover:bg-violet-600 transition"
        >
          Xem lịch sử đơn hàng →
        </Link>
        <Link
          href="/"
          className="rounded-2xl border border-slate-200 bg-white px-7 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <header className="border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
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
        </div>
      </header>

      <Suspense fallback={<div>Đang tải...</div>}>
        <SuccessContent />
      </Suspense>
    </main>
  );
}
