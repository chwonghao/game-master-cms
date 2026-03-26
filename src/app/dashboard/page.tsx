"use client";

import { useEffect, useMemo, useState } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import {
  BarChart3,
  DollarSign,
  Gamepad2,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface AnalyticsMetrics {
  totalUsers: number;
  activeGames: number;
  totalLevels: number;
  revenue: number;
  dailyMetrics: Array<{
    date: string;
    dau: number;
    revenue: number;
  }>;
  dropoffMetrics: Array<{
    level: string;
    dropoff: number;
  }>;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      setIsLoading(true);
      try {
        const summaryResponse = await fetch("/api/dashboard/summary", {
          cache: "no-store",
        });

        if (!summaryResponse.ok) {
          throw new Error("Failed to load dashboard summary");
        }

        const summary = (await summaryResponse.json()) as {
          gamesCount: number;
          levelsCount: number;
          usersCount: number;
        };

        // Keep chart data mocked for now.
        const today = new Date();
        const mockData: AnalyticsMetrics = {
          totalUsers: summary.usersCount,
          activeGames: summary.gamesCount,
          totalLevels: summary.levelsCount,
          revenue: 24580.5,
          dailyMetrics: Array.from({ length: 7 }, (_, i) => {
            const date = new Date(today);
            date.setDate(date.getDate() - (6 - i));
            return {
              date: date.toLocaleDateString("en-US", { weekday: "short" }),
              dau: 8200 + Math.floor(Math.random() * 3000),
              revenue: 2800 + Math.floor(Math.random() * 2500),
            };
          }),
          dropoffMetrics: [
            { level: "Level 1-5", dropoff: 8 },
            { level: "Level 6-10", dropoff: 15 },
            { level: "Level 11-15", dropoff: 22 },
            { level: "Level 16-20", dropoff: 31 },
            { level: "Level 21-25", dropoff: 45 },
            { level: "Level 26-30", dropoff: 58 },
            { level: "Level 31-35", dropoff: 72 },
          ],
        };

        setMetrics(mockData);
      } catch (error) {
        console.error("Failed to fetch analytics metrics:", error);
      } finally {
        setIsLoading(false);
      }
    }

    void fetchMetrics();
  }, []);

  const lineChartData = useMemo(() => {
    if (!metrics) return null;

    return {
      labels: metrics.dailyMetrics.map((m) => m.date),
      datasets: [
        {
          label: "Daily Active Users",
          data: metrics.dailyMetrics.map((m) => m.dau),
          borderColor: "rgb(6, 182, 212)",
          backgroundColor: "rgba(6, 182, 212, 0.1)",
          fill: true,
          tension: 0.4,
          yAxisID: "y",
        },
        {
          label: "Revenue ($)",
          data: metrics.dailyMetrics.map((m) => m.revenue),
          borderColor: "rgb(34, 197, 94)",
          backgroundColor: "rgba(34, 197, 94, 0.1)",
          fill: true,
          tension: 0.4,
          yAxisID: "y1",
        },
      ],
    };
  }, [metrics]);

  const barChartData = useMemo(() => {
    if (!metrics) return null;

    return {
      labels: metrics.dropoffMetrics.map((m) => m.level),
      datasets: [
        {
          label: "Dropoff Rate (%)",
          data: metrics.dropoffMetrics.map((m) => m.dropoff),
          backgroundColor: [
            "rgba(34, 197, 94, 0.8)",
            "rgba(59, 130, 246, 0.8)",
            "rgba(249, 115, 22, 0.8)",
            "rgba(239, 68, 68, 0.8)",
            "rgba(168, 85, 247, 0.8)",
            "rgba(236, 72, 153, 0.8)",
            "rgba(6, 182, 212, 0.8)",
          ],
          borderColor: [
            "rgb(34, 197, 94)",
            "rgb(59, 130, 246)",
            "rgb(249, 115, 22)",
            "rgb(239, 68, 68)",
            "rgb(168, 85, 247)",
            "rgb(236, 72, 153)",
            "rgb(6, 182, 212)",
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [metrics]);

  const lineChartOptions = {
    responsive: true,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        labels: {
          color: "rgb(148, 163, 184)",
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        ticks: {
          color: "rgb(148, 163, 184)",
        },
        grid: {
          color: "rgba(51, 65, 85, 0.5)",
        },
        title: {
          display: true,
          text: "Daily Active Users",
          color: "rgb(148, 163, 184)",
        },
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        ticks: {
          color: "rgb(148, 163, 184)",
        },
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: "Revenue ($)",
          color: "rgb(148, 163, 184)",
        },
      },
      x: {
        ticks: {
          color: "rgb(148, 163, 184)",
        },
        grid: {
          color: "rgba(51, 65, 85, 0.5)",
        },
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: "rgb(148, 163, 184)",
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        ticks: {
          color: "rgb(148, 163, 184)",
        },
        grid: {
          color: "rgba(51, 65, 85, 0.5)",
        },
        title: {
          display: true,
          text: "Dropoff Rate (%)",
          color: "rgb(148, 163, 184)",
        },
      },
      x: {
        ticks: {
          color: "rgb(148, 163, 184)",
        },
        grid: {
          color: "rgba(51, 65, 85, 0.5)",
        },
      },
    },
  };

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Overview</p>
        <h2 className="text-3xl font-semibold tracking-tight">Dashboard</h2>
        <p className="max-w-2xl text-sm text-slate-300">
          Manage games, tune level balance, and inspect telemetry from one control center.
        </p>
      </header>

      {isLoading ? (
        <p className="text-sm text-slate-300">Loading metrics...</p>
      ) : metrics ? (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Total Users
                  </p>
                  <p className="mt-3 text-3xl font-bold tracking-tight text-slate-100">
                    {metrics.totalUsers.toLocaleString()}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">Authenticated CMS users</p>
                </div>
                <Users className="h-8 w-8 text-cyan-400/60" />
              </div>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Active Games
                  </p>
                  <p className="mt-3 text-3xl font-bold tracking-tight text-slate-100">
                    {metrics.activeGames}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">Total games in database</p>
                </div>
                <Gamepad2 className="h-8 w-8 text-violet-400/60" />
              </div>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Total Levels
                  </p>
                  <p className="mt-3 text-3xl font-bold tracking-tight text-slate-100">
                    {metrics.totalLevels}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">Total levels in database</p>
                </div>
                <Wrench className="h-8 w-8 text-emerald-400/60" />
              </div>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Revenue
                  </p>
                  <p className="mt-3 text-3xl font-bold tracking-tight text-slate-100">
                    ${metrics.revenue.toFixed(2)}
                  </p>
                  <p className="mt-2 text-xs text-emerald-400">+8% this month</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-400/60" />
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid gap-6 xl:grid-cols-2">
            {/* Line Chart: DAU & Revenue Trend */}
            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6">
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-cyan-400" />
                <h3 className="text-lg font-semibold">Daily Active Users & Revenue Trend</h3>
              </div>
              <p className="mb-4 text-xs text-slate-400">Last 7 days performance</p>
              {lineChartData ? (
                <div className="h-80">
                  <Line data={lineChartData} options={lineChartOptions} />
                </div>
              ) : null}
            </div>

            {/* Bar Chart: Level Dropoff */}
            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6">
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-orange-400" />
                <h3 className="text-lg font-semibold">Level Drop-off Rate</h3>
              </div>
              <p className="mb-4 text-xs text-slate-400">Where players struggle most</p>
              {barChartData ? (
                <div className="h-80">
                  <Bar data={barChartData} options={barChartOptions} />
                </div>
              ) : null}
            </div>
          </div>

          {/* Action Footer */}
          <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
            <p className="text-xs text-slate-400">
              💡 <strong>Tip:</strong> Use drop-off metrics to identify difficult levels that need
              rebalancing. Aim for drop-off rates between 15-30% for optimal difficulty curve.
            </p>
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-300">Failed to load metrics.</p>
      )}
    </section>
  );
}
