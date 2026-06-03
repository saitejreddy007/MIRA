# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** MIRA (A WhiteMirror product)
**Generated:** 2026-06-02
**Updated:** 2026-06-02 (iOS 26 squircle + WhiteMirror brand)
**Category:** Micro SaaS

---

## Brand Hierarchy

- **WhiteMirror** is the parent company.
- **MIRA** is the product.
- The product wordmark stays as "MIRA" with "AI Representative" tagline.
- Footer / attribution text reads: "A WhiteMirror product" (uppercase, 10px, letter-spaced, muted).
- WhiteMirror wordmark or mark appears in canonical surfaces (auth footer, login/signup, settings footer, marketing pages).

---

## Global Rules

### Color Palette (MIRA Brand — Glass Edition)

| Role | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Brand Green (Primary CTA) | `#22C55E` | `--brand-500` | Primary actions, success, WhatsApp accent |
| Brand Green Deep | `#15803D` | `--brand-700` | Hover, active states |
| Brand Green Soft | `#86EFAC` | `--brand-300` | Soft accents, glows |
| Brand Green Wash | `#DCFCE7` | `--brand-50` | Background tints |
| Glass White (Light) | `rgba(255,255,255,0.65)` | `--glass-light` | Glass card surface |
| Glass Border (Light) | `rgba(255,255,255,0.85)` | `--glass-border-light` | Glass edges |
| Glass Tint (Light) | `rgba(255,255,255,0.45)` | `--glass-tint-light` | Inner highlights |
| Glass White (Dark) | `rgba(20,24,32,0.55)` | `--glass-dark` | Glass card surface dark |
| Glass Border (Dark) | `rgba(255,255,255,0.08)` | `--glass-border-dark` | Glass edges dark |
| Surface (Light) | `#FAFAF7` | `--surface` | Page background |
| Surface Elevated | `#FFFFFF` | `--surface-elevated` | Cards |
| Surface Muted | `#F1F2EE` | `--surface-muted` | Subtle BG |
| Text Primary | `#0B1220` | `--text-primary` | Headlines |
| Text Secondary | `#475569` | `--text-secondary` | Body |
| Text Muted | `#94A3B8` | `--text-muted` | Hints |
| Aurora Purple | `#A855F7` | `--aurora-purple` | Aurora gradient |
| Aurora Cyan | `#22D3EE` | `--aurora-cyan` | Aurora gradient |
| Aurora Blue | `#60A5FA` | `--aurora-blue` | Aurora gradient |
| Aurora Pink | `#F472B6` | `--aurora-pink` | Aurora gradient |
| Border Subtle | `rgba(15,23,42,0.06)` | `--border-subtle` | Hairlines |
| Border Default | `rgba(15,23,42,0.10)` | `--border-default` | Inputs |
| Danger | `#EF4444` | `--danger` | Errors, overdue |
| Warning | `#F59E0B` | `--warning` | Attention |
| Success | `#22C55E` | `--success` | Recovered |

