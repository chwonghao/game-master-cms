"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Mail } from "lucide-react";
import type { UserRecord, UserRole } from "@/types/game";

const roleOptions: UserRole[] = ["OWNER", "ADMIN", "EDITOR", "ANALYST"];

interface NewUserForm {
  email: string;
  role: UserRole;
}

const initialForm: NewUserForm = {
  email: "",
  role: "EDITOR",
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState<NewUserForm>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      setIsLoading(true);
      setNotice("");

      try {
        const response = await fetch("/api/users", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Unable to fetch users.");
        }

        const data = (await response.json()) as UserRecord[];
        setUsers(data);
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Failed to load users.");
      } finally {
        setIsLoading(false);
      }
    }

    void fetchUsers();
  }, []);

  async function handleInviteUser(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setNotice("");

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Unable to invite user.");
      }

      const newUser = (await response.json()) as UserRecord;
      setUsers((current) => [newUser, ...current]);
      setForm(initialForm);
      setIsCreateOpen(false);
      setNotice("User invited successfully.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Invite failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteUser(userId: number) {
    if (!confirm("Are you sure you want to remove this user?")) {
      return;
    }

    setNotice("");

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Unable to delete user.");
      }

      setUsers((current) => current.filter((u) => u.id !== userId));
      setNotice("User removed successfully.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Delete failed.");
    }
  }

  return (
    <section className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Management</p>
          <h2 className="text-3xl font-semibold tracking-tight">Users</h2>
          <p className="max-w-2xl text-sm text-slate-300">
            Manage team members and their access roles.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20"
        >
          <Plus className="h-4 w-4" />
          Invite User
        </button>
      </header>

      {notice && (
        <div className="rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-200">
          {notice}
        </div>
      )}

      {/* Users Table */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6 overflow-x-auto">
        {isLoading ? (
          <p className="text-sm text-slate-300">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-slate-300">No users found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 font-semibold text-slate-300">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-300">Role</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-300">Created Date</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-slate-700/50 hover:bg-slate-800/30 transition"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span className="font-medium text-slate-100">{user.email}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-300">
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Invite New User</h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleInviteUser} className="space-y-4">
              <label className="block space-y-1 text-sm">
                <span className="text-slate-300">Email Address</span>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100"
                />
              </label>

              <label className="block space-y-1 text-sm">
                <span className="text-slate-300">Role</span>
                <select
                  value={form.role}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      role: event.target.value as UserRole,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100"
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-60"
              >
                {isSubmitting ? "Inviting..." : "Send Invite"}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
