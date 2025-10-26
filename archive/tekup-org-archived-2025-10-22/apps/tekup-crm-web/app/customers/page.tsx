"use client";

import { useState } from "react";
import CustomerOverview from "../../components/customers/CustomerOverview";
import CustomerContracts from "../../components/customers/CustomerContracts";
import CustomerFeedback from "../../components/customers/CustomerFeedback";
import CustomerSegments from "../../components/customers/CustomerSegments";
import CustomerServiceHistory from "../../components/customers/CustomerServiceHistory";

const tabs = [
  { id: "overview", label: "Overblik" },
  { id: "contracts", label: "Kontrakter" },
  { id: "feedback", label: "Feedback" },
  { id: "segments", label: "Segmenter" },
  { id: "history", label: "Servicehistorik" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function CustomersPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto w-full max-w-7xl px-4">
        <header className="mb-8 space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">Tekup Lead Platform</p>
              <h1 className="text-3xl font-bold text-slate-900">Kundeoplevelse og account health</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Live synkronisering mellem CRM, scheduling, kvalitet og AgentScope sikrer at alle kunde touchpoints er dokumenteret og kan handles paa i realtid.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
              <Badge tone="emerald">AI playbooks</Badge>
              <Badge tone="sky">Gmail sync</Badge>
              <Badge tone="amber">Quality alerts</Badge>
              <Badge tone="indigo">Economics API</Badge>
            </div>
          </div>
          <nav className="flex overflow-x-auto rounded-full border border-slate-200 bg-white p-1 shadow-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-slate-900 text-white shadow"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </header>

        <main className="space-y-6">
          {activeTab === "overview" && <CustomerOverview />}
          {activeTab === "contracts" && <CustomerContracts />}
          {activeTab === "feedback" && <CustomerFeedback />}
          {activeTab === "segments" && <CustomerSegments />}
          {activeTab === "history" && <CustomerServiceHistory />}
        </main>
      </div>
    </div>
  );
}

function Badge({ tone, children }: { tone: "emerald" | "sky" | "amber" | "indigo"; children: React.ReactNode }) {
  const background = {
    emerald: "bg-emerald-50 text-emerald-700",
    sky: "bg-sky-50 text-sky-700",
    amber: "bg-amber-50 text-amber-700",
    indigo: "bg-indigo-50 text-indigo-700",
  }[tone];
  return <span className={`inline-flex items-center rounded-full px-3 py-1 ${background}`}>{children}</span>;
}
