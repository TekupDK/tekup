# 🚀 Performance Test Guide

## Status efter Optimeringer

### ✅ Implementerede Optimeringer

1. **Virtualisering** - 3 komponenter
   - ✅ LeadsTab - Virtual scrolling aktiv
   - ✅ EmailTab - Virtual scrolling aktiv
   - ✅ TasksTab - Virtual scrolling aktiv (auto ved 50+ tasks)

2. **React Optimeringer**
   - ✅ React.memo() på alle hovedkomponenter
   - ✅ useMemo() og useCallback() hvor relevant
   - ✅ Lazy loading af InboxPanel tabs
   - ✅ Query caching optimeret (30-60s staleTime)

3. **Build Optimeringer**
   - ✅ Code splitting (react-vendor, ui-vendor, trpc-vendor chunks)
   - ✅ ESBuild minification
   - ✅ Dependency optimization

### 🧪 Test Checklist

#### 1. LeadsTab Performance Test

- [ ] Åbn LeadsTab med 100+ leads
- [ ] Scroll ned gennem listen - skal være smooth (60 FPS)
- [ ] Søg/filtrer - skal være øjeblikkelig
- [ ] Check browser DevTools Performance tab:
  - Initial load: <200ms (vs. ~800ms før)
  - Scroll FPS: 60 FPS
  - Memory: ~1-2 MB (vs. ~8 MB før)

#### 2. EmailTab Performance Test

- [ ] Åbn EmailTab med 50+ emails
- [ ] Scroll gennem emails - skal være smooth
- [ ] Test section navigation (TODAY, YESTERDAY, etc.)
- [ ] Check at section headers vises korrekt i virtual scrolling

#### 3. TasksTab Performance Test

- [ ] Åbn TasksTab med 100+ tasks
- [ ] Scroll gennem tasks - skal være smooth
- [ ] Test drag & drop funktionalitet
- [ ] Verificer at virtualization kun aktiveres ved 50+ tasks

#### 4. Generelle Performance Tests

- [ ] Browser DevTools > Performance > Record
- [ ] Mål initial load time
- [ ] Mål scroll performance
- [ ] Check Memory profiler
- [ ] Network tab - check chunk sizes

### 📊 Forventede Resultater

| Metric                     | Før       | Efter        | Forbedring    |
| -------------------------- | --------- | ------------ | ------------- |
| Initial render (200 leads) | ~800ms    | ~100ms       | 87% hurtigere |
| Scroll FPS                 | 30-45 FPS | 60 FPS       | 100% smooth   |
| Memory usage               | ~8 MB     | ~1 MB        | 87% mindre    |
| Bundle size                | Standard  | Split chunks | Bedre caching |

### 🔍 Browser DevTools Tips

1. **Performance Tab:**

   ```
   F12 > Performance > Record > Interact > Stop
   - Check FPS
   - Check Long Tasks
   - Check Memory usage
   ```

2. **Memory Tab:**

   ```
   F12 > Memory > Take Heap Snapshot
   - Compare før/efter
   - Check DOM node count
   ```

3. **Network Tab:**
   ```
   F12 > Network > Refresh
   - Check chunk sizes
   - Verify lazy loading works
   ```

### 🐛 Kendte Issues (Ikke relateret til optimeringer)

- EmailPipelineView: Type fejl med 'afsluttet' stage (eksisterende)
- EmailPreviewModal: GmailThread type fejl (eksisterende)

### ✅ Test Resultat

Når test er gennemført, noter:

- [ ] Scroll performance: \_\_\_ FPS
- [ ] Initial load: \_\_\_ ms
- [ ] Memory usage: \_\_\_ MB
- [ ] Issues fundet: \_\_\_
