"use client";

import { mockCustomers } from "../../lib/types/mockData";

const currencyFormatter = new Intl.NumberFormat("da-DK", {
  style: "currency",
  currency: "DKK",
  maximumFractionDigits: 0,
});

export default function CustomerContracts() {
  const onboardingCustomers = mockCustomers.filter((customer) => customer.contractStatus === "onboarding");
  const atRiskCustomers = mockCustomers.filter((customer) => customer.contractStatus === "at_risk");

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Kontrakt pipeline</h2>
            <p className="text-sm text-slate-500">Oversigt over aktive og onboarding aftaler</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" /> Aktiv
            <span className="flex h-2 w-2 rounded-full bg-sky-500" /> Onboarding
            <span className="flex h-2 w-2 rounded-full bg-amber-500" /> Udløb snart
            <span className="flex h-2 w-2 rounded-full bg-rose-500" /> Risiko
          </div>
        </header>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {mockCustomers.map((customer) => (
            <article key={customer.id} className="rounded-lg border border-slate-100 p-4 shadow-sm">
              <header className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{customer.name}</h3>
                  <p className="text-xs uppercase tracking-wide text-slate-500">{customer.segment}</p>
                </div>
                <span className={`h-2 w-2 rounded-full ${statusColor(customer.contractStatus)}`} aria-hidden="true" />
              </header>
              <dl className="mt-3 space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <dt>Kontrakt</dt>
                  <dd className="font-medium text-slate-900">
                    {currencyFormatter.format(customer.annualContractValue)} / aar
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Service niveau</dt>
                  <dd className="capitalize">{customer.serviceLevel}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Lokationer</dt>
                  <dd>{customer.locations.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Integrations</dt>
                  <dd>{integrationSummary(customer.integrationsEnabled)}</dd>
                </div>
              </dl>
              <div className="mt-4 rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-600">Næste opgave</p>
                <p className="text-sm text-slate-900">{customer.automationPlaybooks[0]?.name ?? 'Ingen playbooks'}</p>
                <p className="mt-1 text-xs text-slate-500">
                  KPI: {customer.automationPlaybooks[0]?.kpi ?? 'Definer KPI for at aktivere automation'}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Onboarding lige nu</h2>
          <p className="text-sm text-slate-500">
            Automatiserede step-by-step playbooks sikrer en blød transition fra salg til drift.
          </p>
          <div className="mt-4 space-y-4">
            {onboardingCustomers.map((customer) => (
              <article key={customer.id} className="rounded-lg border border-sky-100 bg-sky-50 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{customer.name}</h3>
                    <p className="text-xs text-slate-600">Account owner: {customer.primaryContact.name}</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-white px-2 py-1 text-xs font-medium text-sky-700">
                    {customer.automationPlaybooks.length} playbooks
                  </span>
                </div>
                <ul className="mt-3 space-y-2 text-xs text-slate-600">
                  {customer.locations.map((location) => (
                    <li key={location.id} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-sky-500" aria-hidden="true" />
                      {location.name} – {location.visitFrequency} besøg
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-rose-900">Accounts i risiko</h2>
          <p className="text-sm text-rose-700">
            Holder øje med churn indikatorer fra tilfredshed, kommunikation og kvalitet.
          </p>
          <div className="mt-4 space-y-4">
            {atRiskCustomers.length === 0 ? (
              <p className="rounded-lg bg-white p-4 text-xs text-rose-700">
                Ingen aktive kunder markeret som risiko. AgentScope overvåger løbende sentiment på kundekommunikation.
              </p>
            ) : (
              atRiskCustomers.map((customer) => (
                <article key={customer.id} className="rounded-lg border border-white/60 bg-white p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-rose-900">{customer.name}</h3>
                      <p className="text-xs text-rose-700">
                        Satisfaction {customer.satisfactionScore}/100 – churn risiko {(customer.churnRisk * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="text-right text-xs text-rose-600">
                      <p>Sidste kontakt</p>
                      <p>{new Date(customer.lastInteraction).toLocaleDateString("da-DK")}</p>
                    </div>
                  </div>
                  <ul className="mt-3 space-y-2 text-xs text-rose-700">
                    {customer.preferredProducts.map((product) => (
                      <li key={product} className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-rose-400" aria-hidden="true" />
                        {product}
                      </li>
                    ))}
                  </ul>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function statusColor(status: string) {
  switch (status) {
    case "active":
      return "bg-emerald-500";
    case "onboarding":
      return "bg-sky-500";
    case "expiring_soon":
      return "bg-amber-500";
    default:
      return "bg-rose-500";
  }
}

function integrationSummary(integrations: {
  economics: boolean;
  calendar: boolean;
  email: boolean;
  qualityApp: boolean;
  agentScope: boolean;
}) {
  const enabled = Object.entries(integrations)
    .filter(([, value]) => value)
    .map(([name]) => name)
    .slice(0, 3)
    .join(", ");
  const totalEnabled = Object.values(integrations).filter(Boolean).length;
  if (!enabled) {
    return "Ingen";
  }
  if (totalEnabled > 3) {
    return `${enabled} +${totalEnabled - 3}`;
  }
  return enabled;
}
