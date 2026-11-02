"use client";

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

const statusOptions = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "PENDING", label: "Chờ xác nhận" },
  { value: "CONFIRMED", label: "Đã xác nhận" },
  { value: "PROCESSING", label: "Đang đóng gói" },
  { value: "SHIPPED", label: "Đang giao hàng" },
  { value: "DELIVERED", label: "Đã giao thành công" },
  { value: "CANCELLED", label: "Đã hủy" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function loadOrders() {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/orders?status=${statusFilter}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error(err);
      setError("Lỗi tải danh sách đơn hàng.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(orderId, newStatus) {
    try {
      setUpdatingId(orderId);
      setError("");
      setSuccess("");

      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Cập nhật không thành công.");
        return;
      }

      setSuccess(`Cập nhật đơn hàng ${data.order.orderNumber} thành công!`);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      console.error(err);
      setError("Lỗi khi cập nhật trạng thái đơn hàng.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* TITLE & FILTER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Quản lý Đơn hàng</h1>
          <p className="mt-1 text-sm text-slate-400">Tất cả đơn hàng từ khách hàng ({orders.length})</p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-3 text-sm font-bold text-slate-200 outline-none focus:border-violet-500"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* NOTIFICATIONS */}
      {error && <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 text-sm font-semibold text-red-400">{error}</div>}
      {success && <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-sm font-semibold text-emerald-400">{success}</div>}

      {/* ORDERS LIST */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
          <p className="mt-3 font-semibold">Đang tải danh sách đơn hàng...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-12 text-center text-slate-400">
          Không tìm thấy đơn hàng nào.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl space-y-4"
            >
              {/* HEADER */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-bold text-slate-400">MÃ ĐƠN HÀNG</span>
                  <h3 className="font-black text-lg text-violet-400">{order.orderNumber}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Ngày đặt: {formatDate(order.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400">Trạng thái:</span>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    disabled={updatingId === order.id}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-xs font-bold text-white outline-none focus:border-violet-500"
                  >
                    <option value="PENDING">Chờ xác nhận</option>
                    <option value="CONFIRMED">Đã xác nhận</option>
                    <option value="PROCESSING">Đang đóng gói</option>
                    <option value="SHIPPED">Đang giao hàng</option>
                    <option value="DELIVERED">Đã giao thành công</option>
                    <option value="CANCELLED">Đã hủy</option>
                  </select>
                </div>
              </div>

              {/* CUSTOMER DETAILS */}
              <div className="grid gap-4 sm:grid-cols-2 text-xs text-slate-300 bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                <div>
                  <p className="text-slate-500 font-bold uppercase">Khách hàng</p>
                  <p className="font-bold text-white text-sm mt-1">{order.customerName}</p>
                  <p className="mt-0.5">SĐT: {order.customerPhone}</p>
                  <p className="mt-0.5">Email: {order.customerEmail}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-bold uppercase">Địa chỉ giao hàng</p>
                  <p className="mt-1 leading-relaxed text-slate-200 font-semibold">{order.address}</p>
                  <p className="mt-1 text-slate-400">Thanh toán: <span className="text-white font-bold">{order.paymentMethod}</span></p>
                </div>
              </div>

              {/* PRODUCTS SNAPSHOT */}
              <div className="divide-y divide-slate-800">
                {order.items.map((item) => (
                  <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-950 border border-slate-800">
                        <Image src={item.product.image} alt={item.product.name} fill className="object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{item.product.name}</p>
                        <p className="text-slate-400">Số lượng: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-bold text-violet-400 text-sm">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              {/* FOOTER TOTAL */}
              <div className="border-t border-slate-800 pt-3 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400">TỔNG THANH TOÁN</span>
                <span className="font-black text-xl text-violet-400">{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
