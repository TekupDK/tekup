export async function fetchAgents() {
  const res = await fetch('/api/agents');
  if (!res.ok) throw new Error('Failed to load agents');
  return res.json();
}

export async function fetchAgent(id: string) {
  const res = await fetch(`/api/agents/${id}`);
  if (!res.ok) throw new Error('Failed to load agent');
  return res.json();
}
