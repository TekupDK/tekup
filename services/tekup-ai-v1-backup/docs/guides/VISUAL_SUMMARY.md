# 🎨 RenOS - Visual System Summary

\n\n
\n\n*Quick Reference Guide for Developers*

---

\n\n## 📊 System Oversigt
\n\n
\n\n**Total UI Komponenter:** 98
\n\n- 36 Page Components (features)
\n\n- 62 UI Library Components (reusable)
\n\n
**Design System:** Tailwind CSS v4 + shadcn/ui  
**Font:** Inter (Google Fonts, weights 300-800)  
**Icons:** Lucide React (1000+ icons, tree-shakeable)  
**Charts:** Recharts (Area, Pie, Bar, Line)  
**Authentication:** Clerk
\n\n
---

\n\n## 🎨 Color System
\n\n
\n\n```css
\n\n/* Brand Colors */
--primary: #00d4ff          /* Cyan - main brand */
--accent: #7c3aed           /* Purple - secondary */
\n\n
/* Semantic Colors */
--success: #10b981          /* Green */
--warning: #f59e0b          /* Amber */
--error: #ef4444            /* Red */
--info: #3b82f6             /* Blue */
\n\n
/* Neutral Colors */
--background: #ffffff       /* Light mode */
--foreground: #020617       /* Dark text */
--muted: #f1f5f9            /* Light gray */
\n\n
/* Dark Mode (automatic via system preference) */
\n\n.dark --background: #0f172a
.dark --foreground: #f8fafc
\n\n```

---

\n\n## 📱 Pages Quick Reference
\n\n
\n\n| Page | Route | Status | Key Features |
|------|-------|--------|--------------|
| Dashboard | `/dashboard` | ✅ | Stats, Charts, Activity Feed |
| Chat | `/chat` | ✅ | AI Assistant, Voice Input |
| Customers | `/customers` | ✅ | CRUD, Search, Table |
| Customer 360 | `/customer360` | ✅ | Unified View, Timeline |
| Leads | `/leads` | ✅ | Lead Management, AI Quotes |
| Email Approval | `/email-approval` | ✅ | Approve/Reject Workflow |
| Bookings | `/bookings` | ✅ | Calendar Integration |
| Services | `/services` | ⚠️ | Basic Implementation |
| Quotes | `/quotes` | ✅ | Quote Management |
| Analytics | `/analytics` | ✅ | Business Intelligence |
| Settings | `/settings` | ✅ | User Preferences |

---

\n\n## 🧩 Component Categories
\n\n
\n\n### **Layout** (9)
\n\nCard, Separator, Sidebar, Sheet, Drawer, Aspect-ratio, Scroll-area, Resizable, Collapsible
\n\n
\n\n### **Forms** (12)
\n\nButton, Input, Textarea, Select, Checkbox, Radio, Switch, Label, Form, Input-otp, Slider, Calendar
\n\n
\n\n### **Feedback** (11)
\n\nToast, Alert, Alert-dialog, Tooltip, Progress, ProgressBar, LoadingSpinner, Skeleton, Badge, EmptyState, ErrorState
\n\n
\n\n### **Navigation** (8)
\n\nBreadcrumb, Menubar, Navigation-menu, Tabs, Pagination, Command, Dropdown-menu, Context-menu
\n\n
\n\n### **Data Display** (9)
\n\nTable, Avatar, Chart, Hover-card, Popover, Dialog, Carousel, Accordion, Toggle-group
\n\n
\n\n### **Utilities** (13)
\n\nErrorBoundary, use-toast, Layout, GlobalSearch, Various Skeletons, Toggle, Sonner, NotFound, ServiceForm
\n\n
---

\n\n## ⌨️ Keyboard Shortcuts
\n\n
\n\n| Shortcut | Action |
|----------|--------|
| `Ctrl + K` | Open Global Search |
\n\n| `Ctrl + D` | Go to Dashboard |
\n\n| `Ctrl + Shift + C` | Open Chat Interface |
\n\n| `Esc` | Close Modal/Dialog |
| `Tab` / `Shift + Tab` | Navigate Fields |
\n\n| `Enter` | Submit / Select |
| `Space` | Toggle Checkbox/Switch |
| `↑` / `↓` | Navigate Lists |

