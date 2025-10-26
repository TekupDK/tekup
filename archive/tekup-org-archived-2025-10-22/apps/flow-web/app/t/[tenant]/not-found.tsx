import Link from 'next/link';

export default function NotFound() {
  const tenants = [
    { id: 'rendetalje', label: 'Rendetalje' },
    { id: 'foodtruck', label: 'FoodTruck' },
    { id: 'tekup', label: 'TekUp' }
  ];

  return (
    <main className="p-8">
      <div className="max-w-xl mx-auto text-center">
        <h1 className="text-2xl font-semibold text-neutral-200 mb-2">Tenant not found</h1>
        <p className="text-neutral-400 mb-6">The tenant you requested does not exist. Select a valid tenant below.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {tenants.map(t => (
            <Link key={t.id} href={`/t/${t.id}/leads`} className="border border-neutral-700 hover:border-neutral-500 rounded px-4 py-3 text-neutral-200 hover:text-white transition-colors">
              {t.label}
            </Link>
          ))}
        </div>
        <div className="mt-6">
          <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-200">Back to home</Link>
        </div>
      </div>
    </main>
  );
}
