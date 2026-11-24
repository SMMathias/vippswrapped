# Vipps Wrapped

> **Studieprojekt** på Multimediedesign, Erhvervsakademi Aarhus (EAAA), faget Dynamic User Interface, efterår 2026.
> Projektet har ingen tilknytning til Vipps MobilePay. Navne, farver og logoer bruges kun til undervisning.

**Live:** TBD (Vercel, deployet fra `main`)
**Figma:** https://www.figma.com/design/HbzpQnDgK28OY4Jvqqwaed/Vipps-wrapped
**Lavet af:** Mathias og Magnus

## Hvad er det?

Et redesign af "del regningen"-grupper i MobilePay (Vipps). Kerneflowet er: **tilføj udgift → hvem skylder hvem → gør op**.

Den røde tråd:

> Turens Wrapped er låst, til alle har betalt, så det mindeværdige bliver en grund til at gøre op, uden at gruppen mister overblikket over, hvem der skylder hvem.

- **Bordet:** hver udgift lander som et 3D-objekt på turens bord.
- **Banner og Ryk:** viser fra start, at Wrapped venter, og hvem gruppen venter på.
- **Wrapped:** en swipe-historie med højdepunkter og en rolle til hver person. Den åbner først, når alle har betalt.
- **Lyd og haptik:** et blødt bump, når en udgift lander, og et let tik, når din betaling går igennem. Kan slås fra med "Lyd"-knappen, og er altid fra ved reduceret bevægelse. Teksten på skærmen bærer altid informationen.

Der er én demo-tur ("Weekend i Berlin") og intet login. "Demo-styring" nederst på siderne lader de andre betale og nulstiller turen.

## Teknik

- Next.js 16 (App Router), React 19, CSS modules
- Supabase (Postgres) som datakilde. Kun den publishable key bruges i klienten, RLS er slået til, og alle ændringer går gennem RPC-funktioner.
- Design tokens i `app/tokens.css` har samme navne som variablerne i Figma (Figma `/` = CSS `-`).
- Lydene laves i koden med Web Audio API (`lib/feedback.js`). Der er ingen lydfiler.

| Mappe | Indhold |
|---|---|
| `app/` | Siderne: `/` (gruppen), `/tilfoej`, `/status`, `/wrapped` |
| `components/` | Fælles komponenter (top-bar, banner, lyd-knap, tilstande …) |
| `lib/` | Regler og hjælpere: fordeling, roller og highlights, kategorier, lyd og haptik |
| `public/3d/` | 3D-objekterne som PNG |

## Kør projektet lokalt

Kræver Node.js 20 eller nyere.

```bash
npm install
cp .env.example .env.local   # udfyld de to værdier fra Supabase
npm run dev
```

Åbn http://localhost:3000.

### Miljøvariabler

| Navn | Hvor findes den |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API Keys → publishable key |

Begge er offentlige (de ender i browseren). Service role-nøglen må aldrig ligge i repoet eller på Vercel.

## Deploy

Vercel bygger automatisk fra `main`. De samme to miljøvariabler er sat under Project → Settings → Environment Variables.

## Arbejdsgang

Hver ændring laves på sin egen branch og merges til `main` via en pull request, som den anden i gruppen reviewer. `main` er afleveringen og ændres ikke efter afleveringsfristen.
