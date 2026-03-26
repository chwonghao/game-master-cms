import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const events = await prisma.analytics.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: { game: true },
  });

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Monitoring</p>
        <h2 className="text-3xl font-semibold tracking-tight">Analytics Events</h2>
        <p className="text-sm text-slate-300">
          Latest 50 events from the telemetry stream.
        </p>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900/60">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-700 bg-slate-950/60 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Game Title</th>
              <th className="px-4 py-3">Event Type</th>
              <th className="px-4 py-3">Data (JSON stringified)</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-300">
                  No analytics events found.
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr key={event.id} className="border-b border-slate-800 align-top last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap text-slate-300">
                    {new Date(event.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-slate-100">{event.game.title}</td>
                  <td className="px-4 py-3 text-slate-300">{event.eventType}</td>
                  <td className="px-4 py-3 text-xs text-slate-300">
                    <pre className="max-w-xl overflow-x-auto whitespace-pre-wrap break-words rounded-md bg-slate-950/70 p-2">
                      {JSON.stringify(event.data)}
                    </pre>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
