"use client";

import { mockCustomers, mockServiceHistory } from "../../lib/types/mockData";

const dateFormatter = new Intl.DateTimeFormat("da-DK", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default function CustomerServiceHistory() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Servicehistorik</h2>
          <p className="text-sm text-slate-500">Henter jobdata fra scheduling modulet og kvalitetstjek.</p>
        </div>
        <div className="text-xs text-slate-500">
          {mockServiceHistory.length} registrerede jobs - synkroniseres hver 5. minut
        </div>
      </header>
      <div className="mt-6">
        <div className="grid grid-cols-6 gap-4 border-b border-slate-200 pb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span>Dato</span>
          <span>Kunde</span>
          <span>Lokation</span>
          <span>Job type</span>
          <span>Team</span>
          <span>Status</span>
        </div>
        <div className="divide-y divide-slate-100">
          {mockServiceHistory.map((entry) => {
            const customer = mockCustomers.find((item) => item.id === entry.customerId);
            const location = customer?.locations.find((item) => item.id === entry.locationId);
            return (
              <div key={entry.id} className="grid grid-cols-6 gap-4 py-3 text-sm text-slate-700">
                <span>{dateFormatter.format(new Date(entry.date))}</span>
                <span className="font-medium text-slate-900">{customer?.name ?? "Ukendt kunde"}</span>
                <span>{location?.name ?? "Ukendt lokation"}</span>
                <span>{entry.jobType}</span>
                <span>{entry.team.join(", ")}</span>
                <span className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${statusTone(entry.followUpRequired, entry.issuesFound)}`} aria-hidden="true" />
                  {entry.followUpRequired ? "Opfolgning" : "Afsluttet"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function statusTone(followUpRequired: boolean, issuesFound: number) {
  if (followUpRequired || issuesFound > 0) {
    return "bg-amber-500";
  }
  return "bg-emerald-500";
}
