"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface AuthGuardProps {
  children: React.ReactNode;
}

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/login"];

export function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for session to load
    if (status !== "loading") {
      setIsReady(true);
    }
  }, [status]);

  useEffect(() => {
    if (!isReady) return;

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
    const isAuthenticated = !!session;

    if (!isAuthenticated && !isPublicRoute) {
      // Redirect to login if not authenticated
      router.push("/login");
    } else if (isAuthenticated && pathname === "/login") {
      // Redirect to dashboard if authenticated and trying to access login
      router.push("/dashboard");
    }
  }, [isReady, session, pathname, router]);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-slate-300">Loading...</div>
      </div>
    );
  }

  // If not authenticated and not on a public route, don't render anything (user will be redirected)
  if (!session && !PUBLIC_ROUTES.includes(pathname)) {
    return null;
  }

  return <>{children}</>;
}
