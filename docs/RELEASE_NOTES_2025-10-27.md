# Release Notes – 27. oktober 2025

Fokus: Sikkerhedshærdning og MCP‑konsolidering.

Højdepunkter

- Tilføjet kritisk sikkerhedsguide: `SECURITY_REVOKE_GITHUB_PAT.md` (revokér eksponeret PAT, brug env‑variabler)
- Dokumenteret MCP‑oprydning og standardisering: `MCP_PROBLEM_SOLVED_2025-10-27.md`
- Foreslået samlet MCP‑løsning: `TEKUP_MCP_UNIFIED_SOLUTION.md`
- Resynkroniseret `tekup-secrets` submodule til seneste commit (ingen secrets i repo)
- Værktøj: `scripts/setup-supabase-env.ps1` til sikker opsætning af User‑env og synk af `tekup-mcp-servers/.env`

Anbefalinger

- Opdater IDE‑configs til at bruge miljøvariabler (undgå hardcodede nøgler)
- Begræns filesystem‑scope i IDE’erne til `C:\Users\empir\Tekup`
- Sæt `SUPABASE_*` som Windows User‑env for konsistent læsning i alle værktøjer

Ingen kodeændringer i runtime‑services i denne note; primært dokumentation, sikkerhed og tooling.

