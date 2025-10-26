export function EnvWarning() {
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_API_URL) missing.push('NEXT_PUBLIC_API_URL');
  // API key optional; show hint if absent
  const warn = missing.length > 0;
  if (!warn) return null;
  return (
    <div className="bg-amber-500/15 border border-amber-500/30 text-amber-300 text-sm rounded-md px-3 py-2">
      Manglende miljøvariabler: {missing.join(', ')}. Se .env.example.
    </div>
  );
}
