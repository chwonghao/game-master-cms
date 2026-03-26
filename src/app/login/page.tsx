"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { LogIn } from "lucide-react";

const demoAccounts = [
  {
    email: "admin@gamemaster.dev",
    password: "password123",
    role: "ADMIN",
  },
  {
    email: "editor@gamemaster.dev",
    password: "password123",
    role: "EDITOR",
  },
  {
    email: "analyst@gamemaster.dev",
    password: "password123",
    role: "ANALYST",
  },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result?.ok) {
        setError(result?.error || "Authentication failed");
        setIsLoading(false);
        return;
      }

      // Redirect to dashboard after successful login
      router.push("/dashboard");
    } catch (err) {
      setError("An error occurred during sign in");
      setIsLoading(false);
    }
  }

  function handleDemoLogin(demoAccount: (typeof demoAccounts)[0]) {
    setEmail(demoAccount.email);
    setPassword(demoAccount.password);
    setError("");
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-cyan-500/20 border border-cyan-400/40 mb-4">
            <LogIn className="h-7 w-7 text-cyan-300" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">
            Game Master Hub
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Multi-game CMS and level operations platform
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-sm p-8 shadow-2xl">
          <form onSubmit={handleSignIn} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="admin@gamemaster.dev"
                className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-950/70 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-transparent transition"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-950/70 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-transparent transition"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3">
                <p className="text-sm text-rose-300">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full px-4 py-3 rounded-lg border border-cyan-400/40 bg-cyan-500/15 text-cyan-200 font-medium hover:bg-cyan-500/25 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-8 pt-8 border-t border-slate-700/50">
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-4">
              Demo Accounts (password: password123)
            </p>
            <div className="space-y-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => handleDemoLogin(account)}
                  className="w-full text-left px-3 py-2 rounded-lg border border-slate-700/30 bg-slate-950/40 hover:bg-slate-800/50 text-sm text-slate-300 hover:text-slate-100 transition group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{account.email}</p>
                      <p className="text-xs text-slate-500 group-hover:text-slate-400">
                        {account.role}
                      </p>
                    </div>
                    <span className="text-xs text-cyan-400/60">→</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 rounded-lg bg-indigo-500/10 border border-indigo-400/30 p-4">
            <p className="text-xs text-indigo-300">
              💡 <strong>NextAuth.js:</strong> Production authentication with Prisma adapter and Credentials provider.
              Passwords are hashed with bcryptjs.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-6">
          This is a development environment with demo credentials.
        </p>
      </div>
    </div>
  );
}