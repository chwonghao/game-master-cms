import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Account</p>
        <h2 className="text-3xl font-semibold tracking-tight">Profile Settings</h2>
        <p className="text-sm text-slate-300">Manage your CMS account details and security.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6">
          <h3 className="text-lg font-semibold text-slate-100">User Profile</h3>
          <dl className="mt-4 space-y-4">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Email</dt>
              <dd className="mt-1 text-sm text-slate-100">{session.user.email ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Role</dt>
              <dd className="mt-1 inline-flex rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                {session.user.role ?? "USER"}
              </dd>
            </div>
          </dl>
        </article>

        <article className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6">
          <h3 className="text-lg font-semibold text-slate-100">Change Password</h3>
          <p className="mt-2 text-sm text-slate-300">
            This section is ready for backend wiring in the next phase.
          </p>

          <div className="mt-5 space-y-3">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Current Password</label>
              <input
                type="password"
                disabled
                placeholder="Current password"
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-300 placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">New Password</label>
              <input
                type="password"
                disabled
                placeholder="New password"
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-300 placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Confirm Password</label>
              <input
                type="password"
                disabled
                placeholder="Confirm new password"
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-300 placeholder:text-slate-500"
              />
            </div>
            <button
              type="button"
              disabled
              className="mt-2 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 opacity-60"
            >
              Update Password (Coming Soon)
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}
