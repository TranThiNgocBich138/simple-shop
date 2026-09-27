"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN").format(price) + "₫";
}

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCart() {
      try {
        setLoading(true);
        // Check user session
        const userRes = await fetch("/api/auth/me", { cache: "no-store" });
        const userData = await userRes.json();
        setUser(userData.user);

        if (!userData.user) {
          setItems([]);
          setLoading(false);
          return;
        }

        const res = await fetch("/api/cart", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setItems(data.items || []);
        }
      } catch (err) {
        console.error("LOAD_CART_ERROR:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCart();
  }, []);

  async function updateQuantity(productId, newQty) {
    try {
      setUpdatingId(productId);
      setError("");

      const res = await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: newQty }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Không thể cập nhật số lượng.");
        return;
      }

      if (newQty <= 0) {
        setItems((prev) => prev.filter((item) => item.productId !== productId));
      } else {
        setItems((prev) =>
          prev.map((item) =>
            item.productId === productId
              ? { ...item, quantity: newQty, subtotal: item.product.price * newQty }
              : item
          )
        );
      }
    } catch (err) {
      console.error(err);
      setError("Lỗi cập nhật giỏ hàng.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function removeItem(productId) {
    try {
      setUpdatingId(productId);
      setError("");

      const res = await fetch(`/api/cart?productId=${productId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.productId !== productId));
      }
    } catch (err) {
      console.error(err);
      setError("Lỗi xóa sản phẩm khỏi giỏ hàng.");
    } finally {
      setUpdatingId(null);
    }
  }

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingFee = subtotal > 500000 || subtotal === 0 ? 0 : 30000;
  const total = subtotal + shippingFee;

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-xl font-black text-white shadow-lg shadow-indigo-200">
              S
            </div>
            <div>
              <div className="text-lg font-black tracking-tight">SIMPLE</div>
              <div className="-mt-1 text-[10px] font-bold tracking-[0.25em] text-violet-600">
                SHOP
              </div>
            </div>
          </Link>

          <Link
            href="/"
            className="text-sm font-bold text-slate-600 hover:text-violet-600"
          >
            ← Tiếp tục mua sắm
          </Link>
        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          Giỏ hàng của bạn
        </h1>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-12 text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
            <p className="mt-3 text-slate-500 font-semibold">Đang tải giỏ hàng...</p>
          </div>
        ) : !user ? (
          <div className="mt-10 rounded-3xl bg-white p-12 text-center shadow-sm border border-slate-200">
            <div className="text-5xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold">Bạn chưa đăng nhập</h2>
            <p className="mt-2 text-slate-500">Vui lòng đăng nhập để xem và quản lý giỏ hàng của bạn.</p>
            <Link
              href="/login?redirect=/cart"
              className="mt-6 inline-block rounded-2xl bg-slate-950 px-8 py-4 text-sm font-black text-white shadow-xl hover:bg-violet-600 transition"
            >
              Đăng nhập ngay →
            </Link>
          </div>
        ) : items.length === 0 ? (
          <div className="mt-10 rounded-3xl bg-white p-12 text-center shadow-sm border border-slate-200">
            <div className="text-5xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold">Giỏ hàng đang trống</h2>
            <p className="mt-2 text-slate-500">Hãy thêm những sản phẩm yêu thích vào giỏ nhé.</p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-2xl bg-slate-950 px-8 py-4 text-sm font-black text-white shadow-xl hover:bg-violet-600 transition"
            >
              Khám phá sản phẩm ngay →
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            {/* ITEMS LIST */}
            <div className="space-y-4 lg:col-span-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row items-center gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-violet-200"
                >
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-black text-lg">{item.product.name}</h3>
                    <p className="mt-1 text-sm font-bold text-violet-600">
                      {formatPrice(item.product.price)}
                    </p>
                    {item.product.stock <= 5 && (
                      <p className="mt-1 text-xs font-semibold text-amber-600">
                        Chỉ còn {item.product.stock} sản phẩm
                      </p>
                    )}
                  </div>

                  {/* QUANTITY CONTROLS */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      disabled={updatingId === item.productId || item.quantity <= 1}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 font-bold hover:bg-slate-200 disabled:opacity-40"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-black">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      disabled={updatingId === item.productId || item.quantity >= item.product.stock}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 font-bold hover:bg-slate-200 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>

                  {/* SUBTOTAL & DELETE */}
                  <div className="flex items-center gap-4 text-right">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Tổng</div>
                      <div className="font-black text-violet-600">
                        {formatPrice(item.subtotal)}
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId)}
                      disabled={updatingId === item.productId}
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ORDER SUMMARY */}
            <div className="h-fit rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="text-xl font-black">Tóm tắt đơn hàng</h2>

              <div className="mt-6 space-y-4 text-sm">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Tạm tính</span>
                  <span className="font-bold text-slate-900">{formatPrice(subtotal)}</span>
                </div>

                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Phí vận chuyển</span>
                  <span>
                    {shippingFee === 0 ? (
                      <span className="font-bold text-emerald-600">Miễn phí</span>
                    ) : (
                      formatPrice(shippingFee)
                    )}
                  </span>
                </div>

                {shippingFee > 0 && (
                  <p className="text-xs text-violet-600 font-semibold">
                    💡 Mua thêm {formatPrice(500000 - subtotal)} để nhận Miễn phí vận chuyển!
                  </p>
                )}

                <div className="border-t border-slate-200 pt-4 flex justify-between text-base">
                  <span className="font-black">Tổng tiền</span>
                  <span className="font-black text-2xl text-violet-600">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => router.push("/checkout")}
                className="mt-8 w-full rounded-2xl bg-slate-950 py-4 text-sm font-black text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-violet-600"
              >
                Tiến hành thanh toán →
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
