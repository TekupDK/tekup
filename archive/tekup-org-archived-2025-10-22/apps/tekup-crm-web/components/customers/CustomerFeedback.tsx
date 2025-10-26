"use client";

import { mockCustomers, mockFeedbackInsights } from "../../lib/types/mockData";

export default function CustomerFeedback() {
  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-3">
        {mockFeedbackInsights.map((insight) => {
          const customer = mockCustomers.find((item) => item.id === insight.customerId);
          if (!customer) return null;
          return (
            <article key={insight.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <header className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{customer.name}</p>
                  <p className="text-xs uppercase tracking-wide text-slate-500">{insight.period}</p>
                </div>
                <TrendChip trend={insight.trend} />
              </header>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <SatisfactionPill label="Promoters" value={insight.promoterShare} tone="emerald" />
                <SatisfactionPill label="Passive" value={insight.passiveShare} tone="sky" />
                <SatisfactionPill label="Detractors" value={insight.detractorShare} tone="rose" />
              </div>
              <ul className="mt-6 space-y-3 text-sm text-slate-600">
                {insight.themes.map((theme) => (
                  <li key={theme.topic} className="rounded-lg bg-slate-50 p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-slate-900">{theme.topic}</p>
                      <span className={`text-xs font-semibold ${toneFromSentiment(theme.sentiment)}`}>
                        {theme.sentiment}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{theme.sampleQuote}</p>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">AgentScope signaler</h2>
            <p className="text-sm text-slate-500">
              AI analyserer mails, chat og jobnoter for at finde indsatsomraader.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Live sentiment sync
          </div>
        </header>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {mockCustomers.map((customer) => (
            <article key={customer.id} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">{customer.name}</p>
              <p className="text-xs uppercase tracking-wide text-slate-500">Pulse {customer.satisfactionScore}/100</p>
              <dl className="mt-3 space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <dt>Sidste feedback</dt>
                  <dd>{new Date(customer.lastInteraction).toLocaleDateString("da-DK")}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Naeste survey</dt>
                  <dd>{new Date(customer.nextFollowUp).toLocaleDateString("da-DK")}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>AI anbefaling</dt>
                  <dd className="text-right">
                    {customer.upsellPotential === "high" ? "Planlæg onsite review" : "Hold kvartalsdialog"}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function SatisfactionPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "sky" | "rose";
}) {
  const bg = tone === "emerald" ? "bg-emerald-50 text-emerald-700" : tone === "sky" ? "bg-sky-50 text-sky-700" : "bg-rose-50 text-rose-700";
  return (
    <div className={`rounded-lg px-3 py-4 ${bg}`}>
      <p className="text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-xl font-bold">{(value * 100).toFixed(0)}%</p>
    </div>
  );
}

function toneFromSentiment(sentiment: "positive" | "neutral" | "negative") {
  switch (sentiment) {
    case "positive":
      return "text-emerald-600";
    case "negative":
      return "text-rose-600";
    default:
      return "text-slate-500";
  }
}

function TrendChip({ trend }: { trend: "up" | "down" | "stable" }) {
  const config = {
    up: { label: "Stigende", className: "bg-emerald-50 text-emerald-700" },
    down: { label: "Faldende", className: "bg-rose-50 text-rose-700" },
    stable: { label: "Stabil", className: "bg-slate-100 text-slate-600" },
  }[trend];

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
