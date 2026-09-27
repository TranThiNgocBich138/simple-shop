"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN").format(price) + "₫";
}

export default function CheckoutPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");

  useEffect(() => {
    async function initCheckout() {
      try {
        setLoading(true);
        // Check user session
        const userRes = await fetch("/api/auth/me", { cache: "no-store" });
        const userData = await userRes.json();

        if (!userData.user) {
          router.replace("/login?redirect=/checkout");
          return;
        }

        setUser(userData.user);
        setCustomerName(userData.user.name || "");
        setCustomerEmail(userData.user.email || "");

        // Fetch cart items
        const cartRes = await fetch("/api/cart", { cache: "no-store" });
        if (cartRes.ok) {
          const cartData = await cartRes.json();
          setItems(cartData.items || []);
          if ((cartData.items || []).length === 0) {
            router.replace("/cart");
          }
        }
      } catch (err) {
        console.error("INIT_CHECKOUT_ERROR:", err);
      } finally {
        setLoading(false);
      }
    }

    initCheckout();
  }, [router]);

  async function handleOrder(e) {
    e.preventDefault();
    setError("");

    if (!customerName.trim() || !customerPhone.trim() || !address.trim()) {
      setError("Vui lòng nhập đầy đủ thông tin giao hàng.");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          address,
          paymentMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Đặt hàng thất bại.");
        return;
      }

      router.replace(`/checkout/success?orderId=${data.orderId}`);
    } catch (err) {
      console.error("SUBMIT_ORDER_ERROR:", err);
      setError("Không thể kết nối đến máy chủ.");
    } finally {
      setSubmitting(false);
    }
  }

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingFee = subtotal > 500000 || subtotal === 0 ? 0 : 30000;
  const total = subtotal + shippingFee;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fc] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
          <p className="mt-3 text-slate-500 font-semibold">Đang chuẩn bị trang thanh toán...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
      {/* HEADER */}
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

          <Link href="/cart" className="text-sm font-bold text-slate-600 hover:text-violet-600">
            ← Quay lại giỏ hàng
          </Link>
        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl mb-8">
          Thanh toán đơn hàng
        </h1>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleOrder} className="grid gap-8 lg:grid-cols-3">
          {/* SHIPPING FORM */}
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="text-xl font-black mb-6">1. Thông tin giao hàng</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Họ và tên người nhận</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    placeholder="Nguyễn Văn A"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-bold mb-2">Số điện thoại</label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      required
                      placeholder="0912345678"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2">Email (nhận thông báo)</label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">Địa chỉ giao hàng chi tiết</label>
                  <textarea
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    placeholder="Số nhà, Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  />
                </div>
              </div>
            </div>

            {/* PAYMENT METHOD */}
            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="text-xl font-black mb-6">2. Phương thức thanh toán</h2>

              <div className="space-y-3">
                <label className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4 cursor-pointer hover:border-violet-300 transition">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={paymentMethod === "COD"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-5 w-5 accent-violet-600"
                  />
                  <div>
                    <div className="font-bold">Thanh toán khi nhận hàng (COD)</div>
                    <div className="text-xs text-slate-500">Trả tiền mặt cho shipper khi nhận được hàng</div>
                  </div>
                </label>

                <label className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4 cursor-pointer hover:border-violet-300 transition">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="BANKING"
                    checked={paymentMethod === "BANKING"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-5 w-5 accent-violet-600"
                  />
                  <div>
                    <div className="font-bold">Chuyển khoản ngân hàng</div>
                    <div className="text-xs text-slate-500">Chuyển khoản trực tiếp qua mã QR / Internet Banking</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* ORDER SUMMARY */}
          <div className="h-fit rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <h2 className="text-xl font-black mb-4">Đơn hàng ({items.length})</h2>

            <div className="max-h-64 overflow-y-auto space-y-3 pr-1 divide-y divide-slate-100">
              {items.map((item) => (
                <div key={item.id} className="pt-3 flex items-center gap-3 text-sm">
                  <div className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden bg-slate-100">
                    <Image src={item.product.image} alt={item.product.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{item.product.name}</p>
                    <p className="text-xs text-slate-400">SL: {item.quantity}</p>
                  </div>
                  <p className="font-bold text-violet-600 shrink-0">
                    {formatPrice(item.product.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-slate-200 pt-4 space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Tạm tính</span>
                <span className="font-bold text-slate-900">{formatPrice(subtotal)}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Phí vận chuyển</span>
                <span className="font-bold text-slate-900">
                  {shippingFee === 0 ? "Miễn phí" : formatPrice(shippingFee)}
                </span>
              </div>

              <div className="border-t border-slate-200 pt-3 flex justify-between">
                <span className="font-black text-base">Tổng thanh toán</span>
                <span className="font-black text-2xl text-violet-600">{formatPrice(total)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full rounded-2xl bg-slate-950 py-4 text-sm font-black text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-violet-600 disabled:opacity-60"
            >
              {submitting ? "Đang xử lý đơn hàng..." : "Xác nhận đặt hàng →"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
