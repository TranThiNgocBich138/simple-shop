"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json();

        if (!res.ok || !data.user || data.user.role !== "ADMIN") {
          router.replace("/login?redirect=/admin");
          return;
        }

        setUser(data.user);
      } catch (err) {
        console.error(err);
        router.replace("/");
      } finally {
        setLoading(false);
      }
    }

    checkAdmin();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
          <p className="mt-3 text-slate-400 font-medium">Đang xác thực quyền Admin...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const navItems = [
    { label: "Tổng quan", href: "/admin", icon: "📊" },
    { label: "Sản phẩm", href: "/admin/products", icon: "🛍️" },
    { label: "Đơn hàng", href: "/admin/orders", icon: "📦" },
    { label: "Người dùng", href: "/admin/users", icon: "👥" },
    { label: "Danh mục", href: "/admin/categories", icon: "🏷️" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 shrink-0 p-6 flex flex-col justify-between">
        <div>
          {/* BRAND */}
          <Link href="/" className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 font-black text-white">
              S
            </div>
            <div>
              <div className="font-black text-white tracking-tight">SIMPLE SHOP</div>
              <div className="-mt-1 text-[10px] font-bold text-violet-400">ADMIN PANEL</div>
            </div>
          </Link>

          {/* NAV LINKS */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition ${
                    active
                      ? "bg-violet-600 text-white shadow-lg shadow-violet-900/50"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* BOTTOM USER INFO */}
        <div className="mt-8 border-t border-slate-800 pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/20 text-violet-300 font-black">
              {user.name ? user.name.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate text-white">{user.name}</p>
              <p className="text-xs text-violet-400 font-semibold">Quản trị viên</p>
            </div>
          </div>

          <Link
            href="/"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800 transition"
          >
            ← Về cửa hàng
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto max-w-7xl">
        {children}
      </main>
    </div>
  );
}
