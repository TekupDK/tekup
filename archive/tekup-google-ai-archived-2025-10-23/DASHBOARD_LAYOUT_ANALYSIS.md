# Dashboard Layout & Spacing Analysis

## Executive Summary
Analyse af alle dashboard komponenter med fokus på spacing, padding, og visuel hierarki.

## Problemer Identificeret

### 1. **ConflictMonitor** (lines 100-319)
❌ **Problemer:**
- Inconsistent padding (p-3 i metrics, varierende i badges)
- Mangler proper spacing mellem metrics grid og content
- Small card layout ser tæt ud

### 2. **EmailQualityMonitor** (lines 1-329)
❌ **Problemer:**
- Grid metrics har ingen spacing buffer
- Badge badges for tæt på hinanden
- Card content mangler breathing room
- Small text og ikoner

### 3. **FollowUpTracker** (lines 1-395)
❌ **Problemer:**
- Metrics grid tæt pakket
- List items mangler space between
- Attempt breakdown boxes for tætte
- Small ikoner og fonte

### 4. **RateLimitMonitor** (lines 1-319)
❌ **Problemer:**
- Per-service limit cards cramped
- Progress bars mangler spacing
- Grid layout tæt

### 5. **SystemStatus** (lines 1-290)
❌ **Problemer:**
- Feature status items tætte
- Warnings section mangler spacing
- Risk indicator card kunne være større

### 6. **Dashboard Main Layout**
✅ **Godt:**
- Top stats cards har god spacing (gap-6 lg:gap-8)
- Header section well-spaced

⚠️ **Kan forbedres:**
- Space mellem komponenter kunne være større
- Cache performance metrics tætte
- Recent leads/bookings lists cramped

## Anbefalet Løsning

### Global Spacing Standard
```typescript
// Small components/list items
padding: p-5 (20px)
gap: gap-3 (12px)
space-y: space-y-3

// Medium components/cards  
padding: p-6 (24px)
gap: gap-4-6 (16-24px)
space-y: space-y-4-6

// Large sections/containers
padding: p-8 (32px)
gap: gap-6-8 (24-32px)
space-y: space-y-8

// Icon sizes
Small: w-5 h-5 (20px)
Medium: w-6 h-6 (24px)  
Large: w-7 h-7 (28px)

// Font sizes
Small text: text-sm (14px)
Body: text-base (16px)
Headings: text-lg-2xl (18-24px)
Numbers/Stats: text-2xl-4xl (24-36px+)
```

## Prioriteret Fix Liste

### HIGH PRIORITY (meget cramped)
1. ✅ QuoteStatusTracker - FIXED
2. 🔴 EmailQualityMonitor - needs work
3. 🔴 FollowUpTracker - needs work  
4. 🔴 RateLimitMonitor - needs work

### MEDIUM PRIORITY (kunne være bedre)
5. 🟡 ConflictMonitor - minor improvements
6. 🟡 SystemStatus - minor improvements
7. 🟡 Cache Performance section - spacing

### LOW PRIORITY (acceptable)
8. 🟢 Top stats cards - already good
9. 🟢 Recent leads/bookings - minor tweaks

## Implementation Plan

For hver komponent:
1. Øg card padding fra p-4 til p-6
2. Øg grid gaps fra gap-3/4 til gap-6  
3. Øg list item spacing fra space-y-2 til space-y-3/4
4. Bump ikon sizes fra w-4 til w-5/6
5. Increase font sizes for readability
6. Add proper rounded-xl instead of rounded-lg
7. Ensure consistent hover states
