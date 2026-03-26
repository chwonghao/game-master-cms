"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  BarChart3,
  Gamepad2,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  Wrench,
} from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/games", label: "Games", icon: Gamepad2 },
  { href: "/tools", label: "Tools", icon: Wrench },
  { href: "/users", label: "Users", icon: Shield },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

const PUBLIC_ROUTES = ["/login"];

interface RootLayoutClientProps {
  children: React.ReactNode;
}

export function RootLayoutClient({ children }: RootLayoutClientProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  return (
    <AuthGuard>
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_1fr]">
        {/* Sidebar - Only show on authenticated routes */}
        {!isPublicRoute && (
          <aside className="border-b border-slate-800 bg-slate-900/80 p-6 backdrop-blur-sm lg:border-b-0 lg:border-r">
            <div className="mb-10">
              <h1 className="text-xl font-bold tracking-tight text-cyan-200">🎮 GameMaster CMS</h1>
              <p className="mt-2 text-sm text-slate-400">Multi-game operations and live balancing.</p>
            </div>

            <nav className="space-y-2 mb-10">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-100"
                        : "border-slate-800/70 bg-slate-800/30 text-slate-200 hover:border-cyan-400/40 hover:bg-slate-800/80"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Info & Logout */}
            {session?.user && (
              <div className="border-t border-slate-700 pt-6">
                <div className="mb-4 rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Logged in as</p>
                  <p className="mt-1 text-sm font-medium text-slate-200">{session.user.email}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {(session.user as any).role || "USER"}
                  </p>
                </div>
                <button
                  onClick={() => signOut({ redirect: true, callbackUrl: "/login" })}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 transition"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </aside>
        )}

        {/* Main Content */}
        <main
          className={`${
            isPublicRoute ? "" : "bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12)_0%,transparent_45%)]"
          } ${!isPublicRoute ? "p-6 lg:p-10" : ""}`}
        >
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
