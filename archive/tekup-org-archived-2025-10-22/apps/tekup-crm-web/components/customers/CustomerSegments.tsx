"use client";

import { mockCustomers } from "../../lib/types/mockData";

const segments = [
  { id: "commercial", label: "Commercial" },
  { id: "hospitality", label: "Hospitality" },
  { id: "residential", label: "Residential" },
  { id: "public", label: "Public" },
] as const;

const colors: Record<string, string> = {
  commercial: "bg-emerald-500",
  hospitality: "bg-sky-500",
  residential: "bg-indigo-500",
  public: "bg-amber-500",
};

export default function CustomerSegments() {
  const summary = segments.map((segment) => {
    const customers = mockCustomers.filter((customer) => customer.segment === segment.id);
    const totalValue = customers.reduce((sum, customer) => sum + customer.annualContractValue, 0);
    const averageSatisfaction = customers.length
      ? customers.reduce((sum, customer) => sum + customer.satisfactionScore, 0) / customers.length
      : 0;
    return {
      ...segment,
      count: customers.length,
      totalValue,
      averageSatisfaction,
      customers,
    };
  });

  const totalCustomers = mockCustomers.length;
  const totalRevenue = mockCustomers.reduce((sum, customer) => sum + customer.annualContractValue, 0);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Segment performance</h2>
            <p className="text-sm text-slate-500">
              Tekup analyserer segmenter automatisk baseret paa branche, lokation og service mix.
            </p>
          </div>
          <div className="text-xs text-slate-500">
            {totalCustomers} kunder · {new Intl.NumberFormat("da-DK").format(totalRevenue)} DKK ACV
          </div>
        </header>

        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          {summary.map((segment) => (
            <article key={segment.id} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${colors[segment.id]}`} aria-hidden="true" />
                <h3 className="text-sm font-semibold text-slate-900">{segment.label}</h3>
              </div>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{segment.count}</p>
              <p className="text-xs text-slate-500">kunder</p>
              <dl className="mt-3 space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <dt>ACV</dt>
                  <dd>{new Intl.NumberFormat("da-DK").format(segment.totalValue)} DKK</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Tilfredshed</dt>
                  <dd>{segment.averageSatisfaction.toFixed(0)}/100</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Lokationer og specielle krav</h2>
        <p className="text-sm text-slate-500">
          Bruges af operations team til at planlaegge teams, certifikater og eksterne leverandaoer.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {mockCustomers.flatMap((customer) =>
            customer.locations.map((location) => (
              <article key={location.id} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{location.name}</h3>
                    <p className="text-xs text-slate-500">{customer.name}</p>
                  </div>
                  <span className={`h-2 w-2 rounded-full ${colors[customer.segment]}`} aria-hidden="true" />
                </div>
                <dl className="mt-3 space-y-1 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <dt>Areal</dt>
                    <dd>{new Intl.NumberFormat("da-DK").format(location.squareMeters)} m²</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Besog</dt>
                    <dd>{location.visitFrequency}</dd>
                  </div>
                  {location.specialRequirements?.length ? (
                    <div>
                      <dt className="text-xs font-semibold text-slate-500">Specielle krav</dt>
                      <ul className="mt-1 space-y-1 text-[11px] text-slate-600">
                        {location.specialRequirements.map((item) => (
                          <li key={item} className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden="true" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </dl>
              </article>
            )),
          )}
        </div>
      </section>
    </div>
  );
}
