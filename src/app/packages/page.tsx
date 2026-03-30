"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { BoosterRewardItem, ShopPackageRecord } from "@/types/game";

type PackageForm = {
  name: string;
  description: string;
  packageType: string;
  price: number;
  currency: string;
  coinReward: number;
  gemReward: number;
  boosterRewardsText: string;
  isActive: boolean;
};

const defaultForm: PackageForm = {
  name: "",
  description: "",
  packageType: "STARTER",
  price: 0,
  currency: "USD",
  coinReward: 0,
  gemReward: 0,
  boosterRewardsText: "[]",
  isActive: true,
};

function parseBoosterRewardsText(text: string): BoosterRewardItem[] {
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item): item is { boosterId?: unknown; quantity?: unknown } => typeof item === "object" && item !== null)
      .map((item) => ({
        boosterId: Math.floor(Number(item.boosterId)),
        quantity: Math.floor(Number(item.quantity)),
      }))
      .filter((item) => Number.isInteger(item.boosterId) && item.boosterId > 0 && Number.isInteger(item.quantity) && item.quantity > 0);
  } catch {
    return [];
  }
}

function toFormData(item?: ShopPackageRecord): PackageForm {
  if (!item) {
    return defaultForm;
  }

  return {
    name: item.name,
    description: item.description ?? "",
    packageType: item.packageType,
    price: item.price,
    currency: item.currency,
    coinReward: item.coinReward,
    gemReward: item.gemReward,
    boosterRewardsText: JSON.stringify(item.boosterRewards ?? [], null, 2),
    isActive: item.isActive,
  };
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<ShopPackageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<number | null>(null);
  const [form, setForm] = useState<PackageForm>(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editingPackage = useMemo(
    () => packages.find((item) => item.id === editingPackageId) ?? null,
    [packages, editingPackageId],
  );

  useEffect(() => {
    async function fetchPackages() {
      setIsLoading(true);
      setNotice("");

      try {
        const response = await fetch("/api/packages", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Unable to fetch packages.");
        }

        const data = (await response.json()) as ShopPackageRecord[];
        setPackages(data);
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Failed to load packages.");
      } finally {
        setIsLoading(false);
      }
    }

    void fetchPackages();
  }, []);

  function openCreateModal() {
    setEditingPackageId(null);
    setForm(defaultForm);
    setIsModalOpen(true);
  }

  function openEditModal(item: ShopPackageRecord) {
    setEditingPackageId(item.id);
    setForm(toFormData(item));
    setIsModalOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setNotice("");

    const boosterRewards = parseBoosterRewardsText(form.boosterRewardsText);

    try {
      const payload = {
        name: form.name,
        description: form.description,
        packageType: form.packageType,
        price: Number(form.price),
        currency: form.currency,
        coinReward: Number(form.coinReward),
        gemReward: Number(form.gemReward),
        boosterRewards,
        isActive: form.isActive,
      };

      const endpoint = editingPackageId ? `/api/packages/${editingPackageId}` : "/api/packages";
      const method = editingPackageId ? "PUT" : "POST";

      const response = await fetch(endpoint, {
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

      const saved = (await response.json()) as ShopPackageRecord;

      setPackages((current) => {
        if (editingPackageId) {
          return current.map((item) => (item.id === saved.id ? saved : item));
        }
        return [saved, ...current];
      });

      setNotice(editingPackageId ? "Package updated." : "Package created.");
      setIsModalOpen(false);
      setEditingPackageId(null);
      setForm(defaultForm);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(packageId: number) {
    const accepted = window.confirm("Delete this package?");
    if (!accepted) {
      return;
    }

    setNotice("");

    try {
      const response = await fetch(`/api/packages/${packageId}`, { method: "DELETE" });
      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Delete failed.");
      }

      setPackages((current) => current.filter((item) => item.id !== packageId));
      setNotice("Package deleted.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Delete failed.");
    }
  }

  return (
    <section className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Monetization</p>
          <h2 className="text-3xl font-semibold tracking-tight">Package Management</h2>
          <p className="max-w-2xl text-sm text-slate-300">
            Create and manage in-game shop packages with currency and booster rewards.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20"
        >
          <Plus className="h-4 w-4" />
          Add Package
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
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Rewards</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-300">
                  Loading packages...
                </td>
              </tr>
            ) : null}

            {!isLoading && packages.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-300">
                  No packages found.
                </td>
              </tr>
            ) : null}

            {!isLoading
              ? packages.map((item) => (
                  <tr key={item.id} className="border-b border-slate-800 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-100">{item.name}</p>
                      <p className="text-xs text-slate-400">{item.description || "No description"}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{item.packageType}</td>
                    <td className="px-4 py-3 text-slate-300">
                      {item.price} {item.currency}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      <p>Coins: {item.coinReward}</p>
                      <p>Gems: {item.gemReward}</p>
                      <p className="text-xs text-slate-400">Boosters: {item.boosterRewards?.length ?? 0}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${
                          item.isActive
                            ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
                            : "border-slate-500/40 bg-slate-500/15 text-slate-300"
                        }`}
                      >
                        {item.isActive ? "ACTIVE" : "DISABLED"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
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
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingPackage ? `Edit ${editingPackage.name}` : "Create Package"}
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
                  <span className="text-slate-300">Name</span>
                  <input
                    required
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100"
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span className="text-slate-300">Package Type</span>
                  <input
                    required
                    value={form.packageType}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, packageType: event.target.value.toUpperCase() }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100"
                    placeholder="STARTER"
                  />
                </label>
              </div>

              <label className="space-y-1 text-sm">
                <span className="text-slate-300">Description</span>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="text-slate-300">Price</span>
                  <input
                    required
                    min={0}
                    step="0.01"
                    type="number"
                    value={form.price}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, price: Number(event.target.value) }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100"
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span className="text-slate-300">Currency</span>
                  <input
                    required
                    value={form.currency}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, currency: event.target.value.toUpperCase() }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100"
                    placeholder="USD"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="text-slate-300">Coin Reward</span>
                  <input
                    min={0}
                    type="number"
                    value={form.coinReward}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, coinReward: Number(event.target.value) }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100"
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span className="text-slate-300">Gem Reward</span>
                  <input
                    min={0}
                    type="number"
                    value={form.gemReward}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, gemReward: Number(event.target.value) }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100"
                  />
                </label>
              </div>

              <label className="space-y-1 text-sm">
                <span className="text-slate-300">Booster Rewards (JSON array)</span>
                <textarea
                  rows={5}
                  value={form.boosterRewardsText}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, boosterRewardsText: event.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 font-mono text-xs text-slate-100"
                  placeholder='[{"boosterId":1,"quantity":3}]'
                />
              </label>

              <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800"
                />
                Active package
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-60"
              >
                {isSubmitting ? "Saving..." : editingPackage ? "Update Package" : "Create Package"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
