"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { BoosterCurrencyType, BoosterRecord } from "@/types/game";

type BoosterForm = {
  code: string;
  name: string;
  description: string;
  cost: number;
  currencyType: BoosterCurrencyType;
  imageUrl: string;
  isActive: boolean;
};

const defaultForm: BoosterForm = {
  code: "",
  name: "",
  description: "",
  cost: 0,
  currencyType: "COIN",
  imageUrl: "",
  isActive: true,
};

const currencyOptions: BoosterCurrencyType[] = ["COIN", "GEM"];

function toFormData(item?: BoosterRecord): BoosterForm {
  if (!item) {
    return defaultForm;
  }

  return {
    code: item.code,
    name: item.name,
    description: item.description ?? "",
    cost: item.cost,
    currencyType: item.currencyType,
    imageUrl: item.imageUrl ?? "",
    isActive: item.isActive,
  };
}

export default function BoosterManagementPage() {
  const [boosters, setBoosters] = useState<BoosterRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBoosterId, setEditingBoosterId] = useState<number | null>(null);
  const [form, setForm] = useState<BoosterForm>(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editingBooster = useMemo(
    () => boosters.find((booster) => booster.id === editingBoosterId) ?? null,
    [boosters, editingBoosterId],
  );

  useEffect(() => {
    async function fetchBoosters() {
      setIsLoading(true);
      setNotice("");

      try {
        const response = await fetch("/api/boosters", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Unable to fetch boosters.");
        }

        const data = (await response.json()) as BoosterRecord[];
        setBoosters(data);
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Failed to load boosters.");
      } finally {
        setIsLoading(false);
      }
    }

    void fetchBoosters();
  }, []);

  function openCreateModal() {
    setEditingBoosterId(null);
    setForm(defaultForm);
    setIsModalOpen(true);
  }

  function openEditModal(booster: BoosterRecord) {
    setEditingBoosterId(booster.id);
    setForm(toFormData(booster));
    setIsModalOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setNotice("");

    try {
      const payload = {
        ...form,
        cost: Number(form.cost),
      };

      const target = editingBoosterId ? `/api/boosters/${editingBoosterId}` : "/api/boosters";
      const method = editingBoosterId ? "PUT" : "POST";

      const response = await fetch(target, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Save failed.");
      }

      const saved = (await response.json()) as BoosterRecord;

      setBoosters((current) => {
        if (editingBoosterId) {
          return current.map((item) => (item.id === saved.id ? saved : item));
        }

        return [saved, ...current];
      });

      setIsModalOpen(false);
      setEditingBoosterId(null);
      setForm(defaultForm);
      setNotice(editingBoosterId ? "Booster updated." : "Booster created.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(boosterId: number) {
    const accepted = window.confirm("Delete this booster configuration?");
    if (!accepted) {
      return;
    }

    setNotice("");

    try {
      const response = await fetch(`/api/boosters/${boosterId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Delete failed.");
      }

      setBoosters((current) => current.filter((item) => item.id !== boosterId));
      setNotice("Booster deleted.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Delete failed.");
    }
  }

  return (
    <section className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Live Config</p>
          <h2 className="text-3xl font-semibold tracking-tight">Booster Management</h2>
          <p className="max-w-2xl text-sm text-slate-300">
            Configure helper items such as Undo, Add Tube and Shuffle with price and activation flags.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20"
        >
          <Plus className="h-4 w-4" />
          Add Booster
        </button>
      </header>

      {notice ? (
        <p className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-200">
          {notice}
        </p>
      ) : null}

      <section className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900/60">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-700 bg-slate-950/60 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Cost</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated By</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-300">
                  Loading boosters...
                </td>
              </tr>
            ) : null}

            {!isLoading && boosters.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-300">
                  No boosters configured yet.
                </td>
              </tr>
            ) : null}

            {!isLoading
              ? boosters.map((booster) => (
                  <tr key={booster.id} className="border-b border-slate-800 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-cyan-200">{booster.code}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-100">{booster.name}</p>
                      <p className="text-xs text-slate-400">{booster.description || "No description"}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {booster.cost} {booster.currencyType}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${
                          booster.isActive
                            ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
                            : "border-slate-500/40 bg-slate-500/15 text-slate-300"
                        }`}
                      >
                        {booster.isActive ? "ACTIVE" : "DISABLED"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {booster.updater?.email ?? booster.creator?.email ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(booster)}
                          className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(booster.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </section>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingBooster ? `Edit ${editingBooster.code}` : "Create Booster"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="text-slate-300">Code</span>
                  <input
                    required
                    value={form.code}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))
                    }
                    placeholder="UNDO"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100"
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span className="text-slate-300">Name</span>
                  <input
                    required
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Undo Move"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100"
                  />
                </label>
              </div>

              <label className="space-y-1 text-sm">
                <span className="text-slate-300">Description</span>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="space-y-1 text-sm">
                  <span className="text-slate-300">Cost</span>
                  <input
                    required
                    type="number"
                    min={0}
                    value={form.cost}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        cost: Math.max(0, Number(event.target.value) || 0),
                      }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100"
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span className="text-slate-300">Currency</span>
                  <select
                    value={form.currencyType}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        currencyType: event.target.value as BoosterCurrencyType,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100"
                  >
                    {currencyOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-sm">
                  <span className="text-slate-300">Status</span>
                  <select
                    value={form.isActive ? "ACTIVE" : "DISABLED"}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        isActive: event.target.value === "ACTIVE",
                      }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="DISABLED">DISABLED</option>
                  </select>
                </label>
              </div>

              <label className="space-y-1 text-sm">
                <span className="text-slate-300">Image URL</span>
                <input
                  value={form.imageUrl}
                  onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))}
                  placeholder="https://cdn.example.com/booster/undo.png"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100"
                />
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-60"
              >
                {isSubmitting ? "Saving..." : editingBooster ? "Update Booster" : "Create Booster"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
