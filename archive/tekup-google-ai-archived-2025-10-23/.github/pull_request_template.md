## 📝 Beskrivelse

<!-- Beskriv dine ændringer her. Hvad gør denne PR? Hvorfor er den nødvendig? -->

## 🏷️ Type ændring

- [ ] 🐛 Bug fix (non-breaking change der løser et issue)
- [ ] ✨ Ny feature (non-breaking change der tilføjer funktionalitet)
- [ ] 💥 Breaking change (fix eller feature der får eksisterende funktionalitet til at bryde)
- [ ] 📚 Dokumentation opdatering
- [ ] 🎨 Style ændringer (formatering, manglende semikoloner, etc.)
- [ ] ♻️ Refactoring (ingen functional changes)
- [ ] ⚡ Performance forbedring
- [ ] 🔒 Security fix

## ✅ Testing

- [ ] Unit tests tilføjet/opdateret
- [ ] E2E tests tilføjet/opdateret (hvis relevant)
- [ ] Manuel testing udført
- [ ] Alle tests passer lokalt (`npm test`)
- [ ] TypeScript kompilerer uden fejl (`npx tsc --noEmit`)
- [ ] Lint check passer (`npm run lint`)

## 🔒 Security Checklist

- [ ] Ingen credentials committed (check `.env`, secrets)
- [ ] Input validation tilføjet hvor nødvendigt
- [ ] Output encoding bruges (XSS prevention)
- [ ] Authentication/authorization checked
- [ ] Rate limiting på plads (hvis API endpoint)
- [ ] Security headers konfigureret
- [ ] CSRF protection enabled (hvis relevant)
- [ ] npm audit viser 0 high/critical vulnerabilities

## ♿ Accessibility

- [ ] Keyboard navigation virker
- [ ] Screen reader testet (hvis UI changes)
- [ ] Color contrast WCAG AA minimum (4.5:1)
- [ ] Focus indicators synlige
- [ ] Alt text på billeder (hvis relevant)

## 📊 Performance

- [ ] Lighthouse score > 90 (hvis UI changes)
- [ ] Bundle size tjekket (ingen uventet stigning)
- [ ] Database queries optimeret (hvis relevant)
- [ ] Caching implementeret hvor muligt

## 📚 Dokumentation

- [ ] README opdateret (hvis nødvendigt)
- [ ] API docs opdateret (hvis API changes)
- [ ] KPI definitioner dokumenteret (hvis dashboard changes)
- [ ] SECURITY.md opdateret (hvis security changes)
- [ ] CHANGELOG.md opdateret
- [ ] Inline code comments tilføjet for kompleks logik

## 🔗 Relaterede Issues

<!-- Link til relaterede GitHub Issues -->
Fixes #(issue nummer)

## 📸 Screenshots (hvis relevant)

<!-- Tilføj screenshots for UI changes -->

## 🚀 Deployment Plan

<!-- Beskriv hvordan denne PR skal deployes -->

- [ ] Deploy til develop først
- [ ] QA testing i staging
- [ ] Deploy til production
- [ ] Feature flag strategy (hvis relevant)
- [ ] Rollback plan dokumenteret

## 👥 Reviewers

<!-- Tag relevante reviewers -->
@backend-team @frontend-team

## 📋 Pre-merge Checklist

- [ ] CI/CD checks passer (lint, typecheck, test, security, build)
- [ ] Code review godkendt af min 1 reviewer
- [ ] Conflicts resolved
- [ ] Branch er up-to-date med target branch
- [ ] Deployment guide opdateret (hvis nødvendigt)

---

**Reviewer Guide:**

- ✅ Tjek at koden følger projekts coding standards
- ✅ Verificer at alle tests passer
- ✅ Tjek for security vulnerabilities
- ✅ Verificer at dokumentation er komplet
- ✅ Test funktionaliteten manuelt hvis muligt