**Color Notes:** Light surface (#FAFAF7 — warm off-white) with MIRA green CTA. Aurora gradients (purple/cyan/blue/pink) appear as ambient background orbs, behind frosted glass cards. All glass uses backdrop-blur (16-24px) with saturate(180%) and a 1px inner border for that iOS 26 / Vision Pro spec highlight.

### Typography

- **Heading Font:** Plus Jakarta Sans (display) — modern, friendly, premium
- **Body Font:** Inter (UI) — excellent readability at small sizes
- **Mono Font:** JetBrains Mono — code, IDs, numeric data
- **Mood:** friendly, modern, saas, clean, approachable, professional
- **Google Fonts:** [Plus Jakarta Sans + Inter](https://fonts.google.com/share?selection.family=Inter:wght@300;400;500;600;700|Plus+Jakarta+Sans:wght@300;400;500;600;700;800|JetBrains+Mono:wght@400;500)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
```

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

### Buttons

```css
/* Primary Button — MIRA Green */
.btn-primary {
  background: linear-gradient(180deg, #22C55E 0%, #16A34A 100%);
  color: white;
  padding: 10px 18px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 1px 0 rgba(255,255,255,0.4) inset,
              0 8px 24px -8px rgba(34,197,94,0.45),
              0 1px 2px rgba(0,0,0,0.05);
  transition: all 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
}
.btn-primary:hover { transform: translateY(-1px); box-shadow: 0 1px 0 rgba(255,255,255,0.4) inset, 0 12px 32px -8px rgba(34,197,94,0.55), 0 2px 4px rgba(0,0,0,0.05); }
.btn-primary:active { transform: scale(0.98); }

/* Glass Secondary */
.btn-glass {
  background: rgba(255,255,255,0.65);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.85);
  box-shadow: 0 1px 0 rgba(255,255,255,0.7) inset, 0 1px 2px rgba(15,23,42,0.05);
  color: #0B1220;
  padding: 10px 18px;
  border-radius: 12px;
  font-weight: 500;
  transition: all 200ms ease;
  cursor: pointer;
}
.btn-glass:hover { background: rgba(255,255,255,0.85); transform: translateY(-1px); }
```

### Cards (Glass)

```css
.glass-card {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: 20px;
  box-shadow:
    0 1px 0 rgba(255,255,255,0.7) inset,
    0 8px 32px -8px rgba(15,23,42,0.08),
    0 2px 6px rgba(15,23,42,0.04);
  padding: 24px;
  transition: all 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.glass-card:hover { transform: translateY(-2px); box-shadow: 0 1px 0 rgba(255,255,255,0.7) inset, 0 16px 48px -12px rgba(15,23,42,0.12), 0 4px 8px rgba(15,23,42,0.06); }
```

### Inputs

```css
.input {
  padding: 10px 14px;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(15,23,42,0.10);
  border-radius: 12px;
  font-size: 14px;
  color: #0B1220;
  transition: all 200ms ease;
}
.input:focus {
  border-color: #22C55E;
  outline: none;
  box-shadow: 0 0 0 4px rgba(34,197,94,0.15);
  background: rgba(255,255,255,0.95);
}
```

### Modals

```css
.modal-overlay {
  background: rgba(11, 18, 32, 0.45);
  backdrop-filter: blur(8px);
}
.modal {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(24px) saturate(200%);
  border: 1px solid rgba(255,255,255,0.9);
  border-radius: 24px;
  padding: 28px;
  box-shadow: 0 32px 80px -16px rgba(15,23,42,0.25);
  max-width: 520px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Liquid Glass (iOS 26 / Vision Pro)

**Keywords:** Frosted glass, backdrop-blur, multi-layer depth, aurora gradients, fluid morphing, subtle spec highlights, soft inner glow, spring transitions

**Best For:** Premium SaaS dashboards, AI products, modern B2B tools, fintech, productivity

**Key Effects:**
- Aurora orb background (slow drift, low opacity)
- backdrop-filter: blur(20px) saturate(180%) on all surfaces
- 1px inset highlight (rgba(255,255,255,0.6) on top edge) for spec
- Multi-layer shadows (soft diffuse + tight contact)
- Spring/elastic transitions (300-500ms cubic-bezier(0.34, 1.56, 0.64, 1))
- Hover: subtle lift (-2px) + glow halo + 1.01 scale
- Active: scale(0.98) snap back
- 16-20px border-radius on cards, 12px on buttons, 8px on inputs
- Tabular numerals for metrics (font-feature-settings: "tnum")

### Page Pattern

**Pattern Name:** Bento Dashboard + Aurora Shell

- **Hero / Above-fold:** Aurora gradient orbs (4 colored blurred divs) behind glass header
- **Section Order:** 1. Glass sidebar (fixed), 2. Top bar (glass blur), 3. Page title + breadcrumbs, 4. Bento grid of metrics (4 cols), 5. Two-column content (lists + activity), 6. Empty states with illustration
- **CTA Placement:** Inline in cards; primary action button is glass-green
- **Bento Card Hover:** Lift + glow + 1.01 scale
- **Empty States:** Centered illustration + CTA pair

### Surface System (3 levels)

1. **Surface 0 (Base)**: Page background with aurora orbs
2. **Surface 1 (Glass)**: backdrop-blur(20px), 65% white opacity, 1px border, soft shadow
3. **Surface 2 (Elevated)**: 90% white opacity, deeper shadow, used for modals/popovers

---

## Anti-Patterns (Do NOT Use)

- ❌ Complex onboarding flow
- ❌ Cluttered layout

### Additional Forbidden Patterns
- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y
- ❌ **Sharp corners** — Use the `squircle-*` utilities or rely on the global `[class*="rounded"]` squircle auto-apply
- ❌ **Hard-coded `mira-*` color tokens in new code** — Use `bg-background`, `text-foreground`, `bg-primary` etc. The `mira-*` palette is deprecated.

---

## Squircle System (iOS 26 / Vision Pro)

All corners are squircle (super-elliptical), not just rounded. Three ways to apply:

1. **Auto-applied** — Any Tailwind `rounded-*` utility automatically gets `corner-shape: superellipse(1.5)` via a base rule in `globals.css`. No code change needed.
2. **Explicit `squircle` utilities** — `.squircle` (20px), `.squircle-xs` (10px), `.squircle-sm` (14px), `.squircle-md` (20px), `.squircle-lg` (28px), `.squircle-xl` (36px), `.squircle-2xl` (48px), `.squircle-full` (9999px).
3. **Component class** — `.glass-card`, `.btn-*`, `.input`, `.card`, `.badge`, `.nav-link` all have squircle built in.

| Surface | Token | Example |
|---------|-------|---------|
| Card | `.glass-card` (squircle-lg = 28px) | `glass-card p-6` |
| Modal/Dialog | `.squircle-xl` (36px) | `rounded-3xl p-8` |
| Button | `.btn-primary` (squircle = 20px) | `btn-primary` |
| Input | `.input` (squircle-sm = 14px) | `input pl-10` |
| Badge | `.badge` (squircle-xs = 10px) | `badge badge-success` |
| Pill (dot, full) | `.squircle-full` | `h-1.5 w-1.5 squircle-full` |

Progressive enhancement: `corner-shape` is supported in Chrome 144+ and Safari 18+. Older browsers get a clean large `border-radius` fallback (no broken corners).

---

## Pre-Delivery Checklist
- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
- [ ] All corners use `squircle-*` or `rounded-*` (no `rounded-none`, no `border-radius: 0`)
- [ ] WhiteMirror attribution visible on auth/marketing surfaces