---

\n\n## 📐 Design Tokens
\n\n
\n\n### Typography Scale
\n\n```
\n\nHero:    text-5xl  (48px)  font-bold
H1:      text-4xl  (36px)  font-bold
H2:      text-3xl  (30px)  font-semibold
H3:      text-2xl  (24px)  font-semibold
H4:      text-xl   (20px)  font-medium
Body:    text-base (16px)  font-normal
Small:   text-sm   (14px)  font-normal
Tiny:    text-xs   (12px)  font-normal
\n\n```

\n\n### Spacing Scale
\n\n```
\n\nxs:  4px   (0.25rem)
sm:  8px   (0.5rem)
md:  16px  (1rem)
lg:  24px  (1.5rem)
xl:  32px  (2rem)
2xl: 48px  (3rem)
3xl: 64px  (4rem)
\n\n```

\n\n### Border Radius
\n\n```
\n\nsm:  4px   (0.25rem)
md:  6px   (0.375rem)
lg:  8px   (0.5rem)
xl:  12px  (0.75rem)
2xl: 16px  (1rem)
\n\n```

\n\n### Shadows
\n\n```
\n\nsm:   0 1px 2px rgba(0,0,0,0.05)
base: 0 1px 3px rgba(0,0,0,0.1)
md:   0 4px 6px rgba(0,0,0,0.1)
lg:   0 10px 15px rgba(0,0,0,0.1)
xl:   0 20px 25px rgba(0,0,0,0.1)
2xl:  0 25px 50px rgba(0,0,0,0.25)
\n\n```

---

\n\n## 📱 Responsive Breakpoints
\n\n
\n\n```css
\n\n/* Mobile First Approach */
\n\nsm:  640px   /* Small tablets, large phones */
\n\nmd:  768px   /* Tablets */
\n\nlg:  1024px  /* Laptops, desktop */
\n\nxl:  1280px  /* Large desktops */
\n\n2xl: 1536px  /* Extra large screens */
\n\n```

**Mobile Strategy:**
\n\n- Hamburger menu (< lg)
\n\n- Stacked layouts
\n\n- Touch-friendly targets (min 44px)
\n\n- Simplified tables → card view
\n\n
---

\n\n## 🎭 Animations
\n\n
\n\n### Transition Timing
\n\n```css
--transition-fast: 150ms
--transition-base: 300ms
--transition-slow: 500ms
\n\n```

\n\n### Standard Animations
\n\n- `fadeIn`: Opacity 0 → 1
\n\n- `slideUp`: TranslateY(20px) → 0
\n\n- `shimmer`: Skeleton loading effect
\n\n- `pulse`: Gentle glow effect
\n\n- `spin`: Loading spinner
\n\n- `scale`: Hover scale 1.0 → 1.02
\n\n
---

\n\n## 🔍 Search System
\n\n
\n\n**Global Search:** `Ctrl + K`
\n\n
**Searches:**
\n\n- Customers (name, email, phone)
\n\n- Leads (name, company, task)
\n\n- Bookings (customer, date, service)
\n\n- Quotes (number, customer, amount)
\n\n- Pages (all routes)
\n\n- Actions (quick create)
\n\n
**Features:**
\n\n- Fuzzy matching
\n\n- Keyboard navigation
\n\n- Recent searches
\n\n- Max 50 results/category
\n\n- 300ms debounce
\n\n
---

\n\n## ♿ Accessibility
\n\n
\n\n**WCAG 2.1 AA Compliant**

✅ Semantic HTML  
✅ ARIA labels  
✅ Keyboard navigation  
✅ Focus indicators  
✅ Color contrast  
✅ Screen reader compatible  

⚠️ Missing:
\n\n- Skip-to-content link
\n\n- Some modals lack aria-describedby
\n\n- Not fully tested with NVDA/JAWS
\n\n
---

\n\n## 📊 Performance Metrics
\n\n
\n\n**Bundle Size:**
\n\n```
Total:  823.65 kB (gzip: 228.94 kB)
Vendor: 141.41 kB
Index:  823.65 kB
\n\n```

