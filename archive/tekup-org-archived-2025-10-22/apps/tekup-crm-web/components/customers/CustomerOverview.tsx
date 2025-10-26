"use client";

import { mockCustomers, mockRevenueProjections } from "../../lib/types/mockData";

const currencyFormatter = new Intl.NumberFormat("da-DK", {
  style: "currency",
  currency: "DKK",
  maximumFractionDigits: 0,
});

const shortDateFormatter = new Intl.DateTimeFormat("da-DK", {
  day: "numeric",
  month: "short",
});

const longDateFormatter = new Intl.DateTimeFormat("da-DK", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default function CustomerOverview() {
  const totalAnnualValue = mockCustomers.reduce((sum, customer) => sum + customer.annualContractValue, 0);
  const averageSatisfaction =
    mockCustomers.reduce((sum, customer) => sum + customer.satisfactionScore, 0) / mockCustomers.length;

  const activeContracts = mockCustomers.filter((customer) => customer.contractStatus === "active").length;
  const expiringSoon = mockCustomers.filter((customer) => customer.contractStatus === "expiring_soon");

  const revenueByCustomer = mockRevenueProjections.map((projection) => {
    const customer = mockCustomers.find((c) => c.id === projection.customerId);
    return {
      name: customer?.name ?? "Ukendt kunde",
      trailing: projection.trailingTwelveMonths,
      forecast: projection.forecastNextQuarter,
      churnRisk: projection.churnRisk,
      upsell: projection.upsellOpportunities,
    };
  });

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <OverviewCard
          title="Aarskontraktsvaerdi"
          value={currencyFormatter.format(totalAnnualValue)}
          description="Samlet aarlig omsaetning fra aktive kunder"
        />
        <OverviewCard
          title="Aktive kontrakter"
          value={`${activeContracts}`}
          description="Kontrakter leveret af Tekup teamet"
        />
        <OverviewCard
          title="Gennemsnitlig tilfredshed"
          value={`${averageSatisfaction.toFixed(0)} / 100`}
          description="Tekup Pulse score seneste 90 dage"
        />
        <OverviewCard
          title="Automations aktiv"
          value={`${mockCustomers.reduce((sum, customer) => sum + customer.automationPlaybooks.length, 0)}`}
          description="Running AI playbooks across portfolio"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <header>
            <h2 className="text-lg font-semibold text-slate-900">Kundeoverblik</h2>
            <p className="text-sm text-slate-500">Segmenteret efter branche og kontraktstatus</p>
          </header>
          <div className="rounded-lg bg-slate-50 p-4">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="font-medium text-slate-600">Commercial</dt>
                <dd className="text-2xl font-semibold text-slate-900">
                  {mockCustomers.filter((customer) => customer.segment === "commercial").length}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-600">Residential</dt>
                <dd className="text-2xl font-semibold text-slate-900">
                  {mockCustomers.filter((customer) => customer.segment === "residential").length}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-600">Hospitality</dt>
                <dd className="text-2xl font-semibold text-slate-900">
                  {mockCustomers.filter((customer) => customer.segment === "hospitality").length}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-600">Public</dt>
                <dd className="text-2xl font-semibold text-slate-900">
                  {mockCustomers.filter((customer) => customer.segment === "public").length}
                </dd>
              </div>
            </dl>
          </div>

          <div className="space-y-4">
            {mockCustomers.map((customer) => (
              <article key={customer.id} className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{customer.name}</p>
                    <p className="text-xs uppercase tracking-wide text-slate-500">{customer.segment}</p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(
                      customer.contractStatus
                    )}`}
                  >
                    {contractStatusLabel(customer.contractStatus)}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-4 text-xs text-slate-500">
                  <div>
                    <dt>Kontraktsvaerdi</dt>
                    <dd className="font-medium text-slate-900">
                      {currencyFormatter.format(customer.annualContractValue)}
                    </dd>
                  </div>
                  <div>
                    <dt>Tilfredshed</dt>
                    <dd className="font-medium text-slate-900">{customer.satisfactionScore}/100</dd>
                  </div>
                  <div>
                    <dt>Sidste kontakt</dt>
                    <dd>{shortDateFormatter.format(new Date(customer.lastInteraction))}</dd>
                  </div>
                  <div>
                    <dt>Naeste opfoelgning</dt>
                    <dd>{shortDateFormatter.format(new Date(customer.nextFollowUp))}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Revenue og churn forecast</h2>
              <p className="text-sm text-slate-500">AgentScope forudsigelser baseret paa real-time data</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              Live sync
            </span>
          </header>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-3">Kunde</th>
                  <th className="pb-3">TTM omsaetning</th>
                  <th className="pb-3">Forecast Q+1</th>
                  <th className="pb-3">Churn risiko</th>
                  <th className="pb-3">Upsell cases</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {revenueByCustomer.map((row) => (
                  <tr key={row.name} className="text-slate-700">
                    <td className="py-3 font-medium text-slate-900">{row.name}</td>
                    <td className="py-3">{currencyFormatter.format(row.trailing)}</td>
                    <td className="py-3">{currencyFormatter.format(row.forecast)}</td>
                    <td className="py-3">
                      <RiskBadge risk={row.churnRisk} />
                    </td>
                    <td className="py-3">{row.upsell}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {expiringSoon.length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-lg font-semibold text-amber-900">Kontrakter der skal fornys</h2>
          <p className="text-sm text-amber-700">
            {expiringSoon.length} {expiringSoon.length === 1 ? "kunde" : "kunder"} udloeb er inden for 90 dage. Planlaeg account plan med salgs-teamet.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {expiringSoon.map((customer) => (
              <article key={customer.id} className="rounded-lg border border-white/60 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">{customer.name}</h3>
                <p className="text-xs uppercase tracking-wide text-slate-500">Kontrakt udloeb {longDateFormatter.format(new Date(customer.contractEnd))}</p>
                <dl className="mt-3 space-y-1 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <dt>ACV</dt>
                    <dd className="font-medium text-slate-900">
                      {currencyFormatter.format(customer.annualContractValue)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Churn risiko</dt>
                    <dd>
                      <RiskBadge risk={customer.churnRisk} />
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Account ansvarlig</dt>
                    <dd>{customer.primaryContact.name}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

type StatusClass = "text-emerald-700 bg-emerald-100" | "text-blue-700 bg-blue-100" | "text-amber-700 bg-amber-100" | "text-rose-700 bg-rose-100";

function getStatusColor(status: string): StatusClass {
  switch (status) {
    case "active":
      return "text-emerald-700 bg-emerald-100";
    case "onboarding":
      return "text-blue-700 bg-blue-100";
    case "expiring_soon":
      return "text-amber-700 bg-amber-100";
    default:
      return "text-rose-700 bg-rose-100";
  }
}

function contractStatusLabel(status: string) {
  switch (status) {
    case "active":
      return "Aktiv";
    case "onboarding":
      return "Onboarding";
    case "expiring_soon":
      return "Udloeb nærmer sig";
    case "at_risk":
      return "Risiko";
    default:
      return status;
  }
}

function RiskBadge({ risk }: { risk: number }) {
  let tone = "text-emerald-700 bg-emerald-100";
  if (risk >= 0.3) {
    tone = "text-rose-700 bg-rose-100";
  } else if (risk >= 0.15) {
    tone = "text-amber-700 bg-amber-100";
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${tone}`}>
      {(risk * 100).toFixed(0)}%
    </span>
  );
}

function OverviewCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-medium text-slate-500">{title}</h3>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </article>
  );
}

