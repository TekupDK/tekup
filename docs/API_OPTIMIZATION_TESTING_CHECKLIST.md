# API Optimering - Testing Checklist

**Dato:** ${new Date().toISOString().split('T')[0]}
**Status:** Ready for Testing

## ✅ Pre-Test Verification

### Code Status
- [x] All features implemented
- [x] No linter errors
- [x] TypeScript compilation OK
- [x] Virtual scrolling integrated
- [x] All components updated

### Documentation
- [x] Test reports created
- [x] Quick test guide ready
- [x] Implementation notes complete
- [x] Workflow guide ready

### Environment Setup
- [ ] Dev server running (`pnpm dev`)
- [ ] Browser DevTools open
- [ ] Network tab configured (XHR/Fetch filter)
- [ ] Console tab open
- [ ] Test branch created (optional)

---

## 🧪 Test Execution Order

### Phase 1: Smoke Tests (5 min)
- [ ] Cache basic test
- [ ] Adaptive polling visible test
- [ ] Virtual scrolling scroll test
- [ ] Rate limit UI test (hvis muligt)

### Phase 2: Feature Tests (15 min)
- [ ] Cache optimization detailed test
- [ ] Exponential backoff test
- [ ] Adaptive polling activity test
- [ ] Adaptive polling visibility test
- [ ] Request queue test

### Phase 3: Integration Tests (20 min)
- [ ] Overall API call reduction
- [ ] Combined feature tests
- [ ] Edge cases
- [ ] Error scenarios

---

## 📊 Metrics Collection Template

```markdown
## Test Metrics - [Date]

### API Calls (10 minutes)
- Active Use: _____ calls (target: 15-17)
- Inactive Use: _____ calls (target: 7-10)
- Tab Hidden: _____ calls (target: 0)
- Reduction: _____% (target: 50%+)

### Cache Performance
- Cache Hit Rate: _____% (target: >80%)
- Unnecessary Refetches: _____ (target: Low)

### Polling Intervals
- Active Average: _____s (target: 30-45s)
- Inactive Average: _____s (target: 180-300s)
- Visibility Pause: ✅/❌ (target: Yes)

### Rate Limit Handling
- Rate Limit Errors: _____ (target: 0)
- UI Countdown: ✅/❌ (target: Yes)
- Auto-Resume: ✅/❌ (target: Yes)

### Virtual Scrolling (EmailTab)
- DOM Nodes (50 emails): _____ (target: 10-15)
- Scroll Performance: Smooth/Slow
- Rendering Performance: Good/Poor
```

---

## 🔍 Debugging Checklist

### If Cache Not Working
- [ ] Check `staleTime` setting in main.tsx
- [ ] Verify `structuralSharing: true`
- [ ] Check Network tab for cache headers
- [ ] Verify query keys are stable

### If Adaptive Polling Not Working
- [ ] Check `useAdaptivePolling` hook is imported
- [ ] Verify `enabled` prop is true
- [ ] Check console for hook errors
- [ ] Verify activity detection events

### If Rate Limit Handling Not Working
- [ ] Check `isRateLimitError` detection
- [ ] Verify `requestQueue.setRateLimitUntil()` called
- [ ] Check console for rate limit logs
- [ ] Verify retry-after parsing

### If Virtual Scrolling Issues
- [ ] Check `@tanstack/react-virtual` installed
- [ ] Verify `parentRef` is set correctly
- [ ] Check `virtualizedItems` structure
- [ ] Verify `measureElement` refs

---

## 📝 Test Session Log

### Session: [Date/Time]

**Environment:**
- Branch: _______________
- Browser: _______________
- OS: _______________

**Quick Results:**
```
[ ] All tests passed
[ ] Some tests failed (see details)
[ ] Major issues found
```

**Key Findings:**
1. _______________
2. _______________
3. _______________

**Next Actions:**
1. _______________
2. _______________

---

## 🎯 Success Criteria Checklist

### Must Achieve
- [ ] 50%+ API call reduction
- [ ] 0 rate limit errors (normal use)
- [ ] Cache hit rate > 80%
- [ ] All features working

### Nice to Have
- [ ] Improved perceived performance
- [ ] Smooth virtual scrolling
- [ ] Better UX

---

**Ready for:** User Testing
**Reference:** See `API_OPTIMIZATION_TEST_NOTES_TEMPLATE.md` for detailed notes