**Optimizations:**
\n\n- ✅ Code splitting
\n\n- ✅ Lazy loading pages
\n\n- ✅ Tree-shaken icons
\n\n- ✅ Optimized images (WebP)
\n\n- ✅ Service Worker (PWA)
\n\n- ✅ 300ms debounce search
\n\n- ✅ Skeleton loaders (no blank pages)
\n\n
**Target:** < 250 kB gzipped (current: 228.94 kB) ✅
\n\n
---

\n\n## 🌓 Dark Mode
\n\n
\n\n**Implementation:** CSS variables + `dark:` prefix  
**Trigger:** System preference (automatic)  
**Coverage:** 100% of components  
\n\n
⚠️ **Missing:** Manual toggle in UI
\n\n
---

\n\n## 🚀 Quick Start Commands
\n\n
\n\n```powershell
\n\n# Frontend only
\n\nnpm run dev:client
\n\n
\n\n# Backend only
\n\nnpm run dev
\n\n
\n\n# Both (recommended)
\n\nnpm run dev:all
\n\n
\n\n# Build for production
\n\nnpm run build
\n\n
\n\n# Preview production build
\n\nnpm run preview
\n\n```
\n\n
---

\n\n## 📦 Core Dependencies
\n\n
\n\n```json
\n\n{
  "react": "^18.3.1",
  "typescript": "^5.5.3",
  "vite": "^5.4.20",
  "tailwindcss": "^4.0.0",
  "@clerk/clerk-react": "^5.19.2",
  "lucide-react": "^0.468.0",
  "recharts": "^2.15.0",
  "sonner": "^1.7.1",
  "react-markdown": "^9.0.1"
}
\n\n```

---

\n\n## ✅ Visual Audit Checklist
\n\n
\n\nBefore deploying visual changes:

\n\n- [ ] Responsive (320px → 2560px)
\n\n- [ ] Dark mode works
\n\n- [ ] Loading states everywhere
\n\n- [ ] Error states with messages
\n\n- [ ] Empty states with CTA
\n\n- [ ] Focus visible on interactive elements
\n\n- [ ] Color contrast WCAG AA
\n\n- [ ] Touch targets min 44x44px
\n\n- [ ] Animations < 200ms
\n\n- [ ] Consistent spacing
\n\n- [ ] Icons from Lucide only
\n\n- [ ] Forms have validation
\n\n- [ ] Modals trap focus
\n\n- [ ] Keyboard shortcuts work
\n\n
---

\n\n## 🎯 Component Usage Examples
\n\n
\n\n### Button Variants
\n\n```tsx
\n\n<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
\n\n```

\n\n### Card Structure
\n\n```tsx
\n\n<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
\n\n```

\n\n### Toast Notifications
\n\n```tsx
\n\nimport { useToast } from '@/hooks/use-toast';

const { toast } = useToast();

toast({
  title: "Success",
  description: "Data saved successfully",
  variant: "success"
});
\n\n```

\n\n### Empty State
\n\n```tsx
\n\n<EmptyState
  icon={<Target className="w-12 h-12" />}
  title="Ingen leads fundet"
  description="Kom i gang ved at oprette dit første lead"
  action={<Button>Opret Lead</Button>}
/>
\n\n```

---

\n\n## 🎨 Visual Best Practices
\n\n
\n\n1. **Always use design tokens** (not hardcoded values)
\n\n2. **Mobile-first** responsive design
\n\n3. **Loading states** for all async operations
\n\n4. **Empty states** with actionable CTAs
\n\n5. **Error states** with clear messages
\n\n6. **Focus management** in modals
\n\n7. **ARIA labels** on interactive elements
\n\n8. **Consistent spacing** using Tailwind utilities
\n\n9. **Icons from Lucide** only (no mixing)
\n\n10. **Test on actual devices** not just browser resize
\n\n
---

\n\n## 📞 Support
\n\n
\n\nFor visual/UI questions:
\n\n- See full report: `docs/VISUAL_ANALYSIS_REPORT.md`
\n\n- Component docs: `client/src/components/ui/`
\n\n- Design tokens: `client/src/App.css`
\n\n
---

_Last Updated: 3. Oktober 2025_  
_Version: 1.0_
