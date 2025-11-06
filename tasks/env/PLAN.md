# Environment & Config – Plan

Context: `.env.dev/.env.prod` templates; docker-compose uses `.env.prod`.

## Goals

- Keep env clean, safe, and documented with templates.

## Acceptance criteria

- [ ] Templates up to date; no secrets in repo.
- [ ] `check-env.js` passes for both dev and prod.
- [ ] Supabase/OpenAI/Gemini nøgler ligger i secret store (ikke i `.env.prod`), og rotation er dokumenteret.

## Steps (suggested)

- [ ] Periodic audit of template keys and usage.
- [ ] Keep README and QUICK_ENV_REFERENCE current.
- [ ] Fjerne committed `.env.prod`, erstatte med template + beskrive hvordan deploy henter hemmeligheder.
- [ ] Gennemgå Supabase connection strings jævnligt og roter ved læk (log i SECURITY task).
