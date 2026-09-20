# Smomo × Classical — drop-in restyle

Four files. Copy them into `apps/web`, overwriting the originals:

| From | To |
| --- | --- |
| `globals.css` | `src/app/globals.css` |
| `ui.tsx` | `src/components/ui.tsx` |
| `layout.tsx` | `src/app/layout.tsx` |
| `page.tsx` | `src/app/page.tsx` |

No new dependencies. Fonts load through `next/font/google` (Cormorant Garamond + Lora), so nothing to install.

## What changes

- **Type.** Cormorant Garamond headings over Lora body, replacing the system sans. Bold is out — headings cap at semibold and display sizes set lighter. Figures set tabular via `.tnum`.
- **Colour.** Same Smomo palette (#6D28D9 deep violet, #EDE9FE soft lilac) with a full 100–900 violet ramp added, and rose gold #D4AF7C demoted to stroke-and-stars only. The old `--color-accent` pink (#db2777) is gone; if a page used it, it now reads rose gold.
- **Surfaces.** Buttons are outlined, not filled. Radius drops from 16px to 4px. Cards stay bordered and unfilled, elevation is a whisper.
- **Structure.** Hairline rules carry the sections. New `<Hairline>`, `<Kicker>` and `<Plate>` primitives, plus a `.plate` class for photographs.
- **Brand.** Emoji removed. The header, footer and hero use `/assets/Smomo_logo_light.png` and `Smomo_logo_dark.png` — already in your `public/assets`.

Token *names* are unchanged (`bg-card`, `text-text-muted`, `border-border`, `bg-primary-soft`…), so every page that wasn't touched keeps compiling and picks up the new look automatically.

## Caveats

- `assets/Smomo_logo_light.png` in this folder is your light logo with the near-white ground keyed out to transparency and the "LIGHT VARIANT" caption trimmed. Copy it over `public/assets/Smomo_logo_light.png` — the original is opaque and shows as a pale rectangle on white.
- `next/image` needs the `sizes`/`priority` treatment you prefer; I used `priority` on above-the-fold marks only.
- Pages still carrying emoji (`CATEGORY_EMOJI` in `lib/catalog.ts`, discover and how-it-works) will look off-system until those are dropped. Say the word and I'll do the rest of the pages the same way.
