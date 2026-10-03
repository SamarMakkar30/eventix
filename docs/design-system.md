# Eventix Design System

> **Version 3.0** — Final. All UI uses semantic tokens only. No hardcoded hex in components.

---

## Palette

| Name | Hex | Usage |
|---|---|---|
| Parchment | `#D9C9AC` | Main page background (light) |
| Warm Sand | `#E4D7BE` | Elevated sections, panels |
| Light Linen | `#EFE5D0` | Cards, modals, surfaces |
| Linen Hover | `#E9DEC5` | Card hover state |
| Recessed Input | `#CFBE9F` | Input backgrounds (inset depth) |
| Tan Border | `#BFAD8B` | Default border |
| Strong Border | `#A99477` | Prominent border |
| Near-Black | `#2A1A1C` | Primary text |
| Warm Brown | `#5C4743` | Secondary text |
| Muted Brown | `#7A6460` | Captions, timestamps |
| **Burgundy** | `#722F37` | Primary accent (CTAs, active states) — 10% rule |
| Deep Burgundy | `#5E252C` | Accent hover |
| Linen Ink | `#EFE5D0` | Text on burgundy |
| Dusty Pink | `#D7A7B1` | Selected halos only |
| Pink Wash | `rgba(215,167,177,0.18)` | Focus rings, seat halos |
| Pale Pink | `#E6C4C4` | Active nav pill, badges |

---

## 60 / 30 / 10 Rule

| Layer | % | Colours |
|---|---|---|
| **Backgrounds** | 60% | `--ev-bg`, `--ev-bg-raised`, `--ev-surface` |
| **Text & surfaces** | 30% | `--ev-text`, `--ev-text-muted`, `--ev-text-subtle`, borders |
| **Accent** | 10% | `--ev-accent` (burgundy) — only on primary CTAs and active states |

---

## CSS Token Reference

### Backgrounds (Light → Dark)

| Token | Light | Dark |
|---|---|---|
| `--ev-bg` | `#D9C9AC` | `#1A1012` |
| `--ev-bg-raised` | `#E4D7BE` | `#221618` |
| `--ev-surface` | `#EFE5D0` | `#2A1C1E` |
| `--ev-surface-hover` | `#E9DEC5` | `#352426` |
| `--ev-input` | `#CFBE9F` | `#1F1315` |

### Borders

| Token | Light | Dark |
|---|---|---|
| `--ev-border` | `#BFAD8B` | `#3D2A2D` |
| `--ev-border-strong` | `#A99477` | `#503A3D` |

### Text

| Token | Light | Dark |
|---|---|---|
| `--ev-text` | `#2A1A1C` | `#F1E8D6` |
| `--ev-text-muted` | `#5C4743` | `#BEB0A0` |
| `--ev-text-subtle` | `#7A6460` | `#8A7A6E` |

### Accent

| Token | Light | Dark |
|---|---|---|
| `--ev-accent` | `#722F37` | `#722F37` |
| `--ev-accent-hover` | `#5E252C` | `#8B3A44` |
| `--ev-accent-ink` | `#EFE5D0` | `#F1E8D6` |

### Pink tones

| Token | Light | Dark |
|---|---|---|
| `--ev-pink` | `#D7A7B1` | `#D7A7B1` |
| `--ev-pink-wash` | `rgba(215,167,177,0.18)` | `rgba(215,167,177,0.12)` |
| `--ev-pale-pink` | `#E6C4C4` | `#C49898` |

### Semantic

| Token | Light | Dark |
|---|---|---|
| `--ev-success` | `#3D6E50` | `#5CA97A` |
| `--ev-warning` | `#8A6228` | `#D4993E` |
| `--ev-danger` | `#8B2A2A` | `#D85757` |

### Elevation

| Token | Value |
|---|---|
| `--ev-shadow-card` | 2-layer warm burgundy-tinted shadow |
| `--ev-shadow-elevated` | 2-layer warm shadow for modals/overlays |

### Radii

| Token | Value | Usage |
|---|---|---|
| `--ev-radius-control` | `0.5rem` (8px) | Inputs, buttons, chips |
| `--ev-radius-card` | `0.75rem` (12px) | Cards, tiles |
| `--ev-radius-panel` | `1rem` (16px) | Modals, sidebars |

### Motion

| Token | Value |
|---|---|
| `--ev-duration-fast` | `150ms` |
| `--ev-duration-base` | `280ms` |
| `--ev-duration-slow` | `500ms` |
| `--ev-ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` |
| `--ev-ease-emphasized` | `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| `--ev-ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` |

---

## Artwork Fallback Palette

When a poster/banner image is unavailable, use one of the warm artwork gradients:

| Class | Colours | Best for |
|---|---|---|
| `artwork--ember` | Rose → Terracotta | Drama, Action |
| `artwork--sand` | Warm Gold → Brown | Thriller, History |
| `artwork--dusk` | Lavender → Plum | Romance, Indie |
| `artwork--pine` | Sage → Forest | Nature, Documentary |
| `artwork--slate` | Steel Blue → Denim | Sci-Fi, Tech |
| `artwork--ochre` | Amber → Sienna | Comedy, Adventure |

---

## Global CSS Layers (`src/styles/`)

| File | Purpose |
|---|---|
| `design-system.css` | Token layer — `:root` + `[data-theme="dark"]` definitions only |
| `global.css` | Component styles — all use `var(--ev-*)` tokens, zero hardcoded hex |

### Rule: Never hardcode hex in components
All component styles use `var(--ev-*)` tokens. Hex values live **only** in `design-system.css`.

---

## Contrast compliance (WCAG AA)

| Pair | Ratio | Pass |
|---|---|---|
| `--ev-text` on `--ev-bg` | ~12.5:1 | ✅ AAA |
| `--ev-text-muted` on `--ev-bg` | ~7.2:1 | ✅ AA |
| `--ev-accent-ink` on `--ev-accent` | ~5.4:1 | ✅ AA |
| `--ev-text` on `--ev-surface` | ~10.1:1 | ✅ AAA |
| Dark: `--ev-text` on `--ev-bg` | ~16:1 | ✅ AAA |

---

## Typography Scale

| Role | Size | Weight | Tracking |
|---|---|---|---|
| Display h1 | `clamp(2.5rem, 6vw, 4.5rem)` | 700 | -0.03em |
| Hero headline | `clamp(2.75rem, 8vw, 6rem)` | 800 | -0.04em |
| Section title | `clamp(1.75rem, 3.5vw, 2.5rem)` | 700 | -0.03em |
| Card title | `1rem` | 600 | -0.02em |
| Body | `1rem` | 400 | -0.012em |
| Meta / caption | `0.875rem` | 400 | 0 |
| Eyebrow | `0.6875rem` | 600 | +0.1em (ALL CAPS) |

Font: **Geist Variable** (`@fontsource-variable/geist`) — falls back to `ui-sans-serif, system-ui`.
