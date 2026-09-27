"use client";

import { useEffect, useState } from "react";

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error(err);
      setError("Lỗi tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId, newRole) {
    try {
      setUpdatingId(userId);
      setError("");
      setSuccess("");

      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Không thể cập nhật quyền.");
        return;
      }

      setSuccess(`Đã thay đổi quyền của tài khoản ${data.user.name} thành ${newRole}!`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      console.error(err);
      setError("Lỗi cập nhật vai trò người dùng.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">Quản lý Người dùng</h1>
        <p className="mt-1 text-sm text-slate-400">Danh sách tài khoản đã đăng ký trên hệ thống ({users.length})</p>
      </div>

      {/* NOTIFICATIONS */}
      {error && <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 text-sm font-semibold text-red-400">{error}</div>}
      {success && <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-sm font-semibold text-emerald-400">{success}</div>}

      {/* USERS TABLE */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
          <p className="mt-3 font-semibold">Đang tải danh sách người dùng...</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900 shadow-xl">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-5">Người dùng</th>
                <th className="p-5">Email</th>
                <th className="p-5">Ngày tạo</th>
                <th className="p-5">Đơn hàng</th>
                <th className="p-5">Vai trò (Role)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-500/20 font-black text-violet-300">
                      {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                      <p className="font-bold text-white">{u.name}</p>
                      <p className="text-xs text-slate-500">ID: {u.id}</p>
                    </div>
                  </td>
                  <td className="p-5 text-slate-300 font-medium">{u.email}</td>
                  <td className="p-5 text-slate-400">{formatDate(u.createdAt)}</td>
                  <td className="p-5 font-bold text-violet-400">{u._count?.orders || 0} đơn</td>
                  <td className="p-5">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      disabled={updatingId === u.id}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-bold outline-none transition ${
                        u.role === "ADMIN"
                          ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                          : "bg-slate-950 border-slate-800 text-slate-300"
                      }`}
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
